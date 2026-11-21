import { useEffect, useRef, useState } from 'preact/hooks'
import { Icon } from './Icon.jsx'
import { Barra, Monto, Teclado, Atajos, SiNo, ConfirmarBorrado, vibrar } from './comunes.jsx'
import { plata } from './formato.js'
import { Recibo } from './recibo.jsx'
import { comprimir } from './foto.js'

export const CATEGORIAS = [
  { id: 'acpm', nombre: 'ACPM', icono: 'gas-pump-duotone', atajos: [50000, 80000, 100000] },
  { id: 'repuestos', nombre: 'Repuestos', icono: 'wrench-duotone', atajos: [50000, 100000, 200000] },
  { id: 'aceite', nombre: 'Aceite', icono: 'drop-duotone', atajos: [30000, 60000, 100000] },
  { id: 'otros', nombre: 'Otros', icono: 'dots-three-circle-duotone', atajos: [20000, 50000, 100000] }
]
export const categoria = (id) => CATEGORIAS.find((c) => c.id === id)

export function Categoria({ pasos, onVolver, onElegir }) {
  return (
    <main class="scr">
      <Barra titulo={<b>Gasto</b>} paso={1} pasos={pasos} onVolver={onVolver} />
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

export function Detalle({ valor, onCambio, onVolver, onSiguiente }) {
  const listo = valor.trim().length > 1
  return (
    <main class="scr">
      <Barra titulo={<>Gasto · <b>Otros</b></>} paso={2} pasos={4} onVolver={onVolver} />
      <h1 class="q">¿En qué gastó?</h1>
      <input class="campo" type="text" value={valor} enterkeyhint="next" autocapitalize="sentences"
        placeholder="Ej.: llanta, filtro, soldadura" onInput={(e) => onCambio(e.currentTarget.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && listo) onSiguiente() }} />
      <p class="pista">Si no quiere escribir, toque el micrófono del teclado y dígalo.</p>
      <button type="button" class="primary" disabled={!listo} onClick={onSiguiente}>Siguiente</button>
    </main>
  )
}

export function Cuanto({ categoria, detalle, digitos, paso, pasos, onDigitos, onVolver, onSiguiente }) {
  const valor = Number(digitos || 0)
  const nombre = categoria.id === 'otros' ? detalle.trim() : categoria.nombre
  return (
    <main class="scr">
      <Barra titulo={<>Gasto · <b>{nombre}</b></>} paso={paso} pasos={pasos} onVolver={onVolver} />
      <h1 class="q">¿Cuánto fue?</h1>
      <Monto valor={valor} />
      <Atajos valores={categoria.atajos} actual={valor} onElegir={(a) => onDigitos(a ? String(a) : '')} />
      <Teclado digitos={digitos} onDigitos={onDigitos} />
      <button type="button" class="primary" disabled={!valor} onClick={onSiguiente}>Siguiente</button>
    </main>
  )
}

export function Foto({ paso, pasos, onVolver, onGuardar }) {
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
      <Barra titulo={<b>Gasto</b>} paso={paso} pasos={pasos} onVolver={onVolver} />
      <h1 class="q">¿Tiene foto de la factura?</h1>
      <input ref={entrada} type="file" accept="image/*" capture="environment" hidden onChange={alElegir} />
      {foto ? (
        <>
          <img class="vista-foto" src={url} alt="Foto de la factura" />
          <button type="button" class="ghost" onClick={tomar}><Icon name="camera-duotone" class="ic-s" /> Tomar otra</button>
          <button type="button" class="primary" disabled={estado === 'Guardando…'} onClick={() => guardar(true)}>Guardar</button>
        </>
      ) : (
        <SiNo si="tomar foto" no="guardar sin foto" iconoSi="camera-duotone" deshabilitado={Boolean(estado)}
          onSi={tomar} onNo={() => guardar(false)} />
      )}
      {estado && <p class="pista" role="status">{estado}</p>}
    </main>
  )
}

export function ReciboGasto({ gasto, yo, onVolver, onBorrar }) {
  const cat = categoria(gasto.categoria)
  return (
    <Recibo tipo="Gasto" color="gasto" que="este gasto" yo={yo} onVolver={onVolver} onBorrar={() => onBorrar(gasto.id)}
      figura={<span class="burbuja"><Icon name={cat?.icono ?? 'receipt-duotone'} /></span>}
      titulo={gasto.nombre} sub={cat?.id === 'otros' ? 'Otros' : null} valor={gasto.valor}
      filas={[['Quién pagó', gasto.pagadoPor]]}
      fecha={gasto.fecha} autor={gasto.registradoPor ?? gasto.pagadoPor} fotoId={gasto.foto ? gasto.id : null} />
  )
}
