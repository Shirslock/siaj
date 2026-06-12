import { useMemo } from 'react'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import type { AgendaEvent } from '../../types'

export function useAgendaEvents() {
  const { expedientes, tareasMap } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  return useMemo(() => {
    const eventos: AgendaEvent[] = []

    expedientes.forEach(exp => {
      // Tareas con fechaVencimiento
      Object.entries(tareasMap)
        .filter(([k]) => k.startsWith(`${exp.id}__`))
        .forEach(([, tareas]) => {
          tareas.forEach(t => {
            if (t.fechaVencimiento && t.estado !== 'cumplido' && t.estado !== 'no_procedente') {
              eventos.push({
                id: `TAREA_${t.id}`,
                expediente_id: exp.id,
                actividad_id: t.id,
                titulo: t.nombre,
                fecha_vencimiento: t.fechaVencimiento,
                estado: 'EN_CURSO',
                abogado_id: exp.abogado_id ?? '',
                area: exp.area,
              })
            }
          })
        })

      // Actividades del timeline con fecha_vencimiento
      exp.timeline.forEach(act => {
        if (act.fecha_vencimiento) {
          eventos.push({
            id: `ACT_${act.id}`,
            expediente_id: exp.id,
            actividad_id: act.id ?? '',
            titulo: act.titulo,
            fecha_vencimiento: act.fecha_vencimiento,
            estado: act.estado ?? 'PENDIENTE',
            abogado_id: exp.abogado_id ?? '',
            area: exp.area,
          })
        }
      })
    })

    if (!usuarioActivo) return eventos
    if (usuarioActivo.rolSistema === 'REFERENTE' || usuarioActivo.rolSistema === 'COORDINADOR') {
      return eventos
    }
    return eventos.filter(e => e.abogado_id === usuarioActivo.id)
  }, [expedientes, tareasMap, usuarioActivo])
}