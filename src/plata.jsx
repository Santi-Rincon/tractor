import { useState } from 'preact/hooks'
import { Icon } from './Icon.jsx'
import { Barra, Encabezado, Monto, Teclado, Atajos, Avatar, ConfirmarBorrado, vibrar } from './comunes.jsx'
import { plata, fechaLarga, hora, nombreDia } from './formato.js'
import { totalTrabajo, labor, tiempo, estadoTrabajos } from './reglas.js'
import { Sello } from './trabajo.jsx'

// Pantalla de Plata: las dos acciones arriba y, debajo, quién debe.
export function PlataInicio({ deudas, conductores, onCobrar, onPagarConductor, onCliente, onConductor, onVolver, yoConductorSolo }) {
  const deben = deudas.filter((d) => d.debe > 0).sort((a, b) => b.debe - a.debe)
  const total = deben.reduce((s, d) => s + d.debe, 0)
  return (
    <main class="scr">
      <Encabezado titulo="Plata" onVolver={onVolver} />
      <div class="acciones-plata">
        <button type="button" class="accion-p" onClick={() => { vibrar(10); onCobrar() }}>
          <Icon name="hand-coins-duotone" /><span>Cobrar a un cliente</span>
        </button>
        <button type="button" class="accion-p" onClick={() => { vibrar(10); onPagarConductor() }}>
          <Icon name="steering-wheel-duotone" /><span>{yoConductorSolo ? 'Me pagué' : 'Pagarle al conductor'}</span>
        </button>
      </div>

      <section class="bloque">
        <header class="bloque-h"><h2>Le deben al tractor</h2>{total > 0 && <b>{plata(total)}</b>}</header>
        {deben.length === 0 && <p class="vacio">Ningún cliente debe nada.</p>}
        {deben.map((d) => (
          <button type="button" class="row" onClick={() => onCliente(d.cliente.id)}>
            <Avatar cliente={d.cliente} tam="s" />
            <span class="rt"><b>{d.cliente.nombre}</b><small>{d.trabajos.length} {d.trabajos.length === 1 ? 'trabajo' : 'trabajos'}{d.pagado ? ` · ha pagado ${plata(d.pagado)}` : ''}</small></span>
            <span class="amt debe">{plata(d.debe)}</span>
            <Icon name="caret-right-bold" class="ic-xs flecha" />
          </button>
        ))}
      </section>

      <section class="bloque">
        <header class="bloque-h"><h2>Se le debe al conductor</h2></header>
        {conductores.map((c) => (
          <button type="button" class="row" onClick={() => onConductor(c.conductor)}>
            <span class="ic-caja"><span class="sel-av grande">{c.conductor[0]}</span></span>
            <span class="rt"><b>{c.conductor}</b><small>{c.minutos ? tiempo(c.minutos) : '0 h'}{c.bultos ? ` · ${c.bultos} bultos` : ''}</small></span>
            <span class="amt">{plata(c.debe)}</span>
            <Icon name="caret-right-bold" class="ic-xs flecha" />
          </button>
        ))}
      </section>
    </main>
  )
}

export function ElegirDeudor({ deudas, onElegir, onVolver }) {
  const lista = [...deudas].sort((a, b) => b.debe - a.debe)
  return (
    <main class="scr">
      <Barra titulo={<b>Cobrar</b>} onVolver={onVolver} color="plata" />
      <h1 class="q">¿Quién pagó?</h1>
      {lista.length === 0 && <p class="vacio">Todavía no hay clientes. Se agregan al anotar un trabajo.</p>}
      <div class="lista-grande">
        {lista.map((d) => (
          <button type="button" class="opcion con-icono" onClick={() => { vibrar(10); onElegir(d.cliente) }}>
            <Avatar cliente={d.cliente} />
            <span class="op-txt">{d.cliente.nombre}<small>{d.debe > 0 ? `Debe ${plata(d.debe)}` : 'No debe nada'}</small></span>
          </button>
        ))}
      </div>
    </main>
  )
}

