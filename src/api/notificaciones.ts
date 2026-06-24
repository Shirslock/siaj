import { api } from './client'
import type { Notificacion } from '../types'

interface NotificacionRaw {
  id: string
  tipo: 'ASIGNACION' | 'REASIGNACION'
  expediente_id: string
  tipo_gestion: string
  caratula: string
  numero_causa: string | null
  destinatario_id: string
  leida: boolean
  fecha: string
}

function normalizarNotificacion(raw: NotificacionRaw): Notificacion {
  return {
    id: raw.id,
    tipo: raw.tipo,
    expedienteId: raw.expediente_id,
    tipoGestion: raw.tipo_gestion,
    caratula: raw.caratula,
    numeroCausa: raw.numero_causa,
    destinatarioId: raw.destinatario_id,
    leida: raw.leida,
    fecha: raw.fecha,
  }
}

export async function getNotificaciones(): Promise<{ data: Notificacion[] }> {
  const res = await api.get<{ data: NotificacionRaw[] }>('/api/notificaciones')
  return { data: res.data.map(normalizarNotificacion) }
}

export async function marcarLeida(id: string): Promise<{ ok: boolean }> {
  return api.patch(`/api/notificaciones/${id}/leida`, {})
}

export async function marcarTodasLeidas(): Promise<{ ok: boolean; actualizadas: number }> {
  return api.patch('/api/notificaciones/marcar-todas', {})
}
