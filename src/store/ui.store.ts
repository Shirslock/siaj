import { create } from 'zustand'
import type { Usuario } from '../types'
import { USUARIOS } from '../data/usuarios'

interface UIState {
  usuarioActivo: Usuario | null
  // PRD: el sidebar está oculto (off-canvas) por defecto y se abre con la hamburguesa del header.
  sidebarOpen: boolean
  busquedaGlobal: string
  setUsuarioActivo: (id: string) => void
  toggleSidebar: () => void
  closeSidebar: () => void
  setBusquedaGlobal: (q: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  usuarioActivo: USUARIOS.find(u => u.id === 'UR_018') ?? null,
  sidebarOpen: false,
  busquedaGlobal: '',

  setUsuarioActivo: (id) => {
    const usuario = USUARIOS.find(u => u.id === id) ?? null
    if (usuario) {
      try { sessionStorage.setItem('siaj_usuario_activo', id) } catch { /* storage no disponible */ }
    }
    set({ usuarioActivo: usuario })
  },

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  setBusquedaGlobal: (q) => set({ busquedaGlobal: q }),
}))

const savedId = (() => { try { return sessionStorage.getItem('siaj_usuario_activo') } catch { return null } })()
if (savedId) useUIStore.getState().setUsuarioActivo(savedId)
