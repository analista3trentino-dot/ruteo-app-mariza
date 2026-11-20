// =====================================================================
//  RESUMEN (Visitas, Supervisores y Potencial)
// ---------------------------------------------------------------------
//  Arma la tarjeta "Resumen" que aparece arriba en Visitas (vendedores)
//  y en Supervisores (jefatura): anomalías, quién llegó tarde, quién
//  salió temprano, quién no completó la ruta y quién no compró todavía.
//
//  PODÉS CAMBIAR ESTOS VALORES:
// =====================================================================

const HORA_LLEGADA_TARDE = '08:30';        // primera visita después de esta hora = llegó tarde
const HORA_SALIDA_MINIMA = '16:00';        // última visita antes de esta hora = salió temprano (lunes a viernes)
const HORA_SALIDA_MINIMA_SABADO = '11:30'; // lo mismo, los sábados
const RUTA_MINIMA = 80;                    // % de la ruta: por debajo, "no completó las visitas"
const VISITAS_MINIMAS_SUPERVISOR = 6;      // supervisores: menos visitas que esto en el día = pocas visitas


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ
// ---------------------------------------------------------------------
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const aMin = h => { const m = String(h || '').match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
  const pad = n => String(n).padStart(2, '0');
  const hhmm = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const esSabado = iso => new Date(iso + 'T12:00:00').getDay() === 6;
  const LIM = {
    tarde: aMin(HORA_LLEGADA_TARDE),
    salida: iso => aMin(esSabado(iso) ? HORA_SALIDA_MINIMA_SABADO : HORA_SALIDA_MINIMA),
    ruta: RUTA_MINIMA, visSup: VISITAS_MINIMAS_SUPERVISOR
  };
  const gsN = n => 'Gs. ' + Math.round(n || 0).toLocaleString('es-PY');

  // grupos: [{k, ic, t, tono: 'bad'|'mid'|'ok'|'info', vacio, items: [{n, s, b, go}]}]
  function html(titulo, sub, grupos, ops){
    ops = ops || {};
    const conAlgo = grupos.filter(g => !g.sep && g.items.length);
    const malos = conAlgo.filter(g => g.tono === 'bad').length;
    const estado = conAlgo.filter(g => g.tono !== 'info').length ? (malos ? 'bad' : 'mid') : 'ok';
    const chip = g => `<span class="rz-chip ${g.items.length ? g.tono : 'cero'}">${g.ic} <b>${g.items.length}</b></span>`;
    const cab = `<div class="rz-cab"><span class="rz-luz"></span><div><b>${esc(titulo)}</b><small>${esc(sub)}</small></div>${ops.plegado ? '<span class="rz-ver">Ver</span>' : ''}</div>`;
    const cuerpo = `<div class="rz-gs">${grupos.map(g => g.sep ? `<div class="rz-sep">${esc(g.sep)}</div>` : grupoHtml(g, ops)).join('')}</div>${ops.nota ? `<p class="rz-nota">${ops.nota}</p>` : ''}`;
    if (ops.plegado) return `<details class="rz rz-plg ${estado}"><summary>${cab}<div class="rz-chips">${conAlgo.filter(g => !g.sep).map(chip).join('') || '<span class="rz-chip cero">✅ Todo en orden</span>'}</div></summary>${cuerpo}</details>`;
    return `<section class="rz ${estado}">${cab}${cuerpo}</section>`;
  }

  const grupoHtml = (g, ops) => `<details class="rz-g ${g.items.length ? g.tono : 'cero'}" ${g.items.length && ops.abrir === g.k ? 'open' : ''}>
        <summary><span class="rz-ic">${g.ic}</span><span class="rz-t"><b>${esc(g.t)}</b><small>${g.items.length ? esc(g.items.slice(0, 3).map(x => x.n).join(' · ') + (g.items.length > 3 ? ' y ' + (g.items.length - 3) + ' más' : '')) : esc(g.vacio || 'Nadie')}</small></span><span class="rz-n">${g.items.length}</span></summary>
        ${g.items.length ? `<div class="rz-lista">${g.items.map(x => `<${x.go ? `button type="button" data-rzgo="${esc(x.go)}"` : 'div'} class="rz-it"><span><b>${esc(x.n)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</span>${x.b ? `<em>${esc(x.b)}</em>` : ''}${x.go ? '<i>›</i>' : ''}</${x.go ? 'button' : 'div'}>`).join('')}</div>` : ''}
      </details>`;

  // Hoja que se abre encima (el botón atrás del celular la cierra)
  function hoja(titulo, ic, contenido){
    let h = document.getElementById('cxHoja');
    if (!h){ h = document.createElement('div'); h.id = 'cxHoja'; h.className = 'cx-hoja'; document.body.appendChild(h); }
    h.innerHTML = `<div class="cx-hoja-cab"><button type="button" class="cx-hoja-x" aria-label="Volver">‹</button><span class="cx-hoja-ic">${ic}</span><b>${esc(titulo)}</b></div><div class="cx-hoja-cu">${contenido}</div>`;
    h.classList.add('abierta'); document.documentElement.classList.add('cat-abierto');
    const cerrar = () => { h.classList.remove('abierta'); document.documentElement.classList.remove('cat-abierto'); };
    const RU = window.RUTEO;
    if (RU && RU.apilar){ RU.apilar('', cerrar, true, 'cx-hoja'); h.querySelector('.cx-hoja-x').onclick = () => RU.volver(); }
    else h.querySelector('.cx-hoja-x').onclick = cerrar;
    return h.querySelector('.cx-hoja-cu');
  }

  // ---- Clientes que no compraron (del Excel de potencial) ----
  // carts: carteras; devuelve {sin: [{cl, c, p}], nunca: [{cl, c}]} sin repetir clientes
  function sinCompra(carts, filtro){
    const P = window.Potencial; if (!P || !P.listo) return null;
    const vistos = new Set(), sin = [], nunca = [];
    carts.forEach(c => c.cl.forEach((cl, i) => {
      if (filtro && !filtro(c, i, cl)) return;
      const k = cl[6]; if (!k || vistos.has(k)) return; vistos.add(k);
      if (P.sinHistorial(k)){ nunca.push({cl, c}); return; }   // nunca compró (no figura en el historial)
      if (!P.tiene(k) || P.ventaDe(k) > 0 || !(P.potDe(k) > 0)) return;
      sin.push({cl, c, p: P.potDe(k)});
    }));
    sin.sort((a, b) => b.p - a.p); nunca.sort((a, b) => String(a.cl[2]).localeCompare(String(b.cl[2]), 'es'));
    return {sin, nunca, mes: P.mes(), fuente: P.fuente()};
  }
  const nomV = c => String(c.vn || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()).split(' ').slice(0, 2).join(' ');
  const DIAS_L = [['Lun', 'Lunes'], ['Mar', 'Martes'], ['Mié', 'Miércoles'], ['Jue', 'Jueves'], ['Vie', 'Viernes'], ['Sáb', 'Sábado']];
  const diasDe = cl => String(cl[3] || '').split(',').map(x => x.trim()).filter(Boolean);
  const hoyCorto = () => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date().getDay()];
  function listaClientes(S, cual, conCartera){
    const xs = cual === 'nunca' ? S.nunca : S.sin;
    if (!xs.length) return `<p class="ct-vacio">${cual === 'nunca' ? 'Todos los clientes tienen historial de compras.' : '¡Todos ya compraron este mes!'}</p>`;
    const tot = xs.reduce((t, x) => t + (x.p || 0), 0);
    const fila = x => `<div class="rz-cli ${cual}"><span><b>${esc(x.cl[2])}</b><small>${esc(x.cl[6])}${conCartera ? ' · ' + esc(x.c.vc) + ' ' + esc(nomV(x.c)) : ''}</small></span>${x.p ? `<em><small>suele comprar</small>${gsN(x.p)}</em>` : cual === 'nunca' ? '<em class="rz-sh">Sin historial</em>' : ''}</div>`;
    // por día de visita (un cliente que se visita dos días aparece en los dos)
    const porDia = DIAS_L.map(([k, n]) => [k, n, xs.filter(x => diasDe(x.cl).includes(k))]).filter(([, , ys]) => ys.length);
    const sinDia = xs.filter(x => !diasDe(x.cl).some(d => DIAS_L.some(([k]) => k === d)));
    const hoy = hoyCorto();
    return `<div class="rz-exp">${cual === 'nunca'
      ? `<b>${xs.length} ${xs.length === 1 ? 'cliente' : 'clientes'} sin historial</b><span>Están en su ruteo pero no figuran en el Excel de potencial: no tienen ninguna compra registrada. Son clientes nuevos o para recuperar.</span>`
      : `<b>${xs.length} ${xs.length === 1 ? 'cliente' : 'clientes'} ${S.soloDia ? esc(S.soloDia) : 'en la semana'} · ${gsN(tot)}</b><span>Compraban en meses anteriores, pero todavía no en ${esc(S.mes)}. El monto es lo que suele comprar cada uno (su potencial).</span>`}
      <small>📅 ${esc(S.fuente)}</small></div>
      <div class="rz-dias">${porDia.map(([k, n, ys]) => `<details class="rz-dia" ${k === hoy || porDia.length === 1 ? 'open' : ''}><summary><b>${n}${k === hoy ? ' · hoy' : ''}</b><span>${ys.length} ${ys.length === 1 ? 'cliente' : 'clientes'}</span></summary><div class="rz-clis">${ys.map(fila).join('')}</div></details>`).join('')}
      ${sinDia.length ? `<details class="rz-dia"><summary><b>Sin día de visita</b><span>${sinDia.length}</span></summary><div class="rz-clis">${sinDia.map(fila).join('')}</div></details>` : ''}</div>`;
  }
  function abrirLista(S, cual, titulo, conCartera){ hoja(titulo, cual === 'nunca' ? '🚫' : '🛒', listaClientes(S, cual, conCartera)); }


  // ---- Resumen del día anterior en la pantalla principal (Ruta del supervisor / Control de jefatura) ----
  let memo = {k: '', html: ''};
  async function ayer(box, modo){
    if (!box) return;
    const RU = window.RUTEO, V = window.Visitas;
    if (memo.html && memo.m === modo){ box.innerHTML = memo.html; activarAyer(box); }
    if (!V || !V.asegurar) return;
    try { await V.asegurar(); } catch(e){ return; }
    if (window.Potencial && !window.Potencial.listo) try { await Promise.race([window.Potencial.cargar(), new Promise(ok => setTimeout(ok, 8000))]); } catch(e){}
    const d = V.diaAnterior(); if (!d) { box.innerHTML = ''; return; }
    const k = [modo, d, RU.miSup || '', window.Potencial && window.Potencial.listo ? 1 : 0, (window.Fotos && window.Fotos.anomalias && (window.Fotos.anomalias() || []).length) || 0].join('|');
    if (memo.k === k && memo.html){ if (box.innerHTML !== memo.html){ box.innerHTML = memo.html; activarAyer(box); } return; }
    const h = new Date(); h.setDate(h.getDate() - 1); const iso = h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
    const titulo = d === iso ? 'Resumen de ayer' : 'Resumen del último día';
    const sub = V.largo(d).replace(/^./, c => c.toUpperCase()) + ' · tocá para ver el detalle';
    let grupos;
    if (modo === 'jefatura'){
      const gv = V.resumenDe(RU.carteras, d, {soloGrupos: true, sinCompras: false}) || [];
      let gs = []; try { gs = window.Jefatura && window.Jefatura.resumenDe ? await window.Jefatura.resumenDe(d, {soloGrupos: true}) || [] : []; } catch(e){}
      grupos = [{sep: 'Vendedores'}].concat(gv, gs.length ? [{sep: 'Supervisores'}].concat(gs) : []);
    } else {
      const carts = RU.carteras.filter(c => !RU.miSup || c.sup === RU.miSup);
      grupos = V.resumenDe(carts, d, {soloGrupos: true}) || [];
    }
    if (!grupos.length){ box.innerHTML = ''; return; }
    const html = window.Resumen.html(titulo, sub, grupos, {plegado: true, nota: 'Llegada = primera visita marcada · salida = última visita marcada.'});
    memo = {k, m: modo, html}; box.innerHTML = html; activarAyer(box);
  }
  const activarAyer = box => box.querySelectorAll('[data-rzgo]').forEach(b => b.onclick = e => { e.preventDefault(); const go = b.dataset.rzgo;
    if (go.startsWith('s:') && window.Jefatura && window.Jefatura.irResumen) window.Jefatura.irResumen(go); else if (window.Visitas && window.Visitas.irResumen) window.Visitas.irResumen(go); });

  window.Resumen = {html, hoja, ayer, diasDe, hoyCorto, sinCompra, listaClientes, abrirLista, LIM, aMin, hhmm,
    activar(box, ir){ box.querySelectorAll('[data-rzgo]').forEach(b => b.onclick = e => { e.preventDefault(); ir(b.dataset.rzgo); }); }};
})();
