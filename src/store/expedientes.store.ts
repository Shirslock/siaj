import { create } from 'zustand'
import type { Actividad, ChecklistItem, Expediente, ItemQueue, FiltrosExpediente, Tarea, VinculoExpediente, Interviniente, SubActividad, RegistroActividadPenal, Reply } from '../types'
import { QUEUE_MESA, EXPEDIENTES_ABOGADO, EXPEDIENTE_DETALLE, EXPEDIENTE_PENAL_MOCK, EXPEDIENTE_CERRADO_MOCK, EXPEDIENTE_COBRO_CANON_MOCK, EXPEDIENTE_DEMANDA_VENCIMIENTO_MOCK } from '../data/expedientes.mock'

interface ExpedientesState {
  queue: ItemQueue[]
  expedientes: Expediente[]
  expedienteActivo: Expediente | null
  filtros: FiltrosExpediente
  tareasMap: Record<string, Tarea[]>
  registrosPenales: Record<string, RegistroActividadPenal[]>
  setExpedienteActivo: (id: string) => void
  actualizarExpediente: (id: string, patch: Partial<Expediente>) => void
  actualizarCampoMesa: (id: string, campo: string, valor: unknown) => void
  actualizarCampoAbogado: (id: string, campo: string, valor: unknown) => void
  actualizarEstado: (id: string, estado: string) => void
  asignarAbogado: (expedienteId: string, abogadoId: string) => void
  agregarActividad: (expedienteId: string, actividad: Actividad) => void
  agregarSubitem: (expedienteId: string, actividadId: string, subitem: SubActividad) => void
  vincularExpediente: (expedienteId: string, vinculo: VinculoExpediente) => void
  desvincularExpediente: (expedienteId: string, vinculoId: string) => void
  agregarInterviniente: (expedienteId: string, interviniente: Interviniente) => void
  eliminarInterviniente: (expedienteId: string, intervinienteId: string) => void
  setFiltros: (filtros: FiltrosExpediente) => void
  inicializarTareas: (expId: string, estadoCodigo: string, tareas: Tarea[]) => void
  actualizarTarea: (expId: string, estadoCodigo: string, tareaId: string, cambios: Partial<Tarea>) => void
  actualizarChecklist: (expId: string, actividadIndex: number, checklist: ChecklistItem[]) => void
  eliminarDocumento: (expedienteId: string, index: number) => void
  agregarReply: (expId: string, actividadIdx: number, reply: Omit<Reply, 'id' | 'created_at'>) => void
  agregarRegistroPenal: (expId: string, registro: RegistroActividadPenal) => void
  actualizarRegistroPenal: (expId: string, registroId: string, cambios: Partial<RegistroActividadPenal>) => void
  eliminarRegistroPenal: (expId: string, registroId: string) => void
}

function applyToArr(exps: Expediente[], id: string, fn: (e: Expediente) => Expediente): Expediente[] {
  return exps.map(e => e.id === id ? fn(e) : e)
}

function applyToActivo(activo: Expediente | null, id: string, fn: (e: Expediente) => Expediente): Expediente | null {
  return activo?.id === id ? fn(activo) : activo
}

