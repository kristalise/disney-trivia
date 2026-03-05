'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import AuthModal from './AuthModal';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userHandle, setUserHandle] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setUserHandle(null); return; }
    fetch(`/api/profiles/${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.profile?.handle) setUserHandle(data.profile.handle); })
      .catch(() => {});
  }, [user]);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/quiz', label: 'Quiz' },
    { href: '/Secret-menU', label: 'Cruise Guide', mobileLabel: 'Guide' },
    { href: '/search', label: 'Search' },
    { href: '/contribute', label: 'Contribute', hideOnMobile: true },
    { href: '/progress', label: 'Progress', hideOnMobile: true },
    { href: '/users', label: 'Community' },
  ];

  const openLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const openSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <>
      <nav className="bg-disney-gradient sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icons/icon-72x72.png"
                alt="Disney Trivia"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-white font-bold text-xl hidden sm:inline">Disney Trivia</span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }${item.hideOnMobile ? ' hidden sm:inline-flex' : ''}`}
                  >
                    {item.mobileLabel ? (
                      <>
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden">{item.mobileLabel}</span>
                      </>
                    ) : (
                      item.label
                    )}
                  </Link>
                );
              })}

              {/* Auth Section */}
              {!loading && (
                <div className="ml-2 relative">
                  {user ? (
                    <>
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-disney-gold flex items-center justify-center text-disney-blue font-bold text-sm">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg py-2 z-50">
                          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {user.email}
                            </p>
                          </div>
                          <Link
                            href={`/profile/${userHandle || user.id}`}
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            My Profile
                          </Link>
                          <Link
                            href="/friends"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            Friends
                          </Link>
                          <Link
                            href="/progress"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            My Progress
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            Sign Out
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openLogin}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={openSignup}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-disney-gold text-disney-blue hover:bg-yellow-400 transition-colors hidden sm:block"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Close user menu when clicking outside */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </>
  );
}
