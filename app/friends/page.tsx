'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import QRCodeButton from '@/components/QRCodeButton';
import { getCastawayLevel } from '@/lib/castaway-levels';

interface FriendProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string | null;
  bio: string | null;
  sailing_count?: number;
}

interface MetOnShipRecord {
  id: string;
  other_user_id: string;
  ship_name: string;
  sail_date_overlap_start: string;
  sail_date_overlap_end: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
    handle: string | null;
  } | null;
}

interface FrequentCompanion {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string | null;
  shared_count: number;
}

type Tab = 'friends' | 'met' | 'companions';

function Avatar({ url, name, size = 'md' }: { url: string | null; name: string; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-sm';
  if (url) {
    return <img src={url} alt={name} className={`${cls} rounded-full object-cover`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-disney-gold flex items-center justify-center font-bold text-disney-blue`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function FriendsPage() {
  const { user, session } = useAuth();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [metOnShip, setMetOnShip] = useState<MetOnShipRecord[]>([]);
  const [companions, setCompanions] = useState<FrequentCompanion[]>([]);
  const [loading, setLoading] = useState(true);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user || !session?.access_token || hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);

    fetch('/api/friends', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        setFriends(data.friends ?? []);
        setMetOnShip(data.met_on_ship ?? []);
        setCompanions(data.frequent_companions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, session?.access_token]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-4xl mb-4">👋</div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Friends</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-4">Sign in to see your friends and people you&apos;ve met on ship.</p>
        <Link href="/auth" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Sign In</Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'friends', label: 'Friends', count: friends.length },
    { key: 'met', label: 'Met on Ship', count: metOnShip.length },
    { key: 'companions', label: 'Travel Companions', count: companions.length },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/profile/${user.id}`} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          My Profile
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Friends</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">People you&apos;ve connected with.</p>
          </div>
          <QRCodeButton />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 animate-pulse">👋</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      ) : (
        <>
          {/* Friends Tab */}
          {tab === 'friends' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
              {friends.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {friends.map(friend => (
                    <Link
                      key={friend.id}
                      href={`/profile/${friend.handle || friend.id}`}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Avatar url={friend.avatar_url} name={friend.display_name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{friend.display_name}</p>
                        {friend.handle && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">@{friend.handle}</p>
                        )}
                        {(() => {
                          const castaway = getCastawayLevel(friend.sailing_count ?? 0);
                          const castawayStyles: Record<string, string> = {
                            pearl: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
                            platinum: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                            gold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                            silver: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                            none: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
                          };
                          return (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${castawayStyles[castaway.level]}`}>
                              {castaway.emoji} {castaway.label} Castaway
                            </span>
                          );
                        })()}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        Friend
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="text-4xl mb-3">👋</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    No friends yet. Friends are mutual follows — follow someone and have them follow you back!
                  </p>
                  <Link href="/users" className="inline-block px-4 py-2 rounded-xl text-sm font-medium btn-disney">
                    Browse Community
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Met on Ship Tab */}
          {tab === 'met' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
              {metOnShip.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {metOnShip.map(record => (
                    <Link
                      key={record.id}
                      href={`/profile/${record.profile?.handle || record.other_user_id}`}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Avatar
                        url={record.profile?.avatar_url ?? null}
                        name={record.profile?.display_name ?? '?'}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {record.profile?.display_name ?? 'Unknown User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {record.ship_name} &middot;{' '}
                          {new Date(record.sail_date_overlap_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {new Date(record.sail_date_overlap_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-lg" title="Met on Ship">🚢</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="text-4xl mb-3">🚢</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No shipboard connections yet. When you mutually follow someone who was on the same sailing, they&apos;ll appear here automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Travel Companions Tab */}
          {tab === 'companions' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
              {companions.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {companions.map(companion => (
                    <Link
                      key={companion.id}
                      href={`/profile/${companion.handle || companion.id}`}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Avatar url={companion.avatar_url} name={companion.display_name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{companion.display_name}</p>
                        {companion.handle && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">@{companion.handle}</p>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold">
                        {companion.shared_count} {companion.shared_count === 1 ? 'sailing' : 'sailings'}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="text-4xl mb-3">⚓</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No travel companions found. Add companions to your sailings to see them here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chat link */}
          <Link
            href="/friends/chat"
            className="block mt-6 text-center px-6 py-3 rounded-2xl font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            💬 Chat (Coming Soon)
          </Link>
        </>
      )}
    </div>
  );
}
