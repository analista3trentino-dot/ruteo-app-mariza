// =====================================================================
//  CONTROL (pantalla de inicio de Jefatura)
// ---------------------------------------------------------------------
//  Pantalla corta y simple, en este orden:
//   1. Cómo va el día: 4 números grandes (ruta, anomalías, fichas TOP, app).
//   2. Para mirar hoy: frases simples, de lo más urgente a lo menos.
//   3. Tus supervisores: una fila por supervisor.
//   4. Ver en detalle: botones que abren cada tema en una hoja aparte.
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const p2 = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const deIso = s => { const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
  const largo = s => { const d = deIso(s); return d ? `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}` : ''; };
  const corto = s => { const d = deIso(s); return d ? `${DIAS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}` : ''; };
  const nom = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
  const nom2 = s => nom(s).split(' ').slice(0, 2).join(' ');
  const HOY = iso(new Date());
  const lunes = s => { const d = deIso(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
  const pct = (a, b) => b ? Math.round(a / b * 100) : null;
  const tono = q => q === null ? '' : q >= 80 ? 'good' : q >= 50 ? 'mid' : 'bad';
  const hm = seg => { seg = Math.max(0, Math.round(seg || 0)); const h = Math.floor(seg / 3600), m = Math.floor(seg % 3600 / 60); return h ? `${h} h ${p2(m)}` : `${m} min`; };
  const idFoto = u => (String(u || '').match(/\/d\/([\w-]+)/) || String(u || '').match(/[?&]id=([\w-]+)/) || [])[1] || '';
  const thumb = id => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w400`;
  const clase = t => /aus/i.test(t) ? 'aus' : /tard/i.test(t) ? 'tar' : 'fue';
  const ICO = {
    alerta: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    sup: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
    vis: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
    top: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/>',
    stock: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
    compe: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    ok: '<path d="M20 6L9 17l-5-5"/>'
  };
  const svg = (k, w) => `<svg width="${w || 20}" height="${w || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICO[k]}</svg>`;

  // ---------------- Datos ----------------
  // Junta lo que ya calculan los otros módulos en un solo objeto simple.
  function modelo(rj){
    const RU = window.RUTEO, V = window.Visitas, J = window.Jefatura, F = window.Fotos, S = window.Stock, PR = window.Precios;
    const carts = RU.carteras.filter(c => !RU.isVacante(c) && !/^AR/i.test(c.vc));
    const vcs = new Set(carts.map(c => c.vc));
    const M = {hoy: HOY, sups: [], sup: null, vis: null, anom: null, top: null, stock: null, compe: null};

    // Supervisores: último día con marcaciones
    if (rj) M.sup = {dia: rj.dia, filas: rj.filas.map(f => ({k: f.k, eq: RU.supLabel[f.k] || f.k, n: nom2(f.n), visitas: f.x.visitas, enCli: f.x.enCli, jornada: f.x.jornada, cortas: f.x.cortas, ini: f.ini, fin: f.fin, nuevo: !!f.nuevo, ok: f.cc ? f.cc.ok : 0, base: f.cc ? f.cc.base : 0}))};

    // Visitas de vendedores: último día completo
    const rv = V && V.resumenUltimoDia ? V.resumenUltimoDia(carts) : null;
    if (rv && rv.filas.length){
      const fs = rv.filas;
      M.vis = {dia: rv.dia, si: fs.reduce((t, f) => t + f.si, 0), toca: fs.reduce((t, f) => t + f.toca, 0),
        porSup: RU.sups.map(s => { const xs = fs.filter(f => f.c.sup === s.k); return {k: s.k, eq: s.p, si: xs.reduce((t, f) => t + f.si, 0), toca: xs.reduce((t, f) => t + f.toca, 0)}; }).filter(x => x.toca),
        bajos: fs.filter(f => f.toca).map(f => ({vc: f.c.vc, n: nom2(f.c.vn), eq: RU.supLabel[f.c.sup] || '', si: f.si, toca: f.toca, q: pct(f.si, f.toca)})).sort((a, b) => a.q - b.q)};
    }

    // Anomalías (esta semana y anteriores, las más nuevas primero)
    if (F && F.anomalias && F.listo && F.listo()){
      const xs = F.anomalias().filter(r => vcs.has(r.Vendedor)).sort((a, b) => String(b.Fecha).localeCompare(String(a.Fecha)));
      const est = r => window.Anomalias && window.Anomalias.estado ? window.Anomalias.estado(r) : {k: r['Justificó'] === 'Sí' ? 'si' : r['Justificó'] === 'No' ? 'no' : 'pen', txt: r['Justificó']};
      const fila = r => { const e = est(r); return {f: r.Fecha, vc: r.Vendedor, n: nom2(r['Nombre vendedor']) || r.Vendedor, eq: RU.supLabel[r.Supervisor] || r.Supervisor, tipo: r['Anomalía'], motivo: r.Motivo, com: r.Comentario || '', jus: e.k, jtxt: e.txt, vence: e.vence || '', adj: !!r['Enlace adjunto'], r}; };
      M.anom = {hoy: xs.filter(r => r.Fecha === HOY).map(fila), semana: xs.filter(r => r.Fecha >= lunes(HOY)).map(fila), pend: xs.filter(r => est(r).k === 'pen').map(fila), ultimas: xs.slice(0, 4).map(fila)};
    }

    // Fichas TOP de esta semana (las carga el supervisor en cada cliente top)
    if (F && F.fichaDe && F.fichaDe('', '') !== null){
      const tops = []; carts.forEach(c => c.cl.forEach(cl => { if (cl._top) tops.push({c, cl, ok: !!F.fichaDe(c.vc, cl[6])}); }));
      const desde = lunes(HOY), g = (F.gestion ? F.gestion() : []).filter(r => r.Fecha >= desde && vcs.has(r.Vendedor));
      const rep = g.filter(r => r['Acción'] === 'Reposición'), falta = rep.filter(r => /ubicaci[oó]n no|participaci[oó]n no/i.test(r.Respuesta) || +r['Caras faltan'] > 0);
      const fotos = []; const vistos = new Set();
      g.forEach(r => { const id = idFoto(r['Enlace foto']); if (id && !vistos.has(id)){ vistos.add(id); fotos.push({id, cli: r.Cliente, acc: r['Acción'], eq: RU.supLabel[r.Supervisor] || r.Supervisor, url: r['Enlace foto']}); } });
      M.top = {total: tops.length, hechas: tops.filter(x => x.ok).length,
        porSup: RU.sups.map(s => { const xs = tops.filter(x => x.c.sup === s.k); return {k: s.k, eq: s.p, n: xs.length, ok: xs.filter(x => x.ok).length}; }).filter(x => x.n),
        repoCli: new Set(falta.map(r => r['Código'])).size, repoCaras: falta.reduce((t, r) => t + (+r['Caras faltan'] || 0), 0),
        ampOf: g.filter(r => r['Acción'] === 'Ampliación' && /^se ofreci/i.test(r.Respuesta)).length,
        ingOk: g.filter(r => r['Acción'] === 'Ingreso' && /^acept/i.test(r.Respuesta)).length,
        fotos: fotos.slice(0, 8)};
    }

    // Stock (productos de la lista de precios)
    if (S && S.listo && S.de && PR && PR.codigos && PR.codigos()){
      const cods = [...PR.codigos()];
      const nombre = c => (PR && PR.desc && PR.desc(c)) || c;
      const sin = [], bajo = [];
      cods.forEach(c => { const q = S.de(c); if (q === null || q === undefined) return; if (q <= 0) sin.push(nombre(c)); else if (q < S.minimo) bajo.push(nombre(c)); });
      M.stock = {fecha: S.fecha ? iso(S.fecha) : '', sin, bajo, minimo: S.minimo};
    }
    if (F && F.compeSemana){ const xs = F.compeSemana().filter(r => vcs.has(r.Vendedor)); M.compe = {n: xs.length, ult: xs.slice(0, 2).map(r => ({marca: r['Empresa/Marca'], prod: r.Producto, que: r['Qué vio'], n: nom2(r['Nombre vendedor'])}))}; }
    return M;
  }

  // ---------------- Lo que hay que mirar (frases simples) ----------------
  function pendientes(M){
    const out = [], lista = xs => xs.join(' · ');
    if (M.anom && M.anom.pend.length){ const xs = M.anom.pend, a = xs[0];
      out.push({t: 'bad', ic: '⏰', n: xs.length, b: xs.length === 1 ? `${a.n} tiene una ${String(a.tipo).toLowerCase()} sin justificar` : `${xs.length} anomalías sin justificar`, s: 'Vence hoy a las 17:00' + (xs.length > 1 ? ' · ' + lista(xs.slice(0, 3).map(x => x.n)) : ''), go: 'anom'}); }
    const hoyNP = M.anom ? M.anom.hoy.filter(a => a.jus !== 'pen') : [];
    if (hoyNP.length){ const a = hoyNP[0];
      out.push({t: 'mid', ic: '⚠️', n: hoyNP.length, b: hoyNP.length === 1 ? `${a.n}: ${String(a.tipo).toLowerCase()} hoy` : `${hoyNP.length} anomalías informadas hoy`, s: hoyNP.length === 1 ? (a.motivo || '') + (a.jus === 'si' ? ' · justificó' : a.jus === 'no' || a.jus === 'venc' ? ' · no justificó' : '') : lista(hoyNP.slice(0, 3).map(x => x.n + ' (' + String(x.tipo).toLowerCase() + ')')), go: 'anom'}); }
    if (M.sup){
      const sin = M.sup.filas.filter(f => !f.visitas && !f.nuevo);
      if (sin.length) out.push({t: 'bad', ic: '📍', n: sin.length, b: sin.length === 1 ? `${sin[0].n} no marcó visitas el ${corto(M.sup.dia)}` : `${sin.length} supervisores no marcaron visitas el ${corto(M.sup.dia)}`, s: lista(sin.map(f => f.n)), go: 'sup:' + sin[0].k});
      M.sup.filas.filter(f => f.base >= 3 && f.ok / f.base < .4).forEach(f => out.push({t: 'mid', ic: '🤝', n: `${f.ok}/${f.base}`, b: `${f.n} acompañó a sus vendedores en ${f.ok} de ${f.base} visitas`, s: `${f.eq} · ${corto(M.sup.dia)}`, go: 'sup:' + f.k}));
    }
    if (M.vis){ const b = M.vis.bajos.filter(x => x.q < 50); if (b.length) out.push({t: 'mid', ic: '🚶', n: b.length, b: b.length === 1 ? `${b[0].n} visitó solo el ${b[0].q}% de su ruta` : `${b.length} vendedores visitaron menos de la mitad de su ruta`, s: corto(M.vis.dia) + ' · ' + lista(b.slice(0, 3).map(x => `${x.n} ${x.q}%`)), go: 'vis'}); }
    if (M.top && M.top.total){ const falta = M.top.total - M.top.hechas, dia = new Date().getDay(); if (falta && (dia >= 4 || dia === 0 || M.top.hechas / M.top.total < .2 && dia >= 3)) out.push({t: dia >= 5 ? 'bad' : 'mid', ic: '⭐', n: falta, b: `Faltan ${falta} fichas TOP esta semana`, s: lista(M.top.porSup.filter(x => x.ok < x.n).slice(0, 3).map(x => `${x.eq} ${x.ok}/${x.n}`)), go: 'top'}); }
    return out;
  }
  // una fila de "Para mirar" (la usan Control y la campanita)
  const itemHTML = x => `<button type="button" class="cx-it ${x.t}" data-go="${esc(x.go)}"><span class="cx-it-ic">${x.ic || '•'}</span><span class="cx-it-tx"><b>${esc(x.b)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</span><span class="cx-it-f">›</span></button>`;

  // ---------------- Pantalla ----------------
  let M = null, cargando = null, error = '', ING = null;
  const saludo = () => { const h = new Date().getHours(); return h < 12 ? 'Buen día' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
  const ini2 = n => String(n || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colorSup = k => (window.RUTEO && window.RUTEO.supColor && window.RUTEO.supColor[k]) || '#2E5BFF';
  function pintar(){
    const box = $('controlView'); if (!box) return;
    const cab = `<div class="cx-cab"><div><p class="cx-hola">${saludo()} 👋</p><h2>¿Cómo va el equipo?</h2><p class="cx-fecha">${esc(largo(HOY).replace(/^./, c => c.toUpperCase()))}</p></div><button type="button" class="cx-act" data-ct-act aria-label="Actualizar">↻</button></div>`;
    if (!M || (!M.sup && !M.vis && !M.anom && !M.top)){
      box.innerHTML = `<div class="ct cx">${cab}${error ? `<div class="cx-card"><p class="ct-vacio">No se pudo cargar todo: ${esc(error)}</p></div>` : '<div class="cx-hero cx-esq"><i></i><i></i></div><div class="cx-card cx-esq"><i></i><i></i><i></i></div>'}</div>`;
      const b = box.querySelector('[data-ct-act]'); if (b) b.onclick = () => cargar(true);
      return;
    }
    const P = pendientes(M), A = M.anom, S = M.sup, V = M.vis, T = M.top;
    const malos = P.filter(x => x.t === 'bad').length;
    const qv = V ? pct(V.si, V.toca) : null, qt = T && T.total ? pct(T.hechas, T.total) : null;
    const tile = (go, ic, valor, de, txt, cls) => `<button type="button" class="cx-k ${cls || ''}" data-go="${go}"><span class="cx-k-ic">${ic}</span><b>${valor}${de ? `<small>${de}</small>` : ''}</b><span>${txt}</span></button>`;
    const nAnom = A ? A.hoy.length : null;
    const hero = `<section class="cx-hero ${P.length ? (malos ? 'bad' : 'mid') : 'ok'}">
      <div class="cx-estado"><span class="cx-luz"></span><div><b>${P.length ? (P.length === 1 ? 'Hay 1 cosa para mirar' : `Hay ${P.length} cosas para mirar`) : cargando ? 'Revisando…' : 'Todo en orden'}</b><small>${P.length ? 'Abajo te las dejamos en orden, de la más urgente a la menos.' : cargando ? 'Buscando anomalías, rutas y fichas…' : 'Los supervisores marcaron y no hay anomalías pendientes.'}</small></div></div>
      <div class="cx-ks">
        ${tile('vis', '🚶', qv === null ? '—' : qv + '%', '', V ? 'ruta visitada · ' + esc(corto(V.dia)) : 'ruta visitada', qv === null ? '' : tono(qv))}
        ${tile('anom', '⚠️', nAnom === null ? '—' : nAnom, '', nAnom === 1 ? 'anomalía hoy' : 'anomalías hoy', nAnom ? 'mid' : 'good')}
        ${tile('top', '⭐', T && T.total ? T.hechas : '—', T && T.total ? ' de ' + T.total : '', 'fichas TOP semana', qt === null ? '' : tono(qt))}
        ${tile('ing', '📲', ING ? ING.hoy : '—', ING ? ' de ' + ING.tot : '', 'entraron a la app hoy', ING ? tono(pct(ING.hoy, ING.tot)) : '')}
      </div>
    </section>`;
    const aviso = ING && ING.viejo ? `<button type="button" class="cx-script" data-go="script"><span>⚙️</span><span><b>Falta publicar el script de Google</b><small>Sin eso no se ven los ingresos ni las fotos del PowerPoint. Tocá para ver cómo.</small></span></button>` : '';
    const mirar = P.length ? `<section class="cx-sec"><h3 class="cx-h">Para mirar hoy</h3><div class="cx-its">${P.map(itemHTML).join('')}</div></section>` : '';
    const porSup = {}; if (V) V.porSup.forEach(x => porSup[x.k] = pct(x.si, x.toca));
    const sups = S ? `<section class="cx-sec"><div class="cx-hrow"><h3 class="cx-h">Tus supervisores</h3><span class="cx-hsub">${esc(corto(S.dia))} · tocá uno para ver su día</span></div>
      <div class="cx-sups">${S.filas.slice().sort((a, b) => (porSup[b.k] || 0) - (porSup[a.k] || 0)).map(f => {
        const q = pct(f.ok, f.base), r = porSup[f.k];
        return `<button type="button" class="cx-sp ${f.visitas ? '' : f.nuevo ? 'nuevo' : 'sin'}" data-go="sup:${esc(f.k)}" style="--sc:${esc(colorSup(f.k))}">
          <span class="cx-av">${esc(ini2(f.n))}</span>
          <span class="cx-sp-tx"><b>${esc(f.n)}</b><small>${esc(f.eq)} · ${f.visitas ? `${esc(f.ini)} a ${esc(f.fin)}` : f.nuevo ? 'nuevo' : '<em>no marcó</em>'}</small>
            ${f.visitas ? `<span class="cx-chips"><span>📍 ${f.visitas} visitas</span><span>⏱ ${hm(f.enCli)} en clientes</span><span class="${tono(q)}">🤝 ${q === null ? '—' : q + '%'} con vendedor</span></span>` : ''}</span>
          <span class="cx-ring ${r == null ? '' : tono(r)}" style="--q:${r == null ? 0 : r}"><b>${r == null ? '—' : r + '%'}</b><small>ruta</small></span>
        </button>`; }).join('')}</div>
      <p class="cx-ley"><b>Ruta</b>: clientes que visitaron sus vendedores · <b>🤝 Con vendedor</b>: visitas del supervisor junto a su vendedor</p>
    </section>` : '';
    const nRec = window.Recibidos && window.Recibidos.cuantosHoy ? window.Recibidos.cuantosHoy() : null;
    const boton = (go, ic, t, sub, cls) => `<button type="button" class="cx-b ${cls}" data-go="${go}"><span class="cx-b-ic">${ic}</span><b>${t}</b><small>${sub}</small></button>`;
    const herr = `<section class="cx-sec"><h3 class="cx-h">Ver en detalle</h3><div class="cx-bs">
      ${boton('rec', '📥', 'Recibido', nRec ? nRec + ' hoy' : 'Fichas, fotos y anomalías', 'az')}
      ${boton('anom', '⚠️', 'Anomalías', A ? `${A.semana.length} esta semana` : 'Faltas y llegadas tarde', 'na')}
      ${boton('vis', '🚶', 'Visitas', qv === null ? 'Ruta de los vendedores' : `${qv}% de la ruta`, 've')}
      ${boton('top', '⭐', 'Fichas TOP', T && T.total ? `${T.hechas} de ${T.total} esta semana` : 'Clientes top', 'am')}
      ${boton('ing', '📲', 'Uso de la app', ING ? `${ING.hoy} de ${ING.tot} hoy` : 'Quién entró y quién no', 'vi')}
      ${boton('exp', '📤', 'Exportar', 'PowerPoint y Excel', 'ro')}
      ${boton('sups', '🧭', 'Recorridos', 'Mapa de supervisores', 'ce')}
      ${boton('mas', '📦', 'Más', 'Stock, competencia, encuesta', 'gr')}
    </div></section>`;
    box.innerHTML = `<div class="ct cx">${cab}${hero}${aviso}<div id="cxAyer" class="rz-ayer"></div>${mirar}${sups}${herr}</div>`;
    if (window.Resumen && $('cxAyer')) window.Resumen.ayer($('cxAyer'), 'jefatura');
    box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => ir(b.dataset.go));
    box.querySelector('[data-ct-act]').onclick = () => { if (window.Archivos && window.Archivos.olvidar) window.Archivos.olvidar(); if (window.Encuesta && window.Encuesta.cargar) window.Encuesta.cargar(true).catch(() => {}); cargar(true); };
    if (window.Avisos && window.Avisos.refrescar) window.Avisos.refrescar();
  }

  // ---------------- Hojas de detalle (se abren encima, el "atrás" las cierra) ----------------
  function hoja(titulo, ic, llenar){
    let h = $('cxHoja');
    if (!h){ h = document.createElement('div'); h.id = 'cxHoja'; h.className = 'cx-hoja'; document.body.appendChild(h); }
    h.innerHTML = `<div class="cx-hoja-cab"><button type="button" class="cx-hoja-x" aria-label="Volver">‹</button><span class="cx-hoja-ic">${ic}</span><b>${esc(titulo)}</b></div><div class="cx-hoja-cu"></div>`;
    h.classList.add('abierta'); document.documentElement.classList.add('cat-abierto');
    const cerrarH = () => { h.classList.remove('abierta'); document.documentElement.classList.remove('cat-abierto'); };
    const RU = window.RUTEO;
    if (RU && RU.apilar){ RU.apilar('', cerrarH, true, 'cx-hoja'); h.querySelector('.cx-hoja-x').onclick = () => RU.volver(); }
    else h.querySelector('.cx-hoja-x').onclick = cerrarH;
    const cu = h.querySelector('.cx-hoja-cu'); cu.scrollTop = 0;
    llenar(cu);
    cu.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const go = b.dataset.go; cerrarHoja(); setTimeout(() => ir(go), 60); });
  }
  function cerrarHoja(){ const h = $('cxHoja'); if (h && h.classList.contains('abierta')){ const RU = window.RUTEO; if (RU && RU.tope && RU.tope() === 'cx-hoja') RU.volver(); else { h.classList.remove('abierta'); document.documentElement.classList.remove('cat-abierto'); } } }
  const barras = (xs, f) => `<div class="ct-barras">${xs.map(x => { const [t, q, v] = f(x); return `<div><span>${esc(t)}</span><i class="ct-b"><i class="${tono(q)}" style="width:${q || 0}%"></i></i><em>${v}</em></div>`; }).join('')}</div>`;
  const cardVis = V => { const qv = pct(V.si, V.toca); return `<section class="ct-card">
      <div class="cx-big"><b class="${tono(qv)}">${qv}%</b><span>de la ruta visitada el ${esc(largo(V.dia))}<br><small>${V.si} de ${V.toca} clientes</small></span></div>
      <div class="ct-sub">Por supervisor</div>${barras(V.porSup, x => { const q = pct(x.si, x.toca); return [x.eq, q, q + '%']; })}
      ${V.bajos.length ? `<div class="ct-sub">Los más bajos (tocá para ver)</div><div class="ct-lista">${V.bajos.slice(0, 6).map(x => `<button type="button" class="ct-vb" data-go="vend:${esc(x.vc)}"><span><b>${esc(x.n)}</b><small>${esc(x.vc)} · ${esc(x.eq)} · ${x.si} de ${x.toca}</small></span><em class="${tono(x.q)}">${x.q}%</em></button>`).join('')}</div>` : ''}
      <button type="button" class="ct-irrec" data-go="visitas">Ver todos los vendedores ›</button></section>`; };
  const cardTop = T => `<section class="ct-card">
      <div class="cx-big"><b class="${tono(pct(T.hechas, T.total))}">${T.hechas}<small> de ${T.total}</small></b><span>clientes TOP con ficha esta semana</span></div>
      <div class="ct-tri top"><span><b>${T.repoCli}</b>clientes con faltantes${T.repoCaras ? ` (${T.repoCaras} caras)` : ''}</span><span><b>${T.ampOf}</b>marcas ofrecidas</span><span><b>${T.ingOk}</b>ingresos aceptados</span></div>
      <div class="ct-sub">Avance por supervisor</div>${barras(T.porSup, x => [x.eq, pct(x.ok, x.n), x.ok + '/' + x.n])}
      <div class="ct-explica">
        <div><b>Reposición</b><span>¿Nuestros productos están bien ubicados? ¿Faltan caras?</span></div>
        <div><b>Ampliación</b><span>¿Se le ofreció una marca foco que todavía no compra?</span></div>
        <div><b>Ingreso</b><span>¿Aceptó ingresar una marca nueva?</span></div>
      </div>
      <button type="button" class="ct-irrec" data-go="rec">📥 Ver las fichas recibidas, con fotos ›</button></section>`;
  const cardAnom = A => { const c = {aus: 0, tar: 0, fue: 0}; A.semana.forEach(a => c[clase(a.tipo)]++); return `<section class="ct-card">
      <div class="ct-tri"><span class="aus"><b>${c.aus}</b>ausencias</span><span class="tar"><b>${c.tar}</b>llegadas tarde</span><span class="fue"><b>${c.fue}</b>fuera de ruta</span></div>
      <p class="cx-nota">Esta semana. Las pendientes vencen a las 17:00 del mismo día.</p>
      ${A.ultimas.length ? `<div class="an-lista">${A.ultimas.map(a => window.Anomalias && window.Anomalias.fila ? window.Anomalias.fila(a.r) : '').join('')}</div>` : '<p class="ct-vacio">Todavía no hay anomalías. Las cargan los supervisores desde la pestaña Visitas.</p>'}
      <button type="button" class="ct-irrec" data-go="anomtodas">Ver todas las anomalías ›</button></section>`; };
  const SCRIPT = `<section class="ct-card cx-pasos"><p>Pasá esto una sola vez y queda andando:</p><ol>
      <li>Abrí <b>script.google.com</b> y entrá al proyecto de fotos de Ruteo.</li>
      <li>Borrá todo y pegá el contenido de <b>Fotos_Ruteo_TR1.txt</b>. Guardá (💾).</li>
      <li>Arriba a la derecha: <b>Implementar → Administrar implementaciones</b>.</li>
      <li>Tocá el lápiz ✏️, en <b>Versión</b> elegí <b>Nueva versión</b> y tocá <b>Implementar</b>.</li></ol>
      <p class="cx-nota">Al publicarlo, los ingresos que quedaron en la pestaña Fotos pasan solos a la pestaña <b>Ingresos</b>.</p></section>`;
  function ir(go){
    const RU = window.RUTEO, [k, v] = String(go).split(':');
    if (k === 'anom') return M && M.anom ? hoja('Anomalías', '⚠️', cu => { cu.innerHTML = cardAnom(M.anom); cu.querySelectorAll('[data-an]').forEach(b => b.onclick = () => { const r = (window.Fotos.anomalias() || []).find(x => x.ID === b.dataset.an); if (r && window.Anomalias.ver) window.Anomalias.ver(r); }); }) : window.Anomalias && window.Anomalias.historial();
    if (k === 'anomtodas' && window.Anomalias) return window.Anomalias.historial();
    if (k === 'sup' && window.Jefatura) return window.Jefatura.abrir(v, M && M.sup ? M.sup.dia : '');
    if (k === 'sups') return RU.setSeccion('jefatura');
    if (k === 'vend' && window.Visitas && window.Visitas.abrirVendedor) return window.Visitas.abrirVendedor(v, M && M.vis ? M.vis.dia : '');
    if (k === 'vis') return M && M.vis ? hoja('Visitas de vendedores', '🚶', cu => { cu.innerHTML = cardVis(M.vis); }) : RU.setSeccion('visitas');
    if (k === 'visitas') return RU.setSeccion('visitas');
    if (k === 'top') return M && M.top && M.top.total ? hoja('Fichas TOP', '⭐', cu => { cu.innerHTML = cardTop(M.top); }) : RU.setSeccion('top');
    if (k === 'rec') return hoja('Recibido de los supervisores', '📥', cu => { if (window.Recibidos) window.Recibidos.en(cu); });
    if (k === 'ing') return hoja('Uso de la app', '📲', cu => { if (window.Ingresos) window.Ingresos.tarjeta(cu); });
    if (k === 'exp') return hoja('Exportar', '📤', cu => { if (window.Exportar) window.Exportar.tarjeta(cu); });
    if (k === 'script') return hoja('Publicar el script de Google', '⚙️', cu => { cu.innerHTML = SCRIPT; });
    if (k === 'mas') return hoja('Stock, competencia y encuesta', '📦', cu => {
      const ST = M && M.stock;
      cu.innerHTML = `${ST ? `<section class="ct-card"><h3 class="cx-h">📦 Stock${ST.fecha ? ' · ' + esc(corto(ST.fecha)) : ''}</h3><p><b class="bad">${ST.sin.length}</b> productos de la lista sin stock</p>${ST.sin.length ? `<small>${esc(ST.sin.slice(0, 8).join(' · '))}${ST.sin.length > 8 ? ' …' : ''}</small>` : ''}</section>` : ''}
        ${M && M.compe ? `<button type="button" class="ct-card ct-m" data-go="compe"><div><h3 class="cx-h">💬 Competencia</h3><p><b>${M.compe.n}</b> ${M.compe.n === 1 ? 'comentario' : 'comentarios'} de vendedores esta semana ›</p></div></button>` : ''}<div id="ctEnc"></div>`;
      if (window.Encuesta && $('ctEnc')) window.Encuesta.tarjeta($('ctEnc'));
    });
    if (k === 'compe') return RU.setSeccion('compe');
  }
  // Cada dato se pinta apenas llega (no espera a que esté todo)
  let RJ = null;
  function rehacer(){ try { M = modelo(RJ); error = ''; } catch(e){ error = e.message || String(e); } if (!document.getElementById('controlView').hidden) pintar(); else if (window.Avisos) window.Avisos.refrescar(); }
  function cargar(forzar){
    if (cargando && !forzar) return cargando;
    if (forzar){ M = null; RJ = null; pintar(); }
    const V = window.Visitas, J = window.Jefatura, F = window.Fotos, S = window.Stock, PR = window.Precios, ok = p => Promise.resolve(p).catch(() => null).then(rehacer);
    cargando = true; rehacer();
    cargando = Promise.all([
      ok(F && F.cargar ? F.cargar(!!forzar) : null),
      ok(Promise.resolve(V && V.asegurar ? V.asegurar() : null).catch(() => null).then(() => J && J.resumenUltimo ? J.resumenUltimo() : null).then(r => { RJ = r; })),
      ok(Promise.all([S && S.cargar ? S.cargar() : null, PR && PR.asegurar ? PR.asegurar() : null])),
      ok(window.Ingresos && window.Ingresos.resumen ? window.Ingresos.resumen().then(r => { ING = r; }) : null)
    ]).then(() => { cargando = null; rehacer(); });
    return cargando;
  }
  window.Control = {
    mostrar(){ if (!M) cargar(); pintar(); },
    cargar,
    pendientes: () => M ? pendientes(M).length : 0,
    items: () => M ? pendientes(M) : [],
    itemHTML,
    cargandoAhora: () => !!cargando,
    ir: go => ir(go),
    _modelo: () => M, _pintarCon: m => { M = m; pintar(); }   // para la prueba piloto
  };
})();
