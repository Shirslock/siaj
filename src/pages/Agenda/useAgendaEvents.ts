import { useMemo } from 'react'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { useTareasStore } from '../../store/tareas.store'
import { AUDIENCIAS_MOCK } from '../../data/audiencias.mock'
import type { AgendaEvent } from '../../types'

export function useAgendaEvents() {
  const { expedientes, tareasMap } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const tareasKanban = useTareasStore(s => s.tareas)

  return useMemo(() => {
    const eventos: AgendaEvent[] = []

    expedientes.forEach(exp => {
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
                tipo: 'TAREA',
              })
            }
          })
        })

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
            tipo: act.tipo === 'AUDIENCIA' ? 'AUDIENCIA' : 'ACTIVIDAD',
          })
        }
      })
    })

    const esReferente    = usuarioActivo?.rolSistema === 'REFERENTE'
    const esCoordinador  = usuarioActivo?.rolSistema === 'COORDINADOR'

    // Filtro base por rol
    let eventosBase: AgendaEvent[]
    if (!usuarioActivo || esReferente) {
      eventosBase = eventos
    } else if (esCoordinador) {
      // Coordinador ve su área
      const misAreas = usuarioActivo.areas ?? []
      eventosBase = eventos.filter(e => misAreas.includes(e.area))
    } else {
      // Abogado: solo los suyos
      eventosBase = eventos.filter(e => e.abogado_id === usuarioActivo.id)
    }

    // Audiencias mock: abogado ve las suyas + audiencias de su área
    const audiencias: AgendaEvent[] = AUDIENCIAS_MOCK.filter(a => {
      if (!usuarioActivo || esReferente) return true
      if (esCoordinador) return (usuarioActivo.areas ?? []).includes(a.area)
      // Abogado: las propias + audiencias del área (para poder filtrar)
      return a.area === (expedientes.find(e => e.abogado_id === usuarioActivo.id)?.area ?? a.area)
    })

    // Kanban
    const eventosKanban: AgendaEvent[] = tareasKanban
      .filter(t =>
        t.mostrar_en_agenda &&
        t.fecha_limite &&
        (esReferente || esCoordinador ||
         t.asignado_a === usuarioActivo?.id ||
         t.creado_por === usuarioActivo?.id)
      )
      .map(t => ({
        id: `KANBAN_${t.id}`,
        expediente_id: t.expediente_id,
        actividad_id: t.id,
        titulo: t.titulo,
        fecha_vencimiento: t.fecha_limite!,
        estado: 'PENDIENTE',
        abogado_id: t.asignado_a,
        area: t.expediente_area,
        tipo: 'TAREA' as const,
      }))

    return [...eventosBase, ...audiencias, ...eventosKanban]
  }, [expedientes, tareasMap, usuarioActivo, tareasKanban])
}