import { api } from './client'
import type { Actividad, ChecklistItem, Documento, Expediente, FiltrosExpediente, Interviniente, LogAuditoria, RegistroActividadPenal, Reply, SubActividad, Tarea, VinculoExpediente } from '../types'

export interface ListaExpedientesResponse {
  data: {
    items: Expediente[]
    total: number
    page: number
    limit: number
  }
}

export interface ExpedienteResponse {
  data: Expediente
}

export async function getExpedientes(filtros: FiltrosExpediente & { page?: number; limit?: number }): Promise<ListaExpedientesResponse> {
  const params = new URLSearchParams()
  if (filtros.area) params.set('area', filtros.area)
  if (filtros.tipo) params.set('tipo', filtros.tipo)
  if (filtros.estado) params.set('estado', filtros.estado)
  if (filtros.abogado_id) params.set('abogado_id', filtros.abogado_id)
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda)
  if (filtros.page) params.set('page', String(filtros.page))
  if (filtros.limit) params.set('limit', String(filtros.limit))
  const qs = params.toString()
  return api.get(`/api/expedientes${qs ? `?${qs}` : ''}`)
}

// El backend retorna 'actividades' y 'vinculos_origen'/'vinculos_destino';
// el frontend espera 'timeline' y 'vinculos'.
function normalizarExpediente(raw: Record<string, unknown>): Expediente {
  const { actividades, vinculos_origen, vinculos_destino, ...rest } = raw as {
    actividades?: unknown[]
    vinculos_origen?: unknown[]
    vinculos_destino?: unknown[]
    [k: string]: unknown
  }
  return {
    ...rest,
    timeline: (actividades ?? []) as Expediente['timeline'],
    vinculos: [...(vinculos_origen ?? []), ...(vinculos_destino ?? [])] as Expediente['vinculos'],
    intervinientes: (rest.intervinientes ?? []) as Expediente['intervinientes'],
    documentos: (rest.documentos ?? []) as Expediente['documentos'],
  } as Expediente
}

export async function getExpediente(id: string): Promise<ExpedienteResponse> {
  const [serie, anio] = id.split('/')
  const res = await api.get<{ data: Record<string, unknown> }>(`/api/expedientes/${serie}/${anio}`)
  return { data: normalizarExpediente(res.data) }
}

export async function crearExpediente(body: Partial<Expediente>): Promise<ExpedienteResponse> {
  return api.post('/api/expedientes', body)
}

export async function getQueue(): Promise<{ data: Expediente[] }> {
  return api.get('/api/expedientes/queue')
}

export async function actualizarExpediente(id: string, patch: Partial<Expediente>): Promise<ExpedienteResponse> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}`, patch)
}

export async function actualizarCampoMesa(id: string, campo: string, valor: unknown): Promise<ExpedienteResponse> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/campos-mesa`, { campo, valor })
}

export async function actualizarCampoAbogado(id: string, campo: string, valor: unknown): Promise<ExpedienteResponse> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/campos-abogado`, { campo, valor })
}

export async function actualizarEstado(id: string, estadoProcesal: string): Promise<ExpedienteResponse> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/estado`, { estadoProcesal })
}

export async function asignarAbogado(id: string, abogado_id: string): Promise<ExpedienteResponse> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/asignar`, { abogado_id })
}

export async function agregarActividad(id: string, actividad: Partial<Actividad>): Promise<{ data: Actividad }> {
  const [serie, anio] = id.split('/')
  return api.post(`/api/expedientes/${serie}/${anio}/actividades`, actividad)
}

export async function agregarReply(id: string, actividadId: string, reply: Partial<Reply>): Promise<{ data: Reply }> {
  const [serie, anio] = id.split('/')
  return api.post(`/api/expedientes/${serie}/${anio}/actividades/${actividadId}/replies`, reply)
}

export async function actualizarChecklist(id: string, actividadId: string, checklist: ChecklistItem[]): Promise<{ data: Actividad }> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/actividades/${actividadId}/checklist`, { checklist })
}

export async function agregarSubitem(id: string, actividadId: string, subitem: SubActividad): Promise<{ data: Actividad }> {
  const [serie, anio] = id.split('/')
  return api.post(`/api/expedientes/${serie}/${anio}/actividades/${actividadId}/subitems`, subitem)
}

