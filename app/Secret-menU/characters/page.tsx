'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getAuthClient } from '@/lib/auth';
import { getCharacterCategories, getTotalCharacterCount, getAllCharacters, type Category, type Character } from '@/lib/character-data';
import ImageCropUpload from '@/components/ImageCropUpload';
import { queueUpload, getPendingUploads, removePendingUpload, getPendingCount } from '@/lib/offline-queue';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OfflineBanner from '@/components/OfflineBanner';
import { cacheData, getCachedData, getPendingMutationCount } from '@/lib/offline-store';

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
}

interface MeetupSailing {
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
}

interface Meetup {
  id: string;
  sailing_id: string;
  character_id: string;
  photo_url: string | null;
  notes: string | null;
  is_default: boolean;
  created_at: string;
  tagged_by?: string;
  sailing: MeetupSailing | null;
}

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string | null;
}

const categories = getCharacterCategories();
const allCharacters = getAllCharacters();

const categoryColors: Record<string, { bg: string; border: string }> = {
  blue:    { bg: 'bg-blue-100/70 dark:bg-blue-900/30',       border: 'border-l-blue-400' },
  pink:    { bg: 'bg-pink-100/70 dark:bg-pink-900/30',       border: 'border-l-pink-400' },
  cyan:    { bg: 'bg-cyan-100/70 dark:bg-cyan-900/30',       border: 'border-l-cyan-400' },
  violet:  { bg: 'bg-violet-100/70 dark:bg-violet-900/30',   border: 'border-l-violet-400' },
  emerald: { bg: 'bg-emerald-100/70 dark:bg-emerald-900/30', border: 'border-l-emerald-400' },
  red:     { bg: 'bg-red-100/70 dark:bg-red-900/30',         border: 'border-l-red-400' },
  amber:   { bg: 'bg-amber-100/70 dark:bg-amber-900/30',     border: 'border-l-amber-400' },
  fuchsia: { bg: 'bg-fuchsia-100/70 dark:bg-fuchsia-900/30', border: 'border-l-fuchsia-400' },
  orange:  { bg: 'bg-orange-100/70 dark:bg-orange-900/30',   border: 'border-l-orange-400' },
  teal:    { bg: 'bg-teal-100/70 dark:bg-teal-900/30',       border: 'border-l-teal-400' },
  sky:     { bg: 'bg-sky-100/70 dark:bg-sky-900/30',         border: 'border-l-sky-400' },
};

