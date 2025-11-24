// service-worker.js (نسخهٔ ساده و مطمئن برای PWA)
const CACHE_NAME = 'soft-shiraz-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // می‌توانید مسیرهای ایستا دیگر را اینجا اضافه کنید:
  // '/styles.css', '/main.js', '/cards/1.html', ...
];

// نصب و cache اولیه
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch(() => {
        // ignore failures for missing optional assets
      });
    })
  );
});

// فعال‌سازی و پاکسازی کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    ))
  );
  self.clients.claim();
});

// strategy: cache-first for navigation & assets, network-first for cards (so updates show)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // اگر درخواست مربوط به پوشهٔ cards باشد -> network-first
  if (url.pathname.startsWith('/cards/')) {
    event.respondWith(
      fetch(request).then((resp) => {
        // cache a copy
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, copy));
        return resp;
      }).catch(()=> caches.match(request).then(res => res || fetch(request)))
    );
    return;
  }

  // برای بقیه: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        // cache GET responses
        if (request.method === 'GET' && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, copy));
        }
        return resp;
      }).catch(() => {
        // fallback برای صفحات HTML (در صورت آفلاین)
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
