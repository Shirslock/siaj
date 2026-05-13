export function formatFecha(fecha: string): string {
  if (!fecha) return ''
  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return fecha
  return fecha
}

export function formatMonto(valor: number | string): string {
  const num = typeof valor === 'string' ? parseFloat(valor.replace(/[^0-9.-]/g, '')) : valor
  if (isNaN(num)) return '$ 0,00'
  return '$ ' + num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function numerador(area: 'CIVIL' | 'LABORAL' | 'PENAL', numero: number, anio?: number): string {
  const prefix = area === 'CIVIL' ? 'C' : area === 'LABORAL' ? 'L' : 'P'
  const yr = anio ?? new Date().getFullYear()
  return `${prefix}-${String(numero).padStart(4, '0')}/${yr}`
}

export function formatNombreUsuario(apellido: string, nombre: string): string {
  return `${apellido}, ${nombre}`
}
