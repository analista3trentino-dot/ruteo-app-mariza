// =====================================================================
//  AVISOS (campanita)
// ---------------------------------------------------------------------
//  La app arma sola los avisos de cada persona con sus propios datos:
//   - Vendedor: su ruta y potencial de hoy, sus visitas de ayer, stock.
//   - Supervisor: lo mismo pero de SU equipo (el que eligió al entrar).
//   - Jefatura: todos los equipos y el control de supervisores.
//  Cada uno ve solo lo suyo.
//
//  MENSAJES QUE ESCRIBÍS VOS: agregá una línea en la lista de abajo.
//   para:  "TODOS", "SUPERVISORES", "JEFATURA", un supervisor ("TR13")
//          o un vendedor ("TR1338"). Si ponés un supervisor, lo ven él
//          y los vendedores de su equipo.
//   hasta: último día que se muestra (año-mes-día). Opcional.
//  Copiá una línea de ejemplo, cambiá el texto y confirmá los cambios.
// =====================================================================

const AVISOS = [
  // { para: "TODOS",  titulo: "Promo sidras", texto: "Desde el lunes arranca la promo de sidras.", hasta: "2026-11-30" },
  // { para: "TR13",   titulo: "Reunión",      texto: "Mañana 7:30 reunión de equipo en la oficina." },
  // { para: "TR1338", titulo: "Cliente clave", texto: "Pasá hoy por Comercial Carmencita." },
];


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ
// ---------------------------------------------------------------------
(function () {
  // Avisos rápidos y claros: cada aviso es una tarjeta con un número grande,
  // una línea que explica y, como mucho, 3 nombres. Se muestran apenas están
  // listos (no espera a que cargue todo).
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const mill = n => { const v = (n || 0) / 1e6; return v >= 1 ? v.toLocaleString('es-PY', {maximumFractionDigits: 1}) + ' M' : Math.round((n || 0) / 1000).toLocaleString('es-PY') + ' mil'; };
  const pad = n => String(n).padStart(2, '0');
  const HOY = (() => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); })();
  const LEIDOS = 'ruteoTR1_avisosLeidos';
  const leidos = () => { try { return new Set(JSON.parse(localStorage.getItem(LEIDOS) || '[]')); } catch(e){ return new Set(); } };
  const nom = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()).split(' ').slice(0, 2).join(' ');
  const tono = p => p === null ? '' : p >= 90 ? 'good' : p >= 60 ? 'mid' : 'bad';
  const I = {
    pot: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    vis: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
    top: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/>',
    stock: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    sup: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
    anom: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    compe: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    campana: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'
  };
  const svg = k => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;

  // --- Quién es y qué carteras le tocan ---
  function alcance(){
    const RU = window.RUTEO;
    const activas = cs => cs.filter(c => !RU.isVacante(c) && !/^AR/i.test(c.vc));
    if (RU.modo === 'vendedor') return {carts: RU.carteras.filter(c => c.vc.replace(/\D/g, '') === RU.vendedor.vc.replace(/\D/g, '')), quien: 'vendedor'};
    if (RU.modo === 'supervisor' && RU.miSup) return {carts: activas(RU.carteras.filter(c => c.sup === RU.miSup)), quien: 'supervisor'};
    return {carts: activas(RU.carteras), quien: RU.modo === 'jefatura' ? 'jefatura' : 'todos'};
  }

  // Cada fuente arma sus tarjetas; se pintan apenas están listas
  const FUENTES = {};      // nombre -> {estado: 'cargando'|'ok', items: []}
  const ORDEN = ['msg', 'anom', 'vis', 'pot', 'top', 'compe', 'stock', 'sup'];
  const TITULOS = {anom: 'Anomalías', vis: 'Visitas', pot: 'Potencial de hoy', top: 'Fichas TOP', compe: 'Competencia', stock: 'Stock', sup: 'Supervisores'};

  function mensajes(){
    const RU = window.RUTEO, out = [];
    const mio = RU.vendedor ? RU.vendedor.vc.toUpperCase() : '', miSup = RU.vendedor ? RU.vendedor.sup : RU.miSup;
    (typeof AVISOS !== 'undefined' ? AVISOS : []).forEach((a, i) => {
      if (!a || !a.texto) return;
      if (a.hasta && String(a.hasta) < HOY) return;
      if (a.desde && String(a.desde) > HOY) return;
      const p = String(a.para || 'TODOS').toUpperCase().trim();
      const ve = p === 'TODOS' || (p === 'SUPERVISORES' && RU.modo !== 'vendedor') || (p === 'JEFATURA' && RU.modo === 'jefatura') || RU.modo === 'jefatura' || (mio && p === mio) || (miSup && p === String(miSup).toUpperCase());
      if (ve) out.push({id: 'msg-' + i + '-' + String(a.texto).length, tipo: 'msg', titulo: a.titulo || 'Aviso', linea: esc(a.texto)});
    });
    return out;
  }
  function potencial(al){
    const P = window.Potencial, RU = window.RUTEO; if (!P || !P.listo || !RU.hoy) return [];
    let pot = 0, ven = 0; const sin = [], porV = [];
    al.carts.forEach(c => { let p = 0, v = 0; c.cl.forEach(cl => { if (!String(cl[3]).split(',').map(s => s.trim()).includes(RU.hoy) || !cl[6] || !P.tiene(cl[6])) return; const a = P.potDe(cl[6]), b = P.ventaDe(cl[6]); p += a; v += b; if (b <= 0 && a > 0) sin.push({n: cl[2], a}); }); pot += p; ven += v; if (p && !RU.isVacante(c)) porV.push({c, p, v}); });
    if (!pot) return [];
    const q = Math.round(ven / pot * 100), nuevo = P.mesNuevo && P.mesNuevo();
    const filas = al.quien === 'vendedor'
      ? sin.sort((x, y) => y.a - x.a).slice(0, 3).map(x => [esc(x.n), 'sin compra · puede ' + mill(x.a)])
      : porV.sort((x, y) => x.v / x.p - y.v / y.p).slice(0, 3).map(x => [esc(nom(x.c.vn)), Math.round(x.v / x.p * 100) + '% de ' + mill(x.p)]);
    return [{id: 'pot-' + HOY + '-' + Math.round(ven / 1e6), tipo: 'pot', titulo: 'Potencial de hoy', valor: nuevo ? '' : q + '%', tono: nuevo ? '' : tono(q),
      linea: nuevo ? `Mes nuevo: pueden comprar <b>${mill(pot)}</b> en ${esc(P.mes())}. Las compras se ven cuando se suba el Excel del mes.` : `Compraron <b>${mill(ven)}</b> de <b>${mill(pot)}</b> · faltan ${mill(pot - ven)}`,
      sub: al.quien === 'vendedor' ? 'Clientes de hoy que todavía no compraron' : 'Menor avance', filas: nuevo ? [] : filas, ir: ['ruta', 'Ver la ruta de hoy']}];
  }
  function visitas(al){
    const V = window.Visitas; if (!V) return [];
    const r = V.resumenUltimoDia(al.carts); if (!r || !r.filas.length) return [];
    const si = r.filas.reduce((t, f) => t + f.si, 0), toca = r.filas.reduce((t, f) => t + f.toca, 0), q = toca ? Math.round(si / toca * 100) : null;
    const RU = window.RUTEO;
    let filas, sub;
    if (al.quien === 'vendedor'){ sub = 'No visitaste'; filas = r.filas[0].no.slice(0, 3).map(n => [esc(n), '']); if (r.filas[0].no.length > 3) filas.push(['y ' + (r.filas[0].no.length - 3) + ' más', '']); }
    else if (al.quien === 'jefatura'){ sub = 'Por supervisor'; filas = RU.sups.map(s => { const fs = r.filas.filter(f => f.c.sup === s.k), a = fs.reduce((t, f) => t + f.si, 0), b = fs.reduce((t, f) => t + f.toca, 0); return b ? [esc(s.p), Math.round(a / b * 100) + '%', Math.round(a / b * 100)] : null; }).filter(Boolean); }
    else { sub = 'Menor cumplimiento'; filas = r.filas.slice().sort((x, y) => x.si / x.toca - y.si / y.toca).slice(0, 3).map(f => [esc(nom(f.c.vn)), Math.round(f.si / f.toca * 100) + '%', Math.round(f.si / f.toca * 100)]); }
    return [{id: 'vis-' + r.dia, tipo: 'vis', titulo: 'Visitas del ' + esc(r.largo), valor: q + '%', tono: tono(q), linea: `${al.quien === 'vendedor' ? 'Visitaste' : 'Se visitaron'} <b>${si} de ${toca}</b> clientes`, sub, filas, ir: ['visitas', 'Ver visitas']}];
  }
  function fichas(al){
    const Fo = window.Fotos; if (!Fo || !Fo.fichaDe || Fo.fichaDe('', '') === null || al.quien === 'vendedor') return [];
    const RU = window.RUTEO, tops = [];
    al.carts.forEach(c => c.cl.forEach(cl => { if (cl._top && (al.quien !== 'vendedor' || String(cl[3]).split(',').map(s => s.trim()).includes(RU.hoy))) tops.push({c, cl, ok: !!Fo.fichaDe(c.vc, cl[6])}); }));
    if (!tops.length) return [];
    const n = tops.filter(x => x.ok).length, q = Math.round(n / tops.length * 100);
    const filas = al.quien === 'vendedor' ? tops.filter(x => !x.ok).slice(0, 3).map(x => [esc(x.cl[2]), 'pendiente'])
      : [...new Set(tops.map(x => x.c))].map(c => { const xs = tops.filter(x => x.c === c); return [esc(nom(c.vn)), xs.filter(x => x.ok).length + ' de ' + xs.length, Math.round(xs.filter(x => x.ok).length / xs.length * 100)]; }).sort((a, b) => a[2] - b[2]).slice(0, 3);
    return [{id: 'top-' + HOY + '-' + n, tipo: 'top', titulo: al.quien === 'vendedor' ? 'Fichas TOP de hoy' : 'Fichas TOP de la semana', valor: n + '/' + tops.length, tono: tono(q),
      linea: n >= tops.length ? '¡Todas enviadas!' : al.quien === 'vendedor' ? `Te faltan <b>${tops.length - n}</b> fichas con foto` : `<b>${tops.length - n}</b> clientes top sin ficha esta semana`,
      sub: n >= tops.length ? '' : al.quien === 'vendedor' ? 'Pendientes' : 'Menor avance', filas: n >= tops.length ? [] : filas, ir: [al.quien === 'vendedor' ? 'ruta' : 'top', al.quien === 'vendedor' ? 'Ir a mi ruta' : 'Ver clientes top']}];
  }
  function competencia(al){
    const Fo = window.Fotos; if (!Fo || !Fo.compeSemana || al.quien === 'vendedor') return [];
    const vcs = new Set(al.carts.map(c => c.vc)), xs = Fo.compeSemana().filter(r => vcs.has(r.Vendedor));
    if (!xs.length) return [];
    return [{id: 'compe-' + xs.length + '-' + HOY, tipo: 'compe', titulo: 'Competencia', valor: String(xs.length), tono: '', linea: 'Comentarios de vendedores esta semana', sub: 'Últimos',
      filas: xs.slice(0, 3).map(r => [esc(r['Empresa/Marca'] + (r.Producto ? ' · ' + r.Producto : '')), esc(r['Qué vio'])]), ir: ['compe', 'Ver competencia']}];
  }
  function stock(){
    const S = window.Stock, PR = window.Precios; if (!S || !S.listo) return [];
    const cods = PR && PR.codigos ? PR.codigos() : null, ch = S.cambios(cods); if (!ch || (!ch.repo.length && !ch.sin.length)) return [];
    const nombre = x => esc((PR && PR.desc && PR.desc(x.c)) || x.desc || x.c);
    const fecha = S.fecha ? S.fecha.toLocaleDateString('es-PY', {day: 'numeric', month: 'short'}) : '';
    return [{id: 'stock-' + S.archivo + ch.repo.length + '-' + ch.sin.length, tipo: 'stock', titulo: 'Stock · ' + fecha, valor: String(ch.sin.length), tono: ch.sin.length ? 'bad' : 'good',
      linea: `<b>${ch.sin.length}</b> sin stock${ch.repo.length ? ` · <b>${ch.repo.length}</b> en reposición (más de ${S.minimo.toLocaleString('es-PY')} u.)` : ''}`,
      chips: ch.sin.slice(0, 6).map(x => ['sin', nombre(x)]).concat(ch.repo.slice(0, 4).map(x => ['repo', nombre(x) + ' · ' + Math.round(x.q).toLocaleString('es-PY') + ' u.']))}];
  }
  function anomalias(al){
    const A = window.Anomalias; if (!A || al.quien === 'vendedor') return [];
    const r = A.resumen(new Set(al.carts.map(c => c.vc))); if (!r || (!r.semana.length && !r.pendientes.length)) return [];
    const xs = r.hoy.length ? r.hoy : r.semana;
    return [{id: 'anom-' + r.hoy.length + '-' + r.semana.length + '-' + r.pendientes.length + '-' + HOY, tipo: 'anom', titulo: r.hoy.length ? 'Anomalías de hoy' : 'Anomalías de la semana', valor: String(xs.length), tono: r.pendientes.length ? 'mid' : 'good',
      linea: `${r.semana.length} esta semana${r.pendientes.length ? ` · <b>${r.pendientes.length}</b> sin justificar` : ''}`, sub: 'Últimas',
      filas: xs.slice(0, 3).map(x => [esc(nom(x['Nombre vendedor']) || x.Vendedor), esc(x['Anomalía']) + ' · ' + esc(x['Justificó'] === 'Sí' ? 'justificó' : x['Justificó'] === 'No' ? 'no justificó' : 'pendiente')]), ir: [al.quien === 'jefatura' ? 'jefatura' : 'visitas', 'Ver anomalías']}];
  }
  async function supervisores(al){
    if (al.quien !== 'jefatura' || !window.Jefatura || !window.Jefatura.resumenUltimo) return [];
    const r = await window.Jefatura.resumenUltimo(); if (!r) return [];
    const hm = window.Jefatura.hm, fs = r.filas.slice().sort((a, b) => a.x.enCli - b.x.enCli);
    const sinMarcar = fs.filter(f => !f.x.visitas).length;
    return [{id: 'sup-' + r.dia, tipo: 'sup', titulo: 'Supervisores · ' + esc(r.largo), valor: String(fs.reduce((t, f) => t + f.x.visitas, 0)), tono: sinMarcar ? 'mid' : 'good',
      linea: `visitas en total${sinMarcar ? ` · <b>${sinMarcar}</b> sin marcar` : ''}`, sub: 'Tiempo en clientes',
      filas: fs.slice(0, 4).map(f => [esc(nom(f.n)), f.x.visitas ? hm(f.x.enCli) + ' · ' + f.x.visitas + ' vis.' : 'sin marcar']), ir: ['jefatura', 'Ver supervisores']}];
  }

  // --- Campanita y panel ---
  const todos = () => ORDEN.flatMap(k => (FUENTES[k] && FUENTES[k].items) || []);
  function pintarBoton(){
    let b = $('btnAvisos');
    if (!b){
      const cont = document.querySelector('.top-actions'); if (!cont) return;
      b = document.createElement('button'); b.type = 'button'; b.id = 'btnAvisos'; b.className = 'av-btn'; b.setAttribute('aria-label', 'Avisos');
      cont.insertBefore(b, cont.firstChild); b.onclick = abrir;
    }
    const L = leidos(), n = todos().filter(a => !L.has(a.id)).length;
    b.innerHTML = svg('campana') + (n ? `<span class="av-n">${n}</span>` : '');
    b.classList.toggle('nuevo', n > 0);
  }
  function tarjeta(a, L){
    return `<article class="av2 t-${a.tipo} ${L.has(a.id) ? '' : 'nuevo'}">
      <div class="av2-top"><span class="av2-ic">${svg(a.tipo)}</span><div class="av2-t"><b>${a.titulo}</b><span>${a.linea || ''}</span></div>${a.valor ? `<span class="av2-v ${a.tono || ''}">${a.valor}</span>` : ''}</div>
      ${a.filas && a.filas.length ? `<div class="av2-filas">${a.sub ? `<small>${a.sub}</small>` : ''}${a.filas.map(f => `<div class="av2-f"><span>${f[0]}</span>${f[2] !== undefined ? `<i class="av2-bar"><i class="${tono(f[2])}" style="width:${Math.max(3, f[2])}%"></i></i>` : ''}<em>${f[1] || ''}</em></div>`).join('')}</div>` : ''}
      ${a.chips && a.chips.length ? `<div class="av2-chips">${a.chips.map(c => `<span class="${c[0]}">${c[0] === 'sin' ? '✕' : '↻'} ${c[1]}</span>`).join('')}</div>` : ''}
      ${a.ir ? `<button type="button" class="av2-ir" data-ir="${a.ir[0]}">${a.ir[1]} ›</button>` : ''}
    </article>`;
  }
  function pintarPanel(){
    const p = $('avPanel'); if (!p || !p.classList.contains('abierto')) return;
    const L = leidos(), xs = todos(), cargando = ORDEN.filter(k => FUENTES[k] && FUENTES[k].estado === 'cargando');
    p.querySelector('.av-cuerpo').innerHTML = xs.map(a => tarjeta(a, L)).join('') +
      cargando.map(k => `<div class="av2 esq"><span class="av2-ic"></span><div><b>${TITULOS[k] || ''}</b><span>Cargando…</span></div></div>`).join('') +
      (!xs.length && !cargando.length ? '<p class="av-vacio">No hay avisos por ahora.</p>' : '');
    p.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { cerrar(); window.RUTEO.setSeccion(b.dataset.ir); });
  }
  function cerrar(){ const p = $('avPanel'); if (!p) return; p.classList.remove('abierto'); document.documentElement.classList.remove('cat-abierto'); }
  function abrir(){
    let p = $('avPanel');
    if (!p){ p = document.createElement('div'); p.id = 'avPanel'; p.className = 'av-panel'; document.body.appendChild(p);
      p.innerHTML = `<div class="av-caja" role="dialog" aria-modal="true" aria-label="Avisos"><div class="av-cab"><b>Avisos</b><button type="button" class="av-x" aria-label="Cerrar">✕</button></div><div class="av-cuerpo"></div></div>`;
      p.onclick = e => { if (e.target === p || e.target.closest('.av-x')) cerrar(); };
    }
    p.classList.add('abierto'); document.documentElement.classList.add('cat-abierto');
    pintarPanel();
    try { localStorage.setItem(LEIDOS, JSON.stringify([...new Set([...leidos(), ...todos().map(a => a.id)])].slice(-300))); } catch(e){}
    pintarBoton();
  }
  function fuente(k, carga, armarItems){
    FUENTES[k] = {estado: 'cargando', items: []};
    Promise.resolve(carga).catch(() => {}).then(() => armarItems()).then(items => { FUENTES[k] = {estado: 'ok', items: items || []}; }, () => { FUENTES[k] = {estado: 'ok', items: []}; })
      .then(() => { pintarBoton(); pintarPanel(); });
  }
  function armar(){
    if (!window.RUTEO) return;
    const al = alcance();
    FUENTES.msg = {estado: 'ok', items: mensajes()};
    if (window.Visitas && window.Visitas.asegurar) fuente('vis', window.Visitas.asegurar(), () => visitas(al));
    if (window.Potencial) fuente('pot', window.Potencial.cargar(), () => potencial(al));
    if (window.Fotos && window.Fotos.cargar) fuente('top', window.Fotos.cargar(), () => fichas(al).concat(competencia(al)));
    if (window.Fotos && window.Fotos.cargar && al.quien !== 'vendedor') fuente('anom', window.Fotos.cargar(), () => anomalias(al));
    if (window.Stock) fuente('stock', Promise.all([window.Stock.cargar(), window.Precios && window.Precios.asegurar ? window.Precios.asegurar() : null]), () => stock());
    if (al.quien === 'jefatura') fuente('sup', null, () => supervisores(al));
    pintarBoton();
  }
  window.Avisos = {armar, abrir, refrescar: () => { pintarBoton(); pintarPanel(); }};
  window.addEventListener('load', () => setTimeout(() => { try { armar(); } catch(e){} }, 600));
})();
