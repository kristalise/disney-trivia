'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPendingMutations, removeMutation, updateMutation, getPendingMutationCount, getPendingUploads, removePendingUpload, getPendingCount } from '@/lib/offline-store';
import { getAuthClient } from '@/lib/auth';

const MAX_RETRIES = 5;

export function useOfflineSync(accessToken: string | undefined, userId: string | undefined) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const [mutations, uploads] = await Promise.all([
        getPendingMutationCount(),
        getPendingCount(),
      ]);
      setPendingCount(mutations + uploads);
    } catch { /* ignore */ }
  }, []);

  const processQueue = useCallback(async () => {
    if (syncingRef.current || !accessToken || !userId) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      // Process mutations
      const mutations = await getPendingMutations();
      for (const mutation of mutations) {
        // Skip mutations that have exceeded retry limit
        if ((mutation.retry_count ?? 0) >= MAX_RETRIES) continue;

        try {
          const res = await fetch(mutation.url, {
            method: mutation.method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(mutation.body),
          });

          if (res.ok && mutation.id != null) {
            await removeMutation(mutation.id);
          } else if (res.status === 401) {
            // Try refresh
            const supabase = getAuthClient();
            const { data } = await supabase.auth.refreshSession();
            if (data.session) {
              const retryRes = await fetch(mutation.url, {
                method: mutation.method,
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${data.session.access_token}`,
                },
                body: JSON.stringify(mutation.body),
              });
              if (retryRes.ok && mutation.id != null) {
                await removeMutation(mutation.id);
              } else if (mutation.id != null) {
                // Refresh succeeded but request still failed
                await updateMutation({
                  ...mutation,
                  retry_count: (mutation.retry_count ?? 0) + 1,
                  last_error: `Auth retry failed: ${retryRes.status}`,
                });
              }
            } else if (mutation.id != null) {
              // Session refresh failed
              await updateMutation({
                ...mutation,
                retry_count: (mutation.retry_count ?? 0) + 1,
                last_error: 'Session refresh failed',
              });
            }
          } else if (res.status >= 400 && res.status < 500 && mutation.id != null) {
            // 4xx = permanent failure, stop retrying
            await updateMutation({
              ...mutation,
              retry_count: MAX_RETRIES,
              last_error: `Permanent failure: ${res.status}`,
            });
          } else if (mutation.id != null) {
            // 5xx = server error, increment retry
            await updateMutation({
              ...mutation,
              retry_count: (mutation.retry_count ?? 0) + 1,
              last_error: `Server error: ${res.status}`,
            });
          }
        } catch (err) {
          // Network error: increment retry count
          if (mutation.id != null) {
            await updateMutation({
              ...mutation,
              retry_count: (mutation.retry_count ?? 0) + 1,
              last_error: err instanceof Error ? err.message : 'Network error',
            });
          }
        }
      }

      // Process uploads (character photos)
      const uploads = await getPendingUploads();
      if (uploads.length > 0) {
        const supabase = getAuthClient();
        for (const item of uploads) {
          try {
            let photoUrl: string | null = null;
            if (item.file) {
              const path = `${userId}/${item.sailing_id}/${item.character_id}.${item.file_ext}`;
              await supabase.storage.from('character-photos').remove([path]);
              const { error: uploadError } = await supabase.storage
                .from('character-photos')
                .upload(path, item.file, { upsert: true });
              if (uploadError) throw uploadError;
              const { data } = supabase.storage.from('character-photos').getPublicUrl(path);
              photoUrl = data.publicUrl;
            }

            const res = await fetch('/api/character-meetups', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                sailing_id: item.sailing_id,
                character_id: item.character_id,
                photo_url: photoUrl,
                notes: item.notes,
              }),
            });
            if (res.ok && item.id != null) {
              await removePendingUpload(item.id);
            }
          } catch {
            // Leave in queue
          }
        }
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshCount();
    }
  }, [accessToken, userId, refreshCount]);

  // Refresh count on mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Process queue when coming online
  useEffect(() => {
    const handleOnline = () => {
      processQueue();
    };
    window.addEventListener('online', handleOnline);

    // Also try processing on mount if already online
    if (navigator.onLine) {
      processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [processQueue]);

  return { pendingCount, isSyncing, refreshCount, processQueue };
}
