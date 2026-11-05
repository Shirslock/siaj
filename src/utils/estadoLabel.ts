import { getEstadoProcesal } from '../data/estadosProcesales'
import type { Expediente } from '../types'

/** Nombre legible del estado de una actuación ("En análisis" y no "EN_ANALISIS"), como en el PRD. */
export function labelEstado(exp: Pick<Expediente, 'tipo' | 'estado' | 'estadoProcesal'>): string {
  return getEstadoProcesal(exp.tipo, exp.estadoProcesal ?? exp.estado)?.label ?? exp.estado
}
