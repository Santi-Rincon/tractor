import { useState } from 'preact/hooks'
import { Icon } from './Icon.jsx'
import { Barra, Monto, Teclado, Atajos, SiNo, ConfirmarBorrado, Avatar, Encabezado, vibrar, mil } from './comunes.jsx'
import { plata, fechaLarga, hora, nombreDia as nombreDiaCorto } from './formato.js'
import { LABORES, DISTANCIAS, PRECIOS_HORA, labor, valorLabor, totalTrabajo, tiempo, resumenLabor } from './reglas.js'

const T = (cliente) => cliente ? <>Trabajo · <b>{cliente.nombre}</b></> : <b>Trabajo</b>

export function ElegirCliente({ clientes, onVolver, onElegir, onNuevo }) {
  const [buscar, setBuscar] = useState('')
  const lista = clientes.filter((c) => c.nombre.toLowerCase().includes(buscar.trim().toLowerCase()))
  return (
    <main class="scr">
      <Barra titulo={T()} onVolver={onVolver} color="trabajo" />
      <h1 class="q">¿Para quién fue el trabajo?</h1>
      {clientes.length > 6 && (
        <input class="campo buscar" type="search" value={buscar} placeholder="Buscar por nombre" onInput={(e) => setBuscar(e.currentTarget.value)} />
      )}
      <div class="lista-grande">
        <button type="button" class="opcion con-icono nuevo" onClick={onNuevo}>
          <span class="burbuja b-trabajo"><Icon name="user-plus-duotone" /></span>Cliente nuevo
        </button>
        {lista.map((c) => (
          <button type="button" class="opcion con-icono" onClick={() => { vibrar(10); onElegir(c) }}>
            <Avatar cliente={c} />
            <span class="op-txt">{c.nombre}{c.vereda && <small>{c.vereda}</small>}</span>
          </button>
        ))}
      </div>
      {clientes.length === 0 && <p class="pista">La primera vez hay que agregar cada cliente. Después ya aparece en esta lista.</p>}
    </main>
  )
}

export function ClienteNuevo({ onVolver, onCrear }) {
  const [nombre, setNombre] = useState('')
  const listo = nombre.trim().length > 1
  return (
    <main class="scr">
      <Barra titulo={T()} onVolver={onVolver} color="trabajo" />
      <h1 class="q">¿Cómo se llama el cliente?</h1>
      <input class="campo c-foco-trabajo" type="text" value={nombre} enterkeyhint="next" autocapitalize="words" autofocus
        placeholder="Ej.: Don Pedro Ríos" onInput={(e) => setNombre(e.currentTarget.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && listo) onCrear(nombre.trim()) }} />
      <p class="pista">También puede tocar el micrófono del teclado y decir el nombre.</p>
      <button type="button" class="primary" disabled={!listo} onClick={() => onCrear(nombre.trim())}>Siguiente</button>
    </main>
  )
}

export function ElegirVereda({ cliente, veredas, onVolver, onElegir }) {
  const [otra, setOtra] = useState(false)
  const [texto, setTexto] = useState('')
  const orden = cliente.vereda ? [cliente.vereda, ...veredas.filter((v) => v !== cliente.vereda)] : veredas
  return (
    <main class="scr">
      <Barra titulo={T(cliente)} onVolver={onVolver} color="trabajo" />
      <h1 class="q">¿En qué vereda?</h1>
      {otra || orden.length === 0 ? (
        <>
          <input class="campo c-foco-trabajo" type="text" value={texto} autocapitalize="words" autofocus enterkeyhint="next"
            placeholder="Nombre de la vereda" onInput={(e) => setTexto(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && texto.trim()) onElegir(texto.trim()) }} />
          <div class="sp" />
          <button type="button" class="ghost" onClick={() => onElegir('')}>No anotar vereda</button>
          <button type="button" class="primary" disabled={!texto.trim()} onClick={() => onElegir(texto.trim())}>Siguiente</button>
        </>
      ) : (
        <>
          <div class="lista-grande">
            {orden.map((v) => (
              <button type="button" class="opcion con-icono" onClick={() => { vibrar(10); onElegir(v) }}>
                <span class="burbuja b-trabajo"><Icon name="map-pin-duotone" /></span>{v}
              </button>
            ))}
            <button type="button" class="opcion con-icono nuevo" onClick={() => setOtra(true)}>
              <span class="burbuja b-trabajo"><Icon name="plus-circle-duotone" /></span>Otra vereda
            </button>
          </div>
          <div class="sp" />
          <button type="button" class="ghost" onClick={() => onElegir('')}>No anotar vereda</button>
        </>
      )}
    </main>
  )
}

