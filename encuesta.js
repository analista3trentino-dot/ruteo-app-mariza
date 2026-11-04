// =====================================================================
//  ENCUESTA DE LA APP (vendedores y supervisores)
// ---------------------------------------------------------------------
//  Cada uno se presenta (vendedor: nombre y cartera; supervisor: su
//  equipo y su clave) y responde preguntas cortas. Las respuestas
//  llegan a Google Drive (hoja "Encuesta") y jefatura ve el resumen
//  en la pestaña Supervisores.
//
//  Para cambiar una pregunta, editá el texto entre comillas.
//  "k" es el nombre de la columna en la planilla (no lo repitas).
//  tipo: "escala" (1 a 5), "una" (una opción), "varias", "texto".
//  rol: "sup" = solo supervisores, "vend" = solo vendedores.
// =====================================================================
const ENCUESTA_PREGUNTAS = [
  { k: 'Diseño',              tipo: 'escala', t: '¿Te gusta cómo se ve la app? (colores, orden, letras)' },
  { k: 'Facilidad de uso',    tipo: 'escala', t: '¿Es fácil encontrar lo que necesitás?' },
  { k: 'Velocidad',           tipo: 'escala', t: '¿Qué tan rápido abre y responde?' },
  { k: 'Información',         tipo: 'escala', t: '¿La información (ruta, potencial, visitas, precios, stock) te sirve para trabajar?' },
  { k: 'Ayuda en el trabajo', tipo: 'escala', t: '¿Cuánto te ayuda la app en tu día de trabajo?' },
  { k: 'Control del equipo',  tipo: 'escala', t: '¿Te sirve para controlar a tu equipo?', rol: 'sup' },
  { k: 'Fichas y anomalías',  tipo: 'escala', t: '¿Es fácil cargar las fichas TOP y las anomalías?', rol: 'sup' },
  { k: 'Funcionamiento',      tipo: 'una',    t: '¿Funciona bien en tu celular?', op: ['Siempre bien', 'A veces falla', 'Falla mucho'] },
  { k: 'Qué complica',        tipo: 'varias', t: '¿Qué te complica usarla? Podés marcar varias.', op: ['Poca señal o datos', 'Mi celular es lento', 'Se gasta la batería', 'Letras chicas', 'Nada, anda bien'] },
  { k: 'Lo que más usa',      tipo: 'varias', t: '¿Qué partes usás más? Podés marcar varias.', op: ['Ruta', 'Mapa / Ir', 'Potencial', 'Lista de precios', 'Catálogo', 'Visitas', 'Competencia', 'Avisos'] },
  { k: 'Lo que más cuesta',   tipo: 'una',    t: '¿Qué parte te cuesta más entender?', op: ['Ninguna', 'Ruta', 'Potencial', 'Lista de precios', 'Visitas', 'Competencia', 'Avisos', 'Fichas TOP'] },
  { k: 'Recomendaría',        tipo: 'una',    t: '¿Le recomendarías la app a un compañero?', op: ['Sí', 'Tal vez', 'No'] },
  { k: 'Comentario',          tipo: 'texto',  t: '¿Qué le agregarías o cambiarías? Contanos con tus palabras.' },
];

// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ
// ---------------------------------------------------------------------
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const R = () => window.RUTEO || {};
  const CFG = typeof ENCUESTA !== 'undefined' ? ENCUESTA : null;
  const URL_F = typeof FOTOS_URL !== 'undefined' ? String(FOTOS_URL).trim() : '', CLAVE_F = typeof FOTOS_CLAVE !== 'undefined' ? FOTOS_CLAVE : '';
  const p2 = n => String(n).padStart(2, '0'), d = new Date(), HOY = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  // "hasta" puede ser "2026-11-06 17:00" (día y hora) o solo "2026-11-06" (todo ese día)
  const LIMITE = (() => { if (!CFG || !CFG.hasta) return null; const m = String(CFG.hasta).trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/); if (!m) return null; return m[4] !== undefined ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) : new Date(+m[1], m[2] - 1, +m[3], 23, 59, 59); })();
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const plazo = () => LIMITE ? `${DIAS[LIMITE.getDay()]} ${LIMITE.getDate()}/${LIMITE.getMonth() + 1}${LIMITE.getHours() === 23 && LIMITE.getMinutes() === 59 ? '' : ' a las ' + LIMITE.getHours() + ':' + p2(LIMITE.getMinutes()) + ' h'}` : '';
  const abierta = () => !LIMITE || Date.now() <= LIMITE.getTime();
  const activa = () => !!(CFG && CFG.activa !== false && URL_F && abierta());
  const nom = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
  const K = () => 'ruteoTR1_enc_' + (CFG ? CFG.id : '');
  const yaRespondio = () => { try { return !!localStorage.getItem(K()); } catch(e){ return false; } };
  const CARAS = [['😞', 'Muy mal'], ['🙁', 'Mal'], ['😐', 'Regular'], ['🙂', 'Bien'], ['😄', 'Excelente']];
  const PREG = () => (typeof ENCUESTA_PREGUNTAS !== 'undefined' ? ENCUESTA_PREGUNTAS : []);

  // ---------- Botón para responder (arriba de la ruta) ----------
  function banner(){
    if (!activa() || yaRespondio() || R().modo === 'jefatura') return '';
    return `<section class="en-banner"><span class="en-ic">📝</span><div><b>Encuesta de la app</b><small>${LIMITE ? 'Respondé hasta el ' + plazo() : '2 minutos · tu opinión nos ayuda a mejorarla'}</small></div><button type="button" class="en-btn" data-en-abrir>Responder</button></section>`;
  }
  function enlazar(root){ (root || document).querySelectorAll('[data-en-abrir]').forEach(b => b.onclick = abrir); }

  // ---------- Encuesta, una pregunta por pantalla ----------
  let S = null;   // {paso, rol, codigo, nombre, sup, resp:{}}
  function abrir(){
    const r = R(), v = r.vendedor;
    S = {paso: -1, rol: '', codigo: '', nombre: '', sup: '', resp: {}};
    if (r.modo === 'vendedor' && v){ S.rol = 'vend'; S.codigo = v.vc; S.nombre = nom(v.vn); S.sup = v.sup; }
    let c = $('enCapa'); if (!c){ c = document.createElement('div'); c.id = 'enCapa'; document.body.appendChild(c); }
    document.body.classList.add('fx-bloq');
    if (r.apilar && r.tope() !== 'enc') r.apilar('', cerrarYa, true, 'enc');
    pintar();
  }
  function cerrarYa(){ const c = $('enCapa'); if (c) c.innerHTML = ''; S = null; document.body.classList.remove('fx-bloq'); if (R().refrescar) R().refrescar(); }
  function cerrar(){ const r = R(); if (r.tope && r.tope() === 'enc') r.volver(); else cerrarYa(); }
  const preguntas = () => PREG().filter(q => !q.rol || q.rol === S.rol);
  function marco(cuerpo, pie){
    const qs = preguntas(), tot = qs.length + 1, n = S.paso < 0 ? 0 : S.paso + 1;
    $('enCapa').innerHTML = `<div class="en-hoja" role="dialog" aria-modal="true" aria-label="Encuesta de la app">
      <div class="en-cab"><button type="button" class="tf-x" data-x aria-label="Cerrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <div class="en-prog"><i style="width:${Math.round(n / tot * 100)}%"></i></div><span class="en-n">${S.paso >= 0 && S.paso < qs.length ? (S.paso + 1) + ' de ' + qs.length : ''}</span></div>
      <div class="en-cuerpo">${cuerpo}</div>${pie ? `<div class="en-pie">${pie}</div>` : ''}</div>`;
    $('enCapa').querySelector('[data-x]').onclick = cerrar;
  }
  function pintar(){
    const qs = preguntas();
    if (S.paso === -1) return identidad();
    if (S.paso >= qs.length) return resumen();
    const q = qs[S.paso], v = S.resp[q.k];
    let op = '';
    if (q.tipo === 'escala') op = `<div class="en-caras">${CARAS.map((c, i) => `<button type="button" data-v="${i + 1}" aria-pressed="${v === i + 1}"><span>${c[0]}</span><small>${c[1]}</small></button>`).join('')}</div>`;
    else if (q.tipo === 'una') op = `<div class="en-ops">${q.op.map(o => `<button type="button" data-v="${esc(o)}" aria-pressed="${v === o}">${esc(o)}</button>`).join('')}</div>`;
    else if (q.tipo === 'varias') op = `<div class="en-ops">${q.op.map(o => `<button type="button" data-m="${esc(o)}" aria-pressed="${(v || []).includes(o)}">${esc(o)}</button>`).join('')}</div>`;
    else op = `<textarea id="enTxt" class="en-txt" placeholder="Escribí acá (opcional)">${esc(v || '')}</textarea>`;
    marco(`<p class="en-quien">${esc(S.nombre)} · ${esc(S.codigo)}</p><h2 class="en-q">${esc(q.t)}</h2>${op}`,
      `<button type="button" class="tf-btn sec" data-atras>Atrás</button><button type="button" class="tf-btn" data-sig ${q.tipo === 'escala' || q.tipo === 'una' ? (v ? '' : 'disabled') : ''}>${S.paso === qs.length - 1 ? 'Terminar' : 'Siguiente'}</button>`);
    const c = $('enCapa');
    c.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { S.resp[q.k] = q.tipo === 'escala' ? +b.dataset.v : b.dataset.v; c.querySelectorAll('[data-v]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); c.querySelector('[data-sig]').disabled = false; setTimeout(() => { if (S && preguntas()[S.paso] === q){ S.paso++; pintar(); } }, 260); });
    c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const a = new Set(S.resp[q.k] || []); a.has(b.dataset.m) ? a.delete(b.dataset.m) : a.add(b.dataset.m); S.resp[q.k] = [...a]; b.setAttribute('aria-pressed', String(a.has(b.dataset.m))); });
    const t = $('enTxt'); if (t) t.oninput = () => { S.resp[q.k] = t.value; };
    c.querySelector('[data-atras]').onclick = () => { S.paso--; pintar(); };
    c.querySelector('[data-sig]').onclick = () => { S.paso++; pintar(); };
  }
  // Paso 0: quién responde
  function identidad(){
    const r = R(), ok = S.codigo && S.rol;
    if (ok && S.rol === 'vend' && r.modo === 'vendedor'){
      marco(`<span class="en-ico-g">📝</span><h2 class="en-q">Encuesta de la app</h2><p class="en-sub">Son ${preguntas().length} preguntas cortas. Respondé con sinceridad: nos sirve para mejorar la app.${LIMITE ? ' Tenés tiempo hasta el <b>' + plazo() + '</b>.' : ''}</p>
        <div class="en-yo"><b>${esc(S.nombre)}</b><small>Vendedor · ${esc(S.codigo)}</small></div><button type="button" class="en-link" data-otro>No soy yo</button>`,
        `<button type="button" class="tf-btn" data-emp>Empezar</button>`);
      $('enCapa').querySelector('[data-emp]').onclick = () => { S.paso = 0; pintar(); };
      $('enCapa').querySelector('[data-otro]').onclick = () => { S.rol = ''; S.codigo = ''; identidad(); };
      return;
    }
    if (!S.rol){
      marco(`<span class="en-ico-g">📝</span><h2 class="en-q">¿Quién responde?</h2><p class="en-sub">Presentate con tu nombre y tu cartera o equipo.</p>
        <div class="en-roles"><button type="button" data-rol="vend"><b>Soy vendedor</b><small>Elegí tu nombre y cartera</small></button><button type="button" data-rol="sup"><b>Soy supervisor</b><small>Elegí tu equipo y poné tu clave</small></button></div>`);
      $('enCapa').querySelectorAll('[data-rol]').forEach(b => b.onclick = () => { S.rol = b.dataset.rol; identidad(); });
      return;
    }
    if (S.rol === 'vend'){
      const cs = (r.carteras || []).filter(c => /^(TR|TM)/.test(c.vc) && !(r.isVacante && r.isVacante(c))).sort((a, b) => a.vn.localeCompare(b.vn));
      marco(`<h2 class="en-q">¿Cuál es tu nombre y cartera?</h2><input id="enBus" class="en-bus" type="text" placeholder="Buscá tu nombre o código" autocomplete="off">
        <div class="en-lista" id="enLista">${cs.map(c => `<button type="button" data-vc="${esc(c.vc)}" data-b="${esc((c.vn + ' ' + c.vc).toLowerCase())}"><b>${esc(nom(c.vn))}</b><small>${esc(c.vc)} · ${esc(c.vz || '')}</small></button>`).join('')}</div>`,
        `<button type="button" class="tf-btn sec" data-atras>Atrás</button>`);
      const c = $('enCapa');
      $('enBus').oninput = () => { const q = $('enBus').value.trim().toLowerCase(); c.querySelectorAll('[data-vc]').forEach(b => b.hidden = q && !b.dataset.b.includes(q)); };
      c.querySelectorAll('[data-vc]').forEach(b => b.onclick = () => { const x = cs.find(y => y.vc === b.dataset.vc); S.codigo = x.vc; S.nombre = nom(x.vn); S.sup = x.sup; S.paso = 0; pintar(); });
      c.querySelector('[data-atras]').onclick = () => { S.rol = ''; identidad(); };
      return;
    }
    // supervisor: equipo + clave
    const L = typeof SUPERVISORES !== 'undefined' ? SUPERVISORES : {}, CL = typeof CLAVES_SUPERVISORES !== 'undefined' ? CLAVES_SUPERVISORES : {};
    const eqs = (r.sups || []).filter(s => !/vacante/i.test(L[s.k] || ''));
    marco(`<h2 class="en-q">¿Cuál es tu equipo?</h2>
      <div class="en-lista">${eqs.map(s => `<button type="button" data-sup="${esc(s.k)}" aria-pressed="${S.sup === s.k}"><b>${esc(nom(L[s.k] || 'Supervisor'))}</b><small>${esc(s.p)}</small></button>`).join('')}</div>
      <form id="enClave" class="en-clave" ${S.sup ? '' : 'hidden'} autocomplete="off"><label for="enClaveIn">Tu clave de supervisor</label><input id="enClaveIn" type="password" autocomplete="off" enterkeyhint="go"><p class="en-err" id="enErr" hidden>La clave no es correcta.</p><button type="submit" class="tf-btn">Entrar</button></form>`,
      `<button type="button" class="tf-btn sec" data-atras>Atrás</button>`);
    const c = $('enCapa');
    c.querySelectorAll('[data-sup]').forEach(b => b.onclick = () => { S.sup = b.dataset.sup; c.querySelectorAll('[data-sup]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('enClave').hidden = false; $('enClaveIn').value = ''; $('enClaveIn').focus(); });
    $('enClave').onsubmit = e => {
      e.preventDefault();
      if ($('enClaveIn').value.trim() !== String(CL[S.sup] || '').trim() || !CL[S.sup]){ $('enErr').hidden = false; return; }
      S.codigo = S.sup; S.nombre = nom(L[S.sup] || S.sup); S.paso = 0; pintar();
    };
    c.querySelector('[data-atras]').onclick = () => { S.rol = ''; S.sup = ''; identidad(); };
  }
  function resumen(){
    marco(`<span class="en-ico-g">✅</span><h2 class="en-q">¡Listo, ${esc(S.nombre.split(' ')[0])}!</h2><p class="en-sub">Tocá <b>Enviar</b> para mandar tus respuestas. Si querés cambiar algo, tocá Atrás.</p><p class="en-err" id="enErr" hidden></p>`,
      `<button type="button" class="tf-btn sec" data-atras>Atrás</button><button type="button" class="tf-btn" data-env>Enviar</button>`);
    const c = $('enCapa');
    c.querySelector('[data-atras]').onclick = () => { S.paso--; pintar(); };
    c.querySelector('[data-env]').onclick = async () => {
      if (!abierta()){ const er = $('enErr'); er.textContent = 'La encuesta ya cerró (era hasta el ' + plazo() + ').'; er.hidden = false; return; }
      const b = c.querySelector('[data-env]'); b.disabled = true; b.textContent = 'Enviando…';
      const resp = {}; preguntas().forEach(q => { const v = S.resp[q.k]; resp[q.k] = Array.isArray(v) ? v.join(', ') : (v ?? ''); });
      try {
        const r = await fetch(URL_F, {method: 'POST', body: JSON.stringify({clave: CLAVE_F, encuesta: true, id: CFG.id, rol: S.rol === 'sup' ? 'Supervisor' : 'Vendedor', codigo: S.codigo, nombre: S.nombre, sup: S.sup, respuestas: resp}), redirect: 'follow'});
        const j = await r.json(); if (!j.ok) throw new Error(j.error);
        try { localStorage.setItem(K(), JSON.stringify({c: S.codigo, r: S.rol === 'sup' ? 'Supervisor' : 'Vendedor', f: HOY})); } catch(e){}
        if (datos) datos = datos.filter(r => !(r['Código'] === S.codigo && r.Rol === (S.rol === 'sup' ? 'Supervisor' : 'Vendedor'))).concat([{'Código': S.codigo, Rol: S.rol === 'sup' ? 'Supervisor' : 'Vendedor', Nombre: S.nombre}]);
        if (window.Avisos) window.Avisos.armar();
        marco(`<span class="en-ico-g">🙌</span><h2 class="en-q">¡Gracias!</h2><p class="en-sub">Tus respuestas llegaron. Con tu opinión vamos a mejorar la app.</p>`, `<button type="button" class="tf-btn" data-fin>Volver a la app</button>`);
        $('enCapa').querySelector('[data-fin]').onclick = cerrar;
      } catch(e){ b.disabled = false; b.textContent = 'Enviar'; const er = $('enErr'); er.textContent = /clave/i.test(e.message || '') ? 'No se pudo enviar (clave de Google incorrecta). Avisale a jefatura.' : navigator.onLine === false ? 'No hay señal. Probá de nuevo cuando tengas conexión.' : 'No se pudo enviar. Probá de nuevo en un rato; si sigue, avisale a jefatura.'; er.hidden = false; }
    };
  }

  // ---------- Resultados (jefatura) ----------
  let datos = null, pend = null;
  function cargar(forzar){
    if (!URL_F || !CFG) return Promise.resolve([]);
    if (datos && !forzar) return Promise.resolve(datos);
    if (pend) return pend;
    pend = fetch(URL_F + '?' + new URLSearchParams({clave: CLAVE_F, accion: 'encuesta', id: CFG.id}), {redirect: 'follow'}).then(r => r.json()).then(j => { datos = (j && j.respuestas) || []; return datos; }).finally(() => { pend = null; });
    return pend;
  }
  const prom = (xs, k) => { const v = xs.map(r => +r[k]).filter(n => n >= 1); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const tono = p => p === null ? '' : p >= 4 ? 'good' : p >= 3 ? 'mid' : 'bad';
  function tarjeta(box){
    if (!box || !CFG) { if (box) box.innerHTML = ''; return; }
    const pinta = xs => {
      if (!document.body.contains(box)) return;
      const esc_ = PREG().filter(q => q.tipo === 'escala'), gen = prom(xs.flatMap(r => esc_.map(q => ({v: r[q.k]}))), 'v');
      box.innerHTML = `<section class="en-res">
        <div class="en-res-t"><div><h3>Encuesta de la app</h3>${LIMITE ? `<p class="en-plazo ${abierta() ? '' : 'cerrada'}">${abierta() ? 'Abierta hasta el ' : 'Cerró el '}${plazo()}</p>` : ''}<p>${xs.length ? `<b>${xs.length}</b> respuestas · ${xs.filter(r => r.Rol === 'Vendedor').length} vendedores · ${xs.filter(r => r.Rol === 'Supervisor').length} supervisores` : 'Todavía no hay respuestas'}</p></div>${gen !== null ? `<span class="en-nota ${tono(gen)}">${gen.toFixed(1)}<small>/5</small></span>` : ''}</div>
        ${xs.length ? `<div class="en-barras">${esc_.slice(0, 5).map(q => { const p = prom(xs, q.k); return `<div><span>${esc(q.k)}</span><i class="en-b"><i class="${tono(p)}" style="width:${p ? p / 5 * 100 : 0}%"></i></i><em>${p ? p.toFixed(1) : '—'}</em></div>`; }).join('')}</div>
        <button type="button" class="an-hist" data-en-res>Ver todos los resultados ›</button>` : ''}
      </section>`;
      const b = box.querySelector('[data-en-res]'); if (b) b.onclick = () => resultados(xs);
    };
    pinta(datos || []);
    cargar().then(pinta, () => {});
  }
  function resultados(xs){
    const st = {rol: 'Todos'};
    const capa = () => { let c = $('enCapa'); if (!c){ c = document.createElement('div'); c.id = 'enCapa'; document.body.appendChild(c); } return c; };
    const r_ = R(); if (r_.apilar && r_.tope() !== 'enc') r_.apilar('', cerrarYa, true, 'enc');
    document.body.classList.add('fx-bloq');
    const pinta = () => {
      const ys = xs.filter(r => st.rol === 'Todos' || r.Rol === st.rol);
      const bloque = q => {
        if (q.tipo === 'escala'){ const p = prom(ys, q.k), n = [1, 2, 3, 4, 5].map(i => ys.filter(r => +r[q.k] === i).length), mx = Math.max(1, ...n);
          return `<div class="en-rq"><b>${esc(q.t)}</b><div class="en-rq-n"><span class="en-nota ${tono(p)}">${p ? p.toFixed(1) : '—'}<small>/5</small></span><div class="en-dist">${n.map((x, i) => `<div><i style="height:${Math.round(x / mx * 100)}%"></i><span>${CARAS[i][0]}</span><small>${x}</small></div>`).join('')}</div></div></div>`; }
        if (q.tipo === 'texto'){ const cs = ys.filter(r => String(r[q.k] || '').trim()); return `<div class="en-rq"><b>${esc(q.t)}</b>${cs.length ? cs.map(r => `<div class="en-com"><p>${esc(r[q.k])}</p><small>${esc(r.Nombre)} · ${esc(r['Código'])}</small></div>`).join('') : '<p class="en-sub">Sin comentarios.</p>'}</div>`; }
        const cnt = {}; ys.forEach(r => String(r[q.k] || '').split(',').map(s => s.trim()).filter(Boolean).forEach(o => cnt[o] = (cnt[o] || 0) + 1));
        const ord = (q.op || Object.keys(cnt)).map(o => [o, cnt[o] || 0]).sort((a, b) => b[1] - a[1]);
        return `<div class="en-rq"><b>${esc(q.t)}</b><div class="en-barras">${ord.map(([o, n]) => `<div><span>${esc(o)}</span><i class="en-b"><i style="width:${ys.length ? n / ys.length * 100 : 0}%"></i></i><em>${n}</em></div>`).join('')}</div></div>`;
      };
      // quién respondió y quién falta (vendedores activos)
      const RU = R(), resp = new Set(xs.map(r => r['Código'])), cs = (RU.carteras || []).filter(c => /^(TR|TM)/.test(c.vc) && !(RU.isVacante && RU.isVacante(c)));
      const faltan = cs.filter(c => !resp.has(c.vc));
      capa().innerHTML = `<div class="en-hoja" role="dialog" aria-modal="true"><div class="an-hcab"><button type="button" class="tf-x" data-x aria-label="Volver"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><polyline points="15 6 9 12 15 18"/></svg></button><div><b>Resultados de la encuesta</b><small>${xs.length} respuestas</small></div></div>
        <div class="an-hin"><div class="vs-seg an-seg">${['Todos', 'Vendedor', 'Supervisor'].map(x => `<button type="button" data-r="${x}" class="${st.rol === x ? 'on' : ''}">${x === 'Todos' ? 'Todos' : x + 'es'}</button>`).join('')}</div>
        ${PREG().filter(q => st.rol === 'Todos' || !q.rol || (q.rol === 'sup') === (st.rol === 'Supervisor')).map(bloque).join('')}
        <div class="en-rq"><b>Faltan responder (${faltan.length} vendedores)</b><p class="en-sub">${faltan.length ? faltan.map(c => esc(c.vc) + ' ' + esc(nom(c.vn).split(' ')[0])).join(' · ') : '¡Respondieron todos!'}</p></div>
        <p class="en-sub">Todas las respuestas están en tu planilla de Google, hoja "Encuesta".</p></div></div>`;
      const c = capa();
      c.querySelector('[data-x]').onclick = cerrar;
      c.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { st.rol = b.dataset.r; pinta(); });
    };
    pinta();
  }
  function totales(xs){
    const RU = R(), resp = new Set(xs.map(r => r['Código']));
    const cs = (RU.carteras || []).filter(c => /^(TR|TM)/.test(c.vc) && !(RU.isVacante && RU.isVacante(c)));
    const esc_ = PREG().filter(q => q.tipo === 'escala');
    return {nota: prom(xs.flatMap(r => esc_.map(q => ({v: r[q.k]}))), 'v'), faltan: cs.filter(c => !resp.has(c.vc)).length};
  }
  // Si el celular dice "ya respondí" pero la respuesta no está en la planilla (por ejemplo, se envió
  // cuando el Apps Script todavía no tenía la encuesta), se vuelve a mostrar el botón para responder.
  function verificar(){
    if (!activa() || !yaRespondio() || R().modo === 'jefatura') return;
    let yo = null; try { yo = JSON.parse(localStorage.getItem(K())); } catch(e){}
    const r = R(), quienes = [];
    if (yo && yo.c) quienes.push([yo.c, yo.r]);
    if (r.modo === 'vendedor' && r.vendedor) quienes.push([r.vendedor.vc, 'Vendedor']);
    if (r.modo === 'supervisor' && r.miSup) quienes.push([r.miSup, 'Supervisor']);
    if (!quienes.length) return;
    cargar(true).then(xs => {
      if (!quienes.some(([c, rol]) => xs.some(x => x['Código'] === c && x.Rol === rol))){
        try { localStorage.removeItem(K()); } catch(e){}
        if (r.refrescar) r.refrescar(); if (window.Avisos && window.Avisos.armar) window.Avisos.armar();
      }
    }).catch(() => {});
  }
  window.addEventListener('load', () => setTimeout(verificar, 2500));
  window.Encuesta = {banner, enlazar, abrir, tarjeta, activa, yaRespondio, cargar, resumen: totales};
})();
