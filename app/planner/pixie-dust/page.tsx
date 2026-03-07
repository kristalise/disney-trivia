'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import SailingPicker from '@/components/SailingPicker';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OfflineBanner from '@/components/OfflineBanner';
import { cacheData, getCachedData, queueMutation, getPendingMutationCount } from '@/lib/offline-store';

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
  embarkation_port: string;
  ports_of_call: string | null;
  disembarkation_port: string | null;
  stateroom_numbers: number[] | null;
  num_pax: number | null;
  cost_per_pax: number | null;
  overall_rating: number;
}

interface FEGroup {
  id: string;
  sailing_id: string;
  name: string;
  invite_code: string;
  member_count: number;
  is_creator: boolean;
}

interface PixieGift {
  id: string;
  name: string;
  emoji: string;
  color: string;
  recipient_count: number;
  delivered_count: number;
}

interface DustedBy {
  id: string;
  duster_stateroom: number;
  gift_name: string | null;
  created_at: string;
}

export default function PixieDustPage() {
  return (
    <Suspense>
      <PixieDustContent />
    </Suspense>
  );
}

function PixieDustContent() {
  const { user, session } = useAuth();
  const searchParams = useSearchParams();
  const sailingParam = searchParams.get('sailing');

  const [selectedSailing, setSelectedSailing] = useState<Sailing | null>(null);
  const [groups, setGroups] = useState<FEGroup[]>([]);
  const [gifts, setGifts] = useState<PixieGift[]>([]);
  const [dustedBy, setDustedBy] = useState<DustedBy[]>([]);
  const [loading, setLoading] = useState(false);
  const isOnline = useOnlineStatus();
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);

  // Create group form
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRoom, setNewGroupRoom] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Join group form
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinRoom, setJoinRoom] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);

  // Create gift form
  const [showCreateGift, setShowCreateGift] = useState(false);
  const [newGiftName, setNewGiftName] = useState('');
  const [newGiftEmoji, setNewGiftEmoji] = useState('🎁');
  const [creatingGift, setCreatingGift] = useState(false);

  // Inline gift rename
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [editGiftName, setEditGiftName] = useState('');

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const authHeaders = useCallback(() => ({
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const fetchData = useCallback(async (sailingId: string) => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const [groupsRes, giftsRes, dustedRes] = await Promise.all([
        fetch(`/api/fe-groups?sailing_id=${sailingId}`, { headers: authHeaders() }),
        fetch(`/api/pixie-gifts?sailing_id=${sailingId}`, { headers: authHeaders() }),
        fetch(`/api/pixie-dust?sailing_id=${sailingId}`, { headers: authHeaders() }),
      ]);

      const groupsData = groupsRes.ok ? (await groupsRes.json()).groups ?? [] : [];
      const giftsData = giftsRes.ok ? (await giftsRes.json()).gifts ?? [] : [];
      const dustedData = dustedRes.ok ? (await dustedRes.json()).dusted_by ?? [] : [];

      setGroups(groupsData);
      setGifts(giftsData);
      setDustedBy(dustedData);
      cacheData(`pixie-dust:${sailingId}`, { groups: groupsData, gifts: giftsData, dustedBy: dustedData }).catch(() => {});
    } catch {
      const cached = await getCachedData<{ groups: FEGroup[]; gifts: PixieGift[]; dustedBy: DustedBy[] }>(`pixie-dust:${sailingId}`).catch(() => null);
      if (cached) {
        setGroups(cached.data.groups);
        setGifts(cached.data.gifts);
        setDustedBy(cached.data.dustedBy);
      }
    } finally { setLoading(false); }
  }, [session?.access_token, authHeaders]);

  const handleCreateGroup = async () => {
    if (!selectedSailing || !newGroupName.trim() || !newGroupRoom.trim()) return;
    setCreatingGroup(true);
    try {
      if (!isOnline) {
        const tempId = crypto.randomUUID();
        await queueMutation({ type: 'pixie-group-create', url: '/api/fe-groups', method: 'POST', body: { sailing_id: selectedSailing.id, name: newGroupName, stateroom_number: Number(newGroupRoom) } });
        setGroups(prev => [...prev, { id: tempId, sailing_id: selectedSailing.id, name: newGroupName, invite_code: 'OFFLINE', member_count: 1, is_creator: true }]);
        setShowCreateGroup(false);
        setNewGroupName('');
        setNewGroupRoom('');
        getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
      } else {
        const res = await fetch('/api/fe-groups', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            sailing_id: selectedSailing.id,
            name: newGroupName,
            stateroom_number: Number(newGroupRoom),
          }),
        });
        if (res.ok) {
          await fetchData(selectedSailing.id);
          setShowCreateGroup(false);
          setNewGroupName('');
          setNewGroupRoom('');
        }
      }
    } catch { /* ignore */ } finally { setCreatingGroup(false); }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || !joinRoom.trim()) return;
    setJoiningGroup(true);
    try {
      const res = await fetch('/api/fe-groups/join', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          invite_code: joinCode,
          stateroom_number: Number(joinRoom),
        }),
      });
      if (res.ok) {
        if (selectedSailing) await fetchData(selectedSailing.id);
        setShowJoinGroup(false);
        setJoinCode('');
        setJoinRoom('');
      }
    } catch { /* ignore */ } finally { setJoiningGroup(false); }
  };

  const handleCreateGift = async () => {
    if (!selectedSailing || !newGiftName.trim()) return;
    setCreatingGift(true);
    try {
      if (!isOnline) {
        const tempId = crypto.randomUUID();
        await queueMutation({ type: 'pixie-gift-create', url: '/api/pixie-gifts', method: 'POST', body: { sailing_id: selectedSailing.id, name: newGiftName, emoji: newGiftEmoji } });
        setGifts(prev => [...prev, { id: tempId, name: newGiftName, emoji: newGiftEmoji, color: '#6366f1', recipient_count: 0, delivered_count: 0 }]);
        setShowCreateGift(false);
        setNewGiftName('');
        setNewGiftEmoji('🎁');
        getPendingMutationCount().then(setOfflinePendingCount).catch(() => {});
      } else {
        const res = await fetch('/api/pixie-gifts', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            sailing_id: selectedSailing.id,
            name: newGiftName,
            emoji: newGiftEmoji,
          }),
        });
        if (res.ok) {
          await fetchData(selectedSailing.id);
          setShowCreateGift(false);
          setNewGiftName('');
          setNewGiftEmoji('🎁');
        }
      }
    } catch { /* ignore */ } finally { setCreatingGift(false); }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this FE group? Members will be removed.')) return;
    try {
      const res = await fetch('/api/fe-groups', {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({ group_id: groupId }),
      });
      if (res.ok && selectedSailing) await fetchData(selectedSailing.id);
    } catch { /* ignore */ }
  };

  const handleDeleteGift = async (giftId: string) => {
    if (!confirm('Delete this gift? All recipients will be removed.')) return;
    try {
      const res = await fetch(`/api/pixie-gifts?id=${giftId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok && selectedSailing) await fetchData(selectedSailing.id);
    } catch { /* ignore */ }
  };

  const handleRenameGift = async (giftId: string) => {
    if (!editGiftName.trim()) return;
    try {
      const res = await fetch('/api/pixie-gifts', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ id: giftId, name: editGiftName }),
      });
      if (res.ok && selectedSailing) {
        await fetchData(selectedSailing.id);
        setEditingGiftId(null);
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/planner" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          My Planner
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pixie Dusting</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage FE groups, plan gifts, and track deliveries.</p>
      </div>

      {user ? (
        <SailingPicker
          onSelect={async (sailing) => {
            setSelectedSailing(sailing);
            setGroups([]);
            setGifts([]);
            setDustedBy([]);
            if (sailing) await fetchData(sailing.id);
          }}
          selectedSailingId={selectedSailing?.id ?? sailingParam}
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign in to manage pixie dusting.</p>
          <Link href="/auth" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Sign In</Link>
        </div>
      )}

      {selectedSailing && (
        <OfflineBanner
          pendingCount={offlinePendingCount}
          cacheKey={selectedSailing ? `pixie-dust:${selectedSailing.id}` : undefined}
        />
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3 animate-pulse">✨</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      )}

      {selectedSailing && !loading && (() => {
        const isUpcomingSailing = new Date(selectedSailing.sail_end_date) >= new Date();
        return (
        <>
          {/* FE Groups & Gifts (upcoming only) */}
          {isUpcomingSailing && (<>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🐟</span>
                <h3 className="font-bold text-slate-900 dark:text-white">Fish Extender Groups</h3>
                <span className="text-sm text-slate-400 dark:text-slate-500">({groups.length})</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowJoinGroup(!showJoinGroup); setShowCreateGroup(false); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
                >
                  Join
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateGroup(!showCreateGroup); setShowJoinGroup(false); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors"
                >
                  + Create
                </button>
              </div>
            </div>

            {/* Join Form */}
            {showJoinGroup && (
              <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Invite code"
                    maxLength={8}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white uppercase tracking-widest text-center"
                  />
                  <input
                    type="number"
                    value={joinRoom}
                    onChange={e => setJoinRoom(e.target.value)}
                    placeholder="Your room"
                    className="w-28 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={!joinCode.trim() || !joinRoom.trim() || joiningGroup}
                  onClick={handleJoinGroup}
                  className="w-full px-4 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
                >
                  {joiningGroup ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            )}

            {/* Create Form */}
            {showCreateGroup && (
              <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white mb-2"
                />
                <input
                  type="number"
                  value={newGroupRoom}
                  onChange={e => setNewGroupRoom(e.target.value)}
                  placeholder="Your stateroom number"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white mb-2"
                />
                <button
                  type="button"
                  disabled={!newGroupName.trim() || !newGroupRoom.trim() || creatingGroup}
                  onClick={handleCreateGroup}
                  className="w-full px-4 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            )}

            {/* Group cards */}
            <div className="px-5 pb-4">
              {groups.length > 0 ? (
                <div className="space-y-3">
                  {groups.map(group => (
                    <div key={group.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{group.name}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {group.invite_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(group.invite_code)}
                          className="text-xs text-disney-blue dark:text-disney-gold hover:underline"
                        >
                          Copy code
                        </button>
                        {group.is_creator && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="ml-auto text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No FE groups yet. Create one or join with an invite code.
                </p>
              )}
            </div>
          </div>

          {/* Gift Types Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <h3 className="font-bold text-slate-900 dark:text-white">My Gifts</h3>
                <span className="text-sm text-slate-400 dark:text-slate-500">({gifts.length})</span>
              </div>
              <div className="flex gap-2">
                {gifts.length >= 2 && (
                  <Link
                    href={`/planner/pixie-dust/joint-dust?sailing=${selectedSailing.id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
                  >
                    Joint Dusting
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowCreateGift(!showCreateGift)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors"
                >
                  {showCreateGift ? 'Close' : '+ Add Gift'}
                </button>
              </div>
            </div>

            {showCreateGift && (
              <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                <div className="flex gap-2 mb-2">
                  <select
                    value={newGiftEmoji}
                    onChange={e => setNewGiftEmoji(e.target.value)}
                    className="w-16 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-lg text-center"
                  >
                    {['🎁', '🧲', '🍬', '✨', '🎨', '🧸', '🌸', '🏴‍☠️', '🐚', '🎀'].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newGiftName}
                    onChange={e => setNewGiftName(e.target.value)}
                    placeholder="e.g. Door Magnets, Treat Bags..."
                    maxLength={100}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={!newGiftName.trim() || creatingGift}
                  onClick={handleCreateGift}
                  className="w-full px-4 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
                >
                  {creatingGift ? 'Creating...' : 'Create Gift'}
                </button>
              </div>
            )}

            <div className="px-5 pb-4">
              {gifts.length > 0 ? (
                <div className="space-y-3">
                  {gifts.map(gift => {
                    const pct = gift.recipient_count > 0 ? Math.round((gift.delivered_count / gift.recipient_count) * 100) : 0;
                    const isEditing = editingGiftId === gift.id;
                    return (
                      <div
                        key={gift.id}
                        className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-disney-blue/30 dark:hover:border-disney-gold/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-lg flex-shrink-0">{gift.emoji}</span>
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={editGiftName}
                                  onChange={e => setEditGiftName(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleRenameGift(gift.id); if (e.key === 'Escape') setEditingGiftId(null); }}
                                  maxLength={100}
                                  autoFocus
                                  className="flex-1 min-w-0 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                                />
                                <button type="button" onClick={() => handleRenameGift(gift.id)} className="text-green-600 dark:text-green-400 hover:text-green-700 flex-shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button type="button" onClick={() => setEditingGiftId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ) : (
                              <>
                                <Link href={`/planner/pixie-dust/${gift.id}`} className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                  {gift.name}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => { setEditingGiftId(gift.id); setEditGiftName(gift.name); }}
                                  className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                  title="Rename gift"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                              </>
                            )}
                          </div>
                          {!isEditing && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 flex-shrink-0">
                              {gift.delivered_count}/{gift.recipient_count} delivered
                            </span>
                          )}
                        </div>
                        <Link href={`/planner/pixie-dust/${gift.id}`} className="block">
                          {gift.recipient_count > 0 && (
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                          {gift.recipient_count === 0 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">No rooms added yet — tap to add recipients</p>
                          )}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No gifts yet. Create a gift type to start planning deliveries.
                </p>
              )}
            </div>
          </div>
          </>)}

          {/* Dusted By Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4">
              <span className="text-lg">✨</span>
              <h3 className="font-bold text-slate-900 dark:text-white">Dusted By</h3>
              <span className="text-sm text-slate-400 dark:text-slate-500">({dustedBy.length})</span>
            </div>
            <div className="px-5 pb-4">
              {dustedBy.length > 0 ? (
                <div className="space-y-2">
                  {dustedBy.map(entry => (
                    <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <span className="text-lg">🎁</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          Room {entry.duster_stateroom}
                        </p>
                        {entry.gift_name && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{entry.gift_name}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No pixie dust received yet. When someone leaves a gift at your door, it&apos;ll appear here.
                </p>
              )}
            </div>
          </div>

          {/* Friends link */}
          <Link
            href="/friends"
            className="block text-center text-sm font-medium text-disney-blue dark:text-disney-gold hover:underline mb-4"
          >
            Scan a QR code to thank your dusters
          </Link>

          {!isUpcomingSailing && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-4">
              Select an upcoming sailing to plan gifts and manage FE groups.
            </p>
          )}
        </>
        );
      })()}
    </div>
  );
}
