(function(){
  const DAY_LABELS = ["Lun","Mar","Mié","Jue","Vie","Sáb","S/Cal"];
  const WEEK = ["Lun","Mar","Mié","Jue","Vie","Sáb"];
  const WEEK_LETTER = {Lun:'L',Mar:'M','Mié':'X',Jue:'J',Vie:'V','Sáb':'S'};
  const GEN_DATE = "14/10/2026";  // fecha del ruteo cargado en data.js
  const sups = APP_DATA.sups;
  const MIX = (typeof APP_DATA_MIX !== 'undefined') ? APP_DATA_MIX : {codes:[], carteras:[]};
  const numOf = vc => String(vc).replace(/^\D+/, '');
  // Cada cartera AR queda justo después de su par TR
  const carteras = [];
  APP_DATA.carteras.forEach(c => { carteras.push(c); MIX.carteras.filter(m => numOf(m.vc) === numOf(c.vc)).forEach(m => carteras.push(m)); });
  MIX.carteras.forEach(m => { if (!carteras.includes(m)) carteras.push(m); });
  const isMixto = c => MIX.codes.includes(numOf(c.vc));
  const pairOf = c => carteras.find(o => o !== c && isMixto(o) && numOf(o.vc) === numOf(c.vc));
  // Un cliente de una cartera mixta (AR) es el mismo que en su par TR: se cuenta una sola vez
  const claveCli = (c, cl) => numOf(c.vc) + '|' + (cl[6] || cl[2]);

  const PALETA = ['#2E5BFF','#E08700','#0EA371','#D6336C','#7048E8','#E8590C'];
  const supColor = {}, supLabel = {};
  sups.forEach((s,i) => { supColor[s.k] = PALETA[i % PALETA.length]; supLabel[s.k] = s.p; });

  const ICON = {
    pin:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    search:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    nav:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    chev:'<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>',
    map:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>',
    star:'<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>',
    gps:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
  };

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const daysOf = cl => String(cl[3]).split(',').map(s => s.trim());
  const hasGps = cl => typeof cl[4] === 'number' && typeof cl[5] === 'number';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { spv:'TODOS', query:'', days:new Set(), openId:null, vista:'lista', soloTop:false, seccion:'ruta', topDay:null };

  // ---- Hoy ----
  const now = new Date();
  const TODAY_LBL = [null,'Lun','Mar','Mié','Jue','Vie','Sáb'][now.getDay()];
  // Limpieza: borra las marcas de visita que guardaba la versión anterior
  try { Object.keys(localStorage).forEach(k => { if (k.indexOf('ruteoTR1_visitas_') === 0) localStorage.removeItem(k); }); } catch(e) {}
  const FECHA_TXT = now.toLocaleDateString('es-PY', {weekday:'long', day:'numeric', month:'short'});
  $('todayBadge').textContent = FECHA_TXT.charAt(0).toUpperCase() + FECHA_TXT.slice(1);

  // ---- Filtros ----
  function matchQuery(cl){ return !state.query || (cl[2] + ' ' + cl[0] + ' ' + (cl[6] || '')).toLowerCase().includes(state.query); }
  function matches(cl){
    if (!matchQuery(cl)) return false;
    if (state.soloTop && !cl._top) return false;
    if (state.days.size){ const d = daysOf(cl); if (![...state.days].some(x => d.includes(x))) return false; }
    return true;
  }
  const filtering = () => !!(state.query || state.days.size || state.soloTop);
  const searching = () => state.query.length >= 2;
  const bySpv = () => state.spv === 'MIXTOS' ? carteras.filter(isMixto) : carteras.filter(c => state.spv === 'TODOS' || c.sup === state.spv);
  function visibleCarteras(){
    return bySpv().map(c => {
      const idx = []; c.cl.forEach((cl,i) => { if (matches(cl)) idx.push(i); });
      return {c, idx};
    }).filter(v => !filtering() || v.idx.length > 0);
  }

  // ---- Toast ----
  let toastT = null;
  function toast(msg){
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1600);
  }

  // ---- Supervisores (se construyen una sola vez: no se pierde el desplazamiento) ----
  function buildPills(){
    const wrap = $('spvScroll');
    const sum = arr => { const k = new Set(); arr.forEach(c => c.cl.forEach(cl => k.add(claveCli(c, cl)))); return k.size; };
    const items = [{k:'TODOS', p:'Todos', n:sum(carteras), color:'#FFFFFF'}, {k:'MIXTOS', p:'⇄ Mixtos', n:sum(carteras.filter(isMixto)), color:'#A78BFA'}]
      .concat(sups.map(s => ({k:s.k, p:s.p, n:sum(carteras.filter(c => c.sup === s.k)), color:supColor[s.k]})));
    wrap.innerHTML = items.map(it =>
      `<button type="button" class="spv-pill" data-k="${esc(it.k)}" style="--dot:${it.color}"><i></i>${esc(it.p)}<small>${it.n.toLocaleString('es-PY')}</small></button>`
    ).join('');
    wrap.querySelectorAll('.spv-pill').forEach(b => b.onclick = () => {
      if (state.spv === b.dataset.k) return;
      state.spv = b.dataset.k; state.openId = null;
      $('vendedorSelect').value = 'TODOS';
      syncPills(); refresh(true); renderTop();
    });
    syncPills();
  }
  function syncPills(){
    document.querySelectorAll('.spv-pill').forEach(b => {
      const on = b.dataset.k === state.spv; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
    });
  }

  // ---- Días (se construyen una vez y solo se actualizan) ----
  function buildDays(){
    const wrap = $('dayChips');
    let h = '';
    if (TODAY_LBL) h += `<button type="button" class="day-chip today" data-today="1"><i></i>Hoy</button>`;
    h += `<button type="button" class="day-chip topchip" id="topChip" aria-pressed="false">${ICON.star}Top<small>0</small></button>`;
    h += DAY_LABELS.map(d => `<button type="button" class="day-chip" data-d="${d}"><span>${d}</span><small>0</small></button>`).join('');
    h += `<button type="button" class="day-chip clear" id="clearDays">Limpiar</button>`;
    wrap.innerHTML = h;
    wrap.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
      const d = b.dataset.d; state.days.has(d) ? state.days.delete(d) : state.days.add(d); refresh(true);
    });
    const t = wrap.querySelector('[data-today]');
    if (t) t.onclick = () => {
      const only = state.days.size === 1 && state.days.has(TODAY_LBL);
      state.days.clear(); if (!only) state.days.add(TODAY_LBL); refresh(true);
    };
    $('clearDays').onclick = () => { state.days.clear(); state.soloTop = false; refresh(true); };
    $('topChip').onclick = () => {
      if (topEstado !== 'ok'){ toast(topEstado === 'error' ? 'No se pudo cargar la lista de clientes top' : 'Cargando clientes top…'); return; }
      state.soloTop = !state.soloTop; refresh(true);
    };
  }
  function syncDays(){
    const base = bySpv();
    const counts = {}; DAY_LABELS.forEach(d => counts[d] = 0);
    let nTop = 0; const vistos = {}; DAY_LABELS.forEach(d => vistos[d] = new Set());
    base.forEach(c => c.cl.forEach(cl => {
      if (!matchQuery(cl)) return;
      if (cl._top && (!state.days.size || daysOf(cl).some(d => state.days.has(d)))) nTop++;
      if (state.soloTop && !cl._top) return;
      const k = claveCli(c, cl);
      daysOf(cl).forEach(d => { if (d in counts && !vistos[d].has(k)){ vistos[d].add(k); counts[d]++; } });
    }));
    const tc = $('topChip');
    tc.querySelector('small').textContent = topEstado === 'ok' ? nTop : '…';
    tc.classList.toggle('active', state.soloTop); tc.setAttribute('aria-pressed', state.soloTop);
    document.querySelectorAll('.day-chip[data-d]').forEach(b => {
      const d = b.dataset.d, on = state.days.has(d);
      b.querySelector('small').textContent = counts[d];
      b.classList.toggle('active', on); b.classList.toggle('zero', counts[d] === 0); b.setAttribute('aria-pressed', on);
    });
    const t = document.querySelector('.day-chip.today');
    if (t) t.classList.toggle('active', state.days.size === 1 && state.days.has(TODAY_LBL));
    $('clearDays').classList.toggle('show', state.days.size > 0 || state.soloTop);
  }

  // ---- KPIs con animación ----
  function setNum(id, to){
    const el = $(id); const from = +el.dataset.v || 0; el.dataset.v = to;
    if (from === to || reduceMotion){ el.textContent = to.toLocaleString('es-PY'); return; }
    const t0 = performance.now(), dur = 450;
    (function step(t){
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString('es-PY');
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  function renderKPIs(vis){
    let top = 0; const ciud = new Set(), unicos = new Set();
    vis.forEach(v => v.idx.forEach(i => { const cl = v.c.cl[i]; unicos.add(claveCli(v.c, cl)); ciud.add(cl[0]); if (cl._top) top++; }));
    const cli = unicos.size;
    setNum('kCli', cli); setNum('kCar', vis.length); setNum('kCiu', ciud.size);
    if (topEstado === 'ok') setNum('kTop', top); else $('kTop').textContent = topEstado === 'error' ? '–' : '…';
  }

  // ---- Lista de carteras ----
  let current = [];
  const findV = id => current.find(v => v.c.vc === id);
  const isVacante = c => /VACANTE/i.test(c.vn);
  function initials(c){ if (isVacante(c)) return '—'; return c.vn.split(/\s+/).filter(Boolean).slice(0,2).map(w => w[0]).join(''); }
  function shortName(c){
    if (isVacante(c)) return 'Vacante';
    const p = c.vn.split(/\s+/).filter(Boolean);
    return p[0].charAt(0) + p[0].slice(1).toLowerCase() + (p[1] ? ' ' + p[1].charAt(0) + '.' : '');
  }

  function cardHtml(v, k){
    const c = v.c, n = v.idx.length;
    const nTop = v.idx.reduce((a,i) => a + (c.cl[i]._top ? 1 : 0), 0);
    const wc = {}; WEEK.forEach(d => wc[d] = 0);
    c.cl.forEach(cl => daysOf(cl).forEach(d => { if (d in wc) wc[d]++; }));
    const max = Math.max(1, ...Object.values(wc));
    const bars = WEEK.map(d => `<span class="wb ${state.days.has(d) ? 'on' : ''}" title="${d}: ${wc[d]} clientes"><span class="bt"><i style="height:${wc[d] ? Math.max(12, Math.round(wc[d] / max * 100)) : 0}%"></i></span><em>${WEEK_LETTER[d]}</em></span>`).join('');
    return `<article class="cartera ${isVacante(c) ? 'vacante' : ''}" id="c-${esc(c.vc)}" data-id="${esc(c.vc)}" style="--c:${supColor[c.sup] || '#2E5BFF'}; animation-delay:${Math.min(k, 12) * 25}ms">
      <div class="head" role="button" tabindex="0" aria-expanded="false">
        <div class="avatar">${esc(initials(c))}</div>
        <div class="info">
          <div class="toprow"><span class="code">${esc(c.vc)}</span><span class="spvtag">${esc(supLabel[c.sup] || c.sup)}</span>${isVacante(c) ? '<span class="vac">Vacante</span>' : ''}${isMixto(c) ? `<span class="mixtag">⇄ Mixto · ${esc((pairOf(c) || {}).vc || '')}</span>` : ''}${nTop ? `<span class="toptag">${ICON.star}${nTop} top</span>` : ''}</div>
          <div class="name">${esc(c.vn)}</div>
          <div class="zone">${esc(c.vz)}</div>
        </div>
        <div class="right">
          <div class="count"><b>${n}</b><span>${filtering() ? 'de ' + c.cl.length : 'clientes'}</span></div>
          <div class="week">${bars}</div>
        </div>
        ${ICON.chev}
      </div>
      <div class="body"></div>
    </article>`;
  }

  function hl(s){
    s = String(s); const q = state.query;
    if (!q) return esc(s);
    const i = s.toLowerCase().indexOf(q);
    if (i < 0) return esc(s);
    return esc(s.slice(0,i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
  }
  function rowHtml(c, i){
    const cl = c.cl[i];
    const [ciudad, pm, nombre, dias, lat, lon, codigo] = cl;
    const dd = daysOf(cl).map(d => `<span class="dd ${state.days.has(d) ? 'on' : ''} ${d === TODAY_LBL ? 'hoy' : ''}">${esc(d)}</span>`).join('');
    const go = hasGps(cl)
      ? `<a class="go" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener" aria-label="Cómo llegar a ${esc(nombre)}">${ICON.nav}<span>Ir</span></a>`
      : `<span class="nogps">Sin GPS</span>`;
    return `<div class="client ${cl._top ? 'is-top' : ''}">
      <div class="cbody"><div class="cname">${cl._top ? `<span class="topbadge" title="Cliente top">${ICON.star}TOP</span>` : ''}${hl(nombre)}${codigo ? ` <span class="ccode">${hl(codigo)}</span>` : ''}</div>
        <div class="meta"><span class="tag city">${hl(ciudad)}</span>${pm ? `<span class="tag cat">${esc(pm)}</span>` : ''}${dd}</div>
      </div>${go}</div>`;
  }
  function bodyHtml(v){
    const c = v.c, pos = current.indexOf(v), prev = current[pos - 1], next = current[pos + 1];
    const gps = v.idx.filter(i => hasGps(c.cl[i])).length;
    return `<div class="inner">
      <div class="btools"><span>${ICON.gps} ${gps} de ${v.idx.length} con ubicación</span><span class="bt-btns">${isMixto(c) && pairOf(c) ? `<button class="mini mixbtn" type="button" data-pair="${esc(pairOf(c).vc)}">⇄ ${esc(pairOf(c).vc)}</button>` : ''}<button class="mini" type="button" data-act="map">${ICON.map} Ver zona</button></span></div>
      ${v.idx.map(i => rowHtml(c, i)).join('')}
      <div class="bnav">
        <button class="navb" type="button" data-go="${prev ? esc(prev.c.vc) : ''}" ${prev ? '' : 'disabled'}>‹ <span>${prev ? esc(prev.c.vc) : 'Inicio'}</span></button>
        <button class="navb close" type="button" data-act="close">Cerrar</button>
        <button class="navb" type="button" data-go="${next ? esc(next.c.vc) : ''}" ${next ? '' : 'disabled'}><span>${next ? esc(next.c.vc) : 'Fin'}</span> ›</button>
      </div></div>`;
  }
  function wireBody(el, v){
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { if (b.dataset.go) openCartera(b.dataset.go); });
    el.querySelector('[data-act="close"]').onclick = () => { collapse(v.c.vc); state.openId = null; scrollToCard(v.c.vc); };
    el.querySelector('[data-act="map"]').onclick = () => verZonaDe(v.c.vc);
    const pb = el.querySelector('[data-pair]');
    if (pb) pb.onclick = () => {
      const id = pb.dataset.pair;
      if (findV(id)) openCartera(id);
      else toast(`${id} no tiene clientes con este filtro`);
    };
  }

  function expand(id, scroll){
    const el = $('c-' + id), v = findV(id); if (!el || !v) return;
    el.classList.add('open'); el.querySelector('.head').setAttribute('aria-expanded', 'true');
    el.querySelector('.body').innerHTML = bodyHtml(v); wireBody(el, v);
    if (scroll) scrollToCard(id);
  }
  function collapse(id){
    const el = $('c-' + id); if (!el) return;
    el.classList.remove('open'); el.querySelector('.head').setAttribute('aria-expanded', 'false');
    el.querySelector('.body').innerHTML = '';
  }
  function openCartera(id){
    if (state.vista !== 'lista') setVista('lista');
    // Una sola cartera abierta a la vez (salvo en búsqueda): la lista queda corta y fácil de recorrer
    if (!searching()) document.querySelectorAll('.cartera.open').forEach(o => { if (o.dataset.id !== id) collapse(o.dataset.id); });
    state.openId = id; expand(id, true); syncRail(id);
  }
  function toggle(id){
    const el = $('c-' + id);
    if (el.classList.contains('open')){ collapse(id); if (state.openId === id) state.openId = null; return; }
    openCartera(id);
  }
  function stickyH(){ return $('stickyBar').offsetHeight; }
  function scrollToCard(id){
    requestAnimationFrame(() => {
      const el = $('c-' + id); if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - stickyH() - 10;
      window.scrollTo({top:y, behavior: reduceMotion ? 'auto' : 'smooth'});
    });
  }

  function renderList(){
    current = visibleCarteras();
    renderKPIs(current);
    const main = $('main');
    if (!current.length){
      main.innerHTML = `<div class="empty"><div class="big">${ICON.search}</div><b>No hay clientes con estos filtros</b><span>Probá con otro nombre, otra ciudad u otro día.</span><button class="clear-btn" id="clearBtn" type="button">Limpiar filtros</button></div>`;
      $('clearBtn').onclick = () => { state.query = ''; state.days.clear(); $('searchInput').value = ''; refresh(true); };
      $('rail').innerHTML = '';
      return;
    }
    const hint = filtering()
      ? `<div class="hint"><b>${(() => { const k = new Set(); current.forEach(v => v.idx.forEach(i => k.add(claveCli(v.c, v.c.cl[i])))); return k.size; })().toLocaleString('es-PY')}</b> clientes en <b>${current.length}</b> carteras. Tocá una para ver sus clientes.</div>`
      : `<div class="hint">Tocá una cartera para ver sus clientes.</div>`;
    main.innerHTML = hint + current.map(cardHtml).join('');
    main.querySelectorAll('.cartera').forEach(el => {
      const h = el.querySelector('.head');
      h.onclick = () => toggle(el.dataset.id);
      h.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(el.dataset.id); } };
    });
    renderRail();
    if (searching()) current.forEach(v => expand(v.c.vc, false));
    else if (state.openId && findV(state.openId)) expand(state.openId, false);
    else state.openId = null;
  }

  // ---- Barra para saltar entre carteras ----
  let railActive = null;
  function renderRail(){
    const rail = $('rail');
    rail.innerHTML = current.map(v => `<button type="button" class="rchip" id="r-${esc(v.c.vc)}" data-id="${esc(v.c.vc)}" style="--c:${supColor[v.c.sup] || '#2E5BFF'}"><i></i><b>${esc(v.c.vc)}</b>${isMixto(v.c) ? '⇄ ' : ''}${esc(shortName(v.c))}<small>${v.idx.length}</small></button>`).join('');
    rail.querySelectorAll('.rchip').forEach(b => b.onclick = () => openCartera(b.dataset.id));
    railActive = null; syncRail(state.openId || spyId());
  }
  function syncRail(id){
    if (!id || id === railActive) return; railActive = id;
    document.querySelectorAll('.rchip').forEach(b => b.classList.toggle('active', b.dataset.id === id));
    const chip = $('r-' + id), rail = $('rail');
    if (chip) rail.scrollTo({left: chip.offsetLeft - rail.clientWidth / 2 + chip.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth'});
  }
  function spyId(){
    const off = stickyH() + 24; let best = null;
    for (const el of document.querySelectorAll('.cartera')){
      if (el.getBoundingClientRect().top <= off) best = el.dataset.id;
      else { if (!best) best = el.dataset.id; break; }
    }
    return best;
  }
  $('collapseAll').onclick = () => { document.querySelectorAll('.cartera.open').forEach(o => collapse(o.dataset.id)); state.openId = null; toast('Carteras cerradas'); };

  // Al cambiar un filtro, la lista vuelve a empezar justo debajo de la barra (sin saltos raros)
  function keepTop(){
    const anchor = state.vista === 'lista' ? $('main') : $('mapView');
    const y = anchor.getBoundingClientRect().top + window.scrollY - stickyH() - 4;
    if (window.scrollY > y) window.scrollTo({top:y});
  }

  // ---- Mapa ----
  let leafletMap = null, markersLayer = null, meMarker = null, lastBounds = [];
  function initMap(){
    if (leafletMap) return;
    const paraguayBounds = L.latLngBounds([-27.7,-63.7], [-19.2,-53.6]);
    leafletMap = L.map('leafletMap', {maxBounds: paraguayBounds.pad(0.15), minZoom:6}).setView([-25.35, -57.25], 9);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom:19, attribution:'&copy; Esri &mdash; Source: Esri, HERE, Garmin, USGS, NGA, EPA, NPS'
    }).addTo(leafletMap);
    markersLayer = L.layerGroup().addTo(leafletMap);
  }
  function renderMap(){
    initMap(); markersLayer.clearLayers();
    const vendedorSel = $('vendedorSelect').value;
    const mixSel = vendedorSel.startsWith('MIX:');
    const base = vendedorSel === 'TODOS' ? bySpv()
      : mixSel ? carteras.filter(c => isMixto(c) && numOf(c.vc) === vendedorSel.slice(4))
      : carteras.filter(c => c.vc === vendedorSel);
    const MIXCOL = ['#2E5BFF', '#E08700'];
    const colorDe = c => mixSel ? MIXCOL[base.indexOf(c) % 2] : (supColor[c.sup] || '#2E5BFF');
    let conUbic = 0, total = 0; lastBounds = [];
    const supsEnMapa = new Set();
    base.forEach(c => {
      c.cl.forEach(cl => {
        if (!matches(cl)) return;
        total++;
        if (!hasGps(cl)) return;
        const [ciudad, pm, nombre, dias, lat, lon, codigo] = cl;
        conUbic++; supsEnMapa.add(c.sup);
        const m = L.circleMarker([lat, lon], {
          radius: (vendedorSel === 'TODOS' ? 7 : 9) + (cl._top ? 2 : 0), color: cl._top ? '#0C1A2E' : '#fff', weight: cl._top ? 3 : 2, fillColor: colorDe(c), fillOpacity:.92
        });
        m.bindPopup(`${cl._top ? '<span class="ptop">★ Cliente top</span><br>' : ''}<b>${esc(nombre)}</b>${codigo ? ` <span class="pcode">${esc(codigo)}</span>` : ''}<br>${esc(ciudad)}<br>Vendedor: ${esc(c.vc)} · ${esc(c.vn)}<br>Días: ${esc(dias)}<br>` +
          `<a class="pgo" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener">Cómo llegar</a>`);
        m.addTo(markersLayer); lastBounds.push([lat, lon]);
      });
    });
    $('mapLegend').innerHTML = mixSel
      ? base.map(c => `<span style="--c:${colorDe(c)}"><i></i>${esc(c.vc)} · ${esc(c.vz)}</span>`).join('')
      : sups.filter(s => supsEnMapa.has(s.k)).map(s => `<span style="--c:${supColor[s.k]}"><i></i>${esc(s.p)}</span>`).join('');
    if (topEstado === 'ok') $('mapLegend').innerHTML += `<span class="lg-top"><i></i>Cliente top (borde oscuro)</span>`;
    if (lastBounds.length) leafletMap.fitBounds(lastBounds, {padding:[28,28], maxZoom: vendedorSel === 'TODOS' ? 15 : 16});
    const diaTxt = state.days.size ? [...state.days].join(', ') : 'todos los días';
    const quien = vendedorSel === 'TODOS' ? '' : ' · ' + (mixSel ? base.map(c => c.vc).join(' + ') : vendedorSel);
    $('mapNote').textContent = conUbic
      ? `Mostrando ${conUbic} de ${total} clientes con ubicación cargada (${diaTxt}${quien}).`
      : `Ninguno de los ${total} clientes filtrados tiene ubicación cargada todavía (${diaTxt}${quien}).`;
    setTimeout(() => leafletMap.invalidateSize(), 60);
  }
  const vendedorSelect = $('vendedorSelect');
  carteras.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.vc; opt.textContent = `${c.vc} — ${c.vn} (${c.vz})`;
    vendedorSelect.appendChild(opt);
  });
  if (MIX.codes.length){
    const og = document.createElement('optgroup'); og.label = 'Vendedores mixtos (ambas carteras)';
    MIX.codes.forEach(n => {
      const par = carteras.filter(c => isMixto(c) && numOf(c.vc) === n); if (!par.length) return;
      const opt = document.createElement('option'); opt.value = 'MIX:' + n;
      opt.textContent = `⇄ ${par.map(c => c.vc).join(' + ')} — ${par[0].vn}`;
      og.appendChild(opt);
    });
    vendedorSelect.appendChild(og);
  }
  vendedorSelect.addEventListener('change', renderMap);
  $('btnFit').onclick = () => { if (leafletMap && lastBounds.length) leafletMap.fitBounds(lastBounds, {padding:[28,28]}); };
  $('btnLocate').onclick = () => {
    if (!navigator.geolocation){ toast('Ubicación no disponible'); return; }
    toast('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(p => {
      const ll = [p.coords.latitude, p.coords.longitude];
      if (meMarker) meMarker.setLatLng(ll);
      else meMarker = L.circleMarker(ll, {radius:10, color:'#fff', weight:3, fillColor:'#E5484D', fillOpacity:1}).addTo(leafletMap).bindPopup('Estás aquí');
      leafletMap.flyTo(ll, 15);
    }, () => toast('No se pudo obtener tu ubicación'), {enableHighAccuracy:true, timeout:10000});
  };

  // ---- Clientes top (se leen de clientes_top.xlsx) ----
  let topEstado = 'cargando', topFecha = null, topError = '';
  function cargarTop(){
    if (typeof window.leerExcel !== 'function'){ topEstado = 'error'; topError = 'Falta excel.js'; return; }
    window.leerExcel('clientes_top.xlsx', ['Vendedor', 'Subcliente']).then(({filas, fecha}) => {
      const claves = new Set();
      filas.forEach(f => {
        const m = String(f['subcliente']).match(/^\s*(\d+)-(\d+)/);
        if (m && f['vendedor']) claves.add(f['vendedor'].trim().toUpperCase() + '|' + m[1] + '-' + m[2]);
      });
      let marcados = 0;
      carteras.forEach(c => c.cl.forEach(cl => {
        cl._top = !!(cl[6] && claves.has(c.vc.toUpperCase() + '|' + cl[6]));
        if (cl._top) marcados++;
      }));
      topEstado = 'ok'; topFecha = fecha;
      if (claves.size > marcados) console.warn(`Clientes top: ${claves.size - marcados} códigos del Excel no están en el ruteo de la app.`);
      refresh(false); renderTop();
    }).catch(err => {
      topEstado = 'error'; topError = err.message || String(err);
      console.warn('Clientes top:', topError);
      refresh(false); renderTop();
    });
  }

  function renderTop(){
    const box = $('topView'); if (!box) return;
    if (state.seccion !== 'top') return;
    if (topEstado !== 'ok'){
      box.innerHTML = `<div class="tv-wrap"><div class="tv-state">${topEstado === 'cargando'
        ? '<b>Cargando clientes top…</b>'
        : `<b>No se pudo leer la lista de clientes top</b><span>Revisá que el archivo <code>clientes_top.xlsx</code> esté subido en GitHub. (${esc(topError)})</span>`}</div></div>`;
      return;
    }
    if (!state.topDay) state.topDay = TODAY_LBL || 'Lun';
    const day = state.topDay;
    const base = bySpv();
    // Por cartera: clientes top y visitas por día
    const filasV = base.map(c => {
      const porDia = {}; WEEK.forEach(d => porDia[d] = 0); let tot = 0;
      c.cl.forEach(cl => { if (!cl._top) return; tot++; daysOf(cl).forEach(d => { if (d in porDia) porDia[d]++; }); });
      return {c, porDia, tot};
    });
    const conTop = filasV.filter(r => r.tot > 0);
    const semana = {}; WEEK.forEach(d => semana[d] = conTop.reduce((a,r) => a + r.porDia[d], 0));
    const totCli = conTop.reduce((a,r) => a + r.tot, 0);
    const totVis = WEEK.reduce((a,d) => a + semana[d], 0);
    const maxDia = Math.max(1, ...WEEK.map(d => semana[d]));
    const maxCelda = Math.max(1, ...conTop.flatMap(r => WEEK.map(d => r.porDia[d])));
    const DIA_LARGO = {Lun:'lunes', Mar:'martes', 'Mié':'miércoles', Jue:'jueves', Vie:'viernes', 'Sáb':'sábado'};
    const quien = state.spv === 'TODOS' ? 'Todos los supervisores' : state.spv === 'MIXTOS' ? 'Carteras mixtas' : (supLabel[state.spv] || state.spv);

    const barras = WEEK.map(d => `<button type="button" class="tv-day ${d === day ? 'on' : ''} ${d === TODAY_LBL ? 'hoy' : ''}" data-day="${d}" aria-pressed="${d === day}">
        <b>${semana[d]}</b><span class="tv-bar"><i style="height:${Math.round(semana[d] / maxDia * 100)}%"></i></span><em>${d}</em></button>`).join('');

    const celda = (n, d) => `<td class="${d === day ? 'sel' : ''}" style="--a:${n ? (0.12 + 0.88 * n / maxCelda).toFixed(2) : 0}">${n || ''}</td>`;
    const filaHtml = r => `<tr class="tv-row" data-vc="${esc(r.c.vc)}" tabindex="0">
        <th scope="row"><span class="tv-dot" style="--c:${supColor[r.c.sup] || '#2E5BFF'}"></span><span class="tv-vc">${esc(r.c.vc)}</span><span class="tv-vn">${esc(isVacante(r.c) ? 'Vacante' : shortName(r.c))}</span></th>
        ${WEEK.map(d => celda(r.porDia[d], d)).join('')}<td class="tv-tot">${r.tot}</td></tr>`;
    let cuerpo = '';
    if (state.spv === 'TODOS'){
      sups.forEach(sp => {
        const rs = conTop.filter(r => r.c.sup === sp.k); if (!rs.length) return;
        const sd = {}; WEEK.forEach(d => sd[d] = rs.reduce((a,r) => a + r.porDia[d], 0));
        cuerpo += `<tr class="tv-sup"><th scope="rowgroup"><span class="tv-dot" style="--c:${supColor[sp.k]}"></span>${esc(sp.p)}</th>${WEEK.map(d => `<td class="${d === day ? 'sel' : ''}">${sd[d] || ''}</td>`).join('')}<td class="tv-tot">${rs.reduce((a,r) => a + r.tot, 0)}</td></tr>`;
        cuerpo += rs.map(filaHtml).join('');
      });
    } else cuerpo = conTop.map(filaHtml).join('');

    const sinTop = filasV.length - conTop.length;
    box.innerHTML = `<div class="tv-wrap">
      <div class="tv-head">
        <h2>Clientes top</h2>
        <p>${esc(quien)}: <b>${totCli}</b> clientes top y <b>${totVis}</b> visitas por semana.</p>
      </div>
      ${conTop.length ? `
      <section class="tv-week" aria-label="Visitas top por día">${barras}</section>
      <div class="tv-callout">
        <div><b>${semana[day]}</b> visitas a clientes top el ${DIA_LARGO[day]}${day === TODAY_LBL ? ' (hoy)' : ''}</div>
        <button type="button" class="tv-cta" id="tvVerRuta">Ver en la ruta</button>
      </div>
      <div class="tv-table-wrap">
        <table class="tv-table">
          <colgroup><col class="c-name">${WEEK.map(() => '<col>').join('')}<col class="c-tot"></colgroup>
          <thead><tr><th scope="col">Cartera</th>${WEEK.map(d => `<th scope="col" class="${d === day ? 'sel' : ''}"><span>${WEEK_LETTER[d]}</span></th>`).join('')}<th scope="col">Clientes</th></tr></thead>
          <tbody>${cuerpo}</tbody>
        </table>
      </div>
      <p class="tv-note">Tocá una cartera para ver sus clientes top del ${DIA_LARGO[day]} en la ruta.${sinTop ? ` ${sinTop} ${sinTop === 1 ? 'cartera no tiene' : 'carteras no tienen'} clientes top.` : ''}</p>`
      : `<div class="tv-state"><b>No hay clientes top en esta selección</b><span>Elegí otro supervisor arriba.</span></div>`}
    </div>`;

    box.querySelectorAll('.tv-day').forEach(b => b.onclick = () => { state.topDay = b.dataset.day; renderTop(); });
    const irRuta = vc => {
      state.soloTop = true; state.days = new Set([day]); state.query = ''; $('searchInput').value = '';
      setSeccion('ruta'); setVista('lista'); refresh(true);
      if (vc) openCartera(vc);
    };
    const cta = $('tvVerRuta'); if (cta) cta.onclick = () => irRuta(null);
    box.querySelectorAll('.tv-row').forEach(tr => {
      tr.onclick = () => irRuta(tr.dataset.vc);
      tr.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); irRuta(tr.dataset.vc); } };
    });
  }

  // ---- Secciones: Ruta, Top y Precios (barra inferior) ----
  function setSeccion(s){
    state.seccion = s;
    document.body.dataset.seccion = s;
    document.querySelectorAll('.bnav-btn[data-sec]').forEach(b => {
      const on = b.dataset.sec === s; b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('topView').hidden = s !== 'top';
    $('preciosView').hidden = s !== 'precios';
    if (s === 'top') renderTop();
    if (s === 'precios' && window.Precios) window.Precios.mostrar();
    if (s === 'ruta' && state.vista === 'mapa') renderMap();
    window.scrollTo({top:0});
  }
  document.querySelectorAll('.bnav-btn[data-sec]').forEach(b => b.onclick = () => { if (state.seccion !== b.dataset.sec) setSeccion(b.dataset.sec); else window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'}); });
  const navCat = $('navCatalogo');
  if (navCat) navCat.onclick = () => { if (window.abrirCatalogo) window.abrirCatalogo(); };
  window.RUTEO = { setSeccion };

  // ---- Lista / Mapa ----
  function setVista(v){
    state.vista = v;
    $('btnViewLista').classList.toggle('active', v === 'lista');
    $('btnViewMapa').classList.toggle('active', v === 'mapa');
    $('listView').classList.toggle('hide', v === 'mapa');
    $('mapView').classList.toggle('show', v === 'mapa');
    $('stickyBar').classList.toggle('map-mode', v === 'mapa');
    if (v === 'mapa') renderMap();
    keepTop();
  }
  $('btnViewLista').onclick = () => setVista('lista');
  $('btnViewMapa').onclick = () => setVista('mapa');
  function verZonaDe(vc){ vendedorSelect.value = vc; setVista('mapa'); renderMap(); }

  // ---- Búsqueda ----
  const searchInput = $('searchInput');
  let debT = null;
  searchInput.addEventListener('input', e => {
    clearTimeout(debT);
    const v = e.target.value;
    debT = setTimeout(() => { state.query = v.trim().toLowerCase(); refresh(true); }, 160);
  });
  $('clearSearch').onclick = () => { searchInput.value = ''; state.query = ''; refresh(true); searchInput.focus(); };

  function refresh(resetScroll){
    syncDays();
    $('clearSearch').classList.toggle('show', !!state.query);
    renderList();
    if (state.vista === 'mapa') renderMap();
    if (resetScroll) keepTop();
  }

  // ---- Scroll: botón arriba, sombra de la barra y cartera activa ----
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      $('toTop').classList.toggle('show', window.scrollY > 600);
      const sb = $('stickyBar'); sb.classList.toggle('stuck', sb.getBoundingClientRect().top <= 0 && window.scrollY > 50);
      if (state.seccion === 'ruta' && state.vista === 'lista') syncRail(spyId());
    });
  }, {passive:true});
  $('toTop').onclick = () => window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'});

  $('footerNote').textContent = `Ruteo actualizado al ${GEN_DATE}`;

  buildPills();
  buildDays();
  setSeccion('ruta');
  refresh(false);
  cargarTop();
})();
