import type { Tarea, Expediente, Actividad } from '../types'

const HOY = new Date().toISOString().split('T')[0]

export type EstadoAlerta = 'vencido' | 'por_vencer' | 'ninguna'

export interface AlertaExpediente {
  estado:            EstadoAlerta
  activa:            boolean
  fechaVencimiento?: string
  nombreElemento?:   string
  // compat alias
  nombreTarea?:      string
}

type ElementoConFecha = {
  fecha_vencimiento: string
  fecha_aviso?:      string
  nombre:            string
}

export function getAlertaExpediente(
  expId: string,
  tareasMap: Record<string, Tarea[]>,
  timeline?: Actividad[],
): AlertaExpediente {
  const elementos: ElementoConFecha[] = []

  // Tareas del tareasMap
  Object.keys(tareasMap)
    .filter(k => k.startsWith(`${expId}__`))
    .flatMap(k => tareasMap[k] ?? [])
    .filter(t =>
      t.fecha_vencimiento &&
      t.estado !== 'cumplido' &&
      t.estado !== 'no_procedente'
    )
    .forEach(t => elementos.push({
      fecha_vencimiento: t.fecha_vencimiento!,
      fecha_aviso:       t.fecha_aviso,
      nombre:            t.nombre,
    }))

  // Replies del timeline
  ;(timeline ?? [])
    .flatMap(act => act.replies ?? [])
    .filter(r => r.fecha_vencimiento)
    .forEach(r => elementos.push({
      fecha_vencimiento: r.fecha_vencimiento!,
      fecha_aviso:       r.fecha_aviso ?? undefined,
      nombre:            'Comentario',
    }))

  // Actividades genéricas con vencimiento
  ;(timeline ?? [])
    .filter(act => (act as any).fecha_vencimiento)
    .forEach(act => elementos.push({
      fecha_vencimiento: (act as any).fecha_vencimiento,
      fecha_aviso:       (act as any).fecha_aviso,
      nombre:            act.titulo,
    }))

  if (elementos.length === 0) return { estado: 'ninguna', activa: false }

  const vencidos  = elementos.filter(e => e.fecha_vencimiento <= HOY)
  const porVencer = elementos.filter(e =>
    e.fecha_aviso &&
    e.fecha_aviso <= HOY &&
    e.fecha_vencimiento > HOY
  )

  if (vencidos.length > 0) {
    vencidos.sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
    return {
      estado:           'vencido',
      activa:           true,
      fechaVencimiento: vencidos[0].fecha_vencimiento,
      nombreElemento:   vencidos[0].nombre,
      nombreTarea:      vencidos[0].nombre,
    }
  }

  if (porVencer.length > 0) {
    porVencer.sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
    return {
      estado:           'por_vencer',
      activa:           true,
      fechaVencimiento: porVencer[0].fecha_vencimiento,
      nombreElemento:   porVencer[0].nombre,
      nombreTarea:      porVencer[0].nombre,
    }
  }

  return { estado: 'ninguna', activa: false }
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
