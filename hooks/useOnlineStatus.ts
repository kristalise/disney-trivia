'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const PROBE_TIMEOUT = 3000;
const PROBE_COOLDOWN = 30_000;
const PERIODIC_INTERVAL = 60_000;

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const lastProbeRef = useRef(0);
  const periodicRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const probe = useCallback(async () => {
    const now = Date.now();
    if (now - lastProbeRef.current < PROBE_COOLDOWN) return;
    lastProbeRef.current = now;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT);

    try {
      const res = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      setIsOnline(res.ok);
    } catch {
      setIsOnline(false);
    } finally {
      clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Initial state
    if (!navigator.onLine) {
      setIsOnline(false);
    } else {
      probe();
    }

    const goOffline = () => setIsOnline(false);
    const goOnline = () => {
      // Don't trust navigator.onLine alone — probe to confirm
      probe();
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Periodic re-probe while "online" to catch silent drops
    periodicRef.current = setInterval(() => {
      if (navigator.onLine) probe();
    }, PERIODIC_INTERVAL);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(periodicRef.current);
    };
  }, [probe]);

  return isOnline;
}
