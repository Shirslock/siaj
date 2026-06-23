import { create } from 'zustand'
import type { Actividad, ChecklistItem, Documento, Expediente, FiltrosExpediente, Tarea, VinculoExpediente, Interviniente, SubActividad, RegistroActividadPenal, Reply } from '../types'
import {
  getExpedientes,
  getExpediente,
  getQueue,
  crearExpediente,
  actualizarExpediente as actualizarExpedienteApi,
  actualizarCampoMesa as actualizarCampoMesaApi,
  actualizarCampoAbogado as actualizarCampoAbogadoApi,
  actualizarEstado as actualizarEstadoApi,
  asignarAbogado as asignarAbogadoApi,
  agregarActividad as agregarActividadApi,
  agregarReply as agregarReplyApi,
  actualizarChecklist as actualizarChecklistApi,
  agregarSubitem as agregarSubitemApi,
} from '../api/expedientes'

interface ExpedientesState {
  queue: Expediente[]
  expedientes: Expediente[]
  expedienteActivo: Expediente | null
  filtros: FiltrosExpediente
  tareasMap: Record<string, Tarea[]>
  registrosPenales: Record<string, RegistroActividadPenal[]>
  cargando: boolean
  altaExpediente: (body: Partial<Expediente>) => Promise<Expediente>
  cargarExpedientes: (filtros?: FiltrosExpediente) => Promise<void>
  cargarQueue: () => Promise<void>
  setExpedienteActivo: (id: string) => Promise<void>
  actualizarExpediente: (id: string, patch: Partial<Expediente>) => Promise<void>
  actualizarCampoMesa: (id: string, campo: string, valor: unknown) => Promise<void>
  actualizarCampoAbogado: (id: string, campo: string, valor: unknown) => Promise<void>
  actualizarEstado: (id: string, estado: string) => Promise<void>
  asignarAbogado: (expedienteId: string, abogadoId: string) => Promise<void>
  agregarActividad: (expedienteId: string, actividad: Actividad) => Promise<void>
  agregarSubitem: (expedienteId: string, actividadId: string, subitem: SubActividad) => Promise<void>
  vincularExpediente: (expedienteId: string, vinculo: VinculoExpediente) => void
  desvincularExpediente: (expedienteId: string, vinculoId: string) => void
  agregarInterviniente: (expedienteId: string, interviniente: Interviniente) => void
  eliminarInterviniente: (expedienteId: string, intervinienteId: string) => void
  editarInterviniente: (expId: string, intId: string, cambios: Partial<Interviniente>) => void
  setFiltros: (filtros: FiltrosExpediente) => void
  inicializarTareas: (expId: string, estadoCodigo: string, tareas: Tarea[]) => void
  actualizarTarea: (expId: string, estadoCodigo: string, tareaId: string, cambios: Partial<Tarea>) => void
  actualizarChecklist: (expId: string, actividadIndex: number, checklist: ChecklistItem[]) => Promise<void>
  agregarDocumento: (expId: string, doc: Documento) => void
  eliminarDocumento: (expedienteId: string, docId: string) => void
  reordenarDocumentos: (expId: string, ordenNuevo: string[]) => void
  agregarReply: (expId: string, actividadIdx: number, reply: Omit<Reply, 'id' | 'created_at'>) => Promise<void>
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
  queue: [],
  expedientes: [],
  expedienteActivo: null,
  filtros: {},
  tareasMap: {},
  registrosPenales: {},
  cargando: false,

  altaExpediente: async (body) => {
    const res = await crearExpediente(body)
    const nuevo = res.data
    set(s => ({ expedientes: [nuevo, ...s.expedientes] }))
    return nuevo
  },

  cargarExpedientes: async (filtros?) => {
    set({ cargando: true })
    try {
      const res = await getExpedientes(filtros ?? get().filtros)
      set({ expedientes: res.data.items })
    } finally {
      set({ cargando: false })
    }
  },

  cargarQueue: async () => {
    set({ cargando: true })
    try {
      const res = await getQueue()
      set({ queue: res.data })
    } finally {
      set({ cargando: false })
    }
  },

  setExpedienteActivo: async (id) => {
    const cached = get().expedientes.find(e => e.id === id) ?? get().queue.find(e => e.id === id)
    if (cached) {
      set({ expedienteActivo: cached })
    }
    const res = await getExpediente(id)
    set({ expedienteActivo: res.data })
  },

  actualizarExpediente: async (id, patch) => {
    set(s => ({
      expedientes: applyToArr(s.expedientes, id, e => ({ ...e, ...patch })),
      expedienteActivo: applyToActivo(s.expedienteActivo, id, e => ({ ...e, ...patch })),
    }))
    await actualizarExpedienteApi(id, patch)
  },

