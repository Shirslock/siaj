import { api } from './client'
import type { Expediente, FiltrosExpediente } from '../types'

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

export async function getExpediente(id: string): Promise<ExpedienteResponse> {
  const [serie, anio] = id.split('/')
  return api.get(`/api/expedientes/${serie}/${anio}`)
}

export async function crearExpediente(body: Partial<Expediente>): Promise<ExpedienteResponse> {
  return api.post('/api/expedientes', body)
}

export async function getQueue(): Promise<{ data: Expediente[] }> {
  return api.get('/api/expedientes/queue')
}
