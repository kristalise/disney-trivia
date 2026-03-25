'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import RoomNumberParser from '@/components/RoomNumberParser';
import DeliveryRoute from '@/components/DeliveryRoute';
import { getDeck, getSide } from '@/lib/stateroom-utils';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OfflineBanner from '@/components/OfflineBanner';
import { cacheData, getCachedData, queueMutation, getPendingMutationCount } from '@/lib/offline-store';

interface PixieGift {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sailing_id: string;
  ship_name: string | null;
  sail_end_date: string | null;
}

interface Recipient {
  id: string;
  stateroom_number: number;
  delivered: boolean;
  delivered_at: string | null;
  recipient_name: string | null;
  notes: string | null;
}

interface RouteStop {
  stateroom: number;
  deck: number;
  side?: 'port' | 'starboard' | 'center';
  direction?: 'forward' | 'aft';
}

interface FEGroup {
  id: string;
  name: string;
  member_count: number;
}

export default function GiftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const giftId = params.giftId as string;
  const { session } = useAuth();

  const [gift, setGift] = useState<PixieGift | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [groups, setGroups] = useState<FEGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);

  // Add modes
  const [addMode, setAddMode] = useState<'none' | 'manual' | 'paste' | 'group'>('none');
  const [manualRoom, setManualRoom] = useState('');
  const [addingManual, setAddingManual] = useState(false);

  // Deck filter
  const [filterDeck, setFilterDeck] = useState<number | null>(null);

  // Route
  const [route, setRoute] = useState<RouteStop[] | null>(null);
  const [startRoom, setStartRoom] = useState<number>(0);
  const [optimizing, setOptimizing] = useState(false);

  // Delete gift
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Inline editing for name/notes
  const [editingField, setEditingField] = useState<{ id: string; field: 'recipient_name' | 'notes' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const authHeaders = useCallback(() => ({
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const fetchRecipients = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/pixie-gifts/recipients?gift_id=${giftId}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients ?? []);
        if (data.gift) setGift(data.gift);
      }
    } catch { /* ignore */ }
  }, [giftId, session?.access_token, authHeaders]);

  // Initial load
  useEffect(() => {
    if (!session?.access_token) return;
    setLoading(true);

    const load = async () => {
      try {
        const recipRes = await fetch(`/api/pixie-gifts/recipients?gift_id=${giftId}`, {
          headers: authHeaders(),
        });
        if (recipRes.ok) {
          const data = await recipRes.json();
          setRecipients(data.recipients ?? []);
          if (data.gift) setGift(data.gift);
          cacheData(`pixie-gift:${giftId}`, { gift: data.gift, recipients: data.recipients }).catch(() => {});
        }
      } catch {
        const cached = await getCachedData(`pixie-gift:${giftId}`).catch(() => null);
        if (cached) {
          const d = cached.data as { gift?: typeof gift; recipients?: typeof recipients };
          setRecipients(d.recipients ?? []);
          if (d.gift) setGift(d.gift);
        }
      } finally { setLoading(false); }
    };

    load();
  }, [giftId, session?.access_token, authHeaders]);

  // Fetch FE groups when adding from group
  useEffect(() => {
    if (addMode !== 'group' || !session?.access_token) return;
    fetch('/api/fe-groups', { headers: authHeaders() })
      .then(res => res.ok ? res.json() : { groups: [] })
      .then(data => setGroups(data.groups ?? []))
      .catch(() => {});
  }, [addMode, session?.access_token, authHeaders]);

  const handleAddManual = async () => {
    const room = Number(manualRoom);
    if (!room || room < 1000) return;
    setAddingManual(true);
    try {
      if (!isOnline) {
        await queueMutation({ type: 'pixie-delivery', url: '/api/pixie-gifts/recipients', method: 'POST', body: { gift_id: giftId, stateroom_numbers: [room] } });
        setRecipients(prev => [...prev, {
          id: `offline-${Date.now()}`,
          stateroom_number: room,
          delivered: false,
          delivered_at: null,
          recipient_name: null,
          notes: null,
        }]);
        setManualRoom('');
        getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
      } else {
        const res = await fetch('/api/pixie-gifts/recipients', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ gift_id: giftId, stateroom_numbers: [room] }),
        });
        if (res.ok) {
          await fetchRecipients();
          setManualRoom('');
        }
      }
    } catch { /* ignore */ } finally { setAddingManual(false); }
  };

  const handleAddParsed = async (rooms: number[]) => {
    try {
      if (!isOnline) {
        await queueMutation({ type: 'pixie-delivery', url: '/api/pixie-gifts/recipients', method: 'POST', body: { gift_id: giftId, stateroom_numbers: rooms } });
        setRecipients(prev => [...prev, ...rooms.map((room, i) => ({
          id: `offline-${Date.now()}-${i}`,
          stateroom_number: room,
          delivered: false,
          delivered_at: null,
          recipient_name: null,
          notes: null,
        }))]);
        setAddMode('none');
        getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
      } else {
        const res = await fetch('/api/pixie-gifts/recipients', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ gift_id: giftId, stateroom_numbers: rooms }),
        });
        if (res.ok) {
          await fetchRecipients();
          setAddMode('none');
        }
      }
    } catch { /* ignore */ }
  };

  const handleImportFromGroup = async (groupId: string) => {
    try {
      if (!isOnline) {
        await queueMutation({ type: 'pixie-delivery', url: '/api/pixie-gifts/recipients', method: 'POST', body: { gift_id: giftId, from_group: groupId } });
        setAddMode('none');
        getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
      } else {
        const res = await fetch('/api/pixie-gifts/recipients', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ gift_id: giftId, from_group: groupId }),
        });
        if (res.ok) {
          await fetchRecipients();
          setAddMode('none');
        }
      }
    } catch { /* ignore */ }
  };

  const handleToggleDelivery = async (recipientId: string, currentDelivered: boolean) => {
    setTogglingId(recipientId);
    const newValue = !currentDelivered;
    try {
      if (!isOnline) {
        await queueMutation({ type: 'pixie-delivery', url: '/api/pixie-gifts/recipients', method: 'PATCH', body: { id: recipientId, delivered: newValue } });
        setRecipients(prev => prev.map(r =>
          r.id === recipientId
            ? { ...r, delivered: newValue, delivered_at: newValue ? new Date().toISOString() : null }
            : r
        ));
        getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
      } else {
        const res = await fetch('/api/pixie-gifts/recipients', {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ id: recipientId, delivered: newValue }),
        });
        if (res.ok) {
          setRecipients(prev => prev.map(r =>
            r.id === recipientId
              ? { ...r, delivered: newValue, delivered_at: newValue ? new Date().toISOString() : null }
              : r
          ));
        }
      }
    } catch { /* ignore */ } finally { setTogglingId(null); }
  };

  const handleDeleteRecipient = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/pixie-gifts/recipients?id=${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok) {
        setRecipients(prev => prev.filter(r => r.id !== id));
      }
    } catch { /* ignore */ } finally { setDeletingId(null); }
  };

  const handleDeleteGift = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/pixie-gifts?id=${giftId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok) {
        const sailingParam = gift?.sailing_id ? `?sailing=${gift.sailing_id}` : '';
        router.push(`/planner/pixie-dust${sailingParam}`);
      }
    } catch { /* ignore */ } finally { setDeleteLoading(false); }
  };

  const handleSaveField = async (recipientId: string, field: 'recipient_name' | 'notes', value: string) => {
    setSavingFieldId(recipientId);
    try {
      if (!isOnline) {
        await queueMutation({ type: 'pixie-delivery', url: '/api/pixie-gifts/recipients', method: 'PATCH', body: { id: recipientId, [field]: value || null } });
        setRecipients(prev => prev.map(r =>
          r.id === recipientId ? { ...r, [field]: value || null } : r
        ));
        getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
      } else {
        const res = await fetch('/api/pixie-gifts/recipients', {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ id: recipientId, [field]: value || null }),
        });
        if (res.ok) {
          setRecipients(prev => prev.map(r =>
            r.id === recipientId ? { ...r, [field]: value || null } : r
          ));
        }
      }
    } catch { /* ignore */ } finally {
      setSavingFieldId(null);
      setEditingField(null);
    }
  };

  const startEditing = (id: string, field: 'recipient_name' | 'notes', currentValue: string | null) => {
    setEditingField({ id, field });
    setEditValue(currentValue ?? '');
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    if (!editingField) return;
    const r = recipients.find(r => r.id === editingField.id);
    const currentValue = r?.[editingField.field] ?? '';
    if (editValue !== (currentValue ?? '')) {
      handleSaveField(editingField.id, editingField.field, editValue);
    } else {
      setEditingField(null);
    }
  };

  const handleOptimizeRoute = async () => {
    const undelivered = recipients.filter(r => !r.delivered).map(r => r.stateroom_number);
    if (undelivered.length === 0 || !startRoom) return;
    setOptimizing(true);
    try {
      const res = await fetch('/api/pixie-dust/route-optimizer', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ start_stateroom: startRoom, target_staterooms: undelivered, ship_name: gift?.ship_name }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoute(data.route);
      }
    } catch { /* ignore */ } finally { setOptimizing(false); }
  };

  // Group recipients by deck
  const recipientsByDeck = recipients.reduce((acc, r) => {
    const deck = getDeck(r.stateroom_number);
    if (!acc[deck]) acc[deck] = [];
    acc[deck].push(r);
    return acc;
  }, {} as Record<number, Recipient[]>);

  const sortedDecks = Object.keys(recipientsByDeck).map(Number).sort((a, b) => a - b);
  const delivered = recipients.filter(r => r.delivered).length;
  const total = recipients.length;
  const progressPct = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const deliveredSet = new Set(recipients.filter(r => r.delivered).map(r => r.stateroom_number));
  const isPastSailing = gift?.sail_end_date ? new Date(gift.sail_end_date) < new Date() : false;

  const backHref = gift?.sailing_id
    ? `/planner/pixie-dust?sailing=${gift.sailing_id}`
    : '/planner/pixie-dust';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={backHref} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Pixie Dusting
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {gift ? <>{gift.emoji} {gift.name}</> : 'Gift Delivery'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {isPastSailing ? 'Delivery history for this gift.' : 'Manage rooms and track deliveries for this gift.'}
        </p>
      </div>

      <OfflineBanner pendingCount={offlinePendingCount} cacheKey={`pixie-gift:${giftId}`} />

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 animate-pulse">🎁</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      ) : (
        <>
          {/* Progress */}
          {total > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {delivered} of {total} delivered
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

          {/* Route Optimizer */}
          {!isPastSailing && recipients.filter(r => !r.delivered).length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
              <div className="px-5 py-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Plan Dusting Route</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Enter your stateroom to plan an efficient loop &mdash; walks each corridor side then crosses over to minimize backtracking.
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
                    deliveredRooms={deliveredSet}
                  />
                </div>
              )}
            </div>
          )}

          {/* Add Rooms */}
          {!isPastSailing && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Add Staterooms</h3>
              <div className="flex gap-1.5">
                {(['manual', 'paste', 'group'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAddMode(addMode === mode ? 'none' : mode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      addMode === mode
                        ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {mode === 'manual' ? 'Manual' : mode === 'paste' ? 'Paste' : 'From Group'}
                  </button>
                ))}
              </div>
            </div>

            {addMode === 'manual' && (
              <div className="px-5 pb-4 flex gap-2">
                <input
                  type="number"
                  value={manualRoom}
                  onChange={e => setManualRoom(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddManual(); }}
                  placeholder="Room number"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  disabled={!manualRoom || addingManual}
                  onClick={handleAddManual}
                  className="px-4 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
                >
                  {addingManual ? '...' : 'Add'}
                </button>
              </div>
            )}

            {addMode === 'paste' && (
              <div className="px-5 pb-4">
                <RoomNumberParser
                  onConfirm={handleAddParsed}
                  onCancel={() => setAddMode('none')}
                />
              </div>
            )}

            {addMode === 'group' && (
              <div className="px-5 pb-4">
                {groups.length > 0 ? (
                  <div className="space-y-2">
                    {groups.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleImportFromGroup(g.id)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{g.name}</span>
                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                          {g.member_count} member{g.member_count !== 1 ? 's' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    No FE groups found. Create or join one first.
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {/* Delivery Checklist by Deck */}
          {sortedDecks.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delivery Checklist</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {filterDeck !== null
                      ? `${recipientsByDeck[filterDeck]?.length ?? 0} on Deck ${filterDeck}`
                      : `${total} across ${sortedDecks.length} deck${sortedDecks.length !== 1 ? 's' : ''}`
                    }
                  </span>
                  <select
                    value={filterDeck ?? ''}
                    onChange={e => setFilterDeck(e.target.value ? Number(e.target.value) : null)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <option value="">All decks</option>
                    {sortedDecks.map(deck => {
                      const deckDelivered = recipientsByDeck[deck].filter(r => r.delivered).length;
                      const deckTotal = recipientsByDeck[deck].length;
                      return (
                        <option key={deck} value={deck}>
                          Deck {deck} ({deckDelivered}/{deckTotal})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              {(filterDeck !== null ? [filterDeck] : sortedDecks).map(deck => {
                const deckRecipients = recipientsByDeck[deck];
                if (!deckRecipients || deckRecipients.length === 0) return null;
                const sorted = [...deckRecipients].sort((a, b) => a.stateroom_number - b.stateroom_number);
                return (
                  <div key={deck}>
                    <div className="px-5 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deck {deck}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {sorted.filter(r => r.delivered).length}/{sorted.length} delivered
                      </span>
                    </div>
                    {sorted.map(r => {
                      const side = getSide(r.stateroom_number);
                      const isEditingName = !isPastSailing && editingField?.id === r.id && editingField.field === 'recipient_name';
                      const isEditingNotes = !isPastSailing && editingField?.id === r.id && editingField.field === 'notes';
                      const isSaving = savingFieldId === r.id;
                      return (
                        <div key={r.id} className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                          <div className="flex items-center gap-3">
                            {isPastSailing ? (
                              <span className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                                r.delivered
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {r.delivered && (
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={togglingId === r.id}
                                onClick={() => handleToggleDelivery(r.id, r.delivered)}
                                className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                  r.delivered
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-green-500'
                                } ${togglingId === r.id ? 'opacity-50' : ''}`}
                              >
                                {r.delivered && (
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-medium ${
                                  r.delivered ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                                }`}>
                                  Room {r.stateroom_number}
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
                                ) : isPastSailing ? (
                                  r.recipient_name && (
                                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[100px]">{r.recipient_name}</span>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startEditing(r.id, 'recipient_name', r.recipient_name)}
                                    className={`text-xs truncate max-w-[100px] ${
                                      r.recipient_name
                                        ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 italic'
                                    }`}
                                    title={r.recipient_name ?? 'Add name'}
                                  >
                                    {r.recipient_name || '+ name'}
                                  </button>
                                )}
                                {isSaving && <span className="text-[10px] text-slate-400 animate-pulse">saving</span>}
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              side === 'port'
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            }`}>
                              {side === 'port' ? 'Port side' : 'Starboard side'}
                            </span>
                            {r.delivered_at && (
                              <span className="text-xs text-green-600 dark:text-green-400">
                                {new Date(r.delivered_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            )}
                            {!isPastSailing && (
                            <button
                              type="button"
                              disabled={deletingId === r.id}
                              onClick={() => handleDeleteRecipient(r.id)}
                              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            )}
                          </div>
                          {/* Notes row */}
                          {isEditingNotes ? (
                            <div className="ml-9 mt-1">
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
                          ) : isPastSailing ? (
                            r.notes && (
                              <p className="ml-9 mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{r.notes}</p>
                            )
                          ) : r.notes ? (
                            <button
                              type="button"
                              onClick={() => startEditing(r.id, 'notes', r.notes)}
                              className="ml-9 mt-0.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-left truncate max-w-full block"
                            >
                              {r.notes}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditing(r.id, 'notes', r.notes)}
                              className="ml-9 mt-0.5 text-[10px] text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 italic"
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

          {/* Empty state */}
          {recipients.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎁</div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No staterooms added yet. Add rooms above to start planning deliveries.
              </p>
            </div>
          )}

          {/* Delete Gift */}
          {!isPastSailing && (
          <div className="text-center mt-2 mb-8">
            {showDeleteConfirm ? (
              <div className="inline-flex items-center gap-3">
                <span className="text-sm text-red-600 dark:text-red-400">Delete this gift and all recipients?</span>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDeleteGift}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400"
              >
                Delete this gift
              </button>
            )}
          </div>
          )}
        </>
      )}
    </div>
  );
}