export async function editarActividad(id: string, actividadId: string, cambios: Partial<Actividad>): Promise<{ data: Actividad }> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/actividades/${actividadId}`, cambios)
}

export async function eliminarActividad(id: string, actividadId: string): Promise<{ ok: boolean }> {
  const [serie, anio] = id.split('/')
  return api.delete(`/api/expedientes/${serie}/${anio}/actividades/${actividadId}`)
}

export async function getLogAuditoria(id: string): Promise<{ data: LogAuditoria[] }> {
  const [serie, anio] = id.split('/')
  return api.get(`/api/expedientes/${serie}/${anio}/log-auditoria`)
}

// Tareas
export async function getTareas(id: string, estadoCodigo: string): Promise<{ data: Tarea[] }> {
  const [serie, anio] = id.split('/')
  return api.get(`/api/expedientes/${serie}/${anio}/tareas/${estadoCodigo}`)
}

export async function inicializarTareas(id: string, estadoCodigo: string, tareas: Tarea[]): Promise<{ data: Tarea[] }> {
  const [serie, anio] = id.split('/')
  return api.post(`/api/expedientes/${serie}/${anio}/tareas/${estadoCodigo}`, { tareas })
}

export async function actualizarTarea(id: string, estadoCodigo: string, tareaId: string, cambios: Partial<Tarea>): Promise<{ data: Tarea }> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/tareas/${estadoCodigo}/${tareaId}`, cambios)
}

// Intervinientes
export async function agregarInterviniente(id: string, interviniente: Partial<Interviniente>): Promise<{ data: Interviniente }> {
  const [serie, anio] = id.split('/')
  return api.post(`/api/expedientes/${serie}/${anio}/intervinientes`, interviniente)
}

export async function editarInterviniente(id: string, intId: string, cambios: Partial<Interviniente>): Promise<{ data: Interviniente }> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/intervinientes/${intId}`, cambios)
}

export async function eliminarInterviniente(id: string, intId: string): Promise<{ ok: boolean }> {
  const [serie, anio] = id.split('/')
  return api.delete(`/api/expedientes/${serie}/${anio}/intervinientes/${intId}`)
}

// Documentos
export async function agregarDocumento(id: string, doc: Partial<Documento>): Promise<{ data: Documento }> {
  const [serie, anio] = id.split('/')
  return api.post(`/api/expedientes/${serie}/${anio}/documentos`, doc)
}

export async function eliminarDocumento(id: string, docId: string): Promise<{ ok: boolean }> {
  const [serie, anio] = id.split('/')
  return api.delete(`/api/expedientes/${serie}/${anio}/documentos/${docId}`)
}

export async function reordenarDocumentos(id: string, orden: string[]): Promise<{ ok: boolean }> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/documentos/reordenar`, { orden })
}

// Registros penales
export async function agregarRegistroPenal(id: string, registro: Partial<RegistroActividadPenal>): Promise<{ data: RegistroActividadPenal }> {
  const [serie, anio] = id.split('/')
  return api.post(`/api/expedientes/${serie}/${anio}/registros-penales`, registro)
}

export async function actualizarRegistroPenal(id: string, regId: string, cambios: Partial<RegistroActividadPenal>): Promise<{ data: RegistroActividadPenal }> {
  const [serie, anio] = id.split('/')
  return api.patch(`/api/expedientes/${serie}/${anio}/registros-penales/${regId}`, cambios)
}

export async function eliminarRegistroPenal(id: string, regId: string): Promise<{ ok: boolean }> {
  const [serie, anio] = id.split('/')
  return api.delete(`/api/expedientes/${serie}/${anio}/registros-penales/${regId}`)
}

// Vínculos
export async function vincularExpediente(id: string, vinculo: Partial<VinculoExpediente>): Promise<{ data: VinculoExpediente }> {
  const [serie, anio] = id.split('/')
  return api.post(`/api/expedientes/${serie}/${anio}/vinculos`, vinculo)
}

export async function desvincularExpediente(id: string, vinculoId: string): Promise<{ ok: boolean }> {
  const [serie, anio] = id.split('/')
  return api.delete(`/api/expedientes/${serie}/${anio}/vinculos/${vinculoId}`)
}
