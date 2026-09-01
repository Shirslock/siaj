import type { ActuacionPjnSinCargar, NovedadPJN, Expediente, Usuario } from '../types'

// Filtra las novedades PJN visibles para el usuario activo:
// REFERENTE ve todas, COORDINADOR ve las de su área, ABOGADO solo las de sus
// expedientes asignados. ADMINISTRATIVO no gestiona novedades procesales.
export function filtrarNovedadesPorRol(
  novedades: NovedadPJN[],
  expedientes: Expediente[],
  usuario: Usuario | null | undefined
): NovedadPJN[] {
  if (!usuario) return []

  const expedienteById = new Map(expedientes.map(e => [e.id, e]))

  return novedades.filter(n => {
    const exp = expedienteById.get(n.expediente_id)
    if (!exp) return false

    switch (usuario.rolSistema) {
      case 'REFERENTE':
        return true
      case 'COORDINADOR':
        return usuario.areas.includes(exp.area)
      case 'ABOGADO':
        return exp.abogado_id === usuario.id
      default:
        return false
    }
  })
}

// Filtra las alertas de "actuación en PJN sin cargar en SIAJ" visibles para el
// usuario activo.
//
// TODO: confirmar regla de visibilidad — pendiente definición de negocio (reunión
// 2026-09-01). No hay expediente en SIAJ del cual inferir área/letrado dueño, así
// que por ahora la regla es conservadora: REFERENTE y COORDINADOR ven todas (son
// quienes podrían decidir si corresponde dar de alta el expediente), ABOGADO no ve
// nada todavía. Cuando se defina la regla real, tocar solo esta función.
export function filtrarAlertasActuacionesPorRol(
  alertas: ActuacionPjnSinCargar[],
  usuario: Usuario | null | undefined
): ActuacionPjnSinCargar[] {
  if (!usuario) return []

  switch (usuario.rolSistema) {
    case 'REFERENTE':
    case 'COORDINADOR':
      return alertas
    case 'ABOGADO':
    default:
      return []
  }
}
