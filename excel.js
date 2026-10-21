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

  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  /**
   * Lee un .xlsx y devuelve { filas, fecha }.
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
    const wb = XLSX.read(buf, { type: 'array' });
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
  window.normCol = norm;
})();
