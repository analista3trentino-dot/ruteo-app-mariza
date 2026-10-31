(function(){
  const DAY_LABELS = ["Lun","Mar","Mié","Jue","Vie","Sáb","S/Cal"];
  const WEEK = ["Lun","Mar","Mié","Jue","Vie","Sáb"];
  const WEEK_LETTER = {Lun:'L',Mar:'M','Mié':'X',Jue:'J',Vie:'V','Sáb':'S'};
  const GEN_DATE = APP_DATA.fecha || "";  // fecha del ruteo (del Excel del sistema)
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

  // ---- Modo vendedor: el link ?c=TR1338 muestra solo esa cartera (y su par mixto) ----
  // También se puede elegir la cartera una vez: el celular la recuerda.
  const CLAVE_CARTERA = 'ruteoTR1_miCartera';
  const leerGuardada = () => { try { return localStorage.getItem(CLAVE_CARTERA) || ''; } catch(e){ return ''; } };
  const guardar = v => { try { if (v) localStorage.setItem(CLAVE_CARTERA, v); else localStorage.removeItem(CLAVE_CARTERA); } catch(e){} };
  const PARAM_C = (new URLSearchParams(location.search).get('c') || '').trim().toUpperCase();
  // Modo supervisor protegido con clave (config.js)
  // Cada supervisor tiene su clave (config.js) y ve solo su equipo
  const CLAVES_SUP = typeof CLAVES_SUPERVISORES !== 'undefined' ? CLAVES_SUPERVISORES : {};
  const claveSup = k => String(CLAVES_SUP[k] || '').trim();
  const huella = t => { let h = 5381; for (const ch of String(t)) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return 'k' + (h >>> 0).toString(36); };
  const CLAVE_OK = 'ruteoTR1_supOK';
  const supValidoDe = k => { const c = claveSup(k); if (!k || !c) return false; try { return localStorage.getItem(CLAVE_OK + '_' + k) === huella(c); } catch(e){ return false; } };
  const MISUP_GUARD = (() => { try { return localStorage.getItem('ruteoTR1_miSup') || ''; } catch(e){ return ''; } })();
  // Jefatura: otra clave (config.js)
  const CLAVE_J = (typeof CLAVE_JEFATURA !== 'undefined' ? String(CLAVE_JEFATURA) : '').trim();
  const CLAVE_JOK = 'ruteoTR1_jefOK';
  const jefValido = () => { if (!CLAVE_J) return true; try { return localStorage.getItem(CLAVE_JOK) === huella(CLAVE_J); } catch(e){ return false; } };
  let GUARDADA = leerGuardada();
  if (GUARDADA === 'TODAS' && !supValidoDe(MISUP_GUARD)) GUARDADA = '';      // sin la clave de su equipo vuelve a preguntar
  if (GUARDADA === 'JEFATURA' && !jefValido()) GUARDADA = '';
  const ESPECIAL = GUARDADA === 'TODAS' || GUARDADA === 'JEFATURA';
  const ELEGIDA = PARAM_C || (ESPECIAL ? '' : GUARDADA);
  const MI_CARTERA = carteras.find(c => c.vc.toUpperCase() === ELEGIDA) || null;
  const MODO_VENDEDOR = !!MI_CARTERA;
  const MODO_JEFATURA = !MODO_VENDEDOR && GUARDADA === 'JEFATURA';
  // Primera vez en este celular: la portada pide elegir (no se puede cerrar sin elegir)
  const PREGUNTAR = !MI_CARTERA && !ESPECIAL;

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

  // Supervisor: cuál es su equipo (lo elige una vez en la portada)
  const CLAVE_MISUP = 'ruteoTR1_miSup';
  const NOMBRE_SUP = k => { const L = typeof SUPERVISORES !== 'undefined' ? SUPERVISORES : {}; const n = L[k] || ''; return /vacante/i.test(n) ? '' : n.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()); };
  const MI_SUP = (() => { if (MODO_VENDEDOR || MODO_JEFATURA || PREGUNTAR) return ''; return sups.some(s => s.k === MISUP_GUARD) ? MISUP_GUARD : ''; })();
  const SUP_FIJO = !!MI_SUP;   // el supervisor solo ve su equipo
  const state = { spv: MI_SUP || 'TODOS', query:'', days:new Set(), openId:null, vista:'lista', soloTop:false, seccion:'ruta', topDay:null };

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
  const bySpv = () => MODO_VENDEDOR ? carteras.filter(c => numOf(c.vc) === numOf(MI_CARTERA.vc))
    : state.spv === 'MIXTOS' ? carteras.filter(isMixto) : carteras.filter(c => state.spv === 'TODOS' || c.sup === state.spv);
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
      .concat(sups.map(s => ({k:s.k, p:s.p, n:sum(carteras.filter(c => c.sup === s.k)), color:supColor[s.k]})))
      .filter(it => it.k !== 'MIXTOS' || it.n);   // sin carteras mixtas no se muestra ese botón
    wrap.innerHTML = items.map(it =>
      `<button type="button" class="spv-pill" data-k="${esc(it.k)}" style="--dot:${it.color}"><i></i>${esc(it.p)}<small>${it.n.toLocaleString('es-PY')}</small></button>`
    ).join('');
    wrap.querySelectorAll('.spv-pill').forEach(b => b.onclick = () => {
      if (state.spv === b.dataset.k) return;
      state.spv = b.dataset.k; state.openId = null;
      $('vendedorSelect').value = 'TODOS';
      syncPills(); refresh(true); renderTop();
      if (window.Visitas) window.Visitas.refrescar();
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
    if (!$('kCli')) return;
    let top = 0; const ciud = new Set(), unicos = new Set();
    vis.forEach(v => v.idx.forEach(i => { const cl = v.c.cl[i]; unicos.add(claveCli(v.c, cl)); ciud.add(cl[0]); if (cl._top) top++; }));
    const cli = unicos.size;
    setNum('kCli', cli); setNum('kCar', vis.length); setNum('kCiu', ciud.size);
    if (topEstado === 'ok') setNum('kTop', top); else $('kTop').textContent = topEstado === 'error' ? '–' : '…';
  }

  // ---- Potencial (lo que el cliente puede comprar en el mes) ----
  const POT = () => window.Potencial && window.Potencial.listo ? window.Potencial : null;
  const mill = n => { const v = (n || 0) / 1e6; return v >= 100 ? Math.round(v).toLocaleString('es-PY') + ' M' : v >= 1 ? v.toLocaleString('es-PY', {maximumFractionDigits: 1}) + ' M' : Math.round((n || 0) / 1000).toLocaleString('es-PY') + ' mil'; };
  const gsN = n => 'Gs. ' + Math.round(n || 0).toLocaleString('es-PY');
  const DIA_UNO = () => state.days.size === 1 ? [...state.days][0] : null;
  // Suma del potencial de los clientes que se ven (cada cliente una vez)
  function sumaPot(vis){
    const P = POT(); if (!P) return null;
    const vistos = new Set(); let pot = 0, ven = 0, n = 0, sin = 0;
    vis.forEach(v => v.idx.forEach(i => {
      const cl = v.c.cl[i], k = claveCli(v.c, cl); if (vistos.has(k) || !cl[6] || !P.tiene(cl[6])) return; vistos.add(k);
      const p = P.potDe(cl[6]), s = P.ventaDe(cl[6]); pot += p; ven += s; n++; if (s <= 0 && p > 0) sin++;
    }));
    return {pot, ven, n, sin};
  }
  function potDiaHtml(vis){
    const d = DIA_UNO(); if (!d || d === 'S/Cal' || state.soloTop || state.query) return '';
    if (window.Potencial && !window.Potencial.listo){
      return window.Potencial.error ? '' : `<div class="pot-dia cargando"><div class="pot-t"><span>Potencial ${d === TODAY_LBL ? 'de hoy' : 'del ' + DIA_LARGO_[d]}</span></div><div class="esqueleto"></div><div class="esqueleto corto"></div></div>`;
    }
    const s = sumaPot(vis); if (!s || !s.pot) return '';
    const P = POT(), a = Math.round(s.ven / s.pot * 100), falta = Math.max(0, s.pot - s.ven), q = P.quedan(d);
    const ton = a >= 90 ? 'good' : a >= 60 ? 'mid' : 'bad';
    return `<div class="pot-dia">
      <div class="pot-t"><span>Potencial ${d === TODAY_LBL ? 'de hoy' : 'del ' + DIA_LARGO_[d]}</span><small>${esc(P.fuente())}</small></div>
      <div class="pot-nums">
        <div><small>Pueden comprar en ${esc(P.mes())}</small><b>${gsN(s.pot)}</b></div>
        <div><small>Ya compraron</small><b>${gsN(s.ven)}</b></div>
      </div>
      <div class="pot-bar"><i class="${ton}" style="width:${Math.min(100, a)}%"></i></div>
      <p class="pot-linea"><b class="${ton}">${a}%</b> del potencial${falta ? ` · faltan <b>${gsN(falta)}</b>` : ' · <b class="good">¡completo!</b>'}${falta && q ? ` <span>(${q === 1 ? 'queda 1 ' + DIA_LARGO_[d] : 'quedan ' + q + ' ' + DIA_LARGO_[d] + (d === 'Sáb' ? 's' : '')} en el mes)</span>` : ''}</p>
      ${s.sin ? `<p class="pot-sin"><b>${s.sin}</b> ${s.sin === 1 ? 'cliente todavía no compró' : 'clientes todavía no compraron'} este mes</p>` : ''}
    </div>`;
  }
  const DIA_LARGO_ = {Lun:'lunes', Mar:'martes', 'Mié':'miércoles', Jue:'jueves', Vie:'viernes', 'Sáb':'sábado'};

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
    return `<article class="cartera ${isVacante(c) ? 'vacante' : ''}" id="c-${esc(c.vc)}" data-id="${esc(c.vc)}" style="--c:${supColor[c.sup] || '#2E5BFF'}; animation-delay:${Math.min(k, 12) * 25}ms">
      <div class="head" role="button" tabindex="0" aria-expanded="false">
        <div class="avatar">${esc(initials(c))}</div>
        <div class="info">
          <div class="toprow"><span class="code">${esc(c.vc)}</span>${(state.spv === 'TODOS' || state.spv === 'MIXTOS') && !MODO_VENDEDOR ? `<span class="spvtag">${esc(supLabel[c.sup] || c.sup)}</span>` : ''}${isVacante(c) ? '<span class="vac">Vacante</span>' : ''}${isMixto(c) ? `<span class="mixtag">⇄ Mixto · ${esc((pairOf(c) || {}).vc || '')}</span>` : ''}${nTop ? `<span class="toptag">${ICON.star}${nTop} top</span>` : ''}</div>
          <div class="name">${esc(c.vn)}</div>
          <div class="zone">${esc(c.vz)}</div>
          ${(() => { if (!DIA_UNO() || !POT()) return ''; const s = sumaPot([v]); if (!s || !s.pot) return ''; const a = Math.round(s.ven / s.pot * 100); return `<div class="cpot-head"><span class="cpot-bar"><i class="${a >= 90 ? 'good' : a >= 60 ? 'mid' : 'bad'}" style="width:${Math.min(100, a)}%"></i></span><span>${a}% de ${mill(s.pot)}</span></div>`; })()}
        </div>
        <div class="right">
          <div class="count"><b>${n}</b><span>${n === 1 ? 'cliente' : 'clientes'}</span></div>
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
  function potCliHtml(codigo){
    const P = POT(); if (!P || !codigo || !P.tiene(codigo)) return '';
    const p = P.potDe(codigo), s = P.ventaDe(codigo); if (!p && !s) return '';
    const a = p ? Math.min(100, Math.round(s / p * 100)) : 100, ton = s <= 0 ? 'bad' : a >= 90 ? 'good' : a >= 60 ? 'mid' : 'bad';
    return `<div class="cpot"><span class="cpot-bar"><i class="${ton}" style="width:${s <= 0 ? 0 : Math.max(4, a)}%"></i></span><span class="cpot-txt">Puede <b>${mill(p)}</b> · compró <b class="${s <= 0 ? 'bad' : ''}">${s <= 0 ? 'nada' : mill(s)}</b></span>${p >= P.destacado ? '<span class="cpot-2mm">+2MM</span>' : ''}</div>`;
  }
  function rowHtml(c, i){
    const cl = c.cl[i];
    const [ciudad, , nombre, dias, lat, lon, codigo, lp, pm] = cl;
    const dd = daysOf(cl).map(d => d === TODAY_LBL ? `<b class="hoy">${esc(d)}</b>` : esc(d)).join(', ');
    const go = hasGps(cl)
      ? `<a class="go" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener" aria-label="Cómo llegar a ${esc(nombre)}">${ICON.nav}<span>Ir</span></a>`
      : `<span class="nogps">Sin GPS</span>`;
    const lpBtn = `<button type="button" class="lpbtn ${lp ? '' : 'nolp'}" data-lpi="${i}" aria-label="Lista de precios de ${esc(nombre)}"><b>LP</b><span>${esc(lp || '—')}</span></button>`;
    return `<div class="client ${cl._top ? 'is-top' : ''}">
      <div class="cbody"><div class="cname">${cl._top ? `<span class="topbadge" title="Cliente top">${ICON.star}TOP</span>` : ''}${hl(nombre)}${codigo ? ` <span class="ccode">${hl(codigo)}</span>` : ''}</div>
        <div class="meta">${hl(ciudad)}<span class="sep"></span>${dd}${pm ? `<span class="sep"></span><span class="pmtag">PM ${esc(pm)}</span>` : ''}</div>
      </div><div class="acts">${lpBtn}${go}</div>${potCliHtml(codigo)}${cl._top && window.Fotos ? window.Fotos.filaCli(cl, c) : ''}</div>`;
  }
  function bodyHtml(v){
    const c = v.c;
    return `<div class="inner">
      <div class="btools">${isMixto(c) && pairOf(c) ? `<button class="mini mixbtn" type="button" data-pair="${esc(pairOf(c).vc)}">⇄ Ver ${esc(pairOf(c).vc)}</button>` : '<span></span>'}<button class="mini" type="button" data-act="map">${ICON.map} Ver en el mapa</button></div>
      ${v.idx.map(i => rowHtml(c, i)).join('')}
      ${MODO_VENDEDOR ? '' : `<button class="card-close" type="button" data-act="close">Cerrar cartera</button>`}</div>`;
  }
  function wireBody(el, v){
    const cerrar = el.querySelector('[data-act="close"]');
    if (cerrar) cerrar.onclick = () => { collapse(v.c.vc); state.openId = null; scrollToCard(v.c.vc); };
    el.querySelector('[data-act="map"]').onclick = () => verZonaDe(v.c.vc);
    el.querySelectorAll('[data-lpi]').forEach(b => b.onclick = () => {
      const cl = v.c.cl[+b.dataset.lpi];
      if (window.Precios && window.Precios.abrirCliente) window.Precios.abrirCliente({nombre: cl[2], codigo: cl[6], lp: cl[7], pm: cl[8]});
    });
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
    if (window.Fotos) window.Fotos.enlazar(el);
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
    state.openId = id; expand(id, true);
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

  // Fotos de clientes top: aviso arriba de la ruta (vendedor: sus fotos de hoy; supervisor: las del equipo)
  const bannerFotos = () => (window.Fotos && !state.query) ? window.Fotos.bannerRuta(current, DIA_UNO(), TODAY_LBL) : '';
  function renderList(){
    current = visibleCarteras();
    renderKPIs(current);
    const main = $('main');
    if (!current.length){
      const soloDias = !state.query && !state.soloTop && state.days.size > 0;
      const DL = {Lun:'el lunes', Mar:'el martes', 'Mié':'el miércoles', Jue:'el jueves', Vie:'el viernes', 'Sáb':'el sábado', 'S/Cal':'sin día fijo'};
      const diaTxt = state.days.size === 1 ? (state.days.has(TODAY_LBL) ? 'hoy' : DL[[...state.days][0]]) : 'esos días';
      main.innerHTML = soloDias
        ? `<div class="empty"><div class="big">${ICON.search}</div><b>No hay clientes para ${diaTxt}</b><span>${MODO_VENDEDOR ? 'Tu cartera no tiene visitas programadas ese día.' : 'Ninguna cartera tiene visitas ese día.'}</span><button class="clear-btn" id="clearBtn" type="button">Ver todos los días</button></div>`
        : `<div class="empty"><div class="big">${ICON.search}</div><b>No hay clientes con estos filtros</b><span>Probá con otro nombre, otra ciudad u otro día.</span><button class="clear-btn" id="clearBtn" type="button">Limpiar filtros</button></div>`;
      $('clearBtn').onclick = () => { state.query = ''; state.days.clear(); state.soloTop = false; $('searchInput').value = ''; refresh(true); };
      return;
    }
    const unicos = new Set(); let nTop = 0;
    current.forEach(v => v.idx.forEach(i => { const cl = v.c.cl[i]; unicos.add(claveCli(v.c, cl)); if (cl._top) nTop++; }));
    const DIA_LARGO = {Lun:'lunes', Mar:'martes', 'Mié':'miércoles', Jue:'jueves', Vie:'viernes', 'Sáb':'sábado', 'S/Cal':'sin día fijo'};
    const cuando = state.days.size === 1 ? (state.days.has(TODAY_LBL) ? 'Hoy' : 'El ' + DIA_LARGO[[...state.days][0]]) : state.days.size ? 'Esos días' : 'En total';
    const hint = `<div class="hint"><span>${cuando}: <b>${unicos.size.toLocaleString('es-PY')}</b> ${unicos.size === 1 ? 'cliente' : 'clientes'}${MODO_VENDEDOR ? '' : ` en <b>${current.length}</b> ${current.length === 1 ? 'cartera' : 'carteras'}`}${topEstado === 'ok' && nTop ? `, <b class="hint-top">${nTop} top</b>` : ''}</span></div>`;
    // Jefatura: primero los supervisores; al tocar uno, sus vendedores
    if (MODO_JEFATURA && state.spv === 'TODOS' && !searching()){
      main.innerHTML = hint + potDiaHtml(current) + bannerFotos() + `<div class="vs-lista-h">Tocá un supervisor para ver sus vendedores</div>` + sups.map((s, k) => {
        const vs = current.filter(v => v.c.sup === s.k); if (!vs.length) return '';
        const cl = new Set(); vs.forEach(v => v.idx.forEach(i => cl.add(claveCli(v.c, v.c.cl[i]))));
        const sp = DIA_UNO() && POT() ? sumaPot(vs) : null, a = sp && sp.pot ? Math.round(sp.ven / sp.pot * 100) : null;
        const activos = vs.filter(v => !isVacante(v.c)).length, nom = NOMBRE_SUP(s.k);
        return `<button type="button" class="jf-grupo" data-grupo="${esc(s.k)}" style="--c:${supColor[s.k]}; animation-delay:${k * 40}ms">
          <span class="jf-g-av">${esc(s.k)}</span>
          <span class="jf-g-info"><b>${esc(s.p)}</b><small>${nom ? esc(nom) : 'Supervisor vacante'} · ${activos} ${activos === 1 ? 'vendedor' : 'vendedores'}${vs.length > activos ? ` (+${vs.length - activos} ${vs.length - activos === 1 ? "vacante" : "vacantes"})` : ''}</small>
            ${a !== null ? `<span class="cpot-head"><span class="cpot-bar"><i class="${a >= 90 ? 'good' : a >= 60 ? 'mid' : 'bad'}" style="width:${Math.min(100, a)}%"></i></span><span>${a}% de ${mill(sp.pot)}</span></span>` : ''}</span>
          <span class="jf-g-n"><b>${cl.size.toLocaleString('es-PY')}</b><small>clientes</small></span>${ICON.chev}
        </button>`;
      }).join('');
      main.querySelectorAll('[data-grupo]').forEach(b => b.onclick = () => window.RUTEO.setSpv(b.dataset.grupo));
      if (window.Fotos) window.Fotos.enlazar(main);
      return;
    }
    const volver = MODO_JEFATURA && state.spv !== 'TODOS' ? `<button type="button" class="pt-volver jf-volver" id="jfVolver">‹ Todos los supervisores</button>` : '';
    main.innerHTML = volver + hint + potDiaHtml(current) + bannerFotos() + current.map(cardHtml).join('');
    if (window.Fotos) window.Fotos.enlazar(main);
    if (volver) $('jfVolver').onclick = () => window.RUTEO.setSpv('TODOS');
    main.querySelectorAll('.cartera').forEach(el => {
      const h = el.querySelector('.head');
      h.onclick = () => toggle(el.dataset.id);
      h.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(el.dataset.id); } };
    });
    if (searching() || MODO_VENDEDOR) current.forEach(v => expand(v.c.vc, false));
    else if (state.openId && findV(state.openId)) expand(state.openId, false);
    else state.openId = null;
  }

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
        const [ciudad, , nombre, dias, lat, lon, codigo, lp, pm] = cl;
        conUbic++; supsEnMapa.add(c.sup);
        const m = L.circleMarker([lat, lon], {
          radius: (vendedorSel === 'TODOS' ? 7 : 9) + (cl._top ? 2 : 0), color: cl._top ? '#0C1A2E' : '#fff', weight: cl._top ? 3 : 2, fillColor: colorDe(c), fillOpacity:.92
        });
        m.bindPopup(`${cl._top ? '<span class="ptop">★ Cliente top</span><br>' : ''}<b>${esc(nombre)}</b>${codigo ? ` <span class="pcode">${esc(codigo)}</span>` : ''}<br>${esc(ciudad)}<br>Vendedor: ${esc(c.vc)} · ${esc(c.vn)}<br>Días: ${esc(dias)}${lp ? `<br>LP ${esc(lp)} · PM ${esc(pm || '—')}` : ''}<br>` +
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

  // ---- Clientes top: los de los PM elegidos en config.js (PM_TOP) ----
  let topEstado = 'cargando', topFecha = null, topError = '';
  const PM_TOP_SET = new Set((typeof PM_TOP !== 'undefined' && PM_TOP.length ? PM_TOP : ['13.1','13.2','13.5','21.1','12.1','12.2']).map(x => String(x).trim().replace(',', '.')));
  function cargarTop(){
    carteras.forEach(c => c.cl.forEach(cl => { cl._top = PM_TOP_SET.has(String(cl[8] == null ? '' : cl[8]).trim().replace(',', '.')); }));
    topEstado = 'ok';
  }

  function renderTop(){
    const box = $('topView'); if (!box) return;
    if (state.seccion !== 'top') return;
    if (!state.topDay) state.topDay = TODAY_LBL || 'Lun';
    const day = state.topDay, F = window.Fotos;
    const DIA_LARGO = {Lun:'lunes', Mar:'martes', 'Mié':'miércoles', Jue:'jueves', Vie:'viernes', 'Sáb':'sábado'};
    const base = bySpv();
    const tiene = (cl, d) => daysOf(cl).includes(d);
    const porDia = {}; WEEK.forEach(d => porDia[d] = 0);
    let totCli = 0;
    base.forEach(c => c.cl.forEach(cl => { if (!cl._top) return; totCli++; WEEK.forEach(d => { if (tiene(cl, d)) porDia[d]++; }); }));
    const quien = MODO_VENDEDOR ? 'Tenés' : state.spv === 'TODOS' ? 'Todos los equipos:' : (supLabel[state.spv] || state.spv) + ':';
    const dias = `<div class="tp-dias" role="tablist" aria-label="Día">${WEEK.map(d => `<button type="button" class="tp-dia${d === day ? ' on' : ''}${d === TODAY_LBL ? ' hoy' : ''}" data-day="${d}" aria-pressed="${d === day}"><em>${d === TODAY_LBL ? 'Hoy' : d}</em><b>${porDia[d]}</b></button>`).join('')}</div>`;
    const ir = `<button type="button" class="tp-ruta" id="tpRuta">${ICON.map}Ver en la ruta del ${DIA_LARGO[day]}</button>`;
    let lista = '';
    if (MODO_VENDEDOR){
      const cls = [];
      base.forEach(c => c.cl.forEach((cl, i) => { if (cl._top && tiene(cl, day)) cls.push({c, cl, i}); }));
      lista = cls.length ? cls.map(o => {
        const cl = o.cl, gps = hasGps(cl) ? `<a class="go" href="https://www.google.com/maps/dir/?api=1&destination=${cl[4]},${cl[5]}" target="_blank" rel="noopener" aria-label="Cómo llegar">${ICON.nav}<span>Ir</span></a>` : '';
        return `<article class="tp-cli"><div class="tp-cli-top"><div class="tp-cli-n"><b>${esc(cl[2])}</b><small>${esc(cl[6])} · ${esc(cl[0])} · PM ${esc(cl[8])}</small></div>${gps}</div>${F ? F.filaCli(cl, o.c) : ''}</article>`;
      }).join('') : `<div class="tp-vacio">No tenés clientes top el ${DIA_LARGO[day]}.</div>`;
    } else {
      const filas = base.filter(c => !isVacante(c)).map(c => ({c, n: c.cl.filter(cl => cl._top && tiene(cl, day)).length, tot: c.cl.filter(cl => cl._top).length})).filter(r => r.n);
      lista = filas.length ? `<div class="tp-tabla">${filas.map(r => {
        const sem = F ? F.semanaDe(r.c.vc) : null, hechos = sem ? Math.min(sem.size, r.tot) : null;
        return `<button type="button" class="tp-fila" data-vc="${esc(r.c.vc)}">
          <span class="tv-dot" style="--c:${supColor[r.c.sup] || '#2E5BFF'}"></span>
          <span class="tp-fn"><b>${esc(r.c.vc)} <span>${esc(isVacante(r.c) ? 'Vacante' : shortName(r.c))}</span></b><small>${r.n} ${r.n === 1 ? 'cliente top' : 'clientes top'} el ${DIA_LARGO[day]}</small></span>
          ${hechos !== null ? `<span class="tp-foto${hechos >= r.tot ? ' full' : hechos ? '' : ' cero'}" title="Clientes top con foto esta semana">${F.icono}${hechos}/${r.tot}</span>` : ''}
          ${ICON.chev}</button>`;
      }).join('')}</div>` : `<div class="tp-vacio">Ningún cliente top el ${DIA_LARGO[day]} en esta selección.</div>`;
    }
    box.innerHTML = `<div class="tv-wrap">
      <div class="tv-head">
        <h2>${MODO_VENDEDOR ? 'Tus clientes top' : 'Clientes top'}</h2>
        <p>${esc(quien)} <b>${totCli}</b> ${totCli === 1 ? 'cliente top' : 'clientes top'}. Cada semana: una foto de <b>ampliación</b> y otra de <b>reposición</b> en cada uno.</p>
      </div>
      <div id="fotosTop"></div>
      <h3 class="tp-h">${MODO_VENDEDOR ? 'Tu semana' : 'Clientes top por día'}</h3>
      ${dias}
      <div class="tp-lista">${lista}</div>
      ${porDia[day] ? ir : ''}
    </div>`;
    box.querySelectorAll('.tp-dia').forEach(b => b.onclick = () => { state.topDay = b.dataset.day; renderTop(); });
    const irRuta = vc => {
      state.soloTop = true; state.days = new Set([day]); state.query = ''; $('searchInput').value = '';
      setSeccion('ruta'); setVista('lista'); refresh(true);
      if (vc) openCartera(vc);
    };
    const cta = $('tpRuta'); if (cta) cta.onclick = () => irRuta(null);
    box.querySelectorAll('.tp-fila').forEach(b => b.onclick = () => irRuta(b.dataset.vc));
    if (F){ F.enlazar(box); if ($('fotosTop')) F.enTop($('fotosTop')); }
  }

  // ---- "¿Cuál es tu cartera?" ----
  // ---- Portada: se muestra cada vez que se abre la app ----
  const SALTAR = 'ruteoTR1_saltarPortada';
  // Recarga sin volver a mostrar la portada (al cambiar de cartera o de rol)
  function entrarComo(v){
    guardar(v);
    try { sessionStorage.setItem(SALTAR, '1'); } catch(e){}
    if (PARAM_C) location.href = location.pathname; else location.reload();
  }
  const ICO_P = {
    vend: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/></svg>',
    sup: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    jef: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.6 6.5 19.5l1-6.3L3 8.9 9 8z"/></svg>',
    flecha: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
  };
  let rol = '';   // qué opción eligió en la portada
  function mostrarPortada(){
    if ($('portada')) return;
    const titulo = s => String(s).toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
    let seguir = '';
    if (MODO_VENDEDOR) seguir = `<span class="po-av">${esc(initials(MI_CARTERA))}</span><span class="po-txt"><small>Continuar como</small><b>${esc(isVacante(MI_CARTERA) ? 'Cartera ' + MI_CARTERA.vc : titulo(MI_CARTERA.vn))}</b><em>Vendedor · ${esc(MI_CARTERA.vc)}</em></span>`;
    else if (MODO_JEFATURA) seguir = `<span class="po-av j">${ICO_P.jef}</span><span class="po-txt"><small>Continuar como</small><b>Jefatura</b><em>Control de supervisores</em></span>`;
    else if (!PREGUNTAR) seguir = `<span class="po-av s">${ICO_P.sup}</span><span class="po-txt"><small>Continuar como</small><b>${MI_SUP && NOMBRE_SUP(MI_SUP) ? esc(NOMBRE_SUP(MI_SUP)) : 'Supervisor'}</b><em>Supervisor · ${MI_SUP ? esc(supLabel[MI_SUP] || MI_SUP) : 'todas las carteras'}</em></span>`;
    const box = document.createElement('div');
    box.id = 'portada'; box.className = 'portada'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Inicio');
    box.innerHTML = `
      <div class="po-fondo" aria-hidden="true">
        <svg class="po-ruta" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
          <path class="po-camino" d="M-20 690 C 80 640, 120 560, 210 560 S 360 470, 300 380 S 90 300, 150 200 S 330 120, 430 60"/>
          <path class="po-camino dos" d="M-30 300 C 60 330, 120 250, 190 240 S 300 180, 420 210"/>
          <circle class="po-punto" r="6"><animateMotion dur="9s" repeatCount="indefinite" path="M-20 690 C 80 640, 120 560, 210 560 S 360 470, 300 380 S 90 300, 150 200 S 330 120, 430 60"/></circle>
          <circle class="po-pin" cx="210" cy="560" r="5"/><circle class="po-pin" cx="300" cy="380" r="5"/><circle class="po-pin" cx="150" cy="200" r="5"/>
        </svg>
        <div class="po-brillo"></div>
      </div>
      <div class="po-cont">
        <div class="po-logo"><img src="logo-trentino.png" alt="Trentino S.A." /></div>
        <h1 class="po-tit">Ruteo <span>TR1</span></h1>
        <p class="po-fecha">${esc(FECHA_TXT.charAt(0).toUpperCase() + FECHA_TXT.slice(1))}</p>
        ${seguir ? `<button type="button" class="po-seguir" id="poSeguir">${seguir}<span class="po-ir">${ICO_P.flecha}</span></button>
        <p class="po-o">o entrá de otra forma</p>` : `<p class="po-o">¿Cómo querés entrar?</p>`}
        <div class="po-opc">
          <button type="button" class="po-btn" data-rol="vend"><span class="po-ic">${ICO_P.vend}</span><span><b>Soy vendedor</b><small>Elegí tu cartera</small></span></button>
          <button type="button" class="po-btn" data-rol="sup"><span class="po-ic">${ICO_P.sup}</span><span><b>Soy supervisor</b><small>Todas las carteras</small></span></button>
          <button type="button" class="po-btn" data-rol="jef"><span class="po-ic">${ICO_P.jef}</span><span><b>Jefatura</b><small>Control de supervisores</small></span></button>
        </div>
        <form class="po-clave" id="poClave" hidden autocomplete="off">
          <label for="poClaveIn" id="poClaveLbl">Clave</label>
          <div class="po-clave-row"><input id="poClaveIn" type="password" autocomplete="off" enterkeyhint="go" /><button type="submit">Entrar</button></div>
          <p class="po-err" id="poErr" hidden>La clave no es correcta.</p>
        </form>
        <p class="po-pie">Ruteo actualizado al ${esc(GEN_DATE)} · Trentino S.A.</p>
      </div>`;
    document.body.appendChild(box);
    document.documentElement.classList.add('cat-abierto');
    requestAnimationFrame(() => box.classList.add('in'));
    const cerrar = () => {
      box.classList.add('fuera'); document.documentElement.classList.remove('cat-abierto');
      setTimeout(() => box.remove(), 420);
    };
    const s = $('poSeguir'); if (s) s.onclick = cerrar;
    rol = '';
    box.querySelectorAll('.po-btn').forEach(b => b.onclick = () => {
      rol = b.dataset.rol;
      box.querySelectorAll('.po-btn').forEach(x => x.classList.toggle('on', x === b));
      if (rol === 'vend'){ $('poClave').hidden = true; elegirCartera(); return; }
      if (rol === 'sup'){ $('poClave').hidden = true; elegirEquipo(); return; }
      if (jefValido() || !CLAVE_J){ entrarComo('JEFATURA'); return; }
      $('poClaveLbl').textContent = 'Clave de jefatura';
      $('poErr').hidden = true; $('poClave').hidden = false; $('poClaveIn').value = ''; $('poClaveIn').focus();
    });
    $('poClave').onsubmit = e => {
      e.preventDefault();
      const clave = rol === 'jef' ? CLAVE_J : claveSup(rol);
      if (clave && $('poClaveIn').value.trim() === clave){
        try {
          if (rol === 'jef') localStorage.setItem(CLAVE_JOK, huella(clave));
          else { localStorage.setItem(CLAVE_OK + '_' + rol, huella(clave)); localStorage.setItem(CLAVE_MISUP, rol); }
        } catch(err){}
        entrarComo(rol === 'jef' ? 'JEFATURA' : 'TODAS');
      } else { $('poErr').hidden = false; $('poClaveIn').select(); box.querySelector('.po-clave').classList.remove('tiembla'); void box.offsetWidth; box.querySelector('.po-clave').classList.add('tiembla'); }
    };
  }
  // El supervisor elige su equipo (así recibe solo sus avisos)
  function elegirEquipo(){
    const box = $('portada'); if (!box) return;
    $('poClave').hidden = true;
    const opc = box.querySelector('.po-opc');
    opc.innerHTML = `<p class="po-o" style="margin-top:0">¿Cuál es tu equipo?</p>` + sups.map(s => `<button type="button" class="po-btn" data-sup="${esc(s.k)}"><span class="po-ic" style="color:${supColor[s.k]}">${ICO_P.sup}</span><span><b>${esc(s.p)}</b><small>${esc(NOMBRE_SUP(s.k) || 'Supervisor')}</small></span></button>`).join('');
    opc.querySelectorAll('[data-sup]').forEach(b => b.onclick = () => {
      const k = b.dataset.sup;
      opc.querySelectorAll('[data-sup]').forEach(x => x.classList.toggle('on', x === b));
      if (supValidoDe(k)){ try { localStorage.setItem(CLAVE_MISUP, k); } catch(e){} entrarComo('TODAS'); return; }
      // cada equipo tiene su clave
      rol = k;
      $('poClaveLbl').textContent = 'Clave de ' + (supLabel[k] || k);
      $('poErr').hidden = true; $('poClave').hidden = false; $('poClaveIn').value = ''; $('poClaveIn').focus();
      $('poClave').scrollIntoView({block: 'center', behavior: 'smooth'});
    });
  }
  // Lista para que el vendedor elija su cartera
  function elegirCartera(){
    const box = document.createElement('div');
    box.id = 'elegir'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'elTit');
    const grupos = sups.map(sp => ({sp, cs: carteras.filter(c => c.sup === sp.k && !/^AR/.test(c.vc))})).filter(g => g.cs.length);
    const item = c => `<button type="button" class="el-item" data-vc="${esc(c.vc)}" data-busca="${esc((c.vc + ' ' + c.vn + ' ' + c.vz).toLowerCase())}" style="--c:${supColor[c.sup] || '#2E5BFF'}">
        <span class="el-av">${esc(initials(c))}</span>
        <span class="el-txt"><b>${esc(isVacante(c) ? 'Cartera vacante' : c.vn)}</b><small>${esc(c.vc)} · ${esc(c.vz)}</small></span>
      </button>`;
    box.innerHTML = `
      <div class="el-head">
        <button type="button" class="lp-volver el-volver" id="elVolver" aria-label="Volver"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <h2 id="elTit">¿Cuál es tu cartera?</h2>
        <p>La app la va a recordar en este celular.</p>
        <div class="search-wrap el-search">
          <svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="elBuscar" type="text" placeholder="Tu nombre o código (ej. TR1338)" autocomplete="off" aria-label="Buscar tu cartera" enterkeyhint="search" />
        </div>
      </div>
      <div class="el-body" id="elBody">
        ${grupos.map(g => `<section class="el-grupo"><h3><span class="tv-dot" style="--c:${supColor[g.sp.k]}"></span>${esc(g.sp.p)}</h3>${g.cs.map(item).join('')}</section>`).join('')}
        <p class="el-vacio" id="elVacio" hidden>No encontramos esa cartera. Probá con tu apellido o el código.</p>
      </div>`;
    document.body.appendChild(box);
    const buscar = $('elBuscar');
    buscar.addEventListener('input', () => {
      const q = buscar.value.trim().toLowerCase(); let alguno = false;
      box.querySelectorAll('.el-grupo').forEach(g => {
        let n = 0; g.querySelectorAll('.el-item').forEach(b => { const ok = !q || b.dataset.busca.includes(q); b.hidden = !ok; if (ok) n++; });
        g.hidden = !n; if (n) alguno = true;
      });
      $('elVacio').hidden = alguno;
    });
    box.querySelectorAll('.el-item').forEach(b => b.onclick = () => entrarComo(b.dataset.vc));
    $('elVolver').onclick = () => { box.remove(); document.querySelectorAll('.po-btn').forEach(x => x.classList.remove('on')); };
  }

  // ---- Secciones: Ruta, Top y Precios (barra inferior) ----
  function setSeccion(s){
    state.seccion = s;
    document.body.dataset.seccion = s;
    document.querySelectorAll('.tabbar-btn[data-sec]').forEach(b => {
      const on = b.dataset.sec === s; b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('topView').hidden = s !== 'top';
    if ($('preciosView')) $('preciosView').hidden = s !== 'precios';
    $('visitasView').hidden = s !== 'visitas';
    if ($('ventasView')) $('ventasView').hidden = s !== 'ventas';
    if ($('jefaturaView')) $('jefaturaView').hidden = s !== 'jefatura';
    if ($('compeView')) $('compeView').hidden = s !== 'compe';
    if (s === 'compe' && window.Fotos) window.Fotos.mostrarCompe();
    if (s === 'visitas' && window.Visitas) window.Visitas.mostrar();
    if (s === 'ventas' && window.Ventas) window.Ventas.mostrar();
    if (s === 'jefatura' && window.Jefatura) window.Jefatura.mostrar();
    if (s === 'top') renderTop();
    if (s === 'precios' && window.Precios) window.Precios.mostrar();
    if (s === 'ruta' && state.vista === 'mapa') renderMap();
    window.scrollTo({top:0});
  }
  document.querySelectorAll('.tabbar-btn[data-sec]').forEach(b => b.onclick = () => { if (state.seccion !== b.dataset.sec) setSeccion(b.dataset.sec); else window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'}); });
  const navCat = $('navCatalogo');
  if (navCat) navCat.onclick = () => { if (window.abrirCatalogo) window.abrirCatalogo(); };
  window.RUTEO = {
    setSeccion, carteras, sups, supLabel, supColor, isMixto, isVacante,
    vendedor: MODO_VENDEDOR ? MI_CARTERA : null,
    modo: MODO_VENDEDOR ? 'vendedor' : MODO_JEFATURA ? 'jefatura' : 'supervisor', miSup: MI_SUP, nombreSup: NOMBRE_SUP, hoy: TODAY_LBL,
    getSpv: () => state.spv,
    refrescar: () => { if (state.seccion === 'ruta' && state.vista === 'lista'){ const y = window.scrollY; refresh(false); window.scrollTo(0, y); } else if (state.seccion === 'top') renderTop(); },
    verTopHoy: () => { state.topDay = TODAY_LBL || state.topDay; setSeccion('top'); },
    soloTopHoy: () => { state.soloTop = true; state.days = new Set([TODAY_LBL]); state.query = ''; $('searchInput').value = ''; setVista('lista'); refresh(true); },
    setSpv: k => { if (SUP_FIJO && k !== MI_SUP) return; state.spv = k; state.openId = null; syncPills(); refresh(false); renderTop(); if (window.Visitas) window.Visitas.refrescar(); if (window.Fotos && state.seccion === 'compe') window.Fotos.mostrarCompe(); window.scrollTo({top:0}); }
  };

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
    });
  }, {passive:true});
  $('toTop').onclick = () => window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'});

  $('footerNote').innerHTML = `Ruteo actualizado al ${GEN_DATE}<br>Elaborado por Mariza Cañiza, Analista Trentino`;

  buildPills();
  buildDays();
  if (TODAY_LBL) state.days.add(TODAY_LBL);   // la app abre mostrando los clientes de hoy
  const btnCambiar = $('btnCambiar');
  if (btnCambiar){ btnCambiar.textContent = 'Inicio'; btnCambiar.onclick = mostrarPortada; }
  if (!MODO_VENDEDOR) document.body.classList.add('modo-supervisor');
  if (SUP_FIJO) document.body.classList.add('sup-fijo');
  if (MI_SUP){
    const n = NOMBRE_SUP(MI_SUP);
    if (n) $('tituloApp').textContent = 'Hola, ' + n.split(' ')[0];
    $('subtituloApp').textContent = 'Supervisor · ' + (supLabel[MI_SUP] || MI_SUP);
    requestAnimationFrame(() => { const b = document.querySelector('.spv-pill.active'); if (b) b.scrollIntoView({inline: 'center', block: 'nearest'}); });
  }
  if (MODO_JEFATURA){ document.body.classList.add('modo-jefatura'); $('tituloApp').innerHTML = 'Jefatura <span>TR1</span>'; $('subtituloApp').textContent = 'Carteras, visitas y control de supervisores'; }
  if (MODO_VENDEDOR){
    document.body.classList.add('modo-vendedor');
    const nom = isVacante(MI_CARTERA) ? 'Cartera ' + MI_CARTERA.vc : MI_CARTERA.vn.split(/\s+/)[0];
    $('tituloApp').textContent = isVacante(MI_CARTERA) ? nom : 'Hola, ' + nom.charAt(0) + nom.slice(1).toLowerCase();
    $('subtituloApp').textContent = MI_CARTERA.vc + ' · ' + MI_CARTERA.vz;
    document.title = MI_CARTERA.vc + ' | Ruteo TR1';
  }
  cargarTop();
  setSeccion('ruta');
  refresh(false);
  if (window.Fotos) window.Fotos.iniciar();
  // Si la app estuvo más de 20 minutos en segundo plano, al volver se recarga (trae lo último subido)
  let oculto = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){ oculto = Date.now(); return; }
    if (oculto && Date.now() - oculto > 20 * 60000){ try { sessionStorage.setItem(SALTAR, '1'); } catch(e){} location.reload(); }
  });
  // Portada al abrir (salvo recargas internas de la app)
  let saltar = false; try { saltar = sessionStorage.getItem(SALTAR) === '1'; sessionStorage.removeItem(SALTAR); } catch(e){}
  if (PREGUNTAR || !saltar) mostrarPortada();
  const spl = $('splash'); if (spl){ spl.classList.add('fuera'); setTimeout(() => spl.remove(), 600); }
  // Potencial de cada cliente (se carga sin frenar la app)
  if (window.Potencial) window.Potencial.cargar().then(() => refresh(false));
})();
