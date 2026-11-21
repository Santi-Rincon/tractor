import { useState } from 'preact/hooks'
import { Icon } from './Icon.jsx'
import { Barra, Encabezado, Monto, Teclado, Atajos, Avatar, ConfirmarBorrado, vibrar } from './comunes.jsx'
import { plata, fechaLarga, hora, nombreDia } from './formato.js'
import { totalTrabajo, labor, tiempo, estadoTrabajos } from './reglas.js'
import { Sello } from './trabajo.jsx'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const delMes = (lista, mes) => lista.filter((x) => x.fecha.slice(0, 7) === mes)
const suma = (lista, f = (x) => x.valor) => lista.reduce((s, x) => s + f(x), 0)

function Pestanas({ pestanas, actual, onCambiar }) {
  return (
    <div class={`selector n${pestanas.length}`} role="tablist" aria-label="Secciones de Plata">
      {pestanas.map((p) => (
        <button type="button" role="tab" aria-selected={actual === p.id} class={`sel morado${actual === p.id ? ' on' : ''}`}
          onClick={() => { vibrar(10); onCambiar(p.id) }}>{p.nombre}</button>
      ))}
    </div>
  )
}

function FilaCobro({ c, cliente, onAbrir }) {
  return (
    <button type="button" class="row" onClick={() => onAbrir('cobro', c.id)}>
      <Avatar cliente={cliente} nombre={c.clienteNombre} tam="s" />
      <span class="rt"><b>{c.clienteNombre}</b><small>{nombreDia(c.fecha)} · recibió {c.recibio}</small></span>
      <span class="amt ok">{plata(c.valor)}</span>
      <Icon name="caret-right-bold" class="ic-xs flecha" />
    </button>
  )
}

function FilaPagoConductor({ p, onAbrir }) {
  return (
    <button type="button" class="row" onClick={() => onAbrir('pago', p.id)}>
      <span class="ic-caja"><Icon name="steering-wheel-duotone" class="ic-s i-pago" /></span>
      <span class="rt"><b>Pago a {p.conductor}</b><small>{nombreDia(p.fecha)} · {p.pagadoPor === p.conductor ? 'de lo cobrado' : `pagó ${p.pagadoPor}`}</small></span>
      <span class="amt">{plata(p.valor)}</span>
      <Icon name="caret-right-bold" class="ic-xs flecha" />
    </button>
  )
}

// Plata: tres pestañas para que nada quede amontonado. "Cuentas" es solo para los dueños.
export function Plata({ yo, esDueno, soloConductor, tab, onTab, datos, deudas, conductores, personas,
  onVolver, onCobrar, onPagarConductor, onCliente, onConductor, onAbrir, onVerPagos }) {
  const pestanas = [{ id: 'cobros', nombre: 'Cobros' }, { id: 'conductor', nombre: 'Conductor' }]
  if (esDueno) pestanas.push({ id: 'cuentas', nombre: 'Cuentas' })
  const actual = pestanas.some((p) => p.id === tab) ? tab : 'cobros'
  const cli = (id) => datos.clientes.find((c) => c.id === id)

  return (
    <main class="scr">
      <Encabezado titulo="Plata" onVolver={onVolver} />
      <Pestanas pestanas={pestanas} actual={actual} onCambiar={onTab} />

      {actual === 'cobros' && <Cobros deudas={deudas} cobros={datos.cobros} cli={cli} onCobrar={onCobrar} onCliente={onCliente} onAbrir={onAbrir} onVerPagos={onVerPagos} />}

      {actual === 'conductor' && (
        <>
          <button type="button" class="accion-p ancha" onClick={() => { vibrar(10); onPagarConductor() }}>
            <Icon name="steering-wheel-duotone" /><span>{soloConductor ? 'Me pagué de lo cobrado' : 'Pagarle al conductor'}</span>
          </button>
          <section class="bloque">
            <header class="bloque-h"><h2>Se le debe al conductor</h2></header>
            {conductores.map((c) => (
              <button type="button" class="row" onClick={() => onConductor(c.conductor)}>
                <span class="ic-caja"><span class="sel-av grande">{c.conductor[0]}</span></span>
                <span class="rt"><b>{c.conductor}</b><small>{c.minutos ? tiempo(c.minutos) : '0 h'}{c.bultos ? ` · ${c.bultos} bultos` : ''}{c.pagado ? ` · le han pagado ${plata(c.pagado)}` : ''}</small></span>
                <span class="amt">{plata(c.debe)}</span>
                <Icon name="caret-right-bold" class="ic-xs flecha" />
              </button>
            ))}
          </section>
          <section class="bloque">
            <header class="bloque-h"><h2>Últimos pagos al conductor</h2></header>
            {(() => {
              const pagos = soloConductor ? datos.pagos.filter((p) => p.conductor === yo) : datos.pagos
              return pagos.length === 0 ? <p class="vacio">Todavía no se le ha pagado al conductor.</p>
                : pagos.slice(0, 5).map((p) => <FilaPagoConductor p={p} onAbrir={onAbrir} />)
            })()}
          </section>
        </>
      )}

      {actual === 'cuentas' && <Cuentas yo={yo} datos={datos} personas={personas} />}
    </main>
  )
}

