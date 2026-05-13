export const RUTAS = {
  DASHBOARD:       '/dashboard',
  MESA:            '/mesa',
  MESA_ALTA:       '/mesa/alta',
  BANDEJA_ABOGADO: '/bandeja/abogado',
  BANDEJA_AREA:    '/bandeja/area',
  EXPEDIENTE:      (id: string) => `/expediente/${id}`,
  ACTIVIDADES:     (id: string) => `/expediente/${id}/actividades`,
  GESTION_PENAL:   '/penal',
  AGENDA:          '/agenda',
} as const
