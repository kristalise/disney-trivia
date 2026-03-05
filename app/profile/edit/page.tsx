'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import ImageCropUpload from '@/components/ImageCropUpload';
import sailingData from '@/data/sailing-data.json';

const SHIPS = [
  'Disney Magic', 'Disney Wonder', 'Disney Dream', 'Disney Fantasy',
  'Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure',
] as const;

// Derive unique ports from sailing data
const allPorts = [...new Set([
  ...sailingData.itineraries.map(it => it.embarkationPort),
  ...sailingData.itineraries.map(it => it.disembarkationPort),
])].sort();

export default function EditProfilePage() {
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [homePort, setHomePort] = useState('');
  const [favoriteShip, setFavoriteShip] = useState('');
  const [showTriviaStats, setShowTriviaStats] = useState(true);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  // Fetch current profile
  useEffect(() => {
    if (!user) return;
    fetch(`/api/profiles/${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.profile) {
          setHandle(data.profile.handle || '');
          setDisplayName(data.profile.display_name || '');
          setBio(data.profile.bio || '');
          setHomePort(data.profile.home_port || '');
          setFavoriteShip(data.profile.favorite_ship || '');
          setShowTriviaStats(data.profile.show_trivia_stats ?? true);
          setInstagramUrl(data.profile.instagram_url || '');
          setTiktokUrl(data.profile.tiktok_url || '');
          setYoutubeUrl(data.profile.youtube_url || '');
          setFacebookUrl(data.profile.facebook_url || '');
          setAvatarUrl(data.profile.avatar_url);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    if (handle && !/^[a-z0-9_]{3,30}$/.test(handle)) {
      setError('Handle must be 3-30 characters, lowercase letters, numbers, and underscores only.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/profiles/${user!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          display_name: displayName,
          handle: handle || undefined,
          bio: bio || null,
          home_port: homePort || null,
          favorite_ship: favoriteShip || null,
          show_trivia_stats: showTriviaStats,
          avatar_url: avatarUrl,
          instagram_url: instagramUrl || null,
          tiktok_url: tiktokUrl || null,
          youtube_url: youtubeUrl || null,
          facebook_url: facebookUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save profile');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const selectCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href={`/profile/${handle || user.id}`} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          My Profile
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Edit Profile</h1>
        <p className="text-slate-600 dark:text-slate-400">Update your cruise persona and public profile.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6 space-y-5">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-disney-gold flex items-center justify-center text-xl font-bold text-disney-blue">
                  {displayName.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <ImageCropUpload
                  bucket="avatars"
                  path={`${user.id}/avatar`}
                  aspect={1}
                  onUpload={(url) => setAvatarUrl(url)}
                >
                  <span className="cursor-pointer px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    Choose Photo
                  </span>
                </ImageCropUpload>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Max 20MB. JPG, PNG, or WebP.</p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Display Name *</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your display name"
              className={selectCls}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{displayName.length}/50</p>
          </div>

          {/* Handle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Handle</label>
            <div className="flex items-center">
              <span className="text-slate-400 dark:text-slate-500 mr-1">@</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={30}
                placeholder="your_handle"
                className={selectCls}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">3-30 characters. Lowercase letters, numbers, and underscores only. {handle.length}/30</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell us about your Disney cruise adventures..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{bio.length}/500</p>
          </div>

          {/* Home Port */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Home Port</label>
            <select value={homePort} onChange={(e) => setHomePort(e.target.value)} className={selectCls}>
              <option value="">Select your home port...</option>
              {allPorts.map(port => <option key={port} value={port}>{port}</option>)}
            </select>
          </div>

          {/* Favorite Ship */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Favorite Ship</label>
            <select value={favoriteShip} onChange={(e) => setFavoriteShip(e.target.value)} className={selectCls}>
              <option value="">Select your favorite ship...</option>
              {SHIPS.map(ship => <option key={ship} value={ship}>{ship}</option>)}
            </select>
          </div>

          {/* Social Media */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Social Media</label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2" /><circle cx="12" cy="12" r="4.5" stroke="#E1306C" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.25" fill="#E1306C" /></svg>
                <input type="url" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/yourhandle" className={selectCls} />
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#010101"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.72a8.18 8.18 0 004.77 1.52V6.79a4.84 4.84 0 01-1-.1z" /></svg>
                <input type="url" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@yourhandle" className={selectCls} />
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/@yourchannel" className={selectCls} />
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                <input type="url" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/yourpage" className={selectCls} />
              </div>
            </div>
          </div>

          {/* Show Trivia Stats Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Show Trivia Stats</label>
              <p className="text-xs text-slate-400 dark:text-slate-500">Let others see your quiz performance on your profile</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTriviaStats(!showTriviaStats)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                showTriviaStats ? 'bg-disney-blue dark:bg-disney-gold' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showTriviaStats ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4">{error}</div>}
        {success && <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3 mb-4">Profile updated successfully!</div>}

        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
