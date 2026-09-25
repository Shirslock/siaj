import type { Tarea } from '../types'
import { getEstadoProcesal } from '../data/estadosProcesales'

/** Tareas "pendientes" = sin_estado o en_curso. 'cumplido' y 'no_procedente' cuentan como resueltas. */
export function esTareaPendiente(t: Tarea): boolean {
  return t.estado === 'sin_estado' || t.estado === 'en_curso'
}

/**
 * Tareas pendientes del ESTADO ACTUAL de una actuación (no de los estados
 * recorridos antes). Si el estado nunca se inicializó en `tareasMap`, se usan
 * las tareas por defecto del estado — todas sin_estado, o sea pendientes.
 */
export function getTareasPendientesEstadoActual(
  exp: { id: string; tipo: string; estado: string; estadoProcesal?: string },
  tareasMap: Record<string, Tarea[]>,
): Tarea[] {
  const codigo = exp.estadoProcesal ?? exp.estado
  const tareas = tareasMap[`${exp.id}__${codigo}`] ?? getEstadoProcesal(exp.tipo, codigo)?.tareas ?? []
  return tareas.filter(esTareaPendiente)
}
