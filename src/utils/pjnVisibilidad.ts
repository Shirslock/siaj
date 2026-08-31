import type { NovedadPJN, Expediente, Usuario } from '../types'

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
