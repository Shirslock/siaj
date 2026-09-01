import type { NovedadPJN } from '../types'

const DIAS_VENCIMIENTO_NOVEDAD_PJN = 7

// Trunca a medianoche local para que la diferencia en días no dependa de la hora
// del día en que se ejecuta el cálculo.
function inicioDelDia(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
}

function diasEntre(desde: string, hoy: Date): number {
  const MS_POR_DIA = 1000 * 60 * 60 * 24
  return Math.floor((inicioDelDia(hoy) - inicioDelDia(new Date(desde))) / MS_POR_DIA)
}

// Una novedad "vence" a los 7 días de detectada sin que el letrado la haya
// aplicado/descartado. No es un estado real — `estado` sigue siendo pura y
// exclusivamente 'pendiente' | 'aplicada' | 'descartada'; esto es un flag derivado
// para que la vista Pendientes por defecto no se ensucie con novedades viejas, sin
// tocar el flujo de aplicar/descartar ni ningún `estado === 'pendiente'` existente.
export function esNovedadVencida(novedad: NovedadPJN, hoy = new Date()): boolean {
  if (novedad.estado !== 'pendiente') return false
  return diasEntre(novedad.fecha_deteccion, hoy) >= DIAS_VENCIMIENTO_NOVEDAD_PJN
}

// Días transcurridos desde la detección, para mostrar "Vencida hace N días".
// Solo tiene sentido cuando `esNovedadVencida` es true.
export function diasDesdeDeteccion(novedad: NovedadPJN, hoy = new Date()): number {
  return diasEntre(novedad.fecha_deteccion, hoy)
}
