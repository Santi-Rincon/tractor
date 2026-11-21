import { useRef, useState } from 'preact/hooks'
import { Icon } from './Icon.jsx'
import { Barra, Encabezado, Avatar, ConfirmarBorrado, vibrar } from './comunes.jsx'
import { labor } from './reglas.js'

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIA_LLENO = 8 // horas: desde aquí el día se marca como lleno

// Las citas se guardan por día local, "YYYY-MM-DD".
export const diaClave = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const deClave = (k) => { const [a, m, d] = k.split('-').map(Number); return new Date(a, m - 1, d) }
const sumarDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return diaClave(d) }

export function nombreDiaCita(k) {
  const d = deClave(k)
  if (k === sumarDias(0)) return 'Hoy'
  if (k === sumarDias(1)) return 'Mañana'
  const dia = DIAS[d.getDay()]
  return `${dia[0].toUpperCase()}${dia.slice(1)} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

const activas = (citas, k) => citas.filter((c) => c.dia === k && c.estado !== 'cancelada')
const horasDe = (lista) => lista.reduce((s, c) => s + (c.horas || 0), 0)
const carga = (lista) => lista.length === 0 ? 'Libre' : `${lista.length} ${lista.length === 1 ? 'cita' : 'citas'} · unas ${horasDe(lista)} h`

function laborTxt(c) {
  const l = labor(c.labor)
  return c.labor === 'remolcada' ? 'Remolcada' : `${l.nombre} · unas ${c.horas} h`
}

// Pantalla principal: la semana arriba, las citas del día elegido y el botón para apartar.
export function Agenda({ citas, clientes, dia, onDia, onVolver, onApartar, onAbrir }) {
  const dias = Array.from({ length: 14 }, (_, i) => sumarDias(i))
  const elegido = dia ?? dias[0]
  const delDia = activas(citas, elegido).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  const horas = horasDe(delDia)
  const proximas = citas.filter((c) => c.dia > elegido && c.estado === 'apartada').length

  return (
    <main class="scr">
      <Encabezado titulo="Agenda" onVolver={onVolver} />
      <div class="semana" role="tablist" aria-label="Días">
        {dias.map((k) => {
          const d = deClave(k)
          const n = activas(citas, k).length
          const on = k === elegido
          return (
            <button type="button" role="tab" aria-selected={on} class={`dia-b${on ? ' on' : ''}`} onClick={() => { vibrar(8); onDia(k) }}>
              <span class="db-nombre">{k === dias[0] ? 'Hoy' : DIAS[d.getDay()].slice(0, 3)}</span>
              <b class="db-num">{d.getDate()}</b>
              <span class="db-puntos">{Array.from({ length: Math.min(n, 3) }, () => <i />)}</span>
            </button>
          )
        })}
      </div>

      <header class="dia-agenda">
        <h2>{nombreDiaCita(elegido)}</h2>
        <span class={horas >= DIA_LLENO ? 'lleno' : ''}>{horas >= DIA_LLENO ? `Día lleno · unas ${horas} h` : carga(delDia)}</span>
      </header>

      {delDia.length === 0 && <p class="vacio">No hay nada apartado para este día.</p>}
      {delDia.map((c) => (
        <button type="button" class={`row cita e-${c.estado}`} onClick={() => onAbrir(c.id)}>
          <Avatar cliente={clientes.find((x) => x.id === c.clienteId)} nombre={c.clienteNombre} tam="s" />
          <span class="rt"><b>{c.clienteNombre}</b><small>{laborTxt(c)}{c.vereda ? ` · ${c.vereda}` : ''}</small></span>
          <span class={`estado-cita ec-${c.estado}`}>{c.estado === 'hecha' ? 'Hecha' : c.estado === 'aplazada' ? 'Aplazada' : 'Apartada'}</span>
          <Icon name="caret-right-bold" class="ic-xs flecha" />
        </button>
      ))}
      {proximas > 0 && delDia.length === 0 && <p class="pista">Hay {proximas} {proximas === 1 ? 'cita' : 'citas'} más adelante en la semana.</p>}

      <div class="pie-fijo">
        <button type="button" class="primary con-ic azul" onClick={() => { vibrar(10); onApartar(elegido) }}>
          <Icon name="plus-bold" class="ic-s" /> Apartar un día
        </button>
      </div>
    </main>
  )
}

// Detalle de una cita, con lo que se puede hacer con ella.
export function Cita({ cita, cliente, puedeRegistrar, onVolver, onRegistrar, onAplazar, onBorrar }) {
  const [confirmando, setConfirmando] = useState(false)
  const pendiente = cita.estado !== 'hecha'
  return (
    <main class="scr">
      <Encabezado titulo="Cita" onVolver={onVolver} />
      <article class="recibo r-agenda">
        <span class="r-etiqueta e-agenda">{cita.estado === 'hecha' ? 'Hecha' : 'Apartada'}</span>
        <div class="r-top"><Avatar cliente={cliente} nombre={cita.clienteNombre} /><span class="r-tipo">{cita.clienteNombre}{cita.vereda && <small>{cita.vereda}</small>}</span></div>
        <div class="cita-dia"><Icon name="calendar-dots-duotone" class="ic-s" /> {nombreDiaCita(cita.dia)}</div>
        <dl class="r-filas">
          <div><dt>Labor</dt><dd>{labor(cita.labor).nombre}</dd></div>
          {cita.labor !== 'remolcada' && <div><dt>Tiempo más o menos</dt><dd>unas {cita.horas} h</dd></div>}
          {cita.aplazadaDesde && <div><dt>Estaba para</dt><dd>{nombreDiaCita(cita.aplazadaDesde)}</dd></div>}
          <div><dt>La apartó</dt><dd>{cita.registradoPor}</dd></div>
        </dl>
      </article>
      <div class="sp" />
      {pendiente && (
        <div class="acciones-cita">
          {puedeRegistrar && (
            <button type="button" class="primary con-ic" onClick={() => { vibrar(10); onRegistrar() }}>
              <Icon name="tractor-duotone" class="ic-s" /> Ya se hizo · anotar trabajo
            </button>
          )}
          <button type="button" class="boton-sec" onClick={() => { vibrar(10); onAplazar() }}>
            <Icon name="calendar-dots-duotone" class="ic-s" /> Pasar a otro día
          </button>
          <button type="button" class="ghost peligro-t" onClick={() => { vibrar(10); setConfirmando(true) }}>
            <Icon name="trash-bold" class="ic-s" /> Quitar de la agenda
          </button>
        </div>
      )}
      {confirmando && <ConfirmarBorrado que="esta cita" onSi={onBorrar} onNo={() => setConfirmando(false)} />}
    </main>
  )
}

// ¿Cuántas horas más o menos? Botones grandes con los tiempos más comunes.
export function HorasAprox({ cliente, tipo, onVolver, onListo }) {
  const opciones = [1, 2, 3, 4, 5, 6, 8]
  return (
    <main class="scr">
      <Barra titulo={<>{labor(tipo).nombre} · <b>{cliente.nombre}</b></>} onVolver={onVolver} color="agenda" />
      <h1 class="q">¿Cuántas horas, más o menos?</h1>
      <div class="horas-grid">
        {opciones.map((h) => (
          <button type="button" class="hora-b" onClick={() => { vibrar(10); onListo(h) }}><b>{h}</b>{h === 1 ? 'hora' : 'horas'}</button>
        ))}
        <button type="button" class="hora-b nose" onClick={() => { vibrar(10); onListo(0) }}><b>?</b>no sé</button>
      </div>
    </main>
  )
}

// ¿Qué día? Cada día dice qué tan ocupado está. Avisa, pero no bloquea.
export function ElegirDiaCita({ citas, cliente, titulo, pregunta, sugerido, horas, excluir, onVolver, onElegir }) {
  const dias = Array.from({ length: 14 }, (_, i) => sumarDias(i))
  const entrada = useRef()
  return (
    <main class="scr">
      <Barra titulo={titulo ?? <>Agenda · <b>{cliente.nombre}</b></>} onVolver={onVolver} color="agenda" />
      <h1 class="q">{pregunta ?? '¿Qué día?'}</h1>
      <div class="lista-dias">
        {dias.filter((k) => k !== excluir).map((k) => {
          const lista = activas(citas, k)
          const total = horasDe(lista) + (horas || 0)
          const lleno = lista.length > 0 && total > DIA_LLENO
          return (
            <button type="button" class={`opcion dia-op${k === sugerido ? ' sugerido' : ''}`} onClick={() => { vibrar(10); onElegir(k) }}>
              <span class="op-txt">{nombreDiaCita(k)}<small class={lleno ? 'lleno' : lista.length ? 'ocupado' : 'libre'}>{lleno ? `Ya tiene ${carga(lista)}` : carga(lista)}</small></span>
              <Icon name="caret-right-bold" class="ic-xs flecha" />
            </button>
          )
        })}
      </div>
      <button type="button" class="ghost secundario azul-t" onClick={() => { entrada.current.showPicker ? entrada.current.showPicker() : entrada.current.click() }}>
        Otro día más adelante
      </button>
      <input ref={entrada} class="fecha-oculta" type="date" min={sumarDias(0)} tabIndex={-1} aria-hidden="true"
        onChange={(e) => e.currentTarget.value && onElegir(e.currentTarget.value)} />
    </main>
  )
}

export function ListoCita({ cita, frase, onAgenda, onDeshacer }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <main class="scr done">
      <div class="badge azul"><Icon name="calendar-dots-duotone" class="ic-xl" /></div>
      <h1 class="ok-t">Quedó apartado</h1>
      <p class="sent">{frase}</p>
      <div class="sp" />
      <button type="button" class="primary azul" onClick={onAgenda}>Ver la agenda</button>
      <button type="button" class="ghost" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="arrow-counter-clockwise-bold" class="ic-s" /> Deshacer</button>
      {confirmando && <ConfirmarBorrado que="esta cita" onSi={onDeshacer} onNo={() => setConfirmando(false)} />}
    </main>
  )
}
