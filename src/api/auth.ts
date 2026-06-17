import { api } from './client'

export interface LoginResponse {
  data: {
    token: string
    usuario: {
      id: string
      apellido: string
      nombre: string
      email: string
      rolBD: string
      roles: string[]
      rolSistema: string
      areas: string[]
      lineasPenal: string[] | null
      fifoOrder: Record<string, number> | null
    }
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/api/auth/login', { email, password })
}

export async function getMe(): Promise<{ data: LoginResponse['data']['usuario'] }> {
  return api.get('/api/auth/me')
}
