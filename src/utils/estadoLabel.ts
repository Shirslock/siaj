import { getEstadoProcesal } from '../data/estadosProcesales'
import { getEtapaPenal } from '../data/etapasPenales'
import type { Expediente } from '../types'

/** Nombre legible del estado de una actuación ("En análisis" y no "EN_ANALISIS"), como en el PRD. */
export function labelEstado(exp: Pick<Expediente, 'tipo' | 'area' | 'estado' | 'estadoProcesal'>): string {
  const codigo = exp.estadoProcesal ?? exp.estado
  if (exp.area === 'PENAL') {
    const etapa = getEtapaPenal(exp.tipo, codigo)
    if (etapa) return etapa.label
  }
  return getEstadoProcesal(exp.tipo, codigo)?.label ?? exp.estado
}
