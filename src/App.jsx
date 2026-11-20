import { useEffect, useRef, useState } from 'preact/hooks'
import { Icon } from './Icon.jsx'
import { cargar, guardarGastos, guardarYo, guardarFoto, leerFoto, borrarFoto } from './store.js'
import { plata, fechaLarga, saludo, cuando, hora, nombreDia } from './formato.js'
import { comprimir } from './foto.js'

export const PERSONAS = ['Santiago', 'Raúl', 'Leo']

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
  const [abierto, setAbierto] = useState(null)
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

  const guardar = async (foto) => {
    const g = {
      id: nuevoId(),
      fecha: new Date().toISOString(),
      categoria: borrador.categoria.id,
      nombre: borrador.categoria.id === 'otros' ? borrador.detalle.trim() : borrador.categoria.nombre,
      valor: Number(borrador.digitos),
      pagadoPor: yo,
      registradoPor: yo,
      foto: Boolean(foto)
    }
    if (foto) await guardarFoto(g.id, foto)
    const nuevos = [g, ...gastos]
    setGastos(nuevos); setUltimo(g)
    await guardarGastos(nuevos)
    vibrar(30)
    fijarPila(['inicio', 'listo'], 'adelante')
  }

  const borrarGasto = async (id) => {
    const g = gastos.find((x) => x.id === id)
    const nuevos = gastos.filter((x) => x.id !== id)
    setGastos(nuevos); await guardarGastos(nuevos)
    if (g?.foto) await borrarFoto(id)
  }

  const deshacer = async () => {
    await borrarGasto(ultimo.id)
    alInicio(); mostrarAviso('Se borró el gasto')
  }

  const abrir = (id) => { vibrar(8); setAbierto(id); ir('recibo') }
  const borrarDesdeRecibo = async (id) => {
    await borrarGasto(id)
    volver(); mostrarAviso('Se borró el gasto')
  }

  if (!listo) return <div class="app" />
  if (!yo) return <div class="app"><Quien onElegir={elegirPersona} /></div>

  const pasos = borrador.categoria?.id === 'otros' ? 4 : 3
  const gastoAbierto = gastos.find((g) => g.id === abierto)
  let pantalla = pila[pila.length - 1]
  if ((['cuanto', 'foto'].includes(pantalla) && !borrador.categoria) || (pantalla === 'listo' && !ultimo) || (pantalla === 'recibo' && !gastoAbierto)) pantalla = 'inicio'
  let vista
  if (pantalla === 'inicio') vista = (
    <Inicio yo={yo} gastos={gastos} onAbrir={abrir} onVerTodo={() => ir('historial')}
      onAccion={(a) => a === 'gasto' ? empezarGasto() : mostrarAviso(`${ACCIONES.find((x) => x.id === a).nombre} llega en la próxima versión`)}
      onCambiar={() => elegirPersona(null)} />
  )
  else if (pantalla === 'categoria') vista = <Categoria pasos={pasos} onVolver={volver} onElegir={elegirCategoria} />
  else if (pantalla === 'detalle') vista = (
    <Detalle valor={borrador.detalle} onCambio={(t) => setBorrador((b) => ({ ...b, detalle: t }))}
      onVolver={volver} onSiguiente={() => ir('cuanto')} />
  )
  else if (pantalla === 'cuanto' && borrador.categoria) vista = (
    <Cuanto categoria={borrador.categoria} detalle={borrador.detalle} digitos={borrador.digitos} paso={pasos - 1} pasos={pasos}
      onDigitos={(d) => setBorrador((b) => ({ ...b, digitos: d }))} onVolver={volver} onSiguiente={() => ir('foto')} />
  )
  else if (pantalla === 'foto') vista = <Foto paso={pasos} pasos={pasos} onVolver={volver} onGuardar={guardar} />
  else if (pantalla === 'historial') vista = <Historial gastos={gastos} onVolver={volver} onAbrir={abrir} />
  else if (pantalla === 'recibo') vista = <Recibo gasto={gastoAbierto} yo={yo} onVolver={volver} onBorrar={borrarDesdeRecibo} />
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

