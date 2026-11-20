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
    const conAlgo = grupos.filter(g => g.items.length);
    const malos = conAlgo.filter(g => g.tono === 'bad').length;
    const estado = conAlgo.filter(g => g.tono !== 'info').length ? (malos ? 'bad' : 'mid') : 'ok';
    const chip = g => `<span class="rz-chip ${g.items.length ? g.tono : 'cero'}">${g.ic} <b>${g.items.length}</b></span>`;
    return `<section class="rz ${estado}">
      <div class="rz-cab"><span class="rz-luz"></span><div><b>${esc(titulo)}</b><small>${esc(sub)}</small></div></div>
      <div class="rz-gs">${grupos.map(g => `<details class="rz-g ${g.items.length ? g.tono : 'cero'}" ${g.items.length && ops.abrir === g.k ? 'open' : ''}>
        <summary><span class="rz-ic">${g.ic}</span><span class="rz-t"><b>${esc(g.t)}</b><small>${g.items.length ? esc(g.items.slice(0, 3).map(x => x.n).join(' · ') + (g.items.length > 3 ? ' y ' + (g.items.length - 3) + ' más' : '')) : esc(g.vacio || 'Nadie')}</small></span><span class="rz-n">${g.items.length}</span></summary>
        ${g.items.length ? `<div class="rz-lista">${g.items.map(x => `<${x.go ? `button type="button" data-rzgo="${esc(x.go)}"` : 'div'} class="rz-it"><span><b>${esc(x.n)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</span>${x.b ? `<em>${esc(x.b)}</em>` : ''}${x.go ? '<i>›</i>' : ''}</${x.go ? 'button' : 'div'}>`).join('')}</div>` : ''}
      </details>`).join('')}</div>
      ${ops.nota ? `<p class="rz-nota">${ops.nota}</p>` : ''}
    </section>`;
  }

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
      const p = P.potDe(k), v = P.ventaDe(k);
      if (v > 0) return;
      if (p > 0) sin.push({cl, c, p}); else nunca.push({cl, c});
    }));
    sin.sort((a, b) => b.p - a.p); nunca.sort((a, b) => String(a.cl[2]).localeCompare(String(b.cl[2]), 'es'));
    return {sin, nunca, mes: P.mes(), fuente: P.fuente()};
  }
  const nomV = c => String(c.vn || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()).split(' ').slice(0, 2).join(' ');
  function listaClientes(S, cual, conCartera){
    const xs = cual === 'nunca' ? S.nunca : S.sin;
    if (!xs.length) return `<p class="ct-vacio">${cual === 'nunca' ? 'Todos los clientes tienen alguna compra registrada.' : '¡Todos ya compraron este mes!'}</p>`;
    const tot = xs.reduce((t, x) => t + (x.p || 0), 0);
    return `<p class="rz-nota" style="margin:0">${cual === 'nunca'
      ? `<b>${xs.length}</b> ${xs.length === 1 ? 'cliente no tiene' : 'clientes no tienen'} ninguna compra en los últimos meses (no tienen potencial calculado).`
      : `<b>${xs.length}</b> ${xs.length === 1 ? 'cliente tiene' : 'clientes tienen'} potencial pero todavía no compraron en ${esc(S.mes)} · juntos pueden comprar <b>${gsN(tot)}</b>.`} <span>${esc(S.fuente)}</span></p>
      <div class="rz-clis">${xs.map(x => `<div class="rz-cli"><span><b>${esc(x.cl[2])}</b><small>${esc(x.cl[6])}${x.cl[3] ? ' · ' + esc(x.cl[3]) : ''}${conCartera ? ' · ' + esc(x.c.vc) + ' ' + esc(nomV(x.c)) : ''}</small></span>${x.p ? `<em>${gsN(x.p)}</em>` : ''}</div>`).join('')}</div>`;
  }
  function abrirLista(S, cual, titulo, conCartera){ hoja(titulo, cual === 'nunca' ? '🚫' : '🛒', listaClientes(S, cual, conCartera)); }

  window.Resumen = {html, hoja, sinCompra, listaClientes, abrirLista, LIM, aMin, hhmm,
    activar(box, ir){ box.querySelectorAll('[data-rzgo]').forEach(b => b.onclick = e => { e.preventDefault(); ir(b.dataset.rzgo); }); }};
})();
