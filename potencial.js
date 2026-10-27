// =====================================================================
//  POTENCIAL DE RUTA
// ---------------------------------------------------------------------
//  Elegís un vendedor y un día, y la app muestra cuánto pueden comprar
//  los clientes de ese día (potencial) contra lo que ya compraron en el mes.
//
//  CÓMO ACTUALIZAR:
//   - Potencial: subí a GitHub el Excel "Potencial de Ruta de Venta"
//     (con la hoja "Datos": Subcliente, Potencial y los meses).
//   - Lo vendido en el mes sale del Excel de ventas que ya subís cada día.
//     Si no hay, se usa el mes que trae el Excel de potencial.
//  Un cliente que se visita más de un día a la semana reparte su
//  potencial entre esos días.
// =====================================================================

const POTENCIAL_MINIMO_DESTACADO = 2000000;   // clientes "+2MM"


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ
// ---------------------------------------------------------------------
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const CODE_RX = /^\s*(\d+)\s*-\s*(\d+)\b/;
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
  const MES_I = m => { const t = norm(m).replace('septiembre', 'setiembre'); return MESES.findIndex(x => t === x || t.startsWith(x.slice(0, 4))); };
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const DIA_LARGO = {Lun: 'lunes', Mar: 'martes', 'Mié': 'miércoles', Jue: 'jueves', Vie: 'viernes', 'Sáb': 'sábado'};
  const WD = {Lun: 1, Mar: 2, 'Mié': 3, Jue: 4, Vie: 5, 'Sáb': 6};
  const gs = n => 'Gs. ' + Math.round(n || 0).toLocaleString('es-PY');
  const mill = n => { const v = (n || 0) / 1e6; return (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('es-PY') : v.toLocaleString('es-PY', {maximumFractionDigits: 1})) + ' M'; };
  const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : null;
  const tono = p => p === null ? '' : p >= 90 ? 'good' : p >= 60 ? 'mid' : 'bad';
  const num = v => { if (typeof v === 'number') return v; const t = String(v == null ? '' : v).trim(); if (!t) return 0; if (/^-?\d+(\.\d+)?$/.test(t)) return +t; const n = +t.replace(/[^\d,-]/g, '').replace(',', '.'); return isNaN(n) ? 0 : n; };
  const leerC = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e){ return null; } };
  const guardarC = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };

  // --- Lectura del Excel de potencial (solo la hoja "Datos") ---
  function leerPotencial(XLSX, buf, codigos){
    let wb = XLSX.read(buf, {type: 'array', bookSheets: true});
    const hoja = wb.SheetNames.find(n => /datos/i.test(n));
    wb = XLSX.read(buf, hoja ? {type: 'array', sheets: [hoja]} : {type: 'array'});
    for (const sn of wb.SheetNames){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: true, defval: null, blankrows: false});
      for (let i = 0; i < Math.min(rows.length, 20); i++){
        const h = (rows[i] || []).map(norm);
        const cP = h.indexOf('potencial'); if (cP < 0) continue;
        let cS = h.indexOf('subcliente'); if (cS < 0) cS = h.findIndex(x => x.includes('subcliente'));
        if (cS < 0) continue;
        const meses = h.map((x, j) => [MES_I(x), j]).filter(([m]) => m >= 0);
        const ult = meses.length ? meses[meses.length - 1] : null;
        const out = {mes: ult ? ult[0] : null, por: {}};
        for (let k = i + 1; k < rows.length; k++){
          const r = rows[k]; if (!r) continue;
          const m = String(r[cS] == null ? '' : r[cS]).match(CODE_RX); if (!m) continue;
          const c = m[1] + '-' + m[2]; if (codigos && !codigos.has(c)) continue;
          const p = Math.max(0, num(r[cP])), v = ult ? num(r[ult[1]]) : 0;
          const o = out.por[c]; if (o){ o[0] = Math.max(o[0], p); o[1] = Math.max(o[1], v); } else out.por[c] = [p, v];
        }
        return out;
      }
    }
    return null;
  }
  // --- Ventas del mes por cliente (Excel de ventas diario) ---
  function leerVentas(XLSX, buf){
    const wb = window.abrirLibro ? window.abrirLibro(XLSX, buf) : XLSX.read(buf, {type: 'array'});
    for (const sn of wb.SheetNames){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: true, defval: null, blankrows: false});
      for (let i = 0; i < Math.min(rows.length, 30); i++){
        const h = (rows[i] || []).map(norm);
        const cS = h.findIndex(x => x.includes('subcliente')), cV = h.findIndex(x => !/cant/.test(x) && /(^| )ventas?( |$)/.test(x));
        if (cS < 0 || cV < 0) continue;
        const cMes = h.findIndex(x => / ?desc mes$/.test(x) || x === 'mes');
        const out = {mes: null, por: {}};
        for (let k = i + 1; k < rows.length; k++){
          const r = rows[k]; if (!r) continue;
          const m = String(r[cS] == null ? '' : r[cS]).match(CODE_RX); if (!m) continue;
          const c = m[1] + '-' + m[2]; out.por[c] = (out.por[c] || 0) + num(r[cV]);
          if (out.mes === null && cMes >= 0 && r[cMes] != null){ const t = String(r[cMes]); const n = /^\d+$/.test(t) ? +t - 1 : MES_I(t); if (n >= 0) out.mes = n; }
        }
        return out;
      }
    }
    return null;
  }

  // --- Datos ---
  let estado = 'sin-cargar', error = '';
  let POT = null, VEN = null, fPot = null, fVen = null;
  async function cargarDatos(){
    const XLSX = await window.cargarExcelLib();
    const RU = window.RUTEO;
    const codigos = new Set(); RU.carteras.forEach(c => c.cl.forEach(cl => { if (cl[6]) codigos.add(cl[6]); }));
    const [fp] = await window.Archivos.buscar('potencial', 1);
    if (!fp) throw new Error('sin-potencial');
    const kP = 'ruteoTR1_pot_' + fp.sha;
    POT = leerC(kP);
    if (!POT){ POT = leerPotencial(XLSX, await window.Archivos.bajar(fp), codigos); if (!POT) throw new Error('El Excel de potencial no tiene las columnas Subcliente y Potencial'); guardarC(kP, POT); }
    fPot = fp.fecha;
    VEN = null; fVen = null;
    try {
      const [fv] = await window.Archivos.buscar('ventas', 1);
      if (fv){
        const kV = 'ruteoTR1_ven_' + fv.sha;
        VEN = leerC(kV);
        if (!VEN){ VEN = leerVentas(XLSX, await window.Archivos.bajar(fv)); if (VEN) guardarC(kV, VEN); }
        fVen = fv.fecha;
      }
    } catch(e){ VEN = null; }
  }

  // Venta del mes de un cliente: del Excel de ventas si es del mismo mes (o más nuevo), si no del Excel de potencial
  const usaVentas = () => VEN && (VEN.mes === null || POT.mes === null || VEN.mes >= POT.mes || (POT.mes === 11 && VEN.mes === 0));
  const mesVenta = () => usaVentas() ? (VEN.mes !== null ? VEN.mes : (fVen || new Date()).getMonth()) : POT.mes;
  const ventaDe = c => usaVentas() ? (VEN.por[c] || 0) : ((POT.por[c] || [0, 0])[1]);
  const potDe = c => (POT.por[c] || [0, 0])[0];

  // Cuántos días de ese tipo (ej. lunes) quedan en el mes, contando hoy
  function quedan(dia){
    const hoy = new Date(), m = hoy.getMonth(); let n = 0;
    for (let d = new Date(hoy.getFullYear(), m, hoy.getDate()); d.getMonth() === m; d.setDate(d.getDate() + 1)) if (d.getDay() === WD[dia]) n++;
    return n;
  }
  const diasDe = cl => String(cl[3] || '').split(',').map(s => s.trim()).filter(d => WD[d]);

  // Clientes de una cartera en un día, con su parte del potencial
  function delDia(c, dia){
    const out = [];
    c.cl.forEach(cl => {
      const ds = diasDe(cl); if (!ds.includes(dia)) return;
      const parte = 1 / ds.length, cod = cl[6];
      const pot = potDe(cod), ven = Math.max(0, ventaDe(cod));
      out.push({cl, pot, ven, parte, potD: pot * parte, venD: ven * parte, veces: ds.length});
    });
    return out;
  }
  const suma = (xs, k) => xs.reduce((t, x) => t + x[k], 0);

  // --- Pantalla ---
  const hoyDia = (() => { const d = new Date().getDay(); return d >= 1 && d <= 6 ? DIAS[d - 1] : 'Lun'; })();
  const ui = {dia: hoyDia, vc: '', filtro: 'todos'};

  function tarjeta(titulo, xs, dia){
    const P = suma(xs, 'potD'), V = suma(xs, 'venD'), a = pct(V, P), falta = Math.max(0, P - V), q = quedan(dia);
    return `<div class="vs-res pt-res">
      <div class="vs-res-t">${esc(titulo)}</div>
      <div class="pt-grid">
        <div><span>Potencial del mes</span><b>${gs(P)}</b></div>
        <div><span>Ya compraron (${MESES[mesVenta()]})</span><b>${gs(V)}</b></div>
      </div>
      <div class="vs-bar big"><i class="${tono(a)}" style="width:${Math.min(100, a || 0)}%"></i></div>
      <div class="vt-av"><b class="${tono(a)}">${a === null ? '—' : a + '%'}</b><span>del potencial</span></div>
      ${falta > 0 ? `<p class="vs-linea">Faltan <b>${gs(falta)}</b>${q ? ` · quedan <b>${q}</b> ${q === 1 ? DIA_LARGO[dia] : DIA_LARGO[dia] + (dia === 'Sáb' ? 's' : '')} este mes: <b>${gs(falta / q)}</b> por ${DIA_LARGO[dia]}` : ` · ya no quedan ${DIA_LARGO[dia]}${dia === 'Sáb' ? 's' : ''} este mes`}</p>` : `<p class="vs-linea"><b class="good">¡Ya compraron todo su potencial!</b></p>`}
    </div>`;
  }

  function filaCli(o){
    const cl = o.cl, a = pct(o.ven, o.pot), destacado = o.pot >= POTENCIAL_MINIMO_DESTACADO;
    const der = o.ven <= 0 ? `<span class="pt-sin">Sin compra</span>` : `<b class="vs-v-p ${tono(a)}">${a === null ? '✓' : a + '%'}</b>`;
    return `<div class="pt-cli">
      <div class="vs-cli-n">${destacado ? '<span class="pt-2mm">+2MM</span> ' : ''}${esc(cl[2])}${cl[6] ? ` <span class="ccode">${esc(cl[6])}</span>` : ''}${cl._top ? ' <span class="vs-top">★ top</span>' : ''}
        <small>Potencial ${gs(o.pot)} · compró ${gs(o.ven)}${o.veces > 1 ? ` · se visita ${o.veces} días` : ''}</small></div>
      ${der}
    </div>`;
  }

  function listaClientes(xs){
    const sin = xs.filter(o => o.ven <= 0), top = xs.filter(o => o.pot >= POTENCIAL_MINIMO_DESTACADO);
    const vis = ui.filtro === 'sin' ? sin : ui.filtro === '2mm' ? top : xs;
    const ord = vis.slice().sort((a, b) => (b.pot - b.ven) - (a.pot - a.ven) || b.pot - a.pot);
    return `<div class="pt-filtros">
        <button type="button" data-f="todos" class="${ui.filtro === 'todos' ? 'on' : ''}">Todos <b>${xs.length}</b></button>
        <button type="button" data-f="sin" class="${ui.filtro === 'sin' ? 'on' : ''}">Sin compra <b>${sin.length}</b></button>
        <button type="button" data-f="2mm" class="${ui.filtro === '2mm' ? 'on' : ''}">+2MM <b>${top.length}</b></button>
      </div>
      <p class="pt-ayuda">Ordenados por lo que les falta comprar (los de arriba son la mayor oportunidad).</p>
      ${ord.length ? ord.map(filaCli).join('') : `<p class="vs-nada">No hay clientes en este grupo.</p>`}`;
  }

  function pintar(){
    const box = $('potencialView'); if (!box) return;
    const RU = window.RUTEO;
    if (estado !== 'ok'){
      box.innerHTML = `<div class="vs-wrap"><div class="vs-head"><div><h2>Potencial de ruta</h2></div></div><div class="tv-state">${estado === 'cargando' ? '<b>Cargando potencial…</b><span>La primera vez puede tardar unos segundos.</span>'
        : error === 'sin-potencial' ? `<b>Todavía no hay potencial para mostrar</b><span>Falta subir a GitHub el Excel "Potencial de Ruta de Venta".</span>`
        : `<b>No se pudo leer el potencial</b><span>${esc(error)}</span>`}</div></div>`;
      return;
    }
    const yo = RU.vendedor, spv = RU.getSpv();
    const carts = yo ? [yo] : RU.carteras.filter(c => !/^AR/i.test(c.vc) && (spv === 'TODOS' || spv === 'MIXTOS' || c.sup === spv));
    const elegido = yo || (ui.vc && carts.find(c => c.vc === ui.vc)) || null;
    if (!elegido) ui.vc = '';
    const base = elegido ? [elegido] : carts;
    const cuenta = d => base.reduce((t, c) => t + delDia(c, d).length, 0);
    const chips = DIAS.map(d => { const n = cuenta(d); return n || d !== 'Sáb' ? `<button type="button" class="vs-dchip ${d === ui.dia ? 'on' : ''} ${n ? '' : 'cero'}" data-dia="${d}"><small>${d}</small><b>${n}</b></button>` : ''; }).join('');
    const fuente = usaVentas() ? `Ventas al ${fVen ? fVen.toLocaleDateString('es-PY', {day: 'numeric', month: 'short'}) : '—'}` : `Ventas de ${MESES[POT.mes] || '—'} (Excel de potencial)`;
    const cab = `<div class="vs-head"><div><h2>Potencial de ruta</h2><p>${esc(fuente)}${fPot ? ` · potencial cargado el ${fPot.toLocaleDateString('es-PY', {day: 'numeric', month: 'short'})}` : ''}</p></div></div>
      <div class="pt-dias-h">Elegí el día</div>
      <div class="vs-dias pt-dias">${chips}</div>`;
    let html;
    if (elegido){
      const xs = delDia(elegido, ui.dia);
      const vac = RU.isVacante(elegido);
      html = `${cab}
        ${yo ? '' : `<button type="button" class="pt-volver" id="ptVolver">‹ Todos los vendedores</button>`}
        ${tarjeta(`${vac ? 'Cartera vacante' : elegido.vn} · ${elegido.vc} · ${DIA_LARGO[ui.dia]} (${xs.length} clientes)`, xs, ui.dia)}
        ${xs.length ? `<div class="vs-lista-h">Clientes del ${DIA_LARGO[ui.dia]}</div>${listaClientes(xs)}` : `<div class="tv-state"><b>No tiene clientes el ${DIA_LARGO[ui.dia]}</b></div>`}`;
    } else {
      const filas = carts.map(c => { const xs = delDia(c, ui.dia); return {c, xs, P: suma(xs, 'potD'), V: suma(xs, 'venD')}; }).filter(f => f.xs.length);
      const todos = [].concat(...filas.map(f => f.xs));
      const quien = spv === 'TODOS' ? 'Todos los supervisores' : (RU.supLabel[spv] || spv);
      const vacN = f => RU.isVacante(f.c) ? 1 : 0;
      const ord = filas.sort((a, b) => vacN(a) - vacN(b) || (pct(a.V, a.P) ?? 999) - (pct(b.V, b.P) ?? 999));
      html = `${cab}
        ${tarjeta(`${quien} · ${DIA_LARGO[ui.dia]} (${todos.length} clientes)`, todos, ui.dia)}
        <div class="vs-lista-h">Tocá un vendedor para ver sus clientes del ${DIA_LARGO[ui.dia]}</div>
        ${ord.map(f => { const a = pct(f.V, f.P), vac = RU.isVacante(f.c); return `<button type="button" class="vs-v pt-v" data-vc="${esc(f.c.vc)}">
          <span class="vs-v-info"><span class="vs-v-n ${vac ? 'vac' : ''}">${esc(vac ? 'Cartera vacante' : f.c.vn)}</span>
            <span class="vt-v-gs">${mill(f.V)} <small>de ${mill(f.P)} de potencial</small></span>
            <span class="vs-v-s">${esc(f.c.vc)}${spv === 'TODOS' ? ' · ' + esc(RU.supLabel[f.c.sup] || '') : ''} · ${f.xs.length} clientes · ${f.xs.filter(o => o.ven <= 0).length} sin compra</span></span>
          <b class="vs-v-p ${tono(a)}">${a === null ? '—' : a + '%'}</b></button>`; }).join('') || `<div class="tv-state"><b>Nadie tiene clientes el ${DIA_LARGO[ui.dia]}</b></div>`}`;
    }
    box.innerHTML = `<div class="vs-wrap">${html}</div>`;
    box.querySelectorAll('[data-dia]').forEach(b => b.onclick = () => { ui.dia = b.dataset.dia; ui.filtro = 'todos'; pintar(); });
    box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { ui.filtro = b.dataset.f; pintar(); });
    box.querySelectorAll('.pt-v').forEach(b => b.onclick = () => { ui.vc = b.dataset.vc; ui.filtro = 'todos'; pintar(); window.scrollTo({top: 0}); });
    const v = $('ptVolver'); if (v) v.onclick = () => { ui.vc = ''; pintar(); window.scrollTo({top: 0}); };
    const on = box.querySelector('.vs-dchip.on'); if (on) on.scrollIntoView({inline: 'center', block: 'nearest'});
  }

  function cargar(){
    if (estado === 'ok' || estado === 'cargando') return;
    estado = 'cargando'; pintar();
    cargarDatos().then(() => { estado = 'ok'; pintar(); })
      .catch(e => { estado = 'error'; error = e.message || String(e); pintar(); });
  }
  window.Potencial = {
    mostrar(){ cargar(); pintar(); },
    refrescar(){ if (estado === 'ok'){ ui.vc = ''; pintar(); } }
  };
})();
