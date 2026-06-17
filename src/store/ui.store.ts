import { create } from 'zustand'
import type { Usuario } from '../types'
import { login, getMe } from '../api/auth'

interface UIState {
  usuarioActivo: Usuario | null
  token: string | null
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  loginAsync: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useUIStore = create<UIState>((set) => ({
  usuarioActivo: null,
  token: null,
  sidebarCollapsed: false,

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  loginAsync: async (email, password) => {
    const res = await login(email, password)
    const { token, usuario } = res.data
    sessionStorage.setItem('siaj_token', token)
    set({ token, usuarioActivo: usuario as unknown as Usuario })
  },

  logout: () => {
    sessionStorage.removeItem('siaj_token')
    set({ usuarioActivo: null, token: null })
  },
}))

// Rehidratación al cargar si hay token
const savedToken = (() => { try { return sessionStorage.getItem('siaj_token') } catch { return null } })()
if (savedToken) {
  useUIStore.setState({ token: savedToken })
  getMe().then(res => {
    useUIStore.setState({ usuarioActivo: res.data as unknown as Usuario })
  }).catch(() => {
    sessionStorage.removeItem('siaj_token')
    useUIStore.setState({ token: null })
  })
}
