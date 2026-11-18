// =====================================================================
//  INGRESOS A LA APP: quién usa la app y quién no
// ---------------------------------------------------------------------
//  - Cada vez que un vendedor o supervisor entra (con su contraseña o al abrir la app)
//    queda anotado en la hoja "Ingresos" de la planilla de Google (mismo script de las fotos).
//  - Sin señal, el ingreso queda guardado y se manda después.
//  - En Control (jefatura) se ve la tarjeta "Uso de la app": quién entró hoy, esta semana y quién nunca.
//  No hace falta modificar este archivo.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const URL_I = (typeof FOTOS_URL !== 'undefined' ? String(FOTOS_URL) : '').trim();
  const CLAVE_I = typeof FOTOS_CLAVE !== 'undefined' ? String(FOTOS_CLAVE) : '';
  const p2 = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const deIso = s => { const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const HOY = iso(new Date());
  const lunes = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
  const nom = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()).split(' ').slice(0, 2).join(' ');
  const RU = () => window.RUTEO || {};
  const PEND = 'ruteoTR1_ingresosPend', ULT = 'ruteoTR1_ultIngreso', LOGIN = 'ruteoTR1_ingresoLogin';
  const CADA = 3 * 3600e3;   // "abrió la app" se anota como mucho cada 3 horas por celular

  // ---------- Registrar ----------
  function dispositivo(){
    const u = navigator.userAgent || '';
    const m = u.match(/Android [\d.]+;?\s*([^;)]*)/);
    return (m ? 'Android · ' + m[1].replace(/Build.*$/, '').trim() : /iPhone|iPad/.test(u) ? 'iPhone' : /Windows/.test(u) ? 'PC Windows' : /Mac/.test(u) ? 'Mac' : 'Otro').slice(0, 60);
  }
  const leerPend = () => { try { return JSON.parse(localStorage.getItem(PEND) || '[]'); } catch(e){ return []; } };
  const guardarPend = l => { try { localStorage.setItem(PEND, JSON.stringify(l.slice(-30))); } catch(e){} };
  function mandar(x){
    return fetch(URL_I, {method: 'POST', body: JSON.stringify(Object.assign({clave: CLAVE_I, ingreso: true}, x)), redirect: 'follow', keepalive: true})
      .then(r => r.json()).then(j => { if (!j || !j.ok) throw new Error('no'); });
  }
  let enviando = false;
  async function reintentar(){
    if (enviando || !URL_I || navigator.onLine === false) return;
    const l = leerPend(); if (!l.length) return;
    enviando = true;
    const quedan = [];
    for (const x of l){ try { await mandar(x); } catch(e){ quedan.push(x); } }
    guardarPend(quedan); enviando = false;
  }
  function registrar(){
    if (!URL_I) return;
    const r = RU(); let x = null;
    if (r.modo === 'vendedor' && r.vendedor){
      if (/VACANTE/i.test(r.vendedor.vn)) return;
      x = {rol: 'Vendedor', codigo: r.vendedor.vc, nombre: r.vendedor.vn, sup: r.vendedor.sup};
    } else if (r.modo === 'supervisor' && r.miSup){
      x = {rol: 'Supervisor', codigo: r.miSup, nombre: (r.nombreSup && r.nombreSup(r.miSup)) || r.miSup, sup: r.miSup};
    } else return;
    let login = false; try { login = sessionStorage.getItem(LOGIN) === x.codigo; sessionStorage.removeItem(LOGIN); } catch(e){}
    let ult = 0; try { ult = +(localStorage.getItem(ULT + '_' + x.codigo) || 0); } catch(e){}
    if (!login && Date.now() - ult < CADA) { reintentar(); return; }
    try { localStorage.setItem(ULT + '_' + x.codigo, String(Date.now())); } catch(e){}
    x.tipo = login ? 'Entró con contraseña' : 'Abrió la app';
    x.fecha = new Date().toISOString(); x.dispositivo = dispositivo();
    const l = leerPend(); l.push(x); guardarPend(l);
    reintentar();
  }
  window.addEventListener('online', reintentar);

  // ---------- Tarjeta para jefatura (Control) ----------
  let datos = null, datosT = 0, cargando = null, ui = {ver: 'resumen'};
  function cargar(){
    if (datos && Date.now() - datosT < 5 * 60000) return Promise.resolve(datos);
    if (cargando) return cargando;
    const q = new URLSearchParams({clave: CLAVE_I, accion: 'ingresos', dias: '35'});
    cargando = fetch(URL_I + '?' + q.toString(), {redirect: 'follow'}).then(r => r.json())
      .then(j => { cargando = null; if (!j || !j.ok) throw new Error(j && j.error || 'sin datos'); datos = j.ingresos || []; datosT = Date.now(); return datos; })
      .catch(e => { cargando = null; throw e; });
    return cargando;
  }
  const hace = f => {
    if (!f) return 'nunca entró';
    if (f === HOY) return 'hoy';
    const d = (deIso(HOY) - deIso(f)) / 864e5;
    return d === 1 ? 'ayer' : 'hace ' + Math.round(d) + ' días';
  };
  function modelo(xs){
    const r = RU(), spv = r.getSpv ? r.getSpv() : 'TODOS';
    const ult = {};
    xs.forEach(x => { const k = x['Código']; const t = x.Fecha + ' ' + x.Hora; if (!ult[k] || t > ult[k].t) ult[k] = {t, f: x.Fecha, h: x.Hora, disp: x.Dispositivo, n: 0}; });
    xs.forEach(x => { if (ult[x['Código']] && x.Fecha >= lunes()) ult[x['Código']].n++; });
    const vend = (r.carteras || []).filter(c => !/VACANTE/i.test(c.vn) && /^TR/.test(c.vc) && (spv === 'TODOS' || spv === 'MIXTOS' || c.sup === spv))
      .map(c => { const u = ult[c.vc]; return {c, u, est: !u ? 'nunca' : u.f === HOY ? 'hoy' : u.f >= lunes() ? 'semana' : 'viejo'}; });
    const sups = (r.sups || []).filter(s => spv === 'TODOS' || spv === 'MIXTOS' || s.k === spv).map(s => ({s, u: ult[s.k], n: r.nombreSup ? r.nombreSup(s.k) : ''})).filter(x => x.n);
    return {vend, sups};
  }
  const ORD = {nunca: 0, viejo: 1, semana: 2, hoy: 3};
  function pintar(box){
    box.innerHTML = `<section class="ct-card ig"><div class="ig-cab"><span class="ct-ic top">📲</span><div><h3>Uso de la app</h3><p>Cargando quién entró…</p></div></div></section>`;
    cargar().then(xs => dibujar(box, xs)).catch(() => {
      box.innerHTML = `<section class="ct-card ig"><div class="ig-cab"><span class="ct-ic top">📲</span><div><h3>Uso de la app</h3><p>Todavía no hay datos. Pegá el script nuevo de Google (Nueva versión) para que se empiecen a anotar los ingresos.</p></div></div></section>`;
    });
  }
  function dibujar(box, xs){
    const M = modelo(xs), V = M.vend;
    const n = k => V.filter(v => v.est === k).length, tot = V.length, hoy = n('hoy');
    const lista = V.slice().sort((a, b) => ORD[a.est] - ORD[b.est] || (a.u ? a.u.t : '').localeCompare(b.u ? b.u.t : '') || a.c.vn.localeCompare(b.c.vn));
    const fila = v => `<div class="ig-f ${v.est}"><span class="ig-dot"></span><div class="ig-t"><b>${esc(nom(v.c.vn))}</b><small>${esc(v.c.vc)} · ${esc((RU().supLabel || {})[v.c.sup] || v.c.sup)}</small></div><div class="ig-u"><b>${esc(hace(v.u && v.u.f))}${v.u && v.u.f === HOY ? ' ' + esc(v.u.h) : ''}</b>${v.u ? `<small>${v.u.n} ${v.u.n === 1 ? 'vez' : 'veces'} esta semana</small>` : '<small>todavía no la usó</small>'}</div></div>`;
    const ver = ui.ver === 'todos' ? lista : lista.filter(v => v.est !== 'hoy').slice(0, 8);
    box.innerHTML = `<section class="ct-card ig">
      <div class="ig-cab"><span class="ct-ic top">📲</span><div><h3>Uso de la app</h3><p>Quién entró y quién no (vendedores con contraseña)</p></div></div>
      <div class="ig-kpi">
        <div class="ig-big"><b>${hoy}</b><span>de ${tot}</span><small>entraron hoy</small></div>
        <div class="ig-bar"><i class="hoy" style="width:${tot ? hoy / tot * 100 : 0}%"></i><i class="semana" style="width:${tot ? n('semana') / tot * 100 : 0}%"></i></div>
        <div class="ig-ley"><span class="hoy">Hoy <b>${hoy}</b></span><span class="semana">Esta semana <b>${n('semana')}</b></span><span class="viejo">Hace más <b>${n('viejo')}</b></span><span class="nunca">Nunca <b>${n('nunca')}</b></span></div>
      </div>
      ${ui.ver !== 'todos' ? `<p class="ig-sub">${hoy === tot ? '¡Todos entraron hoy! 🎉' : 'No entraron hoy'}</p>` : '<p class="ig-sub">Todos los vendedores</p>'}
      <div class="ig-lista">${ver.map(fila).join('')}</div>
      <button type="button" class="ig-mas" data-igver>${ui.ver === 'todos' ? 'Ver menos' : `Ver los ${tot} vendedores ›`}</button>
      ${M.sups.length ? `<p class="ig-sub">Supervisores</p><div class="ig-lista">${M.sups.map(x => `<div class="ig-f ${!x.u ? 'nunca' : x.u.f === HOY ? 'hoy' : x.u.f >= lunes() ? 'semana' : 'viejo'}"><span class="ig-dot"></span><div class="ig-t"><b>${esc(x.n)}</b><small>${esc((RU().supLabel || {})[x.s.k] || x.s.k)}</small></div><div class="ig-u"><b>${esc(hace(x.u && x.u.f))}${x.u && x.u.f === HOY ? ' ' + esc(x.u.h) : ''}</b></div></div>`).join('')}</div>` : ''}
    </section>`;
    box.querySelector('[data-igver]').onclick = () => { ui.ver = ui.ver === 'todos' ? 'resumen' : 'todos'; dibujar(box, xs); };
  }
  function tarjeta(box){ if (!box || !URL_I) return; if (datos) { dibujar(box, datos); if (Date.now() - datosT > 5 * 60000) cargar().then(xs => dibujar(box, xs)).catch(() => {}); } else pintar(box); }

  // al abrir la app (cuando ya se sabe quién es)
  window.addEventListener('load', () => setTimeout(registrar, 2500));
  window.Ingresos = {registrar, tarjeta, marcarLogin: vc => { try { sessionStorage.setItem(LOGIN, vc); } catch(e){} }};
})();