export function ElegirLabor({ cliente, onVolver, onElegir }) {
  return (
    <main class="scr">
      <Barra titulo={T(cliente)} onVolver={onVolver} color="trabajo" />
      <h1 class="q">¿Qué labor hizo?</h1>
      <div class="lista-grande">
        {LABORES.map((l) => (
          <button type="button" class="opcion con-icono" onClick={() => { vibrar(10); onElegir(l.id) }}>
            <span class="burbuja b-trabajo"><Icon name={l.porHora ? 'tractor-duotone' : 'truck-trailer-duotone'} /></span>
            <span class="op-txt">{l.nombre}{l.detalle && <small>{l.detalle}</small>}</span>
          </button>
        ))}
      </div>
    </main>
  )
}

function Paso({ etiqueta, valor, unidad, onMenos, onMas }) {
  return (
    <div class="paso-num">
      <span class="pn-lbl">{etiqueta}</span>
      <button type="button" class="pn-b" aria-label={`Menos ${etiqueta}`} onClick={() => { vibrar(8); onMenos() }}><Icon name="minus-bold" class="ic-s" /></button>
      <b class="pn-v">{valor}<small>{unidad}</small></b>
      <button type="button" class="pn-b" aria-label={`Más ${etiqueta}`} onClick={() => { vibrar(8); onMas() }}><Icon name="plus-bold" class="ic-s" /></button>
    </div>
  )
}

export function Tiempo({ cliente, tipo, inicial, onVolver, onListo }) {
  const [min, setMin] = useState(inicial?.minutos ?? 0)
  const [precio, setPrecio] = useState(inicial?.precioHora ?? 90000)
  const h = Math.floor(min / 60), m = min % 60
  const cambiar = (d) => setMin((x) => Math.max(0, Math.min(24 * 60, x + d)))
  return (
    <main class="scr">
      <Barra titulo={<>{labor(tipo).nombre} · <b>{cliente.nombre}</b></>} onVolver={onVolver} color="trabajo" />
      <h1 class="q">¿Cuánto tiempo trabajó?</h1>
      <div class="pasos-num">
        <Paso etiqueta="Horas" valor={h} unidad=" h" onMenos={() => cambiar(-60)} onMas={() => cambiar(60)} />
        <Paso etiqueta="Minutos" valor={m} unidad=" min" onMenos={() => cambiar(m === 0 && h === 0 ? 0 : -5)} onMas={() => cambiar(5)} />
      </div>
      <p class="sub-q">Precio de la hora</p>
      <Atajos valores={PRECIOS_HORA} actual={precio} onElegir={setPrecio} color="trabajo" alternar={false} />
      <div class="cuenta">
        <span>{tiempo(min)} × {plata(precio)}</span>
        <b>{plata(Math.round((min / 60) * precio))}</b>
      </div>
      <button type="button" class="primary" disabled={!min} onClick={() => onListo({ tipo, minutos: min, precioHora: precio })}>Siguiente</button>
    </main>
  )
}

export function Bultos({ cliente, inicial, onVolver, onListo }) {
  const [digitos, setDigitos] = useState(inicial ? String(inicial.bultos) : '')
  const [dist, setDist] = useState(inicial?.distancia ?? 'cerca')
  const bultos = Number(digitos || 0)
  const d = DISTANCIAS.find((x) => x.id === dist)
  return (
    <main class="scr">
      <Barra titulo={<>Remolcada · <b>{cliente.nombre}</b></>} onVolver={onVolver} color="trabajo" />
      <h1 class="q">¿Cuántos bultos?</h1>
      <Monto valor={bultos} unidad="bultos" />
      <div class="chips">
        {DISTANCIAS.map((x) => (
          <button type="button" class={`chip ch-trabajo dos-lineas${dist === x.id ? ' on' : ''}`} onClick={() => { vibrar(8); setDist(x.id) }}>
            {x.nombre}<small>{plata(x.precio)}</small>
          </button>
        ))}
      </div>
      <Teclado digitos={digitos} onDigitos={setDigitos} sinMiles />
      <button type="button" class="primary" disabled={!bultos}
        onClick={() => onListo({ tipo: 'remolcada', bultos, distancia: dist, precioBulto: d.precio })}>
        Siguiente{bultos ? ` · ${plata(bultos * d.precio)}` : ''}
      </button>
    </main>
  )
}

export function Pregunta({ cliente, pregunta, si, no, iconoSi, onVolver, onSi, onNo }) {
  return (
    <main class="scr">
      <Barra titulo={T(cliente)} onVolver={onVolver} color="trabajo" />
      <h1 class="q">{pregunta}</h1>
      <SiNo si={si} no={no} iconoSi={iconoSi} color="trabajo" onSi={onSi} onNo={onNo} />
    </main>
  )
}

