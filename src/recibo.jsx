import { useEffect, useState } from 'preact/hooks'
import { Icon } from './Icon.jsx'
import { ConfirmarBorrado, vibrar } from './comunes.jsx'
import { plata, fechaLarga, hora } from './formato.js'
import { leerFoto } from './store.js'

const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

// Sello de tinta, como el de una factura cancelada.
export function Sello({ texto, fecha }) {
  const d = fecha ? new Date(fecha) : null
  return (
    <div class="sello" role="img" aria-label={`${texto}${d ? ` el ${d.getDate()} de ${MESES_CORTOS[d.getMonth()].toLowerCase()}` : ''}`}>
      <span class="sello-txt">{texto}</span>
      {d && <span class="sello-fecha">{d.getDate()} {MESES_CORTOS[d.getMonth()]} {d.getFullYear()}</span>}
    </div>
  )
}

// El mismo recibo para todo: gasto, trabajo, pago de un cliente o pago al conductor.
// Siempre en el mismo orden: qué es, de quién, cuánto, el detalle, la fecha y quién lo anotó.
export function Recibo({ tipo, color, figura, titulo, sub, valor, detalle, filas, sello, fecha, autor, fotoId,
  yo, que, onVolver, onBorrar, abajo }) {
  const [url, setUrl] = useState('')
  const [grande, setGrande] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  useEffect(() => {
    let u = ''
    if (fotoId) leerFoto(fotoId).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u) } })
    return () => u && URL.revokeObjectURL(u)
  }, [fotoId])

  return (
    <main class="scr">
      <div class="bar">
        <button type="button" class="back" onClick={onVolver} aria-label="Volver"><Icon name="arrow-left-bold" class="ic-s" /></button>
        <span class="crumb"><b class="neutro">Recibo</b></span>
      </div>
      <article class={`recibo r-${color}`}>
        <span class={`r-etiqueta e-${color}`}>{tipo}</span>
        <div class="r-top">{figura}<span class="r-tipo">{titulo}{sub && <small>{sub}</small>}</span></div>
        <div class="r-valor"><span class="cur">$</span>{plata(valor)}</div>
        {detalle}
        {sello}
        <dl class="r-filas">
          {filas.filter(Boolean).map(([dt, dd]) => <div><dt>{dt}</dt><dd class="largo">{dd}</dd></div>)}
          <div><dt>Fecha</dt><dd>{fechaLarga(new Date(fecha))}</dd></div>
          <div><dt>Hora</dt><dd>{hora(fecha)}</dd></div>
          <div><dt>Anotado por</dt><dd>{autor}</dd></div>
        </dl>
        {fotoId !== undefined && (fotoId
          ? url && <button type="button" class="r-foto" onClick={() => setGrande(true)}><img src={url} alt="Foto de la factura" /><span>Toque para verla grande</span></button>
          : <p class="r-sin">Sin foto de la factura</p>)}
      </article>
      <div class="sp" />
      {abajo}
      {onBorrar && (autor === yo
        ? <button type="button" class="ghost peligro-t" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="trash-bold" class="ic-s" /> Borrar {que}</button>
        : <p class="pista centro">Solo {autor} puede borrarlo.</p>)}
      {confirmando && <ConfirmarBorrado que={que} onSi={onBorrar} onNo={() => setConfirmando(false)} />}
      {grande && (
        <button type="button" class="foto-grande" onClick={() => setGrande(false)} aria-label="Cerrar foto">
          <img src={url} alt="Foto de la factura" /><span class="cerrar"><Icon name="x-bold" class="ic-s" /> Cerrar</span>
        </button>
      )}
    </main>
  )
}