function Cobros({ deudas, cobros, cli, onCobrar, onCliente, onAbrir, onVerPagos }) {
  const deben = deudas.filter((d) => d.debe > 0).sort((a, b) => b.debe - a.debe)
  const total = suma(deben, (d) => d.debe)
  return (
    <>
      <button type="button" class="accion-p ancha" onClick={() => { vibrar(10); onCobrar() }}>
        <Icon name="hand-coins-duotone" /><span>Cobrar a un cliente</span>
      </button>
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
        <header class="bloque-h"><h2>Ya pagaron</h2></header>
        {cobros.length === 0 && <p class="vacio">Todavía no se ha anotado ningún pago.</p>}
        {cobros.slice(0, 5).map((c) => <FilaCobro c={c} cliente={cli(c.clienteId)} onAbrir={onAbrir} />)}
        {cobros.length > 5 && (
          <button type="button" class="ver-todo morado-t" onClick={onVerPagos}>Ver todos los pagos ({cobros.length}) <Icon name="caret-right-bold" class="ic-xs" /></button>
        )}
      </section>
    </>
  )
}

// Plata del tractor que tiene cada persona: lo que cobró, menos lo que gastó y lo que le pagó al conductor.
export function enMano(datos, persona) {
  const recibido = suma(datos.cobros.filter((c) => c.recibio === persona))
  const gastado = suma(datos.gastos.filter((g) => g.pagadoPor === persona))
  const pagoConductor = suma(datos.pagos.filter((p) => p.pagadoPor === persona))
  return { recibido, gastado, pagoConductor, tiene: recibido - gastado - pagoConductor }
}

const mesDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

