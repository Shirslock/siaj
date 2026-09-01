import type { Expediente } from '../types'

// Siglas PJN válidas de 3 letras (subconjunto de src/data/juzgadosPJN.ts que
// realmente son siglas de fuero, no labels descriptivos como 'CIVIL'/'FEDERAL').
const SIGLAS_PJN_VALIDAS = new Set(['CAF', 'CCF', 'CCC', 'CFP', 'FCO', 'FLP', 'FRO', 'FSM'])

// Nombres de campo donde puede venir el fuero explícito cargado, según el
// formulario de gestión (mesa, juzgado, abogado). Se prueban en orden.
const CAMPOS_FUERO = ['mesa_juzgado_fuero', 'juzgado_fuero', 'abg_juzgado_fuero']

const SENTINELAS_SIN_CAUSA = new Set(['SS', 'SS SOFSE'])

function siglaFueroExplicito(exp: Expediente): string | null {
  const registros = [exp.campos_mesa, exp.campos_abogado]
  for (const registro of registros) {
    if (!registro) continue
    for (const campo of CAMPOS_FUERO) {
      const valor = registro[campo]
      if (typeof valor === 'string' && SIGLAS_PJN_VALIDAS.has(valor.toUpperCase())) {
        return valor.toUpperCase()
      }
    }
  }
  return null
}

/**
 * Formatea el número de causa para mostrar con la sigla de fuero PJN
 * delante (ej. "CIV 61.204/2026"). No modifica el valor crudo almacenado
 * en `numero_causa`: solo para display.
 */
export function formatNumeroCausaPjn(exp: Expediente): string {
  const numeroCausa = exp.numero_causa
  if (!numeroCausa) return ''

  const numeroUpper = numeroCausa.toUpperCase()
  if (SENTINELAS_SIN_CAUSA.has(numeroUpper)) return numeroCausa

  // Números de Instrucción Penal Preparatoria (IPP), no son causas PJN.
  if (numeroUpper.startsWith('IPP-')) return numeroCausa

  const siglaExplicita = siglaFueroExplicito(exp)
  if (siglaExplicita) return `${siglaExplicita} ${numeroCausa}`

  if (exp.area === 'CIVIL') return `CIV ${numeroCausa}`
  if (exp.area === 'LABORAL') return `CNT ${numeroCausa}`

  // PENAL no mapea 1 a 1 a una sola sigla (CCC/CFP/CPE según juzgado real).
  // Sin fuero explícito cargado, mejor no mostrar sigla que mostrar una incorrecta.
  return numeroCausa
}
