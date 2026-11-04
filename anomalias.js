// =====================================================================
//  ANOMALÍAS DE VENDEDORES
// ---------------------------------------------------------------------
//  El supervisor informa si un vendedor se ausentó, llegó tarde o
//  estuvo fuera de ruta, con el motivo, si justificó, el reposo
//  (foto o PDF) y un comentario. Llega a jefatura y queda en el
//  histórico (día, semana y mes). Se guarda en Google Drive, en la
//  hoja "Anomalias" de la planilla. No hace falta modificar este archivo.
// =====================================================================
const ANOMALIAS_TIPOS = ['Ausencia', 'Llegada tardía', 'Fuera de ruta'];
const ANOMALIAS_MOTIVOS = ['Problemas familiares', 'Problemas de salud', 'Trámite personal', 'Otro'];

(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const R = () => window.RUTEO || {}, Fo = () => window.Fotos;
  const p2 = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const deIso = s => { const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
  const largo = s => { const d = deIso(s); return d ? `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}` : s; };
  const corto = s => { const d = deIso(s); return d ? `${DIAS[d.getDay()].slice(0, 3)} ${p2(d.getDate())}/${p2(d.getMonth() + 1)}` : s; };
  const lunes = s => { const d = deIso(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
  const nom = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()).split(' ').slice(0, 2).join(' ');
  const HOY = iso(new Date());
  const TIPOS = typeof ANOMALIAS_TIPOS !== 'undefined' ? ANOMALIAS_TIPOS : ['Ausencia', 'Llegada tardía', 'Fuera de ruta'];
  const MOTIVOS = typeof ANOMALIAS_MOTIVOS !== 'undefined' ? ANOMALIAS_MOTIVOS : ['Problemas familiares', 'Problemas de salud', 'Otro'];
  const clase = t => /aus/i.test(t) ? 'aus' : /tard/i.test(t) ? 'tar' : 'fue';
  const JUS = {Sí: ['si', '✓ Justificó'], No: ['no', '✗ No justificó'], Pendiente: ['pen', '⏳ Pendiente']};
  const idDe = r => (String(r['Enlace adjunto'] || '').match(/\/d\/([\w-]+)/) || [])[1] || '';
  const puedeCargar = () => R().modo === 'supervisor' && !!R().miSup;

  // Equipo que se ve: supervisor = el suyo; jefatura = el supervisor elegido arriba o todos
  function equipo(){
    const r = R(), spv = r.getSpv ? r.getSpv() : 'TODOS';
    return (r.carteras || []).filter(c => /^TR|^TM/i.test(c.vc) && !(r.isVacante && r.isVacante(c)) && (r.modo === 'supervisor' && r.miSup ? c.sup === r.miSup : (spv === 'TODOS' || spv === 'MIXTOS' || c.sup === spv)));
  }
  const lista = () => { const F = Fo(); const vcs = new Set(equipo().map(c => c.vc)); return F && F.anomalias ? F.anomalias().filter(r => vcs.has(r.Vendedor)).sort((a, b) => b.Fecha.localeCompare(a.Fecha) || String(b.Actualizado).localeCompare(String(a.Actualizado))) : []; };

  // ---------- Tarjeta (Visitas y Supervisores) ----------
  function fila(r){
    const j = JUS[r['Justificó']] || JUS.Pendiente, id = idDe(r);
    return `<button type="button" class="an-fila" data-an="${esc(r.ID)}">
      <span class="an-tipo ${clase(r['Anomalía'])}">${esc(r['Anomalía'])}</span>
      <span class="an-fi"><b>${esc(nom(r['Nombre vendedor']) || r.Vendedor)} <small>${esc(r.Vendedor)}</small></b><small>${esc(corto(r.Fecha))}${r.Motivo ? ' · ' + esc(r.Motivo) : ''}${r.Comentario ? ' · ' + esc(r.Comentario) : ''}</small></span>
      <span class="an-der"><span class="an-j ${j[0]}">${j[1]}</span>${id || r._local ? '<span class="an-adj">📎 reposo</span>' : ''}</span>
    </button>`;
  }
  function tarjeta(box){
    if (!box) return;
    const F = Fo();
    if (!F){ box.innerHTML = ''; return; }
    const xs = lista(), desde = lunes(HOY), sem = xs.filter(r => r.Fecha >= desde), hoy = xs.filter(r => r.Fecha === HOY);
    const pend = xs.filter(r => r['Justificó'] === 'Pendiente').length;
    const n = t => sem.filter(r => clase(r['Anomalía']) === t).length;
    box.innerHTML = `<section class="an-card">
      <div class="an-cab"><div><h3>Anomalías</h3><p>${hoy.length ? `<b>${hoy.length}</b> hoy · ` : 'Ninguna hoy · '}${sem.length} esta semana${pend ? ` · <b class="an-pend">${pend} sin justificar</b>` : ''}</p></div>
        ${puedeCargar() ? '<button type="button" class="an-mas" data-an-nueva>+ Informar</button>' : ''}</div>
      ${F.listo && !F.listo() ? '<div class="an-vacio">Cargando…</div>' : `
      <div class="an-kpis"><span class="aus"><b>${n('aus')}</b>ausencias</span><span class="tar"><b>${n('tar')}</b>llegadas tarde</span><span class="fue"><b>${n('fue')}</b>fuera de ruta</span></div>
      ${xs.length ? `<div class="an-lista">${xs.slice(0, 5).map(fila).join('')}</div>` : `<div class="an-vacio">${puedeCargar() ? 'Si un vendedor falta, llega tarde o sale de su ruta, tocá <b>+ Informar</b>.' : 'Todavía no hay anomalías informadas.'}</div>`}
      ${xs.length ? '<button type="button" class="an-hist" data-an-hist>Ver historial (día, semana, mes) ›</button>' : ''}`}
    </section>`;
    enlazar(box);
  }
  function enlazar(box){
    box.querySelectorAll('[data-an-nueva]').forEach(b => b.onclick = () => formulario(null));
    box.querySelectorAll('[data-an-hist]').forEach(b => b.onclick = historial);
    box.querySelectorAll('[data-an]').forEach(b => b.onclick = () => { const r = (Fo().anomalias() || []).find(x => x.ID === b.dataset.an); if (r) (puedeCargar() ? formulario(r) : ver(r)); });
  }

  // ---------- Capa (formulario, detalle, historial) ----------
  function capa(html){
    let c = $('anCapa'); if (!c){ c = document.createElement('div'); c.id = 'anCapa'; document.body.appendChild(c); }
    c.innerHTML = `<div class="an-hoja" role="dialog" aria-modal="true">${html}</div>`;
    document.body.classList.add('fx-bloq');
    const r = R(); if (r.apilar && r.tope() !== 'anom') r.apilar('', cerrarYa, true, 'anom');
    return c;
  }
  function cerrarYa(){ const c = $('anCapa'); if (c) c.innerHTML = ''; document.body.classList.remove('fx-bloq'); refrescar(); }
  function cerrar(){ const r = R(); if (r.tope && r.tope() === 'anom') r.volver(); else cerrarYa(); }
  const cab = (t, s) => `<div class="an-hcab"><button type="button" class="tf-x" data-cerrar aria-label="Volver"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><polyline points="15 6 9 12 15 18"/></svg></button><div><b>${t}</b><small>${s || ''}</small></div></div>`;
  function toast(t){ const el = document.createElement('div'); el.className = 'tf-toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }

  // Formulario: nueva (r = null) o actualizar (por ejemplo, cuando el vendedor trae el reposo)
  function formulario(r){
    const eq = equipo().sort((a, b) => a.vc.localeCompare(b.vc));
    const st = {vc: r ? r.Vendedor : '', dia: r ? r.Fecha : HOY, tipo: r ? r['Anomalía'] : TIPOS[0], motivo: r ? r.Motivo : '', jus: r ? r['Justificó'] : 'Pendiente', com: r ? r.Comentario : '', hora: '', adj: null};
    const chips = (k, xs) => xs.map(x => `<button type="button" data-${k}="${esc(x)}" aria-pressed="${st[k] === x}">${esc(x)}</button>`).join('');
    const c = capa(cab(r ? 'Actualizar anomalía' : 'Informar anomalía', r ? esc(nom(r['Nombre vendedor'])) + ' · ' + esc(corto(r.Fecha)) : 'Llega a jefatura y queda en el historial') + `
      <form class="an-form" id="anForm" novalidate>
        <label class="an-lbl" for="anVend">Vendedor<select id="anVend" ${r ? 'disabled' : ''}><option value="">Elegí el vendedor</option>${eq.map(x => `<option value="${esc(x.vc)}" ${x.vc === st.vc ? 'selected' : ''}>${esc(x.vc)} · ${esc(nom(x.vn))}</option>`).join('')}</select></label>
        <label class="an-lbl" for="anDia">Fecha<input type="date" id="anDia" value="${esc(st.dia)}" max="${HOY}" ${r ? 'disabled' : ''}></label>
        <div class="an-lbl">Anomalía<div class="an-chips" data-grupo="tipo">${chips('tipo', TIPOS)}</div></div>
        <label class="an-lbl" for="anHora" id="anHoraL" ${/tard/i.test(st.tipo) && !r ? '' : 'hidden'}>Hora de llegada<input type="time" id="anHora"></label>
        <div class="an-lbl">Motivo<div class="an-chips" data-grupo="motivo">${chips('motivo', MOTIVOS)}</div></div>
        <div class="an-lbl">¿Justificó?<div class="an-chips an-jus" data-grupo="jus">${chips('jus', ['Sí', 'No', 'Pendiente'])}</div></div>
        <div class="an-lbl">Reposo o comprobante · opcional
          <label class="an-adjb" for="anArch"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg><span id="anArchT">${r && (idDe(r) || r._local) ? 'Cambiar el adjunto' : 'Adjuntar foto o PDF del reposo'}</span></label>
          <input type="file" id="anArch" accept="image/*,application/pdf" hidden>
          <div id="anPrev">${r && r._local ? `<img src="${esc(r._local)}" alt="">` : r && idDe(r) ? `<img src="https://drive.google.com/thumbnail?id=${esc(idDe(r))}&sz=w600" alt="" onerror="this.remove()">` : ''}</div></div>
        <label class="an-lbl" for="anCom">Comentario<textarea id="anCom" placeholder="Ej.: avisó a las 7:30 que tiene fiebre; trae el reposo mañana.">${esc(st.com)}</textarea></label>
        <div id="anErr" class="fx-aviso" hidden></div>
        <button type="submit" class="tf-btn" id="anGuardar">${r ? 'Guardar cambios' : 'Enviar a jefatura'}</button>
      </form>`);
    c.querySelector('[data-cerrar]').onclick = cerrar;
    c.querySelectorAll('.an-chips button').forEach(b => b.onclick = () => {
      const g = b.parentNode.dataset.grupo; st[g] = b.dataset[g];
      b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      if (g === 'tipo' && !r) $('anHoraL').hidden = !/tard/i.test(st.tipo);
    });
    $('anArch').onchange = async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      st.adj = await preparar(f);
      $('anArchT').textContent = f.name.length > 30 ? f.name.slice(0, 28) + '…' : f.name;
      $('anPrev').innerHTML = st.adj.url ? `<img src="${st.adj.url}" alt="">` : `<span class="an-pdf">PDF · ${Math.round(f.size / 1024)} KB</span>`;
    };
    $('anForm').onsubmit = async e => {
      e.preventDefault();
      const vc = r ? r.Vendedor : $('anVend').value, dia = r ? r.Fecha : $('anDia').value, err = $('anErr');
      if (!vc || !dia || !st.tipo){ err.textContent = 'Elegí el vendedor, la fecha y la anomalía.'; err.hidden = false; return; }
      const cart = eq.find(x => x.vc === vc) || {vn: r ? r['Nombre vendedor'] : '', sup: r ? r.Supervisor : R().miSup};
      const hora = !r && /tard/i.test(st.tipo) && $('anHora').value ? 'Llegó ' + $('anHora').value + '. ' : '';
      const b = $('anGuardar'); b.disabled = true; b.textContent = 'Enviando…';
      try {
        const sn = R().nombreSup ? R().nombreSup(R().miSup) : '';
        await Fo().enviarAnomalia({id: r ? r.ID : '', dia, sup: cart.sup || R().miSup, vendedor: vc, nomVendedor: nom(cart.vn), tipo: st.tipo, motivo: st.motivo, justifico: st.jus, comentario: hora + $('anCom').value.trim(),
          imagen: st.adj ? st.adj.b64 : '', mime: st.adj ? st.adj.mime : '', ext: st.adj ? st.adj.ext : '', enlaceAnterior: r ? r['Enlace adjunto'] : '', _local: st.adj && st.adj.url ? st.adj.url : (r ? r._local : ''), registrado: r ? r.Registrado : '', cargadoPor: 'Sup. ' + (sn ? sn.split(' ').slice(0, 2).join(' ') : R().miSup)});
        cerrar(); toast(r ? 'Anomalía actualizada' : 'Anomalía enviada a jefatura');
      } catch(x){ b.disabled = false; b.textContent = r ? 'Guardar cambios' : 'Enviar a jefatura'; err.textContent = 'No se pudo enviar. Revisá la señal y probá de nuevo.'; err.hidden = false; }
    };
  }
  // Foto: se achica (1600 px) · PDF: se manda tal cual
  async function preparar(f){
    const F = Fo();
    if (/pdf/i.test(f.type)) return {b64: await F.base64(f), mime: 'application/pdf', ext: '.pdf'};
    const bmp = await new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = URL.createObjectURL(f); });
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k); cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', .82));
    return {b64: await F.base64(blob), mime: 'image/jpeg', ext: '.jpg', url: URL.createObjectURL(blob)};
  }
  // Detalle (jefatura)
  function ver(r){
    const j = JUS[r['Justificó']] || JUS.Pendiente, id = idDe(r);
    const c = capa(cab(esc(r['Anomalía']) + ' · ' + esc(nom(r['Nombre vendedor'])), esc(largo(r.Fecha))) + `
      <div class="an-det">
        <div class="an-det-f"><span class="an-tipo ${clase(r['Anomalía'])}">${esc(r['Anomalía'])}</span><span class="an-j ${j[0]}">${j[1]}</span></div>
        <dl class="fx-datos"><dt>Vendedor</dt><dd>${esc(r.Vendedor)} · ${esc(nom(r['Nombre vendedor']))}</dd><dt>Motivo</dt><dd>${esc(r.Motivo || '—')}</dd><dt>Informó</dt><dd>${esc(r['Cargado por'] || r.Supervisor)} · ${esc(r.Registrado || '')}</dd>${r.Actualizado && r.Actualizado !== r.Registrado ? `<dt>Actualizado</dt><dd>${esc(r.Actualizado)}</dd>` : ''}</dl>
        ${r.Comentario ? `<div class="fx-coment"><small>Comentario del supervisor</small><p>${esc(r.Comentario)}</p></div>` : ''}
        ${r._local ? `<img class="an-img" src="${esc(r._local)}" alt="Reposo">` : id ? `<img class="an-img" src="https://drive.google.com/thumbnail?id=${esc(id)}&sz=w1200" alt="Reposo" onerror="this.remove()"><a class="tf-btn sec" href="${esc(r['Enlace adjunto'])}" target="_blank" rel="noopener">Abrir el reposo</a>` : ''}
      </div>`);
    c.querySelector('[data-cerrar]').onclick = cerrar;
  }
  // Historial: día, semana o mes, con el total por vendedor
  const H = {modo: 'mes', ref: HOY};
  function historial(){
    const xs = lista();
    const enRango = r => H.modo === 'dia' ? r.Fecha === H.ref : H.modo === 'semana' ? lunes(r.Fecha) === lunes(H.ref) : r.Fecha.slice(0, 7) === H.ref.slice(0, 7);
    const sel = xs.filter(enRango);
    const porV = new Map(); sel.forEach(r => { const k = r.Vendedor; if (!porV.has(k)) porV.set(k, {r, aus: 0, tar: 0, fue: 0, sin: 0}); const o = porV.get(k); o[clase(r['Anomalía'])]++; if (r['Justificó'] !== 'Sí') o.sin++; });
    const filasV = [...porV.values()].sort((a, b) => (b.aus + b.tar + b.fue) - (a.aus + a.tar + a.fue));
    const mover = d => { const x = deIso(H.ref); if (H.modo === 'dia') x.setDate(x.getDate() + d); else if (H.modo === 'semana') x.setDate(x.getDate() + 7 * d); else x.setMonth(x.getMonth() + d, 1); H.ref = iso(x) > HOY ? HOY : iso(x); historial(); };
    const titulo = H.modo === 'dia' ? largo(H.ref) : H.modo === 'semana' ? 'Semana del ' + corto(lunes(H.ref)) : MESES[deIso(H.ref).getMonth()] + ' ' + deIso(H.ref).getFullYear();
    const c = capa(cab('Historial de anomalías', R().modo === 'supervisor' ? 'Tu equipo' : (R().getSpv && R().getSpv() !== 'TODOS' ? R().supLabel[R().getSpv()] : 'Todos los equipos')) + `
      <div class="an-hin">
        <div class="vs-seg an-seg" role="tablist">${['dia', 'semana', 'mes'].map(m => `<button type="button" data-modo="${m}" class="${H.modo === m ? 'on' : ''}">${{dia: 'Día', semana: 'Semana', mes: 'Mes'}[m]}</button>`).join('')}</div>
        <div class="an-nav"><button type="button" data-mov="-1" aria-label="Anterior">‹</button><b>${esc(titulo.charAt(0).toUpperCase() + titulo.slice(1))}</b><button type="button" data-mov="1" aria-label="Siguiente" ${(H.modo === 'mes' ? H.ref.slice(0, 7) === HOY.slice(0, 7) : H.modo === 'semana' ? lunes(H.ref) === lunes(HOY) : H.ref === HOY) ? 'disabled' : ''}>›</button></div>
        <div class="an-kpis"><span class="aus"><b>${sel.filter(r => clase(r['Anomalía']) === 'aus').length}</b>ausencias</span><span class="tar"><b>${sel.filter(r => clase(r['Anomalía']) === 'tar').length}</b>llegadas tarde</span><span class="fue"><b>${sel.filter(r => clase(r['Anomalía']) === 'fue').length}</b>fuera de ruta</span></div>
        ${filasV.length ? `<h4 class="an-h4">Por vendedor</h4><div class="an-tabla">${filasV.map(o => `<div class="an-tv"><b>${esc(nom(o.r['Nombre vendedor']) || o.r.Vendedor)} <small>${esc(o.r.Vendedor)}</small></b><span class="aus">${o.aus || ''}</span><span class="tar">${o.tar || ''}</span><span class="fue">${o.fue || ''}</span><em>${o.sin ? o.sin + ' sin justificar' : '✓ todo justificado'}</em></div>`).join('')}</div>
          <h4 class="an-h4">Detalle</h4><div class="an-lista">${sel.map(fila).join('')}</div>` : '<div class="an-vacio">Sin anomalías en este período.</div>'}
      </div>`);
    c.querySelector('[data-cerrar]').onclick = cerrar;
    c.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => { H.modo = b.dataset.modo; historial(); });
    c.querySelectorAll('[data-mov]').forEach(b => b.onclick = () => mover(+b.dataset.mov));
    c.querySelectorAll('[data-an]').forEach(b => b.onclick = () => { const r = xs.find(x => x.ID === b.dataset.an); if (r) (puedeCargar() ? formulario(r) : ver(r)); });
  }

  // ---------- Dónde se muestra ----------
  const cajas = new Set();
  function en(box){ if (!box) return; cajas.add(box); tarjeta(box); const F = Fo(); if (F && F.cargar) F.cargar().then(() => tarjeta(box), () => tarjeta(box)); }
  function refrescar(){ cajas.forEach(b => { if (document.body.contains(b)) tarjeta(b); else cajas.delete(b); }); if (window.Visitas && window.Visitas.refrescar) window.Visitas.refrescar(); }
  // Etiqueta para la lista de visitas: anomalía de ese vendedor ese día
  function de(vc, dia){ const F = Fo(); if (!F || !F.anomalias) return null; return F.anomalias().find(r => r.Vendedor === vc && r.Fecha === dia) || null; }
  function etiqueta(vc, dia){ const r = de(vc, dia); if (!r) return ''; const j = JUS[r['Justificó']] || JUS.Pendiente; return `<span class="an-tag ${clase(r['Anomalía'])}">${esc(r['Anomalía'])} · ${j[1].replace(/^\S+ /, '')}</span>`; }
  // Para los avisos
  function resumen(vcs){ const F = Fo(); if (!F || !F.anomalias || !F.listo || !F.listo()) return null; const xs = F.anomalias().filter(r => vcs.has(r.Vendedor)); return {hoy: xs.filter(r => r.Fecha === HOY), semana: xs.filter(r => r.Fecha >= lunes(HOY)), pendientes: xs.filter(r => r['Justificó'] === 'Pendiente')}; }

  window.Anomalias = {en, refrescar, etiqueta, de, resumen, historial};
})();