export const useExpedientesStore = create<ExpedientesState>((set, get) => ({
  queue: QUEUE_MESA,
  expedientes: [EXPEDIENTE_DETALLE, EXPEDIENTE_PENAL_MOCK, EXPEDIENTE_CERRADO_MOCK, EXPEDIENTE_COBRO_CANON_MOCK, EXPEDIENTE_DEMANDA_VENCIMIENTO_MOCK, ...EXPEDIENTES_ABOGADO],
  expedienteActivo: null,
  filtros: {},
  tareasMap: {
    'C-0026/2026__EN_PRUEBA': [
      { id: 'DC_EP_01', nombre: 'Producción de prueba documental',  estado: 'en_curso',   fecha: null, fechaVencimiento: '2026-06-23', fecha_aviso: '2026-05-20', alertaActiva: true,  diasAlerta: 34, observaciones: '', docGde: null },
      { id: 'DC_EP_02', nombre: 'Seguimiento de peritos',           estado: 'cumplido',   fecha: '2026-04-10', fechaVencimiento: null, fecha_aviso: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_EP_03', nombre: 'Control de audiencias de prueba',  estado: 'sin_estado', fecha: null, fechaVencimiento: null, fecha_aviso: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  registrosPenales: {},

  setExpedienteActivo: (id) => {
    const exp = get().expedientes.find(e => e.id === id) ?? null
    set({ expedienteActivo: exp })
  },

  actualizarExpediente: (id, patch) => set(s => {
    const fn = (e: Expediente) => ({ ...e, ...patch })
    return {
      expedientes: applyToArr(s.expedientes, id, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, id, fn),
    }
  }),

  actualizarCampoMesa: (id, campo, valor) => set(s => {
    const fn = (e: Expediente) => ({ ...e, campos_mesa: { ...e.campos_mesa, [campo]: valor } })
    return {
      expedientes: applyToArr(s.expedientes, id, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, id, fn),
    }
  }),

  actualizarCampoAbogado: (id, campo, valor) => set(s => {
    const fn = (e: Expediente) => ({ ...e, campos_abogado: { ...e.campos_abogado, [campo]: valor } })
    return {
      expedientes: applyToArr(s.expedientes, id, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, id, fn),
    }
  }),

  actualizarEstado: (id, estado) => set(s => {
    const fn = (e: Expediente) => ({ ...e, estado })
    return {
      expedientes: applyToArr(s.expedientes, id, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, id, fn),
    }
  }),

  asignarAbogado: (expedienteId, abogadoId) => set(s => {
    const fn = (e: Expediente) => ({ ...e, abogado_id: abogadoId })
    return {
      expedientes: applyToArr(s.expedientes, expedienteId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, fn),
    }
  }),

  agregarActividad: (expedienteId, actividad) => set(s => {
    const fn = (e: Expediente) => ({ ...e, timeline: [...e.timeline, actividad] })
    return {
      expedientes: applyToArr(s.expedientes, expedienteId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, fn),
    }
  }),

  agregarSubitem: (expedienteId, actividadId, subitem) => set(s => {
    const fn = (e: Expediente) => ({
      ...e,
      timeline: e.timeline.map(act =>
        act.id === actividadId
          ? { ...act, subitems: [...(act.subitems ?? []), subitem] }
          : act
      ),
    })
    return {
      expedientes: applyToArr(s.expedientes, expedienteId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, fn),
    }
  }),

  vincularExpediente: (expedienteId, vinculo) => set(s => {
    const fn = (e: Expediente) => ({ ...e, vinculos: [...e.vinculos, vinculo] })
    return {
      expedientes: applyToArr(s.expedientes, expedienteId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, fn),
    }
  }),

  desvincularExpediente: (expedienteId, vinculoId) => set(s => {
    const fn = (e: Expediente) => ({ ...e, vinculos: e.vinculos.filter(v => v.id !== vinculoId) })
    return {
      expedientes: applyToArr(s.expedientes, expedienteId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, fn),
    }
  }),

  agregarInterviniente: (expedienteId, interviniente) => set(s => {
    const fn = (e: Expediente) => ({ ...e, intervinientes: [...e.intervinientes, interviniente] })
    return {
      expedientes: applyToArr(s.expedientes, expedienteId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, fn),
    }
  }),

  eliminarInterviniente: (expedienteId, intervinienteId) => set(s => {
    const fn = (e: Expediente) => ({ ...e, intervinientes: e.intervinientes.filter(i => i.id !== intervinienteId) })
    return {
      expedientes: applyToArr(s.expedientes, expedienteId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, fn),
    }
  }),

  eliminarDocumento: (expedienteId, index) => set(s => {
    const fn = (e: Expediente) => ({ ...e, documentos: e.documentos.filter((_, i) => i !== index) })
    return {
      expedientes: applyToArr(s.expedientes, expedienteId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, fn),
    }
  }),

  setFiltros: (filtros) => set({ filtros }),

  inicializarTareas: (expId, estadoCodigo, tareas) => set(s => ({
    tareasMap: { ...s.tareasMap, [`${expId}__${estadoCodigo}`]: tareas },
  })),

  actualizarTarea: (expId, estadoCodigo, tareaId, cambios) => set(s => {
    const key = `${expId}__${estadoCodigo}`
    const tareas = s.tareasMap[key] ?? []
    return {
      tareasMap: {
        ...s.tareasMap,
        [key]: tareas.map(t => t.id === tareaId ? { ...t, ...cambios } : t),
      },
    }
  }),

  actualizarChecklist: (expId, actividadIndex, checklist) => set(s => {
    const fn = (e: Expediente) => ({
      ...e,
      timeline: e.timeline.map((t, i) => i === actividadIndex ? { ...t, checklist } : t),
    })
    return {
      expedientes: applyToArr(s.expedientes, expId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expId, fn),
    }
  }),

  agregarReply: (expId, actividadIdx, replyData) => set(s => {
    const fn = (e: Expediente) => ({
      ...e,
      timeline: e.timeline.map((act, idx) => {
        if (idx !== actividadIdx) return act
        const nuevoReply: Reply = {
          ...replyData,
          id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
        }
        return { ...act, replies: [...(act.replies ?? []), nuevoReply] }
      }),
    })
    return {
      expedientes: applyToArr(s.expedientes, expId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expId, fn),
    }
  }),

  agregarRegistroPenal: (expId, registro) => set(s => ({
    registrosPenales: {
      ...s.registrosPenales,
      [expId]: [...(s.registrosPenales[expId] ?? []), registro],
    },
  })),

  actualizarRegistroPenal: (expId, registroId, cambios) => set(s => ({
    registrosPenales: {
      ...s.registrosPenales,
      [expId]: (s.registrosPenales[expId] ?? []).map(r =>
        r.id === registroId ? { ...r, ...cambios } : r
      ),
    },
  })),

  eliminarRegistroPenal: (expId, registroId) => set(s => ({
    registrosPenales: {
      ...s.registrosPenales,
      [expId]: (s.registrosPenales[expId] ?? []).filter(r => r.id !== registroId),
    },
  })),
}))
