import type { Tarea } from '../types'

const HOY = new Date().toISOString().split('T')[0]

export interface AlertaExpediente {
  activa: boolean
  fechaVencimiento?: string
  nombreTarea?: string
}

export function getAlertaExpediente(
  expId: string,
  tareasMap: Record<string, Tarea[]>
): AlertaExpediente {
  const tareasConAlerta = Object.keys(tareasMap)
    .filter(k => k.startsWith(`${expId}__`))
    .flatMap(k => tareasMap[k] ?? [])
    .filter(t =>
      t.fecha_aviso &&
      t.fecha_aviso <= HOY &&
      t.estado !== 'cumplido' &&
      t.estado !== 'no_procedente'
    )
    .sort((a, b) => {
      if (!a.fechaVencimiento) return 1
      if (!b.fechaVencimiento) return -1
      return a.fechaVencimiento.localeCompare(b.fechaVencimiento)
    })

  if (tareasConAlerta.length === 0) return { activa: false }
  return {
    activa: true,
    fechaVencimiento: tareasConAlerta[0].fechaVencimiento ?? undefined,
    nombreTarea: tareasConAlerta[0].nombre,
  }
}
