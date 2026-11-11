// =====================================================================
//  PRODUCTOS FOCO DEL MES
// ---------------------------------------------------------------------
//  Se ven en:
//   - una franja finita arriba de la Ruta ("★ Foco de Noviembre"), que abre la pantalla de foco
//   - el Catálogo, arriba de la primera página
//  La lista de marcas, el mes y las imágenes de referencia se cambian en config.js (PRODUCTOS_FOCO).
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const P = () => (typeof PRODUCTOS_FOCO !== 'undefined' && PRODUCTOS_FOCO && (PRODUCTOS_FOCO.marcas || []).length) ? PRODUCTOS_FOCO : null;
  const nrm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const COLORES = ['#E5484D', '#2E5BFF', '#12A150', '#F5A524', '#7E5BEF', '#0EA5E9', '#DB2777', '#B45309'];
  const sigla = m => m.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || m.slice(0, 2).toUpperCase();
  const colorDe = m => COLORES[Math.max(0, P() ? P().marcas.indexOf(m) : 0) % COLORES.length];

  // ---- Logos: carpeta "Marcas" de Google Drive (la misma de las fichas TOP) ----
  let logos = null, pidiendo = false;
  function leerLogos(lista){
    const m = {};
    (P() ? P().marcas : []).forEach(marca => {
      const k = nrm(marca), kj = k.replace(/ /g, '');
      const sinExt = f => nrm(String(f.n).replace(/\.[a-z0-9]+$/i, ''));
      const f = lista.find(f => sinExt(f) === k || sinExt(f).replace(/ /g, '') === kj)
        || lista.find(f => { const d = sinExt(f) + ' ' + nrm(f.c || ''); return !/^\d{2,6}\b/.test(sinExt(f)) && (d.includes(k) || d.replace(/ /g, '').includes(kj)); });
      if (f) m[marca] = f.id;
    });
    return m;
  }
  function logosDe(){
    if (logos) return logos;
    let c = null; try { c = JSON.parse(localStorage.getItem('ruteoTR1_imgMarcas') || 'null'); } catch(e){}
    if (c && c.l){ logos = leerLogos(c.l); if (Date.now() - c.t < 6 * 3600e3) return logos; }
    const url = typeof FOTOS_URL !== 'undefined' ? String(FOTOS_URL).trim() : '', carpeta = typeof MARCAS_CARPETA !== 'undefined' ? String(MARCAS_CARPETA).trim() : '';
    if (url && carpeta && !pidiendo){
      pidiendo = true;
      fetch(url + '?' + new URLSearchParams({clave: typeof FOTOS_CLAVE !== 'undefined' ? FOTOS_CLAVE : '', accion: 'marcas', carpeta}), {redirect: 'follow'})
        .then(r => r.json()).then(j => {
          if (j && j.ok && j.archivos){ try { localStorage.setItem('ruteoTR1_imgMarcas', JSON.stringify({t: Date.now(), l: j.archivos})); } catch(e){} logos = leerLogos(j.archivos); repintar(); }
        }).catch(() => {}).then(() => { pidiendo = false; });
    }
    return logos || {};
  }
  const logoHtml = (m, w) => {
    const id = logosDe()[m];
    return id ? `<img src="https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w || 200}" alt="${esc(m)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'sig',textContent:'${esc(sigla(m))}'}))">`
      : `<span class="sig">${esc(sigla(m))}</span>`;
  };

  // ---- Páginas del catálogo de cada marca ----
  function paginasDe(marca){
    const C = typeof CATALOGO !== 'undefined' ? CATALOGO : null; if (!C || !C.MARCAS) return [];
    const k = Object.keys(C.MARCAS).find(x => nrm(x) === nrm(marca)); if (!k) return [];
    const ini = C.MARCAS[k], sig = Object.values(C.MARCAS).filter(p => p > ini).sort((a, b) => a - b)[0] || (C.TOTAL_PAGINAS + 1);
    const out = []; for (let p = ini; p < Math.min(sig, ini + 3); p++) out.push(p);
    return out.length ? out : [ini];
  }
  const srcPag = p => { const C = CATALOGO; return C.CARPETA + 'pag-' + String(p).padStart(2, '0') + '.webp'; };
  const refsDe = m => { const r = (P() && P().referencias) || {}; const k = Object.keys(r).find(x => nrm(x) === nrm(m)); const v = k ? r[k] : null; return v ? [].concat(v) : []; };

  // ---- Franja finita arriba de la Ruta ----
  function franja(){
    const p = P(); if (!p) return '';
    return `<button type="button" class="pfx" data-foco-abrir>
      <span class="pfx-est" aria-hidden="true">★</span>
      <span class="pfx-tx"><b>Foco de ${esc(p.mes || 'este mes')}</b><small>${p.marcas.map(esc).join(' · ')}</small></span>
      <span class="pfx-logos" aria-hidden="true">${p.marcas.slice(0, 4).map(m => `<i style="--pc:${colorDe(m)}">${logoHtml(m, 80)}</i>`).join('')}</span>
      <span class="pfx-f" aria-hidden="true">›</span>
    </button>`;
  }
  function enlazar(root){ (root || document).querySelectorAll('[data-foco-abrir]').forEach(b => b.onclick = () => abrir()); }

  // ---- Pantalla de productos foco ----
  let sel = null;
  function abrir(marca){
    const p = P(); if (!p) return;
    sel = marca || sel || p.marcas[0];
    let c = $('focoCapa'); if (!c){ c = document.createElement('div'); c.id = 'focoCapa'; document.body.appendChild(c); }
    document.body.classList.add('fx-bloq');
    const R = window.RUTEO; if (R && R.apilar && R.tope() !== 'foco') R.apilar('', cerrarYa, true, 'foco');
    pintar();
  }
  function cerrarYa(){ const c = $('focoCapa'); if (c) c.innerHTML = ''; document.body.classList.remove('fx-bloq'); }
  function cerrar(){ const R = window.RUTEO; if (R && R.tope && R.tope() === 'foco') R.volver(); else cerrarYa(); }
  function pintar(){
    const c = $('focoCapa'), p = P(); if (!c || !p) return;
    const refs = refsDe(sel), pags = paginasDe(sel);
    c.innerHTML = `<div class="pfh" role="dialog" aria-modal="true" aria-label="Productos foco">
      <div class="pfh-cab">
        <button type="button" class="tf-x" data-x aria-label="Volver"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><polyline points="15 6 9 12 15 18"/></svg></button>
        <div><small>★ Productos foco</small><b>${esc(p.mes || 'Este mes')}</b></div>
      </div>
      <div class="pfh-cuerpo">
        ${p.mensaje ? `<p class="pfh-msg">${esc(p.mensaje)}</p>` : ''}
        <div class="pfh-grid">${p.marcas.map(m => `<button type="button" class="pfh-m ${m === sel ? 'on' : ''}" data-m="${esc(m)}" style="--pc:${colorDe(m)}" aria-pressed="${m === sel}">
          <span class="pfh-logo">${logoHtml(m, 200)}</span><b>${esc(m)}</b></button>`).join('')}</div>
        <section class="pfh-det" style="--pc:${colorDe(sel)}">
          <h3>${esc(sel)}</h3>
          ${refs.map(u => `<img class="pfh-ref" src="${esc(u)}" alt="Referencia de ${esc(sel)}" loading="lazy">`).join('')}
          ${pags.length ? `<p class="pfh-sub">${refs.length ? 'También en el catálogo' : 'Del catálogo'}</p>${pags.map(n => `<button type="button" class="pfh-pag" data-pag="${n}"><img src="${srcPag(n)}" alt="Página ${n} del catálogo" loading="lazy" onerror="if(!this.dataset.r){this.dataset.r=1;this.src=this.src.replace('${esc(CATALOGO.CARPETA)}','')}"><span>Página ${n} · ver en el catálogo ›</span></button>`).join('')}` : ''}
          ${!refs.length && !pags.length ? '<p class="pfh-sub">Todavía no hay imágenes de esta marca.</p>' : ''}
        </section>
      </div>
    </div>`;
    c.querySelector('[data-x]').onclick = cerrar;
    c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { sel = b.dataset.m; pintar(); const d = c.querySelector('.pfh-det'); if (d) d.scrollIntoView({behavior: 'smooth', block: 'start'}); });
    c.querySelectorAll('[data-pag]').forEach(b => b.onclick = () => { const n = +b.dataset.pag; cerrar(); setTimeout(() => { if (window.abrirCatalogo) window.abrirCatalogo(n); }, 120); });
    c.querySelectorAll('.pfh-ref').forEach(im => im.onclick = () => im.classList.toggle('grande'));
  }
  function repintar(){
    document.querySelectorAll('.pfx-logos').forEach(el => { const p = P(); if (p) el.innerHTML = p.marcas.slice(0, 4).map(m => `<i style="--pc:${colorDe(m)}">${logoHtml(m, 80)}</i>`).join(''); });
    if ($('focoCapa') && $('focoCapa').innerHTML) pintar();
  }

  // ---- Bloque arriba del catálogo ----
  function bloqueCatalogo(){
    const p = P(); if (!p) return '';
    return `<div class="cat-foco"><div class="cat-foco-t"><span>★</span> Productos foco de ${esc(p.mes || 'este mes')}</div>
      <div class="cat-foco-l">${p.marcas.map(m => `<button type="button" data-foco-marca="${esc(m)}" style="--pc:${colorDe(m)}"><i>${logoHtml(m, 120)}</i><b>${esc(m)}</b></button>`).join('')}</div></div>`;
  }

  window.Foco = {franja, enlazar, abrir, bloqueCatalogo, paginasDe};
})();
