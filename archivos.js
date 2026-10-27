// =====================================================================
//  BUSCADOR DE ARCHIVOS SUBIDOS
// ---------------------------------------------------------------------
//  Permite subir los Excel con el nombre que traen del sistema.
//  La app mira qué archivos hay en la página principal del repositorio
//  de GitHub, reconoce de qué es cada uno (ruteo, GPS, padrón, visitas,
//  ventas, precios, potencial, marcaciones de supervisores) y usa el
//  más nuevo de cada tipo.
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const MIN_CACHE = 10;   // minutos que se recuerda la lista de archivos
  // Archivos con nombre fijo de versiones anteriores: se usan solo si no hay otros más nuevos
  const VIEJOS = ['visitas.xlsx', 'lista_precios_25.xlsx', 'lista_precios_35.xlsx'];
  const IGNORAR = ['clientes_top.xlsx'];

  // Tipo por el nombre del archivo (así no hace falta descargarlo para saber qué es)
  function porNombre(n){
    n = String(n).toLowerCase();
    if (/potencial/.test(n)) return 'potencial';
    if (/ruteo/.test(n)) return 'ruteo';
    if (/latitud|longitud|gps/.test(n)) return 'gps';
    if (/^lpp?[\s_-]|precio|listado|^lista_/.test(n)) return 'precios';
    if (/^libro|cuota/.test(n)) return 'cuotas';
    if (/^visitas\.xlsx$/.test(n)) return 'visitas';
    return null;
  }

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
  let memoLista = null;
  async function ultimos(carpeta){
    carpeta = carpeta || '';
    if (memoLista && memoLista.c === carpeta) return memoLista.p;
    const p = (async () => {
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
    })();
    memoLista = {c: carpeta, p};
    p.catch(() => { memoLista = null; });
    return p;
  }

  // Descarga (una sola vez por sesión)
  const bajados = new Map();
  function bajar(f){
    if (!bajados.has(f.sha)){
      const p = fetch(f.url, {cache: 'no-cache'}).then(r => { if (!r.ok) throw new Error('No se pudo bajar ' + f.nombre); return r.arrayBuffer(); });
      p.catch(() => bajados.delete(f.sha));
      bajados.set(f.sha, p);
    }
    return bajados.get(f.sha);
  }

  // Reconoce el tipo de Excel mirando sus títulos (solo las primeras filas)
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  async function tipoDe(f){
    const nom = porNombre(f.nombre); if (nom) return nom;
    const k = 'ruteoTR1_tipo2_' + f.sha;
    try { const c = localStorage.getItem(k); if (c) return c; } catch(e){}
    let t = 'otro';
    try {
      const XLSX = await window.cargarExcelLib();
      const buf = await bajar(f);
      const wb = window.abrirLibro ? window.abrirLibro(XLSX, buf, {sheetRows: 40}) : XLSX.read(buf, {type: 'array', sheetRows: 40});
      const H = new Set();
      wb.SheetNames.slice(0, 3).forEach(sn => XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, defval: null}).forEach(r => (r || []).forEach(x => { const v = norm(x); if (v && v.length < 60) H.add(v); })));
      const tiene = (...xs) => xs.some(x => H.has(x));
      const con = re => [...H].some(x => re.test(x));
      if (con(/^tiempo asist/) || con(/horas trabajadas/) || tiene('cod persona spv')) t = 'supervisores';
      else if (tiene('cartera') && con(/subcliente/) && tiene('date', 'fecha')) t = 'visitas';
      else if (tiene('desc visita') && con(/subcliente/) && con(/vendedor/)) t = 'ruteo';
      else if (tiene('latitud') && tiene('longitud')) t = 'gps';
      else if (tiene('pm') && tiene('lp') && con(/subcliente/)) t = 'padron';
      else if (con(/subcliente/) && (tiene('ventas', 'venta') || con(/^ventas /))) t = 'ventas';
      else if (tiene('cod articulo') && con(/precio/)) t = 'precios';
      else if (tiene('potencial')) t = 'potencial';
      else if (tiene('dias habiles')) t = 'cuotas';
    } catch(e){ return 'error'; }
    try { localStorage.setItem(k, t); } catch(e){}
    return t;
  }

  /**
   * Los "n" archivos más nuevos de un tipo: [{nombre, url, fecha, sha}]
   * Revisa del más nuevo al más viejo; los que no tienen el tipo en el nombre se abren una sola vez.
   */
  async function buscar(tipo, n){
    n = n || 1;
    let lista = [];
    try { lista = await window.Archivos.ultimos(''); } catch(e){ return []; }
    const out = [];
    for (const f of lista.slice(0, 40)){
      if (await tipoDe(f) === tipo) out.push(f);
      if (out.length >= n) break;
    }
    return out;
  }

  // Recuerda datos de cada archivo (por ejemplo, qué listas trae)
  const tipo = {
    leer: (sha, t) => { try { return localStorage.getItem('ruteoTR1_es_' + t + '_' + sha); } catch(e){ return null; } },
    guardar: (sha, t, si) => { try { localStorage.setItem('ruteoTR1_es_' + t + '_' + sha, typeof si === 'string' ? si : (si ? '1' : '0')); } catch(e){} }
  };
  window.Archivos = { ultimos, tipo, buscar, bajar, tipoDe, porNombre };
})();
