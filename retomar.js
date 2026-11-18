// =====================================================================
//  SEGUIR DONDE ESTABAS (fotos sin reinicios)
// ---------------------------------------------------------------------
//  En algunos celulares, al abrir la cámara el sistema cierra la app para liberar memoria
//  y al volver la app arranca de cero. Para que no se pierda nada:
//   - antes de abrir la cámara se anota dónde estaba (ficha TOP o Competencia)
//   - las fotos ya sacadas se guardan en el celular (no solo en memoria)
//   - si la app se recargó, vuelve sola a la ficha / Competencia, con lo cargado y las fotos
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const K = 'ruteoTR1_retomar', VIGENCIA = 30 * 60000;
  // ---- dónde estaba ----
  function marcar(o){ try { sessionStorage.setItem(K, JSON.stringify(Object.assign({t: Date.now()}, o))); localStorage.setItem(K, JSON.stringify(Object.assign({t: Date.now()}, o))); } catch(e){} }
  function limpiar(){ try { sessionStorage.removeItem(K); localStorage.removeItem(K); } catch(e){} }
  function leer(){
    let o = null;
    try { o = JSON.parse(sessionStorage.getItem(K) || localStorage.getItem(K) || 'null'); } catch(e){}
    if (!o || Date.now() - (o.t || 0) > VIGENCIA){ if (o) limpiar(); return null; }
    return o;
  }
  // ---- fotos guardadas en el celular (IndexedDB) ----
  let db = null;
  function abrirDB(){
    if (db) return Promise.resolve(db);
    return new Promise((ok, no) => {
      if (!window.indexedDB) return no(new Error('sin indexedDB'));
      const r = indexedDB.open('ruteo-fotos-borrador', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('f');
      r.onsuccess = () => { db = r.result; ok(db); };
      r.onerror = () => no(r.error);
    });
  }
  const tx = (modo, fn) => abrirDB().then(d => new Promise((ok, no) => { const t = d.transaction('f', modo), st = t.objectStore('f'); const r = fn(st); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); }));
  function guardarFoto(clave, fo){
    if (!fo || !fo.blob) return Promise.resolve();
    const o = {blob: fo.blob, fecha: fo.fecha ? +new Date(fo.fecha) : Date.now(), w: fo.w || 0, h: fo.h || 0, t: Date.now()};
    return tx('readwrite', st => st.put(o, clave)).catch(() => {});
  }
  function leerFoto(clave){
    return tx('readonly', st => st.get(clave)).then(o => {
      if (!o || !o.blob || Date.now() - o.t > 3 * 864e5) return null;
      return {blob: o.blob, url: URL.createObjectURL(o.blob), fecha: new Date(o.fecha), w: o.w, h: o.h};
    }).catch(() => null);
  }
  function fotosDe(prefijo){
    return abrirDB().then(d => new Promise(ok => {
      const out = {}, t = d.transaction('f', 'readonly'), r = t.objectStore('f').openCursor();
      r.onsuccess = () => { const c = r.result; if (!c) return; if (String(c.key).indexOf(prefijo) === 0 && c.value && c.value.blob && Date.now() - c.value.t < 3 * 864e5) out[String(c.key).slice(prefijo.length)] = {blob: c.value.blob, url: URL.createObjectURL(c.value.blob), fecha: new Date(c.value.fecha), w: c.value.w, h: c.value.h}; c.continue(); };
      t.oncomplete = () => ok(out); t.onerror = () => ok(out);
    })).catch(() => ({}));
  }
  function borrarFotos(prefijo){
    return abrirDB().then(d => new Promise(ok => {
      const t = d.transaction('f', 'readwrite'), r = t.objectStore('f').openCursor();
      r.onsuccess = () => { const c = r.result; if (!c) return; if (String(c.key).indexOf(prefijo) === 0) c.delete(); c.continue(); };
      t.oncomplete = ok; t.onerror = ok;
    })).catch(() => {});
  }
  // ---- volver a donde estaba ----
  function seguir(o){
    const R = window.RUTEO || {};
    let intentos = 0;
    const intentar = () => {
      intentos++;
      if (o.k === 'compe'){ if (R.setSeccion){ R.setSeccion('compe'); aviso(); } return; }
      if (o.k === 'ficha' && window.TopFoco && window.TopFoco.retomar && window.TopFoco.retomar(o)){ aviso(); return; }
      if (intentos < 20) setTimeout(intentar, 500); else limpiar();
    };
    intentar();
  }
  function aviso(){
    let t = document.getElementById('retAviso');
    if (!t){ t = document.createElement('div'); t.id = 'retAviso'; t.className = 'salida-aviso'; document.body.appendChild(t); }
    t.textContent = 'Seguís donde estabas: lo cargado y las fotos quedaron guardados.';
    t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 4200);
  }
  window.Retomar = {marcar, limpiar, leer, seguir, guardarFoto, leerFoto, fotosDe, borrarFotos};
})();
