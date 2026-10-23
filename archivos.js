// =====================================================================
//  BUSCADOR DE ARCHIVOS SUBIDOS
// ---------------------------------------------------------------------
//  Permite subir los Excel con el nombre que traen del sistema.
//  La app mira qué archivos hay en una carpeta del repositorio de GitHub
//  (por ejemplo "visitas" o "precios") y toma el más nuevo.
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const MIN_CACHE = 10;   // minutos que se recuerda la lista de archivos
  // Archivos con nombre fijo de versiones anteriores: se usan solo si no hay otros más nuevos
  const VIEJOS = ['visitas.xlsx', 'lista_precios_25.xlsx', 'lista_precios_35.xlsx'];
  const IGNORAR = ['clientes_top.xlsx'];

  // Repositorio de GitHub donde está publicada la app
  function repo(){
    if (window.ARCHIVOS_REPO) return window.ARCHIVOS_REPO;
    const host = location.hostname, partes = location.pathname.split('/').filter(Boolean);
    if (!/\.github\.io$/.test(host) || !partes.length) return null;
    return {owner: host.split('.')[0], repo: partes[0]};
  }
  const leerCache = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e){ return null; } };
  const guardarCache = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };

  // Fecha que trae el nombre del archivo, ej. "data_-_2026-10-21T102200.999.xlsx"
  function fechaDelNombre(n){
    const m = String(n).match(/(20\d{2})-(\d{2})-(\d{2})(?:[T _](\d{2})[:.]?(\d{2})[:.]?(\d{2})?)?/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  }

  async function api(url){
    const r = await fetch(url, {headers: {Accept: 'application/vnd.github+json'}});
    if (!r.ok) throw new Error('GitHub respondió ' + r.status);
    return r.json();
  }

  // Fecha de subida de un archivo (se consulta una sola vez por versión del archivo)
  async function fechaSubida(R, ruta, sha){
    const k = 'ruteoTR1_subido_' + sha, c = leerCache(k);
    if (c) return new Date(c);
    const j = await api(`https://api.github.com/repos/${R.owner}/${R.repo}/commits?path=${encodeURIComponent(ruta)}&per_page=1`);
    const d = j && j[0] && j[0].commit && j[0].commit.committer && j[0].commit.committer.date;
    if (d) guardarCache(k, d);
    return d ? new Date(d) : null;
  }

  /**
   * Devuelve los Excel (.xlsx o .xls) de una carpeta, del más nuevo al más viejo:
   * [{nombre, url, fecha, sha}]. "url" se usa con fetch() para descargarlo.
   */
  async function ultimos(carpeta){
    const R = repo(); if (!R) throw new Error('La app no está publicada en GitHub');
    const kLista = 'ruteoTR1_carpeta_' + carpeta;
    let lista = leerCache(kLista);
    if (!lista || Date.now() - lista.t > MIN_CACHE * 60000){
      try {
        const j = await api(`https://api.github.com/repos/${R.owner}/${R.repo}/contents${carpeta ? '/' + encodeURIComponent(carpeta) : ''}`);
        lista = {t: Date.now(), items: (Array.isArray(j) ? j : []).filter(f => f.type === 'file' && /\.xlsx?$/i.test(f.name) && !IGNORAR.includes(f.name.toLowerCase())).map(f => ({nombre: f.name, ruta: f.path, sha: f.sha}))};
        guardarCache(kLista, lista);
      } catch(e){
        if (!lista) throw e;   // sin conexión a GitHub: se usa la última lista conocida
      }
    }
    const items = await Promise.all(lista.items.map(async f => {
      let fecha = fechaDelNombre(f.nombre);
      if (!fecha && !VIEJOS.includes(f.nombre.toLowerCase())) { try { fecha = await fechaSubida(R, f.ruta, f.sha); } catch(e){ fecha = null; } }
      return {nombre: f.nombre, url: f.ruta.split('/').map(encodeURIComponent).join('/'), fecha, sha: f.sha};
    }));
    return items.sort((a, b) => (b.fecha ? b.fecha.getTime() : 0) - (a.fecha ? a.fecha.getTime() : 0) || b.nombre.localeCompare(a.nombre));
  }

  // Recuerda qué tipo de Excel es cada archivo (para no descargarlo de nuevo)
  const tipo = {
    leer: (sha, t) => { try { return localStorage.getItem('ruteoTR1_es_' + t + '_' + sha); } catch(e){ return null; } },
    guardar: (sha, t, si) => { try { localStorage.setItem('ruteoTR1_es_' + t + '_' + sha, typeof si === 'string' ? si : (si ? '1' : '0')); } catch(e){} }
  };
  window.Archivos = { ultimos, tipo };
})();
