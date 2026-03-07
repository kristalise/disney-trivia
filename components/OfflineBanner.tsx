'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getCachedData, clearCache } from '@/lib/offline-store';

interface OfflineBannerProps {
  pendingCount?: number;
  isSyncing?: boolean;
  cacheKey?: string;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function OfflineBanner({ pendingCount = 0, isSyncing = false, cacheKey }: OfflineBannerProps) {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  // Reset dismissed state when online status changes
  useEffect(() => {
    setDismissed(false);
  }, [isOnline]);

  // Get last updated timestamp from cache
  useEffect(() => {
    if (cacheKey) {
      getCachedData(cacheKey).then(entry => {
        if (entry) setLastUpdated(entry.timestamp);
      }).catch(() => {});
    }
  }, [cacheKey, isOnline]);

  const handleClearAndRefresh = useCallback(async () => {
    setClearing(true);
    try {
      await clearCache();
      // Also clear SW caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }, []);

  if (isOnline) return null;
  if (dismissed) return null;

  return (
    <div className="rounded-xl border px-4 py-3 mb-4 text-sm bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="font-medium">You&apos;re offline</p>
          {pendingCount > 0 ? (
            <p>{pendingCount} change{pendingCount !== 1 ? 's' : ''} will sync when reconnected</p>
          ) : (
            <p>Changes will sync when reconnected</p>
          )}
          {lastUpdated && (
            <p className="text-xs mt-1 opacity-75">
              Last updated: {formatTimestamp(lastUpdated)}
            </p>
          )}
          {pendingCount > 0 && (
            <p className="text-xs mt-1 text-amber-600 dark:text-amber-400 font-medium">
              Don&apos;t clear cache while you have pending changes — your queued reviews and edits are stored separately and won&apos;t be lost, but cached page data will need to reload.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleClearAndRefresh}
            disabled={clearing}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50"
            title="Clear cached data and reload"
          >
            {clearing ? 'Clearing...' : 'Clear Cache'}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-current opacity-50 hover:opacity-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
