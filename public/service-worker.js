const CACHE_NAME = 'edoli-webtool-dev';
// const urlsToCache = [
//   './',
//   './style.css',
//   './script.js',
//   './icon-192x192.png',
//   './icon-512x512.png',
// ];
const urlsToCache = [];

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