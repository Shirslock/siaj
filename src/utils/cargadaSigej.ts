import type { Actividad, Expediente, Usuario } from '../types'
import { getNombreCompleto } from '../data/usuarios'

// Delta 27 — marca "Cargada en SIGEJ". La marca Mesa SACO (el resto de los roles solo la ve) y cada
// cambio queda como movimiento de sistema en la línea de tiempo. Lo usan el detalle de la actuación
// y la Bandeja Mesa SACO.

/** Solo Mesa SACO tilda / destilda la marca. */
export function puedeMarcarSigej(usuario: Usuario | null | undefined): boolean {
  return usuario?.rolBD === 'adm_mesa'
}

export function alternarCargadaSigej(
  exp: Expediente,
  usuario: Usuario | null | undefined,
  store: {
    actualizarExpediente: (id: string, patch: Partial<Expediente>) => void
    agregarActividad: (expedienteId: string, actividad: Actividad) => void
  },
): void {
  if (!puedeMarcarSigej(usuario)) return
  const hoy = new Date().toISOString().split('T')[0]
  const marcar = !exp.cargada_sigej
  const nombre = usuario ? getNombreCompleto(usuario) : 'Usuario'
  store.actualizarExpediente(exp.id, marcar
    ? { cargada_sigej: true, cargada_sigej_por: usuario?.id, cargada_sigej_fecha: hoy }
    : { cargada_sigej: false, cargada_sigej_por: undefined, cargada_sigej_fecha: undefined })
  store.agregarActividad(exp.id, {
    id: `ACT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    expediente_id: exp.id,
    tipo: 'MOVIMIENTO',
    titulo: marcar ? 'Marcada como cargada en SIGEJ' : 'Se quitó la marca de cargada en SIGEJ',
    descripcion: `${nombre} ${marcar ? 'marcó la actuación como cargada en SIGEJ' : 'quitó la marca de cargada en SIGEJ'}.`,
    fecha: hoy,
    activo: true,
    subitems: [],
    doc_gde: null,
    creado_por: usuario?.id,
  })
}
