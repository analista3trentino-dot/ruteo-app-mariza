// =====================================================================
//  TÁCTICOS DE VOLUMEN DEL MES
// ---------------------------------------------------------------------
//  Recordatorio y aviso de las bonificaciones por volumen (compra X, lleva Y sin cargo).
//  Solo aplican a clientes con PERFIL (PM) habilitado, por eso:
//   - en la Ruta, esos clientes llevan la etiqueta "🎯 Táctico"
//   - una franja finita arriba de la Ruta dice cuántos clientes de hoy están habilitados
//   - la campanita lo recuerda
//   - la pantalla de tácticos muestra las acciones por marca, las que más rinden y el código para cargar
//  Los datos se cambian en config.js (TACTICOS). No hace falta modificar este archivo.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const nrm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const nom = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
  const T = () => (typeof TACTICOS !== 'undefined' ? TACTICOS : null) || {marcas: [], perfiles: []};
  const pmN = pm => String(pm == null ? '' : pm).trim().replace(',', '.');
  const activo = () => T().marcas && T().marcas.length;
  const habilitado = pm => !!activo() && T().perfiles.indexOf(pmN(pm)) >= 0;
  const pct = a => (a.bonif / a.compra * 100);
  const fmtPct = n => n.toFixed(1).replace('.', ',').replace(',0', '') + '%';
  const RU = () => window.RUTEO || {};

  // sellos: marca foco / canasta navideña (de config.js)
  function sellos(m){
    const F = typeof PRODUCTOS_FOCO !== 'undefined' ? (PRODUCTOS_FOCO.marcas || []) : [];
    const P = typeof MARCAS_POTENCIALES !== 'undefined' ? (MARCAS_POTENCIALES.marcas || []) : [];
    const k = nrm(m.marca), es = x => { const o = typeof x === 'string' ? {marca: x} : x; return nrm(o.marca) === k || nrm(o.catalogo) === k; };
    return {foco: F.some(es), canasta: P.some(x => x.canasta && es(x))};
  }
  const lista = () => (T().marcas || []).map((m, i) => Object.assign({i}, m, sellos(m), {mejor: Math.max.apply(null, m.acciones.map(pct))}));
  const logo = m => m.logo ? `<img src="${esc(m.logo)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'${esc(m.marca).replace(/'/g, '')}'}))">` : `<b>${esc(m.nombre || m.marca)}</b>`;

  // ---- Clientes habilitados de hoy ----
  function deHoy(carts, hoyLbl){
    const out = [];
    (carts || []).forEach(c => (c.cl || []).forEach(cl => {
      if (!habilitado(cl[8])) return;
      if (hoyLbl && !String(cl[3] || '').split(',').map(s => s.trim()).includes(hoyLbl)) return;
      out.push({c, cl});
    }));
    return out;
  }
  function misCarteras(){
    const r = RU(); if (!r.carteras) return [];
    if (r.modo === 'vendedor' && r.vendedor) return r.carteras.filter(c => c.vc.replace(/\D/g, '') === r.vendedor.vc.replace(/\D/g, ''));
    if (r.modo === 'supervisor' && r.miSup) return r.carteras.filter(c => c.sup === r.miSup);
    return r.carteras;
  }

  // ---- En la Ruta ----
  function chip(cl){
    if (!habilitado(cl[8])) return '';
    return `<button type="button" class="tac-chip" data-tac-cli="${esc(cl[2])}" data-tac-pm="${esc(pmN(cl[8]))}" aria-label="Tácticos de volumen para este cliente">🎯 Táctico</button>`;
  }
  function franja(carts, hoyLbl){
    if (!activo()) return '';
    const n = deHoy(carts, hoyLbl).length, tot = T().marcas.reduce((t, m) => t + m.acciones.length, 0);
    return `<button type="button" class="tfx" data-tac-abrir>
      <span class="tfx-ic" aria-hidden="true">🎯</span>
      <span class="tfx-tx"><b>Tácticos de ${esc(T().mes || 'este mes')}</b><small>${n ? `<em>${n}</em> ${n === 1 ? 'cliente de hoy habilitado' : 'clientes de hoy habilitados'}` : `${T().marcas.length} marcas · ${tot} acciones`}</small></span>
      <span class="tfx-f" aria-hidden="true">›</span>
    </button>`;
  }
  function enlazar(){}

  // ---- Pantalla (limpia: 3 pestañas, una cosa por vez) ----
  let sel = -1, pes = 'marcas', ctx = {};
  function abrir(o){
    if (!activo()) return;
    ctx = o || {}; pes = 'marcas'; sel = -1;
    let c = $('tacCapa'); if (!c){ c = document.createElement('div'); c.id = 'tacCapa'; document.body.appendChild(c); }
    document.body.classList.add('fx-bloq');
    const r = RU(); if (r.apilar && r.tope() !== 'tacticos') r.apilar('', cerrarYa, true, 'tacticos');
    const hoy = r.modo === 'jefatura' ? [] : deHoy(misCarteras(), r.hoy);
    c.innerHTML = `<div class="tac" role="dialog" aria-modal="true" aria-label="Tácticos de volumen">
      <div class="tac-cab">
        <button type="button" class="tf-x" data-x aria-label="Volver"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><polyline points="15 6 9 12 15 18"/></svg></button>
        <div><small>Tácticos de volumen</small><b>${esc(T().mes || '')}</b></div>
      </div>
      <div class="tac-cuerpo">
        ${ctx.cli ? `<div class="tac-ok">✓ <b>${esc(nom(ctx.cli))}</b> está habilitado <small>PM ${esc(ctx.pm)}</small></div>` : ''}
        <div class="tac-exp">
          <div><span class="tac-exp-i">🎁</span><p><b>Qué es</b>Si el cliente compra la cantidad indicada, se lleva producto extra <b>sin cargo</b>.<small>Ej.: compra 30 cajas de Menoyo Mayonesa y recibe 1 caja más gratis.</small></p></div>
          <div><span class="tac-exp-i">🎯</span><p><b>A quién</b>Solo a los clientes que en la Ruta tienen la etiqueta <span class="tac-chip mini">🎯 Táctico</span>.</p></div>
          <div><span class="tac-exp-i">🧾</span><p><b>Cómo se carga</b>En el pedido, con el <b>código de acción</b> que aparece en cada marca.</p></div>
        </div>
        <div class="tac-tabs" role="tablist">
          <button type="button" data-tp="marcas">Marcas</button>
          ${hoy.length ? `<button type="button" data-tp="hoy">Hoy <em>${hoy.length}</em></button>` : ''}
          <button type="button" data-tp="pm">Perfiles</button>
        </div>
        <div id="tacVista"></div>
      </div>
    </div>`;
    c.querySelector('[data-x]').onclick = cerrar;
    c.querySelectorAll('[data-tp]').forEach(b => b.onclick = () => vista(b.dataset.tp, hoy));
    vista('marcas', hoy);
  }
  function vista(k, hoy){
    pes = k; const c = $('tacCapa'); if (!c) return;
    const ex = c.querySelector('.tac-exp'); if (ex) ex.hidden = false;
    c.querySelectorAll('[data-tp]').forEach(b => b.classList.toggle('on', b.dataset.tp === k));
    const v = $('tacVista'), L = lista(), r = RU();
    if (k === 'hoy'){
      v.innerHTML = `<p class="tac-ayuda">Clientes de tu ruta de hoy que pueden aprovechar los tácticos:</p><div class="tac-lista">${hoy.map(y => `<div class="tac-cli"><span>🎯</span><div><b>${esc(nom(y.cl[2]))}</b><small>PM ${esc(pmN(y.cl[8]))}${y.cl._top ? ' · ★ top' : ''}${r.modo !== 'vendedor' ? ' · ' + esc(y.c.vc) : ''}</small></div></div>`).join('')}</div>`;
      return;
    }
    if (k === 'pm'){
      v.innerHTML = `<p class="tac-ayuda">Un cliente tiene táctico solo si su perfil (PM) es uno de estos:</p><div class="tac-pms">${T().perfiles.map(p => `<span class="${ctx.pm && pmN(ctx.pm) === p ? 'on' : ''}">${esc(p)}</span>`).join('')}</div><p class="tac-nota">Valen para todas las acciones del mes. Si el cliente tiene otro PM, no corresponde.</p>`;
      return;
    }
    // Marcas: grilla limpia de logos; al tocar una se abre su detalle
    const ord = L.slice().sort((a, b) => a.marca.localeCompare(b.marca, 'es'));
    v.innerHTML = `<p class="tac-ayuda">Tocá una marca para ver qué tiene que comprar el cliente y qué se lleva gratis.</p>
      <div class="tac-grid">${ord.map(m => `<button type="button" class="tac-m" data-tm="${m.i}"><span class="tac-m-l">${logo(m)}</span><span class="tac-m-n">${esc(m.nombre || m.marca)}</span><span class="tac-m-c">${m.acciones.length} ${m.acciones.length === 1 ? 'acción' : 'acciones'}</span></button>`).join('')}</div>`;
    v.querySelectorAll('[data-tm]').forEach(b => b.onclick = () => elegir(+b.dataset.tm));
  }
  function elegir(i){
    const L = lista(), m = L[i]; if (!m) return;
    const v = $('tacVista'); if (!v) return;
    sel = m.i;
    const ex = $('tacCapa').querySelector('.tac-exp'); if (ex) ex.hidden = true;   // en el detalle se va la explicación: queda más limpio
    v.innerHTML = `<button type="button" class="tac-volver" data-vm>‹ Todas las marcas</button>
      <div class="tac-det">
        <div class="tac-det-cab"><span class="tac-det-l">${logo(m)}</span><div><h3>${esc(m.nombre || m.marca)}</h3><p>${m.acciones.length} ${m.acciones.length === 1 ? 'acción' : 'acciones'}${m.canasta ? ' · 🎄 canasta' : ''}${m.foco ? ' · ★ foco' : ''}</p></div></div>
        ${m.acciones.map(a => `<article class="tac-ac">
          <div class="tac-ac-top"><span class="tac-ac-cod">Código de acción <b>${esc(a.accion)}</b></span></div>
          <div class="tac-ac-f">
            <div class="tac-ac-c"><small>El cliente compra</small><b>${a.compra} ${esc(a.unidad)}</b></div>
            <span class="tac-ac-fl">→</span>
            <div class="tac-ac-g"><small>Se lleva gratis</small><b>${a.bonif} ${esc(a.bonif === 1 ? a.unidad.replace(/s$/, '') : a.unidad)}</b></div>
          </div>
          <div class="tac-ac-pr"><small>${a.productos.length > 1 ? 'Productos (se pueden combinar)' : 'Producto'}</small><ul>${a.productos.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>
          ${a.nota ? `<p class="tac-ac-n">${esc(a.nota)}</p>` : ''}
        </article>`).join('')}
      </div>`;
    v.querySelector('[data-vm]').onclick = () => vista('marcas', null);
    const c = $('tacCapa').querySelector('.tac'); if (c) c.scrollTo({top: 0, behavior: 'smooth'});
  }
  // Ruta: media tarjeta, al lado de Foco
  function mini(carts, hoyLbl){
    if (!activo()) return '';
    const n = deHoy(carts, hoyLbl).length;
    return `<button type="button" class="mes-t tact" data-tac-abrir><span class="mes-ic">🎯</span><span class="mes-tx"><b>Tácticos</b><small>${n ? n + (n === 1 ? ' cliente hoy' : ' clientes hoy') : T().marcas.length + ' marcas'}</small></span>${n ? `<span class="mes-n">${n}</span>` : ''}</button>`;
  }
  function cerrarYa(){ const c = $('tacCapa'); if (c) c.innerHTML = ''; document.body.classList.remove('fx-bloq'); }
  function cerrar(){ const r = RU(); if (r.tope && r.tope() === 'tacticos') r.volver(); else cerrarYa(); }

  // ---- Aviso para la campanita ----
  function aviso(al){
    if (!activo() || !al || al.quien === 'jefatura') return [];
    const r = RU(), hoy = deHoy(al.carts, r.hoy);
    return [{id: 'tac-' + (T().mes || '') + '-' + new Date().toDateString() + '-' + hoy.length, tipo: 'tac', titulo: 'Tácticos de ' + (T().mes || 'este mes'), valor: hoy.length ? String(hoy.length) : '', tono: 'good',
      linea: hoy.length ? `<b>${hoy.length}</b> ${hoy.length === 1 ? 'cliente de tu ruta de hoy puede' : 'clientes de tu ruta de hoy pueden'} aprovechar las bonificaciones` : 'Bonificaciones por volumen para clientes con perfil habilitado',
      sub: hoy.length ? 'Habilitados hoy' : '', filas: hoy.slice(0, 3).map(y => [esc(nom(y.cl[2])), 'PM ' + esc(pmN(y.cl[8]))]), ir: ['tacticos', 'Ver tácticos']}];
  }

  // un solo "escuchador" para toda la app: sirve también para las tarjetas que se abren después
  document.addEventListener('click', e => {
    const t = e.target.closest ? e.target.closest('[data-tac-abrir],[data-tac-cli]') : null; if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (t.hasAttribute('data-tac-cli')) abrir({cli: t.dataset.tacCli, pm: t.dataset.tacPm}); else abrir();
  }, true);
  window.Tacticos = {habilitado, chip, franja, mini, enlazar, abrir, aviso, deHoy};
})();
