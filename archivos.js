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
  const MIN_CACHE = 5;    // minutos que se recuerda la lista de archivos
  let falloGitHub = false; // true si no se pudo consultar GitHub (se usa la última lista guardada)
  // Archivos con nombre fijo de versiones anteriores: se usan solo si no hay otros más nuevos
  const VIEJOS = ['visitas.xlsx', 'lista_precios_25.xlsx', 'lista_precios_35.xlsx'];
  const IGNORAR = ['clientes_top.xlsx'];
  // Carpetas donde la app también busca los Excel (además de la página principal)
  const CARPETAS_DATOS = /^(datos|excel|bases?|archivos)$/i;

  // Tipo por el nombre del archivo (así no hace falta descargarlo para saber qué es)
  function porNombre(n){
    n = String(n).toLowerCase();
    if (/stock|existencia/.test(n)) return 'stock';
    if (/\.pdf$/.test(n)) return 'stock';
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

  // GitHub deja hacer 60 consultas por hora desde cada red (internet de la oficina = una sola red
  // para todas las compus). Si se pasa, espera hasta que GitHub vuelva a habilitar.
  let limiteHasta = 0;
  try { limiteHasta = +localStorage.getItem('ruteoTR1_ghLimite') || 0; } catch(e){}
  async function api(url){
    if (Date.now() < limiteHasta) throw new Error('GitHub limitado');
    const r = await fetch(url, {headers: {Accept: 'application/vnd.github+json'}});
    if (!r.ok){
      if ((r.status === 403 || r.status === 429) && r.headers.get('x-ratelimit-remaining') === '0'){
        limiteHasta = (+r.headers.get('x-ratelimit-reset') || 0) * 1000 || Date.now() + 15 * 60000;
        try { localStorage.setItem('ruteoTR1_ghLimite', String(limiteHasta)); } catch(e){}
      }
      throw new Error('GitHub respondió ' + r.status);
    }
    return r.json();
  }
  // Fechas de subida ya conocidas (así una compu nueva no tiene que preguntarle a GitHub por cada archivo)
  const SEMILLA = {"d43c87adc2ae614f7b5a712f832ccbed9422fa23":"2026-10-27T12:12:35-03:00",
"016eb58061f54e4a478940e3dc387e085ff8e034":"2026-10-21T10:53:59-03:00",
"beb033e73f978d9766a7aa06f75beeac7e2f4203":"2026-10-21T10:53:59-03:00",
"04ea125f23aa5fe213360613eaf57c6b57bccb63":"2026-10-21T11:21:26-03:00",
"43015e0c3ac315eafd34569f930b5663bf661908":"2026-10-21T11:21:26-03:00",
"7ebbb9f58a4be1f96d0e41d15eb1a5e02b25fcda":"2026-11-05T12:04:03-03:00",
"c6bd1e73cac2d8dd538f481871c0dcf80293f594":"2026-10-23T17:31:05-03:00",
"c722a8f57f5a1daf17b170598f4f19453a6e58a1":"2026-10-23T17:31:05-03:00",
"d42a22844ac7a30d7ee6917d79ac70c57cb4947c":"2026-10-23T17:31:05-03:00",
"43cf3bdd3df6883c9d10ff6febc36a86e0a1597d":"2026-10-27T12:12:35-03:00",
"1b0db2b370fd753b3ca3986e453bcd267e71f185":"2026-10-30T10:05:11-03:00",
"2ea41936774fe2e156d19d3c0c716c433c07c943":"2026-10-30T21:42:21-03:00",
"3536dbeb7b13507a61f6365476e532acfd964760":"2026-11-02T09:48:17-03:00",
"073ea240ec2160097e91427b0ebca80185e23c7b":"2026-11-03T10:52:41-03:00",
"a184e9a22699dd4022d0e2c833ad9ccb071079a0":"2026-11-05T07:32:00-03:00",
"dd745810949c044a73762834ee77a901cea809dc":"2026-11-06T07:54:12-03:00",
"b3e4029bfb671a14eac58d488fbc7ac31cd8d459":"2026-10-29T12:40:48-03:00",
"f5380507e1e5ff11602ca05a9b62656cfb0919d2":"2026-10-30T21:42:21-03:00",
"f47a9ff06d82459c654a86b588c28098b42877e2":"2026-10-27T12:12:35-03:00",
"f3f6af50c511edb24bfe2ae237e395d59eb79d64":"2026-10-15T10:26:47-03:00",
"47070194f0d7ff751e55702ba66edec309508902":"2026-10-22T07:07:45-03:00",
"d81f4aee2ef0d8c779e168ff7efc54c5faf21188":"2026-10-23T09:23:42-03:00",
"a72a5367ef974f141d60bb29429754e1df35bcf6":"2026-10-24T08:31:22-03:00",
"f9fa77326b6718057a104b0856ca0c5cad26022a":"2026-10-24T08:33:47-03:00",
"fe055e1646870bcb01aafb5374d41bfea5351487":"2026-10-26T08:31:49-03:00",
"938b45bd36707ad00a1aecd630b17b8912057ec3":"2026-10-27T08:05:35-03:00",
"b3955e6ad0b9f3ec6297b64c79aecb0c93a65dd1":"2026-10-27T11:20:20-03:00",
"481f421b43451ce87045a1907ac7b2a464ca7ada":"2026-10-27T18:27:08-03:00",
"73b17fb5bdf167ced12b937501c2ec04fbc9e221":"2026-10-27T18:28:12-03:00",
"3b079a790a66d93bcbd42bba28e5337c8821d4ec":"2026-10-28T07:26:12-03:00",
"7cc38a4cd426f00397241b7fc3ffefcaee28a22f":"2026-10-28T09:18:14-03:00",
"62dff5848330765eed5d6844e62fbee116c958be":"2026-10-29T08:17:41-03:00",
"f1f5afbe663c49a2089ca08caaf72c23b39ccbca":"2026-10-29T08:17:41-03:00",
"8f45daad359dfef129774c80f6923c8985e91df8":"2026-10-30T09:20:51-03:00",
"7b8ddf7682663a77acb62aeec5da07c460c7933b":"2026-10-30T09:24:52-03:00",
"9ab45c6c492dff2ad497561a24ec67fbe76e19b5":"2026-11-02T09:26:57-03:00",
"80d12cd4f2a22a72c2146468cdcc4b01eab57656":"2026-11-02T09:26:57-03:00",
"2dd551a7319f3e6766f9719bbf3f883d373d1cf7":"2026-11-03T09:27:59-03:00",
"04a64cd4cf2a1c1e5774086c58dc08f3482b806d":"2026-11-03T09:27:59-03:00",
"94a568ed7c43d2b0d9e719ee4871ff8d10fac0bf":"2026-11-04T08:07:55-03:00",
"bfba5f9f8a12292e0bc2943092e9e7ebca053b51":"2026-11-04T08:07:55-03:00",
"2a67b43da592ea60985a9faee1b62e4b73ac6182":"2026-11-04T08:34:19-03:00",
"e1f5bc62412e8f3f71e8f37b54c6cf49b0d8e4da":"2026-11-05T07:08:23-03:00",
"532b7cd9e8e44d1bf21ebd31479e2f4f63a8c07e":"2026-11-05T07:09:13-03:00",
"2e44d774e306908e71a2f0f8ea2dc7cbb372321b":"2026-11-05T07:10:54-03:00",
"57d9decaab16dd957ee3c00a7165239845b8bf34":"2026-11-05T11:57:31-03:00",
"a03cc37743d956de377eac935f36b0bb21f8de21":"2026-11-05T11:58:31-03:00",
"652f689c409412faa96362e9e9695d022bcdfe9d":"2026-11-05T11:59:59-03:00",
"222be8a50639da6e26c08838acfa2cbba51b7ff6":"2026-11-06T07:25:23-03:00",
"8f83ac6f9094ffd92de487ab2a22b86a54ba9045":"2026-11-06T07:26:36-03:00",
"d69583f5a417e76dc16e7fd3bb51dd72b838644f":"2026-11-06T07:31:15-03:00",
"7e0aee77b9049fc800e0d41a6a6c464eadac4194":"2026-11-06T07:38:41-03:00",
"3a083b7bfdec4eb224c47bf8f56b862476fa53be":"2026-10-21T10:53:59-03:00",
"2fcfea390260f4215cacf8365b2bd9ed095ac10d":"2026-10-23T17:31:05-03:00",
"cbae70128dd08aa5c8c7253c1abf20a64a663a98":"2026-10-27T12:12:35-03:00",
"d2846669c945d5a112999def5c868f02083ac6bc":"2026-10-27T13:29:42-03:00",
"5e3e99623f50fbecaeb28ee140ac30d462ab4b42":"2026-10-29T12:40:48-03:00",
"796b9402239db62345139ca1646fe35741cdaccb":"2026-11-02T09:48:17-03:00",
"beb033e73f978d9766a7aa06f75beeac7e2f4203":"2026-10-15T10:26:47-03:00",
"016eb58061f54e4a478940e3dc387e085ff8e034":"2026-10-15T10:26:47-03:00",
"4c3484116ad826d2c3146e9758b47c134bb76d40":"2026-11-05T12:00:31-03:00",
"3a083b7bfdec4eb224c47bf8f56b862476fa53be":"2026-10-21T10:41:02-03:00"};
  // Lo mismo por nombre de archivo (se usa si la lista vino de jsDelivr)
  const SEMILLA_R = {"Detalle_de_ruteo_por_cateras_15.xlsx": "2026-10-27T12:12:35-03:00", "LISTADO_35.xlsx": "2026-10-21T10:53:59-03:00", "LISTADO_DE_PRECCIO_25.xlsx": "2026-10-21T10:53:59-03:00", "LP 25 HOY.xls": "2026-10-21T11:21:26-03:00", "LP 35 hoy.xls": "2026-10-21T11:21:26-03:00", "LP35 5_11.xlsx": "2026-11-05T12:04:03-03:00", "LPP_255.xlsx": "2026-10-23T17:31:05-03:00", "LPP_355.xlsx": "2026-10-23T17:31:05-03:00", "Libro1.xlsx": "2026-10-23T17:31:05-03:00", "Potencial_de_Ruta_de_Venta_6.xlsx": "2026-10-27T12:12:35-03:00", "Potencial_de_Ruta_de_Venta_TR.xlsx": "2026-10-30T10:05:11-03:00", "Potencial_de_Ruta_de_Venta_TR_1.xlsx": "2026-10-30T21:42:21-03:00", "Stock_Asuncion_Noviembre_02.pdf": "2026-11-02T09:48:17-03:00", "Stock_Asuncion_Noviembre_03.pdf": "2026-11-03T10:52:41-03:00", "Stock_Asuncion_Noviembre_05.pdf": "2026-11-05T07:32:00-03:00", "Stock_Asuncion_Noviembre_06.pdf": "2026-11-06T07:54:12-03:00", "Stock_Asuncion_Octubre_29.pdf": "2026-10-29T12:40:48-03:00", "Stock_Consolidado_por_Articulo_Oct2026.pdf": "2026-10-30T21:42:21-03:00", "Subcliente_por_Visita_latitud_y_longitud_7.xlsx": "2026-10-27T12:12:35-03:00", "clientes_top.xlsx": "2026-10-15T10:26:47-03:00", "data - 2026-10-22T070724.556.xlsx": "2026-10-22T07:07:45-03:00", "data - 2026-10-23T092045.597.xlsx": "2026-10-23T09:23:42-03:00", "data - 2026-10-24T083048.215.xlsx": "2026-10-24T08:31:22-03:00", "data - 2026-10-24T083323.713.xlsx": "2026-10-24T08:33:47-03:00", "data - 2026-10-26T083135.883.xlsx": "2026-10-26T08:31:49-03:00", "data - 2026-10-27T080515.146.xlsx": "2026-10-27T08:05:35-03:00", "data - 2026-10-27T112005.773.xlsx": "2026-10-27T11:20:20-03:00", "data - 2026-10-27T182652.651.xlsx": "2026-10-27T18:27:08-03:00", "data - 2026-10-27T182801.595.xlsx": "2026-10-27T18:28:12-03:00", "data - 2026-10-28T072556.975.xlsx": "2026-10-28T07:26:12-03:00", "data - 2026-10-28T091736.976.xlsx": "2026-10-28T09:18:14-03:00", "data - 2026-10-28T180052.694.xlsx": "2026-10-29T08:17:41-03:00", "data - 2026-10-29T081616.606.xlsx": "2026-10-29T08:17:41-03:00", "data - 2026-10-30T091639.005.xlsx": "2026-10-30T09:20:51-03:00", "data - 2026-10-30T092439.436.xlsx": "2026-10-30T09:24:52-03:00", "data - 2026-11-02T092501.408.xlsx": "2026-11-02T09:26:57-03:00", "data - 2026-11-02T092650.179.xlsx": "2026-11-02T09:26:57-03:00", "data - 2026-11-03T092530.453.xlsx": "2026-11-03T09:27:59-03:00", "data - 2026-11-03T092750.056.xlsx": "2026-11-03T09:27:59-03:00", "data - 2026-11-04T080549.560.xlsx": "2026-11-04T08:07:55-03:00", "data - 2026-11-04T080714.213.xlsx": "2026-11-04T08:07:55-03:00", "data - 2026-11-04T083405.367.xlsx": "2026-11-04T08:34:19-03:00", "data - 2026-11-05T070812.243.xlsx": "2026-11-05T07:08:23-03:00", "data - 2026-11-05T070902.536.xlsx": "2026-11-05T07:09:13-03:00", "data - 2026-11-05T071043.185.xlsx": "2026-11-05T07:10:54-03:00", "data - 2026-11-05T115715.307.xlsx": "2026-11-05T11:57:31-03:00", "data - 2026-11-05T115819.280.xlsx": "2026-11-05T11:58:31-03:00", "data - 2026-11-05T115943.054.xlsx": "2026-11-05T11:59:59-03:00", "data - 2026-11-06T072510.200.xlsx": "2026-11-06T07:25:23-03:00", "data - 2026-11-06T072620.259.xlsx": "2026-11-06T07:26:36-03:00", "data - 2026-11-06T073053.843.xlsx": "2026-11-06T07:31:15-03:00", "data - 2026-11-06T073811.633.xlsx": "2026-11-06T07:38:41-03:00", "data_-_2026-10-21T102200.999.xlsx": "2026-10-21T10:53:59-03:00", "data_-_2026-10-23T172151.854.xlsx": "2026-10-23T17:31:05-03:00", "data_-_2026-10-27T114409.143.xlsx": "2026-10-27T12:12:35-03:00", "data_-_2026-10-27T131829.846.xlsx": "2026-10-27T13:29:42-03:00", "data_-_2026-10-29T123022.559.xlsx": "2026-10-29T12:40:48-03:00", "data_-_2026-11-02T093307.165.xlsx": "2026-11-02T09:48:17-03:00", "lista_precios_25.xlsx": "2026-10-15T10:26:47-03:00", "lista_precios_35.xlsx": "2026-10-15T10:26:47-03:00", "lp 25 nov_5_11.xlsx": "2026-11-05T12:00:31-03:00", "visitas.xlsx": "2026-10-21T10:41:02-03:00"};
  // Fecha escrita con palabras en el nombre: "Stock_Asuncion_Noviembre_06.pdf", "lp 25 nov_5_11.xlsx", "LP35 5_11.xlsx"
  const MESN = {ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, set: 9, sep: 9, oct: 10, nov: 11, dic: 12};
  function fechaEnPalabras(n){
    n = String(n).toLowerCase(); const hoy = new Date();
    const anio = mm => (mm > hoy.getMonth() + 2 ? hoy.getFullYear() - 1 : hoy.getFullYear());
    let m = n.match(/(ene|feb|mar|abr|may|jun|jul|ago|set|sep|oct|nov|dic)[a-z]*[\s_-]+(\d{1,2})(?!\d)/);
    if (m){ const mm = MESN[m[1]], dd = +m[2]; if (dd >= 1 && dd <= 31) return new Date(anio(mm), mm - 1, dd, 12); }
    m = n.match(/(?:^|[\s_-])(\d{1,2})[_.-](\d{1,2})(?=\.|[\s_-]|$)/);
    if (m){ const dd = +m[1], mm = +m[2]; if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) return new Date(anio(mm), mm - 1, dd, 12); }
    return null;
  }
  // Lista de todos los archivos del repositorio en UNA sola consulta.
  // Si GitHub no responde (o limitó las consultas), se pide la lista a jsDelivr (copia pública de GitHub).
  async function listarTodo(R){
    try {
      let j = null;
      for (const ref of ['HEAD', 'main', 'master']){
        try { j = await api(`https://api.github.com/repos/${R.owner}/${R.repo}/git/trees/${ref}?recursive=1`); break; }
        catch(e){ if (/limitado|403|429/.test(e.message)) throw e; }
      }
      if (!j) throw new Error('GitHub sin lista');
      return {via: 'github', items: (j.tree || []).filter(f => f.type === 'blob').map(f => ({path: f.path, sha: f.sha}))};
    } catch(e){
      for (const rama of ['main', 'master']){
        try {
          const r = await fetch(`https://data.jsdelivr.com/v1/packages/gh/${R.owner}/${R.repo}@${rama}?structure=flat`);
          if (!r.ok) continue;
          const j = await r.json();
          return {via: 'jsdelivr', items: (j.files || []).map(f => ({path: String(f.name).replace(/^\//, ''), sha: 'jd_' + f.hash}))};
        } catch(e2){}
      }
      throw e;
    }
  }

  // Fecha de subida de un archivo (se consulta una sola vez por versión del archivo)
  async function fechaSubida(R, ruta, sha){
    const k = 'ruteoTR1_subido_' + sha, c = leerCache(k) || SEMILLA[sha];
    if (c) return new Date(c);
    if (String(sha).indexOf('jd_') === 0) return null;
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
          const todo = await listarTodo(R);
          const enCarpeta = p => { const partes = p.split('/'); partes.pop(); const dir = partes.join('/');
            if (carpeta) return dir === carpeta;
            return !dir || (CARPETAS_DATOS.test(partes[0]) && partes.length <= 3); };
          lista = {t: Date.now(), via: todo.via, items: todo.items.filter(f => enCarpeta(f.path)).map(f => ({nombre: f.path.split('/').pop(), ruta: f.path, sha: f.sha}))
            .filter(f => /\.(xlsx?|pdf)$/i.test(f.nombre) && !IGNORAR.includes(f.nombre.toLowerCase()))};
          guardarCache(kLista, lista); falloGitHub = todo.via !== 'github';
        } catch(e){
          falloGitHub = true;
          if (!lista) throw e;   // sin conexión a GitHub: se usa la última lista conocida
        }
      }
      const items = await Promise.all(lista.items.map(async f => {
        let fecha = fechaDelNombre(f.nombre) || (SEMILLA[f.sha] ? new Date(SEMILLA[f.sha]) : null) || (String(f.sha).indexOf('jd_') === 0 && SEMILLA_R[f.ruta] ? new Date(SEMILLA_R[f.ruta]) : null);
        if (!fecha && !VIEJOS.includes(f.nombre.toLowerCase())) { try { fecha = await fechaSubida(R, f.ruta, f.sha); } catch(e){ fecha = null; } }
        if (!fecha) fecha = fechaEnPalabras(f.nombre);
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
    const k = 'ruteoTR1_tipo3_' + f.sha;
    try { const c = localStorage.getItem(k); if (c) return c; } catch(e){}
    let t = 'otro';
    try {
      const XLSX = await window.cargarExcelLib();
      const buf = await bajar(f);
      const wb = window.abrirLibro ? window.abrirLibro(XLSX, buf, {sheetRows: 40}) : XLSX.read(buf, {type: 'array', sheetRows: 40});
      const H = new Set(), hojas = wb.SheetNames.slice(0, 3).map(sn => XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, defval: null}));
      let todo = '';
      hojas.forEach(rows => rows.forEach(r => (r || []).forEach(x => { const v = norm(x); if (v && v.length < 60) H.add(v); if (v) todo += ' ' + v.slice(0, 80); })));
      const tiene = (...xs) => xs.some(x => H.has(x));
      const con = re => [...H].some(x => re.test(x));
      const filas = Math.max(0, ...hojas.map(rows => rows.filter(r => r && r.some(x => x != null && String(x).trim() !== '')).length));
      // ¿Los vendedores de este Excel son de Apolo (AR1933...)?
      const deApolo = () => { const vals = []; hojas.forEach(rows => { const i = rows.findIndex(r => r && r.some(x => /^(cartera|cod vendedor|vendedor)/.test(norm(x)))); if (i < 0) return; const j = rows[i].findIndex(x => /^(cartera|cod vendedor|vendedor)/.test(norm(x))); rows.slice(i + 1).forEach(r => { if (r && r[j] != null) vals.push(String(r[j]).trim().toUpperCase()); }); }); return vals.length && vals.filter(v => /^AR\d/.test(v)).length > vals.length / 2; };
      if (/connected to power bi/.test(todo) && filas <= 3) t = 'vacio';   // exportado con "conexión dinámica": no trae datos
      else if (con(/^tiempo asist/) || con(/horas trabajadas supervisores/) || tiene('cod persona spv')) t = 'supervisores';
      else if (con(/subcliente/) && tiene('date', 'fecha') && (tiene('cartera') || con(/^cod vendedor/))) t = deApolo() ? 'apolo' : 'visitas';
      else if (tiene('desc visita') && con(/subcliente/) && con(/vendedor/)) t = 'ruteo';
      else if (tiene('latitud') && tiene('longitud')) t = 'gps';
      else if (tiene('pm') && tiene('lp') && con(/subcliente/)) t = 'padron';
      else if (con(/subcliente/) && (tiene('ventas', 'venta') || con(/^ventas /))) t = 'ventas';
      else if (tiene('cod articulo') && con(/precio/)) t = 'precios';
      else if ((tiene('codigo') || tiene('cod articulo')) && con(/^cant|^stock|existencia|^saldo/)) t = 'stock';
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
    // Se revisan TODOS los archivos (antes solo los 40 más nuevos: al subir muchos archivos,
    // el padrón, la base de ventas y el ruteo quedaban afuera y desaparecían los clientes top y el LP)
    for (const f of lista){
      if (await tipoDe(f) === tipo) out.push(f);
      if (out.length >= n) break;
    }
    return out;
  }

  /**
   * Junta varios Excel del mismo tipo (visitas, Apolo, supervisores) para tener varios meses:
   * cada mes sale del archivo MÁS NUEVO que trae ese mes. Así, al empezar un mes nuevo,
   * el mes anterior queda como histórico (con su último Excel) y el nuevo aparece aparte.
   * leerFn(buf) devuelve registros con .d = 'AAAA-MM-DD'. Devuelve {regs, usados}.
   */
  const ym = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  async function porMes(tipo, leerFn, meses){
    meses = meses || 3;
    let lista = [];
    try { lista = await window.Archivos.ultimos(''); } catch(e){ return {regs: [], usados: []}; }
    const hoy = new Date(), minMes = ym(new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1));
    const tomados = new Set(), regs = [], usados = [];
    let abiertos = 0;
    for (const f of lista){
      if (tomados.size >= meses || abiertos >= 8) break;
      // meses que puede traer el archivo: el de su fecha y, si se subió en la primera semana, también el anterior
      const cand = [];
      if (f.fecha){
        cand.push(ym(f.fecha));
        if (f.fecha.getDate() <= 7) cand.push(ym(new Date(f.fecha.getFullYear(), f.fecha.getMonth() - 1, 1)));
        if (cand.every(m => m < minMes)) break;                 // ya es más viejo que lo que se muestra
        if (cand.every(m => tomados.has(m))) continue;           // esos meses ya salieron de un archivo más nuevo
      }
      if (await tipoDe(f) !== tipo) continue;
      abiertos++;
      let rs = null; try { rs = await leerFn(await bajar(f)); } catch(e){ rs = null; }
      if (!rs || !rs.length) continue;
      const ms = new Set(rs.map(r => String(r.d).slice(0, 7)));
      const nuevos = [...ms].filter(m => !tomados.has(m) && m >= minMes);
      if (!nuevos.length) continue;
      rs.forEach(r => { if (nuevos.includes(String(r.d).slice(0, 7))) regs.push(r); });
      nuevos.forEach(m => tomados.add(m)); usados.push(f);
    }
    return {regs, usados};
  }

  // Recuerda datos de cada archivo (por ejemplo, qué listas trae)
  const tipo = {
    leer: (sha, t) => { try { return localStorage.getItem('ruteoTR1_es_' + t + '_' + sha); } catch(e){ return null; } },
    guardar: (sha, t, si) => { try { localStorage.setItem('ruteoTR1_es_' + t + '_' + sha, typeof si === 'string' ? si : (si ? '1' : '0')); } catch(e){} }
  };
  // Vuelve a consultar GitHub (botón "Actualizar")
  function olvidar(){ memoLista = null; bajados.clear(); try { Object.keys(localStorage).filter(k => k.indexOf('ruteoTR1_carpeta_') === 0).forEach(k => localStorage.removeItem(k)); } catch(e){} }
  // Texto corto para mostrar qué archivo se usó: "data - 27/10 18:26"
  function etiqueta(f){
    if (!f) return '';
    const d = f.fecha; const fx = d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '';
    return fx ? 'archivo del ' + fx : f.nombre;
  }
  // Excel subidos vacíos (exportados de Power BI con conexión dinámica) más nuevos que una fecha
  async function vaciosDesde(fecha){
    let lista = []; try { lista = await window.Archivos.ultimos(''); } catch(e){ return []; }
    const out = [];
    for (const f of lista.slice(0, 8)){ if (fecha && f.fecha && f.fecha <= fecha) break; if (await tipoDe(f) === 'vacio') out.push(f); }
    return out;
  }
  window.Archivos = { ultimos, tipo, buscar, porMes, bajar, tipoDe, porNombre, olvidar, etiqueta, vaciosDesde, fallo: () => falloGitHub };
})();