function Fila({ g, onAbrir }) {
  const cat = CATEGORIAS.find((c) => c.id === g.categoria)
  return (
    <button type="button" class="row" onClick={() => onAbrir(g.id)}>
      <Icon name={cat?.icono ?? 'gas-pump-duotone'} class="ic-s gasto" />
      <span class="rt"><b>{g.nombre}</b><small>{g.pagadoPor} · {cuando(g.fecha)}</small></span>
      <span class="amt">{plata(g.valor)}</span>
      <Icon name="caret-right-bold" class="ic-xs flecha" />
    </button>
  )
}

function Inicio({ yo, gastos, onAccion, onCambiar, onAbrir, onVerTodo }) {
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
        {recientes.map((g) => <Fila g={g} onAbrir={onAbrir} />)}
        {gastos.length > 0 && (
          <button type="button" class="ver-todo" onClick={onVerTodo}>
            Ver todo{gastos.length > 3 ? ` (${gastos.length})` : ''} <Icon name="caret-right-bold" class="ic-xs" />
          </button>
        )}
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
      <Barra titulo={<>Gasto · <b>Otros</b></>} paso={2} pasos={4} progreso={2 / 5} onVolver={onVolver} />
      <h1 class="q">¿En qué gastó?</h1>
      <input class="campo" type="text" value={valor} enterkeyhint="next" autocapitalize="sentences"
        placeholder="Ej.: llanta, filtro, soldadura" onInput={(e) => onCambio(e.currentTarget.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && listo) onSiguiente() }} />
      <p class="pista">Si no quiere escribir, toque el micrófono del teclado y dígalo.</p>
      <button type="button" class="primary" disabled={!listo} onClick={onSiguiente}>Siguiente</button>
    </main>
  )
}

function Cuanto({ categoria, detalle, digitos, paso, pasos, onDigitos, onVolver, onSiguiente }) {
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
      <button type="button" class="primary" disabled={!valor} onClick={onSiguiente}>Siguiente</button>
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
      <button type="button" class="primary" onClick={onInicio}>Volver al inicio</button>
      <button type="button" class="ghost" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="arrow-counter-clockwise-bold" class="ic-s" /> Deshacer</button>
      {confirmando && <ConfirmarBorrado onSi={onDeshacer} onNo={() => setConfirmando(false)} />}
    </main>
  )
}

function Foto({ paso, pasos, onVolver, onGuardar }) {
  const [foto, setFoto] = useState(null)
  const [url, setUrl] = useState('')
  const [estado, setEstado] = useState('')
  const entrada = useRef()
  useEffect(() => () => url && URL.revokeObjectURL(url), [url])

  const alElegir = async (e) => {
    const archivo = e.currentTarget.files?.[0]
    e.currentTarget.value = ''
    if (!archivo) return
    setEstado('Preparando la foto…')
    try {
      const blob = await comprimir(archivo)
      setFoto(blob); setUrl(URL.createObjectURL(blob)); setEstado('')
    } catch {
      setEstado('No se pudo leer la foto. Intente otra vez.')
    }
  }
  const guardar = async (conFoto) => { setEstado('Guardando…'); await onGuardar(conFoto ? foto : null) }
  const tomar = () => entrada.current.click()

  return (
    <main class="scr">
      <Barra titulo={<b>Gasto</b>} paso={paso} pasos={pasos} progreso={paso / (pasos + 1)} onVolver={onVolver} />
      <h1 class="q">¿Tiene foto de la factura?</h1>
      <input ref={entrada} type="file" accept="image/*" capture="environment" hidden onChange={alElegir} />
      {foto ? (
        <>
          <img class="vista-foto" src={url} alt="Foto de la factura" />
          <button type="button" class="ghost" onClick={tomar}><Icon name="camera-duotone" class="ic-s" /> Tomar otra</button>
          <button type="button" class="primary" disabled={estado === 'Guardando…'} onClick={() => guardar(true)}>Guardar</button>
        </>
      ) : (
        <div class="si-no">
          <button type="button" class="respuesta si" disabled={Boolean(estado)} onClick={tomar}>
            <Icon name="camera-duotone" class="ic-r" /><b>Sí</b><span>tomar foto</span>
          </button>
          <button type="button" class="respuesta no" disabled={Boolean(estado)} onClick={() => guardar(false)}>
            <Icon name="x-bold" class="ic-r" /><b>No</b><span>guardar sin foto</span>
          </button>
        </div>
      )}
      {estado && <p class="pista" role="status">{estado}</p>}
    </main>
  )
}

