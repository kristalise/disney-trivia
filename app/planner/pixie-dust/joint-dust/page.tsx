'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import DeliveryRoute from '@/components/DeliveryRoute';
import { getDeck, getSide } from '@/lib/stateroom-utils';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OfflineBanner from '@/components/OfflineBanner';
import { cacheData, getCachedData, queueMutation, getPendingMutationCount } from '@/lib/offline-store';

const GIFT_PALETTE = [
  '#8B5CF6', // violet
  '#0EA5E9', // sky blue
  '#F97316', // orange
  '#10B981', // emerald
  '#EC4899', // pink
  '#EAB308', // yellow
  '#06B6D4', // cyan
  '#E11D48', // rose
  '#6366F1', // indigo
  '#84CC16', // lime
];

interface GiftInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface GiftRecipient {
  recipientId: string;
  giftId: string;
  delivered: boolean;
  recipient_name: string | null;
  notes: string | null;
}

interface RoomEntry {
  stateroom: number;
  gifts: GiftRecipient[];
  displayName: string | null;
  displayNotes: string | null;
}

interface RouteStop {
  stateroom: number;
  deck: number;
  side?: 'port' | 'starboard';
  direction?: 'forward' | 'aft';
}

export default function JointDustPage() {
  return (
    <Suspense>
      <JointDustContent />
    </Suspense>
  );
}

