import { useEffect, useRef, useState } from 'preact/hooks'
import { Icon } from './Icon.jsx'
import { cargar, guardarLista, guardarYo, guardarFoto, borrarFoto } from './store.js'
import { plata, fechaLarga, saludo, cuando, nombreDia } from './formato.js'
import { vibrar, nuevoId, Encabezado, ConfirmarBorrado, Avatar, COLORES_CLIENTE } from './comunes.jsx'
import { CONDUCTORES, labor, totalTrabajo, tiempo, cuentaConductor } from './reglas.js'
import { Horas, MisHorasRenglon } from './horas.jsx'
import { Categoria, Detalle, Cuanto, Foto, ReciboGasto, categoria } from './gasto.jsx'
import {
  ElegirCliente, ClienteNuevo, ElegirVereda, ElegirLabor, Tiempo, Bultos, Pregunta, Valor,
  Resumen, ListoTrabajo, ReciboTrabajo, ReciboCobro, Trabajados
} from './trabajo.jsx'

export const PERSONAS = ['Santiago', 'Raúl', 'Leo']

const ACCIONES = [
  { id: 'trabajo', nombre: 'Trabajo', pista: 'lo que se hizo hoy', icono: 'tractor-duotone' },
  { id: 'gasto', nombre: 'Gasto', pista: 'ACPM, repuestos…', icono: 'gas-pump-duotone' },
  { id: 'plata', nombre: 'Plata', pista: 'cobros y entregas', icono: 'hand-coins-duotone' },
  { id: 'agenda', nombre: 'Agenda', pista: 'apartar un día', icono: 'calendar-dots-duotone' }
]

const FILTROS = [
  { id: 'todo', nombre: 'Todo' },
  { id: 'gasto', nombre: 'Gastos' },
  { id: 'trabajo', nombre: 'Trabajos' },
  { id: 'cobro', nombre: 'Plata' }
]

const borradorGasto = () => ({ categoria: null, detalle: '', digitos: '' })
const borradorTrabajo = () => ({ cliente: null, vereda: '', labores: [], idx: 0, tipo: null, acpm: '', pago: '' })

