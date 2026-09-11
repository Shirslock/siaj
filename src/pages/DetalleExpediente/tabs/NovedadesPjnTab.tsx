import { usePjnStore } from '../../../store/pjn.store'
import { NovedadPjnCard } from '../../../components/pjn/NovedadPjnCard'
import { formatFecha } from '../../../utils/format'
import Icon from '../../../components/ui/Icon'
import type { Expediente } from '../../../types'

interface Props { exp: Expediente }

export function NovedadesPjnTab({ exp }: Props) {
  const { novedades } = usePjnStore()

  const novedadesDeEstaActuacion = novedades.filter(
    n => n.expediente_id === exp.id && n.estado === 'pendiente'
  )

  const grupos = Object.values(
    novedadesDeEstaActuacion.reduce<Record<string, typeof novedadesDeEstaActuacion>>(
      (acc, n) => { (acc[n.corrida_id] ??= []).push(n); return acc },
      {}
    )
  )
    .map(items => items.slice().sort((a, b) => a.row_index - b.row_index))
    .sort((a, b) => new Date(b[0].fecha_deteccion).getTime() - new Date(a[0].fecha_deteccion).getTime())

  if (novedadesDeEstaActuacion.length === 0) {
    return (
      <div className="mt-4 bg-white rounded-2xl shadow-card p-12 text-center">
        <Icon name="cloud_done" size={36} className="text-[#c0c0c0] mx-auto mb-3" />
        <p className="text-sm font-medium text-[#7a9ab4]">Sin novedades PJN pendientes para esta actuación.</p>
        <p className="text-xs text-[#9a9a9a] mt-1">Las novedades detectadas automáticamente aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-6">
      {grupos.map(items => (
        <div key={items[0].corrida_id}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7a9ab4] mb-2">
            {items.length} {items.length === 1 ? 'movimiento detectado' : 'movimientos detectados'} el {formatFecha(items[0].fecha_deteccion)}
          </p>
          <div className="space-y-3">
            {items.map(n => (
              <NovedadPjnCard key={n.id} novedad={n} mostrarActuacion={false} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}