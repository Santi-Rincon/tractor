const pesos = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })
export const plata = (n) => pesos.format(n)

const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function fechaLarga(d = new Date()) {
  const dia = dias[d.getDay()]
  return `${dia[0].toUpperCase()}${dia.slice(1)} ${d.getDate()} de ${meses[d.getMonth()]}`
}

export function saludo(d = new Date()) {
  const h = d.getHours()
  return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
}

export function cuando(iso) {
  const d = new Date(iso)
  const hoy = new Date()
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1)
  const igual = (a, b) => a.toDateString() === b.toDateString()
  if (igual(d, hoy)) return 'hoy'
  if (igual(d, ayer)) return 'ayer'
  return `${d.getDate()} de ${meses[d.getMonth()]}`
}