export default function CharacterChecklistPage() {
  const { user, session } = useAuth();
  // All meetups keyed by character_id → array of meetups
  const [allMeetups, setAllMeetups] = useState<Map<string, Meetup[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  // Character detail modal
  const [modalCharacter, setModalCharacter] = useState<{ id: string; name: string } | null>(null);
  const [modalMeetups, setModalMeetups] = useState<Meetup[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Upload sub-modal (inside character modal)
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSailings, setUploadSailings] = useState<Sailing[]>([]);
  const [uploadSailingsLoading, setUploadSailingsLoading] = useState(false);
  const [selectedUploadSailing, setSelectedUploadSailing] = useState<Sailing | null>(null);
  const [uploadPhotoUrl, setUploadPhotoUrl] = useState<string | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadSaving, setUploadSaving] = useState(false);

  // Tag friend modal
  const [tagMeetupId, setTagMeetupId] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState<UserProfile[]>([]);
  const [tagSearching, setTagSearching] = useState(false);

  // Offline state
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

  // Character search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Character[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchBlurTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch all meetups for the user (cross-sailing)
  const fetchAllMeetups = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/character-meetups', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const map = new Map<string, Meetup[]>();

        for (const m of (data.meetups ?? [])) {
          const arr = map.get(m.character_id) || [];
          arr.push(m);
          map.set(m.character_id, arr);
        }
        for (const m of (data.tagged_meetups ?? [])) {
          const arr = map.get(m.character_id) || [];
          if (!arr.some(existing => existing.id === m.id)) {
            arr.push(m);
          }
          map.set(m.character_id, arr);
        }

        setAllMeetups(map);
        // Cache as serializable array of entries
        cacheData('character-meetups', Array.from(map.entries())).catch(() => {});
      }
    } catch {
      // Offline fallback
      const cached = await getCachedData<[string, Meetup[]][]>('character-meetups').catch(() => null);
      if (cached) setAllMeetups(new Map(cached.data));
    } finally { setLoading(false); }
  }, [session?.access_token]);

  useEffect(() => {
    if (user) fetchAllMeetups();
  }, [user, fetchAllMeetups]);

  // Refresh pending count on mount and when online status changes
  // (Upload processing is now handled by the app-level useOfflineSync in AuthProvider)
  useEffect(() => {
    getPendingCount().then(setPendingCount).catch(() => {});
    if (isOnline) {
      // Refresh meetups after coming online (sync may have processed uploads)
      fetchAllMeetups();
      getPendingCount().then(setPendingCount).catch(() => {});
    }
  }, [isOnline, fetchAllMeetups]);

  // Get the default meetup for a character (for bubble display)
  const getDefaultMeetup = useCallback((characterId: string): Meetup | null => {
    const meetups = allMeetups.get(characterId);
    if (!meetups || meetups.length === 0) return null;
    return meetups.find(m => m.is_default) || meetups[0];
  }, [allMeetups]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSub = (id: string) => {
    setExpandedSubs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getCaughtCount = useCallback((characters: { id: string }[]) => {
    return characters.filter(ch => allMeetups.has(ch.id)).length;
  }, [allMeetups]);

  const getCategoryCaughtCount = useCallback((cat: Category) => {
    return cat.subcategories.reduce((sum, sub) => sum + getCaughtCount(sub.characters), 0);
  }, [getCaughtCount]);

  const getCategoryTotalCount = (cat: Category) => {
    return cat.subcategories.reduce((sum, sub) => sum + sub.characters.length, 0);
  };

  // Open character detail modal
  const openModal = useCallback(async (character: { id: string; name: string }) => {
    setModalCharacter(character);
    setShowUpload(false);
    const meetups = allMeetups.get(character.id) || [];
    setModalMeetups(meetups);

    // If no meetups yet, go straight to upload mode
    if (meetups.length === 0) {
      setShowUpload(true);
    }
  }, [allMeetups]);

  const closeModal = () => {
    setModalCharacter(null);
    setModalMeetups([]);
    setShowUpload(false);
    resetUploadState();
  };

  const resetUploadState = () => {
    setSelectedUploadSailing(null);
    setUploadPhotoUrl(null);
    setUploadNotes('');
  };

  // Fetch user's sailings for the upload picker
  const fetchSailings = useCallback(async () => {
    if (!session?.access_token) return;
    setUploadSailingsLoading(true);
    try {
      const res = await fetch('/api/sailing-reviews/mine', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUploadSailings(data.sailings ?? []);
      }
    } catch { /* ignore */ } finally { setUploadSailingsLoading(false); }
  }, [session?.access_token]);

  // Fetch sailings when upload mode opens
  useEffect(() => {
    if (showUpload && uploadSailings.length === 0) {
      fetchSailings();
    }
  }, [showUpload, uploadSailings.length, fetchSailings]);

  const handleUploadSave = async () => {
    if (!modalCharacter || !selectedUploadSailing || !user) return;

    // Offline: queue for later (photo upload already happened via ImageCropUpload if online)
    if (!navigator.onLine) {
      setUploadSaving(true);
      try {
        await queueUpload({
          character_id: modalCharacter.id,
          character_name: modalCharacter.name,
          sailing_id: selectedUploadSailing.id,
          ship_display_name: selectedUploadSailing.ship_name,
          notes: uploadNotes || null,
          file: null,
          file_ext: 'webp',
        });
        const count = await getPendingCount();
        setPendingCount(count);
        setOfflineMessage(`Saved! Will upload when you're back online.`);
        setTimeout(() => setOfflineMessage(null), 4000);
        setShowUpload(false);
        resetUploadState();
        closeModal();
      } catch (err) {
        console.error('Queue failed:', err);
      } finally {
        setUploadSaving(false);
      }
      return;
    }

    // Online: photo already uploaded via ImageCropUpload
    if (!session?.access_token) return;
    setUploadSaving(true);

    try {
      const res = await fetch('/api/character-meetups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sailing_id: selectedUploadSailing.id,
          character_id: modalCharacter.id,
          photo_url: uploadPhotoUrl,
          notes: uploadNotes || null,
        }),
      });

      if (res.ok) {
        // Refresh all meetups and modal meetups
        await fetchAllMeetups();
        // Re-fetch character-specific meetups for modal
        const detailRes = await fetch(`/api/character-meetups?character_id=${modalCharacter.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const combined = [...(detailData.meetups ?? []), ...(detailData.tagged_meetups ?? [])];
          setModalMeetups(combined);
        }
        setShowUpload(false);
        resetUploadState();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setUploadSaving(false);
    }
  };

  const handleSetDefault = async (meetupId: string) => {
    if (!session?.access_token || !modalCharacter) return;
    try {
      const res = await fetch('/api/character-meetups', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: meetupId, set_default: true }),
      });
      if (res.ok) {
        // Update local state
        setModalMeetups(prev => prev.map(m => ({ ...m, is_default: m.id === meetupId })));
        setAllMeetups(prev => {
          const next = new Map(prev);
          const arr = next.get(modalCharacter.id);
          if (arr) {
            next.set(modalCharacter.id, arr.map(m => ({ ...m, is_default: m.id === meetupId })));
          }
          return next;
        });
      }
    } catch { /* ignore */ }
  };

  const handleRemoveMeetup = async (meetupId: string) => {
    if (!session?.access_token || !modalCharacter) return;
    try {
      const res = await fetch(`/api/character-meetups?id=${meetupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const remaining = modalMeetups.filter(m => m.id !== meetupId);
        setModalMeetups(remaining);

        // Update global state
        setAllMeetups(prev => {
          const next = new Map(prev);
          if (remaining.length === 0) {
            next.delete(modalCharacter.id);
          } else {
            next.set(modalCharacter.id, remaining);
          }
          return next;
        });

        if (remaining.length === 0) {
          closeModal();
        }
      }
    } catch { /* ignore */ }
  };

  // Tag friend
  const searchFriends = useCallback(async (query: string) => {
    if (query.length < 2) { setTagResults([]); return; }
    setTagSearching(true);
    try {
      const res = await fetch(`/api/profiles?search=${encodeURIComponent(query)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setTagResults((data.profiles ?? []).filter((p: UserProfile) => p.id !== user?.id));
      }
    } catch { /* ignore */ } finally { setTagSearching(false); }
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => { if (tagSearch) searchFriends(tagSearch); }, 300);
    return () => clearTimeout(timer);
  }, [tagSearch, searchFriends]);

  const handleTagFriend = async (friendId: string) => {
    if (!tagMeetupId || !session?.access_token) return;
    try {
      const res = await fetch('/api/character-meetups/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ meetup_id: tagMeetupId, tagged_user_id: friendId }),
      });
      if (res.ok) {
        setTagMeetupId(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to tag friend');
      }
    } catch { /* ignore */ }
  };

  // Filter out sailings already used for this character
  const availableSailingsForUpload = useMemo(() => {
    if (!modalCharacter) return uploadSailings;
    const usedSailingIds = new Set(modalMeetups.filter(m => !m.tagged_by).map(m => m.sailing_id));
    return uploadSailings.filter(s => !usedSailingIds.has(s.id));
  }, [uploadSailings, modalMeetups, modalCharacter]);

  const totalCaught = useMemo(() => allMeetups.size, [allMeetups]);
  const totalCharacters = getTotalCharacterCount();

  const allExpanded = expandedCategories.size === categories.length;
  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedCategories(new Set());
      setExpandedSubs(new Set());
    } else {
      setExpandedCategories(new Set(categories.map(c => c.id)));
      setExpandedSubs(new Set(categories.flatMap(c => c.subcategories.map(s => s.id))));
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 1) {
      const lower = query.toLowerCase();
      setSearchResults(allCharacters.filter(ch => ch.name.toLowerCase().includes(lower)).slice(0, 8));
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSelect = (character: Character) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchFocused(false);
    openModal(character);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/Secret-menU"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Character Checklist</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track your character meet-and-greets across sailings. Tap a shadow to log a meeting!
        </p>
      </div>

      {!user && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Sign in to save your progress. Without an account, your checklist won&apos;t be saved.
        </div>
      )}

      {user && loading && (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">Loading your checklist...</p>
        </div>
      )}

      {/* Character Categories */}
      {(!user || !loading) && (
        <div className="space-y-3">
          {/* Character Search */}
          <div className="relative">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  if (searchBlurTimeout.current) clearTimeout(searchBlurTimeout.current);
                  searchBlurTimeout.current = setTimeout(() => setSearchFocused(false), 150);
                }}
                placeholder="Search characters..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
              />
            </div>
            {searchFocused && searchQuery.length >= 1 && searchResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                {searchResults.map(ch => (
                  <button
                    key={ch.id}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSearchSelect(ch)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-sm text-slate-900 dark:text-white flex-1">{ch.name}</span>
                    {allMeetups.has(ch.id) && (
                      <span className="text-xs font-medium text-disney-gold">Met</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Offline banner */}
          <OfflineBanner pendingCount={pendingCount} cacheKey="character-meetups" />

          {/* Offline message */}
          {offlineMessage && (
            <div className="px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
              {offlineMessage}
            </div>
          )}

          {/* Pending uploads banner */}
          {pendingCount > 0 && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {pendingCount} meet{pendingCount !== 1 ? 's' : ''} waiting to upload
            </div>
          )}

          {/* Expand/Collapse All */}
          <div className="flex justify-end">
            <button
              onClick={toggleExpandAll}
              className="text-sm font-medium text-disney-blue dark:text-disney-gold hover:underline"
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          {categories.map(cat => {
            const catCaught = getCategoryCaughtCount(cat);
            const catTotal = getCategoryTotalCount(cat);
            const isExpanded = expandedCategories.has(cat.id);

            const colors = categoryColors[cat.color] || categoryColors.blue;

            return (
              <div key={cat.id} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden border-l-4 ${colors.border}`}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${colors.bg}`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="font-semibold text-slate-900 dark:text-white flex-1">{cat.label}</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {catCaught}/{catTotal}
                  </span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Subcategories */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700">
                    {cat.subcategories.map(sub => {
                      const subCaught = getCaughtCount(sub.characters);
                      const subExpanded = expandedSubs.has(sub.id);

                      return (
                        <div key={sub.id}>
                          {cat.subcategories.length > 1 && (
                            <button
                              onClick={() => toggleSub(sub.id)}
                              className="w-full flex items-center gap-2 px-6 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50"
                            >
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">{sub.label}</span>
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                {subCaught}/{sub.characters.length}
                              </span>
                              <svg
                                className={`w-4 h-4 text-slate-400 transition-transform ${subExpanded ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}

                          {/* Character Grid */}
                          {(cat.subcategories.length === 1 || subExpanded) && (
                            <div className="px-4 py-3 flex flex-wrap gap-3 justify-center">
                              {sub.characters.map(ch => {
                                const defaultMeetup = getDefaultMeetup(ch.id);
                                const isCaught = !!defaultMeetup;
                                const meetupCount = allMeetups.get(ch.id)?.length || 0;

                                return (
                                  <button
                                    key={ch.id}
                                    onClick={() => user && openModal(ch)}
                                    className={`flex flex-col items-center gap-1.5 w-[72px] group ${!user ? 'cursor-default' : ''}`}
                                  >
                                    {/* Bubble */}
                                    <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                                      isCaught
                                        ? 'ring-2 ring-disney-gold shadow-lg'
                                        : 'bg-slate-200 dark:bg-slate-700 opacity-50 grayscale group-hover:opacity-70'
                                    } overflow-hidden`}>
                                      {isCaught && defaultMeetup?.photo_url ? (
                                        <img
                                          src={defaultMeetup.photo_url}
                                          alt={ch.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className={isCaught
                                          ? 'text-disney-blue dark:text-disney-gold bg-disney-gold/20 dark:bg-disney-gold/10 w-full h-full flex items-center justify-center'
                                          : 'text-slate-400 dark:text-slate-500'
                                        }>
                                          {ch.name.charAt(0)}
                                        </span>
                                      )}
                                      {/* Multi-sailing badge */}
                                      {meetupCount > 1 && (
                                        <span className="absolute -top-0.5 -right-0.5 bg-disney-blue dark:bg-disney-gold text-white dark:text-disney-navy text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                          {meetupCount}
                                        </span>
                                      )}
                                    </div>
                                    {/* Name */}
                                    <span className={`text-[10px] leading-tight text-center line-clamp-2 ${
                                      isCaught
                                        ? 'text-slate-900 dark:text-white font-medium'
                                        : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                      {ch.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Progress Bar */}
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Characters Met</span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {totalCaught} / {totalCharacters}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-disney-gradient rounded-full transition-all duration-500"
                style={{ width: `${totalCharacters > 0 ? (totalCaught / totalCharacters) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-center">
              {Math.round((totalCaught / totalCharacters) * 100)}% complete
            </p>
          </div>
        </div>
      )}

      {/* Character Detail Modal */}
      {modalCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={closeModal}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{modalCharacter.name}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Existing meetups list */}
              {modalMeetups.length > 0 && !showUpload && (
                <div className="space-y-3 mb-4">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Your Meets ({modalMeetups.length})
                  </p>
                  {modalMeetups.map(meetup => (
                    <div
                      key={meetup.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        meetup.is_default
                          ? 'border-disney-gold bg-disney-gold/5 dark:bg-disney-gold/10'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Photo thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
                          {meetup.photo_url ? (
                            <img src={meetup.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Sailing info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {meetup.sailing?.ship_name || 'Unknown Ship'}
                            </p>
                            {meetup.is_default && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-disney-gold/20 text-disney-gold">
                                Display
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {meetup.sailing ? new Date(meetup.sailing.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                            {meetup.sailing?.itinerary_name ? ` — ${meetup.sailing.itinerary_name}` : ''}
                          </p>
                          {meetup.tagged_by && (
                            <p className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">Tagged by {meetup.tagged_by}</p>
                          )}
                          {meetup.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{meetup.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions row */}
                      {!meetup.tagged_by && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                          {!meetup.is_default && modalMeetups.filter(m => !m.tagged_by).length > 1 && (
                            <button
                              onClick={() => handleSetDefault(meetup.id)}
                              className="text-xs font-medium text-disney-blue dark:text-disney-gold hover:underline"
                            >
                              Set as Display
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTagMeetupId(meetup.id);
                              setTagSearch('');
                              setTagResults([]);
                            }}
                            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Tag Friend
                          </button>
                          <button
                            onClick={() => handleRemoveMeetup(meetup.id)}
                            className="text-xs font-medium text-red-500 dark:text-red-400 hover:underline ml-auto"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload section */}
              {showUpload ? (
                <div className="space-y-4">
                  {modalMeetups.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Add New Meet
                      </p>
                      <button
                        onClick={() => { setShowUpload(false); resetUploadState(); }}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Sailing Picker */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Which sailing?
                    </label>
                    {uploadSailingsLoading ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Loading sailings...</p>
                    ) : availableSailingsForUpload.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {availableSailingsForUpload.map(sailing => (
                          <button
                            key={sailing.id}
                            type="button"
                            onClick={() => setSelectedUploadSailing(sailing)}
                            className={`w-full text-left px-3 py-2 rounded-xl border transition-colors text-sm ${
                              selectedUploadSailing?.id === sailing.id
                                ? 'border-disney-blue dark:border-disney-gold bg-disney-blue/5 dark:bg-disney-gold/5'
                                : 'border-slate-200 dark:border-slate-600 hover:border-disney-blue dark:hover:border-disney-gold bg-slate-50 dark:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">&#9973;</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{sailing.ship_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(sailing.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  {sailing.itinerary_name ? ` — ${sailing.itinerary_name}` : ''}
                                </p>
                              </div>
                              {selectedUploadSailing?.id === sailing.id && (
                                <svg className="w-5 h-5 text-disney-blue dark:text-disney-gold flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {uploadSailings.length > 0
                            ? 'All your sailings already have a meet logged for this character.'
                            : 'No sailings logged yet.'}
                        </p>
                        <Link
                          href="/Secret-menU/sailing"
                          className="text-sm font-medium text-disney-blue dark:text-disney-gold hover:underline mt-1 inline-block"
                        >
                          + Log a new sailing
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Photo upload (only show after sailing selected) */}
                  {selectedUploadSailing && (
                    <>
                      <div>
                        {uploadPhotoUrl ? (
                          <div className="relative">
                            <img src={uploadPhotoUrl} alt={modalCharacter?.name} className="w-full h-48 object-cover rounded-xl" />
                            <button
                              onClick={() => setUploadPhotoUrl(null)}
                              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <ImageCropUpload
                            bucket="character-photos"
                            path={`${user!.id}/${selectedUploadSailing.id}/${modalCharacter.id}`}
                            aspect={1}
                            onUpload={(url) => setUploadPhotoUrl(url)}
                          >
                            <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-disney-blue dark:hover:border-disney-gold transition-colors bg-slate-50 dark:bg-slate-900">
                              <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-sm text-slate-500 dark:text-slate-400">Upload Photo</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">Max 20MB</span>
                            </div>
                          </ImageCropUpload>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
                        <textarea
                          value={uploadNotes}
                          onChange={e => setUploadNotes(e.target.value)}
                          maxLength={500}
                          rows={2}
                          placeholder="Where did you meet them? Any special moments?"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none"
                        />
                      </div>

                      <button
                        onClick={handleUploadSave}
                        disabled={uploadSaving}
                        className="w-full px-4 py-2.5 rounded-xl font-medium btn-disney disabled:opacity-50 text-sm"
                      >
                        {uploadSaving ? 'Saving...' : 'Caught!'}
                      </button>
                      {!isOnline && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-2">
                          You&apos;re offline. This will be saved and uploaded when you reconnect.
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                /* Add Another Meet button */
                <button
                  onClick={() => setShowUpload(true)}
                  className="w-full px-4 py-2.5 rounded-xl font-medium text-sm border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-disney-blue dark:hover:border-disney-gold hover:text-disney-blue dark:hover:text-disney-gold transition-colors"
                >
                  + Add a Meet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tag Friend Modal */}
      {tagMeetupId && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-4" onClick={() => setTagMeetupId(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tag a Friend</h3>
                <button onClick={() => setTagMeetupId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <input
                type="text"
                value={tagSearch}
                onChange={e => setTagSearch(e.target.value)}
                placeholder="Search by name or handle..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent mb-3"
                autoFocus
              />

              {tagSearching && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">Searching...</p>
              )}

              {tagResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {tagResults.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => handleTagFriend(profile.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-disney-gold flex items-center justify-center text-sm font-bold text-disney-blue">
                          {profile.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{profile.display_name}</p>
                        {profile.handle && <p className="text-xs text-slate-500 dark:text-slate-400">@{profile.handle}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {tagSearch.length >= 2 && !tagSearching && tagResults.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
