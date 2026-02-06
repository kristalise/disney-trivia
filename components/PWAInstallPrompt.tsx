'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt after a delay if on iOS and not installed
    if (isIOSDevice && !isInStandaloneMode && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed, dismissed, or no prompt available
  if (isStandalone || dismissed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-disney-gradient p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="text-3xl">✨</div>
            <div>
              <h3 className="font-bold text-lg">Install Disney Trivia</h3>
              <p className="text-sm opacity-90">Add to your home screen for quick access</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4">
          {isIOS ? (
            // iOS Instructions
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Install this app on your iPhone for the best experience:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Tap the Share button
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="inline-block w-5 h-5 text-center bg-slate-200 dark:bg-slate-700 rounded">↑</span> at the bottom of Safari
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Scroll and tap &quot;Add to Home Screen&quot;
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="inline-block px-1 bg-slate-200 dark:bg-slate-700 rounded">+</span> icon with text
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Tap &quot;Add&quot; in the top right
                    </p>
                    <p className="text-xs text-slate-500">
                      The app will appear on your home screen
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> Your progress is saved on this device until you clear your cache.{' '}
                  <a
                    href="https://forms.gle/B4vdr3fw7Lu58uDx5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-600 dark:hover:text-amber-200"
                  >
                    Request login feature
                  </a>{' '}
                  to sync across devices.
                </p>
              </div>
            </div>
          ) : (
            // Android/Desktop Instructions
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Get quick access to Disney trivia anytime, even offline!
              </p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Works offline
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Quick launch from home screen
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Full-screen experience
                </li>
              </ul>
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> Your progress is saved on this device until you clear your cache.{' '}
                  <a
                    href="https://forms.gle/B4vdr3fw7Lu58uDx5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-600 dark:hover:text-amber-200"
                  >
                    Request login feature
                  </a>{' '}
                  to sync across devices.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 rounded-xl font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Maybe Later
          </button>
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-3 rounded-xl font-medium btn-disney"
            >
              Install App
            </button>
          )}
          {isIOS && (
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 rounded-xl font-medium btn-disney"
            >
              Got It!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
