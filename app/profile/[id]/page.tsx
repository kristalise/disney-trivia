'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { fetchUserProgress } from '@/lib/progress';
import SocialIcons from '@/components/SocialIcons';
import QRCodeButton from '@/components/QRCodeButton';

const SHIP_LOGOS: Record<string, string> = {
  'Disney Magic': '/ship-logos/magic.png',
  'Disney Wonder': '/ship-logos/wonder.png',
  'Disney Dream': '/ship-logos/dream.png',
  'Disney Fantasy': '/ship-logos/fantasy.png',
  'Disney Wish': '/ship-logos/wish.png',
  'Disney Treasure': '/ship-logos/treasure.png',
  'Disney Destiny': '/ship-logos/destiny.png',
  'Disney Adventure': '/ship-logos/adventure.png',
};

const SHIP_ORDER = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
];

interface Profile {
  id: string;
  handle: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  home_port: string | null;
  favorite_ship: string | null;
  dcl_membership: string | null;
  show_trivia_stats: boolean;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  xiaohongshu_url?: string | null;
  created_at: string;
}

interface Companion {
  companion_id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string | null;
}

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
  embarkation_port: string;
  ports_of_call: string | null;
  stateroom_numbers: number[] | null;
  num_pax: number | null;
  cost_per_pax: number | null;
  overall_rating: number | null;
  service_rating: number | null;
  entertainment_rating: number | null;
  food_rating: number | null;
  review_text: string | null;
  created_at: string;
  companions?: Companion[];
}

interface RecentReview {
  id: string;
  type: 'dining' | 'activity' | 'hack' | 'stateroom';
  ship_name: string;
  rating?: number;
  stateroom_rating?: number;
  restaurant_id?: string;
  activity_id?: string;
  title?: string;
  verdict?: string;
  category?: string;
  stateroom_number?: number;
  created_at: string;
}

interface FollowProfile {
  id: string;
  handle: string | null;
  display_name: string;
  avatar_url: string | null;
}

interface Stats {
  total_sailings: number;
  unique_ships: number;
  unique_ports: number;
  avg_rating: number | null;
  total_reviews: number;
  review_counts: {
    sailing: number;
    stateroom: number;
    dining: number;
    activity: number;
    hacks: number;
  };
}

