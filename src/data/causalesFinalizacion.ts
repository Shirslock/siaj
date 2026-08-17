// ── Causales de finalización — MATRIZ SACO ───────────────
// Catálogo por grupoCausal (ver EstadoProcesal.grupoCausal en
// estadosProcesales.ts). Usado en el modal "Finalizar actuación"
// de los 4 ciclos de Demanda Civil/Laboral (Actora/Demandada).

export const CAUSALES_FINALIZACION: Record<string, string[]> = {
  PRE_SENTENCIA_1: [
    'Caducidad de instancia',
    'Desistimiento',
    'Allanamiento',
    'Transacción o acuerdo extrajudicial',
    'Incompetencia con archivo',
    'Otra',
  ],
  SENTENCIA_1: [
    'Sin apelar (sentencia firme por consentimiento)',
    'Apelada (desistimiento del recurso)',
  ],
  INSTANCIA_RECURSIVA: [
    'Sentencia firme favorable',
    'Sentencia firme desfavorable',
    'Otra',
  ],
  EJECUCION_SENTENCIA: [
    'Cumplimiento total',
    'Incobrabilidad',
    'Otra',
  ],
  // Catálogo propio de Lanzamiento Judicializado — todos los estados de ese
  // ciclo usan grupoCausal: 'LANZAMIENTO' (no comparte causales con Demanda).
  LANZAMIENTO: [
    'Desistimiento',
    'Acuerdo de entrega',
    'Otro',
  ],
}

/** Catálogo propio de causales de LANZAMIENTO_JUDICIALIZADO (alias del grupo
 * 'LANZAMIENTO' en CAUSALES_FINALIZACION, para import directo si se necesita). */
export const CAUSALES_FINALIZACION_LANZAMIENTO = CAUSALES_FINALIZACION.LANZAMIENTO

/** Devuelve las causales de finalización disponibles para un grupoCausal dado. */
export function getCausalesPorEstado(grupoCausal?: string): string[] {
  if (!grupoCausal) return []
  return CAUSALES_FINALIZACION[grupoCausal] ?? []
}
