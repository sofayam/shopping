const CACHE_NAME = 'shopping-pwa-v2';
const CACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets...');
      return cache.addAll(CACHE_URLS).catch((err) => {
        console.log('Cache addAll error (some urls may not be available during install):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For manifest, icons, and favicon, try cache first
  if (url.pathname === '/manifest.json' || 
      url.pathname === '/favicon.ico' ||
      url.pathname.includes('icon-')) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((res) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, res.clone());
            return res;
          });
        });
      })
    );
  } else {
    // For everything else, network first
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});
