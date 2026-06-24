import { create } from 'zustand'

export interface MensajeChat {
  id: string
  rol: 'usuario' | 'asistente'
  contenido: string
  fuentes?: { documento: string; pagina: number }[]
  timestamp: Date
  estado: 'enviando' | 'ok' | 'error'
}

interface AIState {
  mensajes: MensajeChat[]
  cargando: boolean
  error: string | null
  agregarMensaje: (mensaje: Omit<MensajeChat, 'id' | 'timestamp'>) => void
  limpiarChat: () => void
  setCargando: (valor: boolean) => void
  setError: (error: string | null) => void
  consultarIA: (expedienteId: string, pregunta: string) => Promise<void>
}

export const useAIStore = create<AIState>((set, get) => ({
  mensajes: [],
  cargando: false,
  error: null,

  agregarMensaje: (mensaje) => set(s => ({
    mensajes: [...s.mensajes, {
      ...mensaje,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }],
  })),

  limpiarChat: () => set({ mensajes: [], error: null }),
  setCargando: (valor) => set({ cargando: valor }),
  setError: (error) => set({ error }),

  // Mock temporal — se reemplaza en SPEC-FE-12
  consultarIA: async (expedienteId, pregunta) => {
    const { agregarMensaje, setCargando } = get()
    agregarMensaje({ rol: 'usuario', contenido: pregunta, estado: 'ok' })
    setCargando(true)
    await new Promise(r => setTimeout(r, 1500))
    agregarMensaje({
      rol: 'asistente',
      contenido: `[Respuesta simulada] Consultaste sobre: "${pregunta}". Cuando el módulo de IA esté activo, responderé basándome en los documentos adjuntos al expediente ${expedienteId}.`,
      fuentes: [],
      estado: 'ok',
    })
    setCargando(false)
  },
}))
