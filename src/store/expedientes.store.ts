import { create } from 'zustand'
import type { Actividad, Expediente, ItemQueue, FiltrosExpediente } from '../types'
import { QUEUE_MESA, EXPEDIENTES_ABOGADO, EXPEDIENTE_DETALLE } from '../data/expedientes.mock'

interface ExpedientesState {
  queue: ItemQueue[]
  expedientes: Expediente[]
  expedienteActivo: Expediente | null
  filtros: FiltrosExpediente
  setExpedienteActivo: (id: string) => void
  actualizarCampoMesa: (id: string, campo: string, valor: unknown) => void
  actualizarCampoAbogado: (id: string, campo: string, valor: unknown) => void
  actualizarEstado: (id: string, estado: string) => void
  asignarAbogado: (expedienteId: string, abogadoId: string) => void
  agregarActividad: (expedienteId: string, actividad: Actividad) => void
  setFiltros: (filtros: FiltrosExpediente) => void
}

export const useExpedientesStore = create<ExpedientesState>((set, get) => ({
  queue: QUEUE_MESA,
  expedientes: [EXPEDIENTE_DETALLE, ...EXPEDIENTES_ABOGADO],
  expedienteActivo: null,
  filtros: {},

  setExpedienteActivo: (id) => {
    const exp = get().expedientes.find(e => e.id === id) ?? null
    set({ expedienteActivo: exp })
  },

  actualizarCampoMesa: (id, campo, valor) => set(s => ({
    expedientes: s.expedientes.map(e =>
      e.id === id ? { ...e, campos_mesa: { ...e.campos_mesa, [campo]: valor } } : e
    ),
  })),

  actualizarCampoAbogado: (id, campo, valor) => set(s => ({
    expedientes: s.expedientes.map(e =>
      e.id === id ? { ...e, campos_abogado: { ...e.campos_abogado, [campo]: valor } } : e
    ),
  })),

  actualizarEstado: (id, estado) => set(s => ({
    expedientes: s.expedientes.map(e => e.id === id ? { ...e, estado } : e),
    expedienteActivo: s.expedienteActivo && s.expedienteActivo.id === id
      ? { ...s.expedienteActivo, estado }
      : s.expedienteActivo,
  })),

  asignarAbogado: (expedienteId, abogadoId) => set(s => ({
    expedientes: s.expedientes.map(e =>
      e.id === expedienteId ? { ...e, abogado_id: abogadoId } : e
    ),
  })),

  agregarActividad: (expedienteId, actividad) => set(s => ({
    expedientes: s.expedientes.map(e =>
      e.id === expedienteId ? { ...e, timeline: [...e.timeline, actividad] } : e
    ),
    expedienteActivo: s.expedienteActivo?.id === expedienteId
      ? { ...s.expedienteActivo, timeline: [...s.expedienteActivo.timeline, actividad] }
      : s.expedienteActivo,
  })),

  setFiltros: (filtros) => set({ filtros }),
}))
