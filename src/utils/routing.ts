export const RUTAS = {
  DASHBOARD:       '/dashboard',
  MESA:            '/mesa',
  MESA_ALTA:       '/mesa/alta',
  ACTUACIONES:     '/actuaciones',
  BANDEJA_ABOGADO: '/bandeja/abogado',
  BANDEJA_AREA:    '/bandeja/area',
  EXPEDIENTE:      (id: string) => `/expediente/${id}`,
  ACTIVIDADES:     (id: string) => `/expediente/${id}/actividades`,
  CAUSA:           (numeroCausa: string) => `/causa/${numeroCausa}`,
  AGENDA:          '/agenda',
  NUEVA_ACTUACION_PENAL: '/actuaciones/nueva-penal',
} as const
