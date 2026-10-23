// =====================================================================
//  VENTAS DEL MES
// ---------------------------------------------------------------------
//  CÓMO ACTUALIZAR (cada día):
//   Exportá de Power BI las ventas del mes (con datos, no "conexión
//   dinámica") y subilo a GitHub (página principal, Agregar archivo >
//   Subir archivos) con el nombre que traiga. La app reconoce sola cuál
//   es el Excel de ventas más nuevo.
//
//  CUOTAS (una vez por mes):
//   Subí el Excel de cuotas (como "Libro1": código de cartera y cuota
//   por fila, y "DIAS HABILES"). También se reconoce solo.
//
//  El Excel de ventas necesita columnas de: vendedor (ej. nivel_4_fdv),
//  subcliente y ventas (ej. ventas_sin_desechos_periodo_actual).
// =====================================================================

const CARPETA_VENTAS = '';   // '' = página principal del repositorio


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ
// ---------------------------------------------------------------------
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const VC_RX = /\b((?:TR|TM|AR)\d{4})\b/i;
  const CODE_RX = /^\s*(\d+)\s*-\s*(\d+)\b/;
  const numOf = vc => String(vc).replace(/\D/g, '');
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
  const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const pct = (a, b) => b ? Math.round(a / b * 100) : null;
  const gs = n => 'Gs. ' + Math.round(n || 0).toLocaleString('es-PY');
  const mill = n => { const v = (n || 0) / 1e6; return (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('es-PY') : v.toLocaleString('es-PY', {maximumFractionDigits: 1})) + ' M'; };
  const num = v => {
    if (typeof v === 'number') return v;
    const t = String(v == null ? '' : v).trim(); if (!t) return 0;
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    const n = Number(t.replace(/[^\d,-]/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  // --- Días hábiles (lunes a viernes) ---
  function habilesMes(y, m){ let n = 0; const d = new Date(y, m, 1); while (d.getMonth() === m){ const w = d.getDay(); if (w && w < 6) n++; d.setDate(d.getDate() + 1); } return n; }
  function habilesAntes(y, m, dia){ let n = 0; for (let i = 1; i < dia; i++){ const w = new Date(y, m, i).getDay(); if (w && w < 6) n++; } return n; }

  // --- Lectura ---
  function hojas(XLSX, buf){
    const wb = window.abrirLibro ? window.abrirLibro(XLSX, buf) : XLSX.read(buf, {type: 'array'});
    return wb.SheetNames.map(sn => XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: true, defval: null, blankrows: false}));
  }

  // Excel de ventas: columnas de vendedor, subcliente y ventas (y sin fecha por día, para no confundirlo con el de visitas)
  function leerVentas(H){
    for (const rows of H){
      for (let i = 0; i < Math.min(rows.length, 30); i++){
        const h = (rows[i] || []).map(norm);
        if (h.some(x => x === 'date' || x.startsWith('fec asistencia') || x.startsWith('primera fecha'))) break;
        const cV = h.findIndex(x => /nivel 4/.test(x)) >= 0 ? h.findIndex(x => /nivel 4/.test(x)) : h.findIndex(x => x === 'cartera' || x === 'vendedor' || x === 'cod vendedor');
        const cS = h.findIndex(x => x.includes('subcliente')) >= 0 ? h.findIndex(x => x.includes('subcliente')) : h.findIndex(x => /(^| )cliente( |$)/.test(x));
        const cM = h.findIndex(x => /^ventas?( |$)/.test(x) || /monto|importe/.test(x));
        if (cV < 0 || cS < 0 || cM < 0) continue;
        const cMes = h.findIndex(x => x === 'mes' || x === 'desc mes'), cAnio = h.findIndex(x => x === 'ano' || x === 'anio');
        const filas = [];
        let mes = null, anio = null;
        for (let k = i + 1; k < rows.length; k++){
          const r = rows[k]; if (!r) continue;
          const mv = String(r[cV] == null ? '' : r[cV]).match(VC_RX), sub = String(r[cS] == null ? '' : r[cS]).trim();
          if (!mv || !sub) continue;
          const mc = sub.match(CODE_RX);
          filas.push({vc: mv[1].toUpperCase(), code: mc ? mc[1] + '-' + mc[2] : '', base: (sub.match(/^\s*(\d+)/) || [])[1] || '', name: sub.replace(/^[\d\s-]+/, '').trim() || sub, v: num(r[cM])});
          if (cMes >= 0 && mes === null && r[cMes] != null){ const t = String(r[cMes]); const n = /^\d+$/.test(t) ? +t - 1 : MESES.findIndex(x => norm(t).startsWith(x.slice(0, 3))); if (n >= 0 && n < 12) mes = n; }
          if (cAnio >= 0 && anio === null && r[cAnio] != null && /^\d{4}$/.test(String(r[cAnio]))) anio = +r[cAnio];
        }
        if (filas.length) return {filas, mes, anio};
      }
    }
    return null;
  }

  // Excel de cuotas: filas con código de cartera y un monto grande al final; "DIAS HABILES" opcional
  function leerCuotas(H, validas){
    for (const rows of H){
      // no es de cuotas si tiene columnas de visitas, ventas por cliente o precios
      if (rows.slice(0, 30).some(r => r && r.some(x => ['subcliente', 'date', 'fecha', 'cod articulo', 'cliente'].includes(norm(x))))) continue;
      const cuotas = new Map(); let habiles = null;
      rows.forEach(r => {
        if (!r) return;
        const t = r.map(x => norm(x));
        const iH = t.findIndex(x => x === 'dias habiles');
        if (iH >= 0){ const v = r.slice(iH + 1).find(x => typeof x === 'number' || /^\d+$/.test(String(x || '').trim())); if (v != null) habiles = +v; }
        const vc = r.map(x => String(x == null ? '' : x).trim().toUpperCase()).find(x => /^(TR|TM|AR)\d{4}$/.test(x) && validas.has(x));
        if (!vc) return;
        const nums = r.filter(x => typeof x === 'number' && x > 100000);
        if (nums.length && !cuotas.has(vc)) cuotas.set(vc, nums[nums.length - 1]);
      });
      if (cuotas.size >= 5) return {cuotas, habiles};
    }
    return null;
  }

  // --- Datos ---
  let estado = 'sin-cargar', error = '';
  let V = null;   // {porCartera: Map(vc -> {total, porCli: Map(idx -> monto), fuera: Map(clave -> {name, code, v})}), fecha, mes, anio, archivo}
  let C = null;   // {cuotas: Map, habiles}

  async function cargarDatos(){
    if (!window.cargarExcelLib) throw new Error('Falta excel.js');
    const XLSX = await window.cargarExcelLib();
    const RU = window.RUTEO, T = window.Archivos && window.Archivos.tipo;
    const validas = new Set(RU.carteras.map(c => c.vc.toUpperCase()));
    let cand = [];
    try { cand = window.Archivos ? await window.Archivos.ultimos(CARPETA_VENTAS) : []; } catch(e){ cand = []; }
    cand = cand.filter(f => !T || T.leer(f.sha, 'ventas') !== '0');
    let ventas = null, cuotas = null;
    for (const f of cand.slice(0, 10)){
      if (ventas && cuotas) break;
      try {
        const r = await fetch(f.url, {cache: 'no-cache'}); if (!r.ok) continue;
        const H = hojas(XLSX, await r.arrayBuffer());
        let es = false;
        if (!ventas){ const x = leerVentas(H); if (x){ ventas = {...x, fecha: f.fecha, archivo: f.nombre}; es = true; } }
        if (!es && !cuotas){ const x = leerCuotas(H, validas); if (x){ cuotas = x; es = true; } }
        if (T) T.guardar(f.sha, 'ventas', es);
      } catch(e){}
    }
    if (!ventas) throw new Error('sin-ventas');
    C = cuotas || {cuotas: new Map(), habiles: null};
    indexar(ventas);
  }

  function indexar(x){
    const RU = window.RUTEO, porCartera = new Map(), idx = new Map();
    RU.carteras.forEach(c => {
      const byCode = new Map(), byBase = new Map();
      c.cl.forEach((cl, i) => { if (cl[6]){ byCode.set(cl[6], i); const b = String(cl[6]).split('-')[0]; byBase.set(b, byBase.has(b) ? -1 : i); } });
      idx.set(c.vc.toUpperCase(), {byCode, byBase});
      porCartera.set(c.vc.toUpperCase(), {total: 0, porCli: new Map(), fuera: new Map()});
    });
    x.filas.forEach(f => {
      let p = porCartera.get(f.vc);
      if (!p){ p = {total: 0, porCli: new Map(), fuera: new Map()}; porCartera.set(f.vc, p); }
      p.total += f.v;
      const ix = idx.get(f.vc);
      let i = ix && f.code ? ix.byCode.get(f.code) : undefined;
      if (i === undefined && ix && !f.code && f.base && ix.byBase.get(f.base) >= 0) i = ix.byBase.get(f.base);
      if (i !== undefined) p.porCli.set(i, (p.porCli.get(i) || 0) + f.v);
      else { const k = f.code || f.base || f.name; const o = p.fuera.get(k) || {name: f.name, code: f.code || f.base, v: 0}; o.v += f.v; p.fuera.set(k, o); }
    });
    const fd = x.fecha || new Date();
    const mes = x.mes != null ? x.mes : fd.getMonth(), anio = x.anio || fd.getFullYear();
    V = {porCartera, fecha: x.fecha, mes, anio, archivo: x.archivo};
  }

  // Avance esperado según los días hábiles que ya pasaron
  function calendario(){
    const hab = C.habiles || habilesMes(V.anio, V.mes);
    const fd = V.fecha || new Date();
    let pas;
    if (fd.getFullYear() * 12 + fd.getMonth() > V.anio * 12 + V.mes) pas = hab;            // el mes ya terminó
    else pas = Math.min(hab, habilesAntes(V.anio, V.mes, fd.getDate()));
    return {hab, pas, resta: Math.max(0, hab - pas), esperado: pct(pas, hab)};
  }

  function deCartera(c){
    const p = V.porCartera.get(c.vc.toUpperCase()) || {total: 0, porCli: new Map(), fuera: new Map()};
    const compraron = [], sin = [], vistos = new Set();
    c.cl.forEach((cl, i) => {
      const k = cl[6] || cl[2]; if (vistos.has(k)) return; vistos.add(k);
      const v = p.porCli.get(i) || 0;
      (v > 0 ? compraron : sin).push({cl, v});
    });
    return {total: p.total, cuota: C.cuotas.get(c.vc.toUpperCase()) || 0, compraron, sin, fuera: [...p.fuera.values()].filter(o => o.v > 0)};
  }
  function sumar(xs){
    const t = {total: 0, cuota: 0, compraron: [], sin: [], fuera: []};
    xs.forEach(x => { t.total += x.total; t.cuota += x.cuota; t.compraron.push(...x.compraron); t.sin.push(...x.sin); t.fuera.push(...x.fuera); });
    return t;
  }

  // --- Pantalla ---
  const ui = {lista: 'sin', abiertos: new Set(), q: ''};
  const tonoVs = (p, esp) => p === null ? '' : esp === null ? (p >= 90 ? 'good' : p >= 70 ? 'mid' : 'bad') : p >= esp ? 'good' : p >= esp - 10 ? 'mid' : 'bad';

  function tarjeta(t, cal, titulo){
    const P = pct(t.total, t.cuota), ton = tonoVs(P, cal.esperado);
    const falta = Math.max(0, t.cuota - t.total);
    const nCli = t.compraron.length + t.sin.length;
    return `<div class="vs-res vt-res">
      <div class="vs-res-t">${esc(titulo)}</div>
      <div class="vt-monto">${gs(t.total)}</div>
      ${t.cuota ? `<div class="vt-cuota">de ${gs(t.cuota)} de cuota</div>
      <div class="vt-barra"><div class="vs-bar big"><i class="${ton}" style="width:${Math.min(100, P || 0)}%"></i></div>${cal.esperado !== null ? `<span class="vt-marca" style="left:${cal.esperado}%" title="Avance esperado"></span>` : ''}</div>
      <div class="vt-av"><b class="${ton}">${P}%</b><span>${cal.esperado !== null ? `lo esperado a hoy es ${cal.esperado}% (${cal.pas} de ${cal.hab} días hábiles)` : ''}</span></div>
      ${falta ? `<p class="vs-linea">Falta <b>${gs(falta)}</b>${cal.resta ? ` · <b>${gs(falta / cal.resta)}</b> por día en los ${cal.resta} días hábiles que quedan` : ''}</p>` : `<p class="vs-linea"><b class="good">¡Cuota cumplida!</b></p>`}`
      : `<p class="vs-linea">Sin cuota cargada para este mes.</p>`}
      <div class="vs-nums">
        <div class="g"><b>${t.compraron.length.toLocaleString('es-PY')}</b><span>compraron</span></div>
        <div class="r"><b>${t.sin.length.toLocaleString('es-PY')}</b><span>sin compra</span></div>
        <div><b>${nCli ? pct(t.compraron.length, nCli) + '%' : '—'}</b><span>de sus clientes</span></div>
      </div>
    </div>`;
  }

  function filaCli(o, der, cls){
    const cl = o.cl;
    return `<div class="vs-cli"><div class="vs-cli-n">${esc(cl[2])}${cl[6] ? ` <span class="ccode">${esc(cl[6])}</span>` : ''}${cl._top ? ' <span class="vs-top">★ top</span>' : ''}${cl[3] ? `<small>${esc(cl[3])}</small>` : ''}</div>${der ? `<span class="vs-h ${cls || ''}">${esc(der)}</span>` : ''}</div>`;
  }
  function listaClientes(t, conTabs){
    const q = norm(ui.q);
    const f = o => !q || norm(o.cl[2] + ' ' + (o.cl[6] || '')).includes(q);
    const porNombre = (a, b) => String(a.cl[2]).localeCompare(String(b.cl[2]), 'es');
    const sin = t.sin.filter(f).sort(porNombre), con = t.compraron.filter(f).sort((a, b) => b.v - a.v);
    const verSin = !conTabs || ui.lista === 'sin';
    let h = '';
    if (conTabs){
      h += `<div class="vt-tabs"><button type="button" data-lista="sin" class="${verSin ? 'on' : ''}">Sin compra <b>${t.sin.length}</b></button><button type="button" data-lista="con" class="${verSin ? '' : 'on'}">Compraron <b>${t.compraron.length}</b></button></div>`;
      h += `<div class="search-wrap vt-buscar"><svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="vtBuscar" type="text" placeholder="Buscar cliente o código" value="${esc(ui.q)}" autocomplete="off" enterkeyhint="search" /></div>`;
      if (verSin) h += sin.length ? sin.map(o => filaCli(o)).join('') : `<p class="vs-nada">${q ? 'Ningún cliente con ese nombre.' : 'Todos tus clientes compraron este mes.'}</p>`;
      else h += con.length ? con.map(o => filaCli(o, gs(o.v), 'good')).join('') : `<p class="vs-nada">${q ? 'Ningún cliente con ese nombre.' : 'Todavía ningún cliente compró este mes.'}</p>`;
    } else {
      h += `<div class="vs-sec no">Sin compra <b>${sin.length}</b></div>`;
      h += sin.length ? sin.map(o => filaCli(o)).join('') : `<p class="vs-nada">Todos sus clientes compraron.</p>`;
      h += `<div class="vs-sec si">Compraron <b>${con.length}</b><small>Monto</small></div>`;
      h += con.length ? con.map(o => filaCli(o, gs(o.v), 'good')).join('') : `<p class="vs-nada">Ninguno todavía.</p>`;
    }
    const fu = t.fuera.length ? t.fuera.reduce((s, o) => s + o.v, 0) : 0;
    if (t.fuera.length) h += `<p class="vs-nada">Además ${t.fuera.length === 1 ? 'compró 1 cliente' : `compraron ${t.fuera.length} clientes`} que no está${t.fuera.length === 1 ? '' : 'n'} en el ruteo: ${gs(fu)}.</p>`;
    return h;
  }

  function pintar(){
    const box = $('ventasView'); if (!box) return;
    const RU = window.RUTEO;
    if (estado !== 'ok'){
      box.innerHTML = `<div class="vs-wrap"><div class="vs-head"><div><h2>Ventas</h2></div></div><div class="tv-state">${estado === 'cargando' ? '<b>Cargando ventas…</b>'
        : `<b>Todavía no hay ventas para mostrar</b><span>Falta subir a GitHub el Excel de ventas del mes.</span>`}</div></div>`;
      return;
    }
    const cal = calendario();
    const fd = V.fecha;
    const act = fd ? `Actualizado el ${DIAS[fd.getDay()]} ${fd.getDate()} de ${MESES[fd.getMonth()]}${fd.getHours() || fd.getMinutes() ? ', ' + String(fd.getHours()).padStart(2, '0') + ':' + String(fd.getMinutes()).padStart(2, '0') : ''}` : '';
    const mesTxt = MESES[V.mes].charAt(0).toUpperCase() + MESES[V.mes].slice(1) + ' ' + V.anio;
    const yo = RU.vendedor;
    let html;

    if (yo){
      // Vendedor: solo su cartera (y su par mixto, si tiene)
      const mias = RU.carteras.filter(c => numOf(c.vc) === numOf(yo.vc));
      const t = sumar(mias.map(deCartera));
      html = `<div class="vs-wrap">
        <div class="vs-head"><div><h2>Tus ventas</h2><p>${esc(act)}</p></div></div>
        ${tarjeta(t, cal, mesTxt)}
        <div class="vs-lista-h">Tus clientes este mes</div>
        <div class="vt-mis">${listaClientes(t, true)}</div>
      </div>`;
    } else {
      const spv = RU.getSpv();
      const carts = RU.carteras.filter(c => !/^AR/i.test(c.vc) && (spv === 'TODOS' || (spv === 'MIXTOS' ? RU.isMixto(c) : c.sup === spv)));
      const filas = carts.map(c => {
        const pares = RU.carteras.filter(x => x !== c && /^AR/i.test(x.vc) && numOf(x.vc) === numOf(c.vc));
        return {c, x: sumar([deCartera(c), ...pares.map(deCartera)])};
      }).filter(f => f.x.total || f.x.cuota || f.x.compraron.length);
      const T = sumar(filas.map(f => f.x));
      const quien = spv === 'TODOS' ? 'Venta total cartera' : spv === 'MIXTOS' ? 'Venta total carteras mixtas' : 'Venta total ' + (RU.supLabel[spv] || spv);
      let supHtml = '';
      if (spv === 'TODOS'){
        supHtml = `<div class="vs-sups">` + RU.sups.map(s => {
          const fs = filas.filter(f => f.c.sup === s.k); if (!fs.length) return '';
          const t = sumar(fs.map(f => f.x)), q = pct(t.total, t.cuota), ton = tonoVs(q, cal.esperado);
          return `<button type="button" class="vs-sup vt-sup" data-sup="${esc(s.k)}"><span class="vs-sup-n">${esc(s.p)}<small><b>${gs(t.total)}</b> de ${mill(t.cuota)}</small></span><span class="vs-bar"><i class="${ton}" style="width:${Math.min(100, q || 0)}%"></i></span><b class="${ton}">${q === null ? '—' : q + '%'}</b></button>`;
        }).join('') + `</div>`;
      }
      const pv = f => pct(f.x.total, f.x.cuota);
      const vacN = f => RU.isVacante(f.c) ? 1 : 0;   // las carteras vacantes van al final
      const ord = filas.slice().sort((a, b) => vacN(a) - vacN(b) || (pv(a) ?? 999) - (pv(b) ?? 999) || a.c.vc.localeCompare(b.c.vc));
      const vend = ord.map(f => {
        const q = pv(f), ton = tonoVs(q, cal.esperado), abierto = ui.abiertos.has(f.c.vc), vac = RU.isVacante(f.c);
        return `<article class="vs-v ${abierto ? 'open' : ''}" data-vc="${esc(f.c.vc)}">
          <button type="button" class="vs-v-head" aria-expanded="${abierto}">
            <span class="vs-v-info">
              <span class="vs-v-n ${vac ? 'vac' : ''}">${esc(vac ? 'Cartera vacante' : f.c.vn)}</span>
              <span class="vt-v-gs">${gs(f.x.total)}${f.x.cuota ? `<small> de ${mill(f.x.cuota)}</small>` : ''}</span>
              <span class="vs-v-s">${esc(f.c.vc)}${spv === 'TODOS' ? ' · ' + esc(RU.supLabel[f.c.sup] || '') : ''} · compraron ${f.x.compraron.length} de ${f.x.compraron.length + f.x.sin.length} clientes</span>
            </span>
            <b class="vs-v-p ${ton}">${q === null ? '—' : q + '%'}</b>
          </button>
          <div class="vs-v-body">${abierto ? listaClientes(f.x, false) : ''}</div>
        </article>`;
      }).join('');
      html = `<div class="vs-wrap">
        <div class="vs-head"><div><h2>Ventas</h2><p>${esc(act)}</p></div></div>
        ${tarjeta(T, cal, quien + ' · ' + mesTxt)}
        ${supHtml}
        <div class="vs-lista-h">Tocá un vendedor para ver qué clientes no compraron</div>
        ${vend || `<div class="tv-state"><b>No hay ventas para esta selección</b></div>`}
        ${C.cuotas.size ? '' : `<p class="tv-note">Para ver el % de avance, subí también el Excel de cuotas del mes.</p>`}
      </div>`;
    }
    box.innerHTML = html;
    box.querySelectorAll('[data-sup]').forEach(b => b.onclick = () => RU.setSpv(b.dataset.sup));
    box.querySelectorAll('[data-lista]').forEach(b => b.onclick = () => { ui.lista = b.dataset.lista; pintar(); });
    box.querySelectorAll('.vs-v-head').forEach(b => b.onclick = () => {
      const vc = b.closest('.vs-v').dataset.vc;
      ui.abiertos.has(vc) ? ui.abiertos.delete(vc) : ui.abiertos.add(vc);
      pintar();
    });
    const bus = $('vtBuscar');
    if (bus) bus.oninput = e => {
      ui.q = e.target.value; const pos = e.target.selectionStart;
      const vista = box.querySelector('.vt-mis'); if (!vista) return;
      const t = sumar(RU.carteras.filter(c => numOf(c.vc) === numOf(RU.vendedor.vc)).map(deCartera));
      vista.innerHTML = listaClientes(t, true);
      const nb = $('vtBuscar'); nb.focus(); nb.setSelectionRange(pos, pos);
      vista.querySelectorAll('[data-lista]').forEach(b => b.onclick = () => { ui.lista = b.dataset.lista; pintar(); });
      nb.oninput = bus.oninput;
    };
  }

  function cargar(){
    if (estado === 'ok' || estado === 'cargando') return;
    estado = 'cargando'; pintar();
    cargarDatos().then(() => { estado = 'ok'; pintar(); })
      .catch(e => { estado = 'error'; error = e.message || String(e); pintar(); });
  }

  window.Ventas = {
    mostrar(){ cargar(); pintar(); },
    refrescar(){ if (estado === 'ok'){ ui.abiertos.clear(); pintar(); } }
  };
})();