export function App() {
  const [listo, setListo] = useState(false)
  const [yo, setYo] = useState(null)
  const [datos, setDatos] = useState({ gastos: [], trabajos: [], cobros: [], clientes: [] })
  const [pila, setPila] = useState(['inicio'])
  const pilaRef = useRef(pila)
  const saltarPop = useRef(false)
  const [dir, setDir] = useState('adelante')
  const [bg, setBg] = useState(borradorGasto)
  const [bt, setBt] = useState(borradorTrabajo)
  const [ultimo, setUltimo] = useState(null)
  const [abierto, setAbierto] = useState(null)
  const [filtro, setFiltro] = useState('todo')
  const [filtroConductor, setFiltroConductor] = useState('todos')
  const [conductorHoras, setConductorHoras] = useState(null)
  const [aviso, setAviso] = useState('')
  const avisoTimer = useRef()

  useEffect(() => {
    cargar().then(({ yo, ...listas }) => { setYo(yo); setDatos(listas); setListo(true) })
    // Mientras se anota algo hay una sola entrada extra en el historial; el botón
    // "atrás" del celular retrocede un paso y, si quedan pasos, la vuelve a poner.
    const atras = () => {
      if (saltarPop.current) { saltarPop.current = false; return }
      const actual = pilaRef.current
      if (actual.length <= 1) return
      const nueva = actual.slice(0, -1)
      if (nueva.length > 1) history.pushState({ flujo: true }, '')
      fijarPila(nueva, 'atras')
    }
    addEventListener('popstate', atras)
    return () => removeEventListener('popstate', atras)
  }, [])

  function fijarPila(nueva, sentido) { pilaRef.current = nueva; setDir(sentido); setPila(nueva) }
  const ir = (p) => {
    if (pilaRef.current.length === 1) history.pushState({ flujo: true }, '')
    fijarPila([...pilaRef.current, p], 'adelante')
  }
  const volver = () => history.back()
  const alInicio = () => {
    if (pilaRef.current.length > 1) { saltarPop.current = true; history.back() }
    fijarPila(['inicio'], 'atras')
  }
  const terminar = (pantalla) => fijarPila(['inicio', pantalla], 'adelante')

  const mostrarAviso = (texto) => {
    setAviso(texto)
    clearTimeout(avisoTimer.current)
    avisoTimer.current = setTimeout(() => setAviso(''), 2800)
  }

  async function actualizar(cambios) {
    setDatos((d) => ({ ...d, ...cambios }))
    await Promise.all(Object.entries(cambios).map(([k, v]) => guardarLista(k, v)))
  }

  const elegirPersona = async (p) => { setYo(p); await guardarYo(p) }

  // ---------- Gasto ----------
  const elegirCategoria = (c) => {
    vibrar(10)
    setBg((b) => ({ ...b, categoria: c, digitos: '' }))
    ir(c.id === 'otros' ? 'g-detalle' : 'g-cuanto')
  }

  const guardarGasto = async (foto) => {
    const g = {
      id: nuevoId(), fecha: new Date().toISOString(), categoria: bg.categoria.id,
      nombre: bg.categoria.id === 'otros' ? bg.detalle.trim() : bg.categoria.nombre,
      valor: Number(bg.digitos), pagadoPor: yo, registradoPor: yo, foto: Boolean(foto)
    }
    if (foto) await guardarFoto(g.id, foto)
    await actualizar({ gastos: [g, ...datos.gastos] })
    setUltimo({ tipo: 'gasto', id: g.id }); vibrar(30); terminar('g-listo')
  }

  const borrarGasto = async (id) => {
    const g = datos.gastos.find((x) => x.id === id)
    await actualizar({ gastos: datos.gastos.filter((x) => x.id !== id) })
    if (g?.foto) await borrarFoto(id)
  }

  // ---------- Trabajo ----------
  const empezarTrabajo = () => {
    if (!CONDUCTORES.includes(yo)) return ir('trabajados')
    setBt(borradorTrabajo()); ir('t-cliente')
  }
  const crearCliente = async (nombre) => {
    const existente = datos.clientes.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase())
    const c = existente ?? { id: nuevoId(), nombre, vereda: '', color: datos.clientes.length % COLORES_CLIENTE.length }
    if (!existente) await actualizar({ clientes: [c, ...datos.clientes] })
    setBt((b) => ({ ...b, cliente: c })); ir('t-vereda')
  }
  const veredas = [...new Set([...datos.clientes.map((c) => c.vereda), ...datos.trabajos.map((t) => t.vereda)].filter(Boolean))]
  const elegirVereda = (v) => { setBt((b) => ({ ...b, vereda: v, idx: b.labores.length })); ir('t-labor') }
  const elegirLabor = (tipo) => { setBt((b) => ({ ...b, tipo })); ir(labor(tipo).porHora ? 't-tiempo' : 't-bultos') }
  const laborLista = (l) => {
    setBt((b) => { const labores = [...b.labores]; labores[b.idx] = l; return { ...b, labores } })
    ir('t-otra')
  }
  const otraLabor = () => { setBt((b) => ({ ...b, idx: b.labores.length })); ir('t-labor') }

  const trabajoEnCurso = () => ({ cliente: bt.cliente, vereda: bt.vereda, labores: bt.labores, acpmCliente: Number(bt.acpm || 0) })

  const guardarTrabajo = async () => {
    const ahora = new Date().toISOString()
    const t = {
      id: nuevoId(), fecha: ahora, clienteId: bt.cliente.id, clienteNombre: bt.cliente.nombre, vereda: bt.vereda,
      conductor: yo, labores: bt.labores, acpmCliente: Number(bt.acpm || 0), registradoPor: yo
    }
    const pago = Number(bt.pago || 0)
    const cambios = {
      trabajos: [t, ...datos.trabajos],
      clientes: datos.clientes.map((c) => c.id === t.clienteId ? { ...c, vereda: t.vereda || c.vereda, uso: ahora } : c)
        .sort((a, b) => (b.uso ?? '').localeCompare(a.uso ?? ''))
    }
    if (pago > 0) {
      cambios.cobros = [{ id: nuevoId(), fecha: ahora, clienteId: t.clienteId, clienteNombre: t.clienteNombre, valor: pago, recibio: yo, trabajoId: t.id, registradoPor: yo }, ...datos.cobros]
    }
    await actualizar(cambios)
    setUltimo({ tipo: 'trabajo', id: t.id }); vibrar(30); terminar('t-listo')
  }

  const borrarTrabajo = async (id) => {
    await actualizar({ trabajos: datos.trabajos.filter((t) => t.id !== id), cobros: datos.cobros.filter((c) => c.trabajoId !== id) })
  }

  // ---------- Registros ----------
  const registros = [
    ...datos.gastos.map((r) => ({ tipo: 'gasto', r })),
    ...datos.trabajos.map((r) => ({ tipo: 'trabajo', r })),
    ...datos.cobros.map((r) => ({ tipo: 'cobro', r }))
  ].sort((a, b) => b.r.fecha.localeCompare(a.r.fecha))

  const abrir = (tipo, id) => { vibrar(8); setAbierto({ tipo, id }); ir('recibo') }
  const buscar = (tipo, id) => ({ gasto: datos.gastos, trabajo: datos.trabajos, cobro: datos.cobros })[tipo]?.find((x) => x.id === id)

  const deshacer = async () => {
    if (ultimo.tipo === 'gasto') await borrarGasto(ultimo.id)
    else await borrarTrabajo(ultimo.id)
    alInicio(); mostrarAviso(ultimo.tipo === 'gasto' ? 'Se borró el gasto' : 'Se borró el trabajo')
  }
  const borrarDesdeRecibo = async (tipo, id) => {
    if (tipo === 'gasto') await borrarGasto(id)
    else await borrarTrabajo(id)
    volver(); mostrarAviso(tipo === 'gasto' ? 'Se borró el gasto' : 'Se borró el trabajo')
  }

  if (!listo) return <div class="app" />
  if (!yo) return <div class="app"><Quien onElegir={elegirPersona} /></div>

  const pasosGasto = bg.categoria?.id === 'otros' ? 4 : 3
  const reg = abierto && buscar(abierto.tipo, abierto.id)
  const ult = ultimo && buscar(ultimo.tipo, ultimo.id)
  let pantalla = pila[pila.length - 1]
  const faltaGasto = pantalla.startsWith('g-') && !['g-listo', 'g-categoria'].includes(pantalla) && !bg.categoria
  const faltaTrabajo = pantalla.startsWith('t-') && !['t-cliente', 't-nuevo', 't-listo'].includes(pantalla) && !bt.cliente
  if (faltaGasto || faltaTrabajo || (pantalla.endsWith('-listo') && !ult) || (pantalla === 'recibo' && !reg)) pantalla = 'inicio'

  const cli = bt.cliente
  const enCurso = trabajoEnCurso()
  let vista
  switch (pantalla) {
    case 'inicio': vista = (
      <Inicio yo={yo} registros={registros} clientes={datos.clientes} trabajos={datos.trabajos} onHoras={() => ir('horas')} onAbrir={abrir} onVerTodo={() => ir('historial')} onCambiar={() => elegirPersona(null)}
        onAccion={(a) => {
          if (a === 'gasto') { setBg(borradorGasto()); ir('g-categoria') }
          else if (a === 'trabajo') empezarTrabajo()
          else mostrarAviso(`${ACCIONES.find((x) => x.id === a).nombre} llega en la próxima versión`)
        }} />
    ); break
    case 'trabajados': vista = <Trabajados trabajos={datos.trabajos} clientes={datos.clientes} filtro={filtroConductor} onFiltro={setFiltroConductor} onVolver={volver} onAbrir={abrir} onHoras={() => ir('horas')} />; break
    case 'horas': vista = <Horas yo={yo} trabajos={datos.trabajos} clientes={datos.clientes} elegido={conductorHoras} onElegir={setConductorHoras} onVolver={volver} onAbrir={abrir} />; break
    case 'historial': vista = <Historial registros={registros} clientes={datos.clientes} filtro={filtro} onFiltro={setFiltro} onVolver={volver} onAbrir={abrir} />; break
    case 'recibo':
      if (abierto.tipo === 'gasto') vista = <ReciboGasto gasto={reg} yo={yo} onVolver={volver} onBorrar={(id) => borrarDesdeRecibo('gasto', id)} />
      else if (abierto.tipo === 'trabajo') vista = <ReciboTrabajo t={reg} cliente={datos.clientes.find((c) => c.id === reg.clienteId)} cobro={datos.cobros.find((c) => c.trabajoId === reg.id)} yo={yo} onVolver={volver} onBorrar={(id) => borrarDesdeRecibo('trabajo', id)} />
      else vista = <ReciboCobro c={reg} cliente={datos.clientes.find((c) => c.id === reg.clienteId)} onVolver={volver} onVerTrabajo={() => abrir('trabajo', reg.trabajoId)} />
      break

    case 'g-categoria': vista = <Categoria pasos={pasosGasto} onVolver={volver} onElegir={elegirCategoria} />; break
    case 'g-detalle': vista = <Detalle valor={bg.detalle} onCambio={(t) => setBg((b) => ({ ...b, detalle: t }))} onVolver={volver} onSiguiente={() => ir('g-cuanto')} />; break
    case 'g-cuanto': vista = (
      <Cuanto categoria={bg.categoria} detalle={bg.detalle} digitos={bg.digitos} paso={pasosGasto - 1} pasos={pasosGasto}
        onDigitos={(d) => setBg((b) => ({ ...b, digitos: d }))} onVolver={volver} onSiguiente={() => ir('g-foto')} />
    ); break
    case 'g-foto': vista = <Foto paso={pasosGasto} pasos={pasosGasto} onVolver={volver} onGuardar={guardarGasto} />; break
    case 'g-listo': vista = <ListoGasto gasto={ult} yo={yo} onInicio={alInicio} onDeshacer={deshacer} />; break

    case 't-cliente': vista = <ElegirCliente clientes={datos.clientes} onVolver={volver} onNuevo={() => ir('t-nuevo')} onElegir={(c) => { setBt((b) => ({ ...b, cliente: c })); ir('t-vereda') }} />; break
    case 't-nuevo': vista = <ClienteNuevo onVolver={volver} onCrear={crearCliente} />; break
    case 't-vereda': vista = <ElegirVereda cliente={cli} veredas={veredas} onVolver={volver} onElegir={elegirVereda} />; break
    case 't-labor': vista = <ElegirLabor cliente={cli} onVolver={volver} onElegir={elegirLabor} />; break
    case 't-tiempo': vista = <Tiempo cliente={cli} tipo={bt.tipo} inicial={bt.labores[bt.idx]?.tipo === bt.tipo ? bt.labores[bt.idx] : null} onVolver={volver} onListo={laborLista} />; break
    case 't-bultos': vista = <Bultos cliente={cli} inicial={bt.labores[bt.idx]?.tipo === 'remolcada' ? bt.labores[bt.idx] : null} onVolver={volver} onListo={laborLista} />; break
    case 't-otra': vista = (
      <Pregunta cliente={cli} pregunta={`¿Hizo otra labor para ${cli.nombre} hoy?`} si="agregar otra" no="seguir" iconoSi="plus-bold"
        onVolver={volver} onSi={otraLabor} onNo={() => ir('t-acpm')} />
    ); break
    case 't-acpm': vista = (
      <Pregunta cliente={cli} pregunta={`¿${cli.nombre} puso ACPM?`} si="anotar cuánto" no="lo puso el tractor" iconoSi="gas-pump-duotone"
        onVolver={volver} onSi={() => ir('t-acpm-valor')} onNo={() => { setBt((b) => ({ ...b, acpm: '' })); ir('t-pago') }} />
    ); break
    case 't-acpm-valor': vista = (
      <Valor cliente={cli} pregunta="¿Cuánto ACPM puso?" digitos={bt.acpm} atajos={[50000, 80000, 100000]}
        onDigitos={(d) => setBt((b) => ({ ...b, acpm: d }))} onVolver={volver} onListo={() => ir('t-pago')} />
    ); break
    case 't-pago': vista = (
      <Pregunta cliente={cli} pregunta={`¿${cli.nombre} le pagó algo?`} si="anotar cuánto" no="quedó debiendo" iconoSi="hand-coins-duotone"
        onVolver={volver} onSi={() => ir('t-pago-valor')} onNo={() => { setBt((b) => ({ ...b, pago: '' })); ir('t-resumen') }} />
    ); break
    case 't-pago-valor': {
      const total = totalTrabajo(enCurso)
      vista = (
        <Valor cliente={cli} pregunta="¿Cuánto le pagó?" digitos={bt.pago} atajos={total > 0 ? [total] : []}
          etiqueta={(v) => `Todo · ${plata(v)}`} onDigitos={(d) => setBt((b) => ({ ...b, pago: d }))} onVolver={volver} onListo={() => ir('t-resumen')} />
      ); break
    }
    case 't-resumen': vista = <Resumen t={enCurso} pago={Number(bt.pago || 0)} onVolver={volver} onGuardar={guardarTrabajo} />; break
    case 't-listo': vista = (
      <ListoTrabajo t={ult} pago={datos.cobros.find((c) => c.trabajoId === ult.id)?.valor ?? 0} onInicio={alInicio} onDeshacer={deshacer} />
    ); break
  }

  return (
    <div class="app">
      <div class={`pantalla entra-${dir}`} key={pila.length + pantalla}>{vista}</div>
      {aviso && <div class="aviso" role="status">{aviso}</div>}
    </div>
  )
}

