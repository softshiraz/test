const CACHE_NAME = 'softshiraz-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/movie.html',
  '/manifest.json',
  // لیست فایل‌های استاتیک مهم (اضافه کنید)
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => {
      if (k !== CACHE_NAME) return caches.delete(k);
    })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (ev) => {
  // strategy: cache-first for app shell, fallback to network
  ev.respondWith(
    caches.match(ev.request).then(cached => {
      if (cached) return cached;
      return fetch(ev.request).then(resp => {
        // optionally cache new requests for navigation or assets
        return resp;
      }).catch(()=> {
        // fallback (در صورت نیاز می‌توانید یک صفحه آفلاین برگردانید)
        return caches.match('/index.html');
      });
    })
  );
});
