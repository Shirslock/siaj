import { create } from 'zustand'
import type { Usuario } from '../types'
import { USUARIOS } from '../data/usuarios'

interface Toast {
  id: string
  mensaje: string
  tipo: 'success' | 'error' | 'warn' | 'info'
}

interface UIState {
  usuarioActivo: Usuario | null
  sidebarCollapsed: boolean
  toasts: Toast[]
  setUsuarioActivo: (id: string) => void
  toggleSidebar: () => void
  showToast: (mensaje: string, tipo: Toast['tipo']) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  usuarioActivo: USUARIOS.find(u => u.id === 'UR_018') ?? null,
  sidebarCollapsed: false,
  toasts: [],

  setUsuarioActivo: (id) => {
    const usuario = USUARIOS.find(u => u.id === id) ?? null
    if (usuario) {
      try { sessionStorage.setItem('siaj_usuario_activo', id) } catch { /* storage no disponible */ }
    }
    set({ usuarioActivo: usuario })
  },

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  showToast: (mensaje, tipo) => {
    const id = Date.now().toString()
    set(s => ({ toasts: [...s.toasts, { id, mensaje, tipo }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 4000)
  },

  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

const savedId = (() => { try { return sessionStorage.getItem('siaj_usuario_activo') } catch { return null } })()
if (savedId) useUIStore.getState().setUsuarioActivo(savedId)
