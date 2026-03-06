'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/components/AuthProvider';

export default function QRCodeButton() {
  const { user, session } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [handle, setHandle] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/profiles/${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.profile) {
          setHandle(data.profile.handle);
          setDisplayName(data.profile.display_name);
          setAvatarUrl(data.profile.avatar_url);
        }
      })
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const profilePath = `/profile/${handle || user.id}`;
  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${profilePath}`
    : profilePath;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        title="Show QR Code"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center mb-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover mb-2" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-disney-gold flex items-center justify-center text-2xl font-bold text-disney-blue mb-2">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{displayName}</h3>
                {handle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">@{handle}</p>
                )}
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCodeSVG
                  value={fullUrl}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0c1445"
                />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Scan to view profile and follow
              </p>

              {/* Shareable profile link */}
              <div className="flex items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                <span className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate text-left select-all">
                  {fullUrl}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(fullUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors border border-slate-200 dark:border-slate-500"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.share({
                        title: `${displayName} on Disney Trivia`,
                        text: `Check out ${displayName}'s cruise profile!`,
                        url: fullUrl,
                      }).catch(() => {});
                    }}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors border border-slate-200 dark:border-slate-500"
                    title="Share"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
