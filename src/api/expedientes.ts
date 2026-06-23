import { api } from './client'
import type { Actividad, ChecklistItem, Expediente, FiltrosExpediente, Reply, SubActividad } from '../types'

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
