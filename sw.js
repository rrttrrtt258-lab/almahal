// Caches the app shell so it opens instantly and works without internet.
// Bump VERSION whenever you change index.html so phones pick up the update.
const VERSION = 'almahal-web-v10';
const SHELL = ['./', 'index.html', 'firebase-config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Firebase/Google APIs: always network (Firestore handles its own offline cache)
  if (/googleapis\.com|firebaseio\.com|identitytoolkit|securetoken/.test(url.host)) return;
  // App files: network first, fall back to cache when offline
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && (url.origin === location.origin || /gstatic\.com|fonts\.g|cdnjs/.test(url.host))) {
        const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
