import { create } from 'zustand'
import type { Notificacion } from '../types'

interface NotificacionesState {
  notificaciones: Notificacion[]
  agregarNotificacion: (n: Notificacion) => void
  marcarLeida: (id: string) => void
  marcarTodasLeidas: (usuarioId: string) => void
  descartarNotificacion: (id: string) => void
  limpiarVencidas: () => void
}

export const useNotificacionesStore = create<NotificacionesState>((set) => ({
  notificaciones: [],

  agregarNotificacion: (n) => set(s => ({
    notificaciones: [n, ...s.notificaciones]
  })),

  marcarLeida: (id) => set(s => ({
    notificaciones: s.notificaciones.map(n =>
      n.id === id ? { ...n, leida: true } : n
    )
  })),

  marcarTodasLeidas: (usuarioId) => set(s => ({
    notificaciones: s.notificaciones.map(n =>
      n.destinatarioId === usuarioId ? { ...n, leida: true } : n
    )
  })),

  descartarNotificacion: (id) => set(s => ({
    notificaciones: s.notificaciones.filter(n => n.id !== id)
  })),

  limpiarVencidas: () => set(s => {
    const hace30dias = new Date()
    hace30dias.setDate(hace30dias.getDate() - 30)
    return {
      notificaciones: s.notificaciones.filter(n => {
        if (!n.leida) return true
        return new Date(n.fecha) > hace30dias
      })
    }
  }),
}))
