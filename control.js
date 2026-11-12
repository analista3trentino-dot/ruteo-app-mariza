// =====================================================================
//  CONTROL (pantalla de inicio de Jefatura)
// ---------------------------------------------------------------------
//  Todo lo importante en una sola pantalla, en este orden:
//   1. Para revisar: lo que necesita tu atención hoy.
//   2. Anomalías de vendedores (las cargan los supervisores).
//   3. Supervisores: su último día en la calle.
//   4. Visitas de los vendedores.
//   5. Fichas TOP: lo que revisan los supervisores en los clientes top.
//   6. Stock, competencia y encuesta.
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

  // ---------------- Lo que hay que revisar ----------------
  function pendientes(M){
    const out = [];
    if (M.anom && M.anom.pend.length) out.push({t: 'bad', n: M.anom.pend.length, b: (M.anom.pend.length === 1 ? 'anomalía pendiente' : 'anomalías pendientes') + ' · vence' + (M.anom.pend.length === 1 ? '' : 'n') + ' hoy a las 17:00', s: M.anom.pend.slice(0, 3).map(a => `${a.n} · ${a.tipo}`).join(' · '), go: 'anom'});
    const hoyNP = M.anom ? M.anom.hoy.filter(a => a.jus !== 'pen') : [];
    if (hoyNP.length) out.push({t: 'mid', n: hoyNP.length, b: hoyNP.length === 1 ? 'anomalía informada hoy' : 'anomalías informadas hoy', s: hoyNP.slice(0, 3).map(a => `${a.n} · ${a.tipo}`).join(' · '), go: 'anom'});
    if (M.sup){
      const sin = M.sup.filas.filter(f => !f.visitas && !f.nuevo);   // un supervisor nuevo no cuenta como "no marcó"
      if (sin.length) out.push({t: 'bad', n: sin.length, b: (sin.length === 1 ? 'supervisor no marcó' : 'supervisores no marcaron') + ' visitas el ' + corto(M.sup.dia), s: sin.map(f => `${f.eq} · ${f.n}`).join(' · '), go: 'sup:' + sin[0].k});
      M.sup.filas.filter(f => f.base >= 3 && f.ok / f.base < .4).forEach(f => out.push({t: 'mid', n: `${f.ok}/${f.base}`, b: `${f.n}: pocas visitas junto al vendedor`, s: `${f.eq} · ${corto(M.sup.dia)} · ${f.ok} de ${f.base} visitas coinciden`, go: 'sup:' + f.k}));
    }
    if (M.vis){ const b = M.vis.bajos.filter(x => x.q < 50); if (b.length) out.push({t: 'mid', n: b.length, b: (b.length === 1 ? 'vendedor visitó' : 'vendedores visitaron') + ' menos de la mitad de su ruta el ' + corto(M.vis.dia), s: b.slice(0, 3).map(x => `${x.n} ${x.q}%`).join(' · '), go: 'vis'}); }
    if (M.top && M.top.total){ const falta = M.top.total - M.top.hechas, dia = new Date().getDay(); if (falta && (dia >= 4 || dia === 0 || M.top.hechas / M.top.total < .2 && dia >= 3)) out.push({t: dia >= 5 ? 'bad' : 'mid', n: falta, b: 'clientes TOP sin ficha esta semana', s: M.top.porSup.filter(x => x.ok < x.n).slice(0, 3).map(x => `${x.eq} ${x.ok}/${x.n}`).join(' · '), go: 'top'}); }
    return out;
  }

  // ---------------- Pantalla ----------------
  let M = null, cargando = null, error = '';
  function pintar(){
    const box = $('controlView'); if (!box) return;
    if (!M || (!M.sup && !M.vis && !M.anom && !M.top)){
      box.innerHTML = `<div class="ct"><div class="ct-cab"><div><h2>Control</h2><p>${esc(largo(HOY).replace(/^./, c => c.toUpperCase()))}</p></div></div>
        ${error ? `<div class="ct-card"><p class="ct-vacio">No se pudo cargar todo: ${esc(error)}</p></div>` : [1, 2, 3].map(() => '<div class="ct-card ct-esq"><i></i><i></i><i></i></div>').join('')}</div>`;
      return;
    }
    const esq = t => cargando ? `<div class="ct-card ct-esq"><b>${t}</b><i></i><i></i><small>Cargando…</small></div>` : '';
    const P = pendientes(M), A = M.anom, S = M.sup, V = M.vis, T = M.top, ST = M.stock;
    const head = (ic, cls, t, sub, ver) => `<div class="ct-h"><span class="ct-ic ${cls}">${svg(ic)}</span><div><h3>${t}</h3>${sub ? `<p>${sub}</p>` : ''}</div>${ver ? `<button type="button" class="ct-ver" data-go="${ver[0]}">${ver[1]} ›</button>` : ''}</div>`;

    // 1. Para revisar
    const rev = `<section class="ct-rev ${P.length ? '' : 'ok'}">
      <h3>${P.length ? 'Para revisar' : cargando ? 'Revisando…' : 'Todo en orden'}</h3>
      ${!P.length && cargando ? '<p class="ct-okp">Buscando anomalías, supervisores sin marcar y rutas bajas…</p>' : P.length ? P.map(x => `<button type="button" class="ct-r ${x.t}" data-go="${esc(x.go)}"><span class="ct-r-n">${esc(x.n)}</span><span class="ct-r-t"><b>${esc(x.b)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</span><span class="ct-r-f">›</span></button>`).join('')
        : `<p class="ct-okp">${svg('ok', 18)} No hay anomalías pendientes, todos los supervisores marcaron y las rutas van bien.</p>`}
    </section>`;

    // 2. Anomalías
    const cnt = xs => ({aus: xs.filter(a => clase(a.tipo) === 'aus').length, tar: xs.filter(a => clase(a.tipo) === 'tar').length, fue: xs.filter(a => clase(a.tipo) === 'fue').length});

    const anom = A ? (() => { const c = cnt(A.semana); return `<section class="ct-card" id="ctAnom">
      ${head('alerta', 'aus', 'Anomalías de vendedores', A.semana.length ? `<b>${A.semana.length}</b> esta semana · ${A.hoy.length} hoy` : 'Ninguna esta semana', ['anom', 'Ver todas'])}
      <div class="ct-tri"><span class="aus"><b>${c.aus}</b>ausencias</span><span class="tar"><b>${c.tar}</b>llegadas tarde</span><span class="fue"><b>${c.fue}</b>fuera de ruta</span></div>
      ${A.ultimas.length ? `<div class="an-lista">${A.ultimas.map(a => window.Anomalias && window.Anomalias.fila ? window.Anomalias.fila(a.r) : '').join('')}</div>`
        : '<p class="ct-vacio">Todavía no hay anomalías. Las cargan los supervisores desde la pestaña Visitas.</p>'}
    </section>`; })() : '';

    // 3. Supervisores: una tarjeta grande por supervisor
    const ini2 = n => String(n || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const colorSup = k => (window.RUTEO && window.RUTEO.supColor && window.RUTEO.supColor[k]) || '#2E5BFF';
    const sup = S ? `<section class="ct-card ct-sups">
      ${head('sup', 'sup', 'Supervisores en la calle', `Último día con marcaciones: <b>${esc(largo(S.dia))}</b> · tocá uno para ver su recorrido`, ['sups', 'Ver detalle'])}
      <div class="sp2-grid">
        ${S.filas.slice().sort((a, b) => (b.visitas ? 2 : b.nuevo ? 0 : 1) - (a.visitas ? 2 : a.nuevo ? 0 : 1) || b.enCli - a.enCli).map(f => {
          const q = pct(f.ok, f.base), uso = f.jornada ? Math.min(100, Math.round(f.enCli / f.jornada * 100)) : null;
          const estado = f.visitas ? `<span class="sp2-est ok">${esc(f.ini)} a ${esc(f.fin)}</span>` : f.nuevo ? '<span class="sp2-est nuevo">Nuevo</span>' : '<span class="sp2-est bad">No marcó</span>';
          return `<button type="button" class="sp2 ${f.visitas ? '' : f.nuevo ? 'es-nuevo' : 'sin'}" data-go="sup:${esc(f.k)}" style="--sc:${esc(colorSup(f.k))}">
            <span class="sp2-top"><span class="sp2-av">${esc(ini2(f.n))}</span><span class="sp2-nom"><b>${esc(f.n)}</b><small>${esc(f.eq)}</small></span></span>
            <span class="sp2-linea">${estado}${f.visitas && f.jornada ? `<small>jornada de ${hm(f.jornada)}</small>` : ''}</span>
            ${f.visitas ? `<span class="sp2-kpis">
                <span><b>${f.visitas}</b><small>visitas</small></span>
                <span><b>${hm(f.enCli)}</b><small>en clientes</small></span>
                <span><b class="ct-q ${tono(q)}">${q === null ? '—' : q + '%'}</b><small>con vendedor</small></span>
              </span>
              ${uso !== null ? `<span class="sp2-uso"><i class="ct-b"><i class="${uso >= 60 ? 'good' : uso >= 40 ? 'mid' : 'bad'}" style="width:${uso}%"></i></i><small><b>${uso}%</b> de la jornada dentro de clientes</small></span>` : ''}`
            : `<span class="sp2-vacio">${f.nuevo ? 'Todavía no tiene marcaciones. Va a aparecer cuando empiece a marcar.' : 'No hay marcaciones de este supervisor ese día.'}</span>`}
            <span class="sp2-ver">Ver recorrido ›</span>
          </button>`; }).join('')}
      </div>
      <p class="ct-nota"><b>Con vendedor</b>: de las visitas del supervisor, qué parte fue a clientes que el vendedor también visitó ese día (acompañamiento).</p>
    </section>` : '';

    // 4. Visitas de vendedores
    const qv = V ? pct(V.si, V.toca) : null;
    const vis = V ? `<section class="ct-card">
      ${head('vis', 'vis', 'Visitas de vendedores', `${esc(largo(V.dia).replace(/^./, c => c.toUpperCase()))} · <b>${V.si}</b> de ${V.toca} clientes de la ruta`, ['vis', 'Ver vendedores'])}
      <div class="ct-big"><b class="${tono(qv)}">${qv}%</b><span>de la ruta visitada</span></div>
      <div class="ct-barras">${V.porSup.map(x => { const q = pct(x.si, x.toca); return `<div><span>${esc(x.eq)}</span><i class="ct-b"><i class="${tono(q)}" style="width:${q}%"></i></i><em>${q}%</em></div>`; }).join('')}</div>
      ${V.bajos.length ? `<div class="ct-sub">Más bajos</div><div class="ct-lista">${V.bajos.slice(0, 3).map(x => `<button type="button" class="ct-vb" data-go="vend:${esc(x.vc)}"><span><b>${esc(x.n)}</b><small>${esc(x.vc)} · ${esc(x.eq)} · ${x.si} de ${x.toca}</small></span><em class="${tono(x.q)}">${x.q}%</em></button>`).join('')}</div>` : ''}
    </section>` : '';

    // 5. Fichas TOP
    const qt = T ? pct(T.hechas, T.total) : null;
    const top = T && T.total ? `<section class="ct-card">
      ${head('top', 'top', 'Fichas TOP de esta semana', `<b>${T.hechas}</b> de ${T.total} clientes top revisados por los supervisores`, ['top', 'Ver clientes'])}
      <div class="ct-explica">
        <div><b>Reposición</b><span>¿Nuestros productos están bien ubicados en la góndola? ¿Faltan caras?</span></div>
        <div><b>Ampliación</b><span>¿Se le ofreció una marca foco que el cliente todavía no compra?</span></div>
        <div><b>Ingreso</b><span>¿El cliente aceptó ingresar una marca nueva?</span></div>
      </div>
      <div class="ct-tri top"><span><b>${T.repoCli}</b>clientes con faltantes${T.repoCaras ? ` (${T.repoCaras} caras)` : ''}</span><span><b>${T.ampOf}</b>marcas ofrecidas</span><span><b>${T.ingOk}</b>ingresos aceptados</span></div>
      <div class="ct-sub">Avance por supervisor</div>
      <div class="ct-barras">${T.porSup.map(x => { const q = pct(x.ok, x.n); return `<div><span>${esc(x.eq)}</span><i class="ct-b"><i class="${tono(q)}" style="width:${q}%"></i></i><em>${x.ok}/${x.n}</em></div>`; }).join('')}</div>
      <button type="button" class="ct-irrec" data-go="rec">📥 Ver las fichas recibidas, con fotos y comentarios ›</button>
    </section>` : '';

    // 6. Stock, competencia y encuesta
    const otros = `<section class="ct-mini">
      ${ST ? `<div class="ct-card ct-m"><span class="ct-ic stock">${svg('stock')}</span><div><h3>Stock${ST.fecha ? ' · ' + esc(corto(ST.fecha)) : ''}</h3><p><b class="bad">${ST.sin.length}</b> productos de la lista de precios sin stock</p>${ST.sin.length ? `<small>${esc(ST.sin.slice(0, 4).join(' · '))}${ST.sin.length > 4 ? ' …' : ''}</small>` : ''}</div></div>` : ''}
      ${M.compe ? `<button type="button" class="ct-card ct-m" data-go="compe"><span class="ct-ic compe">${svg('compe')}</span><div><h3>Competencia</h3><p><b>${M.compe.n}</b> ${M.compe.n === 1 ? 'comentario' : 'comentarios'} de vendedores esta semana</p>${M.compe.ult.length ? `<small>${esc(M.compe.ult.map(x => x.marca + (x.prod ? ' ' + x.prod : '') + ' · ' + x.que).join(' · '))}</small>` : ''}</div><span class="ct-r-f">›</span></button>` : ''}
    </section><div id="ctEnc"></div>`;

    box.innerHTML = `<div class="ct">
      <div class="ct-cab"><div><h2>Control</h2><p>${esc(largo(HOY).replace(/^./, c => c.toUpperCase()))}</p></div><button type="button" class="ar-act" data-ct-act>↻ Actualizar</button></div>
      ${rev}<div id="ctRec"></div>${anom || esq('Anomalías de vendedores')}${sup || esq('Supervisores en la calle')}${vis || esq('Visitas de vendedores')}${top}${otros}
    </div>`;
    box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => ir(b.dataset.go));
    box.querySelector('[data-ct-act]').onclick = () => { if (window.Archivos && window.Archivos.olvidar) window.Archivos.olvidar(); if (window.Encuesta && window.Encuesta.cargar) window.Encuesta.cargar(true).catch(() => {}); cargar(true); };
    if (window.Encuesta && $('ctEnc')) window.Encuesta.tarjeta($('ctEnc'));
    if (window.Recibidos && $('ctRec')) window.Recibidos.en($('ctRec'));
    box.querySelectorAll('#ctAnom [data-an]').forEach(b => b.onclick = () => { const r = (window.Fotos.anomalias() || []).find(x => x.ID === b.dataset.an); if (r && window.Anomalias.ver) window.Anomalias.ver(r); });
    if (window.Avisos && window.Avisos.refrescar) window.Avisos.refrescar();
  }
  function ir(go){
    const RU = window.RUTEO, [k, v] = String(go).split(':');
    if (k === 'anom' && window.Anomalias) return window.Anomalias.historial();
    if (k === 'sup' && window.Jefatura) return window.Jefatura.abrir(v, M && M.sup ? M.sup.dia : '');
    if (k === 'sups') return RU.setSeccion('jefatura');
    if (k === 'vend' && window.Visitas && window.Visitas.abrirVendedor) return window.Visitas.abrirVendedor(v, M && M.vis ? M.vis.dia : '');
    if (k === 'vis') return RU.setSeccion('visitas');
    if (k === 'top') return RU.setSeccion('top');
    if (k === 'rec'){ const s = $('ctRecibido'); if (s) s.scrollIntoView({behavior: 'smooth', block: 'start'}); return; }
    if (k === 'compe') return RU.setSeccion('compe');
    if (k === 'stock'){ const s = $('controlView').querySelector('.ct-mini'); if (s) s.scrollIntoView({behavior: 'smooth', block: 'center'}); }
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
      ok(Promise.all([S && S.cargar ? S.cargar() : null, PR && PR.asegurar ? PR.asegurar() : null]))
    ]).then(() => { cargando = null; rehacer(); });
    return cargando;
  }
  window.Control = {
    mostrar(){ if (!M) cargar(); pintar(); },
    cargar,
    pendientes: () => M ? pendientes(M).length : 0,
    items: () => M ? pendientes(M) : [],
    cargandoAhora: () => !!cargando,
    ir: go => ir(go),
    _modelo: () => M, _pintarCon: m => { M = m; pintar(); }   // para la prueba piloto
  };
})();
