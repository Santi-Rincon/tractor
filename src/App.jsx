import { useEffect, useRef, useState } from 'preact/hooks'
import { Icon } from './Icon.jsx'
import { cargar, guardarGastos, guardarYo } from './store.js'
import { plata, fechaLarga, saludo, cuando } from './formato.js'

const PERSONAS = ['Papá', 'Padrino', 'Leo']

const CATEGORIAS = [
  { id: 'acpm', nombre: 'ACPM', icono: 'gas-pump-duotone', atajos: [50000, 80000, 100000] },
  { id: 'repuestos', nombre: 'Repuestos', icono: 'wrench-duotone', atajos: [50000, 100000, 200000] },
  { id: 'aceite', nombre: 'Aceite', icono: 'drop-duotone', atajos: [30000, 60000, 100000] },
  { id: 'otros', nombre: 'Otros', icono: 'dots-three-circle-duotone', atajos: [20000, 50000, 100000] }
]

const ACCIONES = [
  { id: 'trabajo', nombre: 'Trabajo', pista: 'lo que se hizo hoy', icono: 'tractor-duotone' },
  { id: 'gasto', nombre: 'Gasto', pista: 'ACPM, repuestos…', icono: 'gas-pump-duotone' },
  { id: 'plata', nombre: 'Plata', pista: 'cobros y entregas', icono: 'hand-coins-duotone' },
  { id: 'agenda', nombre: 'Agenda', pista: 'apartar un día', icono: 'calendar-dots-duotone' }
]

const MAX_DIGITOS = 9
const vibrar = (ms) => { try { navigator.vibrate?.(ms) } catch {} }
const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const mil = (n) => `${n / 1000} mil`

export function App() {
  const [listo, setListo] = useState(false)
  const [yo, setYo] = useState(null)
  const [gastos, setGastos] = useState([])
  const [pila, setPila] = useState(['inicio'])
  const pilaRef = useRef(pila)
  const saltarPop = useRef(false)
  const [dir, setDir] = useState('adelante')
  const [borrador, setBorrador] = useState({ categoria: null, detalle: '', digitos: '' })
  const [ultimo, setUltimo] = useState(null)
  const [aviso, setAviso] = useState('')
  const avisoTimer = useRef()

  useEffect(() => {
    cargar().then(({ yo, gastos }) => { setYo(yo); setGastos(gastos); setListo(true) })
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

  const mostrarAviso = (texto) => {
    setAviso(texto)
    clearTimeout(avisoTimer.current)
    avisoTimer.current = setTimeout(() => setAviso(''), 2600)
  }

  const elegirPersona = async (p) => { setYo(p); await guardarYo(p) }

  const empezarGasto = () => { setBorrador({ categoria: null, detalle: '', digitos: '' }); ir('categoria') }

  const elegirCategoria = (c) => {
    vibrar(10)
    setBorrador((b) => ({ ...b, categoria: c, digitos: '' }))
    ir(c.id === 'otros' ? 'detalle' : 'cuanto')
  }

  const guardar = async () => {
    const g = {
      id: nuevoId(),
      fecha: new Date().toISOString(),
      categoria: borrador.categoria.id,
      nombre: borrador.categoria.id === 'otros' ? borrador.detalle.trim() : borrador.categoria.nombre,
      valor: Number(borrador.digitos),
      pagadoPor: yo
    }
    const nuevos = [g, ...gastos]
    setGastos(nuevos); setUltimo(g)
    await guardarGastos(nuevos)
    vibrar(30)
    fijarPila(['inicio', 'listo'], 'adelante')
  }

  const deshacer = async () => {
    const nuevos = gastos.filter((g) => g.id !== ultimo.id)
    setGastos(nuevos); await guardarGastos(nuevos)
    alInicio(); mostrarAviso('Se borró el gasto')
  }

  if (!listo) return <div class="app" />
  if (!yo) return <div class="app"><Quien onElegir={elegirPersona} /></div>

  const pasos = borrador.categoria?.id === 'otros' ? 3 : 2
  let pantalla = pila[pila.length - 1]
  if ((pantalla === 'cuanto' && !borrador.categoria) || (pantalla === 'listo' && !ultimo)) pantalla = 'inicio'
  let vista
  if (pantalla === 'inicio') vista = (
    <Inicio yo={yo} gastos={gastos}
      onAccion={(a) => a === 'gasto' ? empezarGasto() : mostrarAviso(`${ACCIONES.find((x) => x.id === a).nombre} llega en la próxima versión`)}
      onCambiar={() => elegirPersona(null)} />
  )
  else if (pantalla === 'categoria') vista = <Categoria pasos={pasos} onVolver={volver} onElegir={elegirCategoria} />
  else if (pantalla === 'detalle') vista = (
    <Detalle valor={borrador.detalle} onCambio={(t) => setBorrador((b) => ({ ...b, detalle: t }))}
      onVolver={volver} onSiguiente={() => ir('cuanto')} />
  )
  else if (pantalla === 'cuanto' && borrador.categoria) vista = (
    <Cuanto categoria={borrador.categoria} detalle={borrador.detalle} digitos={borrador.digitos} paso={pasos} pasos={pasos}
      onDigitos={(d) => setBorrador((b) => ({ ...b, digitos: d }))} onVolver={volver} onGuardar={guardar} />
  )
  else if (pantalla === 'listo') vista = <Listo gasto={ultimo} yo={yo} onInicio={alInicio} onDeshacer={deshacer} />

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

function Inicio({ yo, gastos, onAccion, onCambiar }) {
  const recientes = gastos.slice(0, 3)
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
            <span class="th">{a.pista}</span>
          </button>
        ))}
      </div>
      <section class="last">
        <h2 class="lh">Lo último que se anotó</h2>
        {recientes.length === 0 && <p class="vacio">Todavía no hay nada. Toque <b>Gasto</b> para anotar el primero.</p>}
        {recientes.map((g) => {
          const cat = CATEGORIAS.find((c) => c.id === g.categoria)
          return (
            <div class="row">
              <Icon name={cat?.icono ?? 'gas-pump-duotone'} class="ic-s gasto" />
              <span class="rt"><b>{g.nombre}</b><small>{g.pagadoPor} · {cuando(g.fecha)}</small></span>
              <span class="amt">{plata(g.valor)}</span>
            </div>
          )
        })}
      </section>
    </main>
  )
}

