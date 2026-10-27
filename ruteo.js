// =====================================================================
//  RUTEO QUE SE ACTUALIZA SOLO
// ---------------------------------------------------------------------
//  Cuando cambia el ruteo, exportá del sistema y subí a GitHub (página
//  principal, Agregar archivo > Subir archivos), con el nombre que traigan:
//   1) "Detalle de ruteo por carteras"            -> clientes y días
//   2) "Subcliente por Visita latitud y longitud"  -> GPS de cada cliente
//   3) El padrón de clientes (Subcliente, PM, LP)  -> lista de precios y PM
//  La app reconoce cada Excel y arma el ruteo nuevo sola. Si un archivo
//  no cambió, no hace falta volver a subirlo.
//
//  Nombre que se muestra para cada supervisor (opcional):
// =====================================================================

const NOMBRES_SUPERVISORES = {
  'TR12': 'TR12 Aygas',
  'TR13': 'TR13 Centro',
  'TR15': 'TR15 Itauguá',
  'TR16': 'TR16 Caacupé',
  'TR17': 'TR17 Norte',
  'TR18': 'TR18-19 Paraguarí'
};


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ
// ---------------------------------------------------------------------
(function (global) {
  const CLAVE = 'ruteoTR1_ruteoExcel_v1';
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const CODE_RX = /^\s*(\d+)\s*-\s*(\d+)\s*-?\s*/;
  const DIAS = {lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb'};
  const ORDEN = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'S/Cal'];
  const pad = n => String(n).padStart(2, '0');

  // Primera hoja con estas columnas: devuelve filas como objetos {columna: valor}
  function tabla(XLSX, wb, pide){
    for (const sn of wb.SheetNames){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: true, defval: null, blankrows: false});
      for (let i = 0; i < Math.min(rows.length, 30); i++){
        const h = (rows[i] || []).map(norm);
        const idx = {};
        for (const [k, test] of Object.entries(pide)){ const j = h.findIndex(test); if (j >= 0) idx[k] = j; }
        if (Object.keys(pide).every(k => k in idx || k.startsWith('_'))){
          return rows.slice(i + 1).map(r => { const o = {}; for (const k in idx) o[k] = r[idx[k]]; return o; });
        }
      }
    }
    return null;
  }
  const codigo = s => { const m = String(s || '').match(CODE_RX); return m ? m[1] + '-' + m[2] : ''; };
  const nombre = s => String(s || '').replace(CODE_RX, '').trim();
  function dia(desc){
    const t = norm(desc);
    if (/sin calendario/.test(t)) return 'S/Cal';
    const k = Object.keys(DIAS).find(d => t.startsWith(d) || t.includes(d));
    return k ? DIAS[k] : 'S/Cal';
  }
  const titulo = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());

  /**
   * Arma los datos de la app a partir de los Excel.
   * libros: {ruteo, gps, padron} (libros de XLSX ya abiertos; gps y padron pueden faltar)
   * base: datos anteriores (para conservar el GPS de clientes que no vengan en el Excel)
   */
  function construir(XLSX, libros, base, fecha){
    const R = tabla(XLSX, libros.ruteo, {vend: h => h === 'vendedor', desc: h => h === 'desc vendedor', visita: h => h === 'desc visita', ciudad: h => h === 'ciudad', sub: h => h.includes('subcliente')});
    if (!R || !R.length) throw new Error('El Excel de ruteo no tiene las columnas Vendedor, Desc vendedor, Desc visita, Ciudad y Subcliente');
    // GPS
    const gps = new Map();
    if (libros.gps){
      const G = tabla(XLSX, libros.gps, {sub: h => h.includes('subcliente'), lat: h => h === 'latitud', lon: h => h === 'longitud'}) || [];
      G.forEach(g => { const c = codigo(g.sub), la = +g.lat, lo = +g.lon; if (c && la && lo && !gps.has(c) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) gps.set(c, [la, lo]); });
    }
    if (base && base.carteras) base.carteras.forEach(c => c.cl.forEach(cl => { if (cl[6] && typeof cl[4] === 'number' && !gps.has(cl[6])) gps.set(cl[6], [cl[4], cl[5]]); }));
    // Padrón: PM, LP y supervisor
    const pad_ = new Map(), supDeVend = new Map();
    if (libros.padron){
      const P = tabla(XLSX, libros.padron, {sub: h => h.includes('subcliente'), pm: h => h === 'pm', lp: h => h === 'lp', _v4: h => /nivel 4/.test(h), _v3: h => /nivel 3/.test(h)}) || [];
      P.forEach(p => {
        const c = codigo(p.sub); if (!c) return;
        pad_.set(c, {lp: p.lp == null ? '' : String(p.lp).trim(), pm: p.pm == null ? '' : String(p.pm).trim()});
        const v = (String(p._v4 || '').match(/^\s*([A-Z]{2}\d{4})/) || [])[1], s = String(p._v3 || '').match(/^\s*([A-Z]{2}\d{2})\s*-\s*(.*)$/);
        if (v && s){ const m = supDeVend.get(v) || new Map(); const k = s[1] + '|' + s[2].trim(); m.set(k, (m.get(k) || 0) + 1); supDeVend.set(v, m); }
      });
    }
    // Supervisor anterior de cada cartera (por si no viene en el padrón)
    const supBase = new Map(); if (base && base.carteras) base.carteras.forEach(c => supBase.set(c.vc, c.sup));
    const supNombre = new Map(); if (base && base.sups) base.sups.forEach(s => supNombre.set(s.k, s.n || ''));

    const carts = new Map();
    R.forEach(r => {
      const vc = String(r.vend || '').trim().toUpperCase(); const c = codigo(r.sub);
      if (!/^[A-Z]{2}\d{4}$/.test(vc) || !r.sub) return;
      if (!carts.has(vc)){
        const d = String(r.desc || ''), m = d.match(/^\s*\w+\s*-\s*(.*?)\s*\((.*)\)\s*$/);
        carts.set(vc, {vc, vn: (m ? m[1] : d.replace(/^\s*\w+\s*-\s*/, '')).trim().toUpperCase(), vz: m ? m[2].trim() : '', cli: new Map()});
      }
      const k = c || norm(r.sub);
      const cart = carts.get(vc);
      if (!cart.cli.has(k)) cart.cli.set(k, {ciudad: String(r.ciudad || '').trim().toUpperCase(), nombre: nombre(r.sub), code: c, dias: new Set()});
      cart.cli.get(k).dias.add(dia(r.visita));
    });

    const sups = new Map();
    const carteras = [...carts.values()].sort((a, b) => a.vc.localeCompare(b.vc)).map(ct => {
      // supervisor: el más común en el padrón; si no, el anterior; si no, por el código (TR1338 -> TR13)
      let sup = '', sn = '';
      const m = supDeVend.get(ct.vc);
      if (m){ const [k] = [...m.entries()].sort((a, b) => b[1] - a[1])[0]; [sup, sn] = k.split('|'); }
      else if (supBase.has(ct.vc)){ sup = supBase.get(ct.vc); sn = supNombre.get(sup) || ''; }
      else sup = ct.vc.slice(0, 4);
      if (!sups.has(sup)) sups.set(sup, sn);
      const cl = [...ct.cli.values()].map(x => {
        const g = gps.get(x.code), p = pad_.get(x.code) || {};
        const dias = ORDEN.filter(d => x.dias.has(d)).join(', ');
        return [x.ciudad, '', x.nombre, dias, g ? g[0] : null, g ? g[1] : null, x.code, p.lp || '', p.pm || ''];
      }).sort((a, b) => a[0].localeCompare(b[0], 'es') || a[2].localeCompare(b[2], 'es'));
      return {sup, vc: ct.vc, vn: ct.vn, vz: ct.vz, cl};
    });
    const lista = [...sups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, n]) => ({k, p: NOMBRES_SUPERVISORES[k] || (k + ' ' + titulo(n.replace(/^(ST|SP|SCC|GC)\.\s*/i, ''))), n}));
    const f = fecha || new Date();
    return {fecha: pad(f.getDate()) + '/' + pad(f.getMonth() + 1) + '/' + f.getFullYear(), ts: f.getTime(), sups: lista, carteras};
  }

  // Aplica los nombres de vendedores.js
  function nombres(d){
    const V = (typeof VENDEDORES !== 'undefined' ? VENDEDORES : global.VENDEDORES) || {};
    d.carteras.forEach(c => { const n = V[c.vc]; if (typeof n === 'string' && n.trim()) c.vn = n.trim().toUpperCase(); });
    return d;
  }

  global.RuteoExcel = {construir, nombres};
  if (typeof window === 'undefined') return;   // (uso fuera del navegador)

  // 1) Al abrir: el ruteo más nuevo que ya leyó este celular (o el de data.js)
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch(e){}
  const baseTs = (global.APP_DATA && global.APP_DATA.ts) || 0;
  if (guardado && guardado.datos && guardado.datos.ts > baseTs) global.APP_DATA = guardado.datos;
  nombres(global.APP_DATA);

  // 2) Después de abrir: ¿hay Excel de ruteo, GPS o padrón más nuevos en GitHub?
  async function revisar(){
    if (!global.Archivos || !global.cargarExcelLib) return;
    const [ru] = await global.Archivos.buscar('ruteo', 1);
    if (!ru) return;
    const [gp] = await global.Archivos.buscar('gps', 1);
    const [pa] = await global.Archivos.buscar('padron', 1);
    const firma = [ru, gp, pa].map(f => f ? f.sha : '-').join('|');
    if (guardado && guardado.firma === firma) return;
    // si data.js ya trae un ruteo igual o más nuevo que estos Excel, no hace falta rearmarlo
    const fechaEx = Math.max(...[ru, gp, pa].filter(Boolean).map(f => f.fecha ? f.fecha.getTime() : 0));
    if (!guardado && baseTs >= fechaEx) return;
    const XLSX = await global.cargarExcelLib();
    const abrir = async f => f ? global.abrirLibro(XLSX, await global.Archivos.bajar(f)) : null;
    const libros = {ruteo: await abrir(ru), gps: await abrir(gp), padron: await abrir(pa)};
    const datos = construir(XLSX, libros, global.APP_DATA, ru.fecha);
    try { localStorage.setItem(CLAVE, JSON.stringify({firma, datos})); } catch(e){}
    const cambio = JSON.stringify(nombres(JSON.parse(JSON.stringify(datos))).carteras) !== JSON.stringify(global.APP_DATA.carteras);
    if (cambio){
      // se recarga una sola vez para mostrar el ruteo nuevo
      let ya = ''; try { ya = sessionStorage.getItem('ruteoTR1_recargado'); } catch(e){}
      if (ya !== firma){ try { sessionStorage.setItem('ruteoTR1_recargado', firma); if (!document.getElementById('portada')) sessionStorage.setItem('ruteoTR1_saltarPortada', '1'); } catch(e){} location.reload(); }
    }
  }
  window.addEventListener('load', () => setTimeout(() => revisar().catch(() => {}), 600));
})(typeof window !== 'undefined' ? window : globalThis);
