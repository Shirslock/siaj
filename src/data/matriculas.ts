import type { Matricula } from '../types'

export const MATRICULAS: Matricula[] = [
  { id: 'MAT_001', abogado_id: 'UR_004', area: 'CIVIL',   jurisdiccion: 'CABA', tomo: '120', folio: '45' },
  { id: 'MAT_002', abogado_id: 'UR_004', area: 'CIVIL',   jurisdiccion: 'PBA',  tomo: '58',  folio: '210' },
  { id: 'MAT_003', abogado_id: 'UR_007', area: 'CIVIL',   jurisdiccion: 'CABA', tomo: '95',  folio: '12' },
  { id: 'MAT_004', abogado_id: 'UR_012', area: 'LABORAL', jurisdiccion: 'CABA', tomo: '77',  folio: '301' },
  { id: 'MAT_005', abogado_id: 'UR_010', area: 'LABORAL', jurisdiccion: 'CABA', tomo: '64',  folio: '88' },
  { id: 'MAT_006', abogado_id: 'UR_019', area: 'PENAL',    jurisdiccion: 'CABA', tomo: '33',  folio: '19' },
  // completar el resto de letrados en Configuración → Personal cuando se cargue el módulo real
]

export function getMatriculasPorArea(area: Matricula['area']): Matricula[] {
  return MATRICULAS.filter(m => m.area === area)
}

/** Matrícula sugerida por defecto: la del usuario logueado para el área del expediente.
 *  Si tiene más de una en esa área, devuelve la primera (el resto queda igual disponible en el listado). */
export function getMatriculaSugerida(usuarioActivoId: string, area: Matricula['area']): Matricula | null {
  return MATRICULAS.find(m => m.abogado_id === usuarioActivoId && m.area === area) ?? null
}

export function getNombreMatricula(m: Matricula, nombreAbogado: string): string {
  return `${nombreAbogado} — Matrícula ${m.jurisdiccion} T°${m.tomo} F°${m.folio}`
}
