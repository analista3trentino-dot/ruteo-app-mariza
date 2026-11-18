// =====================================================================
//  EXPORTAR POR SUPERVISOR (pantalla Control de Jefatura)
// ---------------------------------------------------------------------
//  - Fotos en PowerPoint: una diapositiva por foto (fichas TOP, fotos y competencia),
//    con cliente, vendedor, quién la envió, fecha y comentario. Portada y resumen al final.
//  - Visitas en Excel: resumen por vendedor + detalle por cliente y día.
//  Se elige el supervisor (o todos) y el período. Los archivos se arman en el celular/PC.
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const URL_E = (typeof FOTOS_URL !== 'undefined' ? String(FOTOS_URL) : '').trim();
  const CLAVE_E = typeof FOTOS_CLAVE !== 'undefined' ? String(FOTOS_CLAVE) : '';
  const p2 = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const deIso = s => { const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
  const nom = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
  const nom2 = s => nom(s).split(' ').slice(0, 2).join(' ');
  const corto = f => { const d = deIso(f); return d ? DIAS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + '/' + (d.getMonth() + 1) : f; };
  const idFoto = u => (String(u || '').match(/\/d\/([\w-]+)/) || String(u || '').match(/[?&]id=([\w-]+)/) || [])[1] || '';
  const cliNom = s => String(s || '').replace(/\s*\(\d+-\d+\)\s*$/, '');
  const RU = () => window.RUTEO || {}, F = () => window.Fotos;
  const nombreSup = k => (RU().nombreSup && RU().nombreSup(k)) || '';
  const quien = r => r['Cargado por'] ? String(r['Cargado por']).replace(/^Sup\.\s*/i, 'SPV ') : 'SPV ' + nom2(nombreSup(r.Supervisor) || r.Supervisor);

  // ---------- Períodos ----------
  function periodo(k){
    const h = new Date(); h.setHours(0, 0, 0, 0);
    const lun = new Date(h); lun.setDate(h.getDate() - ((h.getDay() + 6) % 7));
    if (k === 'sem') return {d: iso(lun), h: iso(h), t: 'Esta semana'};
    if (k === 'semp'){ const a = new Date(lun); a.setDate(a.getDate() - 7); const b = new Date(lun); b.setDate(b.getDate() - 2); return {d: iso(a), h: iso(b), t: 'Semana pasada'}; }
    if (k === 'mes') return {d: iso(new Date(h.getFullYear(), h.getMonth(), 1)), h: iso(h), t: 'Este mes'};
    const a = new Date(h.getFullYear(), h.getMonth() - 1, 1), b = new Date(h.getFullYear(), h.getMonth(), 0);
    return {d: iso(a), h: iso(b), t: 'Mes pasado'};
  }
  const rangoTxt = P => { const a = deIso(P.d), b = deIso(P.h); return a.getMonth() === b.getMonth() ? `${a.getDate()} al ${b.getDate()} de ${MESES[b.getMonth()]}` : `${a.getDate()} de ${MESES[a.getMonth()]} al ${b.getDate()} de ${MESES[b.getMonth()]}`; };

  // ---------- Tarjeta en Control ----------
  const ui = {sup: '', per: 'sem', vc: 'TODAS'};
  const esSup = () => RU().modo === 'supervisor' && !!RU().miSup;
  function tarjeta(box){
    if (!box) return;
    const r = RU(), sups = (r.sups || []).filter(s => /^TR/.test(s.k));
    if (esSup()) ui.sup = r.miSup;   // el supervisor exporta solo su equipo
    if (!ui.sup) ui.sup = (r.getSpv && r.getSpv() !== 'TODOS' && r.getSpv() !== 'MIXTOS') ? r.getSpv() : 'TODOS';
    const carts = ui.sup === 'TODOS' ? [] : (r.carteras || []).filter(c => c.sup === ui.sup && /^TR/.test(c.vc) && !/VACANTE/i.test(c.vn));
    if (ui.vc !== 'TODAS' && !carts.some(c => c.vc === ui.vc)) ui.vc = 'TODAS';
    box.innerHTML = `<section class="ct-card ex" id="ctExportar">
      <div class="ex-cab"><span class="ct-ic top">📤</span><div><h3>${esSup() ? 'Exportar mi equipo' : 'Exportar por supervisor'}</h3><p>Fotos en PowerPoint y visitas en Excel</p></div></div>
      ${esSup() ? '' : `<div class="ex-lbl">Supervisor</div>
      <div class="ex-chips" data-g="sup">${[['TODOS', 'Todos']].concat(sups.map(s => [s.k, nom2(nombreSup(s.k)) || s.p])).map(([k, t]) => `<button type="button" data-v="${esc(k)}" class="${ui.sup === k ? 'on' : ''}">${esc(t)}${k !== 'TODOS' ? `<small>${esc((r.supLabel || {})[k] || k)}</small>` : ''}</button>`).join('')}</div>`}
      ${carts.length ? `<div class="ex-lbl">Cartera</div>
      <div class="ex-chips" data-g="vc">${[['TODAS', esSup() ? 'Todo mi equipo' : 'Todas', '']].concat(carts.map(c => [c.vc, nom2(c.vn), c.vc])).map(([k, t, sm]) => `<button type="button" data-v="${esc(k)}" class="${ui.vc === k ? 'on' : ''}">${esc(t)}${sm ? `<small>${esc(sm)}</small>` : ''}</button>`).join('')}</div>` : ''}
      <div class="ex-lbl">Período</div>
      <div class="ex-chips per" data-g="per">${['sem', 'semp', 'mes', 'mesp'].map(k => `<button type="button" data-v="${k}" class="${ui.per === k ? 'on' : ''}">${esc(periodo(k).t)}</button>`).join('')}</div>
      <p class="ex-rango">Del ${esc(rangoTxt(periodo(ui.per)))}</p>
      <div class="ex-bts">
        <button type="button" class="ex-bt ppt" data-ex="ppt"><span>📊</span><b>Fotos en PowerPoint</b><small>Una diapositiva por foto</small></button>
        <button type="button" class="ex-bt xls" data-ex="xls"><span>📗</span><b>Visitas en Excel</b><small>Resumen y detalle por cliente</small></button>
      </div>
      <p class="ex-nota">${ui.sup === 'TODOS' ? 'Con "Todos" sale un solo archivo, separado por supervisor.' : ui.vc !== 'TODAS' ? 'Sale un archivo solo con esta cartera.' : esSup() ? 'Sale un archivo con todas las carteras de tu equipo.' : 'Sale un archivo solo con el equipo de este supervisor.'}</p>
    </section>`;
    box.querySelectorAll('[data-g] button').forEach(b => b.onclick = () => { const g = b.parentNode.dataset.g; ui[g] = b.dataset.v; if (g === 'sup') ui.vc = 'TODAS'; tarjeta(box); });
    box.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => (b.dataset.ex === 'ppt' ? ppt : excel)().catch(e => progreso(null, 'No se pudo armar el archivo: ' + (e.message || e))));
  }

  // ---------- Progreso ----------
  function progreso(p, txt){
    let c = $('exCapa');
    if (p === null && !txt){ if (c) c.remove(); document.body.classList.remove('fx-bloq'); return; }
    if (!c){ c = document.createElement('div'); c.id = 'exCapa'; c.className = 'ex-capa'; document.body.appendChild(c); document.body.classList.add('fx-bloq'); }
    const err = p === null;
    c.innerHTML = `<div class="ex-caja"><div class="ex-ic ${err ? 'err' : ''}">${err ? '⚠️' : p >= 1 ? '✅' : '⏳'}</div><b>${esc(txt)}</b>${err ? '' : `<div class="ex-barra"><i style="width:${Math.round((p || 0) * 100)}%"></i></div>`}${err ? '<button type="button" data-ok>Entendido</button>' : ''}</div>`;
    const ok = c.querySelector('[data-ok]'); if (ok) ok.onclick = () => progreso(null);
  }
  const listo = (txt) => { progreso(1, txt); setTimeout(() => progreso(null), 1600); };

  // ---------- Datos ----------
  function equipo(k){ const r = RU(); return (r.carteras || []).filter(c => (k === 'TODOS' ? /^TR/.test(c.sup) : c.sup === k) && (ui.vc === 'TODAS' || c.vc === ui.vc)); }
  function supsDe(k){ const r = RU(); return k === 'TODOS' ? (r.sups || []).filter(s => /^TR/.test(s.k)).map(s => s.k) : [k]; }
  function fotosDe(supK, P){
    const Fo = F(); if (!Fo) return [];
    const en = r => r.Fecha >= P.d && r.Fecha <= P.h && r.Supervisor === supK && (ui.vc === 'TODAS' || r.Vendedor === ui.vc);
    const gest = (Fo.gestion ? Fo.gestion() : []).filter(en);
    const out = [];
    (Fo.todasFotos ? Fo.todasFotos() : []).filter(en).forEach(r => {
      const id = idFoto(r.Enlace); if (!id) return;
      const g = gest.find(x => idFoto(x['Enlace foto']) === id);
      out.push({id, f: r.Fecha, h: r.Hora, tipo: r.Tipo === 'Reposición' ? 'Ficha TOP · Reposición' : 'Foto · ' + (r.Tipo || ''), cli: cliNom(r.Cliente), cod: r['Código'], vc: r.Vendedor, vn: r['Nombre vendedor'], de: quien(r),
        com: r.Comentario, extra: g ? [g.Marca + ' · ' + g['Categoría'], g.Respuesta, g['Caras tenemos'] !== '' && g['Caras tenemos'] != null ? `Tenemos ${g['Caras tenemos']} caras · faltan ${g['Caras faltan']}` : ''].filter(Boolean) : [], color: r.Tipo === 'Reposición' ? 'E8A10C' : '2E5BFF'});
    });
    (Fo.compeSemana && Fo.todasCompe ? Fo.todasCompe() : []).filter(en).forEach(r => {
      const id = idFoto(r['Enlace foto']); if (!id) return;
      out.push({id, f: r.Fecha, h: r.Hora, tipo: 'Competencia · ' + (r['Qué vio'] || ''), cli: cliNom(r.Cliente) || 'Sin cliente', vc: r.Vendedor, vn: r['Nombre vendedor'], de: 'Vendedor ' + nom2(r['Nombre vendedor']),
        com: r.Comentario, extra: [r['Empresa/Marca'] + (r.Producto ? ' · ' + r.Producto : ''), r['Precio Gs.'] ? 'Precio visto: Gs. ' + (+r['Precio Gs.']).toLocaleString('es-PY') : ''].filter(Boolean), color: 'D6336C'});
    });
    return out.sort((a, b) => (a.f + a.h).localeCompare(b.f + b.h));
  }
  // Las fotos se piden al script de Google de a 6 (vienen como texto base64)
  let scriptViejo = false;
  async function traerFotos(ids, avance){
    const out = {}, lotes = [];
    for (let i = 0; i < ids.length; i += 6) lotes.push(ids.slice(i, i + 6));
    let n = 0; scriptViejo = false;
    for (const l of lotes){
      if (!scriptViejo) try {
        const q = new URLSearchParams({clave: CLAVE_E, accion: 'fotos64', ids: l.join(',')});
        const ctl = window.AbortController ? new AbortController() : null, to = setTimeout(() => ctl && ctl.abort(), 90000);
        const j = await fetch(URL_E + '?' + q.toString(), {redirect: 'follow', signal: ctl ? ctl.signal : undefined}).then(r => r.json()).finally(() => clearTimeout(to));
        if (j && Array.isArray(j.fotos)) scriptViejo = true;   // el script de Google todavía no tiene la versión nueva
        else for (const id of Object.keys((j && j.fotos) || {})){ const x = j.fotos[id]; if (x && x.b64) out[id] = await achicar('data:' + (x.mime || 'image/jpeg') + ';base64,' + x.b64); }
      } catch(e){}
      n += l.length; avance(n / ids.length);
    }
    return out;
  }
  // Achica cada foto (máx. 1400 px) para que el PowerPoint no pese demasiado en el celular
  const achicar = src => new Promise(ok => { const i = new Image(); i.onload = () => { try { const k = Math.min(1, 1400 / Math.max(i.naturalWidth, i.naturalHeight)); if (k >= 1 && src.length < 900000) return ok(src); const c = document.createElement('canvas'); c.width = Math.round(i.naturalWidth * k); c.height = Math.round(i.naturalHeight * k); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', 0.8)); } catch(e){ ok(src); } }; i.onerror = () => ok(src); i.src = src; });
  // Descarga propia: deja el archivo disponible 60 s (en Android, si se borra enseguida, la descarga falla)
  const bajar = (blob, nombre) => { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = nombre; a.rel = 'noopener'; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 60000); };
  const medir = src => new Promise(ok => { const i = new Image(); i.onload = () => ok({w: i.naturalWidth, h: i.naturalHeight}); i.onerror = () => ok({w: 4, h: 3}); i.src = src; });
  const cargarScript = (src, test) => new Promise((ok, no) => { if (test()) return ok(); const s = document.createElement('script'); s.src = src; s.onload = () => test() ? ok() : no(new Error('librería')); s.onerror = () => no(new Error('No se pudo descargar la herramienta (revisá la señal).')); document.head.appendChild(s); });
  const aDataURL = src => fetch(src).then(r => r.blob()).then(b => new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); })).catch(() => '');

  // ---------- PowerPoint ----------
  async function ppt(){
    const P = periodo(ui.per), ks = supsDe(ui.sup);
    const grupos = ks.map(k => ({k, fotos: fotosDe(k, P)})).filter(g => g.fotos.length);
    const total = grupos.reduce((t, g) => t + g.fotos.length, 0);
    if (!total) return progreso(null, 'No hay fotos ' + (ui.vc !== 'TODAS' ? 'de la cartera ' + ui.vc : ui.sup === 'TODOS' ? 'de ningún supervisor' : 'de ' + (nom2(nombreSup(ui.sup)) || ui.sup)) + ' en ' + P.t.toLowerCase() + '.');
    progreso(0.02, 'Preparando el PowerPoint…');
    await cargarScript('pptxgen.bundle.js?v=3.12.0', () => !!window.PptxGenJS).catch(() => cargarScript('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js', () => !!window.PptxGenJS));
    progreso(0.05, `Trayendo ${total} fotos…`);
    const imgs = await traerFotos([...new Set(grupos.reduce((a, g) => a.concat(g.fotos.map(x => x.id)), []))], p => progreso(0.05 + p * 0.8, `Trayendo fotos… ${Math.round(p * total)} de ${total}`));
    const logo = await aDataURL('logo-trentino.png');
    const pres = new window.PptxGenJS(); pres.layout = 'LAYOUT_WIDE'; pres.title = 'Fotos Ruteo TR1';
    const NAV = '0C1A2E', ORO = 'FFC53D', GRIS = '5B6B85';
    const r = RU();
    const cv = ui.vc !== 'TODAS' ? (r.carteras || []).find(c => c.vc === ui.vc) : null;
    const titulo = cv ? nom(cv.vn) : ui.sup === 'TODOS' ? 'Todos los supervisores' : (nom(nombreSup(ui.sup)) || ui.sup);
    // portada
    let s = pres.addSlide(); s.background = {color: NAV};
    if (logo) s.addImage({data: logo, x: 0.6, y: 0.5, w: 2.2, h: 0.75});
    s.addText('FOTOS DEL PDV', {x: 0.6, y: 2.2, w: 12, h: 0.5, fontFace: 'Arial', fontSize: 16, bold: true, color: ORO, charSpacing: 3});
    s.addText(titulo, {x: 0.6, y: 2.75, w: 12, h: 1.1, fontFace: 'Arial', fontSize: 44, bold: true, color: 'FFFFFF'});
    s.addText(`${cv ? 'Cartera ' + cv.vc + ' · ' : ''}${ui.sup === 'TODOS' ? grupos.length + ' supervisores' : (r.supLabel || {})[ui.sup] || ui.sup} · ${P.t} (${rangoTxt(P)})`, {x: 0.6, y: 3.9, w: 12, h: 0.5, fontFace: 'Arial', fontSize: 18, color: 'C9D3E3'});
    const cuenta = t => grupos.reduce((n, g) => n + g.fotos.filter(x => x.tipo.indexOf(t) === 0).length, 0);
    [['Fichas TOP', cuenta('Ficha')], ['Fotos', cuenta('Foto')], ['Competencia', cuenta('Competencia')]].forEach(([t, n], i) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {x: 0.6 + i * 2.6, y: 5.0, w: 2.3, h: 1.3, fill: {color: '16294A'}, line: {color: '2A3F66'}, rectRadius: 0.12});
      s.addText([{text: String(n), options: {fontSize: 32, bold: true, color: 'FFFFFF', breakLine: true}}, {text: t, options: {fontSize: 13, color: 'C9D3E3'}}], {x: 0.6 + i * 2.6, y: 5.0, w: 2.3, h: 1.3, align: 'center', valign: 'middle', fontFace: 'Arial'});
    });
    s.addText('Ruteo TR1 · Trentino S.A.', {x: 0.6, y: 6.9, w: 6, h: 0.3, fontFace: 'Arial', fontSize: 11, color: '8090AA'});
    let num = 0;
    for (const g of grupos){
      // separador por supervisor (solo con "Todos")
      if (grupos.length > 1 || ui.sup === 'TODOS'){
        s = pres.addSlide(); s.background = {color: NAV};
        s.addText((r.supLabel || {})[g.k] || g.k, {x: 0.8, y: 2.6, w: 11.5, h: 0.5, fontFace: 'Arial', fontSize: 18, bold: true, color: ORO});
        s.addText(nom(nombreSup(g.k)) || g.k, {x: 0.8, y: 3.1, w: 11.5, h: 1, fontFace: 'Arial', fontSize: 40, bold: true, color: 'FFFFFF'});
        s.addText(g.fotos.length + (g.fotos.length === 1 ? ' foto' : ' fotos'), {x: 0.8, y: 4.1, w: 11.5, h: 0.5, fontFace: 'Arial', fontSize: 18, color: 'C9D3E3'});
      }
      for (const x of g.fotos){
        num++;
        s = pres.addSlide(); s.background = {color: 'F4F6FA'};
        // foto (contenida en su recuadro, sin deformar)
        const BX = 0.35, BY = 0.35, BW = 7.9, BH = 6.8;
        s.addShape(pres.shapes.RECTANGLE, {x: BX, y: BY, w: BW, h: BH, fill: {color: 'E6EAF1'}, line: {color: 'E6EAF1'}});
        const src = imgs[x.id];
        if (src){
          const m = await medir(src), k = Math.min(BW / m.w, BH / m.h), w = m.w * k, h = m.h * k;
          s.addImage({data: src, x: BX + (BW - w) / 2, y: BY + (BH - h) / 2, w, h});
        } else s.addText([{text: 'No se pudo traer la foto', options: {breakLine: true, bold: true}}, {text: 'Ver en Drive', options: {hyperlink: {url: 'https://drive.google.com/file/d/' + x.id + '/view'}, color: '2E5BFF'}}], {x: BX, y: BY, w: BW, h: BH, align: 'center', valign: 'middle', fontFace: 'Arial', fontSize: 16, color: GRIS});
        // panel de datos
        const PX = 8.55, PW = 4.4;
        s.addShape(pres.shapes.RECTANGLE, {x: PX, y: 0.35, w: 0.08, h: 0.42, fill: {color: x.color}, line: {color: x.color}});
        s.addText(x.tipo.toUpperCase(), {x: PX + 0.18, y: 0.35, w: PW, h: 0.42, fontFace: 'Arial', fontSize: 12, bold: true, color: x.color, valign: 'middle', charSpacing: 1});
        s.addText(x.cli, {x: PX, y: 0.9, w: PW, h: 1.0, fontFace: 'Arial', fontSize: 22, bold: true, color: NAV, valign: 'top', fit: 'shrink'});
        const filas = [['Cartera', x.vc + ' · ' + nom2(x.vn)], ['Envió', x.de], ['Fecha', corto(x.f) + (x.h ? ' · ' + x.h : '')]].concat(x.cod ? [['Código', x.cod]] : []);
        s.addText(filas.map(([a, b], i) => [{text: a.toUpperCase() + '   ', options: {fontSize: 10, bold: true, color: '8090AA'}}, {text: b, options: {fontSize: 14, color: '1C2A44', breakLine: i < filas.length - 1}}]).reduce((t, v) => t.concat(v), []),
          {x: PX, y: 2.0, w: PW, h: 1.6, fontFace: 'Arial', valign: 'top', paraSpaceAfter: 6});
        let y = 3.7;
        if (x.extra.length){ s.addText(x.extra.map((t, i) => ({text: t, options: {bullet: true, breakLine: i < x.extra.length - 1}})), {x: PX, y, w: PW, h: 0.95, fontFace: 'Arial', fontSize: 13, color: '1C2A44', valign: 'top', fit: 'shrink'}); y += 1.0; }
        if (String(x.com || '').trim()){
          s.addShape(pres.shapes.ROUNDED_RECTANGLE, {x: PX, y, w: PW, h: 6.75 - y, fill: {color: 'FFFFFF'}, line: {color: 'DDE3EC'}, rectRadius: 0.08});
          s.addText([{text: 'COMENTARIO', options: {fontSize: 10, bold: true, color: '8090AA', breakLine: true}}, {text: '“' + x.com + '”', options: {fontSize: 15, italic: true, color: '1C2A44'}}], {x: PX + 0.15, y: y + 0.1, w: PW - 0.3, h: 6.75 - y - 0.2, fontFace: 'Arial', valign: 'top', fit: 'shrink'});
        }
        s.addText(`${(r.supLabel || {})[g.k] || g.k} · ${num} de ${total}`, {x: PX, y: 6.9, w: PW, h: 0.3, fontFace: 'Arial', fontSize: 10, color: '8090AA', align: 'right'});
      }
    }
    // resumen por vendedor
    s = pres.addSlide(); s.background = {color: 'FFFFFF'};
    s.addText('Resumen por vendedor', {x: 0.6, y: 0.4, w: 12, h: 0.7, fontFace: 'Arial', fontSize: 28, bold: true, color: NAV});
    const filasR = []; grupos.forEach(g => { const m = new Map(); g.fotos.forEach(x => { const o = m.get(x.vc) || {vn: x.vn, f: 0, c: 0}; if (x.tipo.indexOf('Competencia') === 0) o.c++; else o.f++; m.set(x.vc, o); }); m.forEach((o, vc) => filasR.push([(r.supLabel || {})[g.k] || g.k, vc, nom2(o.vn), String(o.f), String(o.c)])); });
    const H = ['Supervisor', 'Cartera', 'Vendedor', 'Fotos', 'Competencia'].map(t => ({text: t, options: {bold: true, color: 'FFFFFF', fill: {color: NAV}}}));
    s.addTable([H].concat(filasR.slice(0, 22)), {x: 0.6, y: 1.3, w: 12.1, fontFace: 'Arial', fontSize: 12, color: '1C2A44', border: {type: 'solid', color: 'DDE3EC', pt: 1}, colW: [3.2, 1.6, 3.5, 1.9, 1.9], rowH: 0.3});
    progreso(0.95, 'Guardando el archivo…');
    const nombre = `Fotos_PDV_${ui.sup === 'TODOS' ? 'Todos' : ((r.supLabel || {})[ui.sup] || ui.sup).replace(/[^\wÁÉÍÓÚÑáéíóúñ]+/g, '_')}${ui.vc !== 'TODAS' ? '_' + ui.vc : ''}_${P.d}_al_${P.h}.pptx`;
    const blob = await pres.write({outputType: 'blob'});
    bajar(blob, nombre);
    if (scriptViejo) progreso(null, 'El PowerPoint se descargó (' + nombre + '), pero sin las fotos: falta publicar la Nueva versión del script de Google.');
    else listo('Listo: ' + nombre);
  }

  // ---------- Excel de visitas ----------
  async function excel(){
    const P = periodo(ui.per), V = window.Visitas;
    progreso(0.1, 'Cargando las visitas…');
    if (V && V.asegurar) await V.asegurar();
    const X = V && V.exportar ? V.exportar(equipo(ui.sup), P.d, P.h) : null;
    if (!X) return progreso(null, 'Las visitas todavía no están cargadas. Abrí la pestaña Visitas una vez y probá de nuevo.');
    if (!X.dias.length) return progreso(null, 'No hay marcaciones de visitas en ' + P.t.toLowerCase() + '.');
    progreso(0.4, 'Armando el Excel…');
    await cargarScript('xlsx.mini.min.js?v=0.18.5', () => !!(window.XLSX && window.XLSX.utils));
    const XL = window.XLSX, r = RU(), lbl = k => (r.supLabel || {})[k] || k, pct = (a, b) => b ? Math.round(a / b * 100) / 100 : '';
    const res = X.res.map(o => ({'Supervisor': lbl(o.c.sup), 'Nombre supervisor': nom(nombreSup(o.c.sup)), 'Cartera': o.c.vc, 'Vendedor': nom(o.c.vn), 'Zona': o.c.vz || '', 'Días con datos': o.dias,
      'Visitas que tocaban': o.prog, 'Hechas': o.hechas, 'Cumplimiento': pct(o.hechas, o.prog), 'En su día': o.enDia, 'Otro día': o.otroDia,
      'Clientes que tocaban': o.cli, 'Clientes visitados': o.cliVis, 'Visitas totales': o.visitas, 'Con venta': o.conVenta, 'Venta Gs.': o.monto}))
      .sort((a, b) => a.Supervisor.localeCompare(b.Supervisor) || a.Cartera.localeCompare(b.Cartera));
    const det = X.det.map(o => ({'Fecha': o.d, 'Día': X.DIAS[deIso(o.d).getDay()], 'Supervisor': lbl(o.c.sup), 'Cartera': o.c.vc, 'Vendedor': nom(o.c.vn), 'Cód. cliente': o.cl[6] || '', 'Cliente': o.cl[2] || '',
      'Le tocaba': o.toca ? 'Sí' : 'No', 'Estado': o.est, 'Entrada': o.h1 || '', 'Salida': o.h2 || '', 'Venta Gs.': o.venta || 0}))
      .sort((a, b) => a.Supervisor.localeCompare(b.Supervisor) || a.Cartera.localeCompare(b.Cartera) || a.Fecha.localeCompare(b.Fecha) || (a.Estado === 'No visitado') - (b.Estado === 'No visitado'));
    const noVis = det.filter(o => o.Estado === 'No visitado');
    const wb = XL.utils.book_new();
    const hoja = (rows, nombre, anchos, encabezado) => {
      const ws = XL.utils.json_to_sheet([], {}); XL.utils.sheet_add_aoa(ws, encabezado, {origin: 'A1'});
      XL.utils.sheet_add_json(ws, rows, {origin: 'A' + (encabezado.length + 1)});
      ws['!cols'] = anchos.map(w => ({wch: w}));
      const n = rows.length, cols = Object.keys(rows[0] || {}).length;
      if (n && cols) ws['!autofilter'] = {ref: XL.utils.encode_range({s: {r: encabezado.length, c: 0}, e: {r: encabezado.length + n, c: cols - 1}})};
      // cumplimiento como porcentaje
      if (nombre === 'Resumen'){ for (let i = 0; i < n; i++){ const c = ws[XL.utils.encode_cell({r: encabezado.length + 1 + i, c: 8})]; if (c && typeof c.v === 'number') c.z = '0%'; } }
      XL.utils.book_append_sheet(wb, ws, nombre);
    };
    const tit = [['Visitas · ' + (ui.sup === 'TODOS' ? 'Todos los supervisores' : lbl(ui.sup) + ' · ' + nom(nombreSup(ui.sup))) + (ui.vc !== 'TODAS' ? ' · Cartera ' + ui.vc : '')], [P.t + ': ' + rangoTxt(P) + ' · ' + X.dias.length + ' días con marcaciones'], []];
    hoja(res, 'Resumen', [16, 20, 9, 24, 24, 9, 11, 8, 12, 9, 9, 11, 11, 11, 9, 14], tit);
    hoja(det, 'Detalle', [11, 10, 16, 9, 22, 12, 34, 9, 18, 8, 8, 12], tit);
    hoja(noVis.length ? noVis : [{'Fecha': '', 'Cliente': 'Todos los clientes que tocaban fueron visitados'}], 'No visitados', [11, 10, 16, 9, 22, 12, 34, 9, 18, 8, 8, 12], tit);
    const nombre = `Visitas_${ui.sup === 'TODOS' ? 'Todos' : lbl(ui.sup).replace(/[^\wÁÉÍÓÚÑáéíóúñ]+/g, '_')}${ui.vc !== 'TODAS' ? '_' + ui.vc : ''}_${P.d}_al_${P.h}.xlsx`;
    progreso(0.9, 'Guardando el archivo…');
    XL.writeFile(wb, nombre);
    listo('Listo: ' + nombre);
  }

  window.Exportar = {tarjeta};
})();