function JointDustContent() {
  const searchParams = useSearchParams();
  const sailingId = searchParams.get('sailing');
  const { session } = useAuth();

  const [gifts, setGifts] = useState<GiftInfo[]>([]);
  const [rooms, setRooms] = useState<Map<number, GiftRecipient[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterDeck, setFilterDeck] = useState<number | null>(null);

  const isOnline = useOnlineStatus();
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);

  // Route
  const [route, setRoute] = useState<RouteStop[] | null>(null);
  const [startRoom, setStartRoom] = useState<number>(0);
  const [optimizing, setOptimizing] = useState(false);

  // Inline editing
  const [editingField, setEditingField] = useState<{ stateroom: number; field: 'recipient_name' | 'notes' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingRoom, setSavingRoom] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const authHeaders = useCallback(() => ({
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const fetchAll = useCallback(async () => {
    if (!session?.access_token || !sailingId) return;
    setLoading(true);
    try {
      // 1. Fetch all gifts for this sailing
      const giftsRes = await fetch(`/api/pixie-gifts?sailing_id=${sailingId}`, {
        headers: authHeaders(),
      });
      if (!giftsRes.ok) return;
      const giftsData = await giftsRes.json();
      const giftList: GiftInfo[] = (giftsData.gifts ?? []).map((g: { id: string; name: string; emoji: string; color: string }) => ({
        id: g.id, name: g.name, emoji: g.emoji, color: g.color,
      }));
      setGifts(giftList);

      if (giftList.length === 0) return;

      // 2. Fetch recipients for each gift in parallel
      const recipientResults = await Promise.all(
        giftList.map(async (g) => {
          const res = await fetch(`/api/pixie-gifts/recipients?gift_id=${g.id}`, {
            headers: authHeaders(),
          });
          if (!res.ok) return { giftId: g.id, recipients: [] };
          const data = await res.json();
          return {
            giftId: g.id,
            recipients: (data.recipients ?? []) as { id: string; stateroom_number: number; delivered: boolean; recipient_name: string | null; notes: string | null }[],
          };
        })
      );

      // 3. Build merged room map
      const roomMap = new Map<number, GiftRecipient[]>();
      for (const result of recipientResults) {
        for (const r of result.recipients) {
          const existing = roomMap.get(r.stateroom_number) ?? [];
          existing.push({
            recipientId: r.id,
            giftId: result.giftId,
            delivered: r.delivered,
            recipient_name: r.recipient_name ?? null,
            notes: r.notes ?? null,
          });
          roomMap.set(r.stateroom_number, existing);
        }
      }
      setRooms(roomMap);

      // Cache data for offline use
      const cachePayload = {
        gifts: giftList,
        rooms: Array.from(roomMap.entries()),
      };
      cacheData(`joint-dust:${sailingId}`, cachePayload).catch(() => {});
    } catch {
      // Fallback to cached data when offline/error
      try {
        const cached = await getCachedData(`joint-dust:${sailingId}`);
        if (cached) {
          const d = cached.data as { gifts?: GiftInfo[]; rooms?: [number, GiftRecipient[]][] };
          setGifts(d.gifts ?? []);
          setRooms(new Map(d.rooms ?? []));
        }
      } catch { /* ignore cache miss */ }
    } finally { setLoading(false); }
  }, [session?.access_token, sailingId, authHeaders]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateRoomsOptimistically = (recipientId: string, stateroom: number, newDelivered: boolean) => {
    setRooms(prev => {
      const next = new Map(prev);
      const roomGifts = [...(next.get(stateroom) ?? [])];
      const idx = roomGifts.findIndex(g => g.recipientId === recipientId);
      if (idx !== -1) {
        roomGifts[idx] = { ...roomGifts[idx], delivered: newDelivered };
        next.set(stateroom, roomGifts);
      }
      return next;
    });
  };

  const handleToggleDelivery = async (recipientId: string, giftId: string, stateroom: number, currentDelivered: boolean) => {
    const newValue = !currentDelivered;
    setTogglingId(recipientId);

    if (!isOnline) {
      // Queue mutation for when back online
      await queueMutation({ type: 'pixie-delivery', url: '/api/pixie-gifts/recipients', method: 'PATCH', body: { id: recipientId, delivered: newValue } });
      updateRoomsOptimistically(recipientId, stateroom, newValue);
      getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
      setTogglingId(null);
      return;
    }

    try {
      const res = await fetch('/api/pixie-gifts/recipients', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ id: recipientId, delivered: newValue }),
      });
      if (res.ok) {
        updateRoomsOptimistically(recipientId, stateroom, newValue);
      }
    } catch {
      // Network error — queue for later
      await queueMutation({ type: 'pixie-delivery', url: '/api/pixie-gifts/recipients', method: 'PATCH', body: { id: recipientId, delivered: newValue } });
      updateRoomsOptimistically(recipientId, stateroom, newValue);
      getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
    } finally { setTogglingId(null); }
  };

  const updateRoomFieldOptimistically = (stateroom: number, field: 'recipient_name' | 'notes', value: string) => {
    setRooms(prev => {
      const next = new Map(prev);
      const updated = (next.get(stateroom) ?? []).map(gr => ({ ...gr, [field]: value || null }));
      next.set(stateroom, updated);
      return next;
    });
  };

  const handleSaveField = async (stateroom: number, field: 'recipient_name' | 'notes', value: string) => {
    // Update all recipients for this room
    const roomGifts = rooms.get(stateroom);
    if (!roomGifts) return;
    setSavingRoom(stateroom);

    if (!isOnline) {
      // Queue each recipient update for when back online
      for (const gr of roomGifts) {
        await queueMutation({ type: 'pixie-delivery', url: '/api/pixie-gifts/recipients', method: 'PATCH', body: { id: gr.recipientId, [field]: value || null } });
      }
      updateRoomFieldOptimistically(stateroom, field, value);
      getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
      setSavingRoom(null);
      setEditingField(null);
      return;
    }

    try {
      // Update all recipients for this stateroom in parallel
      await Promise.all(roomGifts.map(gr =>
        fetch('/api/pixie-gifts/recipients', {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ id: gr.recipientId, [field]: value || null }),
        })
      ));
      // Update local state
      updateRoomFieldOptimistically(stateroom, field, value);
    } catch {
      // Network error — queue for later
      for (const gr of roomGifts) {
        await queueMutation({ type: 'pixie-delivery', url: '/api/pixie-gifts/recipients', method: 'PATCH', body: { id: gr.recipientId, [field]: value || null } });
      }
      updateRoomFieldOptimistically(stateroom, field, value);
      getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
    } finally {
      setSavingRoom(null);
      setEditingField(null);
    }
  };

  const startEditing = (stateroom: number, field: 'recipient_name' | 'notes', currentValue: string | null) => {
    setEditingField({ stateroom, field });
    setEditValue(currentValue ?? '');
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    if (!editingField) return;
    const roomGifts = rooms.get(editingField.stateroom);
    const currentValue = roomGifts?.[0]?.[editingField.field] ?? '';
    if (editValue !== (currentValue ?? '')) {
      handleSaveField(editingField.stateroom, editingField.field, editValue);
    } else {
      setEditingField(null);
    }
  };

  const handleOptimizeRoute = async () => {
    // Union of all undelivered rooms across all gifts
    const undelivered = new Set<number>();
    for (const [stateroom, giftRecipients] of rooms) {
      if (giftRecipients.some(g => !g.delivered)) {
        undelivered.add(stateroom);
      }
    }
    if (undelivered.size === 0 || !startRoom) return;
    setOptimizing(true);
    try {
      const res = await fetch('/api/pixie-dust/route-optimizer', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ start_stateroom: startRoom, target_staterooms: Array.from(undelivered) }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoute(data.route);
      }
    } catch { /* ignore */ } finally { setOptimizing(false); }
  };

  // Assign distinct colors to each gift by index
  const giftColorMap = new Map<string, string>();
  gifts.forEach((g, i) => giftColorMap.set(g.id, GIFT_PALETTE[i % GIFT_PALETTE.length]));

  // Build sorted room entries — use first non-null name/notes across gifts for display
  const roomEntries: RoomEntry[] = Array.from(rooms.entries())
    .map(([stateroom, giftRecipients]) => ({
      stateroom,
      gifts: giftRecipients,
      displayName: giftRecipients.find(g => g.recipient_name)?.recipient_name ?? null,
      displayNotes: giftRecipients.find(g => g.notes)?.notes ?? null,
    }))
    .sort((a, b) => a.stateroom - b.stateroom);

  // Group by deck
  const roomsByDeck = roomEntries.reduce((acc, entry) => {
    const deck = getDeck(entry.stateroom);
    if (!acc[deck]) acc[deck] = [];
    acc[deck].push(entry);
    return acc;
  }, {} as Record<number, RoomEntry[]>);

  const sortedDecks = Object.keys(roomsByDeck).map(Number).sort((a, b) => a - b);

  // Overall progress
  let totalDeliveries = 0;
  let completedDeliveries = 0;
  for (const giftRecipients of rooms.values()) {
    for (const g of giftRecipients) {
      totalDeliveries++;
      if (g.delivered) completedDeliveries++;
    }
  }
  const progressPct = totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;

  // For route deliveredRooms: a room is "fully delivered" when all its gifts are delivered
  const deliveredRoomSet = new Set<number>();
  for (const [stateroom, giftRecipients] of rooms) {
    if (giftRecipients.every(g => g.delivered)) {
      deliveredRoomSet.add(stateroom);
    }
  }

  // Has undelivered rooms for route optimizer
  const hasUndelivered = totalDeliveries > completedDeliveries;

  if (!sailingId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/planner/pixie-dust" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Pixie Dusting
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-sm text-slate-500 dark:text-slate-400">No sailing selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <OfflineBanner pendingCount={offlinePendingCount} cacheKey={sailingId ? `joint-dust:${sailingId}` : undefined} />
      <div className="mb-6">
        <Link href={`/planner/pixie-dust?sailing=${sailingId}`} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Pixie Dusting
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Joint Dusting</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          All gifts combined into one delivery route.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 animate-pulse">✨</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading gifts...</p>
        </div>
      ) : gifts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎁</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">No gifts found for this sailing.</p>
        </div>
      ) : (
        <>
          {/* Gift Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {gifts.map(g => {
              const c = giftColorMap.get(g.id) ?? g.color;
              let gDelivered = 0;
              let gTotal = 0;
              for (const giftRecipients of rooms.values()) {
                for (const gr of giftRecipients) {
                  if (gr.giftId === g.id) {
                    gTotal++;
                    if (gr.delivered) gDelivered++;
                  }
                }
              }
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{
                    borderColor: c,
                    backgroundColor: `${c}15`,
                    color: c,
                  }}
                >
                  <span>{g.emoji}</span>
                  <span>{g.name}</span>
                  <span className="opacity-70">({gDelivered}/{gTotal})</span>
                </div>
              );
            })}
          </div>

          {/* Overall Progress */}
          {totalDeliveries > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {completedDeliveries} of {totalDeliveries} deliveries
                </span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">{progressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Delivery Checklist by Deck */}
          {sortedDecks.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delivery Checklist</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {filterDeck !== null
                      ? `${roomsByDeck[filterDeck]?.length ?? 0} rooms on Deck ${filterDeck}`
                      : `${roomEntries.length} rooms across ${sortedDecks.length} deck${sortedDecks.length !== 1 ? 's' : ''}`
                    }
                  </span>
                </div>
                {/* Deck filter chips */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterDeck(null)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filterDeck === null
                        ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    All
                  </button>
                  {sortedDecks.map(deck => {
                    const deckRooms = roomsByDeck[deck];
                    const deckAllDone = deckRooms.every(r => r.gifts.every(g => g.delivered));
                    const deckDeliveredCount = deckRooms.filter(r => r.gifts.every(g => g.delivered)).length;
                    return (
                      <button
                        key={deck}
                        type="button"
                        onClick={() => setFilterDeck(filterDeck === deck ? null : deck)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          filterDeck === deck
                            ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                            : deckAllDone
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        Dk {deck}
                        <span className="ml-1 opacity-70">({deckDeliveredCount}/{deckRooms.length})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(filterDeck !== null ? [filterDeck] : sortedDecks).map(deck => {
                const deckRooms = roomsByDeck[deck];
                if (!deckRooms || deckRooms.length === 0) return null;
                return (
                  <div key={deck}>
                    <div className="px-5 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deck {deck}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {deckRooms.filter(r => r.gifts.every(g => g.delivered)).length}/{deckRooms.length} rooms done
                      </span>
                    </div>
                    {deckRooms.map(room => {
                      const side = getSide(room.stateroom);
                      const allDelivered = room.gifts.every(g => g.delivered);
                      const isEditingName = editingField?.stateroom === room.stateroom && editingField.field === 'recipient_name';
                      const isEditingNotes = editingField?.stateroom === room.stateroom && editingField.field === 'notes';
                      const isSaving = savingRoom === room.stateroom;
                      return (
                        <div key={room.stateroom} className={`px-5 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0 ${allDelivered ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-3 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-sm font-medium ${
                                allDelivered ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                              }`}>
                                Room {room.stateroom}
                              </span>
                              {isEditingName ? (
                                <input
                                  ref={editInputRef as React.RefObject<HTMLInputElement>}
                                  type="text"
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={commitEdit}
                                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingField(null); }}
                                  maxLength={100}
                                  placeholder="Name"
                                  className="px-1.5 py-0 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 w-24"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditing(room.stateroom, 'recipient_name', room.displayName)}
                                  className={`text-xs truncate max-w-[100px] ${
                                    room.displayName
                                      ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                      : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 italic'
                                  }`}
                                  title={room.displayName ?? 'Add name'}
                                >
                                  {room.displayName || '+ name'}
                                </button>
                              )}
                              {isSaving && <span className="text-[10px] text-slate-400 animate-pulse">saving</span>}
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto ${
                              side === 'port'
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            }`}>
                              {side === 'port' ? 'Port' : 'Stbd'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {room.gifts.map(gr => {
                              const giftInfo = gifts.find(g => g.id === gr.giftId);
                              if (!giftInfo) return null;
                              const c = giftColorMap.get(gr.giftId) ?? giftInfo.color;
                              return (
                                <button
                                  key={gr.recipientId}
                                  type="button"
                                  disabled={togglingId === gr.recipientId}
                                  onClick={() => handleToggleDelivery(gr.recipientId, gr.giftId, room.stateroom, gr.delivered)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                                    togglingId === gr.recipientId ? 'opacity-50' : ''
                                  }`}
                                  style={gr.delivered ? {
                                    borderColor: '#86efac',
                                    backgroundColor: '#f0fdf4',
                                    color: '#15803d',
                                  } : {
                                    borderColor: c,
                                    backgroundColor: `${c}12`,
                                    color: c,
                                  }}
                                >
                                  <span>{giftInfo.emoji}</span>
                                  <span className={gr.delivered ? 'line-through' : ''}>{giftInfo.name}</span>
                                  {gr.delivered ? (
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <span className="w-3.5 h-3.5 rounded border-2 inline-block flex-shrink-0" style={{ borderColor: c }} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {/* Notes row */}
                          {isEditingNotes ? (
                            <div className="mt-1">
                              <textarea
                                ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={e => { if (e.key === 'Escape') setEditingField(null); }}
                                maxLength={500}
                                rows={2}
                                placeholder="Add a note..."
                                className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 resize-none"
                              />
                            </div>
                          ) : room.displayNotes ? (
                            <button
                              type="button"
                              onClick={() => startEditing(room.stateroom, 'notes', room.displayNotes)}
                              className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-left truncate max-w-full block"
                            >
                              {room.displayNotes}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditing(room.stateroom, 'notes', room.displayNotes)}
                              className="mt-0.5 text-[10px] text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 italic"
                            >
                              + note
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Route Optimizer */}
          {hasUndelivered && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
              <div className="px-5 py-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Plan Dusting Route</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Enter your stateroom to plan an efficient loop across all gifts &mdash; visits every room that still has undelivered items.
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={startRoom || ''}
                    onChange={e => { setStartRoom(Number(e.target.value)); setRoute(null); }}
                    placeholder="Your room number (start &amp; end)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={!startRoom || optimizing}
                    onClick={handleOptimizeRoute}
                    className="px-4 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
                  >
                    {optimizing ? 'Planning...' : 'Plan Route'}
                  </button>
                </div>
              </div>

              {route && (
                <div className="px-5 pb-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {route.length} stop{route.length !== 1 ? 's' : ''} across {new Set(route.map(r => r.deck)).size} deck{new Set(route.map(r => r.deck)).size !== 1 ? 's' : ''} &mdash; nearest deck first, one corridor side at a time
                  </p>
                  <DeliveryRoute
                    route={route}
                    startStateroom={startRoom}
                    deliveredRooms={deliveredRoomSet}
                  />
                </div>
              )}
            </div>
          )}

          {/* Empty state for rooms */}
          {roomEntries.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎁</div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No rooms to deliver to yet. Add recipients to your individual gifts first.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
