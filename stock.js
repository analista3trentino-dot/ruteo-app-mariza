// =====================================================================
//  STOCK
// ---------------------------------------------------------------------
//  Subí a GitHub el reporte de stock tal como sale del sistema (PDF o
//  Excel, con el nombre que traiga, ej. "Stock_Asuncion_Octubre_29.pdf").
//  La app usa el más nuevo y lo compara con el anterior para avisar:
//   - Reposición: productos que no tenían stock y ahora sí.
//   - Sin stock: productos que tenían y ya no.
//  En la lista de precios (botón LP) cada producto muestra su stock.
//  Un producto que no figura en el reporte se toma como SIN STOCK.
// =====================================================================


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ
// ---------------------------------------------------------------------
(function () {
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  let libPdf = null;
  function cargarPdf(){
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (libPdf) return libPdf;
    libPdf = new Promise((ok, mal) => {
      const s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js';
      s.onload = () => { if (!window.pdfjsLib) return mal(new Error('No se pudo cargar el lector de PDF')); window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(window.pdfjsLib); };
      s.onerror = () => { libPdf = null; mal(new Error('No se pudo cargar el lector de PDF')); };
      document.head.appendChild(s);
    });
    return libPdf;
  }
  // Cantidad "198,862" o "198.862" (miles) -> 198862; "12,5" -> 12.5
  function cant(t){
    t = String(t).trim();
    if (/^-?\d{1,3}([.,]\d{3})+$/.test(t)) return +t.replace(/[.,]/g, '');
    return +t.replace(/\./g, '').replace(',', '.') || 0;
  }

  // PDF: cada renglón "5792  5792-RESIDENCE FOSFORO ...  RESIDENCE  CUIDADO DEL HOG  198,862"
  async function leerPdf(buf){
    const pdfjs = await cargarPdf();
    const doc = await pdfjs.getDocument({data: new Uint8Array(buf.slice(0))}).promise;   // copia: pdf.js se queda con el original
    const out = {};
    for (let p = 1; p <= doc.numPages; p++){
      const page = await doc.getPage(p), tc = await page.getTextContent();
      const ancho = page.view ? page.view[2] : 600;
      const its = tc.items.map(i => ({s: String(i.str || '').trim(), x: i.transform[4], y: i.transform[5]})).filter(i => i.s);
      // artículos ("8365-8 PM WHISKY...") y cantidades (columna de la derecha); se juntan por altura
      const arts = its.filter(i => /^\d+-\S/.test(i.s) && i.x < ancho * 0.6);
      const cants = its.filter(i => /^-?\d[\d.,]*$/.test(i.s) && i.x > ancho * 0.6);
      const usadas = new Set();
      arts.forEach(a => {
        let mejor = -1, dist = 15;
        cants.forEach((c, k) => { if (usadas.has(k)) return; const d = Math.abs(c.y - a.y); if (d < dist){ dist = d; mejor = k; } });
        if (mejor < 0) return;
        usadas.add(mejor);
        const m = a.s.match(/^(\d+)-(.*)$/); if (!m) return;
        const cod = m[1];
        out[cod] = [(out[cod] ? out[cod][0] : 0) + cant(cants[mejor].s), m[2].trim()];
      });
    }
    return out;
  }
  // Excel: columnas de código y cantidad
  function leerExcel(XLSX, buf){
    const wb = window.abrirLibro ? window.abrirLibro(XLSX, buf) : XLSX.read(buf, {type: 'array'});
    for (const sn of wb.SheetNames){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: true, defval: null, blankrows: false});
      for (let i = 0; i < Math.min(rows.length, 30); i++){
        const h = (rows[i] || []).map(norm);
        const cC = h.findIndex(x => x === 'codigo' || x === 'cod articulo' || x === 'cod'), cQ = h.findIndex(x => /^cant|stock|existencia|saldo/.test(x));
        if (cC < 0 || cQ < 0) continue;
        const cD = h.findIndex(x => /articulo|descripcion|desc/.test(x) && x !== 'cod articulo');
        const out = {};
        for (let k = i + 1; k < rows.length; k++){
          const r = rows[k]; if (!r || r[cC] == null) continue;
          const c = String(r[cC]).trim().replace(/-.*$/, ''); if (!/^\d+$/.test(c)) continue;
          const q = typeof r[cQ] === 'number' ? r[cQ] : cant(r[cQ]);
          out[c] = [(out[c] ? out[c][0] : 0) + q, cD >= 0 ? String(r[cD] || '').replace(/^\d+-/, '').trim() : ''];
        }
        return out;
      }
    }
    return null;
  }

  async function leer(f){
    const k = 'ruteoTR1_stock2_' + f.sha;
    try { const c = JSON.parse(localStorage.getItem(k) || 'null'); if (c) return c; } catch(e){}
    const buf = await window.Archivos.bajar(f);
    const esPdf = /\.pdf$/i.test(f.nombre) || new TextDecoder().decode(new Uint8Array(buf.slice(0, 5))) === '%PDF-';
    const items = esPdf ? await leerPdf(buf) : leerExcel(await window.cargarExcelLib(), buf);
    if (!items || !Object.keys(items).length) throw new Error('No se pudo leer el stock de ' + f.nombre);
    try { localStorage.setItem(k, JSON.stringify(items)); } catch(e){}
    return items;
  }

  let promesa = null;
  const S = window.Stock = {
    listo: false, error: '', actual: null, anterior: null, fecha: null, fechaAnt: null, archivo: '',
    cargar(){
      if (!promesa) promesa = (async () => {
        const fs = await window.Archivos.buscar('stock', 2);
        if (!fs.length) throw new Error('sin-stock');
        S.actual = await leer(fs[0]); S.fecha = fs[0].fecha; S.archivo = fs[0].nombre;
        if (fs[1]){ try { S.anterior = await leer(fs[1]); S.fechaAnt = fs[1].fecha; } catch(e){ S.anterior = null; } }
        S.listo = true;
      })().catch(e => { S.error = e.message || String(e); });
      return promesa;
    },
    // cantidad en stock de un código (0 si no figura)
    de: cod => S.listo ? ((S.actual[String(cod)] || [0])[0]) : null,
    // Cambios contra el reporte anterior. "codigos": solo esos productos (los de las listas de precios)
    cambios(codigos){
      if (!S.listo || !S.anterior) return null;
      const ok = c => !codigos || codigos.has(c);
      const repo = [], sin = [];
      new Set([...Object.keys(S.actual), ...Object.keys(S.anterior)]).forEach(c => {
        if (!ok(c)) return;
        const a = (S.actual[c] || [0])[0], b = (S.anterior[c] || [0])[0];
        const desc = (S.actual[c] || S.anterior[c] || [0, ''])[1];
        if (a > 0 && b <= 0) repo.push({c, desc, q: a});
        if (a <= 0 && b > 0) sin.push({c, desc});
      });
      return {repo, sin};
    }
  };
})();
