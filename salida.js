// =====================================================================
//  BANDEJA DE SALIDA (funciona sin señal)
// ---------------------------------------------------------------------
//  Cuando no hay señal, lo que se envía (fotos, fichas TOP, competencia,
//  anomalías) queda guardado en el celular y se manda SOLO apenas vuelve
//  la señal, aunque se cierre la app. Abajo a la izquierda se ve
//  "📤 N por enviar" mientras haya algo esperando.
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const BASE = 'ruteo-salida', TABLA = 'envios';
  const ESPERA = 30000;   // si Google no contesta en 30 s, se toma como "sin señal"
  let db = null, enviando = false;

  // ---- Base de datos del celular (IndexedDB) ----
  function abrirDB(){
    if (db) return Promise.resolve(db);
    return new Promise((ok, mal) => {
      if (!window.indexedDB) return mal(new Error('sin IndexedDB'));
      const r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(TABLA)) r.result.createObjectStore(TABLA, {keyPath: 'id', autoIncrement: true}); };
      r.onsuccess = () => { db = r.result; ok(db); };
      r.onerror = () => mal(r.error);
    });
  }
  function tx(modo, fn){
    return abrirDB().then(d => new Promise((ok, mal) => {
      const t = d.transaction(TABLA, modo), s = t.objectStore(TABLA); let res;
      const q = fn(s); if (q) q.onsuccess = () => { res = q.result; };
      t.oncomplete = () => ok(res); t.onerror = () => mal(t.error); t.onabort = () => mal(t.error);
    }));
  }
  const todos = () => tx('readonly', s => s.getAll()).then(x => x || []).catch(() => []);
  const guardar = item => tx('readwrite', s => s.add(item));
  const borrar = id => tx('readwrite', s => s.delete(id));

  // ---- Envío con espera máxima ----
  function mandar(url, cuerpo){
    const ctl = window.AbortController ? new AbortController() : null;
    const t = setTimeout(() => { if (ctl) ctl.abort(); }, ESPERA);
    return fetch(url, {method: 'POST', body: cuerpo, redirect: 'follow', signal: ctl ? ctl.signal : undefined})
      .then(r => { clearTimeout(t); if (!r.ok){ const e = new Error('Google respondió ' + r.status); e.servidor = true; throw e; } return r.json(); })
      .then(j => { if (!j || !j.ok){ const e = new Error((j && j.error) || 'No se pudo guardar'); e.servidor = true; throw e; } return j; },
            e => { clearTimeout(t); throw e; });
  }
  const sinSenal = e => !e.servidor;   // error de red o demora: no llegó a Google

  /**
   * Envía; si no hay señal lo guarda y devuelve {ok: true, pendiente: true, id: 'pend-…'}.
   * info: {tipo: 'Foto' | 'Ficha TOP' | ..., detalle: 'Cliente…'} para mostrar en la bandeja.
   */
  async function enviar(url, cuerpo, info){
    if (navigator.onLine !== false){
      try { return await mandar(url, cuerpo); }
      catch(e){ if (!sinSenal(e)) throw e; }
    }
    const local = 'pend-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    try { await guardar({url, cuerpo, info: info || {}, local, t: Date.now()}); }
    catch(e){ throw new Error('Sin señal y no se pudo guardar en el celular'); }
    // (el aviso lo da quien llamó)
    pintar();
    return {ok: true, pendiente: true, id: local, enlace: ''};
  }

  // ---- Reintentos: al volver la señal, al abrir la app y cada 45 s si hay algo esperando ----
  async function reintentar(){
    if (enviando || navigator.onLine === false) return;
    const xs = await todos(); if (!xs.length){ pintar(0); return; }
    enviando = true; let mandados = 0;
    try {
      for (const it of xs.sort((a, b) => a.t - b.t)){
        try {
          const j = await mandar(it.url, it.cuerpo);
          await borrar(it.id); mandados++;
          try { window.dispatchEvent(new CustomEvent('salida:enviado', {detail: {local: it.local, respuesta: j}})); } catch(e){}
        } catch(e){
          if (sinSenal(e)) break;                 // sigue sin señal: se prueba más tarde
          await borrar(it.id);                    // Google lo rechazó (dato inválido): no se reintenta para siempre
        }
      }
    } finally { enviando = false; }
    if (mandados) aviso(mandados === 1 ? 'Volvió la señal: se envió lo que estaba guardado.' : `Volvió la señal: se enviaron ${mandados} cosas guardadas.`);
    pintar();
  }

  // ---- Indicador "📤 N por enviar" ----
  async function pintar(n){
    if (n === undefined) n = (await todos()).length;
    let el = document.getElementById('salidaPill');
    if (!n){ if (el) el.remove(); return; }
    if (!el){
      el = document.createElement('button'); el.type = 'button'; el.id = 'salidaPill'; el.className = 'salida-pill';
      el.onclick = async () => { const xs = await todos(); aviso(navigator.onLine === false ? `Sin señal. Esperando para enviar: ${xs.map(x => x.info.tipo || 'envío').join(', ')}.` : 'Enviando…'); reintentar(); };
      document.body.appendChild(el);
    }
    el.innerHTML = `<span aria-hidden="true">📤</span> ${n} por enviar`;
  }
  function aviso(t){
    let el = document.getElementById('salidaAviso');
    if (!el){ el = document.createElement('div'); el.id = 'salidaAviso'; el.className = 'salida-aviso'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = t; el.classList.add('on'); clearTimeout(aviso.t); aviso.t = setTimeout(() => el.classList.remove('on'), 4200);
  }

  window.addEventListener('online', () => setTimeout(reintentar, 1500));
  window.addEventListener('load', () => setTimeout(reintentar, 4000));
  setInterval(() => { if (document.visibilityState === 'visible') reintentar(); }, 45000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(reintentar, 1500); });

  window.Salida = {enviar, reintentar, pendientes: () => todos().then(x => x.length)};
})();
