import { Icon } from './Icon.jsx'
import { Encabezado, Avatar, vibrar } from './comunes.jsx'
import { plata, nombreDia } from './formato.js'
import { CONDUCTORES, labor, tiempo, cuentaConductor, ganadoConductor } from './reglas.js'

const cifras = (c) => [c.minutos ? tiempo(c.minutos) : '0 h', c.bultos ? `${c.bultos} bultos` : ''].filter(Boolean).join(' · ')

// Renglón del inicio de Raúl y Leo.
export function MisHorasRenglon({ cuenta, onAbrir }) {
  return (
    <button type="button" class="mis-horas" onClick={() => { vibrar(8); onAbrir() }}>
      <span class="mh-ic"><Icon name="clock-duotone" class="ic-s" /></span>
      <span class="rt"><b>Mis horas</b><small>{cifras(cuenta)}</small></span>
      <span class="mh-debe"><small>se me debe</small><b>{plata(cuenta.debe)}</b></span>
      <Icon name="caret-right-bold" class="ic-xs flecha" />
    </button>
  )
}

// Horas de los conductores. Los dueños ven a todos; el conductor solo lo suyo.
export function Horas({ yo, trabajos, pagos, clientes, elegido, onElegir, onVolver, onAbrir, onAnadir }) {
  const esConductor = CONDUCTORES.includes(yo)
  const quienes = !esConductor || yo === 'Raúl' ? CONDUCTORES : [yo]
  const cuentas = quienes.map((c) => cuentaConductor(trabajos, c, pagos))
  // Sin elección: uno mismo si maneja; si no, el último que trabajó.
  const porDefecto = esConductor ? yo : (trabajos.find((t) => quienes.includes(t.conductor))?.conductor ?? quienes[0])
  const actual = elegido && quienes.includes(elegido) ? elegido : porDefecto
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
      {quienes.length > 1 && (
        <div class="selector" role="tablist" aria-label="Conductor">
          {cuentas.map((c) => {
            const on = c.conductor === actual
            return (
              <button type="button" role="tab" aria-selected={on} class={`sel${on ? ' on' : ''}`}
                onClick={() => { vibrar(10); onElegir(c.conductor) }}>
                <span class="sel-av">{c.conductor[0]}</span>{c.conductor}
              </button>
            )
          })}
        </div>
      )}
      <section class="hero-horas" aria-live="polite">
        <span class="hh-quien">{actual} · se le debe</span>
        <b class="hh-valor"><span class="cur">$</span>{plata(cuenta.debe)}</b>
        {cuenta.pagado > 0 && <span class="hh-nota">Ganó {plata(cuenta.ganado)} · le han pagado {plata(cuenta.pagado)}</span>}
        <div class="hh-datos">
          <span><b>{cuenta.minutos ? tiempo(cuenta.minutos) : '0 h'}</b>trabajadas</span>
          <span><b>{cuenta.bultos}</b>bultos</span>
          <span><b>{cuenta.trabajos.length}</b>{cuenta.trabajos.length === 1 ? 'trabajo' : 'trabajos'}</span>
        </div>
      </section>
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
      {actual === yo && (
        <div class="pie-fijo">
          <button type="button" class="primary con-ic" onClick={() => { vibrar(10); onAnadir() }}>
            <Icon name="plus-bold" class="ic-s" /> Añadir un trabajo
          </button>
        </div>
      )}
    </main>
  )
}
