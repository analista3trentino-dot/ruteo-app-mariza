// =====================================================================
//  FICHA DEL CLIENTE TOP: Ampliación · Reposición · Ingreso
// ---------------------------------------------------------------------
//  Usa las marcas foco de marcasfoco.js. El vendedor completa la ficha
//  y la envía; llega a Google Drive (hoja "Gestion TOP") y el supervisor
//  y jefatura la ven en la app. No hace falta modificar este archivo.
// =====================================================================
(function () {
  const MF = window.MARCAS_FOCO;
  if (!MF){ window.TopFoco = null; return; }
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const gs = n => 'Gs. ' + Math.round(n || 0).toLocaleString('es-PY');
  const mill = n => (n / 1e6).toLocaleString('es-PY', {maximumFractionDigits: 1}) + ' M';
  const R_ = () => window.RUTEO || {};
  const CAT = Object.fromEntries(MF.cats.map(c => [c.id, c]));
  const BC = {'Menoyo':'#C8102E','Santa Mónica':'#7A1F4B','Urca':'#0077C8','Maguary':'#F28C00','Rivoli':'#4C7A2E','Piacere':'#D4371C','Listo':'#E4002B','Mesa':'#1F6FB2','Residence':'#5B3F99','Chocobon':'#6B3A1E','Selky':'#C99700','Vitao':'#2E8B57','My Bit':'#E5007E','Casaredo':'#B5651D'};
  const sigla = m => m.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const nom = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
  const PM_SE = pm => ['13.1', '13.2', '13.5', '12.1', '12.2'].includes(String(pm)) ? String(pm) : '13.1';   // 21.1 y otros: surtido de 13.1
  const nombreCat = cat => cat.m + ' · ' + cat.n;

  // ---- Qué le toca a un cliente en cada categoría foco ----
  const memo = new Map();
  function analizar(cl){
    const k = cl[6] + '|' + cl[8]; if (memo.has(k)) return memo.get(k);
    const d = MF.cli[cl[6]] || (cl[9] && MF.cli[cl[9]]) || {b: [], v: {}, t: 0, sv: 1};
    const b = new Set(d.b), pm = PM_SE(cl[8]), out = {amp: [], rep: [], ing: [], ok: 0, d};
    MF.cats.forEach(cat => {
      const req = cat.skus.filter(s => (MF.sku[s].pm || {})[pm] > 0), lista = req.length ? req : cat.skus;
      if (!cat.skus.some(s => b.has(s))){ out.ing.push({cat, skus: lista}); return; }
      out.rep.push({cat});
      const falta = lista.filter(s => !b.has(s));
      if (falta.length) out.amp.push({cat, req: lista, falta}); else out.ok++;
    });
    out.cob = (MF.cats.length - out.ing.length) / MF.cats.length;
    memo.set(k, out); return out;
  }
  function resumen(cl){ const A = analizar(cl); return {amp: A.amp.length, rep: A.rep.length, ing: A.ing.length, cob: A.cob}; }

  // ---- Respuestas: borrador del vendedor (queda guardado en el celular) ----
  const KB = cod => 'ruteoTR1_ficha_' + cod;
  const fotosMem = {};   // fotos sacadas (no se pueden guardar en el celular hasta enviarlas)
  function borrador(cod){
    let r = null; try { r = JSON.parse(localStorage.getItem(KB(cod)) || 'null'); } catch(e){}
    r = r || {amp: {}, ing: {}, rep: {}};
    Object.entries(fotosMem[cod] || {}).forEach(([id, f]) => { (r.rep[id] || (r.rep[id] = {})).foto = f; });
    return r;
  }
  function guardar(cod, r){
    const copia = JSON.parse(JSON.stringify(r, (k, v) => k === 'foto' ? undefined : v));
    try { localStorage.setItem(KB(cod), JSON.stringify(copia)); } catch(e){}
  }
  // Lo último que envió el vendedor (para el supervisor): de la hoja Gestion TOP
  function desdeGestion(cl){
    const F = window.Fotos, rows = F && F.gestion ? F.gestion().filter(x => x['Código'] === cl[6]) : [];
    const r = {amp: {}, ing: {}, rep: {}, fecha: ''};
    const porNombre = {}; MF.cats.forEach(c => porNombre[nombreCat(c)] = c.id);
    rows.slice().reverse().forEach(x => {   // del más viejo al más nuevo: queda lo último
      const id = porNombre[x.Marca + ' · ' + x['Categoría']];
      if (!r.fecha || x.Fecha > r.fecha) r.fecha = x.Fecha;
      if (x['Acción'] === 'Ampliación') r.amp[x['Cód. artículo']] = {v: /^se ofreci/i.test(x.Respuesta) ? 'si' : 'no', com: x.Comentario, f: x.Fecha};
      else if (x['Acción'] === 'Ingreso') r.ing[x['Cód. artículo']] = {v: /^acept/i.test(x.Respuesta) ? 'si' : 'no', com: x.Comentario, f: x.Fecha};
      else if (x['Acción'] === 'Reposición' && id){
        const m = String(x['Enlace foto'] || '').match(/\/d\/([\w-]+)/);
        r.rep[id] = {ubic: /ubicaci[oó]n s[ií]/i.test(x.Respuesta) ? 'si' : 'no', part: /participaci[oó]n s[ií]/i.test(x.Respuesta) ? 'si' : 'no', tenemos: x['Caras tenemos'], faltan: x['Caras faltan'], ok: true, f: x.Fecha,
          foto: m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000` : ''};
      }
    });
    return r;
  }

  // ---- Piezas de la pantalla ----
  function anillo(p){
    const r = 23, L = 2 * Math.PI * r;
    return `<div class="tf-anillo"><svg viewBox="0 0 56 56" aria-hidden="true"><circle class="b" cx="28" cy="28" r="${r}" fill="none" stroke-width="6"/><circle class="v" cx="28" cy="28" r="${r}" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - p)}"/></svg><b>${Math.round(p * 100)}%</b></div>`;
  }
  const logo = cat => `<span class="tf-logo" style="--bc:${BC[cat.m] || '#2E5BFF'}">${esc(sigla(cat.m))}</span>`;
  const sino = (k, v, ro) => `<div class="tf-sino" role="group"><button type="button" data-k="${k}" data-v="si" aria-pressed="${v === 'si'}" ${ro ? 'disabled' : ''}>Sí</button><button type="button" data-k="${k}" data-v="no" aria-pressed="${v === 'no'}" ${ro ? 'disabled' : ''}>No</button></div>`;
  function toast(t){ const el = document.createElement('div'); el.className = 'tf-toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }

  // ================= FICHA =================
  let F = null;   // {c, cl, tab, abierto, ro, r, A}
  function abrir(c, cl, soloVer){
    const ro = soloVer || R_().modo !== 'vendedor';
    F = {c, cl, tab: 'amp', abierto: '', ro, A: analizar(cl), r: ro ? desdeGestion(cl) : borrador(cl[6])};
    if (!F.A.amp.length) F.tab = F.A.rep.length ? 'rep' : 'ing';
    let box = $('tfCapa'); if (!box){ box = document.createElement('div'); box.id = 'tfCapa'; document.body.appendChild(box); }
    pintar(); document.body.classList.add('fx-bloq');
    if (R_().apilar && R_().tope() !== 'ficha') R_().apilar('', cerrarYa, true, 'ficha');
  }
  function cerrarYa(){ const b = $('tfCapa'); if (b) b.innerHTML = ''; F = null; document.body.classList.remove('fx-bloq'); if (R_().refrescar) R_().refrescar(); }
  function cerrar(){ if (R_().tope && R_().tope() === 'ficha') R_().volver(); else cerrarYa(); }
  function hoja(){ return $('tfCapa').querySelector('.tf-hoja'); }
  function repintar(fn){ const h = hoja(), y = h ? h.scrollTop : 0; if (fn) fn(); pintar(); const h2 = hoja(); if (h2) h2.scrollTop = y; }

  function pintar(){
    const {c, cl, A, r, ro} = F;
    const nAmp = A.amp.reduce((t, x) => t + x.falta.length, 0), repOk = A.rep.filter(x => (r.rep[x.cat.id] || {}).ok).length;
    const TABS = [['amp', 'Ampliación', A.amp.length + ' marcas · ' + nAmp + ' prod.', 'var(--acento)'], ['rep', 'Reposición', repOk + ' de ' + A.rep.length, 'var(--esmeralda)'], ['ing', 'Ingreso', A.ing.length + ' categorías', 'var(--oro)']];
    const cuerpo = F.tab === 'amp' ? tabAmp() : F.tab === 'rep' ? tabRep() : tabIng();
    const n = cuenta();
    $('tfCapa').innerHTML = `<div class="tf-hoja" role="dialog" aria-modal="true" aria-label="Ficha del cliente top">
      <div class="tf-cab"><div class="tf-in">
        <div class="tf-fila"><button type="button" class="tf-x" id="tfX" aria-label="Volver"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><polyline points="15 6 9 12 15 18"/></svg></button>
          <div class="tf-t"><b>${esc(cl[2])}</b><small>${esc(cl[6])}${cl[9] ? ' · venta ' + esc(cl[9]) : ''} · PM ${esc(cl[8])} · compró ${mill(A.d.t || 0)} (${esc(MF.fecha)})</small></div>${anillo(A.cob)}</div>
        <div class="tf-tabs" role="tablist">${TABS.map(t => `<button type="button" role="tab" data-tab="${t[0]}" aria-selected="${F.tab === t[0]}" style="--c:${t[3]}">${t[1]}<small>${t[2]}</small></button>`).join('')}</div>
      </div></div>
      <div class="tf-cuerpo"><div class="tf-in">
        ${ro ? `<div class="tf-aviso">${r.fecha ? `Última ficha enviada por <b>${esc(nom(c.vn))}</b> el <b>${esc(r.fecha.split('-').reverse().join('/'))}</b>. Se muestra lo que respondió.` : `<b>${esc(nom(c.vn))}</b> todavía no envió la ficha de este cliente en las últimas semanas.`}</div>` : ''}
        ${A.d.sv ? `<div class="tf-aviso"><b>Sin compras registradas</b> de ${esc(MF.fecha)} con este código: todas las marcas foco aparecen para ingresar.</div>` : ''}
        ${cuerpo}</div></div>
      ${ro ? '' : `<div class="tf-pie"><div class="tf-in"><div class="tf-pie-t"><b>${n.n} ${n.n === 1 ? 'respuesta' : 'respuestas'}</b>${A.rep.length && !n.rep ? 'Falta al menos una reposición con foto' : n.rep + ' ' + (n.rep === 1 ? 'reposición controlada' : 'reposiciones controladas')}</div><button type="button" class="tf-btn" id="tfEnviar" ${n.n && (!A.rep.length || n.rep) ? '' : 'disabled'}>Enviar al supervisor</button></div></div>`}
    </div>`;
    enlazar();
  }
  function cuenta(){
    const r = F.r;
    const n = Object.values(r.amp).filter(x => x.v).length + Object.values(r.ing).filter(x => x.v).length + Object.values(r.rep).filter(x => x.ok).length;
    return {n, rep: Object.values(r.rep).filter(x => x.ok).length};
  }

  function tabAmp(){
    const {A, r, ro} = F;
    if (!A.amp.length) return `<div class="tf-aviso"><b>Sin ampliación pendiente.</b> En las marcas que ya compra tiene todo el surtido.</div>`;
    return `<p class="tf-intro">Marcas que el cliente ya compra pero le faltan productos del surtido de su PM. Ofrecé los que faltan y marcá si se ofreció.</p>` + A.amp.map(x => {
      const ab = F.abierto === x.cat.id, tiene = x.req.length - x.falta.length, cont = x.falta.filter(s => (r.amp[s] || {}).v).length;
      return `<section class="tf-cat ${cont === x.falta.length ? 'listo' : ''}">
        <button type="button" class="tf-cat-h" data-abrir="${x.cat.id}" aria-expanded="${ab}">${logo(x.cat)}
          <span class="tf-cat-i"><b>${esc(nombreCat(x.cat))}</b><small>Tiene ${tiene} de ${x.req.length} · faltan ${x.falta.length}</small><span class="tf-mini"><i style="width:${Math.round(tiene / x.req.length * 100)}%"></i></span></span>
          <span class="tf-est ${cont === x.falta.length ? 'ok' : ''}">${cont}/${x.falta.length}</span></button>
        ${ab ? `<div class="tf-cat-b">${x.req.map(s => {
          const k = MF.sku[s], ya = !x.falta.includes(s), a = r.amp[s] || {};
          return `<div class="tf-sku"><div class="tf-sku-n">${esc(k.d)}<small>${s}${k.b ? ' · ' + k.b : ''}</small></div>
            ${ya ? `<span class="tf-tiene">✓ Ya lo tiene</span>` : sino('amp:' + s, a.v, ro) + `<span class="tf-lbl">¿Se ofreció?</span>${a.v && (!ro || a.com) ? `<input class="tf-com" data-com="amp:${s}" placeholder="Comentario (opcional)" value="${esc(a.com || '')}" ${ro ? 'readonly' : ''}>` : ''}`}</div>`;
        }).join('')}</div>` : ''}
      </section>`;
    }).join('');
  }
  function tabIng(){
    const {A, r, ro, cl} = F, pm = PM_SE(cl[8]);
    if (!A.ing.length) return `<div class="tf-aviso"><b>¡Excelente!</b> Ya compra todas las categorías foco.</div>`;
    return `<p class="tf-intro">Marcas foco que este cliente todavía no compra. Cada producto trae su código de barras y la cantidad sugerida para la góndola.</p>` + A.ing.map(x => {
      const ab = F.abierto === x.cat.id, cont = x.skus.filter(s => (r.ing[s] || {}).v).length, si = x.skus.filter(s => (r.ing[s] || {}).v === 'si').length;
      return `<section class="tf-cat ${si ? 'listo' : ''}">
        <button type="button" class="tf-cat-h" data-abrir="${x.cat.id}" aria-expanded="${ab}">${logo(x.cat)}
          <span class="tf-cat-i"><b>${esc(nombreCat(x.cat))}</b><small>${x.skus.length} productos para ingresar${si ? ' · ' + si + ' aceptados' : ''}</small></span>
          <span class="tf-est ${si ? 'ok' : ''}">${cont ? cont + '/' + x.skus.length : 'Nuevo'}</span></button>
        ${ab ? `<div class="tf-cat-b"><details class="tf-crit"><summary>Dónde va en la góndola</summary><p><b>Ubicación:</b> ${esc(x.cat.ubic || '—')}\n<b>Espacio:</b> ${esc(x.cat.part || '—')}</p></details>${x.skus.map(s => {
          const k = MF.sku[s], a = r.ing[s] || {}, g = (k.g || {})[pm];
          return `<div class="tf-prod"><span class="tf-fotop" style="--bc:${BC[x.cat.m] || '#2E5BFF'}">${esc(x.cat.m.toUpperCase())}</span>
            <div class="tf-prod-i"><b>${esc(k.d)}</b><small>Cód. ${s}${k.b ? ' · Barras ' + k.b : ''}</small>${g ? `<span class="tf-gond">Góndola sugerida: ${g} unid.</span>` : ''}
              <div class="tf-pre"><span class="tf-lbl">¿Lo aceptó?</span>${sino('ing:' + s, a.v, ro)}</div>
              ${a.v && (!ro || a.com) ? `<input class="tf-com" data-com="ing:${s}" placeholder="${a.v === 'no' ? '¿Por qué no? (precio, espacio, trabaja otra marca…)' : 'Comentario (opcional)'}" value="${esc(a.com || '')}" ${ro ? 'readonly' : ''}>` : ''}</div></div>`;
        }).join('')}</div>` : ''}
      </section>`;
    }).join('');
  }
  const listoRep = q => !!(q.foto && q.ubic && q.part && (q.ubic === 'si' && q.part === 'si' || (q.tenemos !== undefined && q.tenemos !== '' && q.faltan !== undefined && q.faltan !== '')));
  function tabRep(){
    const {A, r, ro} = F;
    if (!A.rep.length) return `<div class="tf-aviso"><b>Todavía no compra marcas foco.</b> La reposición aparece cuando la marca ya está ingresada. Empezá por Ingreso.</div>`;
    return `<p class="tf-intro">Para cada marca que el cliente ya trabaja: primero la foto de la góndola, después dos preguntas. Si alguna es <b>No</b>, anotá cuántas caras tenemos y cuántas faltan.</p>` + A.rep.map(x => {
      const id = x.cat.id, ab = F.abierto === id, q = r.rep[id] || {}, ok = !!q.ok;
      return `<section class="tf-cat ${ok ? 'listo' : ''}">
        <button type="button" class="tf-cat-h" data-abrir="${id}" aria-expanded="${ab}">${logo(x.cat)}
          <span class="tf-cat-i"><b>${esc(nombreCat(x.cat))}</b><small>${ok ? (q.ubic === 'si' && q.part === 'si' ? 'Bien ubicada y con su espacio' : `Falta corregir${q.faltan ? ' · faltan ' + q.faltan + ' caras' : ''}`) : esc(x.cat.ubic || '')}</small></span>
          <span class="tf-est ${ok ? 'ok' : ''}">${ok ? '✓ Listo' : 'Pendiente'}</span></button>
        ${ab ? `<div class="tf-cat-b">
          <div class="tf-paso ${q.foto ? 'ok' : ''}"><i>${q.foto ? '✓' : '1'}</i>Foto de la góndola</div>
          ${q.foto ? `<div class="tf-fotook"><img src="${esc(q.foto.url || q.foto)}" alt="Foto de la góndola">${ro ? '' : `<button type="button" data-foto="${id}">Sacar otra</button>`}</div>` : ro ? '<p class="tf-intro">Sin foto.</p>' : `<button type="button" class="tf-btnfoto" data-foto="${id}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Sacar foto</button>`}
          <div class="tf-paso ${q.ubic && q.part ? 'ok' : ''}"><i>${q.ubic && q.part ? '✓' : '2'}</i>Control</div>
          <div class="tf-preg"><span class="tf-preg-t">Ubicación</span><span class="tf-preg-q">${esc(x.cat.ubic || 'Según direccionamiento')}</span>${sino('ubic:' + id, q.ubic, ro)}</div>
          <div class="tf-preg"><span class="tf-preg-t">Participación (espacio)</span><span class="tf-preg-q">${esc(x.cat.part || 'Según direccionamiento')}</span>${sino('part:' + id, q.part, ro)}</div>
          ${q.ubic === 'no' || q.part === 'no' ? `<div class="tf-caras">
            ${['tenemos', 'faltan'].map(k => `<div class="tf-num"><label for="tf-${k}-${id}">Caras que ${k}</label><div class="tf-step">${ro ? '' : `<button type="button" data-paso="${k}:${id}:-1" aria-label="Menos">−</button>`}<input id="tf-${k}-${id}" type="number" inputmode="numeric" min="0" data-numero="${k}:${id}" value="${q[k] ?? ''}" placeholder="0" ${ro ? 'readonly' : ''}>${ro ? '' : `<button type="button" data-paso="${k}:${id}:1" aria-label="Más">+</button>`}</div></div>`).join('')}
          </div>` : ''}
          <details class="tf-crit"><summary>Ver criterio de exhibición</summary><p>${esc(x.cat.crit || '—')}${x.cat.extra && !/no participa/i.test(x.cat.extra) ? '\n\nEspacio extra: ' + esc(x.cat.extra) : ''}</p></details>
          ${ro ? '' : `<button type="button" class="tf-btn" data-listo="${id}" ${listoRep(q) ? '' : 'disabled'}>Guardar control</button>`}
        </div>` : ''}
      </section>`;
    }).join('');
  }

  function enlazar(){
    const capa = $('tfCapa'), r = F.r, cod = F.cl[6];
    $('tfX').onclick = cerrar;
    capa.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { F.tab = b.dataset.tab; F.abierto = ''; pintar(); hoja().scrollTop = 0; });
    capa.querySelectorAll('[data-abrir]').forEach(b => b.onclick = () => repintar(() => { F.abierto = F.abierto === b.dataset.abrir ? '' : b.dataset.abrir; }));
    if (F.ro) return;
    capa.querySelectorAll('.tf-sino button').forEach(b => b.onclick = () => repintar(() => {
      const [t, id] = b.dataset.k.split(':'), v = b.dataset.v;
      if (t === 'amp' || t === 'ing'){ const o = r[t][id] || (r[t][id] = {}); o.v = o.v === v ? '' : v; }
      else { const o = r.rep[id] || (r.rep[id] = {}); o[t] = v; o.ok = false; }
      guardar(cod, r);
    }));
    capa.querySelectorAll('[data-com]').forEach(i => i.oninput = () => { const [t, id] = i.dataset.com.split(':'); (r[t][id] || (r[t][id] = {})).com = i.value; guardar(cod, r); });
    capa.querySelectorAll('[data-numero]').forEach(i => i.oninput = () => { const [k, id] = i.dataset.numero.split(':'), o = r.rep[id] || (r.rep[id] = {}); o[k] = i.value === '' ? '' : Math.max(0, +i.value); o.ok = false; guardar(cod, r); const btn = capa.querySelector(`[data-listo="${id}"]`); if (btn) btn.disabled = !listoRep(o); });
    capa.querySelectorAll('[data-paso]').forEach(b => b.onclick = () => repintar(() => { const [k, id, d] = b.dataset.paso.split(':'), o = r.rep[id] || (r.rep[id] = {}); o[k] = Math.max(0, (+o[k] || 0) + +d); o.ok = false; guardar(cod, r); }));
    capa.querySelectorAll('[data-listo]').forEach(b => b.onclick = () => repintar(() => { r.rep[b.dataset.listo].ok = true; F.abierto = ''; guardar(cod, r); toast('Control guardado'); }));
    capa.querySelectorAll('[data-foto]').forEach(b => b.onclick = async () => {
      const id = b.dataset.foto, cat = CAT[id], f = F;
      if (!window.Fotos || !window.Fotos.tomarFoto) return;
      const v = R_().vendedor;
      const fo = await window.Fotos.tomarFoto({titulo: nombreCat(cat), sub: f.cl[2], lineas: d => [f.cl[2] + (f.cl[9] ? ' (' + f.cl[9] + ')' : ''), {t: 'REPOSICIÓN  ·  ' + nombreCat(cat).toUpperCase() + '  ·  ' + f.cl[6], color: '#7BE3B6'}, (v ? v.vc + ' ' + nom(v.vn).split(' ').slice(0, 2).join(' ') : '') + '  ·  ' + d.toLocaleDateString('es-PY') + ' ' + d.toTimeString().slice(0, 5)]});
      if (!fo || F !== f) return;
      (fotosMem[cod] || (fotosMem[cod] = {}))[id] = fo;
      const o = r.rep[id] || (r.rep[id] = {}); o.foto = fo; o.ok = false;
      repintar();
    });
    const env = $('tfEnviar'); if (env) env.onclick = confirmarEnvio;
  }

  function confirmarEnvio(){
    const r = F.r, amp = Object.values(r.amp).filter(x => x.v), ing = Object.values(r.ing).filter(x => x.v), rep = Object.values(r.rep).filter(x => x.ok);
    const caras = rep.reduce((t, x) => t + (+x.faltan || 0), 0);
    const v = document.createElement('div'); v.className = 'tf-velo';
    v.innerHTML = `<div class="tf-dlg" role="dialog" aria-modal="true" aria-labelledby="tfDT"><h3 id="tfDT">¿Enviar al supervisor?</h3>
      <ul><li><b>Ampliación:</b> ${amp.filter(x => x.v === 'si').length} ofrecidos · ${amp.filter(x => x.v === 'no').length} no ofrecidos</li>
      <li><b>Ingreso:</b> ${ing.filter(x => x.v === 'si').length} aceptados · ${ing.filter(x => x.v === 'no').length} no aceptados</li>
      <li><b>Reposición:</b> ${rep.length} ${rep.length === 1 ? 'marca controlada' : 'marcas controladas'}${caras ? ' · faltan ' + caras + ' caras' : ''}</li></ul>
      <div class="tf-dos"><button type="button" class="tf-btn sec" id="tfNo">Revisar</button><button type="button" class="tf-btn" id="tfSi">Sí, enviar</button></div></div>`;
    document.body.appendChild(v);
    v.querySelector('#tfNo').onclick = () => v.remove();
    v.querySelector('#tfSi').onclick = () => { v.remove(); enviar(); };
  }
  async function enviar(){
    const f = F, {cl, r} = f, Fo = window.Fotos, btn = $('tfEnviar'), v = R_().vendedor;
    if (!Fo || !Fo.enviarGestion){ toast('Falta configurar Google Drive (config.js)'); return; }
    const meta = {sup: v.sup, vendedor: v.vc, nomVendedor: nom(v.vn).split(' ').slice(0, 2).join(' '), cliente: cl[2] + (cl[9] ? ' (' + cl[9] + ')' : ''), codigo: cl[6], pm: cl[8]};
    const fila = (accion, cat, extra) => Object.assign({accion, marca: cat.m, categoria: cat.n}, extra);
    const filas = [];
    f.A.amp.forEach(x => x.falta.forEach(s => { const a = r.amp[s]; if (a && a.v) filas.push(fila('Ampliación', x.cat, {producto: MF.sku[s].d, art: s, resp: a.v === 'si' ? 'Se ofreció' : 'No se ofreció', com: a.com || ''})); }));
    f.A.ing.forEach(x => x.skus.forEach(s => { const a = r.ing[s]; if (a && a.v) filas.push(fila('Ingreso', x.cat, {producto: MF.sku[s].d, art: s, resp: a.v === 'si' ? 'Aceptó' : 'No aceptó', com: a.com || ''})); }));
    const reps = f.A.rep.filter(x => (r.rep[x.cat.id] || {}).ok);
    try {
      for (let i = 0; i < reps.length; i++){
        const x = reps[i], q = r.rep[x.cat.id];
        if (btn){ btn.disabled = true; btn.textContent = `Subiendo foto ${i + 1} de ${reps.length}…`; }
        let enlace = '';
        if (q.foto && q.foto.blob){ const j = await Fo.subirFoto(q.foto, Object.assign({}, meta, {tipo: 'Reposición', comentario: nombreCat(x.cat) + (q.ubic === 'no' || q.part === 'no' ? ` · tenemos ${q.tenemos || 0} caras, faltan ${q.faltan || 0}` : '')})); enlace = j.enlace || ''; }
        filas.push(fila('Reposición', x.cat, {resp: `Ubicación ${q.ubic === 'si' ? 'sí' : 'no'} · Participación ${q.part === 'si' ? 'sí' : 'no'}`, tenemos: q.ubic === 'si' && q.part === 'si' ? '' : q.tenemos, faltan: q.ubic === 'si' && q.part === 'si' ? '' : q.faltan, enlace}));
      }
      if (btn) btn.textContent = 'Enviando…';
      await Fo.enviarGestion(meta, filas);
      try { localStorage.removeItem(KB(cl[6])); } catch(e){}
      delete fotosMem[cl[6]];
      toast('Ficha enviada. Tu supervisor ya la puede ver.');
      if (F === f) cerrar();
    } catch(e){
      if (btn){ btn.disabled = false; btn.textContent = 'Enviar al supervisor'; }
      toast('No se pudo enviar. Revisá la señal y probá de nuevo; lo cargado no se pierde.');
    }
  }

  // ================= ANÁLISIS (supervisor / jefatura, pestaña Top) =================
  const tono = p => p >= .6 ? 'good' : p >= .3 ? 'mid' : 'bad';
  function analisis(box, carteras){
    const NC = MF.cats.length, cs = [];
    carteras.forEach(c => c.cl.forEach(cl => { if (cl._top) cs.push({c, cl, A: analizar(cl)}); }));
    const n = cs.length;
    if (!n){ box.innerHTML = ''; return; }
    const entr = cs.reduce((t, x) => t + (NC - x.A.ing.length), 0), cob = entr / (n * NC);
    const ing = cs.reduce((t, x) => t + x.A.ing.length, 0), amp = cs.reduce((t, x) => t + x.A.amp.reduce((u, y) => u + y.falta.length, 0), 0);
    const porCat = MF.cats.map(cat => { const con = cs.filter(x => !x.A.ing.some(y => y.cat === cat)).length; return {cat, con, p: con / n}; }).sort((a, b) => b.p - a.p);
    const ui = analisis.ui || (analisis.ui = {todas: false});
    const lista = ui.todas ? porCat : porCat.slice(0, 5).concat(porCat.slice(-5));
    box.innerHTML = `<section class="tf-an">
      <div class="tf-an-top"><div><h3>Marcas foco</h3><p>${n} clientes top · 32 categorías del direccionamiento · compras de ${esc(MF.fecha)}</p></div></div>
      <div class="tf-kpis">
        <div class="tf-kpi dest"><span>Cobertura</span><b>${Math.round(cob * 100)}%</b><div class="tf-kbar"><i style="width:${Math.round(cob * 100)}%"></i></div></div>
        <div class="tf-kpi"><b style="color:var(--oro-osc)">${ing.toLocaleString('es-PY')}</b><span>para ingresar</span></div>
        <div class="tf-kpi"><b style="color:var(--acento)">${amp.toLocaleString('es-PY')}</b><span>productos para ampliar</span></div>
      </div>
      <div class="tf-lst">${lista.map((x, i) => `${!ui.todas && i === 5 ? '<div class="tf-sep">Las que menos compran</div>' : ''}<button type="button" class="tf-fcat" data-cat="${x.cat.id}">${logo(x.cat)}<span class="tf-fcat-n"><b>${esc(nombreCat(x.cat))}</b><small>${x.con} de ${n} clientes</small></span><span class="tf-hbar"><i class="b-${tono(x.p)}" style="width:${Math.max(2, Math.round(x.p * 100))}%"></i></span><span class="tf-pct t-${tono(x.p)}">${Math.round(x.p * 100)}%</span></button>`).join('')}</div>
      <button type="button" class="fx-link" id="tfTodas">${ui.todas ? 'Ver menos' : 'Ver las 32 categorías'}</button>
    </section>`;
    $('tfTodas').onclick = () => { ui.todas = !ui.todas; analisis(box, carteras); };
    box.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => verCategoria(CAT[b.dataset.cat], cs));
  }
  function verCategoria(cat, cs){
    const sin = cs.filter(x => x.A.ing.some(y => y.cat === cat)), con = cs.filter(x => !x.A.ing.some(y => y.cat === cat));
    const v = document.createElement('div'); v.className = 'tf-velo';
    const item = x => `<button type="button" class="tf-li" data-cod="${esc(x.cl[6])}" data-vc="${esc(x.c.vc)}"><b>${esc(x.cl[2])}</b><small>${esc(x.c.vc)} · ${esc(nom(x.c.vn).split(' ')[0])}${(x.A.d.v || {})[cat.id] ? ' · ' + gs(x.A.d.v[cat.id]) : ''}</small></button>`;
    v.innerHTML = `<div class="tf-dlg" role="dialog" aria-modal="true" aria-labelledby="tfCT"><h3 id="tfCT">${esc(nombreCat(cat))}</h3>
      <p class="tf-intro"><b>Ubicación:</b> ${esc(cat.ubic || '—')}<br><b>Espacio:</b> ${esc(cat.part || '—')}</p>
      <div class="tf-sep">Todavía no la compran (${sin.length})</div>${sin.map(item).join('')}
      <div class="tf-sep">Ya la compran (${con.length})</div>${con.map(item).join('')}
      <button type="button" class="tf-btn sec" id="tfCX">Cerrar</button></div>`;
    document.body.appendChild(v);
    v.querySelector('#tfCX').onclick = () => v.remove(); v.onclick = e => { if (e.target === v) v.remove(); };
    v.querySelectorAll('.tf-li').forEach(b => b.onclick = () => { const x = cs.find(y => y.cl[6] === b.dataset.cod && y.c.vc === b.dataset.vc); v.remove(); if (x) abrir(x.c, x.cl, true); });
  }

  window.TopFoco = {resumen, abrir, analisis, analizar};
})();
