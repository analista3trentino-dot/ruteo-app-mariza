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
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const gs = n => 'Gs. ' + Math.round(n || 0).toLocaleString('es-PY');
  const mill = n => { const v = (n || 0) / 1e6; return v >= 1 ? v.toLocaleString('es-PY', {maximumFractionDigits: 1}) + ' M' : Math.round((n || 0) / 1000).toLocaleString('es-PY') + ' mil'; };
  const pad = n => String(n).padStart(2, '0');
  const HOY = (() => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); })();
  const LEIDOS = 'ruteoTR1_avisosLeidos';
  const leidos = () => { try { return new Set(JSON.parse(localStorage.getItem(LEIDOS) || '[]')); } catch(e){ return new Set(); } };
  const ICO = {
    pot: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    vis: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>',
    repo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    sin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
    msg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    sup: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>',
    campana: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
  };
  const lista = (xs, n) => `<ul class="av-lista">${xs.slice(0, n || 12).map(x => `<li>${x}</li>`).join('')}${xs.length > (n || 12) ? `<li class="mas">y ${xs.length - (n || 12)} más</li>` : ''}</ul>`;
  let AV = [];

  // --- Quién es y qué carteras le tocan ---
  function alcance(){
    const RU = window.RUTEO;
    if (RU.modo === 'vendedor') return {carts: RU.carteras.filter(c => c.vc.replace(/\D/g, '') === RU.vendedor.vc.replace(/\D/g, '')), quien: 'vendedor'};
    if (RU.modo === 'supervisor' && RU.miSup) return {carts: RU.carteras.filter(c => c.sup === RU.miSup), quien: 'supervisor'};
    return {carts: RU.carteras, quien: RU.modo === 'jefatura' ? 'jefatura' : 'todos'};
  }

  // --- Mensajes escritos en la lista de arriba ---
  function mensajes(){
    const RU = window.RUTEO, out = [];
    const mio = RU.vendedor ? RU.vendedor.vc.toUpperCase() : '';
    const miSup = RU.vendedor ? RU.vendedor.sup : RU.miSup;
    (typeof AVISOS !== 'undefined' ? AVISOS : []).forEach((a, i) => {
      if (!a || !a.texto) return;
      if (a.hasta && String(a.hasta) < HOY) return;
      if (a.desde && String(a.desde) > HOY) return;
      const p = String(a.para || 'TODOS').toUpperCase().trim();
      const ve = p === 'TODOS' || (p === 'SUPERVISORES' && RU.modo !== 'vendedor') || (p === 'JEFATURA' && RU.modo === 'jefatura')
        || RU.modo === 'jefatura' || (mio && p === mio) || (miSup && p === String(miSup).toUpperCase()) || (RU.modo === 'supervisor' && !RU.miSup && /^[A-Z]{2}\d{2,4}$/.test(p));
      if (!ve) return;
      out.push({id: 'msg-' + i + '-' + String(a.titulo || '') + String(a.texto).length, tipo: 'msg', ico: ICO.msg, titulo: a.titulo || 'Aviso', texto: esc(a.texto), para: p});
    });
    return out;
  }

  // --- Potencial de hoy ---
  function potencial(al){
    const P = window.Potencial, RU = window.RUTEO; if (!P || !P.listo || !RU.hoy) return [];
    const hoy = al.carts.map(c => ({c, cls: c.cl.filter(cl => String(cl[3]).split(',').map(s => s.trim()).includes(RU.hoy))}));
    let pot = 0, ven = 0, n = 0; const sinCompra = [];
    hoy.forEach(x => x.cls.forEach(cl => { if (!cl[6] || !P.tiene(cl[6])) return; const p = P.potDe(cl[6]), v = P.ventaDe(cl[6]); pot += p; ven += v; n++; if (v <= 0 && p > 0) sinCompra.push({n: cl[2], p}); }));
    if (!n || !pot) return [];
    const a = Math.round(ven / pot * 100), falta = Math.max(0, pot - ven);
    sinCompra.sort((x, y) => y.p - x.p);
    let texto = `${al.quien === 'vendedor' ? 'Tus clientes de hoy' : 'Los clientes de hoy'} pueden comprar <b>${gs(pot)}</b> en el mes y ya compraron <b>${gs(ven)}</b> (<b>${a}%</b>). Faltan <b>${gs(falta)}</b>.`;
    let detalle = sinCompra.length ? `<p class="av-sub">Todavía no compraron (los de más potencial primero):</p>` + lista(sinCompra.map(s => `${esc(s.n)} <small>${mill(s.p)}</small>`), 8) : '';
    if (al.quien !== 'vendedor'){
      const porV = hoy.map(x => { let p = 0, v = 0; x.cls.forEach(cl => { if (P.tiene(cl[6])){ p += P.potDe(cl[6]); v += P.ventaDe(cl[6]); } }); return {c: x.c, p, v}; }).filter(f => f.p && !RU.isVacante(f.c)).sort((x, y) => x.v / x.p - y.v / y.p);
      detalle = porV.length ? `<p class="av-sub">Vendedores con menor avance hoy:</p>` + lista(porV.map(f => `${esc(f.c.vn)} <small>${Math.round(f.v / f.p * 100)}% de ${mill(f.p)}</small>`), 6) : '';
    }
    return [{id: 'pot-' + HOY + '-' + al.quien, tipo: 'pot', ico: ICO.pot, titulo: `Potencial de hoy · ${n} clientes`, texto, detalle, accion: 'ruta'}];
  }

  // --- Visitas del último día ---
  function visitas(al){
    const V = window.Visitas; if (!V) return [];
    const r = V.resumenUltimoDia(al.carts); if (!r || !r.filas.length) return [];
    const si = r.filas.reduce((t, f) => t + f.si, 0), toca = r.filas.reduce((t, f) => t + f.toca, 0), a = Math.round(si / toca * 100);
    let texto, detalle = '';
    if (al.quien === 'vendedor'){
      const f = r.filas[0];
      texto = f.no.length ? `El ${esc(r.largo)} visitaste <b>${f.si} de ${f.toca}</b> clientes (<b>${a}%</b>). Te faltaron ${f.no.length}.` : `El ${esc(r.largo)} visitaste a <b>todos</b> tus clientes (${f.toca}). ¡Bien!`;
      if (f.no.length) detalle = `<p class="av-sub">No visitados:</p>` + lista(f.no.map(esc), 10);
    } else {
      texto = `El ${esc(r.largo)} ${al.quien === 'supervisor' ? 'tu equipo visitó' : 'se visitaron'} <b>${si} de ${toca}</b> clientes (<b>${a}%</b>).`;
      const ord = r.filas.slice().sort((x, y) => x.si / x.toca - y.si / y.toca);
      detalle = `<p class="av-sub">Por vendedor (de menor a mayor):</p>` + lista(ord.map(f => `${esc(f.c.vn)} <small>${f.si} de ${f.toca} · ${Math.round(f.si / f.toca * 100)}%</small>`), al.quien === 'supervisor' ? 12 : 8);
    }
    return [{id: 'vis-' + r.dia + '-' + al.quien, tipo: 'vis', ico: ICO.vis, titulo: 'Visitas de ayer', texto, detalle, accion: 'visitas'}];
  }

  // --- Stock: reposiciones y productos que se quedaron sin stock ---
  function stock(){
    const S = window.Stock, PR = window.Precios; if (!S || !S.listo) return [];
    const cods = PR && PR.codigos ? PR.codigos() : null;
    const nombre = x => esc((PR && PR.desc && PR.desc(x.c)) || x.desc || x.c);
    const fecha = S.fecha ? S.fecha.toLocaleDateString('es-PY', {day: 'numeric', month: 'short'}) : '';
    const ch = S.cambios(cods); const out = [];
    if (ch){
      if (ch.repo.length) out.push({id: 'repo-' + S.archivo + ch.repo.length, tipo: 'repo', ico: ICO.repo, titulo: `Reposición · ${ch.repo.length} ${ch.repo.length === 1 ? 'producto' : 'productos'}`, texto: `Volvieron a tener stock (reporte del ${fecha}).`, detalle: lista(ch.repo.map(x => `${nombre(x)} <small>${Math.round(x.q).toLocaleString('es-PY')} u.</small>`), 15), accion: 'lp'});
      if (ch.sin.length) out.push({id: 'sin-' + S.archivo + ch.sin.length, tipo: 'sin', ico: ICO.sin, titulo: `Sin stock · ${ch.sin.length} ${ch.sin.length === 1 ? 'producto' : 'productos'}`, texto: `Se quedaron sin stock (reporte del ${fecha}). No los ofrezcas por ahora.`, detalle: lista(ch.sin.map(nombre), 15), accion: 'lp'});
    } else if (cods){
      // primer reporte: los productos de la lista que no tienen stock
      const sin = [...cods].filter(c => !(S.de(c) > 0)).map(c => ({c, desc: ''}));
      if (sin.length) out.push({id: 'sinlista-' + S.archivo, tipo: 'sin', ico: ICO.sin, titulo: `Sin stock · ${sin.length} productos de la lista`, texto: `Según el reporte del ${fecha}. En el botón LP de cada cliente se ve el stock de cada producto.`, detalle: lista(sin.map(nombre), 15), accion: 'lp'});
    }
    return out;
  }

  // --- Jefatura: supervisores del último día ---
  async function supervisores(al){
    if (al.quien !== 'jefatura' || !window.Jefatura || !window.Jefatura.resumenUltimo) return [];
    try {
      const r = await window.Jefatura.resumenUltimo(); if (!r) return [];
      const hm = window.Jefatura.hm;
      const fs = r.filas.slice().sort((a, b) => a.x.enCli - b.x.enCli);
      return [{id: 'jef-' + r.dia, tipo: 'sup', ico: ICO.sup, titulo: 'Supervisores en clientes', texto: `Marcaciones del ${esc(r.largo)}:`, detalle: lista(fs.map(f => `${esc(f.n)} <small>${f.x.visitas} visitas · ${hm(f.x.enCli)} en clientes</small>`), 8), accion: 'jefatura'}];
    } catch(e){ return []; }
  }

  // --- Campanita y panel ---
  function pintarBoton(){
    let b = $('btnAvisos');
    if (!b){
      const cont = document.querySelector('.top-actions'); if (!cont) return;
      b = document.createElement('button'); b.type = 'button'; b.id = 'btnAvisos'; b.className = 'av-btn'; b.setAttribute('aria-label', 'Avisos');
      cont.insertBefore(b, cont.firstChild); b.onclick = abrir;
    }
    const L = leidos(), n = AV.filter(a => !L.has(a.id)).length;
    b.innerHTML = ICO.campana + (n ? `<span class="av-n">${n}</span>` : '');
    b.classList.toggle('nuevo', n > 0);
  }
  function abrir(){
    let p = $('avPanel');
    if (!p){ p = document.createElement('div'); p.id = 'avPanel'; p.className = 'av-panel'; document.body.appendChild(p); }
    const L = leidos();
    p.innerHTML = `<div class="av-caja" role="dialog" aria-modal="true" aria-label="Avisos">
      <div class="av-cab"><b>Avisos</b><button type="button" class="av-x" aria-label="Cerrar">✕</button></div>
      <div class="av-cuerpo">${AV.length ? AV.map((a, i) => `<article class="av-item t-${a.tipo} ${L.has(a.id) ? '' : 'nuevo'}" style="animation-delay:${i * 50}ms">
          <div class="av-ico">${a.ico}</div>
          <div class="av-txt"><b>${esc(a.titulo)}</b><p>${a.texto}</p>${a.detalle ? `<details><summary>Ver detalle</summary>${a.detalle}</details>` : ''}
          ${a.accion === 'ruta' ? '<button type="button" class="av-ir" data-ir="ruta">Ver mi ruta de hoy</button>' : a.accion === 'visitas' ? '<button type="button" class="av-ir" data-ir="visitas">Ver visitas</button>' : a.accion === 'jefatura' ? '<button type="button" class="av-ir" data-ir="jefatura">Ver supervisores</button>' : ''}</div>
        </article>`).join('') : '<p class="av-vacio">No hay avisos por ahora.</p>'}</div>
    </div>`;
    p.classList.add('abierto'); document.documentElement.classList.add('cat-abierto');
    const cerrar = () => { p.classList.remove('abierto'); document.documentElement.classList.remove('cat-abierto'); };
    p.onclick = e => { if (e.target === p || e.target.closest('.av-x')) cerrar(); };
    p.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { cerrar(); window.RUTEO.setSeccion(b.dataset.ir); });
    try { localStorage.setItem(LEIDOS, JSON.stringify([...new Set([...L, ...AV.map(a => a.id)])].slice(-300))); } catch(e){}
    pintarBoton();
  }

  async function armar(){
    if (!window.RUTEO) return;
    const al = alcance();
    // se cargan los datos necesarios (sin abrir las pestañas)
    const espera = [];
    if (window.Potencial) espera.push(window.Potencial.cargar());
    if (window.Visitas && window.Visitas.asegurar) espera.push(window.Visitas.asegurar());
    if (window.Stock) espera.push(window.Stock.cargar());
    if (window.Precios && window.Precios.asegurar) espera.push(window.Precios.asegurar());
    AV = mensajes(); pintarBoton();
    await Promise.all(espera.map(p => Promise.resolve(p).catch(() => {})));
    AV = [...mensajes(), ...potencial(al), ...visitas(al), ...stock(), ...(await supervisores(al))];
    if (al.quien === 'todos' && window.RUTEO.modo === 'supervisor') AV.push({id: 'elegir-equipo', tipo: 'msg', ico: ICO.msg, titulo: 'Elegí tu equipo', texto: 'Tocá <b>Inicio</b>, después <b>Soy supervisor</b> y elegí tu equipo: así recibís solo los avisos de tus vendedores.'});
    pintarBoton();
  }
  window.Avisos = {armar, abrir};
  window.addEventListener('load', () => setTimeout(() => armar().catch(() => {}), 1200));
})();
