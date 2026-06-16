import { create } from 'zustand'

export type TipoEventoCustom = 'reunion' | 'recordatorio' | 'vencimiento' | 'otro'

export interface EventoCustom {
  id: string
  titulo: string
  descripcion: string
  fecha: string   // YYYY-MM-DD
  hora?: string   // HH:MM opcional
  tipo: TipoEventoCustom
  creado_por: string   // usuarioActivo.id
  color: string   // clase Tailwind
}

interface AgendaState {
  eventosCustom: EventoCustom[]
  agregarEvento: (ev: Omit<EventoCustom, 'id'>) => void
  eliminarEvento: (id: string) => void
}

// Color por tipo de evento
export const COLOR_EVENTO: Record<TipoEventoCustom, string> = {
  reunion: 'bg-blue-100 text-blue-700',
  recordatorio: 'bg-yellow-100 text-yellow-700',
  vencimiento: 'bg-red-100 text-red-700',
  otro: 'bg-gray-100 text-gray-600',
}

export const useAgendaStore = create<AgendaState>((set) => ({
  eventosCustom: [],

  agregarEvento: (ev) =>
    set(state => ({
      eventosCustom: [
        ...state.eventosCustom,
        { ...ev, id: `CUSTOM_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` },
      ],
    })),

  eliminarEvento: (id) =>
    set(state => ({
      eventosCustom: state.eventosCustom.filter(e => e.id !== id),
    })),
}))
