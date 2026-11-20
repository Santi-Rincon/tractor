import { get, set, del, getMany } from 'idb-keyval'

// Las primeras pruebas usaban "Papá" y "Padrino"; se pasan a los nombres reales.
const RENOMBRES = { 'Papá': 'Santiago', 'Padrino': 'Raúl' }
const LISTAS = ['gastos', 'trabajos', 'cobros', 'clientes', 'pagos']

export async function cargar() {
  const [yoGuardado, ...listas] = await getMany(['yo', ...LISTAS])
  const yo = RENOMBRES[yoGuardado] ?? yoGuardado ?? null
  if (yo !== yoGuardado) await set('yo', yo)
  const datos = { yo }
  LISTAS.forEach((k, i) => { datos[k] = listas[i] ?? [] })
  const gastos = datos.gastos.map((g) => RENOMBRES[g.pagadoPor] ? { ...g, pagadoPor: RENOMBRES[g.pagadoPor] } : g)
  if (gastos.some((g, i) => g !== datos.gastos[i])) { datos.gastos = gastos; await set('gastos', gastos) }
  return datos
}

export const guardarYo = (yo) => set('yo', yo)
export const guardarLista = (clave, lista) => set(clave, lista)

// Las fotos van aparte para que las listas carguen livianas.
export const guardarFoto = (id, blob) => set(`foto:${id}`, blob)
export const leerFoto = (id) => get(`foto:${id}`)
export const borrarFoto = (id) => del(`foto:${id}`)
