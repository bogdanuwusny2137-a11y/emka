var CACHE = 'mobywatel-v3';
var PRECACHE_URLS = [
  './login.html', './dashboard.html',
  './documents.html', './card.html', './generator.html',
  './css/css2.css', './assets/manifest.json',
  './assets/app/images/logo.png', './assets/app/images/logo_large.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE_URLS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(
    ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))
  )));
});

self.addEventListener('fetch', (e) => {
  // Dla HTML używaj network-first aby zawsze mieć świeżą wersję
  if (e.request.mode === 'navigate' || (e.request.headers && e.request.headers.get('Accept') && e.request.headers.get('Accept').includes('text/html'))) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          return caches.open(CACHE).then((c) => { c.put(e.request, r.clone()); return r; });
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('./login.html')))
    );
    return;
  }
  // Dla assetów (css, js, obrazy) cache-first
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((r) => {
      return caches.open(CACHE).then((c) => { c.put(e.request, r.clone()); return r; });
    })).catch(() => caches.match('./login.html'))
  );
});