function Barra({ titulo, paso, pasos, onVolver, progreso }) {
  return (
    <>
      <div class="bar">
        <button type="button" class="back" onClick={onVolver} aria-label="Volver"><Icon name="arrow-left-bold" class="ic-s" /></button>
        <span class="crumb">{titulo}</span>
        <span class="step">{paso} de {pasos}</span>
      </div>
      <div class="prog"><i style={{ width: `${progreso * 100}%` }} /></div>
    </>
  )
}

function Categoria({ pasos, onVolver, onElegir }) {
  return (
    <main class="scr">
      <Barra titulo={<b>Gasto</b>} paso={1} pasos={pasos} progreso={1 / (pasos + 1)} onVolver={onVolver} />
      <h1 class="q">¿Qué gastó?</h1>
      <div class="lista-grande">
        {CATEGORIAS.map((c) => (
          <button type="button" class="opcion con-icono" onClick={() => onElegir(c)}>
            <span class="burbuja"><Icon name={c.icono} /></span>{c.nombre}
          </button>
        ))}
      </div>
    </main>
  )
}

function Detalle({ valor, onCambio, onVolver, onSiguiente }) {
  const listo = valor.trim().length > 1
  return (
    <main class="scr">
      <Barra titulo={<>Gasto · <b>Otros</b></>} paso={2} pasos={3} progreso={2 / 4} onVolver={onVolver} />
      <h1 class="q">¿En qué gastó?</h1>
      <input class="campo" type="text" value={valor} enterkeyhint="next" autocapitalize="sentences"
        placeholder="Ej.: llanta, filtro, soldadura" onInput={(e) => onCambio(e.currentTarget.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && listo) onSiguiente() }} />
      <p class="pista">Si no quiere escribir, toque el micrófono del teclado y dígalo.</p>
      <button type="button" class="primary" disabled={!listo} onClick={onSiguiente}>Siguiente</button>
    </main>
  )
}

function Cuanto({ categoria, detalle, digitos, paso, pasos, onDigitos, onVolver, onGuardar }) {
  const valor = Number(digitos || 0)
  const tecla = (k) => {
    vibrar(8)
    if (k === 'borrar') return onDigitos(digitos.slice(0, -1))
    const siguiente = (digitos + k).replace(/^0+/, '')
    if (siguiente.length <= MAX_DIGITOS) onDigitos(siguiente)
  }
  const nombre = categoria.id === 'otros' ? detalle.trim() : categoria.nombre
  return (
    <main class="scr">
      <Barra titulo={<>Gasto · <b>{nombre}</b></>} paso={paso} pasos={pasos} progreso={paso / (pasos + 1)} onVolver={onVolver} />
      <h1 class="q">¿Cuánto fue?</h1>
      <div class={`disp${valor ? '' : ' cero'}`} aria-live="polite"><span class="cur">$</span>{plata(valor)}</div>
      <div class="chips">
        {categoria.atajos.map((a) => (
          <button type="button" class={`chip${valor === a ? ' on' : ''}`} onClick={() => { vibrar(8); onDigitos(String(a)) }}>{mil(a)}</button>
        ))}
      </div>
      <div class="pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0'].map((k) => (
          <button type="button" class="key" onClick={() => tecla(k)}>{k}</button>
        ))}
        <button type="button" class="key" aria-label="Borrar" onClick={() => tecla('borrar')}><Icon name="backspace-duotone" class="ic-s" /></button>
      </div>
      <button type="button" class="primary" disabled={!valor} onClick={onGuardar}>Guardar</button>
    </main>
  )
}

function Listo({ gasto, yo, onInicio, onDeshacer }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <main class="scr done">
      <div class="badge"><Icon name="check-bold" class="ic-xl" /></div>
      <h1 class="ok-t">Quedó anotado</h1>
      <p class="sent">{yo}, usted pagó <b>{plata(gasto.valor)}</b> de <b>{gasto.nombre}</b> hoy.</p>
      <div class="sp" />
      {confirmando ? (
        <div class="confirma" role="alertdialog" aria-label="Confirmar borrado">
          <p>¿Seguro que quiere borrar este gasto?</p>
          <button type="button" class="primary peligro" onClick={onDeshacer}>Sí, borrarlo</button>
          <button type="button" class="ghost" onClick={() => setConfirmando(false)}>No, dejarlo</button>
        </div>
      ) : (
        <>
          <button type="button" class="primary" onClick={onInicio}>Volver al inicio</button>
          <button type="button" class="ghost" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="arrow-counter-clockwise-bold" class="ic-s" /> Deshacer</button>
        </>
      )}
    </main>
  )
}
