// Delicious Restaurant — offline-first service worker (no build step).
// App shell cached on install; menu API cached at runtime; orders/auth always network.
const CACHE = 'delicious-v5';
const SHELL = [
  './',
  './index.html',
  './styles.css?v=5',
  './app.js?v=5',
  './cart.js',
  './auth.js',
  './ui.js',
  './staff.js',
  './admin.js?v=5',
  './i18n.js',
  './icons.js',
  './validators.js',
  './favicon.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Runtime cache for the public menu API (stale-while-revalidate).
  // NOTE: every other /api/* request (auth, orders, zones, staff, reviews,
  // analytics) is network-only — caching GETs like /api/auth/me would serve
  // stale 401s and instantly log the user back out.
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/items')) return;
  if (url.pathname.startsWith('/api/items')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // App shell: cache-first, fall back to network, then cached index for navigations.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
              return res;
            })
            .catch(() => {
              if (request.mode === 'navigate') return caches.match('./index.html');
              return Promise.reject(new Error('offline'));
            })
      )
    );
  }
});
