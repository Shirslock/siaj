import { create } from 'zustand'
import type { Usuario } from '../types'
import { USUARIOS } from '../data/usuarios'

interface UIState {
  usuarioActivo: Usuario | null
  sidebarCollapsed: boolean
  busquedaGlobal: string
  setUsuarioActivo: (id: string) => void
  toggleSidebar: () => void
  setBusquedaGlobal: (q: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  usuarioActivo: USUARIOS.find(u => u.id === 'UR_018') ?? null,
  sidebarCollapsed: false,
  busquedaGlobal: '',

  setUsuarioActivo: (id) => {
    const usuario = USUARIOS.find(u => u.id === id) ?? null
    if (usuario) {
      try { sessionStorage.setItem('siaj_usuario_activo', id) } catch { /* storage no disponible */ }
    }
    set({ usuarioActivo: usuario })
  },

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setBusquedaGlobal: (q) => set({ busquedaGlobal: q }),
}))

const savedId = (() => { try { return sessionStorage.getItem('siaj_usuario_activo') } catch { return null } })()
if (savedId) useUIStore.getState().setUsuarioActivo(savedId)
