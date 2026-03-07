const CACHE_NAME = 'disney-trivia-v3';
const urlsToCache = [
  '/',
  '/quiz',
  '/planner',
  '/planner/pixie-dust',
  '/planner/pre-cruise',
  '/planner/pixie-dust/joint-dust',
  '/Secret-menU',
  '/Secret-menU/characters',
  '/Secret-menU/movies',
  '/Secret-menU/ships',
  '/Secret-menU/foodies',
  '/Secret-menU/activity',
  '/Secret-menU/entertainment',
  '/Secret-menU/shopping',
  '/Secret-menU/things-to-do',
  '/Secret-menU/hacks',
  '/Secret-menU/cruise-guide',
  '/Secret-menU/stateroom-guide',
  '/Secret-menU/stateroom',
  '/Secret-menU/sailing',
  '/stateroom',
  '/progress',
  '/users',
  '/friends',
  '/offline.html'
];

// API GET paths to cache with network-first strategy
const CACHEABLE_API_PREFIXES = [
  '/api/planner-items',
  '/api/character-meetups',
  '/api/movie-checklist',
  '/api/movie-reviews?aggregate',
  '/api/questions',
  '/api/fe-groups',
  '/api/pixie-gifts',
  '/api/pixie-dust',
  '/api/planner-items/companions',
  '/api/sailing-reviews/mine',
];

function isApiCacheable(url) {
  const path = new URL(url).pathname + new URL(url).search;
  return CACHEABLE_API_PREFIXES.some(prefix => path.startsWith(prefix));
}

// Fetch with timeout helper for SW context
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    fetch(typeof request === 'string' ? request : request.clone(), { signal: controller.signal })
      .then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

// Install service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Use allSettled so one 404 doesn't break entire install
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url).catch(err => {
            console.log('Failed to cache:', url, err.message);
          }))
        );
      })
      .catch((err) => {
        console.log('Cache install failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch handler with strategy per request type
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests (mutations handled by IndexedDB queue)
  if (event.request.method !== 'GET') return;

  // Cacheable API requests: network-first with 5s timeout, cache fallback
  if (event.request.url.includes('/api/') && isApiCacheable(event.request.url)) {
    event.respondWith(
      fetchWithTimeout(event.request, 5000)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Skip non-cacheable API requests
  if (event.request.url.includes('/api/')) return;

  // Cache-first for Supabase storage (character photos) with 5s timeout on miss
  if (event.request.url.includes('supabase.co/storage')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetchWithTimeout(event.request, 5000).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests: 3s timeout, then cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(event.request, 3000)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((response) => {
            return response || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Network-first for everything else, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
