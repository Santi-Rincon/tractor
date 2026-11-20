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
