// Precios y cálculos del negocio. Todo en pesos y minutos.
export const CONDUCTORES = ['Raúl', 'Leo']

export const LABORES = [
  { id: 'arada', nombre: 'Arada', detalle: 'de disco', porHora: true },
  { id: 'retobada', nombre: 'Retobada', porHora: true },
  { id: 'cincel', nombre: 'Cincel', porHora: true },
  { id: 'remolcada', nombre: 'Remolcada', detalle: 'por bulto', porHora: false }
]

export const PRECIOS_HORA = [85000, 90000]
export const PRECIO_HORA = 90000
export const DISTANCIAS = [
  { id: 'cerca', nombre: 'Cerca', precio: 1200 },
  { id: 'medio', nombre: 'Medio', precio: 1500 },
  { id: 'lejos', nombre: 'Lejos', precio: 2000 }
]

export const labor = (id) => LABORES.find((l) => l.id === id)

export function valorLabor(l) {
  return l.tipo === 'remolcada' ? l.bultos * l.precioBulto : Math.round((l.minutos / 60) * l.precioHora)
}

export function totalTrabajo(t) {
  return t.labores.reduce((s, l) => s + valorLabor(l), 0) - (t.acpmCliente || 0)
}

export function tiempo(min) {
  const h = Math.floor(min / 60), m = min % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

export function resumenLabor(l) {
  const n = labor(l.tipo).nombre
  return l.tipo === 'remolcada' ? `${n} · ${l.bultos} bultos` : `${n} · ${tiempo(l.minutos)}`
}

// Lo que gana quien maneja: por hora y por bulto remolcado.
export const PAGO_CONDUCTOR_HORA = 13000
export const PAGO_CONDUCTOR_BULTO = 300

export function ganadoConductor(t) {
  return t.labores.reduce((s, l) => s + (l.tipo === 'remolcada'
    ? l.bultos * PAGO_CONDUCTOR_BULTO
    : Math.round((l.minutos / 60) * PAGO_CONDUCTOR_HORA)), 0)
}

export function cuentaConductor(trabajos, conductor, pagos = []) {
  const suyos = trabajos.filter((t) => t.conductor === conductor)
  let minutos = 0, bultos = 0, ganado = 0
  for (const t of suyos) {
    ganado += ganadoConductor(t)
    for (const l of t.labores) l.tipo === 'remolcada' ? (bultos += l.bultos) : (minutos += l.minutos)
  }
  const pagado = pagos.filter((x) => x.conductor === conductor).reduce((s, x) => s + x.valor, 0)
  return { conductor, trabajos: suyos, minutos, bultos, ganado, pagado, debe: ganado - pagado }
}

// Lo que debe cada cliente: lo trabajado (ya sin el ACPM que puso) menos lo que ha pagado.
export function deudas(clientes, trabajos, cobros) {
  return clientes.map((c) => {
    const suyos = trabajos.filter((t) => t.clienteId === c.id)
    const pagos = cobros.filter((x) => x.clienteId === c.id)
    const trabajado = suyos.reduce((s, t) => s + totalTrabajo(t), 0)
    const pagado = pagos.reduce((s, x) => s + x.valor, 0)
    return { cliente: c, trabajos: suyos, pagos, trabajado, pagado, debe: trabajado - pagado }
  })
}
