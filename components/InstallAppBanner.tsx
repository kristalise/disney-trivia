'use client';

import { useState, useEffect } from 'react';

export default function InstallAppBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('install-banner-dismissed');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 72) {
        return; // Don't show for 72 hours after dismissing
      }
    }

    // Detect platform
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroidDevice = /Android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Show banner if on mobile and not installed
    if ((isIOSDevice || isAndroidDevice) && !isInStandaloneMode) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('install-banner-dismissed', Date.now().toString());
  };

  if (!showBanner || isStandalone) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-disney-blue to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="text-4xl">📲</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Install the App!</h3>
            <p className="text-white/90 text-sm mb-4">
              Add Disney Trivia to your home screen for quick access - even works offline on the ship!
            </p>

            {isIOS && (
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-sm font-medium mb-2">On iPhone/iPad:</p>
                <ol className="text-sm space-y-2 text-white/90">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white/30 rounded flex items-center justify-center text-xs font-bold">1</span>
                    Tap the <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/30 rounded text-xs">Share <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></span> button below
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white/30 rounded flex items-center justify-center text-xs font-bold">2</span>
                    Scroll down and tap <span className="px-2 py-0.5 bg-white/30 rounded text-xs">Add to Home Screen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white/30 rounded flex items-center justify-center text-xs font-bold">3</span>
                    Tap <span className="px-2 py-0.5 bg-white/30 rounded text-xs">Add</span> in the top right
                  </li>
                </ol>
              </div>
            )}

            {isAndroid && (
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-sm font-medium mb-2">On Android:</p>
                <ol className="text-sm space-y-2 text-white/90">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white/30 rounded flex items-center justify-center text-xs font-bold">1</span>
                    Tap the <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/30 rounded text-xs">⋮ Menu</span> button
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white/30 rounded flex items-center justify-center text-xs font-bold">2</span>
                    Tap <span className="px-2 py-0.5 bg-white/30 rounded text-xs">Add to Home screen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white/30 rounded flex items-center justify-center text-xs font-bold">3</span>
                    Tap <span className="px-2 py-0.5 bg-white/30 rounded text-xs">Add</span> to confirm
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
