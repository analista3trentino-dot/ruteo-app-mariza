// =====================================================================
//  PRODUCTOS FOCO DEL MES
// ---------------------------------------------------------------------
//  Se ven en:
//   - una franja finita arriba de la Ruta ("★ Foco de Noviembre"), que abre la pantalla de foco
//   - el Catálogo, arriba de la primera página
//  Las marcas, productos, artículos e imágenes se cambian en config.js (PRODUCTOS_FOCO).
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const nrm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const COLORES = ['#E5484D', '#2E5BFF', '#12A150', '#F5A524', '#7E5BEF', '#0EA5E9', '#DB2777', '#B45309'];
  const gs = n => Number(n || 0).toLocaleString('es-PY');

  // Cada marca puede venir como texto ("Mesa") o con detalle ({marca: "Urca", producto: "...", ...})
  function lista(){
    const P = typeof PRODUCTOS_FOCO !== 'undefined' ? PRODUCTOS_FOCO : null;
    if (!P || !P.marcas || !P.marcas.length) return [];
    return P.marcas.map((x, i) => {
      const o = typeof x === 'string' ? {marca: x} : Object.assign({}, x);
      o.color = COLORES[i % COLORES.length];
      return o;
    });
  }
  const cfg = () => (typeof PRODUCTOS_FOCO !== 'undefined' ? PRODUCTOS_FOCO : {}) || {};
  const sigla = m => m.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || m.slice(0, 2).toUpperCase();
  const logoHtml = o => o.logo
    ? `<img src="${esc(o.logo)}" alt="${esc(o.marca)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'sig',textContent:'${esc(sigla(o.marca))}'}))">`
    : `<span class="sig">${esc(sigla(o.marca))}</span>`;

  // ---- Páginas del catálogo de cada marca ----
  function paginasDe(marca){
    const o = lista().find(x => nrm(x.marca) === nrm(marca));
    if (o && o.paginas && o.paginas.length) return o.paginas.slice();
    const C = typeof CATALOGO !== 'undefined' ? CATALOGO : null; if (!C || !C.MARCAS) return [];
    const k = Object.keys(C.MARCAS).find(x => nrm(x) === nrm(marca)); if (!k) return [];
    const ini = C.MARCAS[k], sig = Object.values(C.MARCAS).filter(p => p > ini).sort((a, b) => a - b)[0] || (C.TOTAL_PAGINAS + 1);
    const out = []; for (let p = ini; p < Math.min(sig, ini + 3); p++) out.push(p);
    return out.length ? out : [ini];
  }
  const srcPag = p => CATALOGO.CARPETA + 'pag-' + String(p).padStart(2, '0') + '.webp';

  // ---- Franja finita arriba de la Ruta ----
  function franja(){
    const L = lista(); if (!L.length) return '';
    return `<button type="button" class="pfx" data-foco-abrir>
      <span class="pfx-est" aria-hidden="true">★</span>
      <span class="pfx-tx"><b>Foco de ${esc(cfg().mes || 'este mes')}</b><small>${L.map(o => esc(o.marca)).join(' · ')}</small></span>
      <span class="pfx-f" aria-hidden="true">›</span>
    </button>`;
  }
  function enlazar(root){ (root || document).querySelectorAll('[data-foco-abrir]').forEach(b => b.onclick = () => abrir()); }

  // ---- Pantalla de productos foco ----
  // Se arma UNA vez; al tocar una marca solo cambia la parte de abajo (sin parpadeos ni saltos).
  let sel = null;
  function abrir(marca){
    const L = lista(); if (!L.length) return;
    sel = marca || sel || L[0].marca;
    let c = $('focoCapa'); if (!c){ c = document.createElement('div'); c.id = 'focoCapa'; document.body.appendChild(c); }
    document.body.classList.add('fx-bloq');
    const R = window.RUTEO; if (R && R.apilar && R.tope() !== 'foco') R.apilar('', cerrarYa, true, 'foco');
    c.innerHTML = `<div class="pfh" role="dialog" aria-modal="true" aria-label="Productos foco">
      <div class="pfh-cab">
        <button type="button" class="tf-x" data-x aria-label="Volver"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><polyline points="15 6 9 12 15 18"/></svg></button>
        <div><small>★ Productos foco</small><b>${esc(cfg().mes || 'Este mes')}</b></div>
      </div>
      <div class="pfh-cuerpo">
        ${cfg().mensaje ? `<p class="pfh-msg">${esc(cfg().mensaje)}</p>` : ''}
        <div class="pfh-grid">${L.map(o => `<button type="button" class="pfh-m" data-m="${esc(o.marca)}" style="--pc:${o.color}">
          <span class="pfh-logo">${logoHtml(o)}</span><b>${esc(o.marca)}</b>${o.producto ? `<small>${esc(o.producto)}</small>` : ''}</button>`).join('')}</div>
        <section class="pfh-det" id="focoDet"></section>
      </div>
    </div>`;
    c.querySelector('[data-x]').onclick = cerrar;
    c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => elegir(b.dataset.m));
    elegir(sel, true);
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
    const L = lista(), o = L.find(x => x.marca === marca) || L[0]; sel = o.marca;
    const c = $('focoCapa'); if (!c) return;
    c.querySelectorAll('[data-m]').forEach(b => { const on = b.dataset.m === sel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const det = $('focoDet'); det.style.setProperty('--pc', o.color);
    const refs = [].concat(o.referencias || []), pags = paginasDe(o.marca);
    // las imágenes llevan su tamaño, así el lugar queda reservado y nada salta al cargar
    const img = r => typeof r === 'string' ? {src: r, w: 1000, h: 1000} : r;
    det.innerHTML = `<div class="pfh-det-in">
      <div class="pfh-det-cab"><span class="pfh-det-logo">${logoHtml(o)}</span><div><h3>${esc(o.marca)}</h3>${o.producto ? `<p>${esc(o.producto)}</p>` : ''}</div></div>
      ${o.foto ? `<img class="pfh-foto" src="${esc(img(o.foto).src)}" width="${img(o.foto).w}" height="${img(o.foto).h}" alt="${esc(o.producto || o.marca)}" onload="this.classList.add('ok')">` : ''}
      ${articulos(o)}
      ${refs.map(r => `<img class="pfh-ref" src="${esc(img(r).src)}" width="${img(r).w}" height="${img(r).h}" alt="Referencia de ${esc(o.marca)}" onload="this.classList.add('ok')">`).join('')}
      ${pags.length ? `<p class="pfh-sub">${refs.length || o.articulos ? 'También en el catálogo' : 'Del catálogo'}</p>${pags.map(n => `<button type="button" class="pfh-pag" data-pag="${n}"><img src="${srcPag(n)}" width="1100" height="1555" alt="Página ${n} del catálogo" onload="this.classList.add('ok')" onerror="if(!this.dataset.r){this.dataset.r=1;this.src=this.src.replace('${esc(CATALOGO.CARPETA)}','')}"><span>Página ${n} · ver en el catálogo ›</span></button>`).join('')}` : ''}
    </div>`;
    det.querySelectorAll('[data-pag]').forEach(b => b.onclick = () => { const n = +b.dataset.pag; cerrar(); setTimeout(() => { if (window.abrirCatalogo) window.abrirCatalogo(n); }, 120); });
    // si la parte de abajo no se ve, se acerca suavemente (sin saltos bruscos)
    if (!primera){ const r = det.getBoundingClientRect(); if (r.top > window.innerHeight - 120) det.scrollIntoView({behavior: 'smooth', block: 'start'}); }
  }

  // ---- Bloque arriba del catálogo ----
  function bloqueCatalogo(){
    const L = lista(); if (!L.length) return '';
    return `<div class="cat-foco"><div class="cat-foco-t"><span>★</span> Productos foco de ${esc(cfg().mes || 'este mes')}</div>
      <div class="cat-foco-l">${L.map(o => `<button type="button" data-foco-marca="${esc(o.marca)}" style="--pc:${o.color}"><i>${logoHtml(o)}</i><b>${esc(o.marca)}</b></button>`).join('')}</div></div>`;
  }

  window.Foco = {franja, enlazar, abrir, bloqueCatalogo, paginasDe};
})();
