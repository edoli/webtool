const CACHE_NAME = 'edoli-webtool-v1';
const urlsToCache = [
  '/',
  '/style.css',
  '/script.js',
  // 캐시할 다른 리소스들 추가
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});