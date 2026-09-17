import { create } from 'zustand'
import type { UIMessage } from 'ai'

// Historial de conversaciones con Boga, persistido 100% client-side en
// localStorage (no hay backend propio para esto — ver claude-docs/ASISTENTE_IA_CLAUDE.md).
// Limitación conocida y aceptada: no se sincroniza entre dispositivos/navegadores.

export interface BogaMensajeGuardado {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export interface BogaConversacion {
  id: string
  /** 'global' para el módulo de chat y el flotante, o el id de una actuación (exp.id) */
  scope: string
  titulo: string
  fechaCreacion: string
  fechaActualizacion: string
  mensajes: BogaMensajeGuardado[]
}

interface BogaHistorialState {
  conversaciones: BogaConversacion[]
  crearConversacion: (scope: string) => BogaConversacion
  actualizarMensajes: (id: string, mensajes: BogaMensajeGuardado[]) => void
  eliminarConversacion: (id: string) => void
}

const STORAGE_KEY = 'siaj_boga_historial'
const LARGO_TITULO = 48

function cargar(): BogaConversacion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function guardar(conversaciones: BogaConversacion[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversaciones)) } catch { /* storage no disponible */ }
}

function tituloDesdePrimeraPregunta(mensajes: BogaMensajeGuardado[]): string | null {
  const primeraPregunta = mensajes.find(m => m.role === 'user')?.text.trim().replace(/\s+/g, ' ')
  if (!primeraPregunta) return null
  return primeraPregunta.length > LARGO_TITULO ? `${primeraPregunta.slice(0, LARGO_TITULO)}…` : primeraPregunta
}

export const useBogaHistorialStore = create<BogaHistorialState>((set, get) => ({
  conversaciones: cargar(),

  crearConversacion: (scope) => {
    const ahora = new Date().toISOString()
    const nueva: BogaConversacion = {
      id: `boga_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      scope,
      titulo: 'Nueva conversación',
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
      mensajes: [],
    }
    const conversaciones = [nueva, ...get().conversaciones]
    set({ conversaciones })
    guardar(conversaciones)
    return nueva
  },

  actualizarMensajes: (id, mensajes) => {
    const conversaciones = get().conversaciones.map(c =>
      c.id === id
        ? { ...c, mensajes, fechaActualizacion: new Date().toISOString(), titulo: tituloDesdePrimeraPregunta(mensajes) ?? c.titulo }
        : c
    )
    set({ conversaciones })
    guardar(conversaciones)
  },

  eliminarConversacion: (id) => {
    const conversaciones = get().conversaciones.filter(c => c.id !== id)
    set({ conversaciones })
    guardar(conversaciones)
  },
}))

export function aMensajesGuardados(mensajes: UIMessage[]): BogaMensajeGuardado[] {
  return mensajes.map(m => ({
    id: m.id,
    role: m.role === 'user' ? 'user' : 'assistant',
    text: m.parts.filter(p => p.type === 'text').map(p => p.text).join(''),
  }))
}

export function aUIMessages(mensajes: BogaMensajeGuardado[]): UIMessage[] {
  return mensajes.map(m => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.text }],
  })) as UIMessage[]
}