function Historial({ gastos, onVolver, onAbrir }) {
  const dias = []
  for (const g of gastos) {
    const clave = new Date(g.fecha).toDateString()
    let dia = dias.find((d) => d.clave === clave)
    if (!dia) { dia = { clave, nombre: nombreDia(g.fecha), total: 0, items: [] }; dias.push(dia) }
    dia.items.push(g); dia.total += g.valor
  }
  return (
    <main class="scr">
      <div class="bar">
        <button type="button" class="back" onClick={onVolver} aria-label="Volver"><Icon name="arrow-left-bold" class="ic-s" /></button>
        <span class="crumb"><b class="neutro">Todo lo anotado</b></span>
      </div>
      {dias.length === 0 && <p class="vacio separado">Todavía no hay nada anotado.</p>}
      {dias.map((d) => (
        <section class="dia">
          <header class="dia-h"><h2>{d.nombre}</h2><span>Gastado <b>{plata(d.total)}</b></span></header>
          {d.items.map((g) => <Fila g={g} onAbrir={onAbrir} />)}
        </section>
      ))}
    </main>
  )
}

function Recibo({ gasto, yo, onVolver, onBorrar }) {
  const [url, setUrl] = useState('')
  const [grande, setGrande] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const cat = CATEGORIAS.find((c) => c.id === gasto.categoria)
  const autor = gasto.registradoPor ?? gasto.pagadoPor
  useEffect(() => {
    let u = ''
    if (gasto.foto) leerFoto(gasto.id).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u) } })
    return () => u && URL.revokeObjectURL(u)
  }, [gasto.id])

  return (
    <main class="scr">
      <div class="bar">
        <button type="button" class="back" onClick={onVolver} aria-label="Volver"><Icon name="arrow-left-bold" class="ic-s" /></button>
        <span class="crumb"><b>Recibo de gasto</b></span>
      </div>
      <article class="recibo">
        <div class="r-top"><span class="burbuja"><Icon name={cat?.icono ?? 'receipt-duotone'} /></span><span class="r-tipo">{gasto.nombre}</span></div>
        <div class="r-valor"><span class="cur">$</span>{plata(gasto.valor)}</div>
        <dl class="r-filas">
          <div><dt>Qué</dt><dd>{cat?.id === 'otros' ? `Otros · ${gasto.nombre}` : gasto.nombre}</dd></div>
          <div><dt>Quién pagó</dt><dd>{gasto.pagadoPor}</dd></div>
          <div><dt>Fecha</dt><dd>{fechaLarga(new Date(gasto.fecha))}</dd></div>
          <div><dt>Hora</dt><dd>{hora(gasto.fecha)}</dd></div>
          <div><dt>Anotado por</dt><dd>{autor}</dd></div>
        </dl>
        {gasto.foto
          ? url && <button type="button" class="r-foto" onClick={() => setGrande(true)}><img src={url} alt="Foto de la factura" /><span>Toque para verla grande</span></button>
          : <p class="r-sin">Sin foto de la factura</p>}
      </article>
      <div class="sp" />
      {autor === yo
        ? <button type="button" class="ghost peligro-t" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="trash-bold" class="ic-s" /> Borrar este gasto</button>
        : <p class="pista centro">Solo {autor} puede borrarlo.</p>}
      {confirmando && <ConfirmarBorrado onSi={() => onBorrar(gasto.id)} onNo={() => setConfirmando(false)} />}
      {grande && (
        <button type="button" class="foto-grande" onClick={() => setGrande(false)} aria-label="Cerrar foto">
          <img src={url} alt="Foto de la factura" /><span class="cerrar"><Icon name="x-bold" class="ic-s" /> Cerrar</span>
        </button>
      )}
    </main>
  )
}

function ConfirmarBorrado({ onSi, onNo }) {
  return (
    <div class="velo" onClick={onNo}>
      <div class="hoja" role="alertdialog" aria-modal="true" aria-label="Confirmar borrado" onClick={(e) => e.stopPropagation()}>
        <Icon name="trash-bold" class="ic hoja-ic" />
        <p>¿Seguro que quiere borrar este gasto?</p>
        <div class="hoja-botones">
          <button type="button" class="boton no-borrar" onClick={onNo}>No, dejarlo</button>
          <button type="button" class="boton si-borrar" onClick={onSi}>Sí, borrar</button>
        </div>
      </div>
    </div>
  )
}