function Quien({ onElegir }) {
  return (
    <main class="scr quien">
      <Icon name="user-circle-duotone" class="ic-xl tinta" />
      <h1 class="titulo">¿Quién usa este celular?</h1>
      <p class="sub">Así la app sabe quién anota cada cosa.</p>
      <div class="lista-grande">
        {PERSONAS.map((p) => <button type="button" class="opcion" onClick={() => onElegir(p)}>{p}</button>)}
      </div>
    </main>
  )
}

function Fila({ item, clientes = [], onAbrir }) {
  const { tipo, r } = item
  const cliente = r.clienteId && clientes.find((c) => c.id === r.clienteId)
  let icono, titulo, sub, valor, clase = ''
  if (tipo === 'gasto') {
    icono = categoria(r.categoria)?.icono ?? 'gas-pump-duotone'
    titulo = r.nombre; sub = `${r.pagadoPor} pagó · ${cuando(r.fecha)}`; valor = r.valor
  } else if (tipo === 'trabajo') {
    const l = r.labores[0]
    icono = 'tractor-duotone'
    titulo = r.clienteNombre
    sub = `${labor(l.tipo).nombre}${r.labores.length > 1 ? ` y ${r.labores.length - 1} más` : ` ${l.tipo === 'remolcada' ? `${l.bultos} bultos` : tiempo(l.minutos)}`} · ${r.conductor} · ${cuando(r.fecha)}`
    valor = totalTrabajo(r)
  } else {
    icono = 'hand-coins-duotone'; clase = ' ok'
    titulo = r.clienteNombre; sub = `Pagó · recibió ${r.recibio} · ${cuando(r.fecha)}`; valor = r.valor
  }
  return (
    <button type="button" class="row" onClick={() => onAbrir(tipo, r.id)}>
      {tipo === 'gasto'
        ? <span class="ic-caja"><Icon name={icono} class={`ic-s i-${tipo}`} /></span>
        : <Avatar cliente={cliente} nombre={r.clienteNombre} tam="s" insignia={icono} />}
      <span class="rt"><b>{titulo}</b><small>{sub}</small></span>
      <span class={`amt${clase}`}>{plata(valor)}</span>
      <Icon name="caret-right-bold" class="ic-xs flecha" />
    </button>
  )
}

