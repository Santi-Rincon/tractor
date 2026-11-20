import { get, set, del } from 'idb-keyval'

// Las primeras pruebas usaban "Papá" y "Padrino"; se pasan a los nombres reales.
const RENOMBRES = { 'Papá': 'Santiago', 'Padrino': 'Raúl' }

export async function cargar() {
  const [yoGuardado, gastosGuardados] = await Promise.all([get('yo'), get('gastos')])
  const yo = RENOMBRES[yoGuardado] ?? yoGuardado ?? null
  const gastos = (gastosGuardados ?? []).map((g) => RENOMBRES[g.pagadoPor] ? { ...g, pagadoPor: RENOMBRES[g.pagadoPor] } : g)
  if (yo !== yoGuardado) await set('yo', yo)
  if (gastos.some((g, i) => g !== gastosGuardados[i])) await set('gastos', gastos)
  return { yo, gastos }
}

export const guardarYo = (yo) => set('yo', yo)
export const guardarGastos = (gastos) => set('gastos', gastos)

// Las fotos van aparte para que la lista de gastos cargue liviana.
export const guardarFoto = (id, blob) => set(`foto:${id}`, blob)
export const leerFoto = (id) => get(`foto:${id}`)
export const borrarFoto = (id) => del(`foto:${id}`)
