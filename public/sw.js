const CACHE = 'planificaia-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Don't cache API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() =>
      new Response(JSON.stringify({ error: 'Sin conexión' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    ));
    return;
  }

  // Navigations must be network-first so a new deployment is visible
  // immediately instead of keeping an old index.html indefinitely.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE).then((cache) => cache.put('/index.html', response.clone()));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache static assets (JS/CSS from Vite build)
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
