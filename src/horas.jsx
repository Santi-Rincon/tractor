import { Icon } from './Icon.jsx'
import { Encabezado, Avatar, vibrar } from './comunes.jsx'
import { plata, nombreDia } from './formato.js'
import { CONDUCTORES, PAGO_CONDUCTOR_HORA, PAGO_CONDUCTOR_BULTO, labor, tiempo, cuentaConductor, ganadoConductor } from './reglas.js'

const cifras = (c) => [c.minutos ? tiempo(c.minutos) : '0 h', c.bultos ? `${c.bultos} bultos` : ''].filter(Boolean).join(' · ')

// Renglón del inicio de Raúl y Leo.
export function MisHorasRenglon({ cuenta, onAbrir }) {
  return (
    <button type="button" class="mis-horas" onClick={() => { vibrar(8); onAbrir() }}>
      <span class="mh-ic"><Icon name="clock-duotone" class="ic-s" /></span>
      <span class="rt"><b>Mis horas</b><small>{cifras(cuenta)}</small></span>
      <span class="mh-debe"><small>se me debe</small><b>{plata(cuenta.ganado)}</b></span>
      <Icon name="caret-right-bold" class="ic-xs flecha" />
    </button>
  )
}

// Horas de los conductores. Los dueños ven a todos; el conductor solo lo suyo.
export function Horas({ yo, trabajos, clientes, elegido, onElegir, onVolver, onAbrir }) {
  const esConductor = CONDUCTORES.includes(yo)
  const verTodos = !esConductor || yo === 'Raúl'
  const quienes = verTodos ? CONDUCTORES : [yo]
  const actual = elegido && quienes.includes(elegido) ? elegido : (esConductor ? yo : quienes[0])
  const cuentas = quienes.map((c) => cuentaConductor(trabajos, c))
  const cuenta = cuentas.find((c) => c.conductor === actual)

  const dias = []
  for (const t of cuenta.trabajos) {
    const clave = new Date(t.fecha).toDateString()
    let d = dias.find((x) => x.clave === clave)
    if (!d) { d = { clave, fecha: t.fecha, minutos: 0, bultos: 0, ganado: 0, items: [] }; dias.push(d) }
    d.items.push(t); d.ganado += ganadoConductor(t)
    for (const l of t.labores) l.tipo === 'remolcada' ? (d.bultos += l.bultos) : (d.minutos += l.minutos)
  }

  return (
    <main class="scr">
      <Encabezado titulo={quienes.length === 1 ? 'Mis horas' : 'Horas de los conductores'} onVolver={onVolver} />
      <div class={`conductores n${cuentas.length}`}>
        {cuentas.map((c) => (
          <button type="button" class={`conductor${c.conductor === actual ? ' on' : ''}`} aria-pressed={c.conductor === actual}
            onClick={() => { vibrar(8); onElegir(c.conductor) }}>
            <span class="cd-nombre">{c.conductor}</span>
            <span class="cd-cifras">{cifras(c)}</span>
            <span class="cd-debe">Se le debe</span>
            <b class="cd-valor">{plata(c.ganado)}</b>
          </button>
        ))}
      </div>
      <p class="pista">{plata(PAGO_CONDUCTOR_HORA)} la hora y {plata(PAGO_CONDUCTOR_BULTO)} el bulto. Cuando se anoten los pagos al conductor, se irán restando.</p>
      {dias.length === 0 && <p class="vacio separado">{actual} todavía no tiene trabajos anotados.</p>}
      {dias.map((d) => (
        <section class="dia">
          <header class="dia-h dos">
            <h2>{nombreDia(d.fecha)}</h2>
            <span>{[d.minutos ? tiempo(d.minutos) : '', d.bultos ? `${d.bultos} bultos` : ''].filter(Boolean).join(' · ')} · <b>{plata(d.ganado)}</b></span>
          </header>
          {d.items.map((t) => (
            <button type="button" class="row" onClick={() => onAbrir('trabajo', t.id)}>
              <Avatar cliente={clientes.find((c) => c.id === t.clienteId)} nombre={t.clienteNombre} tam="s" />
              <span class="rt"><b>{t.clienteNombre}</b>
                <small>{t.labores.map((l) => l.tipo === 'remolcada' ? `Remolcada ${l.bultos} bultos` : `${labor(l.tipo).nombre} ${tiempo(l.minutos)}`).join(' + ')}</small></span>
              <span class="amt">{plata(ganadoConductor(t))}</span>
              <Icon name="caret-right-bold" class="ic-xs flecha" />
            </button>
          ))}
        </section>
      ))}
    </main>
  )
}
