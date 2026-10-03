const CACHE_PREFIX = 'acaiteria-cache-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const STATIC_FILE = /\.(?:avif|css|eot|gif|ico|jpe?g|js|json|mjs|png|svg|ttf|webmanifest|webp|woff2?)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Supabase stays network-only so menu data and API responses are always fresh.
  if (url.hostname === 'supabase.co' || url.hostname.endsWith('.supabase.co') ||
      url.hostname === 'supabase.in' || url.hostname.endsWith('.supabase.in')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      let cache;
      try {
        cache = await caches.open(CACHE_NAME);
      } catch {
        return fetch(request);
      }
      try {
        const response = await fetch(request);
        if (response.ok && url.origin === self.location.origin) {
          try {
            await cache.put('/', response.clone());
          } catch {
            // A full or unavailable cache must not prevent the site from loading.
          }
        }
        return response;
      } catch {
        try {
          return (await cache.match('/')) || (await cache.match(request)) || Response.error();
        } catch {
          return Response.error();
        }
      }
    })());
    return;
  }

  const isImage = request.destination === 'image';
  const isLocalStatic = url.origin === self.location.origin && STATIC_FILE.test(url.pathname);
  if (!isImage && !isLocalStatic) return;

  // Only cache same-origin files. This includes local images and static assets,
  // while excluding external APIs and keeping Supabase outside the cache.
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    let cache;
    try {
      cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
    } catch {
      return fetch(request);
    }

    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      try {
        await cache.put(request, response.clone());
      } catch {
        // A full or unavailable cache must not prevent an asset from loading.
      }
    }
    return response;
  })());
});
