const CACHE_NAME = 'gent-vigilon-v6-2-alias-backup';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/index.html');

  if(isPage){
    event.respondWith(
      fetch(req).then(resp => {
        if(resp && resp.ok && sameOrigin){
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
        }
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      if(resp && resp.ok && sameOrigin){
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return resp;
    }))
  );
});
