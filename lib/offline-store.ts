const DB_NAME = 'disney-offline';
const DB_VERSION = 1;

const STORE_CACHE = 'cache';
const STORE_MUTATIONS = 'mutations';
const STORE_UPLOADS = 'uploads';

// --- Types ---

export interface CachedEntry {
  key: string;
  data: unknown;
  timestamp: number;
}

export interface QueuedMutation {
  id?: number;
  type: string;
  url: string;
  method: string;
  body: unknown;
  created_at: number;
  retry_count?: number;
  last_error?: string;
}

export interface PendingUpload {
  id?: number;
  character_id: string;
  character_name: string;
  sailing_id: string;
  ship_display_name: string;
  notes: string | null;
  file: Blob | null;
  file_ext: string;
  created_at: number;
}

// --- DB helpers ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
        db.createObjectStore(STORE_MUTATIONS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_UPLOADS)) {
        db.createObjectStore(STORE_UPLOADS, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txGet<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  }));
}

function txGetAll<T>(storeName: string): Promise<T[]> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  }));
}

function txPut(storeName: string, value: unknown): Promise<IDBValidKey> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function txAdd(storeName: string, value: unknown): Promise<number> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).add(value);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  }));
}

function txDelete(storeName: string, key: IDBValidKey): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

function txCount(storeName: string): Promise<number> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

// --- Cache store ---

export async function cacheData(key: string, data: unknown): Promise<void> {
  const entry: CachedEntry = { key, data, timestamp: Date.now() };
  await txPut(STORE_CACHE, entry);
}

export async function getCachedData<T = unknown>(key: string): Promise<{ data: T; timestamp: number } | null> {
  const entry = await txGet<CachedEntry>(STORE_CACHE, key);
  if (!entry) return null;
  return { data: entry.data as T, timestamp: entry.timestamp };
}

export async function clearCache(keyPrefix?: string): Promise<void> {
  if (!keyPrefix) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      const req = tx.objectStore(STORE_CACHE).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  const all = await txGetAll<CachedEntry>(STORE_CACHE);
  for (const entry of all) {
    if (entry.key.startsWith(keyPrefix)) {
      await txDelete(STORE_CACHE, entry.key);
    }
  }
}

// --- Mutations store ---

export async function queueMutation(mutation: Omit<QueuedMutation, 'id' | 'created_at'>): Promise<number> {
  return txAdd(STORE_MUTATIONS, { ...mutation, created_at: Date.now() });
}

export async function getPendingMutations(): Promise<QueuedMutation[]> {
  return txGetAll<QueuedMutation>(STORE_MUTATIONS);
}

export async function removeMutation(id: number): Promise<void> {
  return txDelete(STORE_MUTATIONS, id);
}

export async function getPendingMutationCount(): Promise<number> {
  return txCount(STORE_MUTATIONS);
}

export async function updateMutation(mutation: QueuedMutation): Promise<void> {
  await txPut(STORE_MUTATIONS, mutation);
}

// --- Uploads store (backward compat with offline-queue.ts) ---

export async function queueUpload(item: Omit<PendingUpload, 'id' | 'created_at'>): Promise<number> {
  return txAdd(STORE_UPLOADS, { ...item, created_at: Date.now() });
}

export async function getPendingUploads(): Promise<PendingUpload[]> {
  return txGetAll<PendingUpload>(STORE_UPLOADS);
}

export async function removePendingUpload(id: number): Promise<void> {
  return txDelete(STORE_UPLOADS, id);
}

export async function getPendingCount(): Promise<number> {
  return txCount(STORE_UPLOADS);
}

// --- Review helper ---

export async function submitOrQueueReview(
  url: string,
  body: object,
  headers: Record<string, string>,
  isOnline: boolean
): Promise<{ queued: boolean; response?: unknown; error?: string }> {
  if (!isOnline) {
    await queueMutation({ type: 'review', url, method: 'POST', body });
    return { queued: true };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return { queued: false, response: data };
    }
    const data = await res.json().catch(() => ({}));
    const errorMsg = (data as { error?: string }).error || 'Request failed';
    // 4xx = permanent client error, don't queue
    if (res.status >= 400 && res.status < 500) {
      return { queued: false, error: errorMsg };
    }
    // 5xx = server error, queue for retry
    await queueMutation({ type: 'review', url, method: 'POST', body });
    return { queued: true };
  } catch {
    // Network error - queue for later
    await queueMutation({ type: 'review', url, method: 'POST', body });
    return { queued: true };
  }
}