  actualizarCampoMesa: async (id, campo, valor) => {
    set(s => ({
      expedientes: applyToArr(s.expedientes, id, e => ({ ...e, campos_mesa: { ...e.campos_mesa, [campo]: valor } })),
      expedienteActivo: applyToActivo(s.expedienteActivo, id, e => ({ ...e, campos_mesa: { ...e.campos_mesa, [campo]: valor } })),
    }))
    await actualizarCampoMesaApi(id, campo, valor)
  },

  actualizarCampoAbogado: async (id, campo, valor) => {
    set(s => ({
      expedientes: applyToArr(s.expedientes, id, e => ({ ...e, campos_abogado: { ...e.campos_abogado, [campo]: valor } })),
      expedienteActivo: applyToActivo(s.expedienteActivo, id, e => ({ ...e, campos_abogado: { ...e.campos_abogado, [campo]: valor } })),
    }))
    await actualizarCampoAbogadoApi(id, campo, valor)
  },

  actualizarEstado: async (id, estadoProcesal) => {
    set(s => ({
      expedientes: applyToArr(s.expedientes, id, e => ({ ...e, estadoProcesal })),
      expedienteActivo: applyToActivo(s.expedienteActivo, id, e => ({ ...e, estadoProcesal })),
    }))
    await actualizarEstadoApi(id, estadoProcesal)
  },

  asignarAbogado: async (expedienteId, abogadoId) => {
    set(s => ({
      expedientes: applyToArr(s.expedientes, expedienteId, e => ({ ...e, abogado_id: abogadoId })),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, e => ({ ...e, abogado_id: abogadoId })),
    }))
    await asignarAbogadoApi(expedienteId, abogadoId)
  },

  agregarActividad: async (expedienteId, actividad) => {
    set(s => ({
      expedienteActivo: s.expedienteActivo?.id === expedienteId
        ? { ...s.expedienteActivo, timeline: [...(s.expedienteActivo.timeline ?? []), { ...actividad, replies: [] }] }
        : s.expedienteActivo,
    }))
    await agregarActividadApi(expedienteId, actividad)
    const res = await getExpediente(expedienteId)
    set({ expedienteActivo: res.data })
  },

  agregarSubitem: async (expId, actividadId, subitem) => {
    const actividades = useExpedientesStore.getState().expedienteActivo?.timeline ?? []
    const actividadIdx = actividades.findIndex(a => a.id === actividadId)
    if (actividadIdx === -1) return
    await agregarSubitemApi(expId, actividadId, subitem)
    const res = await getExpediente(expId)
    set({ expedienteActivo: res.data })
  },

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

  editarInterviniente: (expId, intId, cambios) => set(s => {
    const fn = (e: Expediente) => ({
      ...e,
      intervinientes: e.intervinientes.map(i => i.id !== intId ? i : { ...i, ...cambios }),
    })
    return {
      expedientes: applyToArr(s.expedientes, expId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expId, fn),
    }
  }),

  agregarDocumento: (expId, doc) => set(s => {
    const fn = (e: Expediente) => ({ ...e, documentos: [...e.documentos, doc] })
    return {
      expedientes: applyToArr(s.expedientes, expId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expId, fn),
    }
  }),

  eliminarDocumento: (expedienteId, docId) => set(s => {
    const fn = (e: Expediente) => ({ ...e, documentos: e.documentos.filter(d => d.id !== docId) })
    return {
      expedientes: applyToArr(s.expedientes, expedienteId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expedienteId, fn),
    }
  }),

  reordenarDocumentos: (expId, ordenNuevo) => set(s => {
    const fn = (e: Expediente) => {
      const ordenados = ordenNuevo
        .map(id => e.documentos.find(d => d.id === id))
        .filter(Boolean) as Documento[]
      return { ...e, documentos: ordenados }
    }
    return {
      expedientes: applyToArr(s.expedientes, expId, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, expId, fn),
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

  actualizarChecklist: async (expId, actividadIndex, checklist) => {
    const actividades = useExpedientesStore.getState().expedienteActivo?.timeline ?? []
    const actividad = actividades[actividadIndex]
    if (!actividad?.id) return
    set(s => ({
      expedienteActivo: s.expedienteActivo ? {
        ...s.expedienteActivo,
        timeline: s.expedienteActivo.timeline?.map((a, i) =>
          i === actividadIndex ? { ...a, checklist } : a
        ) ?? [],
      } : null,
    }))
    await actualizarChecklistApi(expId, actividad.id, checklist)
  },

  agregarReply: async (expId, actividadIdx, replyData) => {
    const actividades = useExpedientesStore.getState().expedienteActivo?.timeline ?? []
    const actividad = actividades[actividadIdx]
    if (!actividad?.id) return
    await agregarReplyApi(expId, actividad.id, replyData)
    const res = await getExpediente(expId)
    set({ expedienteActivo: res.data })
  },

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
