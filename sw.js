const CACHE_NAME = 'mandeok-pwa-v1';
const APP_SHELL = [
  './만덕스.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('mandeok-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Do not intercept POST requests or external Apps Script / Google Drive traffic.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network-first for the HTML so users get updates when online; cached copy works as a fallback.
  if (req.mode === 'navigate' || url.pathname.endsWith('/만덕스.html')) {
    event.respondWith(
      fetch(req).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./만덕스.html', copy));
        }
        return response;
      }).catch(() => caches.match('./만덕스.html'))
    );
    return;
  }

  // Cache-first for the manifest and app icons.
  if (APP_SHELL.some(path => url.href === new URL(path, self.registration.scope).href)) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(response => {
        if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
        return response;
      }))
    );
  }
});