function Inicio({ yo, registros, clientes, trabajos, onHoras, onAccion, onCambiar, onAbrir, onVerTodo }) {
  return (
    <main class="scr">
      <header class="top">
        <h1 class="hello">{saludo()}, {yo}</h1>
        <span class="date">{fechaLarga()} · <button type="button" class="link" onClick={onCambiar}>no soy {yo}</button></span>
      </header>
      <div class="tiles">
        {ACCIONES.map((a) => (
          <button type="button" class={`tile t-${a.id}`} onClick={() => { vibrar(10); onAccion(a.id) }}>
            <Icon name={a.icono} />
            <span class="tl">{a.nombre}</span>
            <span class="th">{a.id === 'trabajo' && !CONDUCTORES.includes(yo) ? 'ver lo trabajado' : a.pista}</span>
          </button>
        ))}
      </div>
      {CONDUCTORES.includes(yo) && <MisHorasRenglon cuenta={cuentaConductor(trabajos, yo)} onAbrir={onHoras} />}
      <section class="last">
        <h2 class="lh">Lo último que se anotó</h2>
        {registros.length === 0 && <p class="vacio">Todavía no hay nada. Toque <b>Gasto</b> o <b>Trabajo</b> para anotar el primero.</p>}
        {registros.slice(0, 3).map((it) => <Fila item={it} clientes={clientes} onAbrir={onAbrir} />)}
        {registros.length > 0 && (
          <button type="button" class="ver-todo" onClick={onVerTodo}>
            Ver todo{registros.length > 3 ? ` (${registros.length})` : ''} <Icon name="caret-right-bold" class="ic-xs" />
          </button>
        )}
      </section>
    </main>
  )
}

