// Service worker: siempre pide la versión más nueva al servidor (así los cambios
// que se suben a GitHub, como vendedores.js, se ven al abrir la app) y usa lo
// guardado solo si no hay internet.
const CACHE = 'ruteo-tr1-v2';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const red = req.mode === 'navigate' ? fetch(req.url, {cache: 'no-cache', credentials: 'same-origin'}) : fetch(req, {cache: 'no-cache'});
  e.respondWith(
    red.then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
