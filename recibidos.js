// =====================================================================
//  RECIBIDO DE LOS SUPERVISORES (pantalla Control de Jefatura)
// ---------------------------------------------------------------------
//  Todo lo que mandan los supervisores, ordenado por hora de llegada:
//   - Fichas TOP: de qué cliente, de qué vendedor (cartera), qué SPV la
//     envió, sus fotos y TODOS los comentarios.
//   - Anomalías: qué vendedor, qué pasó, si justificó o si venció (17:00).
//   - Fotos sueltas que no son parte de una ficha.
//  Tocando una ficha se ve el detalle completo.
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const p2 = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const deIso = s => { const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const HOY = iso(new Date()), AYER = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return iso(d); })();
  const lunes = s => { const d = deIso(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
  const nom = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()).split(' ').slice(0, 2).join(' ');
  const hora = s => { const m = String(s || '').match(/(\d{1,2}):(\d{2})/); return m ? p2(m[1]) + ':' + m[2] : ''; };
  const cuando = f => f === HOY ? 'hoy' : f === AYER ? 'ayer' : (() => { const d = deIso(f); return d ? DIAS[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1) : f; })();
  const idFoto = u => (String(u || '').match(/\/d\/([\w-]+)/) || String(u || '').match(/[?&]id=([\w-]+)/) || [])[1] || '';
  const thumb = (id, w) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w || 400}`;
  const RU = () => window.RUTEO || {}, F = () => window.Fotos;
  const nombreSup = k => (RU().nombreSup && RU().nombreSup(k)) || k || '';
  const quien = r => r['Cargado por'] ? String(r['Cargado por']).replace(/^Sup\.\s*/i, 'SPV ') : 'SPV ' + nom(nombreSup(r.Supervisor));
  const vendNom = r => { const c = (RU().carteras || []).find(x => x.vc === r.Vendedor); return nom(r['Nombre vendedor'] || (c && c.vn) || ''); };
  const cliNom = s => String(s || '').replace(/\s*\(\d+-\d+\)\s*$/, '');

  // Equipo visible: el supervisor elegido arriba o todos
  function vcsVisibles(){
    const r = RU(), spv = r.getSpv ? r.getSpv() : 'TODOS';
    return new Set((r.carteras || []).filter(c => !(r.isVacante && r.isVacante(c)) && (spv === 'TODOS' || spv === 'MIXTOS' || c.sup === spv)).map(c => c.vc));
  }

  // ---------- Armar los envíos ----------
  function fichas(vcs, desde){
    const Fo = F(); if (!Fo || !Fo.gestion) return [];
    const g = new Map();
    Fo.gestion().filter(r => r.Fecha >= desde && vcs.has(r.Vendedor)).forEach(r => {
      const k = (r.ID || '') + '|' + r['Código'] + '|' + r.Fecha;
      if (!g.has(k)) g.set(k, []); g.get(k).push(r);
    });
    return [...g.values()].map(rows => {
      const r = rows[0], fotos = [], coms = [];
      const amp = rows.filter(x => x['Acción'] === 'Ampliación'), ing = rows.filter(x => x['Acción'] === 'Ingreso'), rep = rows.filter(x => x['Acción'] === 'Reposición');
      rep.forEach(x => { const id = idFoto(x['Enlace foto']); fotos.push({id, url: x['Enlace foto'], cat: x.Marca + ' · ' + x['Categoría'], res: x.Respuesta, ten: x['Caras tenemos'], fal: x['Caras faltan'], ok: !/no/i.test(String(x.Respuesta).replace(/^\s+|\s+$/g, '').replace(/ubicaci[oó]n s[ií]|participaci[oó]n s[ií]/gi, ''))}); });
      rows.forEach(x => { if (String(x.Comentario || '').trim()) coms.push({acc: x['Acción'], prod: x.Producto || (x.Marca + ' · ' + x['Categoría']), resp: x.Respuesta, com: x.Comentario}); });
      const caras = rep.reduce((t, x) => t + (+x['Caras faltan'] || 0), 0);
      return {tipo: 'ficha', f: r.Fecha, h: hora(r.Hora) || '', r, rows, fotos, coms, caras,
        amp: {si: amp.filter(x => /^se ofreci/i.test(x.Respuesta)).length, no: amp.filter(x => /^no se/i.test(x.Respuesta)).length},
        ing: {si: ing.filter(x => /^acept/i.test(x.Respuesta)).length, no: ing.filter(x => /^no acept/i.test(x.Respuesta)).length},
        rep: rep.length};
    });
  }
  function anomalias(vcs, desde){
    const Fo = F(); if (!Fo || !Fo.anomalias) return [];
    return Fo.anomalias().filter(r => vcs.has(r.Vendedor) && ((String(r.Registrado || '').slice(0, 10) || r.Fecha) >= desde))
      .map(r => ({tipo: 'anom', f: String(r.Registrado || '').slice(0, 10) || r.Fecha, h: hora(r.Registrado), r}));
  }
  function sueltas(vcs, desde, enFichas){
    const Fo = F(); if (!Fo || !Fo.todasFotos) return [];
    return Fo.todasFotos().filter(r => r.Fecha >= desde && vcs.has(r.Vendedor) && !enFichas.has(idFoto(r.Enlace)) && !(r.Tipo === 'Reposición' && enFichas.has(r['Código'] + '|' + r.Fecha)))
      .map(r => ({tipo: 'foto', f: r.Fecha, h: hora(r.Hora), r}));
  }
  function todo(){
    const vcs = vcsVisibles(), desde = lunes(HOY);
    const fs = fichas(vcs, desde), enF = new Set();
    fs.forEach(x => { x.fotos.forEach(p => p.id && enF.add(p.id)); enF.add(x.r['Código'] + '|' + x.f); });
    return fs.concat(anomalias(vcs, desde), sueltas(vcs, desde, enF)).sort((a, b) => (b.f + b.h).localeCompare(a.f + a.h));
  }

  // ---------- Tarjeta en Control ----------
  const ui = {dia: ''};
  const ICO = {ficha: '★', anom: '!', foto: '📷'};
  function item(x, k){
    const r = x.r, h = `<span class="rc-hora"><b>${esc(x.h || '—')}</b><small>${esc(cuando(x.f))}</small></span>`;
    if (x.tipo === 'ficha'){
      const chips = [x.amp.si + x.amp.no ? `<span class="rc-c amp">Ampliación ${x.amp.si} ${x.amp.si === 1 ? 'ofrecido' : 'ofrecidos'}${x.amp.no ? ' · ' + x.amp.no + ' no' : ''}</span>` : '',
        x.rep ? `<span class="rc-c rep">Reposición ${x.rep} con foto${x.caras ? ' · faltan ' + x.caras + ' caras' : ''}</span>` : '',
        x.ing.si + x.ing.no ? `<span class="rc-c ing">Ingreso ${x.ing.si} ${x.ing.si === 1 ? 'aceptado' : 'aceptados'}${x.ing.no ? ' · ' + x.ing.no + ' no' : ''}</span>` : ''].join('');
      return `<button type="button" class="rc-it ficha" data-rc="${k}">${h}
        <span class="rc-b">
          <span class="rc-t"><em>★ Ficha TOP</em><b>${esc(cliNom(r.Cliente))}</b></span>
          <span class="rc-quien"><span class="rc-spv">📤 Envió ${esc(quien(r))}</span><span class="rc-vend">Cliente de ${esc(r.Vendedor)} · ${esc(vendNom(r))}</span></span>
          <span class="rc-chips">${chips}</span>
          ${x.fotos.some(p => p.id) ? `<span class="rc-fotos">${x.fotos.filter(p => p.id).slice(0, 4).map(p => `<img src="${thumb(p.id, 300)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`).join('')}</span>` : ''}
          ${x.coms.length ? `<span class="rc-com">💬 “${esc(x.coms[0].com)}”${x.coms.length > 1 ? `<small>+${x.coms.length - 1} comentario${x.coms.length > 2 ? 's' : ''} más</small>` : ''}</span>` : '<span class="rc-sincom">Sin comentarios</span>'}
          <span class="rc-ver">Ver ficha completa ›</span>
        </span></button>`;
    }
    if (x.tipo === 'anom'){
      const A = window.Anomalias, e = A && A.estado ? A.estado(r) : {k: 'pen', txt: r['Justificó']};
      const cl = /aus/i.test(r['Anomalía']) ? 'aus' : /tard/i.test(r['Anomalía']) ? 'tar' : 'fue';
      return `<button type="button" class="rc-it anom" data-rc="${k}">${h}
        <span class="rc-b">
          <span class="rc-t"><em class="${cl}">⚠ Anomalía · ${esc(r['Anomalía'])}</em><b>${esc(vendNom(r) || r.Vendedor)} <small>${esc(r.Vendedor)}</small></b></span>
          <span class="rc-quien"><span class="rc-spv">📤 Informó ${esc(quien(r))}</span><span class="rc-vend">Del ${esc(cuando(r.Fecha))}${r.Motivo ? ' · ' + esc(r.Motivo) : ''}${r['Enlace adjunto'] ? ' · 📎 reposo' : ''}</span></span>
          ${r.Comentario ? `<span class="rc-com">💬 “${esc(r.Comentario)}”</span>` : ''}
          <span class="rc-est ${e.k}">${esc(e.txt)}${e.vence ? ` · ${esc(e.vence)}` : ''}</span>
        </span></button>`;
    }
    const id = idFoto(r.Enlace);
    return `<button type="button" class="rc-it foto" data-rc="${k}">${h}
      <span class="rc-b">
        <span class="rc-t"><em>📷 Foto · ${esc(r.Tipo || '')}</em><b>${esc(cliNom(r.Cliente))}</b></span>
        <span class="rc-quien"><span class="rc-spv">📤 Envió ${esc(quien(r))}</span><span class="rc-vend">Cliente de ${esc(r.Vendedor)} · ${esc(vendNom(r))}</span></span>
        ${id ? `<span class="rc-fotos"><img src="${thumb(id, 300)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></span>` : ''}
        ${r.Comentario ? `<span class="rc-com">💬 “${esc(r.Comentario)}”</span>` : ''}
      </span></button>`;
  }
  let lista = [];
  function pintar(box){
    const Fo = F();
    if (!Fo || !Fo.listo || !Fo.listo()){ box.innerHTML = `<section class="ct-card rc"><div class="rc-cab"><h3>Recibido de los supervisores</h3><p>Cargando lo que mandaron…</p></div></section>`; return; }
    const xs = todo();
    const n = {hoy: xs.filter(x => x.f === HOY).length, ayer: xs.filter(x => x.f === AYER).length, semana: xs.length};
    if (!ui.dia) ui.dia = n.hoy ? 'hoy' : n.ayer ? 'ayer' : 'semana';
    lista = xs.filter(x => ui.dia === 'hoy' ? x.f === HOY : ui.dia === 'ayer' ? x.f === AYER : true);
    const nf = lista.filter(x => x.tipo === 'ficha').length, na = lista.filter(x => x.tipo === 'anom').length, np = lista.reduce((t, x) => t + (x.tipo === 'ficha' ? x.fotos.filter(p => p.id).length : x.tipo === 'foto' ? 1 : 0), 0);
    box.innerHTML = `<section class="ct-card rc" id="ctRecibido">
      <div class="rc-cab"><span class="ct-ic top">📥</span><div><h3>Recibido de los supervisores</h3><p>Fichas TOP, fotos y anomalías, <b>por hora de llegada</b></p></div></div>
      <div class="rc-dias" role="tablist">${[['hoy', 'Hoy'], ['ayer', 'Ayer'], ['semana', 'Esta semana']].map(([k, t]) => `<button type="button" data-rcd="${k}" class="${ui.dia === k ? 'on' : ''}">${t}<em>${n[k]}</em></button>`).join('')}</div>
      ${lista.length ? `<p class="rc-res"><b>${nf}</b> ${nf === 1 ? 'ficha' : 'fichas'} · <b>${np}</b> ${np === 1 ? 'foto' : 'fotos'} · <b>${na}</b> ${na === 1 ? 'anomalía' : 'anomalías'}</p>
        <div class="rc-lista">${lista.slice(0, ui.todo ? 200 : 6).map(item).join('')}</div>
        ${lista.length > 6 && !ui.todo ? `<button type="button" class="rc-mas" data-rcmas>Ver los ${lista.length} envíos ›</button>` : ''}`
        : `<p class="ct-vacio">${ui.dia === 'hoy' ? 'Hoy todavía no llegó nada de los supervisores.' : ui.dia === 'ayer' ? 'Ayer no llegó nada.' : 'Esta semana todavía no llegó nada.'}</p>`}
    </section>`;
    box.querySelectorAll('[data-rcd]').forEach(b => b.onclick = () => { ui.dia = b.dataset.rcd; ui.todo = false; pintar(box); });
    const m = box.querySelector('[data-rcmas]'); if (m) m.onclick = () => { ui.todo = true; pintar(box); };
    box.querySelectorAll('[data-rc]').forEach(b => b.onclick = () => abrir(lista[+b.dataset.rc]));
  }

  // ---------- Detalle ----------
  function capa(html){
    let c = $('rcCapa'); if (!c){ c = document.createElement('div'); c.id = 'rcCapa'; document.body.appendChild(c); }
    c.innerHTML = `<div class="rc-hoja" role="dialog" aria-modal="true">${html}</div>`;
    document.body.classList.add('fx-bloq');
    const r = RU(); if (r.apilar && r.tope() !== 'recibido') r.apilar('', cerrarYa, true, 'recibido');
    c.querySelector('[data-cerrar]').onclick = cerrar;
    return c;
  }
  function cerrarYa(){ const c = $('rcCapa'); if (c) c.innerHTML = ''; document.body.classList.remove('fx-bloq'); }
  function cerrar(){ const r = RU(); if (r.tope && r.tope() === 'recibido') r.volver(); else cerrarYa(); }
  const cab = (t, s) => `<div class="an-hcab"><button type="button" class="tf-x" data-cerrar aria-label="Volver"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><polyline points="15 6 9 12 15 18"/></svg></button><div><b>${t}</b><small>${s}</small></div></div>`;
  function abrir(x){
    if (!x) return;
    if (x.tipo === 'anom'){ if (window.Anomalias && window.Anomalias.ver) window.Anomalias.ver(x.r); return; }
    const r = x.r;
    if (x.tipo === 'foto'){
      const id = idFoto(r.Enlace);
      const c = capa(cab('Foto · ' + esc(r.Tipo || ''), esc(cliNom(r.Cliente))) + `<div class="rc-det">
        ${quienHtml(r, x)}
        ${id ? `<a class="rc-big" href="${esc(r.Enlace)}" target="_blank" rel="noopener"><img src="${thumb(id, 1200)}" alt="Foto"></a>` : ''}
        <div class="rc-coms"><h4>Comentario</h4>${r.Comentario ? `<p class="rc-q">“${esc(r.Comentario)}”</p>` : '<p class="rc-nada">Sin comentario.</p>'}</div></div>`);
      return c;
    }
    const sec = (t, cls, rows, fn) => rows.length ? `<div class="rc-sec ${cls}"><h4>${t}</h4>${rows.map(fn).join('')}</div>` : '';
    const lin = y => `<div class="rc-ln"><div><b>${esc(y.Producto || (y.Marca + ' · ' + y['Categoría']))}</b><small>${esc(y.Marca)} · ${esc(y['Categoría'])}</small></div><span class="rc-r ${/^(se ofreci|acept)/i.test(y.Respuesta) ? 'si' : 'no'}">${esc(y.Respuesta)}</span>${String(y.Comentario || '').trim() ? `<p class="rc-q">💬 “${esc(y.Comentario)}”</p>` : ''}</div>`;
    const rep = y => { const id = idFoto(y['Enlace foto']), mal = +y['Caras faltan'] > 0 || /ubicaci[oó]n no|participaci[oó]n no/i.test(y.Respuesta);
      return `<div class="rc-rep ${mal ? 'mal' : 'bien'}">${id ? `<a href="${esc(y['Enlace foto'])}" target="_blank" rel="noopener"><img src="${thumb(id, 800)}" alt="Góndola"></a>` : '<div class="rc-sinf">Sin foto</div>'}
        <div class="rc-rep-i"><b>${esc(y.Marca)} · ${esc(y['Categoría'])}</b><span>${esc(y.Respuesta)}</span>${y['Caras tenemos'] !== '' && y['Caras tenemos'] != null ? `<span class="rc-caras">Tenemos <b>${esc(y['Caras tenemos'])}</b> caras · faltan <b>${esc(y['Caras faltan'])}</b></span>` : ''}${String(y.Comentario || '').trim() ? `<p class="rc-q">💬 “${esc(y.Comentario)}”</p>` : ''}</div></div>`; };
    const c = capa(cab('Ficha TOP', esc(cliNom(r.Cliente))) + `<div class="rc-det">
      ${quienHtml(r, x)}
      <div class="rc-kpis"><span class="amp"><b>${x.amp.si}</b>ofrecidos${x.amp.no ? ` <small>${x.amp.no} no</small>` : ''}</span><span class="rep"><b>${x.rep}</b>reposiciones${x.caras ? ` <small>faltan ${x.caras} caras</small>` : ''}</span><span class="ing"><b>${x.ing.si}</b>ingresos${x.ing.no ? ` <small>${x.ing.no} no</small>` : ''}</span></div>
      ${x.coms.length ? `<div class="rc-coms"><h4>💬 Comentarios del supervisor (${x.coms.length})</h4>${x.coms.map(y => `<div class="rc-cm"><small>${esc(y.acc)} · ${esc(y.prod)} · <b>${esc(y.resp)}</b></small><p>“${esc(y.com)}”</p></div>`).join('')}</div>` : '<div class="rc-coms"><h4>Comentarios</h4><p class="rc-nada">El supervisor no dejó comentarios en esta ficha.</p></div>'}
      ${sec('Reposición · fotos de la góndola', 'rep', x.rows.filter(y => y['Acción'] === 'Reposición'), rep)}
      ${sec('Ampliación · productos ofrecidos', 'amp', x.rows.filter(y => y['Acción'] === 'Ampliación'), lin)}
      ${sec('Ingreso · marcas nuevas', 'ing', x.rows.filter(y => y['Acción'] === 'Ingreso'), lin)}
    </div>`);
    return c;
  }
  function quienHtml(r, x){
    return `<div class="rc-quienes">
      <div><span class="rc-qi spv">📤</span><span><small>Lo envió</small><b>${esc(quien(r))}</b><em>${esc(cuando(x.f))}${x.h ? ' a las ' + esc(x.h) : ''}</em></span></div>
      <div><span class="rc-qi ven">👤</span><span><small>Cliente de la cartera</small><b>${esc(r.Vendedor)} · ${esc(vendNom(r))}</b><em>${esc(cliNom(r.Cliente))}${r['Código'] ? ' · ' + esc(r['Código']) : ''}</em></span></div>
    </div>`;
  }

  const cajas = new Set();
  function en(box){ if (!box) return; cajas.add(box); pintar(box); }
  function refrescar(){ cajas.forEach(b => { if (document.body.contains(b)) pintar(b); else cajas.delete(b); }); }
  window.Recibidos = {en, refrescar, abrir, quien, todo};
})();
