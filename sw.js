// Service worker: pide la versión más nueva al servidor (así los cambios que se
// suben a GitHub, como vendedores.js, se ven al abrir la app). Si la señal es
// mala y el servidor tarda más de 4 segundos, usa lo guardado en el celular para
// que la app abra igual, y se actualiza sola en cuanto llega la respuesta.
const CACHE = 'ruteo-tr1-v4';
const ESPERA = 4000;   // milisegundos que se espera a internet antes de usar lo guardado
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  // ('ruteo-archivos…' es donde la app guarda los Excel/PDF ya bajados: no se borra)
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && !k.startsWith('ruteo-archivos')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Imágenes de Drive (fotos, logos de marcas) y librerías (mapa, lector de PDF): se guardan en el celular
// la primera vez y no se vuelven a bajar (ahorra datos). Se guardan hasta 150 y se borran las más viejas.
const CACHE_IMG = 'ruteo-archivos-img';
const DE_AFUERA = /^https:\/\/(drive\.google\.com\/thumbnail|lh\d\.googleusercontent\.com\/|cdnjs\.cloudflare\.com\/ajax\/libs\/(leaflet|pdf\.js)\/)/;
function guardarAfuera(req, res){
  caches.open(CACHE_IMG).then(c => c.put(req, res).then(() => c.keys()).then(ks => { if (ks.length > 150) ks.slice(0, ks.length - 150).forEach(k => c.delete(k)); })).catch(() => {});
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method === 'GET' && DE_AFUERA.test(req.url)){
    e.respondWith(caches.open(CACHE_IMG).then(c => c.match(req)).then(r => r || fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) guardarAfuera(req, res.clone()); return res; })));
    return;
  }
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (/\.(xlsx?|pdf)$/i.test(new URL(req.url).pathname)) return;   // los Excel y PDF los guarda la app por su cuenta
  const nav = req.mode === 'navigate';
  const red = (nav ? fetch(req.url, {cache: 'no-cache', credentials: 'same-origin'}) : fetch(req, {cache: 'no-cache'}))
    .then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(nav ? 'index.html' : req, copy)); }
      return res;
    });
  const guardado = () => caches.match(nav ? 'index.html' : req, {ignoreSearch: true});
  e.respondWith(new Promise(ok => {
    let listo = false;
    const dar = r => { if (!listo && r){ listo = true; ok(r); } };
    // si internet tarda, lo guardado
    const t = setTimeout(() => guardado().then(dar), ESPERA);
    red.then(r => { clearTimeout(t); dar(r); })
      .catch(() => { clearTimeout(t); guardado().then(r => { if (r) dar(r); else if (!listo){ listo = true; ok(Response.error()); } }); });
  }));
});
