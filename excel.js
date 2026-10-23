// =====================================================================
//  LECTOR DE EXCEL
// ---------------------------------------------------------------------
//  Permite que la app lea directamente los archivos .xlsx subidos a
//  GitHub (clientes top y listas de precios). No hace falta modificar.
// =====================================================================
(function () {
  let libPromise = null;

  // Carga la librería de Excel solo cuando se necesita
  function cargarLibreria() {
    if (window.XLSX && window.XLSX.read) return Promise.resolve(window.XLSX);
    if (libPromise) return libPromise;
    libPromise = new Promise((ok, mal) => {
      const s = document.createElement('script');
      s.src = 'xlsx.mini.min.js?v=0.18.5';
      s.onload = () => (window.XLSX && window.XLSX.read) ? ok(window.XLSX) : mal(new Error('Librería de Excel no disponible'));
      s.onerror = () => { libPromise = null; mal(new Error('No se pudo cargar la librería de Excel')); };
      document.head.appendChild(s);
    });
    return libPromise;
  }

  // Abre el archivo: .xlsx normal, o .xls exportado del sistema (que por dentro es una tabla web)
  function abrirLibro(XLSX, buf) {
    const ini = new Uint8Array(buf.slice(0, 512));
    let txt = ''; for (const b of ini) txt += String.fromCharCode(b);
    if (/^\s*(\ufeff|\xef\xbb\xbf)?\s*</.test(txt) || /<(html|table)/i.test(txt)) {
      const doc = new DOMParser().parseFromString(new TextDecoder('utf-8').decode(buf), 'text/html');
      const hojas = { SheetNames: [], Sheets: {} };
      doc.querySelectorAll('table').forEach((tb, n) => {
        const aoa = [...tb.rows].map(tr => [...tr.cells].map(td => td.textContent.trim()));
        const nom = 'Hoja' + (n + 1);
        hojas.SheetNames.push(nom); hojas.Sheets[nom] = XLSX.utils.aoa_to_sheet(aoa);
      });
      return hojas;
    }
    return XLSX.read(buf, { type: 'array' });
  }

  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  /**
   * Lee un .xlsx o .xls y devuelve { filas, fecha }.
   * - columnas: nombres de columnas que deben estar en la fila de títulos
   *   (se busca esa fila automáticamente, aunque haya filtros arriba).
   * - filas: lista de objetos { columna: valor }.
   * - fecha: última modificación del archivo según el servidor (si existe).
   */
  async function leerExcel(url, columnas) {
    const [XLSX, resp] = await Promise.all([
      cargarLibreria(),
      fetch(url, { cache: 'no-cache' })
    ]);
    if (!resp.ok) throw new Error(`No se encontró el archivo "${url}"`);
    const buf = await resp.arrayBuffer();
    const wb = abrirLibro(XLSX, buf);
    const req = columnas.map(norm);
    for (const nombreHoja of wb.SheetNames) {
      const m = XLSX.utils.sheet_to_json(wb.Sheets[nombreHoja], { header: 1, raw: true, defval: '' });
      for (let i = 0; i < Math.min(m.length, 25); i++) {
        const h = m[i].map(norm);
        if (req.every(c => h.includes(c))) {
          const idx = {}; h.forEach((c, j) => { if (c && !(c in idx)) idx[c] = j; });
          const filas = [];
          for (let k = i + 1; k < m.length; k++) {
            const r = m[k]; if (!r || !r.some(v => String(v).trim() !== '')) continue;
            const o = {}; for (const c in idx) o[c] = String(r[idx[c]] == null ? '' : r[idx[c]]).trim();
            filas.push(o);
          }
          const lm = resp.headers.get('last-modified');
          return { filas, fecha: lm ? new Date(lm) : null };
        }
      }
    }
    throw new Error(`El archivo "${url}" no tiene las columnas: ${columnas.join(', ')}`);
  }

  window.leerExcel = leerExcel;
  window.cargarExcelLib = cargarLibreria;
  window.abrirLibro = abrirLibro;
  window.normCol = norm;
})();
