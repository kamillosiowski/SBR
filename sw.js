
const CACHE_NAME = 'sbr-monitor-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalacja i keszowanie kluczowych zasobów
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Czyszczenie starych wersji cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Strategia: Najpierw sieć, jeśli zawiedzie - cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        // Jeśli to nawigacja (np. odświeżenie strony), zwróć index.html z cache
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
