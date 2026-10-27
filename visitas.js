// =====================================================================
//  VISITAS (supervisores ven a su equipo; cada vendedor ve solo las suyas)
// ---------------------------------------------------------------------
//  Cada mañana: exportá del sistema el Excel de marcaciones de visitas
//  (desde el día 1 del mes hasta ayer) y subilo a GitHub (página principal,
//  Agregar archivo > Subir archivos) con el nombre que traiga.
//  La app reconoce sola cuál es el Excel de visitas más nuevo.
//
//  El Excel necesita las columnas: Cartera, Subcliente (o Cliente) y
//  Date (o Fecha). Opcionales: Nombre, Primera marcación, Última marcación.
// =====================================================================

const CARPETA_VISITAS = '';   // '' = página principal del repositorio
const ARCHIVO_VISITAS = 'visitas.xlsx';   // respaldo: si no hay carpeta, busca este archivo


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ
// ---------------------------------------------------------------------
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const CODE_RX = /^\s*(\d+)\s*-\s*(\d+)\s*-\s*/;
  const nameKey = s => norm(String(s || '').replace(CODE_RX, '')).replace(/[^a-z0-9]+/g, ' ').trim();
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fromISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const wday = s => fromISO(s).getDay();
  const fmt = n => Number(n).toLocaleString('es-PY');
  const pct = (a, b) => b ? Math.round(a / b * 100) : null;
  const tono = p => p === null ? '' : p >= 90 ? 'good' : p >= 70 ? 'mid' : 'bad';
  const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const DIAS_C = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
  const DAYMAP = {Lun:1, Mar:2, 'Mié':3, Jue:4, Vie:5, 'Sáb':6};
  const TODAY = toISO(new Date());
  const largo = d => { const x = fromISO(d); return `${DIAS[x.getDay()]} ${x.getDate()} de ${MESES[x.getMonth()]}`; };
  const corto = d => d.slice(8, 10) + '/' + d.slice(5, 7);
  const mesNombre = m => { const n = MESES[+m.slice(5, 7) - 1]; return n.charAt(0).toUpperCase() + n.slice(1); };

  // --- Lectura del Excel ---
  function aISO(v){
    if (v == null || v === '') return null;
    if (typeof v === 'number'){ const dt = new Date(Math.round((Math.floor(v) - 25569) * 86400000)); return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate()); }
    if (v instanceof Date) return toISO(v);
    const s = String(v).trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/); if (m){ const y = m[3].length === 2 ? '20' + m[3] : m[3]; return y + '-' + pad(m[2]) + '-' + pad(m[1]); }
    return null;
  }
  function aHora(v){
    if (v == null || v === '') return '';
    if (typeof v === 'number'){ const s = Math.round((v - Math.floor(v)) * 86400); return pad(Math.floor(s / 3600) % 24) + ':' + pad(Math.floor(s % 3600 / 60)); }
    const m = String(v).match(/(\d{1,2}):(\d{2})/); return m ? pad(m[1]) + ':' + m[2] : '';
  }
  function procesar(XLSX, buf){
    const wb = window.abrirLibro ? window.abrirLibro(XLSX, buf) : XLSX.read(buf, {type: 'array'});
    for (const sn of wb.SheetNames){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: true, defval: null, blankrows: false});
      for (let i = 0; i < Math.min(rows.length, 40); i++){
        const h = (rows[i] || []).map(x => norm(x).trim());
        const cS = h.findIndex(x => x === 'subcliente' || x === 'cliente'), cC = h.indexOf('cartera'), cD = h.findIndex(x => x === 'date' || x === 'fecha');
        if (cS < 0 || cC < 0 || cD < 0) continue;
        const c1 = h.findIndex(x => x.startsWith('primera')), c2 = h.findIndex(x => x.startsWith('ultima'));
        const out = [];
        for (let k = i + 1; k < rows.length; k++){
          const r = rows[k]; if (!r) continue;
          const vc = String(r[cC] == null ? '' : r[cC]).trim().toUpperCase(), sub = String(r[cS] == null ? '' : r[cS]).trim(), d = aISO(r[cD]);
          if (!vc || !sub || !d) continue;
          const m = sub.match(CODE_RX);
          out.push({vc, code: m ? m[1] + '-' + m[2] : '', name: sub.replace(CODE_RX, '').trim(), d, h1: c1 >= 0 ? aHora(r[c1]) : '', h2: c2 >= 0 ? aHora(r[c2]) : ''});
        }
        if (out.length) return out;
      }
    }
    return null;
  }
  async function leer(){
    if (!window.cargarExcelLib) throw new Error('Falta excel.js');
    const XLSX = await window.cargarExcelLib();
    // 1) El Excel de visitas más nuevo (con cualquier nombre)
    let cand = [];
    try { cand = window.Archivos ? await window.Archivos.buscar('visitas', 2) : []; } catch(e){ cand = []; }
    for (const f of cand){
      try { const regs = procesar(XLSX, await window.Archivos.bajar(f)); if (regs) return regs; } catch(e){}
    }
    // 2) Respaldo: visitas.xlsx en la raíz
    const r = await fetch(ARCHIVO_VISITAS, {cache: 'no-cache'});
    if (!r.ok) throw new Error('Todavía no se subió ningún Excel de visitas');
    const regs = procesar(XLSX, await r.arrayBuffer());
    if (!regs) throw new Error('El Excel de visitas no tiene las columnas Cartera, Subcliente y Date');
    return regs;
  }

  // --- Índice: visitas cruzadas con el ruteo por código (si no hay código, por nombre) ---
  let estado = 'sin-cargar', error = '', R = null;
  let DATES = [], porCartera = new Map(), fuera = new Map(), huerfanas = new Set();
  let EN_CURSO = '';                     // último día exportado a medias (todavía en curso)
  let marcasCartera = new Map();         // cartera -> Map(mes -> cantidad de marcaciones)
  const enCurso = d => d === TODAY || d === EN_CURSO;
  function indexar(regs){
    const RU = window.RUTEO;
    const carts = RU.carteras;
    const days = new Set(), porDia = new Map();
    porCartera = new Map(); fuera = new Map(); huerfanas = new Set(); marcasCartera = new Map();
    const rutaDe = new Map();
    carts.forEach(c => {
      const byCode = new Map(), byName = new Map();
      c.cl.forEach((cl, i) => { if (cl[6]) byCode.set(cl[6], i); const k = nameKey(cl[2]); if (!byName.has(k)) byName.set(k, i); });
      rutaDe.set(c.vc.toUpperCase(), {c, byCode, byName});
      porCartera.set(c.vc, new Map());   // índice de cliente -> Map(fecha -> [h1,h2])
      fuera.set(c.vc, new Map());        // clave -> {name, code, dias:Map}
    });
    regs.forEach(r => {
      days.add(r.d); porDia.set(r.d, (porDia.get(r.d) || 0) + 1);
      const ru = rutaDe.get(r.vc);
      if (!ru){ huerfanas.add(r.vc); return; }
      const mc = marcasCartera.get(ru.c.vc) || new Map(); mc.set(r.d.slice(0, 7), (mc.get(r.d.slice(0, 7)) || 0) + 1); marcasCartera.set(ru.c.vc, mc);
      let i = r.code && ru.byCode.has(r.code) ? ru.byCode.get(r.code) : undefined;
      if (i === undefined && !r.code) i = ru.byName.get(nameKey(r.name));
      // Cada visita viene en dos filas (entrada y salida): se junta en una sola por cliente y día
      const guardar = (map, d) => {
        const p = map.get(d);
        if (!p) map.set(d, [r.h1, r.h2, r.venta, r.monto]);
        else { if (r.h1 && (!p[0] || r.h1 < p[0])) p[0] = r.h1; if (r.h2 && (!p[1] || r.h2 > p[1])) p[1] = r.h2; p[2] = Math.max(p[2], r.venta); p[3] = Math.max(p[3], r.monto); }
      };
      if (i !== undefined){
        const m = porCartera.get(ru.c.vc); if (!m.has(i)) m.set(i, new Map()); guardar(m.get(i), r.d);
      } else {
        const f = fuera.get(ru.c.vc), k = r.code || nameKey(r.name);
        if (!f.has(k)) f.set(k, {name: r.name, code: r.code, dias: new Map()}); guardar(f.get(k).dias, r.d);
      }
    });
    DATES = [...days].sort();
    // Si el Excel se exportó a media mañana, el último día trae muy pocas marcaciones: se muestra "en curso"
    EN_CURSO = '';
    if (DATES.length > 3){
      const u = DATES[DATES.length - 1], w = wday(u);
      const ref = DATES.slice(0, -1).filter(d => (w === 6 ? wday(d) === 6 : wday(d) !== 6 && wday(d) !== 0)).slice(-5).map(d => porDia.get(d)).sort((a, b) => a - b);
      if (ref.length && porDia.get(u) < ref[Math.floor(ref.length / 2)] * 0.25) EN_CURSO = u;
    }
  }
  const sched = cl => String(cl[3] || '').split(',').map(s => DAYMAP[s.trim()]).filter(Boolean);

  // --- Cálculos ---
  function delDia(c, d){
    const w = wday(d), vis = porCartera.get(c.vc) || new Map();
    const si = [], no = [], otro = [];
    c.cl.forEach((cl, i) => {
      const hit = vis.has(i) ? vis.get(i).get(d) : null, toca = sched(cl).includes(w);
      if (toca) (hit ? si : no).push({cl, hit}); else if (hit) otro.push({cl, hit});
    });
    const fu = []; (fuera.get(c.vc) || new Map()).forEach(f => { const h = f.dias.get(d); if (h) fu.push({cl: [ '', '', f.name, '', null, null, f.code ], hit: h, fuera: true}); });
    const visitas = si.concat(otro, fu);
    const conVenta = visitas.filter(o => o.hit[2]).length, monto = visitas.reduce((t, o) => t + (o.hit[3] || 0), 0);
    return {si, no, otro, fuera: fu, toca: si.length + no.length, visitas: visitas.length, conVenta, monto};
  }
  function delMes(c, m){
    const ds = DATES.filter(d => d.startsWith(m)), vis = porCartera.get(c.vc) || new Map();
    let prog = 0, hechas = 0, enDia = 0, cli = 0, cliVis = 0, otroDia = 0, visitas = 0, conVenta = 0, monto = 0;
    const lista = [];
    c.cl.forEach((cl, i) => {
      const s = sched(cl), v = vis.get(i) || new Map();
      let p = 0, a = 0, e = 0; const falto = [];
      ds.forEach(d => {
        const toca = s.includes(wday(d)), hit = v.has(d);
        if (hit){ a++; const x = v.get(d); visitas++; if (x[2]) conVenta++; monto += x[3] || 0; }
        if (toca){
          if (hit){ p++; e++; }
          else if (!enCurso(d)){ p++; falto.push(d); }   // un día en curso no cuenta como falta
        }
      });
      if (!p && !a) return;
      const h = Math.min(a, p);
      prog += p; hechas += h; enDia += e; otroDia += a - e;
      if (p){ cli++; if (a) cliVis++; }
      lista.push({cl, p, a, e, h, falto});
    });
    const fu = []; (fuera.get(c.vc) || new Map()).forEach(f => {
      const ks = [...f.dias.keys()].filter(d => d.startsWith(m)); if (!ks.length) return;
      fu.push({name: f.name, code: f.code, n: ks.length});
      ks.forEach(d => { const x = f.dias.get(d); visitas++; if (x[2]) conVenta++; monto += x[3] || 0; });
    });
    return {prog, hechas, enDia, otroDia, cli, cliVis, lista, fuera: fu, dias: ds.length, visitas, conVenta, monto};
  }

  // --- Pantalla ---
  const ui = {modo: 'dia', dia: '', mes: '', abiertos: new Set()};
  function diaPorDefecto(){
    if (!DATES.length) return '';
    const u = DATES[DATES.length - 1];
    return enCurso(u) && DATES.length > 1 ? DATES[DATES.length - 2] : u;
  }
  const meses = () => [...new Set(DATES.map(d => d.slice(0, 7)))];

  function filaCliente(cl, der, cls){
    return `<div class="vs-cli"><div class="vs-cli-n">${esc(cl[2])}${cl[6] ? ` <span class="ccode">${esc(cl[6])}</span>` : ''}${cl._top ? ' <span class="vs-top">★ top</span>' : ''}</div>${der ? `<span class="vs-h ${cls || ''}">${esc(der)}</span>` : ''}</div>`;
  }
  // Detalle de un vendedor en un día: quién faltó y quién fue visitado
  function detalleDia(x){
    let h = `<div class="vs-sec no">No visitados <b>${x.no.length}</b></div>`;
    h += x.no.length ? x.no.map(o => filaCliente(o.cl)).join('') : `<p class="vs-nada">Visitó a todos los clientes que le tocaban.</p>`;
    h += `<div class="vs-sec si">Visitados <b>${x.si.length}</b><small>Hora</small></div>`;
    h += x.si.length ? x.si.map(o => filaCliente(o.cl, o.hit[0] || o.hit[1] || '')).join('') : `<p class="vs-nada">Ninguno.</p>`;
    if (x.otro.length) h += `<p class="vs-nada">Además visitó ${x.otro.length} ${x.otro.length === 1 ? 'cliente' : 'clientes'} de otro día de su ruteo.</p>`;
    return h;
  }
  // Detalle de un vendedor en el mes: clientes sin visita y clientes con visitas de menos
  function detalleMes(x){
    const porNombre = (a, b) => String(a.cl[2]).localeCompare(String(b.cl[2]), 'es');
    const nunca = x.lista.filter(o => o.p && !o.a).sort(porNombre);
    const faltan = x.lista.filter(o => o.a && o.h < o.p).sort((a, b) => (b.p - b.h) - (a.p - a.h) || porNombre(a, b));
    const ok = x.lista.filter(o => o.p && o.h >= o.p).length;
    let h = `<div class="vs-sec no">Sin ninguna visita <b>${nunca.length}</b></div>`;
    h += nunca.length ? nunca.map(o => filaCliente(o.cl, `0 de ${o.p}`, 'bad')).join('') : `<p class="vs-nada">Todos sus clientes tuvieron al menos una visita.</p>`;
    if (faltan.length){
      h += `<div class="vs-sec ot">Con visitas de menos <b>${faltan.length}</b><small>Hechas</small></div>`;
      h += faltan.map(o => filaCliente(o.cl, `${o.h} de ${o.p}`, 'mid')).join('');
    }
    h += `<p class="vs-nada">${ok} ${ok === 1 ? 'cliente tuvo' : 'clientes tuvieron'} todas sus visitas.</p>`;
    return h;
  }

  function pintar(){
    const box = $('visitasView'); if (!box) return;
    const RU = window.RUTEO;
    if (estado !== 'ok'){
      box.innerHTML = `<div class="vs-wrap"><div class="tv-state">${estado === 'cargando' ? '<b>Cargando visitas…</b>'
        : `<b>Todavía no hay visitas para mostrar</b><span>Falta subir a GitHub el Excel de marcaciones.</span>`}</div></div>`;
      return;
    }
    if (!DATES.length){ box.innerHTML = `<div class="vs-wrap"><div class="tv-state"><b>El archivo de visitas está vacío</b></div></div>`; return; }
    if (!ui.dia) ui.dia = diaPorDefecto();
    if (!ui.mes) ui.mes = ui.dia.slice(0, 7);
    const spv = RU.getSpv(), yo = RU.vendedor;
    const delSup = yo ? RU.carteras.filter(c => c.vc === yo.vc)
      : RU.carteras.filter(c => !/^AR/i.test(c.vc) && (spv === 'TODOS' || spv === 'MIXTOS' || c.sup === spv));
    // Solo carteras con vendedor activo: las vacantes (según vendedores.js) no se muestran ni suman
    const vacantes = yo ? [] : delSup.filter(c => RU.isVacante(c));
    const carts = yo ? delSup : delSup.filter(c => !RU.isVacante(c));
    const esDia = ui.modo === 'dia';

    // Carteras sin ninguna marcación en el mes (vacantes) no se cuentan
    const conMarcas = c => !!(marcasCartera.get(c.vc) || new Map()).get(ui.mes);
    const filas = carts.filter(conMarcas).map(c => {
      if (esDia){ const x = delDia(c, ui.dia); return {c, x, a: x.si.length, b: x.toca}; }
      const x = delMes(c, ui.mes); return {c, x, a: x.cliVis, b: x.cli, va: x.hechas, vb: x.prog};
    }).filter(f => f.b);
    const tot = (fs, k1, k2) => pct(fs.reduce((t, f) => t + f[k1], 0), fs.reduce((t, f) => t + f[k2], 0));
    // Día: % de clientes visitados de los que tocaban. Mes: % de visitas hechas de las que tocaban.
    const pctDe = fs => esDia ? tot(fs, 'a', 'b') : tot(fs, 'va', 'vb');
    const A = filas.reduce((t, f) => t + f.a, 0), B = filas.reduce((t, f) => t + f.b, 0), P = pctDe(filas);

    const ultimoCompleto = enCurso(DATES[DATES.length - 1]) && DATES.length > 1 ? DATES[DATES.length - 2] : DATES[DATES.length - 1];
    const diasMes = DATES.filter(d => d.startsWith(ui.mes) && !enCurso(d));
    const chipsDias = diasMes.slice().reverse().map(d => `<button type="button" class="vs-dchip ${d === ui.dia ? 'on' : ''}" data-dia="${d}"><small>${DIAS_C[wday(d)]}</small><b>${+d.slice(8)}</b></button>`).join('');
    const ms = meses();

    const titulo = esDia ? largo(ui.dia).replace(/^./, s => s.toUpperCase()) : `${mesNombre(ui.mes)}, hasta el ${corto(diasMes[diasMes.length - 1] || ui.dia)}`;
    const VA = filas.reduce((t, f) => t + (f.va || 0), 0), VB = filas.reduce((t, f) => t + (f.vb || 0), 0);
    const linea = esDia ? `${fmt(A)} de ${fmt(B)} clientes visitados` : `${fmt(VA)} de ${fmt(VB)} visitas hechas · ${fmt(A)} de ${fmt(B)} clientes visitados`;

    // Supervisores (solo en "Todos")
    let supHtml = '';
    if (spv === 'TODOS' && !yo){
      supHtml = `<div class="vs-sups">` + RU.sups.map(s => {
        const fs = filas.filter(f => f.c.sup === s.k); if (!fs.length) return '';
        const q = pctDe(fs);
        return `<button type="button" class="vs-sup" data-sup="${esc(s.k)}"><span class="vs-sup-n">${esc(s.p)}</span><span class="vs-bar"><i class="${tono(q)}" style="width:${q || 0}%"></i></span><b class="${tono(q)}">${q === null ? '—' : q + '%'}</b></button>`;
      }).join('') + `</div>`;
    }

    // Vendedores, de menor a mayor cumplimiento
    const pv = f => esDia ? pct(f.a, f.b) : pct(f.va, f.vb);
    const ord = filas.slice().sort((x, y) => (pv(x) ?? 101) - (pv(y) ?? 101) || x.c.vc.localeCompare(y.c.vc));
    const vend = ord.map(f => {
      const q = pv(f), abierto = ui.abiertos.has(f.c.vc), vac = RU.isVacante(f.c);
      return `<article class="vs-v ${abierto ? 'open' : ''}" data-vc="${esc(f.c.vc)}">
        <button type="button" class="vs-v-head" aria-expanded="${abierto}">
          <span class="vs-v-info">
            <span class="vs-v-n ${vac ? 'vac' : ''}">${esc(vac ? 'Cartera vacante' : f.c.vn)}</span>
            <span class="vs-v-s">${esc(f.c.vc)}${spv === 'TODOS' ? ' · ' + esc(RU.supLabel[f.c.sup] || '') : ''} · ${esDia ? `${f.a} de ${f.b} clientes` : `${f.va} de ${f.vb} visitas`}</span>
          </span>
          <b class="vs-v-p ${tono(q)}">${q === null ? '—' : q + '%'}</b>
        </button>
        <div class="vs-v-body">${abierto ? (esDia ? detalleDia(f.x) : detalleMes(f.x)) : ''}</div>
      </article>`;
    }).join('');

    box.innerHTML = `<div class="vs-wrap">
      <div class="vs-head">
        <div><h2>${yo ? 'Tus visitas' : 'Visitas'}</h2><p>Actualizado al ${largo(ultimoCompleto)}</p></div>
        <div class="vs-seg" role="tablist"><button type="button" data-modo="dia" class="${esDia ? 'on' : ''}">Día</button><button type="button" data-modo="mes" class="${esDia ? '' : 'on'}">Mes</button></div>
      </div>
      ${ms.length > 1 ? `<div class="vs-meses">${ms.map(m => `<button type="button" class="${m === ui.mes ? 'on' : ''}" data-mes="${m}">${mesNombre(m)}</button>`).join('')}</div>` : ''}
      ${esDia ? `<div class="vs-dias">${chipsDias}</div>` : ''}
      <div class="vs-res">
        <div class="vs-res-t">${esc(titulo)}</div>
        <div class="vs-big ${tono(P)}"><b>${P === null ? '—' : P + '%'}</b><span>${esDia ? 'cumplimiento del día' : 'cumplimiento del mes'}</span></div>
        <div class="vs-bar big"><i class="${tono(P)}" style="width:${P || 0}%"></i></div>
        <p class="vs-linea">${linea}</p>
      </div>
      ${supHtml}
      ${yo ? (filas[0] ? `<div class="vs-mis">${esDia ? detalleDia(filas[0].x) : detalleMes(filas[0].x)}</div>` : `<div class="tv-state"><b>${esDia ? 'No tenías clientes de ruteo este día' : 'Todavía no hay visitas tuyas este mes'}</b></div>`) : `
      <div class="vs-lista-h">${esDia ? 'Tocá un vendedor para ver a quién no visitó' : 'Tocá un vendedor para ver qué clientes le faltan'}</div>
      ${vend || `<div class="tv-state"><b>Ningún vendedor tenía ruteo ${esDia ? 'este día' : 'este mes'}</b></div>`}`}
      ${vacantes.length ? `<p class="tv-note">Solo se cuentan carteras con vendedor. No se incluyen ${vacantes.length} ${vacantes.length === 1 ? 'cartera vacante' : 'carteras vacantes'}: ${esc(vacantes.map(c => c.vc).join(', '))}.</p>` : ''}
    </div>`;

    box.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => { ui.modo = b.dataset.modo; ui.abiertos.clear(); pintar(); });
    box.querySelectorAll('[data-dia]').forEach(b => b.onclick = () => { ui.dia = b.dataset.dia; ui.abiertos.clear(); pintar(); });
    box.querySelectorAll('[data-mes]').forEach(b => b.onclick = () => { ui.mes = b.dataset.mes; const ds = DATES.filter(d => d.startsWith(ui.mes) && !enCurso(d)); ui.dia = ds[ds.length - 1] || ui.dia; ui.abiertos.clear(); pintar(); });
    box.querySelectorAll('[data-sup]').forEach(b => b.onclick = () => RU.setSpv(b.dataset.sup));
    box.querySelectorAll('.vs-v-head').forEach(b => b.onclick = () => {
      const vc = b.closest('.vs-v').dataset.vc;
      ui.abiertos.has(vc) ? ui.abiertos.delete(vc) : ui.abiertos.add(vc);
      pintar();
    });
    const chipOn = box.querySelector('.vs-dchip.on'); if (chipOn) chipOn.scrollIntoView({inline: 'center', block: 'nearest'});
  }

  function cargar(){
    if (estado === 'ok' || estado === 'cargando') return;
    estado = 'cargando'; pintar();
    leer().then(regs => { indexar(regs); estado = 'ok'; pintar(); })
      .catch(e => { estado = 'error'; error = e.message || String(e); pintar(); });
  }

  window.Visitas = {
    mostrar(){ cargar(); pintar(); },
    refrescar(){ if (estado === 'ok') { ui.abiertos.clear(); pintar(); } }
  };
})();