export function CuentaCliente({ d, onVolver, onAbrir, onCobrar }) {
  const movs = [
    ...d.trabajos.map((t) => ({ tipo: 'trabajo', r: t, fecha: t.fecha })),
    ...d.pagos.map((p) => ({ tipo: 'cobro', r: p, fecha: p.fecha }))
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const estado = estadoTrabajos(d.trabajos, d.pagos)
  const ultimoPago = d.pagos.reduce((m, p) => (!m || p.fecha > m ? p.fecha : m), null)
  return (
    <main class="scr">
      <Encabezado titulo="Cuenta del cliente" onVolver={onVolver} />
      <section class="hero-horas con-sello">
        <div class="r-top"><Avatar cliente={d.cliente} /><span class="r-tipo">{d.cliente.nombre}{d.cliente.vereda && <small>{d.cliente.vereda}</small>}</span></div>
        <span class="hh-quien espacio">{d.debe > 0 ? 'Debe' : d.debe < 0 ? 'Tiene a favor' : 'Está a paz y salvo'}</span>
        {d.debe !== 0 && <b class={`hh-valor${d.debe > 0 ? ' rojo' : ''}`}><span class="cur">$</span>{plata(Math.abs(d.debe))}</b>}
        {d.debe <= 0 && d.trabajos.length > 0 && <Sello texto="Paz y salvo" fecha={ultimoPago} />}
        <div class="hh-datos dos">
          <span><b>{plata(d.trabajado)}</b>trabajado</span>
          <span><b>{plata(d.pagado)}</b>pagado</span>
        </div>
      </section>
      {movs.map((m) => m.tipo === 'trabajo' ? (
        <button type="button" class="row mov" onClick={() => onAbrir('trabajo', m.r.id)}>
          <span class="ic-caja"><Icon name="tractor-duotone" class="ic-s i-trabajo" /></span>
          <span class="rt"><b>{m.r.labores.map((l) => l.tipo === 'remolcada' ? `${l.bultos} bultos` : `${labor(l.tipo).nombre} ${tiempo(l.minutos)}`).join(' + ')}</b><small>{nombreDia(m.r.fecha)} · {m.r.conductor}{estado[m.r.id]?.pagado ? <span class="tag-pagado">Pagado</span> : ''}</small></span>
          <span class="amt">+ {plata(totalTrabajo(m.r))}</span>
          <Icon name="caret-right-bold" class="ic-xs flecha" />
        </button>
      ) : (
        <button type="button" class="row mov" onClick={() => onAbrir('cobro', m.r.id)}>
          <span class="ic-caja"><Icon name="hand-coins-duotone" class="ic-s i-cobro" /></span>
          <span class="rt"><b>Pagó</b><small>{nombreDia(m.r.fecha)} · recibió {m.r.recibio}</small></span>
          <span class="amt ok">− {plata(m.r.valor)}</span>
          <Icon name="caret-right-bold" class="ic-xs flecha" />
        </button>
      ))}
      <div class="pie-fijo">
        <button type="button" class="primary con-ic morado" onClick={() => { vibrar(10); onCobrar() }}>
          <Icon name="hand-coins-duotone" class="ic-s" /> Anotar un pago
        </button>
      </div>
    </main>
  )
}

export function ValorPlata({ titulo, pregunta, sub, digitos, atajos, etiqueta, onDigitos, onVolver, onGuardar }) {
  const [guardando, setGuardando] = useState(false)
  const valor = Number(digitos || 0)
  return (
    <main class="scr">
      <Barra titulo={titulo} onVolver={onVolver} color="plata" />
      <h1 class="q">{pregunta}</h1>
      {sub && <p class="sub-q">{sub}</p>}
      <Monto valor={valor} />
      {atajos.length > 0 && <Atajos valores={atajos} actual={valor} etiqueta={etiqueta} color="plata" onElegir={(a) => onDigitos(a ? String(a) : '')} />}
      <Teclado digitos={digitos} onDigitos={onDigitos} />
      <button type="button" class="primary" disabled={!valor || guardando} onClick={() => { setGuardando(true); onGuardar() }}>Guardar</button>
    </main>
  )
}

export function ElegirConductor({ cuentas, onElegir, onVolver }) {
  return (
    <main class="scr">
      <Barra titulo={<b>Pago al conductor</b>} onVolver={onVolver} color="plata" />
      <h1 class="q">¿A quién le pagó?</h1>
      <div class="lista-grande">
        {cuentas.map((c) => (
          <button type="button" class="opcion con-icono" onClick={() => { vibrar(10); onElegir(c.conductor) }}>
            <span class="burbuja b-plata"><Icon name="steering-wheel-duotone" /></span>
            <span class="op-txt">{c.conductor}<small>{c.debe > 0 ? `Se le debe ${plata(c.debe)}` : 'No se le debe nada'}</small></span>
          </button>
        ))}
      </div>
    </main>
  )
}

export function ListoPlata({ frase, onInicio, onDeshacer, que }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <main class="scr done">
      <div class="badge morado"><Icon name="check-bold" class="ic-xl" /></div>
      <h1 class="ok-t">Quedó anotado</h1>
      <p class="sent">{frase}</p>
      <div class="sp" />
      <button type="button" class="primary" onClick={onInicio}>Volver al inicio</button>
      <button type="button" class="ghost" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="arrow-counter-clockwise-bold" class="ic-s" /> Deshacer</button>
      {confirmando && <ConfirmarBorrado que={que} onSi={onDeshacer} onNo={() => setConfirmando(false)} />}
    </main>
  )
}

export function ReciboPago({ p, yo, onVolver, onBorrar }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <main class="scr">
      <div class="bar">
        <button type="button" class="back" onClick={onVolver} aria-label="Volver"><Icon name="arrow-left-bold" class="ic-s" /></button>
        <span class="crumb c-plata"><b>Recibo de pago al conductor</b></span>
      </div>
      <article class="recibo">
        <div class="r-top"><span class="burbuja b-plata"><Icon name="steering-wheel-duotone" /></span><span class="r-tipo">Pago a {p.conductor}</span></div>
        <div class="r-valor"><span class="cur">$</span>{plata(p.valor)}</div>
        <dl class="r-filas">
          <div><dt>Quién pagó</dt><dd>{p.pagadoPor === p.conductor ? `${p.conductor} (de lo cobrado)` : p.pagadoPor}</dd></div>
          <div><dt>Quién recibió</dt><dd>{p.conductor}</dd></div>
          <div><dt>Fecha</dt><dd>{fechaLarga(new Date(p.fecha))}</dd></div>
          <div><dt>Hora</dt><dd>{hora(p.fecha)}</dd></div>
        </dl>
      </article>
      <div class="sp" />
      {p.registradoPor === yo
        ? <button type="button" class="ghost peligro-t" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="trash-bold" class="ic-s" /> Borrar este pago</button>
        : <p class="pista centro">Solo {p.registradoPor} puede borrarlo.</p>}
      {confirmando && <ConfirmarBorrado que="este pago" onSi={() => onBorrar(p.id)} onNo={() => setConfirmando(false)} />}
    </main>
  )
}
