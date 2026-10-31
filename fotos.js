// =====================================================================
//  FOTOS (Ampliación / Reposición en clientes top) y COMPETENCIA
// ---------------------------------------------------------------------
//  Las fotos y los comentarios se guardan en Google Drive (ver config.js:
//  FOTOS_URL y FOTOS_CLAVE). El vendedor saca la foto en la pestaña Top,
//  la revisa y confirma. El supervisor ve solo su equipo; jefatura todo.
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const URL_F = (typeof FOTOS_URL !== 'undefined' ? String(FOTOS_URL) : '').trim();
  const CLAVE_F = typeof FOTOS_CLAVE !== 'undefined' ? String(FOTOS_CLAVE) : '';
  const MAX_LADO = 1600, CALIDAD = .82, MIN_VIEJA = 10;   // foto de hace más de 10 min = de la galería
  const TIPOS = ['Ampliación', 'Reposición'];
  const TIPOS_C = ['Precio', 'Promoción', 'Producto nuevo', 'Exhibición', 'Otro'];
  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const R = () => window.RUTEO || {};
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const p2 = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const deIso = s => { const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const fechaTxt = d => `${DIAS[d.getDay()]} ${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} · ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  const diaTxt = s => { const d = deIso(s); return d ? `${DIAS[d.getDay()]} ${p2(d.getDate())}/${p2(d.getMonth() + 1)}` : s; };
  const lunes = (d, sem) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7) - 7 * (sem || 0)); return iso(x); };
  const nombreCorto = vn => { const p = String(vn || '').split(/\s+/).filter(Boolean); if (!p.length) return ''; const t = w => w.charAt(0) + w.slice(1).toLowerCase(); return t(p[0]) + (p[1] ? ' ' + t(p[1]) : ''); };
  const vendDe = vc => (R().carteras || []).find(c => c.vc === vc);
  const nomVend = vc => { const c = vendDe(vc); return c ? nombreCorto(c.vn) : ''; };
  const img = (id, w) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w}`;
  const imgAlt = (id, w) => `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${w}`;
  const bajarUrl = id => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
  const idDe = r => r.ID || (String(r['Enlace foto'] || r.Enlace || '').match(/\/d\/([\w-]+)/) || [])[1] || '';
  const IC = {
    cam: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    ok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    otra: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    sube: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    baja: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 10l6 6 6-6M5 20h14"/></svg>'
  };

  // ------------------------------------------------------------------
  //  Datos (Google Drive)
  // ------------------------------------------------------------------
  let datos = null, datosT = 0, pend = null, errorCarga = '';
  const locales = [];   // lo subido en esta sesión (se ve al instante)
  function parametros(){
    const r = R(), q = new URLSearchParams({clave: CLAVE_F, dias: '42'});
    if (r.modo === 'vendedor' && r.vendedor) q.set('vendedor', r.vendedor.vc);
    else if (r.modo === 'supervisor' && r.miSup) q.set('sup', r.miSup);
    else q.set('sup', 'TODOS');
    return q;
  }
  function cargar(forzar){
    if (!URL_F) return Promise.reject(new Error('Falta FOTOS_URL en config.js'));
    if (!forzar && datos && Date.now() - datosT < 90000) return Promise.resolve(datos);
    if (pend) return pend;
    pend = fetch(URL_F + '?' + parametros().toString(), {redirect: 'follow'})
      .then(r => { if (!r.ok) throw new Error('Google respondió ' + r.status); return r.json(); })
      .then(j => {
        if (!j || !j.ok) throw new Error(j && j.error === 'clave' ? 'La clave de fotos no coincide (FOTOS_CLAVE)' : 'Respuesta inválida');
        datos = j; datosT = Date.now(); errorCarga = '';
        // lo que ya llegó a Drive deja de ser "local"
        for (let i = locales.length - 1; i >= 0; i--){ const L = locales[i]; if ((L.compe ? j.compe : j.fotos).some(r => idDe(r) && idDe(r) === L.ID)) locales.splice(i, 1); }
        return j;
      })
      .catch(e => { errorCarga = e.message || String(e); throw e; })
      .finally(() => { pend = null; });
    return pend;
  }
  const fotos = () => locales.filter(l => !l.compe).concat(datos ? datos.fotos : []);
  const compe = () => locales.filter(l => l.compe).concat(datos ? datos.compe : []);

  function aBase64(blob){
    return new Promise((ok, mal) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.onerror = () => mal(fr.error); fr.readAsDataURL(blob); });
  }
  async function enviar(payload){
    const r = await fetch(URL_F, {method: 'POST', body: JSON.stringify(Object.assign({clave: CLAVE_F}, payload)), redirect: 'follow'});
    if (!r.ok) throw new Error('Google respondió ' + r.status);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'No se pudo guardar');
    return j;
  }

  // ------------------------------------------------------------------
  //  Foto: achicar y grabar los datos en la imagen
  // ------------------------------------------------------------------
  async function cargarImagen(file){
    if (window.createImageBitmap){ try { return await createImageBitmap(file, {imageOrientation: 'from-image'}); } catch(e){} }
    return await new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => mal(new Error('img')); im.src = URL.createObjectURL(file); });
  }
  function grabarDatos(ctx, W, H, lineas){
    const fs = Math.round(Math.max(W, H) / 44), pad = Math.round(fs * .8), lh = Math.round(fs * 1.35);
    const alto = pad * 2 + lh * lineas.length;
    const g = ctx.createLinearGradient(0, H - alto - fs * 2, 0, H);
    g.addColorStop(0, 'rgba(8,16,30,0)'); g.addColorStop(.35, 'rgba(8,16,30,.72)'); g.addColorStop(1, 'rgba(8,16,30,.88)');
    ctx.fillStyle = g; ctx.fillRect(0, H - alto - fs * 2, W, alto + fs * 2);
    ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = fs / 4;
    lineas.forEach((l, k) => {
      const txt = typeof l === 'string' ? l : l.t;
      ctx.font = `${k === 0 ? 700 : 500} ${k === 0 ? Math.round(fs * 1.1) : fs}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = k === 0 ? '#FFFFFF' : (l.color || '#D4DEEE');
      let t = txt; while (ctx.measureText(t).width > W - pad * 2 && t.length > 4) t = t.slice(0, -2);
      if (t !== txt) t = t.slice(0, -1) + '…';
      ctx.fillText(t, pad, H - pad - lh * (lineas.length - k));
    });
    ctx.shadowBlur = 0;
  }
  async function procesar(fuente, lineas){
    const k = Math.min(1, MAX_LADO / Math.max(fuente.width, fuente.height));
    const W = Math.round(fuente.width * k), H = Math.round(fuente.height * k);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fuente, 0, 0, W, H);
    grabarDatos(ctx, W, H, lineas);
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', CALIDAD));
    return {blob, url: URL.createObjectURL(blob), w: W, h: H, kb: Math.round(blob.size / 1024)};
  }
  const miVend = () => { const v = R().vendedor; return v ? {vc: v.vc, nom: nombreCorto(v.vn), sup: v.sup} : null; };
  const lineasCli = (cl, tipo, d) => { const v = miVend(); return [
    cl[2] + (cl[9] ? ' (' + cl[9] + ')' : ''),
    {t: tipo.toUpperCase() + '  ·  ' + cl[6] + '  ·  PM ' + cl[8], color: tipo === 'Ampliación' ? '#9DB4FF' : '#7BE3B6'},
    v.vc + ' ' + v.nom + '  ·  ' + fechaTxt(d)]; };
  const lineasCompe = (f, d) => { const v = miVend(); return [
    (f.marca || 'Competencia') + (f.producto ? ' · ' + f.producto : ''),
    {t: 'COMPETENCIA  ·  ' + f.queVio.toUpperCase() + (f.cliente ? '  ·  ' + f.cliente : ''), color: '#FFCF70'},
    v.vc + ' ' + v.nom + '  ·  ' + fechaTxt(d)]; };

  // ------------------------------------------------------------------
  //  Elementos compartidos: cámara, hoja de foto, confirmación, visor
  // ------------------------------------------------------------------
  let armado = false;
  function armar(){
    if (armado) return; armado = true;
    const d = document.createElement('div');
    d.innerHTML = `
      <input type="file" id="fxIn" accept="image/*" capture="environment" hidden>
      <div class="fx-hoja" id="fxHoja" hidden>
        <div class="fx-hcab"><button type="button" class="fx-x" id="fxHojaX" aria-label="Cerrar">${IC.x}</button><div><b id="fxHTit"></b><small id="fxHSub"></small></div></div>
        <div class="fx-hin">
          <div class="fx-seg" id="fxTipo" role="group" aria-label="Tipo de foto">${TIPOS.map(t => `<button type="button" data-t="${t}">${t}</button>`).join('')}</div>
          <label class="fx-cam" id="fxCam" for="fxIn"><span class="fx-camic">${IC.cam}</span><b>Sacar foto</b><small>Se abre la cámara. La foto lleva grabados el cliente, la fecha y la hora.</small></label>
          <div id="fxPrev" hidden class="fx-col">
            <div class="fx-vista"><img id="fxPrevImg" alt="Vista previa de la foto"></div>
            <div class="fx-meta"><span id="fxPrevMed"></span><span id="fxPrevPeso"></span></div>
            <label class="fx-lbl" for="fxCom">Comentario · opcional<textarea id="fxCom" placeholder="Ej.: Se amplió la góndola de limpieza a 3 estantes."></textarea></label>
            <div class="fx-fila"><button type="button" class="fx-btn sec" id="fxOtra">${IC.otra}Sacar otra</button><button type="button" class="fx-btn pri" id="fxSubir">${IC.sube}Subir</button></div>
          </div>
          <div id="fxErr" class="fx-aviso" hidden></div>
          <div id="fxProc" class="fx-proc" hidden><span class="fx-spin"></span><b id="fxProcTxt">Preparando la foto…</b></div>
        </div>
      </div>
      <div class="fx-velo" id="fxConf" hidden>
        <div class="fx-dlg" role="dialog" aria-modal="true" aria-labelledby="fxCTit">
          <h3 id="fxCTit">¿Subir esta foto?</h3>
          <div class="fx-dres"><img id="fxCImg" alt=""><div id="fxCTxt"></div></div>
          <div class="fx-fila"><button type="button" class="fx-btn sec" id="fxCNo">No, revisar</button><button type="button" class="fx-btn ok" id="fxCSi">Sí, subir</button></div>
        </div>
      </div>
      <div class="fx-hoja" id="fxVisor" hidden>
        <div class="fx-hcab"><button type="button" class="fx-x" id="fxVisorX" aria-label="Cerrar">${IC.x}</button><div><b id="fxVTit"></b><small id="fxVSub"></small></div></div>
        <div class="fx-hin" id="fxVIn"></div>
      </div>
      <div class="fx-toast" id="fxToast" hidden>${IC.ok}<span></span></div>`;
    document.body.appendChild(d);
    $('fxHojaX').onclick = cerrarHoja;
    $('fxVisorX').onclick = () => { $('fxVisor').hidden = true; bloquear(false); };
    $('fxOtra').onclick = () => $('fxIn').click();
    $('fxTipo').querySelectorAll('button').forEach(b => b.onclick = async () => {
      setTipo(b.dataset.t);
      if (H && H.fuente){ H.foto = await procesar(H.fuente, lineasCli(H.cl, H.tipo, H.fecha)); verPrevia(); }
    });
    $('fxIn').onchange = alElegirFoto;
    $('fxCNo').onclick = () => { $('fxConf').hidden = true; conf = null; };
    $('fxCSi').onclick = () => { $('fxConf').hidden = true; const f = conf; conf = null; if (f) f(); };
  }
  const bloquear = si => { document.body.classList.toggle('fx-bloq', si); };
  function toast(t){ const el = $('fxToast'); el.querySelector('span').textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2800); }
  let conf = null;
  function confirmar(titulo, imgUrl, html, fn){
    $('fxCTit').textContent = titulo; $('fxCImg').hidden = !imgUrl; if (imgUrl) $('fxCImg').src = imgUrl;
    $('fxCTxt').innerHTML = html; conf = fn; $('fxConf').hidden = false; $('fxCSi').focus();
  }

  // Hoja de foto. H = {modo:'cli'|'compe', cl, tipo, fuente, foto, fecha}
  let H = null, alListo = null;
  function abrirHoja(o){
    armar(); H = Object.assign({foto: null, fuente: null}, o);
    $('fxHTit').textContent = o.titulo; $('fxHSub').textContent = o.sub;
    $('fxTipo').hidden = o.modo !== 'cli'; if (o.modo === 'cli') setTipo(o.tipo);
    $('fxCom').value = ''; paso('cam');
    $('fxHoja').hidden = false; bloquear(true);
  }
  function cerrarHoja(){ $('fxHoja').hidden = true; bloquear(false); H = null; }
  function setTipo(t){ if (H) H.tipo = t; $('fxTipo').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t))); }
  function paso(p, txt){
    $('fxCam').hidden = p !== 'cam'; $('fxPrev').hidden = p !== 'prev'; $('fxProc').hidden = p !== 'proc'; $('fxErr').hidden = true;
    if (txt) $('fxProcTxt').textContent = txt;
  }
  function error(t){ $('fxErr').innerHTML = t; $('fxErr').hidden = false; }
  async function alElegirFoto(e){
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f || !H) return;
    if (f.lastModified && Date.now() - f.lastModified > MIN_VIEJA * 60000){
      paso(H.foto ? 'prev' : 'cam');
      error('Esa foto es de antes. Tiene que ser una foto sacada ahora con la cámara.'); return;
    }
    paso('proc', 'Preparando la foto…');
    try {
      H.fuente = await cargarImagen(f); H.fecha = new Date();
      H.foto = await procesar(H.fuente, H.modo === 'cli' ? lineasCli(H.cl, H.tipo, H.fecha) : lineasCompe(H.form, H.fecha));
      if (H.modo === 'compe'){ const fo = H.foto; fo.fecha = H.fecha; const fn = alListo; cerrarHoja(); if (fn) fn(fo); return; }
      verPrevia();
    } catch(err){ paso('cam'); error('No se pudo leer la foto. Probá sacarla de nuevo.'); }
  }
  function verPrevia(){
    $('fxPrevImg').src = H.foto.url; $('fxPrevMed').textContent = H.foto.w + ' × ' + H.foto.h + ' px'; $('fxPrevPeso').textContent = H.foto.kb + ' KB';
    paso('prev');
    $('fxSubir').onclick = () => {
      const cl = H.cl, com = $('fxCom').value.trim();
      confirmar('¿Subir esta foto?', H.foto.url, `<b>${esc(H.tipo)} · ${esc(cl[2])}</b>${esc(fechaTxt(H.fecha))}${com ? '<br>Con comentario' : ''}`, () => subirFoto(com));
    };
  }
  async function subirFoto(com){
    const h = H, v = miVend(), cl = h.cl;
    paso('proc', 'Subiendo la foto…');
    try {
      const j = await enviar({imagen: await aBase64(h.foto.blob), fecha: h.fecha.toISOString(), sup: v.sup, vendedor: v.vc, nomVendedor: v.nom,
        cliente: cl[2] + (cl[9] ? ' (' + cl[9] + ')' : ''), codigo: cl[6], pm: cl[8], tipo: h.tipo, comentario: com});
      locales.unshift({_local: h.foto.url, Fecha: iso(h.fecha), Hora: p2(h.fecha.getHours()) + ':' + p2(h.fecha.getMinutes()), Supervisor: v.sup, Vendedor: v.vc, 'Nombre vendedor': v.nom,
        Cliente: cl[2] + (cl[9] ? ' (' + cl[9] + ')' : ''), 'Código': cl[6], PM: cl[8], Tipo: h.tipo, Comentario: com, Enlace: j.enlace || '', ID: j.id || ''});
      if (H === h) cerrarHoja();
      toast('Foto subida. Tu supervisor ya la puede ver.');
      if (R().refrescar) R().refrescar(); else pintarTop();
      punto();
    } catch(err){
      if (H !== h) return;
      paso('prev');
      error('No se pudo subir (' + esc(err.message || err) + '). Revisá la señal y tocá <b>Subir</b> otra vez. La foto no se pierde.');
    }
  }

  // Visor (supervisor / jefatura / vendedor)
  function abrirVisor(r, esCompe){
    armar();
    const id = idDe(r), conFoto = r._local || (esCompe ? r['Enlace foto'] : r.Enlace);
    const d = deIso(r.Fecha), cuando = (d ? diaTxt(r.Fecha) + '/' + d.getFullYear() : r.Fecha) + ' · ' + r.Hora;
    $('fxVTit').textContent = esCompe ? (r['Empresa/Marca'] + (r.Producto ? ' · ' + r.Producto : '')) : r.Cliente;
    $('fxVSub').textContent = (esCompe ? 'Competencia · ' + r['Qué vio'] : r.Tipo) + ' · ' + cuando;
    const precio = esCompe && r['Precio Gs.'] ? (+String(r['Precio Gs.']).replace(/\D/g, '')).toLocaleString('es-PY') : '';
    $('fxVIn').innerHTML = `
      ${conFoto ? `<div class="fx-vista"><img id="fxVImg" alt="Foto" src="${r._local || img(id, 1600)}"></div>` : ''}
      <div class="fx-coment"><small>Comentario de ${esc(r['Nombre vendedor'] || r.Vendedor)}</small><p>${r.Comentario ? esc(r.Comentario) : '<span class="fx-tenue">Sin comentario</span>'}</p></div>
      <dl class="fx-datos">
        <dt>Vendedor</dt><dd>${esc(r.Vendedor)} · ${esc(r['Nombre vendedor'] || nomVend(r.Vendedor))}</dd>
        <dt>Supervisor</dt><dd>${esc((R().supLabel || {})[r.Supervisor] || r.Supervisor)}</dd>
        ${esCompe ? `<dt>Qué vio</dt><dd>${esc(r['Qué vio'])}</dd>${r.Producto ? `<dt>Producto</dt><dd>${esc(r.Producto)}</dd>` : ''}${precio ? `<dt>Precio</dt><dd>Gs. ${precio}</dd>` : ''}${r.Cliente ? `<dt>Dónde</dt><dd>${esc(r.Cliente)}</dd>` : ''}`
                  : `<dt>Cliente</dt><dd>${esc(r.Cliente)} · ${esc(r['Código'])}</dd><dt>PM</dt><dd>${esc(r.PM)}</dd>`}
        <dt>Fecha</dt><dd>${esc(cuando)}</dd>
      </dl>
      ${conFoto && id ? `<a class="fx-btn pri" href="${bajarUrl(id)}" target="_blank" rel="noopener">${IC.baja}Descargar foto</a>` : ''}`;
    const im = $('fxVImg'); if (im && id) im.onerror = () => { if (!im.dataset.alt){ im.dataset.alt = '1'; im.src = imgAlt(id, 1600); } };
    $('fxVisor').hidden = false; $('fxVisor').scrollTop = 0; bloquear(true);
  }
  const miniatura = (r, esCompe) => {
    const id = idDe(r), conFoto = r._local || (esCompe ? r['Enlace foto'] : r.Enlace);
    if (!conFoto) return '';
    return `<img loading="lazy" alt="" src="${r._local || img(id, 600)}" data-alt="${id ? imgAlt(id, 600) : ''}" onerror="if(this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt=''}">`;
  };

  // ------------------------------------------------------------------
  //  Pestaña Top
  // ------------------------------------------------------------------
  let topBox = null;
  const filtro = {sem: 0, tipo: 'Todo', vend: ''};
  function enTop(box){
    topBox = box;
    if (!URL_F){ box.innerHTML = ''; return; }
    pintarTop();
    cargar().then(pintarTop, pintarTop);
  }
  function pintarTop(){
    const box = topBox; if (!box || !document.body.contains(box)) return;
    if (R().modo === 'vendedor') pintarVendedor(box); else pintarEquipo(box);
  }
  function estadoCarga(){
    if (datos) return '';
    if (errorCarga) return `<div class="fx-aviso">No se pudieron traer las fotos (${esc(errorCarga)}). <button type="button" class="fx-link" data-reint>Reintentar</button></div>`;
    return '<div class="fx-cargando"><span class="fx-spin"></span>Trayendo fotos…</div>';
  }
  function enlazarReintento(box){ box.querySelectorAll('[data-reint]').forEach(b => b.onclick = () => { errorCarga = ''; pintarTop(); cargar(true).then(pintarTop, pintarTop); }); }

  // Estado de la semana: códigos con foto, por vendedor y tipo
  function semana(){
    const desde = lunes(new Date()), m = new Map();
    fotos().forEach(r => { if (r.Fecha < desde) return; const k = r.Vendedor + '|' + r['Código']; if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
    return m;
  }
  const fotosCli = (vc, cod) => datos || locales.length ? (semana().get(vc + '|' + cod) || []) : null;
  function semanaDe(vc){
    if (!datos) return null;
    const desde = lunes(new Date());
    return new Set(fotos().filter(r => r.Vendedor === vc && r.Fecha >= desde).map(r => r['Código']));
  }

  // Botones / estado dentro de cada cliente top (Ruta y Top)
  function filaCli(cl, c){
    if (!URL_F || !cl || !cl[6]) return '';
    const fs = fotosCli(c.vc, cl[6]), hecho = t => fs && fs.some(r => r.Tipo === t);
    const attrs = `data-fx-vc="${esc(c.vc)}" data-fx-cod="${esc(cl[6])}"`;
    if (R().modo === 'vendedor'){
      return `<div class="fx-acc" ${attrs}>${TIPOS.map(t => { const h = hecho(t); return `<button type="button" class="fx-mb${h ? ' hecho' : ''}" data-fx-t="${t}">${h ? IC.ok : IC.cam}<span>${t}</span></button>`; }).join('')}</div>`;
    }
    const n = fs ? fs.length : 0;
    return `<div class="fx-acc ver" ${attrs}><span class="fx-acc-st">${IC.cam}${TIPOS.map(t => `<span class="fx-st${hecho(t) ? ' ok' : ''}">${hecho(t) ? '✓' : '○'} ${t}</span>`).join('')}</span>${n ? `<button type="button" class="fx-vermb" data-fx-ver>Ver ${n === 1 ? 'foto' : n + ' fotos'}</button>` : `<span class="fx-sin">${fs ? 'Sin fotos esta semana' : ''}</span>`}</div>`;
  }

  // Aviso arriba de la ruta
  let tiraLista = [];
  function bannerRuta(current, dia, hoy){
    if (!URL_F) return '';
    const r = R();
    if (r.modo === 'vendedor'){
      const v = r.vendedor; if (!v) return '';
      const d = dia && dia !== 'S/Cal' ? dia : null;
      const tops = v.cl.filter(cl => cl._top && (!d || String(cl[3]).split(',').map(x => x.trim()).includes(d)));
      if (!tops.length) return '';
      const st = cl => { const fs = fotosCli(v.vc, cl[6]) || []; return TIPOS.map(t => fs.some(x => x.Tipo === t)); };
      const n = tops.reduce((a, cl) => a + st(cl).filter(Boolean).length, 0), tot = tops.length * 2, listo = n >= tot;
      const cuando = !d ? 'de la semana' : d === hoy ? 'de hoy' : 'del ' + ({Lun:'lunes', Mar:'martes', 'Mié':'miércoles', Jue:'jueves', Vie:'viernes', 'Sáb':'sábado'})[d];
      return `<section class="fx-mision${listo ? ' listo' : ''}">
        <div class="fx-m-top"><span class="fx-m-ic">${listo ? IC.ok : IC.cam}</span>
          <div class="fx-m-t"><b>Fotos ${cuando}</b><small>${listo ? '¡Listo! Ya sacaste todas.' : `${tops.length} ${tops.length === 1 ? 'cliente top' : 'clientes top'} · ampliación y reposición`}</small></div>
          <span class="fx-m-n">${datos ? n : '…'}<small>/${tot}</small></span></div>
        <div class="fx-m-bar"><i style="width:${datos ? Math.round(n / tot * 100) : 0}%"></i></div>
        <div class="fx-m-clis">${tops.map(cl => { const s = st(cl); return `<button type="button" class="fx-m-cli" data-fx-ir="${esc(cl[6])}"><span class="fx-m-dots">${s.map((x, k) => `<i class="${x ? 'ok' : ''}" title="${TIPOS[k]}"></i>`).join('')}</span>${esc(cl[2])}</button>`; }).join('')}</div>
      </section>`;
    }
    // Supervisor / jefatura: últimas fotos del equipo visible
    const vcs = new Set((current || []).map(x => x.c.vc));
    const desde = lunes(new Date()), hoyIso = iso(new Date());
    const fs = fotos().filter(x => vcs.has(x.Vendedor) && x.Fecha >= desde);
    tiraLista = fs;
    const nHoy = fs.filter(x => x.Fecha === hoyIso).length;
    if (!datos) return `<section class="fx-tira"><div class="fx-t-top"><b>${IC.cam}Fotos del equipo</b><span class="fx-t-c"><span class="fx-spin"></span></span></div></section>`;
    return `<section class="fx-tira">
      <div class="fx-t-top"><b>${IC.cam}Fotos del equipo</b><span class="fx-t-c"><b>${nHoy}</b> hoy · <b>${fs.length}</b> esta semana</span></div>
      ${fs.length ? `<div class="fx-t-fotos">${fs.slice(0, 12).map((x, k) => `<button type="button" class="fx-t-f" data-fx-tira="${k}">${miniatura(x, false)}<span>${esc(x.Vendedor)}</span></button>`).join('')}</div>` : '<p class="fx-t-vacio">Todavía no hay fotos esta semana.</p>'}
      <button type="button" class="fx-t-mas" data-fx-todas>Ver todas y cumplimiento ›</button>
    </section>`;
  }

  // Un solo lugar que conecta todos los botones de fotos (Ruta y Top)
  function enlazar(root){
    if (!root) return;
    root.querySelectorAll('[data-fx-t]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const w = b.closest('[data-fx-cod]'), c = vendDe(w.dataset.fxVc), cl = c && c.cl.find(x => x[6] === w.dataset.fxCod);
      if (cl) abrirHoja({modo: 'cli', cl, tipo: b.dataset.fxT, titulo: cl[2], sub: cl[6] + ' · PM ' + cl[8]});
    });
    root.querySelectorAll('[data-fx-ver]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const w = b.closest('[data-fx-cod]'), fs = fotosCli(w.dataset.fxVc, w.dataset.fxCod) || [];
      if (fs.length === 1) abrirVisor(fs[0], false); else verLista(fs[0] ? fs[0].Cliente : 'Fotos', fs, false);
    });
    root.querySelectorAll('[data-fx-ir]').forEach(b => b.onclick = () => {
      const el = document.querySelector(`#main [data-fx-cod="${CSS.escape(b.dataset.fxIr)}"]`);
      const card = el && (el.closest('.client') || el);
      if (card){ const y = card.getBoundingClientRect().top + window.scrollY - (($('stickyBar') || {}).offsetHeight || 0) - 12; window.scrollTo({top: y, behavior: 'smooth'}); card.classList.add('fx-brilla'); setTimeout(() => card.classList.remove('fx-brilla'), 1600); }
    });
    const tira = root.querySelector('.fx-tira');
    if (tira){
      tira.querySelectorAll('[data-fx-tira]').forEach(b => b.onclick = () => { const f = tiraLista[+b.dataset.fxTira]; if (f) abrirVisor(f, false); });
      const m = tira.querySelector('[data-fx-todas]'); if (m) m.onclick = () => R().verTopHoy();
    }
  }

  // Vendedor, pestaña Top: avance de la semana
  function pintarVendedor(box){
    const v = R().vendedor; if (!v) return;
    const tops = v.cl.filter(cl => cl._top);
    if (!tops.length){ box.innerHTML = ''; return; }
    const desde = lunes(new Date()), sem = fotos().filter(r => r.Vendedor === v.vc && r.Fecha >= desde);
    const n = tops.reduce((a, cl) => a + TIPOS.filter(t => sem.some(r => r['Código'] === cl[6] && r.Tipo === t)).length, 0), tot = tops.length * 2;
    box.innerHTML = `<section class="fx-card fx-avance">
      <div class="fx-chead"><div><h3>Fotos de esta semana</h3><p>${datos ? (n >= tot ? '¡Completaste todas!' : `Te faltan <b>${tot - n}</b>`) : 'Cargando…'}</p></div><b class="fx-num">${datos ? n + '<small>/' + tot + '</small>' : '…'}</b></div>
      <div class="fx-barra"><i style="width:${datos ? Math.round(n / tot * 100) : 0}%"></i></div>
      ${estadoCarga()}
      ${sem.length ? `<button type="button" class="fx-link fx-mias" id="fxMias">Ver mis fotos (${sem.length})</button>` : ''}
    </section>`;
    const mias = $('fxMias'); if (mias) mias.onclick = () => verLista('Mis fotos de la semana', sem, false);
    enlazarReintento(box);
  }
  // Lista de fotos en el visor (para el vendedor)
  function verLista(titulo, filas, esCompe){
    armar();
    $('fxVTit').textContent = titulo; $('fxVSub').textContent = filas.length + (filas.length === 1 ? ' envío' : ' envíos');
    $('fxVIn').innerHTML = filas.length ? galeriaHtml(filas, esCompe) : '<div class="fx-vacio">Todavía no subiste fotos esta semana.</div>';
    enlazarGaleria($('fxVIn'), filas, esCompe, true);
    $('fxVisor').hidden = false; bloquear(true);
  }

  function galeriaHtml(filas, esCompe){
    const grupos = new Map();
    filas.forEach(r => { if (!grupos.has(r.Fecha)) grupos.set(r.Fecha, []); grupos.get(r.Fecha).push(r); });
    let k = 0;
    return [...grupos.entries()].map(([f, g]) => `<div class="fx-dia">${esc(diaTxt(f))} · ${g.length} ${g.length === 1 ? 'foto' : 'fotos'}</div>
      <div class="fx-grid">${g.map(r => `<button type="button" class="fx-ft" data-k="${k++}">
        ${miniatura(r, esCompe) || `<span class="fx-ftxt">“${esc(r.Comentario)}”</span>`}
        <span class="fx-fti"><span class="fx-tag ${r.Tipo === 'Ampliación' ? 'amp' : r.Tipo === 'Reposición' ? 'rep' : 'com'}">${esc(esCompe ? r['Qué vio'] : r.Tipo)}</span>
        <b>${esc(esCompe ? r['Empresa/Marca'] : r.Cliente)}</b><small>${esc(r.Vendedor)} ${esc(nombreCorto(r['Nombre vendedor']))} · ${esc(r.Hora)}${r.Comentario ? ' · con comentario' : ''}</small></span></button>`).join('')}</div>`).join('');
  }
  function enlazarGaleria(box, filas, esCompe, enVisor){
    box.querySelectorAll('.fx-ft').forEach(b => b.onclick = () => { const r = filas[+b.dataset.k]; if (enVisor) $('fxVisor').hidden = true; abrirVisor(r, esCompe); });
  }

  // Supervisor / jefatura: fotos del equipo
  function equipoVisible(){
    const r = R(), spv = r.getSpv ? r.getSpv() : 'TODOS';
    return (r.carteras || []).filter(c => !(r.isVacante && r.isVacante(c)) && /^TR/i.test(c.vc) && (spv === 'TODOS' || spv === 'MIXTOS' || c.sup === spv));
  }
  function pintarEquipo(box){
    const eq = equipoVisible(), vcs = new Set(eq.map(c => c.vc));
    const conTop = eq.map(c => ({c, n: c.cl.filter(cl => cl._top).length})).filter(x => x.n);
    const desde = filtro.sem === 2 ? '' : lunes(new Date(), filtro.sem), hasta = filtro.sem === 1 ? lunes(new Date()) : '9999';
    const base = fotos().filter(r => vcs.has(r.Vendedor) && (!desde || r.Fecha >= desde) && r.Fecha < hasta);
    if (filtro.vend && !vcs.has(filtro.vend)) filtro.vend = '';
    const lst = base.filter(r => (filtro.tipo === 'Todo' || r.Tipo === filtro.tipo) && (!filtro.vend || r.Vendedor === filtro.vend));
    const cumple = conTop.map(x => {
      const fs = base.filter(r => r.Vendedor === x.c.vc);
      const clis = new Set(fs.map(r => r['Código']));
      return {c: x.c, nTop: x.n, fotos: fs.length, clis: Math.min(clis.size, x.n)};
    }).sort((a, b) => a.clis / a.nTop - b.clis / b.nTop);
    const SEMS = ['Esta semana', 'Semana pasada', 'Últimas 6 semanas'];
    box.innerHTML = `<section class="fx-card">
      <div class="fx-chead"><div><h3>Fotos del equipo</h3><p>${datos ? `<b>${base.length}</b> ${base.length === 1 ? 'foto' : 'fotos'} · ${SEMS[filtro.sem].toLowerCase()}` : 'Ampliación y reposición en clientes top'}</p></div>
        <button type="button" class="fx-link" id="fxRecargar">Actualizar</button></div>
      <div class="fx-chips" role="group" aria-label="Semana">${SEMS.map((s, i) => `<button type="button" data-sem="${i}" aria-pressed="${filtro.sem === i}">${s}</button>`).join('')}</div>
      ${estadoCarga()}
      ${datos && conTop.length ? `<details class="fx-cumple"><summary>Cumplimiento por vendedor</summary>
        <div class="fx-ctab">${cumple.map(x => `<button type="button" class="fx-crow${filtro.vend === x.c.vc ? ' on' : ''}" data-vc="${esc(x.c.vc)}">
          <span class="fx-cvc">${esc(x.c.vc)}</span><span class="fx-cvn">${esc(nombreCorto(x.c.vn))}</span>
          <span class="fx-cbar"><i style="width:${Math.round(x.clis / x.nTop * 100)}%" class="${x.clis >= x.nTop ? 'full' : x.clis ? '' : 'cero'}"></i></span>
          <span class="fx-cnum"><b>${x.clis}</b>/${x.nTop}</span></button>`).join('')}</div>
        <p class="fx-nota">Clientes top con al menos una foto · tocá un vendedor para ver solo sus fotos.</p></details>` : ''}
      ${datos ? `<div class="fx-chips fx-tipos" role="group" aria-label="Tipo">${['Todo'].concat(TIPOS).map(t => `<button type="button" data-tipo="${t}" aria-pressed="${filtro.tipo === t}">${t}</button>`).join('')}
        ${filtro.vend ? `<button type="button" class="fx-quitar" id="fxQuitarV">${esc(filtro.vend)} ${IC.x}</button>` : ''}</div>
      ${lst.length ? galeriaHtml(lst, false) : '<div class="fx-vacio">No hay fotos en esta selección.</div>'}` : ''}
    </section>`;
    box.querySelectorAll('[data-sem]').forEach(b => b.onclick = () => { filtro.sem = +b.dataset.sem; pintarTop(); });
    box.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => { filtro.tipo = b.dataset.tipo; pintarTop(); });
    box.querySelectorAll('.fx-crow').forEach(b => b.onclick = () => { filtro.vend = filtro.vend === b.dataset.vc ? '' : b.dataset.vc; pintarTop(); });
    const q = $('fxQuitarV'); if (q) q.onclick = () => { filtro.vend = ''; pintarTop(); };
    $('fxRecargar').onclick = () => { pintarTop(); cargar(true).then(pintarTop, pintarTop); };
    enlazarGaleria(box, lst, false, false);
    enlazarReintento(box);
  }

  // ------------------------------------------------------------------
  //  Pestaña Competencia
  // ------------------------------------------------------------------
  let fC = {queVio: 'Promoción', foto: null}, filtroC = 'Todo';
  const VISTO = 'ruteoTR1_compeVisto';
  function mostrarCompe(){
    const box = $('compeView'); if (!box) return;
    marcarVisto();
    pintarCompe();
    cargar().then(() => { pintarCompe(); marcarVisto(); }, pintarCompe);
  }
  function pintarCompe(){
    const box = $('compeView'); if (!box || box.hidden) return;
    if (R().modo === 'vendedor') pintarCompeVend(box); else pintarCompeEquipo(box);
  }
  function pintarCompeVend(box){
    const v = R().vendedor;
    const mias = compe().slice(0, 20);
    const clientes = v.cl.map(cl => cl[2] + ' · ' + cl[6]).filter((x, i, a) => a.indexOf(x) === i).sort();
    box.innerHTML = `<div class="fx-wrap">
      <div class="fx-phead"><h2>Competencia</h2><p>Lo que ves de la competencia llega a tu supervisor y a jefatura.</p></div>
      <form class="fx-card fx-form" id="fxForm" novalidate>
        <div class="fx-lbl">Qué viste<div class="fx-chips" id="fxQue" role="group" aria-label="Qué viste">${TIPOS_C.map(t => `<button type="button" data-q="${t}" aria-pressed="${fC.queVio === t}">${t}</button>`).join('')}</div></div>
        <label class="fx-lbl" for="fxMarca">Empresa o marca<input type="text" id="fxMarca" placeholder="Ej.: Savora, Unilever…" autocomplete="off"></label>
        <label class="fx-lbl" for="fxProd">Producto<input type="text" id="fxProd" placeholder="Ej.: Mostaza 250 g" autocomplete="off"></label>
        <label class="fx-lbl" for="fxPrecio">Precio que viste (Gs.) · opcional<input type="number" id="fxPrecio" inputmode="numeric" placeholder="Ej.: 12500"></label>
        <label class="fx-lbl" for="fxCli">Dónde lo viste · opcional<select id="fxCli"><option value="">Sin cliente</option>${clientes.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label class="fx-lbl" for="fxTxt">Comentario<textarea id="fxTxt" placeholder="Ej.: Están con 2x1 hasta fin de mes y pusieron exhibidor en la entrada."></textarea></label>
        <button type="button" class="fx-btn sec" id="fxCFoto">${IC.cam}<span>${fC.foto ? 'Cambiar foto' : 'Agregar foto (opcional)'}</span></button>
        ${fC.foto ? `<div class="fx-vista"><img src="${fC.foto.url}" alt="Foto de competencia"></div>` : ''}
        <div id="fxCErr" class="fx-aviso" hidden></div>
        <button type="submit" class="fx-btn pri" id="fxEnviar">Enviar a supervisor</button>
      </form>
      <h3 class="fx-sub">Tus envíos recientes</h3>
      ${estadoCompe()}
      ${mias.length ? galeriaCompe(mias) : (datos ? '<div class="fx-vacio">Todavía no enviaste información de competencia.</div>' : '')}
    </div>`;
    // conservar lo escrito
    ['fxMarca', 'fxProd', 'fxPrecio', 'fxCli', 'fxTxt'].forEach(id => { const el = $(id); if (fC[id] != null) el.value = fC[id]; el.oninput = el.onchange = () => { fC[id] = el.value; }; });
    $('fxQue').querySelectorAll('button').forEach(b => b.onclick = () => { fC.queVio = b.dataset.q; $('fxQue').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    const leer = () => ({queVio: fC.queVio, marca: $('fxMarca').value.trim(), producto: $('fxProd').value.trim(), precio: $('fxPrecio').value.trim(), cliente: $('fxCli').value, comentario: $('fxTxt').value.trim()});
    $('fxCFoto').onclick = () => {
      alListo = fo => { fC.foto = fo; pintarCompe(); };
      abrirHoja({modo: 'compe', form: leer(), titulo: 'Foto de competencia', sub: 'Se adjunta a tu comentario'});
      $('fxIn').click();
    };
    $('fxForm').onsubmit = e => {
      e.preventDefault();
      const f = leer();
      if (!f.marca || !f.comentario){ const er = $('fxCErr'); er.textContent = 'Completá la empresa o marca y el comentario.'; er.hidden = false; return; }
      armar();
      confirmar('¿Enviar a tu supervisor?', fC.foto ? fC.foto.url : '', `<b>${esc(f.queVio)} · ${esc(f.marca)}</b>${esc(f.producto)}${f.precio ? ' · Gs. ' + (+f.precio).toLocaleString('es-PY') : ''}`, () => enviarCompe(f));
    };
    enlazarCompe(box, mias);
  }
  async function enviarCompe(f){
    const v = miVend(), btn = $('fxEnviar'), foto = fC.foto, d = foto ? foto.fecha : new Date();
    if (btn){ btn.disabled = true; btn.textContent = 'Enviando…'; }
    try {
      const j = await enviar(Object.assign({compe: true, fecha: d.toISOString(), sup: v.sup, vendedor: v.vc, nomVendedor: v.nom, imagen: foto ? await aBase64(foto.blob) : ''}, f));
      locales.unshift({compe: true, _local: foto ? foto.url : '', Fecha: iso(d), Hora: p2(d.getHours()) + ':' + p2(d.getMinutes()), Supervisor: v.sup, Vendedor: v.vc, 'Nombre vendedor': v.nom,
        'Qué vio': f.queVio, 'Empresa/Marca': f.marca, Producto: f.producto, 'Precio Gs.': f.precio, Cliente: f.cliente, Comentario: f.comentario, 'Enlace foto': j.enlace || '', ID: j.id || ''});
      fC = {queVio: f.queVio, foto: null};
      armar(); toast('Enviado a tu supervisor y a jefatura.');
      pintarCompe();
    } catch(err){
      if (btn){ btn.disabled = false; btn.textContent = 'Enviar a supervisor'; }
      const er = $('fxCErr'); if (er){ er.textContent = 'No se pudo enviar (' + (err.message || err) + '). Revisá la señal y probá de nuevo; lo escrito no se pierde.'; er.hidden = false; }
    }
  }
  function estadoCompe(){
    if (datos) return '';
    if (errorCarga) return `<div class="fx-aviso">No se pudo traer la información (${esc(errorCarga)}).</div>`;
    return '<div class="fx-cargando"><span class="fx-spin"></span>Cargando…</div>';
  }
  function galeriaCompe(lst){
    return `<div class="fx-clist">${lst.map((r, k) => {
      const precio = r['Precio Gs.'] ? 'Gs. ' + (+String(r['Precio Gs.']).replace(/\D/g, '')).toLocaleString('es-PY') : '';
      return `<button type="button" class="fx-citem" data-k="${k}">
        ${miniatura(r, true) ? `<span class="fx-cimg">${miniatura(r, true)}</span>` : ''}
        <span class="fx-ctx"><span class="fx-tag com">${esc(r['Qué vio'])}</span>
          <b>${esc(r['Empresa/Marca'])}${r.Producto ? ' · ' + esc(r.Producto) : ''}${precio ? ' <em>' + precio + '</em>' : ''}</b>
          <span class="fx-cq">${esc(r.Comentario)}</span>
          <small>${esc(r.Vendedor)} ${esc(nombreCorto(r['Nombre vendedor']))} · ${esc(diaTxt(r.Fecha))} ${esc(r.Hora)}${r.Cliente ? ' · ' + esc(String(r.Cliente).split(' · ')[0]) : ''}</small></span></button>`;
    }).join('')}</div>`;
  }
  function enlazarCompe(box, lst){ box.querySelectorAll('.fx-citem').forEach(b => b.onclick = () => abrirVisor(lst[+b.dataset.k], true)); }
  function pintarCompeEquipo(box){
    const vcs = new Set(equipoVisible().map(c => c.vc));
    const base = compe().filter(r => vcs.has(r.Vendedor));
    const lst = base.filter(r => filtroC === 'Todo' || r['Qué vio'] === filtroC);
    const spv = R().getSpv ? R().getSpv() : 'TODOS';
    box.innerHTML = `<div class="fx-wrap">
      <div class="fx-phead"><h2>Competencia</h2><p>${spv === 'TODOS' ? 'Todos los equipos' : esc((R().supLabel || {})[spv] || spv)} · últimas 6 semanas${datos ? ` · <b>${base.length}</b> ${base.length === 1 ? 'envío' : 'envíos'}` : ''}</p></div>
      <div class="fx-chips" role="group" aria-label="Qué vio">${['Todo'].concat(TIPOS_C).map(t => `<button type="button" data-fc="${t}" aria-pressed="${filtroC === t}">${t}</button>`).join('')}</div>
      ${estadoCompe()}
      ${lst.length ? galeriaCompe(lst) : (datos ? '<div class="fx-vacio">No hay información de competencia en esta selección.</div>' : '')}
    </div>`;
    box.querySelectorAll('[data-fc]').forEach(b => b.onclick = () => { filtroC = b.dataset.fc; pintarCompe(); });
    enlazarCompe(box, lst);
  }

  // Puntito en la pestaña Competencia cuando hay envíos nuevos (supervisor y jefatura)
  function marcarVisto(){ try { localStorage.setItem(VISTO, String(Date.now())); } catch(e){} punto(); }
  function punto(){
    const top = document.querySelector('.tabbar-btn[data-sec="top"]');
    if (top){
      let n = 0;
      const v = R().vendedor, hoy = R().hoy;
      if (R().modo === 'vendedor' && v && datos && hoy){
        v.cl.filter(cl => cl._top && String(cl[3]).split(',').map(x => x.trim()).includes(hoy)).forEach(cl => { const fs = fotosCli(v.vc, cl[6]) || []; n += TIPOS.filter(t => !fs.some(x => x.Tipo === t)).length; });
      }
      let b = top.querySelector('.fx-badge'); if (!b && n){ b = document.createElement('span'); b.className = 'fx-badge'; top.appendChild(b); }
      if (b){ b.textContent = n; b.hidden = !n; }
    }
    const tab = document.querySelector('.tabbar-btn[data-sec="compe"]'); if (!tab) return;
    if (R().modo === 'vendedor' || !datos){ tab.classList.remove('fx-nuevo'); return; }
    let visto = 0; try { visto = +localStorage.getItem(VISTO) || 0; } catch(e){}
    const vcs = new Set(equipoVisible().map(c => c.vc));
    const ultimo = compe().filter(r => vcs.has(r.Vendedor)).map(r => { const d = deIso(r.Fecha); const h = String(r.Hora).split(':'); return d ? d.getTime() + ((+h[0] || 0) * 60 + (+h[1] || 0)) * 60000 : 0; });
    tab.classList.toggle('fx-nuevo', document.body.dataset.seccion !== 'compe' && ultimo.some(t => t > visto));
  }

  function iniciar(){
    if (!URL_F){ document.body.classList.add('fx-sin'); return; }
    if (R().modo === 'vendedor' && !R().vendedor) return;
    cargar().then(() => { punto(); if (R().refrescar) R().refrescar(); pintarCompe(); }, () => {});
  }

  window.Fotos = {enTop, mostrarCompe, iniciar, cargar, filaCli, bannerRuta, enlazar, semanaDe, icono: IC.cam};
})();
