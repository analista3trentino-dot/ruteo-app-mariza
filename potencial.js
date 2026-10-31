// =====================================================================
//  POTENCIAL DE RUTA (se ve en la pestaña Ruta)
// ---------------------------------------------------------------------
//  En cada cliente aparece cuánto puede comprar en el mes (potencial)
//  y cuánto ya compró. Arriba de la lista, el resumen del día elegido.
//
//  CÓMO ACTUALIZAR:
//   - Potencial: subí a GitHub el Excel "Potencial de Ruta de Venta"
//     (con la hoja "Datos": Subcliente, Potencial y los meses).
//   - Lo que ya compró sale del Excel de ventas que subís cada día.
//     Si no hay, se usa el mes que trae el Excel de potencial.
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
    const hD = wb.SheetNames.find(n => /datos/i.test(n)), hH = wb.SheetNames.find(n => /hist/i.test(norm(n)));
    const pide = [hD, hH].filter(Boolean);
    wb = XLSX.read(buf, pide.length ? {type: 'array', sheets: pide} : {type: 'array'});
    const out = {mes: null, por: {}, hist: {}};
    let conValores = 0;
    // 1) Hoja "Datos": potencial ya calculado por el Excel
    for (const sn of wb.SheetNames.filter(n => n !== hH)){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: true, defval: null, blankrows: false});
      let listo = false;
      for (let i = 0; i < Math.min(rows.length, 20) && !listo; i++){
        const h = (rows[i] || []).map(norm);
        const cP = h.indexOf('potencial'); if (cP < 0) continue;
        let cS = h.indexOf('subcliente'); if (cS < 0) cS = h.findIndex(x => x.includes('subcliente'));
        if (cS < 0) continue;
        const meses = h.map((x, j) => [MES_I(x), j]).filter(([m]) => m >= 0);
        const ult = meses.length ? meses[meses.length - 1] : null;
        if (ult) out.mes = ult[0];
        for (let k = i + 1; k < rows.length; k++){
          const r = rows[k]; if (!r) continue;
          const m = String(r[cS] == null ? '' : r[cS]).match(CODE_RX); if (!m) continue;
          const c = m[1] + '-' + m[2]; if (codigos && !codigos.has(c)) continue;
          if (typeof r[cP] !== 'number') continue;   // sin valor calculado (el Excel no se guardó con los cálculos)
          conValores++;
          const p = Math.max(0, r[cP]), v = ult && typeof r[ult[1]] === 'number' ? r[ult[1]] : 0;
          const o = out.por[c]; if (o){ o[0] = Math.max(o[0], p); o[1] = Math.max(o[1], v); } else out.por[c] = [p, v];
        }
        listo = true;
      }
    }
    // 2) Hoja "Historico": el potencial es el 2º mejor mes de los meses anteriores al actual (igual que la fórmula del Excel)
    if (hH){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[hH], {header: 1, raw: true, defval: null, blankrows: false});
      for (let i = 0; i < Math.min(rows.length, 20); i++){
        const h = (rows[i] || []).map(norm);
        const meses = h.map((x, j) => [MES_I(x), j]).filter(([m]) => m >= 0);
        if (meses.length < 2) continue;
        const actual = meses[meses.length - 1], antes = meses.slice(0, -1);
        if (out.mes === null) out.mes = actual[0];
        for (let k = i + 1; k < rows.length; k++){
          const r = rows[k]; if (!r) continue;
          const cod = r.map(x => String(x == null ? '' : x).trim()).find(x => /^\d+-\d+$/.test(x)); if (!cod) continue;
          if (codigos && !codigos.has(cod)) continue;
          // meses con venta, de mayor a menor: el 2º; si compró un solo mes, ese mes
          const vs = antes.map(([, j]) => typeof r[j] === 'number' ? r[j] : 0).filter(v => v > 0).sort((a, b) => b - a);
          out.hist[cod] = [vs.length > 1 ? vs[1] : (vs[0] || 0), typeof r[actual[1]] === 'number' ? r[actual[1]] : 0];
        }
        break;
      }
    }
    return (conValores || Object.keys(out.hist).length) ? out : null;
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
  let POT = null, VEN = null, fPot = null, fVen = null, ALIAS = {};
  async function cargarDatos(){
    const XLSX = await window.cargarExcelLib();
    const RU = window.RUTEO;
    const codigos = new Set(); ALIAS = {}; RU.carteras.forEach(c => c.cl.forEach(cl => { if (cl[6]) codigos.add(cl[6]); if (cl[9]){ codigos.add(cl[9]); ALIAS[cl[6]] = cl[9]; } }));
    const [fp] = await window.Archivos.buscar('potencial', 1);
    if (!fp) throw new Error('sin-potencial');
    const kP = 'ruteoTR1_pot2_' + fp.sha;
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
  // c = código del cliente en el ruteo; los clientes de cadena usan su código entre paréntesis para ventas
  const desde = (obj, c) => obj[c] || (ALIAS[c] && obj[ALIAS[c]]);
  const ventaDe = c => usaVentas() ? (VEN.por[c] || VEN.por[ALIAS[c]] || 0) : ((desde(POT.por, c) || desde(POT.hist || {}, c) || [0, 0])[1]);
  const potDe = c => ((desde(POT.por, c) || desde(POT.hist || {}, c) || [0, 0])[0]);

  // Cuántos días de ese tipo (ej. lunes) quedan en el mes, contando hoy
  function quedan(dia){
    const hoy = new Date(), m = hoy.getMonth(); let n = 0;
    for (let d = new Date(hoy.getFullYear(), m, hoy.getDate()); d.getMonth() === m; d.setDate(d.getDate() + 1)) if (d.getDay() === WD[dia]) n++;
    return n;
  }

  let promesa = null;
  const P = window.Potencial = {
    listo: false, error: '',
    cargar(){
      if (!promesa) promesa = cargarDatos().then(() => { P.listo = true; }).catch(e => { P.error = e.message || String(e); });
      return promesa;
    },
    potDe: c => P.listo ? Math.max(0, potDe(c)) : 0,
    ventaDe: c => P.listo ? Math.max(0, ventaDe(c)) : 0,
    tiene: c => P.listo && !!(desde(POT.por, c) || desde(POT.hist || {}, c)),
    mes: () => MESES[mesVenta()] || '',
    fuente: () => usaVentas() ? 'Compras al ' + (fVen ? fVen.toLocaleDateString('es-PY', {day: 'numeric', month: 'short'}) : '—') : 'Compras de ' + (MESES[POT.mes] || '—'),
    quedan,
    destacado: POTENCIAL_MINIMO_DESTACADO
  };
})();
