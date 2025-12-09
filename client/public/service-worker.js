// This is a minimal service worker to allow the app to be installed.
// It doesn't provide any offline caching capabilities beyond what the browser does by default.

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  // Skip waiting to activate the new service worker immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  // Take control of all clients as soon as the service worker is activated.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // This basic fetch handler is required for the app to be considered a PWA.
  // It just passes the request through to the network.
  event.respondWith(fetch(event.request));
});
