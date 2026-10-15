// =====================================================================
//  CATÁLOGO DE PRODUCTOS 2025
// ---------------------------------------------------------------------
//  Las páginas están en la carpeta "catalogo" (pag-01.webp ... pag-77.webp).
//  Cada página se descarga recién cuando el vendedor llega a ella.
//
//  Para cambiar el catálogo: reemplazá las imágenes de la carpeta y,
//  si cambia la cantidad de páginas, actualizá TOTAL_PAGINAS.
//  El índice de marcas (MARCAS) indica en qué página empieza cada una.
// =====================================================================

const CATALOGO = {
  TITULO: 'Catálogo 2025',
  TOTAL_PAGINAS: 77,
  CARPETA: 'catalogo/',

  CATEGORIAS: [
    { nombre: 'Almacén',            desde: 2,  hasta: 12 },
    { nombre: 'Limpieza y hogar',   desde: 13, hasta: 25 },
    { nombre: 'Cuidado personal',   desde: 26, hasta: 36 },
    { nombre: 'Snacks y dulces',    desde: 37, hasta: 55 },
    { nombre: 'Bebidas',            desde: 56, hasta: 61 },
    { nombre: 'Vinos y sidras',     desde: 62, hasta: 70 },
    { nombre: 'Cervezas',           desde: 71, hasta: 75 },
    { nombre: 'Destilados',         desde: 76, hasta: 77 }
  ],

  // "Marca": página donde aparece
  MARCAS: {
    'Listo': 2, 'Piacere': 6, 'Menoyo': 7, 'Rivoli': 10, 'Mesa': 11, 'Copacol': 11, 'Cuenca': 12,
    'Residence': 13, 'Lumipam': 16, 'Sandero': 17, 'Luminous': 19, 'Bluf': 21, 'Silver': 22,
    'Urca': 23, 'Baby Soft': 25, 'Alma de Flores': 26, 'Biocrema': 27, 'Beautycolor': 28,
    'Anasol': 32, 'Novex': 35, 'Selky': 37, 'Fritop': 38, 'Vitao': 40, 'Casaredo': 44, 'My Bit': 45,
    'Chocobon': 46, 'Bakemate': 46, 'Matilde Vicenzi': 47, 'Grisbi': 48, 'Lacasa': 49, 'Lacasitos': 50,
    'Biscolata': 51, 'Sölen': 52, 'Barkleys': 53, 'Compass': 54, 'Saadet': 55, 'Maguary': 56,
    'Fruit Shoot': 57, 'Nuts': 58, 'Puro Coco': 58, 'Natural Tea': 58, 'OKF': 59, 'Coco do Vale': 61,
    'Santa Mónica': 62, '7 Colinas': 64, 'Viñas de Balbo': 65, 'Resero': 66, 'Otro Loco Más': 67,
    'Sol de Chile': 68, 'Nampe': 69, 'La Farruca': 70, 'Opa Bier': 71, 'Karlsbräu': 72, 'Leuven': 73,
    'Schornstein': 74, 'Unicorn': 75, 'Kovak': 76, 'Thoquino': 77
  }
};


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ: visor del catálogo.
// ---------------------------------------------------------------------
(function () {
  const C = CATALOGO, N = C.TOTAL_PAGINAS;
  const pad = n => String(n).padStart(2, '0');
  const src = n => C.CARPETA + 'pag-' + pad(n) + '.webp';
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const catDe = p => C.CATEGORIAS.find(c => p >= c.desde && p <= c.hasta);

  // Botón que abre el catálogo (en la barra inferior)
  const boton = document.getElementById('navCatalogo') || document.getElementById('btnCatalogo');

  // --- Estructura del visor (se crea al abrirlo por primera vez) ---
  let ov = null, pagesEl, pageLbl, idx, idxSearch, idxList, catChips, obs;
  let actual = 1, abierto = false;

  function construir() {
    ov = document.createElement('div');
    ov.id = 'catalogo'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', C.TITULO);
    ov.innerHTML = `
      <div class="cat-bar">
        <button type="button" class="cat-x" data-cat="cerrar" aria-label="Cerrar catálogo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="cat-tit"><b>${esc(C.TITULO)}</b><span id="catPagina">Página 1 de ${N}</span></div>
        <button type="button" class="cat-marcas" data-cat="indice" aria-expanded="false">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Marcas
        </button>
      </div>
      <div class="cat-idx" id="catIndice" hidden>
        <input type="search" id="catBuscar" placeholder="Buscar marca" autocomplete="off" aria-label="Buscar marca" enterkeyhint="search" />
        <div class="cat-cats" id="catCats"></div>
        <div class="cat-list" id="catLista"></div>
      </div>
      <div class="cat-pages" id="catPaginas"></div>`;
    document.body.appendChild(ov);

    pagesEl = ov.querySelector('#catPaginas');
    pageLbl = ov.querySelector('#catPagina');
    idx = ov.querySelector('#catIndice');
    idxSearch = ov.querySelector('#catBuscar');
    idxList = ov.querySelector('#catLista');
    catChips = ov.querySelector('#catCats');

    // Páginas: el navegador descarga cada imagen recién cuando se acerca a la pantalla
    let h = '';
    for (let p = 1; p <= N; p++) {
      h += `<figure class="cat-page" id="cat-p${p}" data-p="${p}">
        <img src="${src(p)}" alt="Página ${p} del catálogo" loading="lazy" decoding="async" width="1100" height="1556" />
        <figcaption>${p}</figcaption></figure>`;
    }
    pagesEl.innerHTML = h;
    // Por si las imágenes se subieron sueltas (sin la carpeta "catalogo")
    pagesEl.querySelectorAll('img').forEach(img => img.addEventListener('error', function () {
      if (!this.dataset.retry) { this.dataset.retry = '1'; this.src = this.src.replace(C.CARPETA, ''); }
    }));

    // Página visible
    obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { actual = +e.target.dataset.p; actualizarEtiqueta(); } });
    }, { root: pagesEl, rootMargin: '-45% 0px -45% 0px' });
    pagesEl.querySelectorAll('.cat-page').forEach(f => obs.observe(f));

    // Índice
    catChips.innerHTML = `<button type="button" class="on" data-c="">Todas</button>` +
      C.CATEGORIAS.map(c => `<button type="button" data-c="${esc(c.nombre)}">${esc(c.nombre)}</button>`).join('');
    catChips.querySelectorAll('button').forEach(b => b.onclick = () => {
      catChips.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      pintarIndice();
    });
    idxSearch.addEventListener('input', pintarIndice);
    pintarIndice();

    ov.querySelector('[data-cat="cerrar"]').onclick = () => cerrar();
    ov.querySelector('[data-cat="indice"]').onclick = () => verIndice(idx.hidden);
    ov.addEventListener('keydown', e => { if (e.key === 'Escape') { idx.hidden ? cerrar() : verIndice(false); } });
  }

  function actualizarEtiqueta() {
    const c = catDe(actual);
    pageLbl.textContent = `Página ${actual} de ${N}` + (c ? ` · ${c.nombre}` : '');
  }

  function pintarIndice() {
    const q = norm(idxSearch.value.trim());
    const catSel = (catChips.querySelector('.on') || {}).dataset?.c || '';
    const items = Object.entries(C.MARCAS)
      .filter(([m, p]) => (!q || norm(m).includes(q)) && (!catSel || (catDe(p) || {}).nombre === catSel))
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
    idxList.innerHTML = items.length
      ? items.map(([m, p]) => `<button type="button" data-p="${p}"><span>${esc(m)}</span><small>Pág. ${p}</small></button>`).join('')
      : `<p class="cat-vacio">No hay marcas con "${esc(idxSearch.value.trim())}".</p>`;
    idxList.querySelectorAll('button').forEach(b => b.onclick = () => { verIndice(false); irA(+b.dataset.p); });
  }

  function verIndice(on) {
    idx.hidden = !on;
    ov.querySelector('[data-cat="indice"]').setAttribute('aria-expanded', on);
    ov.classList.toggle('con-indice', on);
    if (on) { idxSearch.value = ''; pintarIndice(); setTimeout(() => idxSearch.focus(), 50); }
  }

  function irA(p) {
    const f = document.getElementById('cat-p' + p); if (!f) return;
    pagesEl.scrollTo({ top: f.offsetTop - 8, behavior: 'auto' });
    actual = p; actualizarEtiqueta();
  }

  function abrir(pagina) {
    if (!ov) construir();
    if (abierto) return;
    abierto = true;
    ov.classList.add('show');
    document.documentElement.classList.add('cat-abierto');
    if (location.hash !== '#catalogo') history.pushState({ catalogo: true }, '', '#catalogo');
    if (pagina) irA(pagina);
    ov.querySelector('.cat-x').focus({ preventScroll: true });
  }

  function cerrar(desdeHistorial) {
    if (!abierto) return;
    abierto = false;
    ov.classList.remove('show');
    verIndice(false);
    document.documentElement.classList.remove('cat-abierto');
    if (!desdeHistorial && location.hash === '#catalogo') history.back();
    if (boton) boton.focus({ preventScroll: true });
  }

  // La app (barra inferior y lista de precios) abre el catálogo con esta función
  window.abrirCatalogo = abrir;
  // El botón "atrás" del celular cierra el catálogo en vez de salir de la app
  window.addEventListener('popstate', () => { if (abierto && location.hash !== '#catalogo') cerrar(true); });
  if (location.hash === '#catalogo') { history.replaceState(null, '', location.pathname + location.search); abrir(); }
})();
