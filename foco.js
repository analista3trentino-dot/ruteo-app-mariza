// =====================================================================
//  PRODUCTOS FOCO + MARCAS POTENCIALES DEL MES
// ---------------------------------------------------------------------
//  Se ven en:
//   - una franja finita arriba de la Ruta ("★ Foco de Noviembre"), que abre la pantalla de foco
//   - la pantalla de foco, con dos pestañas: "Foco del mes" y "Potenciales"
//     (en Potenciales, las de CANASTAS NAVIDEÑAS van aparte con su sello 🎄)
//   - el Catálogo, arriba de la primera página
//  Las marcas se cambian en config.js (PRODUCTOS_FOCO y MARCAS_POTENCIALES).
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const nrm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const COLORES = ['#E5484D', '#2E5BFF', '#12A150', '#F5A524', '#7E5BEF', '#0EA5E9', '#DB2777', '#B45309'];
  const NAVIDAD = ['#C8102E', '#1B7F4B'];
  const gs = n => Number(n || 0).toLocaleString('es-PY');

  const cfg = () => (typeof PRODUCTOS_FOCO !== 'undefined' ? PRODUCTOS_FOCO : {}) || {};
  const cfgP = () => (typeof MARCAS_POTENCIALES !== 'undefined' ? MARCAS_POTENCIALES : {}) || {};
  const norm = x => typeof x === 'string' ? {marca: x} : Object.assign({}, x);

  // Cada marca puede venir como texto ("Mesa") o con detalle ({marca: "Urca", producto: "...", ...})
  function lista(){
    const P = cfg(); if (!P.marcas || !P.marcas.length) return [];
    return P.marcas.map((x, i) => { const o = norm(x); o.color = COLORES[i % COLORES.length]; o.foco = true; return o; });
  }
  // Potenciales: si la marca también es foco, toma su producto, foto y referencias
  function listaPot(){
    const P = cfgP(); if (!P.marcas || !P.marcas.length) return [];
    const F = lista(); let k = 0;
    return P.marcas.map(x => {
      const o = norm(x), f = F.find(y => nrm(y.marca) === nrm(o.marca));
      const r = f ? Object.assign({}, f, o, {foco: true}) : o;
      r.pot = true;
      r.color = o.canasta ? NAVIDAD[k++ % 2] : (f ? f.color : COLORES[(k++ + 3) % COLORES.length]);
      return r;
    });
  }
  const canastas = () => listaPot().filter(o => o.canasta);
  const sigla = m => m.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || m.slice(0, 2).toUpperCase();
  // sin logo: se muestra el nombre de la marca
  const sinLogo = o => `<span class="sig nom">${esc(o.marca)}</span>`;
  const logoHtml = o => o.logo
    ? `<img src="${esc(o.logo)}" alt="${esc(o.marca)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'sig nom',textContent:'${esc(o.marca).replace(/'/g, '&#39;')}'}))">`
    : sinLogo(o);

  // ---- Páginas del catálogo de cada marca ----
  function paginasDe(marca){
    const o = lista().concat(listaPot()).find(x => nrm(x.marca) === nrm(marca));
    if (o && o.paginas && o.paginas.length) return o.paginas.slice();
    const C = typeof CATALOGO !== 'undefined' ? CATALOGO : null; if (!C || !C.MARCAS) return [];
    const busca = nrm(o && o.catalogo ? o.catalogo : marca);
    const k = Object.keys(C.MARCAS).find(x => nrm(x) === busca); if (!k) return [];
    const ini = C.MARCAS[k], sig = Object.values(C.MARCAS).filter(p => p > ini).sort((a, b) => a - b)[0] || (C.TOTAL_PAGINAS + 1);
    const out = []; for (let p = ini; p < Math.min(sig, ini + 3); p++) out.push(p);
    return out.length ? out : [ini];
  }
  const srcPag = p => CATALOGO.CARPETA + 'pag-' + String(p).padStart(2, '0') + '.webp';
  // ¿esta página del catálogo es de una marca de canasta navideña? (para el sello en el catálogo)
  function esCanasta(pag){ return canastas().some(o => paginasDe(o.marca).indexOf(pag) >= 0); }

  // ---- Franja finita arriba de la Ruta ----
  function franja(){
    const L = lista(), P = listaPot(); if (!L.length && !P.length) return '';
    const nc = P.filter(o => o.canasta).length;
    const det = P.length
      ? `${L.length ? L.length + ' foco · ' : ''}${P.length} potenciales${nc ? ' · <span class="pfx-nav">🎄 canastas</span>' : ''}`
      : L.map(o => esc(o.marca)).join(' · ');
    return `<button type="button" class="pfx" data-foco-abrir>
      <span class="pfx-est" aria-hidden="true">★</span>
      <span class="pfx-tx"><b>Foco de ${esc(cfg().mes || cfgP().mes || 'este mes')}</b><small>${det}</small></span>
      <span class="pfx-f" aria-hidden="true">›</span>
    </button>`;
  }
  function enlazar(root){ (root || document).querySelectorAll('[data-foco-abrir]').forEach(b => b.onclick = () => abrir()); }

  // ---- Pantalla de foco ----
  // Se arma UNA vez; al cambiar de pestaña o tocar una marca solo cambia lo de abajo (sin parpadeos ni saltos).
  let sel = null, pes = 'foco';
  const boton = o => `<button type="button" class="pfh-m${o.canasta ? ' nav' : ''}" data-m="${esc(o.marca)}" style="--pc:${o.color}">
    <span class="pfh-logo">${logoHtml(o)}${o.canasta ? '<i class="pfh-sello" aria-label="Canasta navideña">🎄</i>' : ''}</span><b>${esc(o.marca)}</b>${o.producto && !o.pot ? `<small>${esc(o.producto)}</small>` : ''}</button>`;
  function pestanaHtml(){
    if (pes === 'pot'){
      const P = listaPot(), C = P.filter(o => o.canasta), R = P.filter(o => !o.canasta), cn = cfgP().canastas || {};
      return `${C.length ? `<section class="pfn">
          <div class="pfn-cab"><span class="pfn-ic" aria-hidden="true">🎄</span><div><small>Especiales de fin de año</small><b>${esc(cn.titulo || 'Canastas navideñas')}</b></div></div>
          ${cn.mensaje ? `<p class="pfn-msg">${esc(cn.mensaje)}</p>` : ''}
          <div class="pfh-grid pfn-grid">${C.map(boton).join('')}</div>
        </section>` : ''}
        ${R.length ? `<p class="pfh-sub pfh-sub2">Marcas potenciales de ${esc(cfgP().mes || 'este mes')}</p>${cfgP().mensaje ? `<p class="pfh-msg pfh-msg2">${esc(cfgP().mensaje)}</p>` : ''}
        <div class="pfh-grid">${R.map(boton).join('')}</div>` : ''}`;
    }
    return `${cfg().mensaje ? `<p class="pfh-msg">${esc(cfg().mensaje)}</p>` : ''}<div class="pfh-grid">${lista().map(boton).join('')}</div>`;
  }
  const actual = () => pes === 'pot' ? listaPot() : lista();
  function abrir(marca, pestana){
    const L = lista(), P = listaPot(); if (!L.length && !P.length) return;
    pes = pestana || (L.length ? (marca && !L.some(o => o.marca === marca) ? 'pot' : pes) : 'pot');
    if (pes === 'pot' && !P.length) pes = 'foco';
    sel = marca || null;
    let c = $('focoCapa'); if (!c){ c = document.createElement('div'); c.id = 'focoCapa'; document.body.appendChild(c); }
    document.body.classList.add('fx-bloq');
    const R = window.RUTEO; if (R && R.apilar && R.tope() !== 'foco') R.apilar('', cerrarYa, true, 'foco');
    const tabs = L.length && P.length;
    c.innerHTML = `<div class="pfh" role="dialog" aria-modal="true" aria-label="Productos foco">
      <div class="pfh-cab">
        <button type="button" class="tf-x" data-x aria-label="Volver"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><polyline points="15 6 9 12 15 18"/></svg></button>
        <div><small>★ Marcas del mes</small><b>${esc(cfg().mes || cfgP().mes || 'Este mes')}</b></div>
      </div>
      <div class="pfh-cuerpo">
        ${tabs ? `<div class="pfh-tabs" role="tablist">
          <button type="button" role="tab" data-p="foco"><span>★</span> Foco del mes <em>${L.length}</em></button>
          <button type="button" role="tab" data-p="pot">Potenciales <em>${P.length}</em><i class="pfh-tab-nav" aria-hidden="true">🎄</i></button>
        </div>` : ''}
        <div id="focoLista"></div>
        <section class="pfh-det" id="focoDet"></section>
      </div>
    </div>`;
    c.querySelector('[data-x]').onclick = cerrar;
    c.querySelectorAll('[data-p]').forEach(b => b.onclick = () => cambiar(b.dataset.p));
    cambiar(pes, true);
  }
  function cambiar(p, primera){
    pes = p; const c = $('focoCapa'); if (!c) return;
    c.querySelectorAll('[data-p]').forEach(b => { const on = b.dataset.p === pes; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    const box = $('focoLista'); box.className = 'pfh-lista' + (pes === 'pot' ? ' pot' : ''); box.innerHTML = pestanaHtml();
    box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => elegir(b.dataset.m));
    const A = actual(); if (!sel || !A.some(o => o.marca === sel)) sel = A.length ? A[0].marca : null;
    if (sel) elegir(sel, true);
  }
  function cerrarYa(){ const c = $('focoCapa'); if (c) c.innerHTML = ''; document.body.classList.remove('fx-bloq'); }
  function cerrar(){ const R = window.RUTEO; if (R && R.tope && R.tope() === 'foco') R.volver(); else cerrarYa(); }

  function articulos(o){
    if (!o.articulos || !o.articulos.length) return '';
    return `<div class="pfh-arts">${o.articulos.map(a => `<div class="pfh-art">
      <div class="pfh-art-t"><span class="pfh-cod">${esc(a.codigo)}</span><b>${esc(a.articulo)}</b>${a.referencia ? `<small>${esc(a.referencia)}</small>` : ''}</div>
      <div class="pfh-art-p">
        ${a.lp25 ? `<span class="antes">LP25 fardo <s>Gs. ${gs(a.lp25)}</s></span>` : ''}
        ${a.precioFardo ? `<span class="ahora">Gs. ${gs(a.precioFardo)} <em>el fardo</em></span>` : ''}
        ${a.descuento ? `<span class="desc">-${esc(a.descuento)}%</span>` : ''}
      </div>
      <div class="pfh-art-d">${a.promoKilo ? `Promo <b>Gs. ${gs(a.promoKilo)}</b> por kilo` : ''}${a.kilos ? ` · ${esc(a.kilos)} kg por fardo` : ''}${a.precioUnit ? ` · unidad Gs. ${gs(a.precioUnit)}` : ''}${a.ahorro ? ` · ahorro <b>Gs. ${gs(a.ahorro)}</b>` : ''}</div>
    </div>`).join('')}</div>`;
  }
  function elegir(marca, primera){
    const L = actual(), o = L.find(x => x.marca === marca) || L[0]; if (!o) return; sel = o.marca;
    const c = $('focoCapa'); if (!c) return;
    c.querySelectorAll('[data-m]').forEach(b => { const on = b.dataset.m === sel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const det = $('focoDet'); det.style.setProperty('--pc', o.color); det.classList.toggle('nav', !!o.canasta);
    const refs = [].concat(o.referencias || []), pags = paginasDe(o.marca);
    // sellos: canasta navideña / también foco / potencial
    const sellos = [o.canasta ? '<span class="pfh-tag nav">🎄 Especial canasta navideña</span>' : '',
      o.pot && o.foco && pes === 'pot' ? '<span class="pfh-tag foco">★ También es foco del mes</span>' : '',
      o.pot && !o.canasta && !(o.foco && pes === 'pot') ? '<span class="pfh-tag pot">Marca potencial</span>' : ''].join('');
    // las imágenes llevan su tamaño, así el lugar queda reservado y nada salta al cargar
    const img = r => typeof r === 'string' ? {src: r, w: 1000, h: 1000} : r;
    det.innerHTML = `<div class="pfh-det-in">
      <div class="pfh-det-cab"><span class="pfh-det-logo">${logoHtml(o)}</span><div><h3>${esc(o.marca)}</h3>${o.producto ? `<p>${esc(o.producto)}</p>` : ''}</div></div>
      ${pes === 'pot' && sellos ? `<div class="pfh-tags">${sellos}</div>` : ''}
      ${o.foto ? `<img class="pfh-foto" src="${esc(img(o.foto).src)}" width="${img(o.foto).w}" height="${img(o.foto).h}" alt="${esc(o.producto || o.marca)}" onload="this.classList.add('ok')">` : ''}
      ${articulos(o)}
      ${refs.map(r => `<img class="pfh-ref" src="${esc(img(r).src)}" width="${img(r).w}" height="${img(r).h}" alt="Referencia de ${esc(o.marca)}" onload="this.classList.add('ok')">`).join('')}
      ${pags.length ? `<p class="pfh-sub">${refs.length || o.articulos ? 'También en el catálogo' : 'Del catálogo'}</p>${pags.map(n => `<button type="button" class="pfh-pag" data-pag="${n}"><img src="${srcPag(n)}" width="1100" height="1555" alt="Página ${n} del catálogo" onload="this.classList.add('ok')" onerror="if(!this.dataset.r){this.dataset.r=1;this.src=this.src.replace('${esc(CATALOGO.CARPETA)}','')}"><span>Página ${n} · ver en el catálogo ›</span></button>`).join('')}`
        : (!o.foto && !refs.length ? '<p class="pfh-vacio">Todavía no está en el catálogo. Consultá con tu supervisor los artículos de esta marca.</p>' : '')}
    </div>`;
    det.querySelectorAll('[data-pag]').forEach(b => b.onclick = () => { const n = +b.dataset.pag; cerrar(); setTimeout(() => { if (window.abrirCatalogo) window.abrirCatalogo(n); }, 120); });
    // si la parte de abajo no se ve, se acerca suavemente (sin saltos bruscos)
    if (!primera){ const r = det.getBoundingClientRect(); if (r.top > window.innerHeight - 120) det.scrollIntoView({behavior: 'smooth', block: 'start'}); }
  }

  // ---- Bloque arriba del catálogo ----
  function bloqueCatalogo(){
    const L = lista(), P = listaPot(); if (!L.length && !P.length) return '';
    const fila = (xs, attr) => `<div class="cat-foco-l">${xs.map(o => `<button type="button" ${attr}="${esc(o.marca)}" style="--pc:${o.color}"><i>${logoHtml(o)}${o.canasta ? '<em class="cat-sello" aria-label="Canasta navideña">🎄</em>' : ''}</i><b>${esc(o.marca)}</b></button>`).join('')}</div>`;
    return `<div class="cat-foco">
      ${L.length ? `<div class="cat-foco-t"><span>★</span> Productos foco de ${esc(cfg().mes || 'este mes')}</div>${fila(L, 'data-foco-marca')}` : ''}
      ${P.length ? `<div class="cat-foco-t cat-foco-t2">Potenciales <small>🎄 = canasta navideña</small></div>${fila(P, 'data-foco-marca')}` : ''}
    </div>`;
  }

  window.Foco = {franja, enlazar, abrir, bloqueCatalogo, paginasDe, esCanasta};
})();