export function Valor({ cliente, pregunta, digitos, atajos, etiqueta, onDigitos, onVolver, onListo }) {
  const valor = Number(digitos || 0)
  return (
    <main class="scr">
      <Barra titulo={T(cliente)} onVolver={onVolver} color="trabajo" />
      <h1 class="q">{pregunta}</h1>
      <Monto valor={valor} />
      <Atajos valores={atajos} actual={valor} etiqueta={etiqueta ?? mil} onElegir={(a) => onDigitos(a ? String(a) : '')} color="trabajo" />
      <Teclado digitos={digitos} onDigitos={onDigitos} />
      <button type="button" class="primary" disabled={!valor} onClick={onListo}>Siguiente</button>
    </main>
  )
}

function Cuenta({ t, pago }) {
  const total = totalTrabajo(t)
  return (
    <dl class="r-filas">
      {t.labores.map((l) => <div><dt>{resumenLabor(l)}</dt><dd>{plata(valorLabor(l))}</dd></div>)}
      {t.acpmCliente > 0 && <div><dt>ACPM que puso el cliente</dt><dd>− {plata(t.acpmCliente)}</dd></div>}
      <div class="r-total"><dt>Total a cobrar</dt><dd>{plata(total)}</dd></div>
      {pago > 0 && <div><dt>Pagó en el momento</dt><dd>{plata(pago)}</dd></div>}
      {pago > 0 && <div class="r-total"><dt>{pago >= total ? 'Queda a paz y salvo' : 'Queda debiendo'}</dt><dd>{plata(Math.max(0, total - pago))}</dd></div>}
    </dl>
  )
}

export function Resumen({ t, pago, onVolver, onGuardar }) {
  const [guardando, setGuardando] = useState(false)
  return (
    <main class="scr">
      <Barra titulo={T(t.cliente)} onVolver={onVolver} color="trabajo" />
      <h1 class="q">Revise antes de guardar</h1>
      <article class="recibo plano">
        <div class="r-top"><Avatar cliente={t.cliente} />
          <span class="r-tipo">{t.cliente.nombre}{t.vereda && <small>{t.vereda}</small>}</span></div>
        <Cuenta t={t} pago={pago} />
      </article>
      <div class="sp" />
      <button type="button" class="primary" disabled={guardando} onClick={() => { setGuardando(true); onGuardar() }}>Guardar</button>
    </main>
  )
}

export function ListoTrabajo({ t, pago, onInicio, onDeshacer }) {
  const [confirmando, setConfirmando] = useState(false)
  const total = totalTrabajo(t)
  const primera = t.labores[0]
  const frase = primera.tipo === 'remolcada'
    ? `${primera.bultos} bultos remolcados`
    : `${tiempo(primera.minutos)} de ${labor(primera.tipo).nombre.toLowerCase()}`
  return (
    <main class="scr done">
      <div class="badge"><Icon name="check-bold" class="ic-xl" /></div>
      <h1 class="ok-t">Quedó anotado</h1>
      <p class="sent">{frase}{t.labores.length > 1 ? ` y ${t.labores.length - 1} labor más` : ''} donde <b>{t.clienteNombre}</b>. Total <b>{plata(total)}</b>.</p>
      {pago > 0 && <p class="sent chico">Usted recibió {plata(pago)}.</p>}
      <div class="sp" />
      <button type="button" class="primary" onClick={onInicio}>Volver al inicio</button>
      <button type="button" class="ghost" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="arrow-counter-clockwise-bold" class="ic-s" /> Deshacer</button>
      {confirmando && <ConfirmarBorrado que="este trabajo" onSi={onDeshacer} onNo={() => setConfirmando(false)} />}
    </main>
  )
}

export function ReciboTrabajo({ t, cliente, cobro, yo, onVolver, onBorrar }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <main class="scr">
      <div class="bar">
        <button type="button" class="back" onClick={onVolver} aria-label="Volver"><Icon name="arrow-left-bold" class="ic-s" /></button>
        <span class="crumb c-trabajo"><b>Recibo de trabajo</b></span>
      </div>
      <article class="recibo">
        <div class="r-top"><Avatar cliente={cliente} nombre={t.clienteNombre} insignia="tractor-duotone" />
          <span class="r-tipo">{t.clienteNombre}{t.vereda && <small>{t.vereda}</small>}</span></div>
        <div class="r-valor"><span class="cur">$</span>{plata(totalTrabajo(t))}</div>
        <Cuenta t={t} pago={cobro?.valor ?? 0} />
        <dl class="r-filas">
          {cobro && <div><dt>Recibió la plata</dt><dd>{cobro.recibio}</dd></div>}
          <div><dt>Conductor</dt><dd>{t.conductor}</dd></div>
          <div><dt>Fecha</dt><dd>{fechaLarga(new Date(t.fecha))}</dd></div>
          <div><dt>Hora</dt><dd>{hora(t.fecha)}</dd></div>
        </dl>
      </article>
      <div class="sp" />
      {t.registradoPor === yo
        ? <button type="button" class="ghost peligro-t" onClick={() => { vibrar(10); setConfirmando(true) }}><Icon name="trash-bold" class="ic-s" /> Borrar este trabajo</button>
        : <p class="pista centro">Solo {t.registradoPor} puede borrarlo.</p>}
      {confirmando && <ConfirmarBorrado que="este trabajo" onSi={() => onBorrar(t.id)} onNo={() => setConfirmando(false)} />}
    </main>
  )
}

