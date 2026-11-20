import { Icon } from './Icon.jsx'
import { plata } from './formato.js'

export const vibrar = (ms) => { try { navigator.vibrate?.(ms) } catch {} }
export const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
export const mil = (n) => `${n / 1000} mil`
const MAX_DIGITOS = 9

export function Barra({ titulo, paso, pasos, onVolver, color = 'gasto' }) {
  return (
    <>
      <div class="bar">
        <button type="button" class="back" onClick={onVolver} aria-label="Volver"><Icon name="arrow-left-bold" class="ic-s" /></button>
        <span class={`crumb c-${color}`}>{titulo}</span>
        {pasos && <span class="step">{paso} de {pasos}</span>}
      </div>
      {pasos && <div class={`prog p-${color}`}><i style={{ width: `${(paso / (pasos + 1)) * 100}%` }} /></div>}
    </>
  )
}

export function Encabezado({ titulo, onVolver }) {
  return (
    <div class="bar">
      <button type="button" class="back" onClick={onVolver} aria-label="Volver"><Icon name="arrow-left-bold" class="ic-s" /></button>
      <span class="crumb"><b class="neutro">{titulo}</b></span>
    </div>
  )
}

export function Monto({ valor, unidad = '$', onLimpiar }) {
  return (
    <div class="monto">
      <div class={`disp${valor ? '' : ' cero'}`} aria-live="polite">
        {unidad === '$' && <span class="cur">$</span>}{plata(valor)}{unidad !== '$' && <span class="unidad"> {unidad}</span>}
      </div>
      {onLimpiar && valor > 0 && (
        <button type="button" class="limpiar" onClick={() => { vibrar(10); onLimpiar() }}>
          <Icon name="x-bold" class="ic-xs" /> Borrar todo
        </button>
      )}
    </div>
  )
}

export function Teclado({ digitos, onDigitos, sinMiles }) {
  const tecla = (k) => {
    vibrar(8)
    if (k === 'borrar') return onDigitos(digitos.slice(0, -1))
    const siguiente = (digitos + k).replace(/^0+/, '')
    if (siguiente.length <= MAX_DIGITOS) onDigitos(siguiente)
  }
  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', sinMiles ? '' : '000', '0']
  return (
    <div class="pad">
      {teclas.map((k) => k ? <button type="button" class="key" onClick={() => tecla(k)}>{k}</button> : <span />)}
      <button type="button" class="key" aria-label="Borrar" onClick={() => tecla('borrar')}><Icon name="backspace-duotone" class="ic-s" /></button>
    </div>
  )
}

// Tocar un atajo marcado lo desmarca y deja el valor en cero (salvo alternar={false}).
export function Atajos({ valores, actual, onElegir, etiqueta = mil, color = 'gasto', alternar = true }) {
  return (
    <div class="chips">
      {valores.map((a) => {
        const on = actual === a
        return (
          <button type="button" class={`chip ch-${color}${on ? ' on' : ''}`} aria-pressed={on}
            onClick={() => { vibrar(8); onElegir(on && alternar ? 0 : a) }}>{etiqueta(a)}</button>
        )
      })}
    </div>
  )
}

export function SiNo({ si, no, iconoSi = 'check-bold', color = 'gasto', onSi, onNo, deshabilitado }) {
  return (
    <div class="si-no">
      <button type="button" class={`respuesta si r-${color}`} disabled={deshabilitado} onClick={() => { vibrar(10); onSi() }}>
        <Icon name={iconoSi} class="ic-r" /><b>Sí</b><span>{si}</span>
      </button>
      <button type="button" class="respuesta no" disabled={deshabilitado} onClick={() => { vibrar(10); onNo() }}>
        <Icon name="x-bold" class="ic-r" /><b>No</b><span>{no}</span>
      </button>
    </div>
  )
}

export function ConfirmarBorrado({ que = 'este gasto', onSi, onNo }) {
  return (
    <div class="velo" onClick={onNo}>
      <div class="hoja" role="alertdialog" aria-modal="true" aria-label="Confirmar borrado" onClick={(e) => e.stopPropagation()}>
        <Icon name="trash-bold" class="ic hoja-ic" />
        <p>¿Seguro que quiere borrar {que}?</p>
        <div class="hoja-botones">
          <button type="button" class="boton no-borrar" onClick={onNo}>No, dejarlo</button>
          <button type="button" class="boton si-borrar" onClick={onSi}>Sí, borrar</button>
        </div>
      </div>
    </div>
  )
}

// Cada cliente tiene su color fijo, como los contactos de WhatsApp.
export const COLORES_CLIENTE = ['#A23B5A', '#2E6F7E', '#7A5C1E', '#3D4F8C', '#8C3D2B', '#1F6F5C', '#6E3F7A', '#4F6B2A', '#9A4A16', '#4A5560']

export function colorCliente(c) {
  if (!c) return COLORES_CLIENTE[9]
  if (Number.isInteger(c.color)) return COLORES_CLIENTE[c.color % COLORES_CLIENTE.length]
  let h = 0
  for (const ch of c.id ?? c.nombre ?? '') h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORES_CLIENTE[h % COLORES_CLIENTE.length]
}

export function iniciales(nombre = '') {
  const partes = nombre.replace(/^(don|doña|dona|señor|señora|sr\.?|sra\.?)\s+/i, '').trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function Avatar({ cliente, nombre, tam = 'm', insignia }) {
  const n = cliente?.nombre ?? nombre
  return (
    <span class={`avatar av-${tam}`} style={{ background: colorCliente(cliente ?? { nombre: n }) }} aria-hidden="true">
      {iniciales(n)}
      {insignia && <span class="insignia"><Icon name={insignia} class="ic-xs" /></span>}
    </span>
  )
}
