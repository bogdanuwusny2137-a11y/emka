const CACHE = 'mobywatel-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './dashboard.html',
  './documents.html',
  './card.html',
  './generator.html',
  './css/css2.css',
  './assets/manifest.json',
  './assets/app/images/logo.png',
  './assets/app/images/logo_large.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        return caches.open(CACHE).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(() => {
      return caches.match('./index.html');
    })
  );
});
