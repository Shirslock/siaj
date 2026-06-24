import { api } from './client'
import type { CatalogoItem } from '../types'

export async function getCatalogo(tipo: string): Promise<{ data: CatalogoItem[] }> {
  return api.get(`/api/catalogos/${tipo}`)
}

export async function agregarItemCatalogo(tipo: string, item: Partial<CatalogoItem>): Promise<{ data: CatalogoItem }> {
  return api.post(`/api/catalogos/${tipo}`, item)
}

export async function editarItemCatalogo(tipo: string, id: string, cambios: Partial<CatalogoItem>): Promise<{ data: CatalogoItem }> {
  return api.patch(`/api/catalogos/${tipo}/${id}`, cambios)
}

export async function getUsuarios(): Promise<{ data: any[] }> {
  return api.get('/api/usuarios')
}