export function ReciboCobro({ c, cliente, onVolver, onVerTrabajo }) {
  return (
    <main class="scr">
      <div class="bar">
        <button type="button" class="back" onClick={onVolver} aria-label="Volver"><Icon name="arrow-left-bold" class="ic-s" /></button>
        <span class="crumb c-plata"><b>Recibo de pago</b></span>
      </div>
      <article class="recibo">
        <div class="r-top"><Avatar cliente={cliente} nombre={c.clienteNombre} insignia="hand-coins-duotone" /><span class="r-tipo">{c.clienteNombre} pagó</span></div>
        <div class="r-valor"><span class="cur">$</span>{plata(c.valor)}</div>
        <dl class="r-filas">
          <div><dt>Quién pagó</dt><dd>{c.clienteNombre}</dd></div>
          <div><dt>Quién recibió</dt><dd>{c.recibio}</dd></div>
          <div><dt>Fecha</dt><dd>{fechaLarga(new Date(c.fecha))}</dd></div>
          <div><dt>Hora</dt><dd>{hora(c.fecha)}</dd></div>
        </dl>
      </article>
      <div class="sp" />
      {c.trabajoId && <button type="button" class="ghost" onClick={onVerTrabajo}>Ver el trabajo de este pago</button>}
    </main>
  )
}

// Lo que ven los dueños al tocar Trabajo: lo trabajado, día por día.
export function Trabajados({ trabajos, clientes, filtro, onFiltro, onVolver, onAbrir, onHoras }) {
  const conductores = [...new Set(trabajos.map((t) => t.conductor))]
  const lista = filtro === 'todos' ? trabajos : trabajos.filter((t) => t.conductor === filtro)
  const dias = []
  for (const t of lista) {
    const clave = new Date(t.fecha).toDateString()
    let d = dias.find((x) => x.clave === clave)
    if (!d) { d = { clave, fecha: t.fecha, minutos: 0, bultos: 0, total: 0, items: [] }; dias.push(d) }
    d.items.push(t); d.total += totalTrabajo(t)
    for (const l of t.labores) l.tipo === 'remolcada' ? (d.bultos += l.bultos) : (d.minutos += l.minutos)
  }
  return (
    <main class="scr">
      <Encabezado titulo="Lo trabajado" onVolver={onVolver} />
      <button type="button" class="enlace-horas" onClick={() => { vibrar(8); onHoras() }}>
        <Icon name="clock-duotone" class="ic-s" /> Horas de los conductores <Icon name="caret-right-bold" class="ic-xs" />
      </button>
      {conductores.length > 1 && (
        <div class="filtros">
          {['todos', ...conductores].map((c) => (
            <button type="button" class={`filtro f-trabajo${filtro === c ? ' on' : ''}`} onClick={() => { vibrar(8); onFiltro(c) }}>{c === 'todos' ? 'Todos' : c}</button>
          ))}
        </div>
      )}
      {dias.length === 0 && <p class="vacio separado">Todavía no se ha anotado ningún trabajo. Lo anota quien maneja (Raúl o Leo) desde su celular.</p>}
      {dias.map((d) => (
        <section class="dia">
          <header class="dia-h dos">
            <h2>{nombreDiaCorto(d.fecha)}</h2>
            <span>{[d.minutos ? tiempo(d.minutos) : '', d.bultos ? `${d.bultos} bultos` : ''].filter(Boolean).join(' · ')} · <b>{plata(d.total)}</b></span>
          </header>
          {d.items.map((t) => {
            const l = t.labores[0]
            const detalle = t.labores.map((x) => x.tipo === 'remolcada' ? `${x.bultos} bultos` : `${labor(x.tipo).nombre} ${tiempo(x.minutos)}`).join(' + ')
            return (
              <button type="button" class="row" onClick={() => onAbrir('trabajo', t.id)}>
                <Avatar cliente={clientes.find((c) => c.id === t.clienteId)} nombre={t.clienteNombre} tam="s" />
                <span class="rt"><b>{t.clienteNombre}</b><small>{detalle} · {t.conductor}{t.vereda ? ` · ${t.vereda}` : ''}</small></span>
                <span class="amt">{plata(totalTrabajo(t))}</span>
                <Icon name="caret-right-bold" class="ic-xs flecha" />
              </button>
            )
          })}
        </section>
      ))}
    </main>
  )
}
