import { useMemo } from 'react'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { useTareasStore } from '../../store/tareas.store'
import type { AgendaEvent } from '../../types'

export function useAgendaEvents() {
  const { expedientes, tareasMap } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const tareasKanban = useTareasStore(s => s.tareas)

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

    const esReferente = usuarioActivo?.rolSistema === 'REFERENTE'
    const esCoordinador = usuarioActivo?.rolSistema === 'COORDINADOR'

    const eventosBase = !usuarioActivo || esReferente || esCoordinador
      ? eventos
      : eventos.filter(e => e.abogado_id === usuarioActivo.id)

    // Tareas Kanban con "mostrar en agenda" activado
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
      }))

    return [...eventosBase, ...eventosKanban]
  }, [expedientes, tareasMap, usuarioActivo, tareasKanban])
}