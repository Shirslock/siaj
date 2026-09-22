export function formatFecha(fecha: string): string {
  if (!fecha) return ''
  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return fecha
  return fecha
}

// Símbolo por moneda. Agregar una moneda nueva es agregar una entrada acá:
// el type y normalizarMoneda salen de estas claves.
const SIMBOLO_MONEDA = { ARS: '$ ', USD: 'US$ ', EUR: '€ ' } as const

export type Moneda = keyof typeof SIMBOLO_MONEDA

// Los expedientes previos al campo de moneda no tienen valor guardado: se asume ARS.
export function normalizarMoneda(val: unknown): Moneda {
  return typeof val === 'string' && val in SIMBOLO_MONEDA ? (val as Moneda) : 'ARS'
}

// La actualización por índice de inflación es sobre pesos: no aplica al resto de las monedas.
export function aplicaIndiceInflacion(moneda: Moneda): boolean {
  return moneda === 'ARS'
}

export function formatMonto(valor: number | string, moneda: Moneda = 'ARS'): string {
  const simbolo = SIMBOLO_MONEDA[moneda] ?? SIMBOLO_MONEDA.ARS
  const num = typeof valor === 'string' ? parseFloat(valor.replace(/[^0-9.-]/g, '')) : valor
  if (isNaN(num)) return simbolo + '0,00'
  return simbolo + num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Opciones de moneda para selects — única fuente para no repetir el ARS/USD/EUR
// hardcodeado en cada lugar que arma un campo money_multi.
export const OPCIONES_MONEDA: { value: Moneda; label: string }[] = [
  { value: 'ARS', label: 'ARS — Pesos argentinos' },
  { value: 'USD', label: 'USD — Dólares' },
  { value: 'EUR', label: 'EUR — Euros' },
]

export interface ParMoneda {
  moneda: Moneda
  monto: number
}

// Campos money admiten N pares moneda+monto (ver `money_multi` en formularios.ts). Los datos
// previos a ese campo repetible guardaban un escalar en `campos[id]` + la moneda en el campo
// hermano `campos[`${id}_moneda`]` — se normalizan acá como una lista de 1 par.
export function normalizarMontos(valorCampo: unknown, monedaLegacy?: unknown): ParMoneda[] {
  if (Array.isArray(valorCampo)) {
    return valorCampo
      .filter((par): par is Record<string, unknown> => par != null && typeof par === 'object')
      .map(par => ({ moneda: normalizarMoneda(par.moneda), monto: Number(par.monto) || 0 }))
  }
  if (valorCampo === undefined || valorCampo === null || valorCampo === '') return []
  const monto = typeof valorCampo === 'string' ? parseFloat(valorCampo.replace(/[^0-9.-]/g, '')) : Number(valorCampo)
  if (isNaN(monto)) return []
  return [{ moneda: normalizarMoneda(monedaLegacy), monto }]
}

// Suma agrupada por moneda — nunca mezcla montos de monedas distintas entre sí.
export function sumarMontosPorMoneda(pares: ParMoneda[]): Partial<Record<Moneda, number>> {
  const totales: Partial<Record<Moneda, number>> = {}
  pares.forEach(({ moneda, monto }) => {
    totales[moneda] = (totales[moneda] ?? 0) + monto
  })
  return totales
}

export function numerador(area: 'CIVIL' | 'LABORAL' | 'PENAL', numero: number, anio?: number): string {
  const prefix = area === 'CIVIL' ? 'C' : area === 'LABORAL' ? 'L' : 'P'
  const yr = anio ?? new Date().getFullYear()
  return `${prefix}-${String(numero).padStart(4, '0')}/${yr}`
}

export function formatNombreUsuario(apellido: string, nombre: string): string {
  return `${apellido}, ${nombre}`
}
