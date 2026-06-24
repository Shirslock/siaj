import { create } from 'zustand'
import type { Notificacion } from '../types'
import { getNotificaciones, marcarLeida, marcarTodasLeidas } from '../api/notificaciones'

interface NotificacionesState {
  notificaciones: Notificacion[]
  cargarNotificaciones: () => Promise<void>
  marcarLeida: (id: string) => Promise<void>
  marcarTodasLeidas: (usuarioId?: string) => Promise<void>
  descartar: (id: string) => void
  noLeidasCount: (usuarioId: string) => number
}

export const useNotificacionesStore = create<NotificacionesState>((set, get) => ({
  notificaciones: [],

  cargarNotificaciones: async () => {
    const res = await getNotificaciones()
    set({ notificaciones: res.data })
  },

  marcarLeida: async (id) => {
    set(s => ({
      notificaciones: s.notificaciones.map(n => n.id === id ? { ...n, leida: true } : n),
    }))
    await marcarLeida(id)
  },

  marcarTodasLeidas: async (_usuarioId?) => {
    set(s => ({
      notificaciones: s.notificaciones.map(n => ({ ...n, leida: true })),
    }))
    await marcarTodasLeidas()
  },

  descartar: (id) =>
    set(s => ({
      notificaciones: s.notificaciones.filter(n => n.id !== id),
    })),

  noLeidasCount: (usuarioId) =>
    get().notificaciones.filter(n => n.destinatarioId === usuarioId && !n.leida).length,
}))
