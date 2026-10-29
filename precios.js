// =====================================================================
//  LISTA DE PRECIOS
// ---------------------------------------------------------------------
//  CÓMO ACTUALIZAR (solo quien tiene acceso a GitHub puede hacerlo):
//   Exportá del sistema el listado de precios y subilo a GitHub (página
//   principal, Agregar archivo > Subir archivos) con el nombre que traiga.
//   La app reconoce sola de qué lista es (columna cod_lista_precio) y usa
//   el archivo más nuevo de cada lista. Si cambió una sola lista, subí solo esa.
//
//  El Excel tiene que tener estas columnas (como el listado del sistema):
//  cod_articulo, desc_articulo, referencia, cod_lista_precio,
//  precio_unitario, precio_caja (y opcional cod_barra)
// =====================================================================

const CARPETA_PRECIOS = '';   // '' = página principal del repositorio

// Nombre que se muestra para cada lista (opcional)
const NOMBRES_LISTAS = { '25': 'Lista 25', '35': 'Lista 35' };

// Respaldo: si no hay carpeta "precios", se usan estos archivos de la raíz
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
  const norm = s => String(s == null ? '' : s).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]+/g, ' ').trim();
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
  let filtro = { q: '', cat: '', stock: false }, mostrados = POR_PAGINA;
  const STK = () => window.Stock && window.Stock.listo ? window.Stock : null;

  // Listas encontradas: [{id, nombre, fecha, archivo}]
  let LISTAS = [];
  const COLS = ['cod_articulo', 'desc_articulo', 'precio_unitario', 'precio_caja'];

  async function fuentes() {
    try {
      const T = window.Archivos && window.Archivos.tipo;
      // del más nuevo al más viejo; se saltean los que ya se sabe que no son de precios
      let c = window.Archivos ? await window.Archivos.buscar('precios', 10) : [];
      if (c.length) return c.slice(0, 10).map(f => {
        const m = T && T.leer(f.sha, 'precios');
        return { url: f.url, archivo: f.nombre, fecha: f.fecha, sha: f.sha, ids: (m && m !== '1') ? m.split(',') : null };
      });
    } catch (e) {}
    return LISTAS_PRECIOS.map(l => ({ url: l.archivo, archivo: l.archivo, fecha: null, id: (l.archivo.match(/(\d{2,3})/) || [])[1] || l.nombre }));
  }

  // Busca el número de lista en un nombre: primero las listas conocidas (25, 35...), si no, el último número
  function deNombre(n) {
    const s = String(n || '').replace(/\.xlsx?$/i, '');
    const conocida = Object.keys(NOMBRES_LISTAS).find(k => new RegExp('(^|\\D)' + k + '(\\D|$)').test(s))
      || Object.keys(NOMBRES_LISTAS).find(k => s.includes(k));
    if (conocida) return conocida;
    const m = s.match(/(\d{2,3})(?!.*\d)/); return m ? m[1] : '';
  }

  function cargar() {
    if (productos || cargando) return cargando;
    cargando = (async () => {
      const fs = await fuentes();
      const tomadas = new Map();   // id de lista -> filas (del archivo más nuevo)
      const fallas = [];
      for (const f of fs) {
        // si ya se sabe qué listas trae este archivo y todas vienen en uno más nuevo, no se descarga
        if (f.ids && f.ids.every(id => tomadas.has(id))) continue;
        let filas;
        const T = window.Archivos && window.Archivos.tipo;
        let hoja = '';
        try { const x = await window.leerExcel(f.url, COLS); filas = x.filas; hoja = x.hoja || ''; }
        catch (e) { if (T && f.sha) T.guardar(f.sha, 'precios', false); else fallas.push(f.archivo); continue; }
        const porLista = new Map();
        filas.forEach(r => {
          // de qué lista es: columna cod_lista_precio, o el nombre de la hoja (ej. "LP 35"), o el nombre del archivo
          const id = String(r['cod lista precio'] || f.id || deNombre(hoja) || deNombre(f.archivo) || 'Lista').trim();
          if (!porLista.has(id)) porLista.set(id, []);
          porLista.get(id).push(r);
        });
        porLista.forEach((rs, id) => { if (!tomadas.has(id)) tomadas.set(id, { filas: rs, fecha: f.fecha, archivo: f.archivo }); });
        if (T && f.sha && porLista.size) T.guardar(f.sha, 'precios', [...porLista.keys()].join(','));
      }
      LISTAS = [...tomadas.keys()].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) || a.localeCompare(b))
        .map(id => ({ id, nombre: NOMBRES_LISTAS[id] || (/^\d+$/.test(id) ? 'Lista ' + id : id), fecha: tomadas.get(id).fecha, archivo: tomadas.get(id).archivo }));
      const map = new Map();
      LISTAS.forEach(L => tomadas.get(L.id).filas.forEach(f => {
        const cod = String(f['cod articulo']).trim(); if (!cod) return;
        let p = map.get(cod);
        if (!p) {
          const desc = f['desc articulo'] || '';
          p = { cod, desc, ref: f['referencia'] || '', barra: String(f['cod barra'] || '').replace(/[^\d]/g, ''), precios: {}, ...clasificar(desc) };
          p.busca = norm(p.desc + ' ' + p.ref + ' ' + p.cod + ' ' + p.barra + ' ' + (p.marca || ''));
          map.set(cod, p);
        }
        p.precios[L.id] = { u: num(f['precio unitario']), c: num(f['precio caja']) };
      }));
      productos = [...map.values()];
      if (!productos.length) error = fallas.length ? 'No se pudo leer: ' + fallas.join(', ') : 'Todavía no se subió ninguna lista de precios.';
      else if (fallas.length) error = 'No se pudo leer: ' + fallas.join(', ');
      cargando = null;
      pintar();
    })();
    return cargando;
  }

  // --- Pantalla ---
  let armado = false;
  let modo = { lista: null, cliente: null };   // lista del cliente que se está mirando
  function armar() {
    if (armado) return; armado = true;
    const v = document.createElement('div');
    v.id = 'lpSheet'; v.className = 'lp-sheet'; v.hidden = true;
    v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Lista de precios del cliente');
    document.body.appendChild(v);
    v.innerHTML = `
      <div class="pv-wrap">
        <div class="lp-top">
          <button type="button" class="lp-volver" id="lpVolver" aria-label="Volver"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
          <div class="lp-cli" id="lpCli"></div>
        </div>
        <div class="pv-head">
          <p id="pvResumen">Cargando precios…</p>
        </div>
        <div class="pv-sticky">
          <div class="search-wrap">
            <svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="pvBuscar" type="text" placeholder="Producto o código" autocomplete="off" aria-label="Buscar producto" enterkeyhint="search" />
            <button class="x-btn" id="pvLimpiar" type="button" aria-label="Borrar búsqueda">✕</button>
          </div>
          <div class="pv-cats" id="pvCats"></div>
          <div class="pv-cols" id="pvCols" aria-hidden="true"></div>
        </div>
        <div id="pvLista" class="pv-list"></div>
      </div>`;
    let t = null;
    $('pvBuscar').addEventListener('input', e => {
      clearTimeout(t); const val = e.target.value;
      t = setTimeout(() => { filtro.q = norm(val); mostrados = POR_PAGINA; pintar(); }, 140);
    });
    $('pvLimpiar').onclick = () => { $('pvBuscar').value = ''; filtro.q = ''; mostrados = POR_PAGINA; pintar(); $('pvBuscar').focus(); };
    $('lpVolver').onclick = () => history.state && history.state.lp ? history.back() : cerrar();
    window.addEventListener('popstate', () => { if (!$('lpSheet').hidden) cerrar(); });
  }
  function cerrar() {
    const v = $('lpSheet'); if (!v || v.hidden) return;
    v.hidden = true; document.body.classList.remove('lp-abierta');
    window.scrollTo({ top: modo.scroll || 0 });
  }
  // Abre los precios de la lista que usa el cliente: {nombre, codigo, lp, pm}
  function abrirCliente(cli) {
    armar();
    modo = { lista: cli.lp ? String(cli.lp).trim() : null, cliente: cli, scroll: window.scrollY };
    filtro = { q: '', cat: '', stock: false }; mostrados = POR_PAGINA; $('pvBuscar').value = '';
    $('lpCli').innerHTML = `<b>${esc(cli.nombre)}</b><div class="lp-tags">${cli.codigo ? `<span class="lp-cod">${esc(cli.codigo)}</span>` : ''}<span class="lp-tag lp">Usa LP ${esc(cli.lp || '—')}</span><span class="lp-tag pm">PM ${esc(cli.pm || '—')}</span></div>`;
    const v = $('lpSheet'); v.hidden = false; v.scrollTop = 0;
    document.body.classList.add('lp-abierta');
    try { history.pushState({ lp: 1 }, ''); } catch (e) {}
    pintar(); cargar();
    if (window.Stock && !window.Stock.listo) window.Stock.cargar().then(() => { if (!$('lpSheet').hidden) pintar(); });
  }

  const listasVis = () => modo.lista ? LISTAS.filter(L => L.id === modo.lista) : LISTAS;
  const conPrecio = () => { const ls = listasVis(); return productos.filter(p => ls.some(L => p.precios[L.id])); };
  function filtrar() {
    const palabras = filtro.q ? filtro.q.split(' ') : [];
    return conPrecio().filter(p => (!filtro.cat || p.cat === filtro.cat) && (!filtro.stock || !STK() || STK().de(p.cod) > 0) && palabras.every(w => p.busca.includes(w)));
  }

  function pintarCats() {
    const orden = ((typeof CATALOGO !== 'undefined') ? CATALOGO.CATEGORIAS.map(c => c.nombre) : []).concat(['Otros']);
    const base = conPrecio();
    const cnt = {}; base.forEach(p => cnt[p.cat] = (cnt[p.cat] || 0) + 1);
    const cats = orden.filter(c => cnt[c]);
    const conSt = STK() ? base.filter(p => STK().de(p.cod) > 0).length : 0;
    $('pvCats').innerHTML = (STK() ? `<button type="button" data-st="1" class="st ${filtro.stock ? 'on' : ''}">✓ Con stock<small>${conSt}</small></button>` : '') +
      `<button type="button" data-c="" class="${!filtro.cat ? 'on' : ''}">Todos<small>${base.length}</small></button>` +
      cats.map(c => `<button type="button" data-c="${esc(c)}" class="${filtro.cat === c ? 'on' : ''}">${esc(c)}<small>${cnt[c]}</small></button>`).join('');
    $('pvCats').querySelectorAll('button').forEach(b => b.onclick = () => {
      if (b.dataset.st) filtro.stock = !filtro.stock; else filtro.cat = b.dataset.c;
      mostrados = POR_PAGINA; pintar();
      $('lpSheet').scrollTop = 0;
    });
  }

  function resaltar(texto) {
    const t = String(texto);
    if (!filtro.q) return esc(t);
    // resalta cada palabra buscada (sin distinguir tildes ni mayúsculas)
    const base = t.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    const precios = listasVis().map(L => {
      const pr = p.precios[L.id];
      return pr ? `<div class="pv-price"><b>${gs(pr.u)}</b><span>caja ${gs(pr.c)}</span></div>` : `<div class="pv-price none"><b>—</b><span>sin precio</span></div>`;
    }).join('');
    return `<article class="pv-item">
      <div class="pv-info">
        <div class="pv-desc">${resaltar(p.desc)}</div>
        <div class="pv-meta">${(() => { const S = STK(); if (!S) return ''; const q = S.de(p.cod); return q > 0 ? `<span class="pv-stock ok">Stock ${Math.round(q).toLocaleString('es-PY')}</span>` : '<span class="pv-stock no">Sin stock</span>'; })()}<span class="pv-ref">${resaltar(p.ref)}</span><span class="pv-cod">${resaltar(p.cod)}</span>${p.pagina ? `<button type="button" class="pv-cat" data-p="${p.pagina}" aria-label="Ver ${esc(p.marca)} en el catálogo, página ${p.pagina}">${ICON_LIBRO}<span>Catálogo</span></button>` : ''}</div>
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
      lista.innerHTML = `<div class="pv-state"><b>No hay lista de precios para mostrar</b><span>Subí a GitHub el listado de precios del sistema. (${esc(error)})</span></div>`;
      return;
    }
    const LV = listasVis();
    if (modo.lista && !LV.length) {
      $('pvCats').innerHTML = ''; $('pvCols').innerHTML = '';
      $('pvResumen').textContent = '';
      lista.innerHTML = `<div class="pv-state"><b>La lista LP ${esc(modo.lista)} no está cargada en la app</b><span>Por ahora la app tiene ${LISTAS.map(L => esc(L.nombre)).join(' y ') || 'ninguna lista'}. Para ver esta lista, subí a GitHub el listado de precios ${esc(modo.lista)}.</span></div>`;
      return;
    }
    pintarCats();
    $('pvCols').innerHTML = `<span>Producto</span>` + LV.map(L => `<span>${esc(L.nombre)}</span>`).join('');
    document.documentElement.style.setProperty('--pv-n', LV.length || 1);
    const res = filtrar();
    const fTxt = LV.filter(L => L.fecha).map(L => `${esc(L.nombre)} actualizada el ${L.fecha.toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}`);
    $('pvResumen').innerHTML = `${conPrecio().length.toLocaleString('es-PY')} productos, en guaraníes por unidad y por caja.${fTxt.length ? `<br><span class="pv-fecha">${fTxt.join(' · ')}</span>` : ''}${error ? ` <span class="pv-warn">${esc(error)}</span>` : ''}`;
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
    mostrar() { armar(); pintar(); cargar(); },
    abrirCliente,
    cerrar,
    asegurar(){ return productos ? Promise.resolve() : (cargar() || Promise.resolve()); },
    codigos(){ return productos ? new Set(productos.map(p => String(p.cod))) : null; },
    desc(cod){ const p = productos && productos.find(x => String(x.cod) === String(cod)); return p ? p.desc + (p.ref ? ' · ' + p.ref : '') : ''; }
  };
})();
