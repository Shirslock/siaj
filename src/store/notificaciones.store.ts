import { create } from 'zustand'
import type { Notificacion } from '../types'

interface NotificacionesState {
  notificaciones: Notificacion[]
  marcarLeida: (id: string) => void
  marcarTodasLeidas: (usuarioId: string) => void
  descartar: (id: string) => void
  noLeidasCount: (usuarioId: string) => number
  agregarNotificacion: (n: Omit<Notificacion, 'id'>) => void
}

export const useNotificacionesStore = create<NotificacionesState>((set, get) => ({
  notificaciones: [],

  marcarLeida: (id) =>
    set((s) => ({
      notificaciones: s.notificaciones.map((n) =>
        n.id === id ? { ...n, leida: true } : n
      ),
    })),

  marcarTodasLeidas: (usuarioId) =>
    set((s) => ({
      notificaciones: s.notificaciones.map((n) =>
        n.destinatarioId === usuarioId ? { ...n, leida: true } : n
      ),
    })),

  descartar: (id) =>
    set((s) => ({
      notificaciones: s.notificaciones.filter((n) => n.id !== id),
    })),

  noLeidasCount: (usuarioId) =>
    get().notificaciones.filter(
      (n) => n.destinatarioId === usuarioId && !n.leida
    ).length,

    agregarNotificacion: (n) =>
    set((s) => ({
      notificaciones: [{ ...n, id: `NTF_${Date.now()}` }, ...s.notificaciones],
    })),
}))