const RESUMEN_DIA = { gasto: 'Gastado', trabajo: 'Trabajado', cobro: 'Recibido' }

function Historial({ registros, clientes, filtro, onFiltro, onVolver, onAbrir }) {
  const lista = filtro === 'todo' ? registros : registros.filter((x) => x.tipo === filtro)
  const dias = []
  for (const it of lista) {
    const clave = new Date(it.r.fecha).toDateString()
    let dia = dias.find((d) => d.clave === clave)
    if (!dia) { dia = { clave, nombre: nombreDia(it.r.fecha), total: 0, items: [] }; dias.push(dia) }
    dia.items.push(it)
    dia.total += it.tipo === 'trabajo' ? totalTrabajo(it.r) : it.r.valor
  }
  return (
    <main class="scr">
      <Encabezado titulo="Todo lo anotado" onVolver={onVolver} />
      <div class="filtros">
        {FILTROS.map((f) => (
          <button type="button" class={`filtro f-${f.id}${filtro === f.id ? ' on' : ''}`} onClick={() => { vibrar(8); onFiltro(f.id) }}>{f.nombre}</button>
        ))}
      </div>
      {dias.length === 0 && <p class="vacio separado">No hay nada anotado aquí todavía.</p>}
      {dias.map((d) => (
        <section class="dia">
          <header class="dia-h"><h2>{d.nombre}</h2>{filtro !== 'todo' && <span>{RESUMEN_DIA[filtro]} <b>{plata(d.total)}</b></span>}</header>
          {d.items.map((it) => <Fila item={it} clientes={clientes} onAbrir={onAbrir} />)}
        </section>
      ))}
    </main>
  )
}

function ListoGasto({ gasto, yo, onInicio, onDeshacer }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <main class="scr done">
      <div class="badge"><Icon name="check-bold" class="ic-xl" /></div>
      <h1 class="ok-t">Quedó anotado</h1>
      <p class="sent">{yo}, usted pagó <b>{plata(gasto.valor)}</b> de <b>{gasto.nombre}</b> hoy.</p>
      <div class="sp" />
      <button type="button" class="primary" onClick={onInicio}>Volver al inicio</button>
      <button type="button" class="ghost" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="arrow-counter-clockwise-bold" class="ic-s" /> Deshacer</button>
      {confirmando && <ConfirmarBorrado onSi={onDeshacer} onNo={() => setConfirmando(false)} />}
    </main>
  )
}
