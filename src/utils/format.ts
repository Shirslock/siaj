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

export function numerador(area: 'CIVIL' | 'LABORAL' | 'PENAL', numero: number, anio?: number): string {
  const prefix = area === 'CIVIL' ? 'C' : area === 'LABORAL' ? 'L' : 'P'
  const yr = anio ?? new Date().getFullYear()
  return `${prefix}-${String(numero).padStart(4, '0')}/${yr}`
}

export function formatNombreUsuario(apellido: string, nombre: string): string {
  return `${apellido}, ${nombre}`
}
