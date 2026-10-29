// =====================================================================
//  JEFATURA: CONTROL DE SUPERVISORES
// ---------------------------------------------------------------------
//  Muestra las visitas de cada supervisor y las horas que pasó en los
//  clientes (desde que entra hasta que sale de cada cliente).
//
//  CÓMO ACTUALIZAR: exportá del sistema las marcaciones de supervisores
//  (desde el día 1 del mes) y subilas a GitHub (página principal,
//  Agregar archivo > Subir archivos) con el nombre que traigan.
//  La app reconoce sola el Excel más nuevo.
//
//  Solo se ve entrando con la clave de JEFATURA (config.js).
// =====================================================================

const VISITA_CORTA_MINUTOS = 5;   // visitas más cortas que esto se marcan en naranja


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ
// ---------------------------------------------------------------------
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const CODE_RX = /^\s*(\d+)\s*-\s*(\d+)\s*-?\s*/;
  const pad = n => String(n).padStart(2, '0');
  const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const DIAS_C = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
  const fromISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const largo = d => { const x = fromISO(d); return `${DIAS[x.getDay()]} ${x.getDate()} de ${MESES[x.getMonth()]}`; };
  const mesNombre = m => { const n = MESES[+m.slice(5, 7) - 1]; return n.charAt(0).toUpperCase() + n.slice(1); };
  const hm = seg => { seg = Math.max(0, Math.round(seg)); const h = Math.floor(seg / 3600), m = Math.floor(seg % 3600 / 60); return h >= 10 ? `${h} h` : h ? `${h} h ${pad(m)} min` : `${m} min`; };
  const hora = seg => `${pad(Math.floor(seg / 3600) % 24)}:${pad(Math.floor(seg % 3600 / 60))}`;
  const titulo = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());

  // Fecha y hora de Excel -> {d: 'AAAA-MM-DD', s: segundos del día}
  function fh(v){
    if (v == null || v === '') return null;
    if (typeof v === 'number'){
      const dias = Math.floor(v), seg = Math.round((v - dias) * 86400);
      const dt = new Date(Math.round((dias - 25569) * 86400000));
      return {d: dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate()), s: seg};
    }
    if (v instanceof Date) return {d: v.getFullYear() + '-' + pad(v.getMonth() + 1) + '-' + pad(v.getDate()), s: v.getHours() * 3600 + v.getMinutes() * 60 + v.getSeconds()};
    const t = String(v).trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) return {d: m[1] + '-' + pad(m[2]) + '-' + pad(m[3]), s: (+m[4] || 0) * 3600 + (+m[5] || 0) * 60 + (+m[6] || 0)};
    m = t.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m){ const y = m[3].length === 2 ? '20' + m[3] : m[3]; return {d: y + '-' + pad(m[2]) + '-' + pad(m[1]), s: (+m[4] || 0) * 3600 + (+m[5] || 0) * 60 + (+m[6] || 0)}; }
    return null;
  }
  // Duración "00:11:26" o fracción de día -> segundos
  function dur(v){
    if (v == null || v === '') return null;
    if (typeof v === 'number') return Math.round((v % 1) * 86400);
    const m = String(v).match(/(\d+):(\d{2})(?::(\d{2}))?/); return m ? +m[1] * 3600 + +m[2] * 60 + (+m[3] || 0) : null;
  }

  function procesar(XLSX, buf){
    const wb = window.abrirLibro ? window.abrirLibro(XLSX, buf) : XLSX.read(buf, {type: 'array'});
    for (const sn of wb.SheetNames){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: true, defval: null, blankrows: false});
      for (let i = 0; i < Math.min(rows.length, 30); i++){
        const h = (rows[i] || []).map(norm);
        const cSpv = h.indexOf('spv'), cSub = h.findIndex(x => x.includes('subcliente')), cD = h.findIndex(x => x === 'date' || x === 'fecha');
        if (cSpv < 0 || cSub < 0 || cD < 0) continue;
        const cI = h.findIndex(x => /fecha ini|^primera/.test(x)), cF = h.findIndex(x => /fecha fin|^ultima/.test(x));
        const cT = h.findIndex(x => /^tiempo asist|horas trabajadas/.test(x)), cC = h.indexOf('cartera'), cCi = h.indexOf('ciudad');
        const vistos = new Set(), out = [];
        for (let k = i + 1; k < rows.length; k++){
          const r = rows[k]; if (!r || !r[cSpv]) continue;
          const spvTxt = String(r[cSpv]).trim(), m = spvTxt.match(/\(([A-Z]{2}\d{2})\)/);
          const fecha = fh(r[cD]); if (!fecha) continue;
          const ini = cI >= 0 ? fh(r[cI]) : null, fin = cF >= 0 ? fh(r[cF]) : null;
          let seg = ini && fin && ini.d === fin.d ? fin.s - ini.s : null;
          if (seg === null || seg < 0) seg = cT >= 0 ? dur(r[cT]) : null;
          const sub = String(r[cSub] || '').trim(), cm = sub.match(CODE_RX);
          const reg = {sup: m ? m[1] : spvTxt, nombre: titulo(spvTxt.replace(/\s*\(.*\)\s*$/, '')), d: fecha.d,
            code: cm ? cm[1] + '-' + cm[2] : '', cli: sub.replace(CODE_RX, '').trim(), cartera: cC >= 0 ? String(r[cC] || '').trim().toUpperCase() : '',
            ciudad: cCi >= 0 ? String(r[cCi] || '').trim() : '', ini: ini ? ini.s : null, fin: fin ? fin.s : null, seg: seg || 0};
          const k2 = [reg.sup, reg.d, reg.code || reg.cli, reg.ini].join('|'); if (vistos.has(k2)) continue; vistos.add(k2);
          out.push(reg);
        }
        if (out.length) return out;
      }
    }
    return null;
  }

  // --- Datos ---
  let estado = 'sin-cargar', error = '', REGS = [], DATES = [], SUPS = [], VACANTES = [], fArchivo = null, usado = null;
  async function cargarDatos(){
    const XLSX = await window.cargarExcelLib();
    const [f] = await window.Archivos.buscar('supervisores', 1);
    if (!f) throw new Error('sin-archivo');
    const regs = procesar(XLSX, await window.Archivos.bajar(f));
    if (!regs) throw new Error('El Excel de marcaciones de supervisores no tiene las columnas SPV, Subcliente y Date');
    REGS = regs; fArchivo = f.fecha; usado = f;
    DATES = [...new Set(regs.map(r => r.d))].sort();
    const m = new Map(); regs.forEach(r => { if (!m.has(r.sup)) m.set(r.sup, r.nombre); });
    // nombre y vacantes según vendedores.js (SUPERVISORES)
    const LISTA = typeof SUPERVISORES !== 'undefined' ? SUPERVISORES : {};
    const todos = [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, n]) => ({k, n: LISTA[k] ? titulo(LISTA[k]) : n, vac: /vacante/i.test(LISTA[k] || '')}));
    Object.keys(LISTA).forEach(k => { if (!m.has(k)) todos.push({k, n: titulo(LISTA[k]), vac: /vacante/i.test(LISTA[k])}); });
    SUPS = todos.filter(s => !s.vac).sort((a, b) => a.k.localeCompare(b.k));
    VACANTES = todos.filter(s => s.vac).map(s => s.k).sort();
  }

  // Resumen de un supervisor en un conjunto de días
  function resumen(sup, dias){
    const rs = REGS.filter(r => r.sup === sup && dias.has(r.d));
    const porDia = new Map();
    rs.forEach(r => { if (!porDia.has(r.d)) porDia.set(r.d, []); porDia.get(r.d).push(r); });
    let jornada = 0;
    porDia.forEach(xs => { const i = Math.min(...xs.map(x => x.ini ?? Infinity)), f = Math.max(...xs.map(x => x.fin ?? -Infinity)); if (isFinite(i) && isFinite(f) && f > i) jornada += f - i; });
    const enCli = rs.reduce((t, r) => t + r.seg, 0);
    return {rs, porDia, visitas: rs.length, clientes: new Set(rs.map(r => r.code || r.cli)).size, enCli, jornada, dias: porDia.size,
      cortas: rs.filter(r => r.seg < VISITA_CORTA_MINUTOS * 60).length, prom: rs.length ? enCli / rs.length : 0};
  }
  const nombreCartera = vc => { const RU = window.RUTEO; const c = RU && RU.carteras.find(x => x.vc === vc); return c ? (RU.isVacante(c) ? 'vacante' : titulo(c.vn.split(/\s+/).slice(0, 2).join(' '))) : ''; };

  // --- Pantalla ---
  const ui = {modo: 'dia', dia: '', mes: '', abierto: ''};
  const ultimoDia = () => DATES[DATES.length - 1] || '';
  const HOY = (() => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); })();

  function detalleDia(x){
    const xs = x.rs.slice().sort((a, b) => (a.ini ?? 0) - (b.ini ?? 0));
    let h = `<div class="jf-linea">`;
    xs.forEach((r, i) => {
      const corta = r.seg < VISITA_CORTA_MINUTOS * 60;
      const viaje = i && xs[i - 1].fin != null && r.ini != null ? r.ini - xs[i - 1].fin : null;
      if (viaje && viaje > 60) h += `<div class="jf-viaje">${hm(viaje)} de traslado</div>`;
      h += `<div class="jf-vis ${corta ? 'corta' : ''}">
        <div class="jf-hora"><b>${r.ini != null ? hora(r.ini) : '—'}</b><small>${r.fin != null ? hora(r.fin) : ''}</small></div>
        <div class="jf-punto"></div>
        <div class="jf-info"><b>${esc(r.cli)}</b><small>${r.code ? esc(r.code) + ' · ' : ''}${esc(r.cartera)}${nombreCartera(r.cartera) ? ' (' + esc(nombreCartera(r.cartera)) + ')' : ''}${r.ciudad ? ' · ' + esc(r.ciudad) : ''}</small></div>
        <div class="jf-dur ${corta ? 'corta' : ''}">${hm(r.seg)}</div>
      </div>`;
    });
    return h + `</div>`;
  }
  function detalleMes(x){
    const dias = [...x.porDia.keys()].sort().reverse();
    let h = `<div class="vs-sec si">Por día <b>${dias.length}</b><small>Visitas · en clientes · jornada</small></div>`;
    h += dias.map(d => {
      const rs = x.porDia.get(d), en = rs.reduce((t, r) => t + r.seg, 0);
      const i = Math.min(...rs.map(r => r.ini ?? Infinity)), f = Math.max(...rs.map(r => r.fin ?? -Infinity));
      return `<button type="button" class="jf-dia" data-ir="${d}"><span><b>${DIAS_C[fromISO(d).getDay()]} ${+d.slice(8)}</b><small>${isFinite(i) ? hora(i) + ' a ' + hora(f) : ''}</small></span><span>${rs.length} visitas</span><span><b>${hm(en)}</b></span></button>`;
    }).join('');
    const porCart = new Map(); x.rs.forEach(r => porCart.set(r.cartera, (porCart.get(r.cartera) || 0) + 1));
    h += `<div class="vs-sec ot">Carteras que acompañó <b>${porCart.size}</b><small>Visitas</small></div>`;
    h += [...porCart.entries()].sort((a, b) => b[1] - a[1]).map(([vc, n]) => `<div class="vs-cli"><div class="vs-cli-n">${esc(vc)} <small>${esc(nombreCartera(vc))}</small></div><span class="vs-h">${n}</span></div>`).join('');
    return h;
  }

  function pintar(){
    const box = $('jefaturaView'); if (!box) return;
    if (estado !== 'ok'){
      box.innerHTML = `<div class="vs-wrap"><div class="vs-head"><div><h2>Supervisores</h2></div></div><div class="tv-state">${estado === 'cargando' ? '<div class="esqueleto"></div><div class="esqueleto"></div><div class="esqueleto corto"></div>'
        : error === 'sin-archivo' ? `<b>Todavía no hay marcaciones de supervisores</b><span>Subí a GitHub el Excel de marcaciones de supervisores.</span>` : `<b>No se pudo leer</b><span>${esc(error)}</span>`}</div></div>`;
      return;
    }
    if (!ui.dia) ui.dia = ultimoDia();
    if (!ui.mes) ui.mes = ui.dia.slice(0, 7);
    const esDia = ui.modo === 'dia';
    const dias = new Set(esDia ? [ui.dia] : DATES.filter(d => d.startsWith(ui.mes)));
    const filas = SUPS.map(s => ({s, x: resumen(s.k, dias)})).sort((a, b) => (b.x.visitas ? 1 : 0) - (a.x.visitas ? 1 : 0));   // los que no marcaron, al final
    const T = filas.reduce((t, f) => ({v: t.v + f.x.visitas, e: t.e + f.x.enCli, j: t.j + f.x.jornada}), {v: 0, e: 0, j: 0});
    const maxE = Math.max(1, ...filas.map(f => f.x.enCli));
    const RU = window.RUTEO;
    const lbl = k => (RU && RU.supLabel[k]) || k;
    const chips = DATES.filter(d => d.startsWith(ui.mes)).slice().reverse().map(d => `<button type="button" class="vs-dchip ${d === ui.dia ? 'on' : ''}" data-dia="${d}"><small>${d === HOY ? 'Hoy' : DIAS_C[fromISO(d).getDay()]}</small><b>${+d.slice(8)}</b></button>`).join('');
    const titulo_ = esDia ? largo(ui.dia).replace(/^./, s => s.toUpperCase()) + (ui.dia === HOY ? ' (en curso)' : '') : `${mesNombre(ui.mes)}, hasta el ${+ultimoDia().slice(8)}`;
    box.innerHTML = `<div class="vs-wrap">
      <div class="vs-head">
        <div><h2>Supervisores</h2><p>Marcaciones al ${esc(largo(ultimoDia()))}</p><p class="ar-info">${usado ? esc(window.Archivos.etiqueta(usado)) : ''}${window.Archivos.fallo() ? ' · <span class="ar-aviso">sin conexión con GitHub, se muestra lo último guardado</span>' : ''} <button type="button" class="ar-act" data-actualizar>↻ Actualizar</button></p></div>
        <div class="vs-seg" role="tablist"><button type="button" data-modo="dia" class="${esDia ? 'on' : ''}">Día</button><button type="button" data-modo="mes" class="${esDia ? '' : 'on'}">Mes</button></div>
      </div>
      ${esDia ? `<div class="vs-dias">${chips}</div>` : ''}
      <div class="vs-res jf-res">
        <div class="vs-res-t">${esc(titulo_)}</div>
        <div class="jf-kpis">
          <div><b>${T.v.toLocaleString('es-PY')}</b><span>visitas</span></div>
          <div><b>${hm(T.e)}</b><span>en clientes</span></div>
          <div><b>${T.v ? Math.round(T.e / T.v / 60) : 0} min</b><span>por visita</span></div>
        </div>
        ${T.j ? `<div class="jf-uso"><div class="vs-bar big"><i class="good" style="width:${Math.min(100, Math.round(T.e / T.j * 100))}%"></i></div><p class="vs-linea"><b>${Math.round(T.e / T.j * 100)}%</b> de la jornada dentro de clientes (de la primera entrada a la última salida)</p></div>` : ''}
      </div>
      <div class="vs-lista-h">Tocá un supervisor para ver ${esDia ? 'su recorrido del día' : 'el detalle del mes'}</div>
      ${filas.map(f => { const x = f.x, abierto = ui.abierto === f.s.k;
        const sub = esDia ? (x.visitas ? `${x.visitas} visitas · ${hora(Math.min(...x.rs.map(r => r.ini ?? Infinity)))} a ${hora(Math.max(...x.rs.map(r => r.fin ?? -Infinity)))}` : 'Sin marcaciones este día') : `${x.visitas} visitas en ${x.dias} días · ${x.clientes} clientes`;
        return `<article class="vs-v jf-v ${abierto ? 'open' : ''} ${x.visitas ? '' : 'vacio'}" data-sup="${esc(f.s.k)}">
          <button type="button" class="vs-v-head" aria-expanded="${abierto}">
            <span class="vs-v-info">
              <span class="vs-v-n">${esc(lbl(f.s.k))} · ${esc(f.s.n.split(' ').length > 3 ? f.s.n.split(' ').slice(0, 1).concat(f.s.n.split(' ').slice(-2, -1)).join(' ') : f.s.n)}</span>
              <span class="vs-v-s">${esc(sub)}</span>
              <span class="vs-bar"><i class="good" style="width:${Math.round(x.enCli / maxE * 100)}%"></i></span>
            </span>
            <span class="jf-der"><b>${hm(x.enCli)}</b><small>en clientes</small>${x.cortas ? `<em>${x.cortas} cortas</em>` : ''}</span>
          </button>
          <div class="vs-v-body">${abierto && x.visitas ? (esDia ? detalleDia(x) : detalleMes(x)) : abierto ? '<p class="vs-nada">Sin marcaciones.</p>' : ''}</div>
        </article>`; }).join('')}
      ${VACANTES.length ? `<p class="tv-note">Solo se cuentan supervisores activos. No se incluyen ${VACANTES.length === 1 ? 'el vacante' : 'los vacantes'}: ${esc(VACANTES.join(', '))} (se cambia en vendedores.js).</p>` : ''}
      <p class="tv-note">Tiempo en clientes = desde que el supervisor marca la entrada hasta la salida de cada cliente. Las visitas de menos de ${VISITA_CORTA_MINUTOS} minutos se marcan como cortas.</p>
    </div>`;
    box.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => { ui.modo = b.dataset.modo; ui.abierto = ''; pintar(); });
    box.querySelectorAll('[data-dia]').forEach(b => b.onclick = () => { ui.dia = b.dataset.dia; pintar(); });
    box.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { ui.modo = 'dia'; ui.dia = b.dataset.ir; pintar(); window.scrollTo({top: 0, behavior: 'smooth'}); });
    box.querySelectorAll('.jf-v .vs-v-head').forEach(b => b.onclick = () => { const k = b.closest('.jf-v').dataset.sup; ui.abierto = ui.abierto === k ? '' : k; pintar(); });
    const on = box.querySelector('.vs-dchip.on'); if (on) on.scrollIntoView({inline: 'center', block: 'nearest'});
  }

  function cargar(){
    if (estado === 'ok' || estado === 'cargando') return;
    estado = 'cargando'; pintar();
    cargarDatos().then(() => { estado = 'ok'; pintar(); }).catch(e => { estado = 'error'; error = e.message || String(e); pintar(); });
  }
  document.addEventListener('click', e => {
    if (!e.target.closest || !e.target.closest('#jefaturaView [data-actualizar]')) return;
    window.Archivos.olvidar(); estado = 'sin-cargar'; cargar();
  });
  let cargaJ = null;
  window.Jefatura = {
    mostrar(){ cargar(); pintar(); },
    // Para los avisos de jefatura: resumen del último día con marcaciones
    async resumenUltimo(){
      if (estado !== 'ok'){ if (!cargaJ) cargaJ = cargarDatos().then(() => { estado = 'ok'; }); await cargaJ; }
      // último día completo (el de hoy cuenta recién después de las 17 h)
      const ds = DATES.filter(x => x !== HOY || new Date().getHours() >= 17); const d = ds[ds.length - 1]; if (!d) return null;
      return {dia: d, largo: largo(d), filas: SUPS.map(s => ({k: s.k, n: s.n, x: resumen(s.k, new Set([d]))}))};
    },
    hm
  };
})();