function Cuentas({ yo, datos, personas }) {
  const hoy = mesDe(new Date())
  const [mes, setMes] = useState(hoy)
  const [a, m] = mes.split('-').map(Number)
  const mover = (n) => { const d = new Date(a, m - 1 + n, 1); const nuevo = mesDe(d); if (nuevo <= hoy) { vibrar(8); setMes(nuevo) } }

  const entro = suma(delMes(datos.cobros, mes))
  const gastos = suma(delMes(datos.gastos, mes))
  const conductor = suma(delMes(datos.pagos, mes))
  const trabajosMes = delMes(datos.trabajos, mes)
  const trabajado = suma(trabajosMes, totalTrabajo)
  const mia = enMano(datos, yo)

  return (
    <>
      <section class="bloque">
        <header class="bloque-h"><h2>¿Quién tiene la plata del tractor?</h2></header>
        {personas.map((p) => {
          const e = enMano(datos, p)
          return (
            <div class="row quieto">
              <span class="ic-caja"><span class="sel-av grande">{p[0]}</span></span>
              <span class="rt"><b>{p}</b><small>{e.tiene < 0 ? 'puso de su bolsillo' : `recibió ${plata(e.recibido)}`}</small></span>
              <span class={`amt${e.tiene < 0 ? ' debe' : ''}`}>{plata(Math.abs(e.tiene))}</span>
            </div>
          )
        })}
      </section>

      <section class="bloque">
        <div class="mes">
          <button type="button" class="mes-b" aria-label="Mes anterior" onClick={() => mover(-1)}><Icon name="caret-right-bold" class="ic-s girar" /></button>
          <b>{MESES[m - 1][0].toUpperCase() + MESES[m - 1].slice(1)} {a}</b>
          <button type="button" class="mes-b" aria-label="Mes siguiente" disabled={mes >= hoy} onClick={() => mover(1)}><Icon name="caret-right-bold" class="ic-s" /></button>
        </div>
        <article class="recibo plano balance">
          <dl class="r-filas">
            <div><dt>Entró (cobros)</dt><dd class="verde">+ {plata(entro)}</dd></div>
            <div><dt>Gastos</dt><dd>− {plata(gastos)}</dd></div>
            <div><dt>Pagos al conductor</dt><dd>− {plata(conductor)}</dd></div>
            <div class="r-total"><dt>{entro - gastos - conductor >= 0 ? 'Quedó' : 'Faltó'}</dt><dd>{plata(Math.abs(entro - gastos - conductor))}</dd></div>
          </dl>
          <p class="balance-nota">Se trabajó por <b>{plata(trabajado)}</b> en {trabajosMes.length} {trabajosMes.length === 1 ? 'trabajo' : 'trabajos'}.</p>
        </article>
      </section>

      <section class="bloque">
        <header class="bloque-h"><h2>Mi plata · {yo}</h2></header>
        <article class="recibo plano">
          <dl class="r-filas sin-borde">
            <div><dt>He recibido de clientes</dt><dd>{plata(mia.recibido)}</dd></div>
            <div><dt>He gastado en el tractor</dt><dd>{plata(mia.gastado)}</dd></div>
            <div><dt>Le he pagado al conductor</dt><dd>{plata(mia.pagoConductor)}</dd></div>
            <div class="r-total"><dt>{mia.tiene >= 0 ? 'Tengo del tractor' : 'He puesto de mi bolsillo'}</dt><dd>{plata(Math.abs(mia.tiene))}</dd></div>
          </dl>
        </article>
      </section>
    </>
  )
}

export function ElegirDeudor({ deudas, onElegir, onVolver }) {
  const [otros, setOtros] = useState(false)
  const deben = deudas.filter((d) => d.debe > 0).sort((a, b) => b.debe - a.debe)
  const resto = deudas.filter((d) => d.debe <= 0)
  const lista = otros ? resto : deben
  return (
    <main class="scr">
      <Barra titulo={<b>Cobrar</b>} onVolver={otros ? () => setOtros(false) : onVolver} color="plata" />
      <h1 class="q">{otros ? 'Pago por adelantado' : '¿Quién pagó?'}</h1>
      {otros && <p class="sub-q">Clientes que no deben nada ahora.</p>}
      {lista.length === 0 && <p class="vacio">{otros ? 'No hay más clientes.' : 'Ningún cliente debe nada.'}</p>}
      <div class="lista-grande">
        {lista.map((d) => (
          <button type="button" class="opcion con-icono" onClick={() => { vibrar(10); onElegir(d.cliente) }}>
            <Avatar cliente={d.cliente} />
            <span class="op-txt">{d.cliente.nombre}<small>{d.debe > 0 ? `Debe ${plata(d.debe)}` : d.debe < 0 ? `Tiene a favor ${plata(-d.debe)}` : 'No debe nada'}</small></span>
          </button>
        ))}
      </div>
      {!otros && resto.length > 0 && (
        <button type="button" class="ghost secundario" onClick={() => { vibrar(8); setOtros(true) }}>Otro cliente (pago por adelantado)</button>
      )}
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
