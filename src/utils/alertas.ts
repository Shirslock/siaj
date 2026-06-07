import type { Tarea, Expediente } from '../types'

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

export interface AlertaTimer {
  activa: boolean
  diasRestantes?: number
  fechaVencimiento?: string
}

export function getAlertaTimer(
  exp: Pick<Expediente, 'es_juicio_iniciado' | 'fecha_inicio_juicio' | 'fecha_ultimo_impulsorio'>
): AlertaTimer {
  if (!exp.es_juicio_iniciado) return { activa: false }
  const fechaBase = exp.fecha_ultimo_impulsorio ?? exp.fecha_inicio_juicio
  if (!fechaBase) return { activa: false }

  const base = new Date(fechaBase)
  const alerta = new Date(base)
  alerta.setDate(alerta.getDate() + 75)
  const vencimiento = new Date(base)
  vencimiento.setDate(vencimiento.getDate() + 90)

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  if (hoy < alerta) return { activa: false }

  const diasRestantes = Math.max(0, Math.ceil((vencimiento.getTime() - hoy.getTime()) / 86400000))
  return {
    activa: true,
    diasRestantes,
    fechaVencimiento: vencimiento.toISOString().split('T')[0],
  }
}
