import { get, set } from 'idb-keyval'

export async function cargar() {
  const [yo, gastos] = await Promise.all([get('yo'), get('gastos')])
  return { yo: yo ?? null, gastos: gastos ?? [] }
}

export const guardarYo = (yo) => set('yo', yo)
export const guardarGastos = (gastos) => set('gastos', gastos)
