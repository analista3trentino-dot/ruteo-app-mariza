// =====================================================================
//  LISTA DE PRECIOS
// ---------------------------------------------------------------------
//  La app lee los precios directamente de estos Excel subidos a GitHub.
//  Para actualizar precios: subí el Excel nuevo con el MISMO nombre de
//  archivo y confirmá los cambios. No hace falta tocar nada más.
//
//  El Excel tiene que tener estas columnas (como el listado del sistema):
//  cod_articulo, cod_barra, desc_articulo, referencia,
//  precio_unitario, precio_caja
// =====================================================================

const LISTAS_PRECIOS = [
  { archivo: 'lista_precios_25.xlsx', nombre: 'Lista 25' },
  { archivo: 'lista_precios_35.xlsx', nombre: 'Lista 35' }
];


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ: pantalla de precios.
// ---------------------------------------------------------------------
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = s => String(s == null ? '' : s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, ' ').trim();
  const gs = n => (n == null || isNaN(n)) ? '—' : Math.round(n).toLocaleString('es-PY');
  const num = v => {
    const t = String(v).trim(); if (!t) return null;
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);            // número tal cual (ej. 21525)
    const n = Number(t.replace(/[^\d,-]/g, '').replace(',', '.')); // formato local (ej. 21.525)
    return isNaN(n) ? null : n;
  };
  const POR_PAGINA = 60;

  const ICON_LIBRO = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>';

  // --- Marca y categoría de cada producto (para filtrar y abrir el catálogo) ---
  const ALIAS = {
    'Beautycolor': ['BEAUTY COLOR', 'BEAUTYCOLOR', 'BEAUTY'], 'Matilde Vicenzi': ['VICENZI'], 'Baby Soft': ['BABY SOFT', 'BABYSOFT'],
    'Sölen': ['SOLEN', 'OZMO'], 'Santa Mónica': ['SANTA MONICA'], 'Karlsbräu': ['KARLSBRAU'], 'Coco do Vale': ['COCO DO VALE', 'DO VALE'],
    'Alma de Flores': ['ALMA DE FLORES', 'ALMA DE FLOR'], 'Opa Bier': ['OPA BIER', 'OPA'], '7 Colinas': ['7 COLINAS'], 'Viñas de Balbo': ['BALBO'],
    'Otro Loco Más': ['OTRO LOCO'], 'Fruit Shoot': ['FRUIT SHOOT'], 'Puro Coco': ['PURO COCO'], 'Natural Tea': ['NATURAL TEA'],
    'My Bit': ['MY BIT', 'MYBIT'], 'Chocobon': ['CHOCOBON', 'CHOCO BON'], 'Sol de Chile': ['SOL DE CHILE'], 'La Farruca': ['FARRUCA'],
    'Saadet': ['SAADET', 'BAYBALON', 'BAY BALON'], 'Kovak': ['KOVAK', 'KRAKOVIA']
  };
  // Bebidas con alcohol: se reconocen por el tipo de producto
  const REGLAS_PRIMERO = [
    [/^(VINO|ESPUMANTE|SIDRA|CHAMPAGNE)\b/, 'Vinos y sidras'],
    [/^CERVEZA\b/, 'Cervezas'],
    [/^(LICOR|COGNAC|STEINHAEGER|WHISKY|VODKA|FERNET|CANA|LIMONCE|GIN|RON|PRAIANINHA|STOCK 84)\b|\b(LICOR|FERNET|VERMOUTH|APERITIVO|WHISKY|VODKA|BRANDY|GIN)\b/, 'Destilados']
  ];
  // Si la marca no está en el catálogo
  const REGLAS_DESPUES = [
    [/^(MAXTON|ALIVIOSOL|SENADOR)\b/, 'Cuidado personal'],
    [/^(FOSFORO|CUERDA|SUPRA)\b/, 'Limpieza y hogar'],
    [/^(TOMATINO|CUAJO)\b/, 'Almacén'],
    [/\b(CHICLE|GOMITAS|GUMMY|PASTILLAS|CARAMELO|CONGUITOS|CHOCOLATE|GALL|GALLETITA|WAFER)\b/, 'Snacks y dulces']
  ];
  let claves = null;
  function prepararMarcas() {
    if (claves) return;
    claves = [];
    const C = (typeof CATALOGO !== 'undefined') ? CATALOGO : { MARCAS: {}, CATEGORIAS: [] };
    Object.entries(C.MARCAS).forEach(([m, p]) => (ALIAS[m] || [norm(m)]).forEach(a => claves.push({ a: ' ' + norm(a) + ' ', m, p })));
    claves.sort((x, y) => y.a.length - x.a.length);
  }
  function categoriaDePagina(p) {
    const C = (typeof CATALOGO !== 'undefined') ? CATALOGO : { CATEGORIAS: [] };
    const c = C.CATEGORIAS.find(c => p >= c.desde && p <= c.hasta);
    return c ? c.nombre : null;
  }
  function clasificar(desc) {
    prepararMarcas();
    const d = norm(desc), dd = ' ' + d + ' ';
    const k = claves.find(k => dd.includes(k.a));
    let cat = null;
    for (const [re, c] of REGLAS_PRIMERO) if (re.test(d)) { cat = c; break; }
    if (!cat && k) cat = categoriaDePagina(k.p);
    if (!cat) for (const [re, c] of REGLAS_DESPUES) if (re.test(d)) { cat = c; break; }
    return { marca: k ? k.m : null, pagina: k ? k.p : null, cat: cat || 'Otros' };
  }

  // --- Datos ---
  let productos = null, cargando = null, error = '';
  let filtro = { q: '', cat: '' }, mostrados = POR_PAGINA;

  function cargar() {
    if (productos || cargando) return cargando;
    cargando = Promise.all(LISTAS_PRECIOS.map(l =>
      window.leerExcel(l.archivo, ['cod_articulo', 'desc_articulo', 'precio_unitario', 'precio_caja'])
        .then(r => ({ l, filas: r.filas }))
        .catch(e => ({ l, filas: [], err: e.message || String(e) }))
    )).then(res => {
      const map = new Map();
      res.forEach((r, li) => r.filas.forEach(f => {
        const cod = String(f['cod articulo']).trim(); if (!cod) return;
        let p = map.get(cod);
        if (!p) {
          const desc = f['desc articulo'] || '';
          p = { cod, desc, ref: f['referencia'] || '', barra: String(f['cod barra'] || '').replace(/[^\d]/g, ''), precios: [], ...clasificar(desc) };
          p.busca = norm(p.desc + ' ' + p.ref + ' ' + p.cod + ' ' + p.barra + ' ' + (p.marca || ''));
          map.set(cod, p);
        }
        p.precios[li] = { u: num(f['precio unitario']), c: num(f['precio caja']) };
      }));
      productos = [...map.values()];
      const fallas = res.filter(r => r.err);
      if (!productos.length) error = fallas.map(f => f.err).join(' · ') || 'Los archivos no tienen productos.';
      else if (fallas.length) error = 'No se pudo leer: ' + fallas.map(f => f.l.archivo).join(', ');
      cargando = null;
      pintar();
    });
    return cargando;
  }

  // --- Pantalla ---
  let armado = false;
  function armar() {
    if (armado) return; armado = true;
    const v = $('preciosView');
    v.innerHTML = `
      <div class="pv-wrap">
        <div class="pv-head">
          <h2>Lista de precios</h2>
          <p id="pvResumen">Cargando precios…</p>
        </div>
        <div class="pv-sticky">
          <div class="search-wrap">
            <svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="pvBuscar" type="text" placeholder="Producto o código" autocomplete="off" aria-label="Buscar producto" enterkeyhint="search" />
            <button class="x-btn" id="pvLimpiar" type="button" aria-label="Borrar búsqueda">✕</button>
          </div>
          <div class="pv-cats" id="pvCats"></div>
          <div class="pv-cols" aria-hidden="true"><span>Producto</span>${LISTAS_PRECIOS.map(l => `<span>${esc(l.nombre)}</span>`).join('')}</div>
        </div>
        <div id="pvLista" class="pv-list"></div>
      </div>`;
    let t = null;
    $('pvBuscar').addEventListener('input', e => {
      clearTimeout(t); const val = e.target.value;
      t = setTimeout(() => { filtro.q = norm(val); mostrados = POR_PAGINA; pintar(); }, 140);
    });
    $('pvLimpiar').onclick = () => { $('pvBuscar').value = ''; filtro.q = ''; mostrados = POR_PAGINA; pintar(); $('pvBuscar').focus(); };
  }

  function filtrar() {
    const palabras = filtro.q ? filtro.q.split(' ') : [];
    return productos.filter(p => (!filtro.cat || p.cat === filtro.cat) && palabras.every(w => p.busca.includes(w)));
  }

  function pintarCats() {
    const orden = ((typeof CATALOGO !== 'undefined') ? CATALOGO.CATEGORIAS.map(c => c.nombre) : []).concat(['Otros']);
    const cnt = {}; productos.forEach(p => cnt[p.cat] = (cnt[p.cat] || 0) + 1);
    const cats = orden.filter(c => cnt[c]);
    $('pvCats').innerHTML = `<button type="button" data-c="" class="${!filtro.cat ? 'on' : ''}">Todos<small>${productos.length}</small></button>` +
      cats.map(c => `<button type="button" data-c="${esc(c)}" class="${filtro.cat === c ? 'on' : ''}">${esc(c)}<small>${cnt[c]}</small></button>`).join('');
    $('pvCats').querySelectorAll('button').forEach(b => b.onclick = () => {
      filtro.cat = b.dataset.c; mostrados = POR_PAGINA; pintar();
      window.scrollTo({ top: Math.min(window.scrollY, $('preciosView').offsetTop) });
    });
  }

  function resaltar(texto) {
    const t = String(texto);
    if (!filtro.q) return esc(t);
    // resalta cada palabra buscada (sin distinguir tildes ni mayúsculas)
    const base = t.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const marcas = new Array(t.length).fill(false);
    filtro.q.split(' ').forEach(w => { if (!w) return; let i = base.indexOf(w); while (i >= 0) { for (let k = i; k < i + w.length; k++) marcas[k] = true; i = base.indexOf(w, i + w.length); } });
    let out = '', dentro = false;
    for (let i = 0; i < t.length; i++) {
      if (marcas[i] && !dentro) { out += '<mark>'; dentro = true; }
      if (!marcas[i] && dentro) { out += '</mark>'; dentro = false; }
      out += esc(t[i]);
    }
    return out + (dentro ? '</mark>' : '');
  }

  function filaHtml(p) {
    const precios = LISTAS_PRECIOS.map((l, i) => {
      const pr = p.precios[i];
      return pr ? `<div class="pv-price"><b>${gs(pr.u)}</b><span>caja ${gs(pr.c)}</span></div>` : `<div class="pv-price none"><b>—</b><span>sin precio</span></div>`;
    }).join('');
    return `<article class="pv-item">
      <div class="pv-info">
        <div class="pv-desc">${resaltar(p.desc)}</div>
        <div class="pv-meta"><span class="pv-ref">${resaltar(p.ref)}</span><span class="pv-cod">${resaltar(p.cod)}</span>${p.pagina ? `<button type="button" class="pv-cat" data-p="${p.pagina}" aria-label="Ver ${esc(p.marca)} en el catálogo, página ${p.pagina}">${ICON_LIBRO}<span>Catálogo</span></button>` : ''}</div>
      </div>
      ${precios}
    </article>`;
  }

  function pintar() {
    if (!armado) return;
    const lista = $('pvLista');
    $('pvLimpiar').classList.toggle('show', !!filtro.q);
    if (!productos) { lista.innerHTML = `<div class="pv-state"><b>Cargando precios…</b></div>`; return; }
    if (!productos.length) {
      $('pvResumen').textContent = 'No se pudieron cargar los precios.';
      lista.innerHTML = `<div class="pv-state"><b>No se pudo leer la lista de precios</b><span>Revisá que los archivos ${LISTAS_PRECIOS.map(l => `<code>${esc(l.archivo)}</code>`).join(' y ')} estén subidos en GitHub. (${esc(error)})</span></div>`;
      return;
    }
    pintarCats();
    const res = filtrar();
    $('pvResumen').innerHTML = `${productos.length.toLocaleString('es-PY')} productos. Precios en guaraníes, por unidad y por caja.${error ? ` <span class="pv-warn">${esc(error)}</span>` : ''}`;
    if (!res.length) {
      lista.innerHTML = `<div class="pv-state"><b>No hay productos con "${esc($('pvBuscar').value.trim())}"</b><span>Probá con otra palabra, el código o el código de barras.</span><button type="button" class="clear-btn" id="pvReset">Ver todos los productos</button></div>`;
      $('pvReset').onclick = () => { $('pvBuscar').value = ''; filtro = { q: '', cat: '' }; mostrados = POR_PAGINA; pintar(); };
      return;
    }
    const vis = res.slice(0, mostrados);
    lista.innerHTML = vis.map(filaHtml).join('') +
      (res.length > mostrados ? `<button type="button" class="pv-more" id="pvMas">Mostrar más (${(res.length - mostrados).toLocaleString('es-PY')} restantes)</button>` : '');
    const mas = $('pvMas'); if (mas) mas.onclick = () => { mostrados += POR_PAGINA * 2; pintar(); };
    lista.querySelectorAll('.pv-cat').forEach(b => b.onclick = () => { if (window.abrirCatalogo) window.abrirCatalogo(+b.dataset.p); });
  }

  window.Precios = {
    mostrar() { armar(); pintar(); cargar(); }
  };
})();
