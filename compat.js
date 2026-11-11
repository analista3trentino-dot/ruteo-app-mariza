// =====================================================================
//  COMPATIBILIDAD con celulares viejos (Android con Chrome antiguo)
//  y AHORRO DE BATERÍA. Se carga antes que todo. No hace falta modificarlo.
// =====================================================================
(function () {
  // ---- Ayudas que los navegadores viejos no traen ----
  window.__nz = function (a, b) { return a === null || a === undefined ? b : a; };
  if (!Array.prototype.flat) Array.prototype.flat = function (d) { d = d === undefined ? 1 : d; return d > 0 ? this.reduce(function (a, x) { return a.concat(Array.isArray(x) ? x.flat(d - 1) : x); }, []) : this.slice(); };
  if (!Array.prototype.flatMap) Array.prototype.flatMap = function (f, t) { return this.map(f, t).flat(); };
  if (!Object.fromEntries) Object.fromEntries = function (it) { var o = {}; Array.from(it).forEach(function (p) { o[p[0]] = p[1]; }); return o; };
  if (window.Promise && !Promise.prototype.finally) Promise.prototype.finally = function (f) { var P = this.constructor; return this.then(function (v) { return P.resolve(f()).then(function () { return v; }); }, function (e) { return P.resolve(f()).then(function () { throw e; }); }); };
  if (window.NodeList && !NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;
  if (!String.prototype.padStart) String.prototype.padStart = function (n, c) { var s = String(this); c = c === undefined ? ' ' : String(c); while (s.length < n) s = c + s; return s.slice(-n) === s ? s : s; };
  if (!Object.values) Object.values = function (o) { return Object.keys(o).map(function (k) { return o[k]; }); };
  if (!Object.entries) Object.entries = function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); };

  // ---- Si la app no arranca, en vez de quedar en blanco se explica qué hacer ----
  var chrome = (navigator.userAgent.match(/Chrom(?:e|ium)\/(\d+)/) || [])[1];
  var muyViejo = !window.Promise || !window.fetch || !window.localStorage || (chrome && +chrome < 61);
  function aviso(motivo) {
    if (document.getElementById('compatAviso')) return;
    var d = document.createElement('div');
    d.id = 'compatAviso';
    d.setAttribute('style', 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:99999;background:#0C1A2E;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center');
    d.innerHTML = '<div style="max-width:360px"><div style="font-size:44px">📱</div>' +
      '<h2 style="margin:12px 0 8px;font-size:22px">La app no pudo abrir en este celular</h2>' +
      '<p style="margin:0 0 14px;line-height:1.5;color:#C9D4E6">' + motivo + '</p>' +
      '<p style="margin:0 0 18px;line-height:1.5;color:#C9D4E6">Abrí <b>Play Store</b>, buscá <b>Google Chrome</b> y <b>Android System WebView</b>, y tocá <b>Actualizar</b>. Después volvé a abrir la app.</p>' +
      '<button onclick="location.reload()" style="border:0;border-radius:12px;padding:14px 22px;background:#F5B83D;color:#0C1A2E;font-weight:bold;font-size:16px">Volver a intentar</button></div>';
    (document.body || document.documentElement).appendChild(d);
  }
  if (muyViejo) { document.addEventListener('DOMContentLoaded', function () { aviso('El navegador de este celular es muy viejo' + (chrome ? ' (Chrome ' + chrome + ')' : '') + '.'); }); return; }
  var errores = [];
  window.addEventListener('error', function (e) { errores.push(e.message || 'error'); });
  // Si a los 25 segundos la app no arrancó (y no es por falta de señal), se avisa
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (window.RUTEO || document.getElementById('portada')) return;
      if (navigator.onLine === false) return;
      if (errores.length) aviso('El navegador de este celular no entiende una parte de la app' + (chrome ? ' (Chrome ' + chrome + ')' : '') + '.');
    }, 25000);
  });

  // ---- Chrome viejo que no entiende "gap" en filas flex: se marcan para usar márgenes ----
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var f = document.createElement('div'); f.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute';
      f.appendChild(document.createElement('div')); f.appendChild(document.createElement('div'));
      document.body.appendChild(f); var ok = f.scrollHeight === 1; f.remove();
      if (!ok) document.documentElement.classList.add('sin-gap');
    } catch (e) {}
  });

  // ---- Ahorro de batería ----
  // Sin animaciones decorativas cuando la batería está baja (20 % o menos) o si el celular pide "reducir movimiento"
  function ahorro(on) { document.documentElement.classList.toggle('ahorro', !!on); }
  try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ahorro(true); } catch (e) {}
  try {
    if (navigator.getBattery) navigator.getBattery().then(function (b) {
      var mirar = function () { ahorro(!b.charging && b.level <= 0.2); };
      mirar(); b.addEventListener('levelchange', mirar); b.addEventListener('chargingchange', mirar);
    });
  } catch (e) {}
  // El celular con poca memoria o datos en modo ahorro: también
  try { if (navigator.connection && navigator.connection.saveData) ahorro(true); } catch (e) {}
})();