interface TriviaStats {
  questionsAnswered: number;
  correctAnswers: number;
  quizSessions: Array<{
    categorySlug: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }>;
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${cls} ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ url, name, size = 'lg' }: { url: string | null; name: string; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-8 h-8 text-sm';
  if (url) {
    return <img src={url} alt={name} className={`${cls} rounded-full object-cover`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-disney-gold flex items-center justify-center font-bold text-disney-blue`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const REVIEW_TYPE_EMOJI: Record<string, string> = {
  dining: '🍽',
  activity: '🎭',
  hack: '🏴‍☠️',
  stateroom: '🛏',
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, session } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sailings, setSailings] = useState<Sailing[]>([]);
  const [followers, setFollowers] = useState<FollowProfile[]>([]);
  const [following, setFollowing] = useState<FollowProfile[]>([]);
  const [friends, setFriends] = useState<FollowProfile[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [triviaStats, setTriviaStats] = useState<TriviaStats | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shipFilter, setShipFilter] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [avatarTapCount, setAvatarTapCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const isOwnProfile = user?.id === profile?.id;

  // Derive unique ships the user has sailed on, in canonical order
  const sailedShips = useMemo(() => {
    const shipSet = new Set(sailings.map(s => s.ship_name));
    return SHIP_ORDER.filter(ship => shipSet.has(ship));
  }, [sailings]);

  // Filtered sailings based on selected ship badge
  const filteredSailings = useMemo(() => {
    if (!shipFilter) return sailings;
    return sailings.filter(s => s.ship_name === shipFilter);
  }, [sailings, shipFilter]);

  const todayStart = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const currentlySailing = useMemo(() => {
    return filteredSailings.filter(s => {
      const start = new Date(s.sail_start_date + 'T00:00:00');
      const end = new Date(s.sail_end_date + 'T23:59:59');
      return start <= now && end >= todayStart;
    });
  }, [filteredSailings, now, todayStart]);

  const upcomingSailings = useMemo(() => {
    return filteredSailings
      .filter(s => new Date(s.sail_start_date + 'T00:00:00') > now)
      .sort((a, b) => new Date(a.sail_start_date).getTime() - new Date(b.sail_start_date).getTime());
  }, [filteredSailings, now]);

  const pastSailings = useMemo(() => {
    return filteredSailings
      .filter(s => new Date(s.sail_end_date + 'T23:59:59') < todayStart)
      .sort((a, b) => new Date(b.sail_end_date).getTime() - new Date(a.sail_end_date).getTime());
  }, [filteredSailings, todayStart]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/profiles/${id}`);
      if (res.status === 404) {
        // Auto-create profile if viewing own profile and it doesn't exist
        if (user && session?.access_token) {
          const createRes = await fetch('/api/profiles', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              display_name: user.email?.split('@')[0] || 'User',
            }),
          });
          if (createRes.ok) {
            // Retry fetching the profile
            const retryRes = await fetch(`/api/profiles/${id}`);
            if (retryRes.ok) {
              const data = await retryRes.json();
              setProfile(data.profile);
              setStats(data.stats);
              setSailings(data.sailings);
              setFollowers(data.followers);
              setFollowing(data.following);
              setFriends(data.friends ?? []);
              setFollowerCount(data.follower_count);
              setFollowingCount(data.following_count);
              setFriendCount(data.friend_count ?? 0);
              setRecentReviews(data.recent_reviews);
              return;
            }
          }
        }
        setNotFound(true);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data.profile);
      setStats(data.stats);
      setSailings(data.sailings);
      setFollowers(data.followers);
      setFollowing(data.following);
      setFriends(data.friends ?? []);
      setFollowerCount(data.follower_count);
      setFollowingCount(data.following_count);
      setFriendCount(data.friend_count ?? 0);
      setRecentReviews(data.recent_reviews);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id, user, session]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch companions for each sailing
  useEffect(() => {
    if (sailings.length === 0) return;
    const fetchCompanions = async () => {
      const results = await Promise.all(
        sailings.map(async (s) => {
          try {
            const res = await fetch(`/api/sailing-companions?sailing_id=${s.id}`);
            if (res.ok) {
              const data = await res.json();
              return { sailingId: s.id, companions: data.companions ?? [] };
            }
          } catch { /* ignore */ }
          return { sailingId: s.id, companions: [] };
        })
      );
      setSailings(prev => prev.map(s => {
        const match = results.find(r => r.sailingId === s.id);
        return match ? { ...s, companions: match.companions } : s;
      }));
    };
    fetchCompanions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sailings.length]);

  // Check if current user is friends with this profile
  useEffect(() => {
    if (user && !isOwnProfile) {
      setIsFriend(friends.some(f => f.id === user.id));
    }
  }, [user, isOwnProfile, friends]);

  // Fetch trivia stats for own profile
  useEffect(() => {
    if (isOwnProfile) {
      fetchUserProgress().then(data => {
        if (data) setTriviaStats(data);
      });
    }
  }, [isOwnProfile]);

  const handleFriendToggle = async () => {
    if (!user || !session?.access_token) return;
    setFollowLoading(true);
    try {
      const res = await fetch('/api/follows', {
        method: isFriend ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ following_id: profile?.id, mutual: true }),
      });
      if (res.ok) {
        const msg = isFriend ? 'Friend removed' : 'Friend added!';
        setIsFriend(!isFriend);
        setFriendMessage(msg);
        setTimeout(() => setFriendMessage(null), 3000);
        fetchProfile();
      }
    } catch { /* ignore */ } finally {
      setFollowLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-4xl mb-4 animate-pulse">🚢</div>
        <p className="text-slate-500 dark:text-slate-400">Loading profile...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Profile Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-4">This user profile doesn&apos;t exist.</p>
        <Link href="/users" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Browse Users</Link>
      </div>
    );
  }

  const showTriviaSection = isOwnProfile || (profile.show_trivia_stats && triviaStats);
  const triviaAccuracy = triviaStats
    ? triviaStats.questionsAnswered > 0
      ? Math.round((triviaStats.correctAnswers / triviaStats.questionsAnswered) * 100)
      : 0
    : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back nav */}
      <div className="mb-6">
        <Link href="/Secret-menU" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
      </div>

      {/* Profile Header — Instagram style */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        {/* Top row: avatar + stats */}
        <div className="flex items-center gap-5 mb-4">
          <div
            className="cursor-pointer select-none"
            onClick={() => {
              if (!isOwnProfile) return;
              const next = avatarTapCount + 1;
              setAvatarTapCount(next);
              if (next >= 5) {
                localStorage.setItem('secret-menu-unlocked', 'true');
                router.push('/Secret-menU');
              }
            }}
          >
            <Avatar url={profile.avatar_url} name={profile.display_name} size="lg" />
          </div>
          <div className="flex-1 grid grid-cols-4 gap-1 text-center">
            {stats && (
              <>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.total_sailings}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Sailings</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.unique_ships}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Ships</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.total_reviews}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Reviews</div>
                </div>
              </>
            )}
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{friendCount}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{friendCount === 1 ? 'Friend' : 'Friends'}</div>
            </div>
          </div>
        </div>

        {/* Name, handle, location */}
        <div className="mb-3">
          <h1 className="text-base font-bold text-slate-900 dark:text-white">{profile.display_name}</h1>
          {profile.handle && (
            <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.handle}</p>
          )}
          <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
            {profile.home_port && <span>📍 {profile.home_port}</span>}
            {profile.favorite_ship && <span>🚢 {profile.favorite_ship}</span>}
          </div>
          {profile.dcl_membership && (
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-disney-gold/20 text-disney-gold dark:bg-disney-gold/30">
              {profile.dcl_membership}
            </span>
          )}
        </div>

        {profile.bio && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{profile.bio}</p>
        )}

        <SocialIcons instagramUrl={profile.instagram_url} tiktokUrl={profile.tiktok_url} youtubeUrl={profile.youtube_url} facebookUrl={profile.facebook_url} xiaohongshuUrl={profile.xiaohongshu_url} size="md" />

        <div className="mt-4" />

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {isOwnProfile ? (
            <>
              <Link href="/profile/edit" className="flex-1 text-center px-4 py-2 rounded-xl font-medium text-sm btn-disney">
                Edit Profile
              </Link>
              <Link href="/Secret-menU/sailing" className="flex-1 text-center px-4 py-2 rounded-xl font-medium text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                + Log Sailing
              </Link>
              <QRCodeButton />
            </>
          ) : user ? (
            <div className="flex-1">
              <button
                onClick={handleFriendToggle}
                disabled={followLoading}
                className={`w-full px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                  isFriend
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                    : 'btn-disney'
                }`}
              >
                {followLoading ? '...' : isFriend ? 'Friends' : 'Add Friend'}
              </button>
              {friendMessage && (
                <p className="text-xs text-center text-green-600 dark:text-green-400 mt-1">{friendMessage}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Friends button for own profile */}
        {isOwnProfile && (
          <Link
            href="/friends"
            className="block mt-3 w-full text-center px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            View Friends &amp; Connections
          </Link>
        )}
      </div>

      {/* Ship Badges — Instagram story style */}
      {isOwnProfile && sailedShips.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {sailedShips.map(ship => {
            const isActive = shipFilter === ship;
            const shortName = ship.replace('Disney ', '');
            return (
              <button
                key={ship}
                onClick={() => setShipFilter(isActive ? null : ship)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              >
                <div className={`w-[72px] h-[72px] rounded-full p-[3px] transition-all ${
                  isActive
                    ? 'bg-gradient-to-tr from-disney-blue via-disney-gold to-disney-blue'
                    : 'bg-gradient-to-tr from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-500 group-hover:from-disney-blue/60 group-hover:via-disney-gold/60 group-hover:to-disney-blue/60'
                }`}>
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 p-[3px] flex items-center justify-center overflow-hidden">
                    <img
                      src={SHIP_LOGOS[ship]}
                      alt={ship}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <span className={`text-[11px] font-medium text-center leading-tight transition-colors ${
                  isActive
                    ? 'text-disney-blue dark:text-disney-gold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {shortName}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Currently Sailing */}
      {isOwnProfile && currentlySailing.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Currently Sailing</h2>
          <div className="space-y-4">
            {currentlySailing.map((sailing) => (
              <div key={sailing.id} onClick={() => router.push(`/planner?sailing=${sailing.id}`)} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-2 px-2 py-2 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{sailing.ship_name}</h3>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    On Board
                  </span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(sailing.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' - '}
                  {new Date(sailing.sail_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {sailing.itinerary_name && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 mt-1">{sailing.itinerary_name}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2 mt-1">
                  <span>From {sailing.embarkation_port}</span>
                  {sailing.ports_of_call && <span>via {sailing.ports_of_call}</span>}
                  {sailing.stateroom_numbers && sailing.stateroom_numbers.length > 0 && (
                    <span>Room{sailing.stateroom_numbers.length > 1 ? 's' : ''} {sailing.stateroom_numbers.join(', ')}</span>
                  )}
                  {sailing.num_pax && <span>{sailing.num_pax} pax</span>}
                </div>
                {isOwnProfile && (
                  <span className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-xl text-sm font-medium btn-disney">
                    Plan Your Day
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
                {sailing.companions && sailing.companions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-slate-500 dark:text-slate-400 self-center mr-1">Sailing with:</span>
                    {sailing.companions.map((c) => (
                      <Link key={c.companion_id} href={`/profile/${c.handle || c.companion_id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-disney-gold flex items-center justify-center text-[10px] font-bold text-disney-blue">
                            {c.display_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.display_name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sailings */}
      {isOwnProfile && upcomingSailings.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Upcoming Sailings
              {shipFilter && (
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                  ({upcomingSailings.length} on {shipFilter.replace('Disney ', '')})
                </span>
              )}
            </h2>
            {shipFilter && (
              <button onClick={() => setShipFilter(null)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline">
                Show all
              </button>
            )}
          </div>
          <div className="space-y-4">
            {upcomingSailings.map((sailing) => {
              const startMidnight = new Date(sailing.sail_start_date + 'T00:00:00');
              const todayMid = new Date(now);
              todayMid.setHours(0, 0, 0, 0);
              const calendarDays = Math.round((startMidnight.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));
              const countdown = calendarDays > 1 ? `${calendarDays} days to go` : calendarDays === 1 ? '1 day to go' : 'Tomorrow';
              return (
                <div key={sailing.id} onClick={() => router.push(`/planner?sailing=${sailing.id}`)} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-2 px-2 py-2 rounded-xl transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{sailing.ship_name}</h3>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {countdown}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(sailing.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {new Date(sailing.sail_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {sailing.itinerary_name && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 mt-1">{sailing.itinerary_name}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2 mt-1">
                    <span>From {sailing.embarkation_port}</span>
                    {sailing.ports_of_call && <span>via {sailing.ports_of_call}</span>}
                    {sailing.stateroom_numbers && sailing.stateroom_numbers.length > 0 && (
                      <span>Room{sailing.stateroom_numbers.length > 1 ? 's' : ''} {sailing.stateroom_numbers.join(', ')}</span>
                    )}
                    {sailing.num_pax && <span>{sailing.num_pax} pax</span>}
                  </div>
                  {isOwnProfile && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Plan Your Trip
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                  {sailing.companions && sailing.companions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-slate-500 dark:text-slate-400 self-center mr-1">Sailing with:</span>
                      {sailing.companions.map((c) => (
                        <Link key={c.companion_id} href={`/profile/${c.handle || c.companion_id}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                          {c.avatar_url ? (
                            <img src={c.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-disney-gold flex items-center justify-center text-[10px] font-bold text-disney-blue">
                              {c.display_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.display_name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Sailings */}
      {isOwnProfile && pastSailings.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Past Sailings
              {shipFilter && (
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                  ({pastSailings.length} on {shipFilter.replace('Disney ', '')})
                </span>
              )}
            </h2>
            {shipFilter && (
              <button onClick={() => setShipFilter(null)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline">
                Show all
              </button>
            )}
          </div>
          <div className="space-y-4">
            {pastSailings.map((sailing) => (
              <div key={sailing.id} onClick={() => router.push(`/Secret-menU/sailing/${sailing.id}/review`)} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-2 px-2 py-2 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{sailing.ship_name}</h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(sailing.sail_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {new Date(sailing.sail_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {sailing.itinerary_name && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{sailing.itinerary_name}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span>From {sailing.embarkation_port}</span>
                  {sailing.ports_of_call && <span>via {sailing.ports_of_call}</span>}
                  {sailing.stateroom_numbers && sailing.stateroom_numbers.length > 0 && (
                    <span>Room{sailing.stateroom_numbers.length > 1 ? 's' : ''} {sailing.stateroom_numbers.join(', ')}</span>
                  )}
                  {sailing.num_pax && <span>{sailing.num_pax} pax</span>}
                  {sailing.cost_per_pax != null && <span>${Number(sailing.cost_per_pax).toLocaleString()}/pax</span>}
                </div>
                {sailing.overall_rating != null ? (
                  <>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={sailing.overall_rating} size="sm" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Overall</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {sailing.service_rating != null && <span>Service: {sailing.service_rating}/5</span>}
                      {sailing.entertainment_rating != null && <span>Entertainment: {sailing.entertainment_rating}/5</span>}
                      {sailing.food_rating != null && <span>Food: {sailing.food_rating}/5</span>}
                    </div>
                  </>
                ) : isOwnProfile ? (
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mt-1">
                    How was this sailing? Add your review!
                  </span>
                ) : (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    Not yet reviewed
                  </span>
                )}
                {sailing.companions && sailing.companions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-slate-500 dark:text-slate-400 self-center mr-1">Sailed with:</span>
                    {sailing.companions.map((c) => (
                      <Link key={c.companion_id} href={`/profile/${c.handle || c.companion_id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-disney-gold flex items-center justify-center text-[10px] font-bold text-disney-blue">
                            {c.display_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.display_name}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {sailing.review_text && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{sailing.review_text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {isOwnProfile && recentReviews.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Reviews</h2>
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <div key={`${review.type}-${review.id}`} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className="text-lg">{REVIEW_TYPE_EMOJI[review.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {review.type === 'dining' && review.restaurant_id}
                    {review.type === 'activity' && review.activity_id}
                    {review.type === 'hack' && review.title}
                    {review.type === 'stateroom' && `Stateroom #${review.stateroom_number}`}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{review.ship_name}</span>
                    {review.verdict && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        review.verdict === 'Must Try' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        review.verdict === 'Worth It' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>{review.verdict}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {(review.rating || review.stateroom_rating) && (
                    <StarDisplay rating={review.rating || review.stateroom_rating || 0} size="sm" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trivia Stats */}
      {showTriviaSection && triviaStats && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Trivia Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{triviaAccuracy}%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{triviaStats.quizSessions.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Quizzes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{triviaStats.questionsAnswered}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Questions</div>
            </div>
          </div>
        </div>
      )}

      {/* Friends */}
      {friends.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Friends</h3>
          <div className="flex flex-wrap gap-2">
            {friends.slice(0, 20).map(f => (
              <Link key={f.id} href={`/profile/${f.handle || f.id}`} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <Avatar url={f.avatar_url} name={f.display_name} size="sm" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{f.display_name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
