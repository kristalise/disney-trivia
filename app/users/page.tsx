'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  handle: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  home_port: string | null;
  favorite_ship: string | null;
  dcl_membership: string | null;
  sailing_count: number;
  review_count: number;
  follower_count: number;
  following_count: number;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'sailings', label: 'Most Sailings' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchProfiles = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: currentOffset.toString(),
        sort,
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/profiles?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();

      if (reset) {
        setProfiles(data.profiles);
        setOffset(PAGE_SIZE);
      } else {
        setProfiles(prev => [...prev, ...data.profiles]);
        setOffset(prev => prev + PAGE_SIZE);
      }
      setTotal(data.total);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset, sort, search]);

  // Refetch on sort/search change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfiles(true);
    }, search ? 300 : 0); // Debounce search
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, search]);

  const hasMore = profiles.length < total;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Community</h1>
        <p className="text-slate-600 dark:text-slate-400">Discover fellow Disney cruise enthusiasts and their sailing adventures.</p>
      </div>

      {/* Search & Sort */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
                  sort === opt.value
                    ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{total} {total === 1 ? 'member' : 'members'}{search ? ` matching "${search}"` : ''}</p>
      )}

      {/* User Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 animate-pulse">🚢</div>
          <p className="text-slate-500 dark:text-slate-400">Loading community...</p>
        </div>
      ) : profiles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map(profile => (
              <Link
                key={profile.id}
                href={`/profile/${profile.handle || profile.id}`}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-blue dark:hover:border-disney-gold transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-3">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-disney-gold flex items-center justify-center text-lg font-bold text-disney-blue">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{profile.display_name}</h3>
                    {profile.dcl_membership && (
                      <span className="text-xs text-disney-gold">{profile.dcl_membership}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg py-2">
                    <div className="font-bold text-slate-900 dark:text-white">{profile.sailing_count}</div>
                    <div className="text-slate-500 dark:text-slate-400">sailings</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg py-2">
                    <div className="font-bold text-slate-900 dark:text-white">{profile.review_count}</div>
                    <div className="text-slate-500 dark:text-slate-400">reviews</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg py-2">
                    <div className="font-bold text-slate-900 dark:text-white">{profile.follower_count}</div>
                    <div className="text-slate-500 dark:text-slate-400">followers</div>
                  </div>
                </div>

                {profile.favorite_ship && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">🚢 {profile.favorite_ship}</p>
                )}
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => fetchProfiles(false)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl font-medium btn-disney disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-slate-500 dark:text-slate-400">
            {search ? `No members found matching "${search}"` : 'No community members yet. Be the first!'}
          </p>
        </div>
      )}
    </div>
  );
}
