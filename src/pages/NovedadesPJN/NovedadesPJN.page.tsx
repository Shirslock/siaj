import { useMemo, useState } from 'react'
import { usePjnStore } from '../../store/pjn.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { filtrarNovedadesPorRol } from '../../utils/pjnVisibilidad'
import { NovedadPjnCard } from '../../components/pjn/NovedadPjnCard'
import Icon from '../../components/ui/Icon'
import { formatFecha } from '../../utils/format'
import type { NovedadPJN } from '../../types'

type Filtro = 'pendientes' | 'todas'

interface GrupoCorrida {
  key: string
  expediente_id: string
  corrida_id: string
  fecha_deteccion: string
  items: NovedadPJN[]
}

function agruparPorCorrida(lista: NovedadPJN[]): GrupoCorrida[] {
  const grupos: Record<string, GrupoCorrida> = {}
  lista.forEach(n => {
    const key = `${n.expediente_id}_${n.corrida_id}`
    if (!grupos[key]) {
      grupos[key] = { key, expediente_id: n.expediente_id, corrida_id: n.corrida_id, fecha_deteccion: n.fecha_deteccion, items: [] }
    }
    grupos[key].items.push(n)
  })
  return Object.values(grupos)
    .map(g => ({ ...g, items: g.items.slice().sort((a, b) => a.row_index - b.row_index) }))
    .sort((a, b) => new Date(b.fecha_deteccion).getTime() - new Date(a.fecha_deteccion).getTime())
}

export default function NovedadesPJNPage() {
  const { novedades } = usePjnStore()
  const { expedientes } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const [filtro, setFiltro] = useState<Filtro>('pendientes')

  const visibles = useMemo(
    () => filtrarNovedadesPorRol(novedades, expedientes, usuarioActivo),
    [novedades, expedientes, usuarioActivo]
  )

  const pendientes = visibles.filter(n => n.estado === 'pendiente')
  const lista = filtro === 'pendientes' ? pendientes : visibles
  const grupos = useMemo(() => agruparPorCorrida(lista), [lista])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="refresh" size={18} className="text-[#1b3a57]" />
          <h2 className="text-lg font-bold text-[#1b3a57]">Novedades PJN</h2>
          {pendientes.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#185fa5] text-white">
              {pendientes.length} pendientes
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-[#e5e5e5] rounded-lg p-1">
          <button
            onClick={() => setFiltro('pendientes')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filtro === 'pendientes' ? 'bg-white text-[#1b3a57] shadow-sm' : 'text-[#4a6a84]'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFiltro('todas')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filtro === 'todas' ? 'bg-white text-[#1b3a57] shadow-sm' : 'text-[#4a6a84]'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white py-16 text-center">
          <Icon name="refresh" size={28} className="text-[#7a9ab4] mx-auto mb-2" />
          <p className="text-sm text-[#4a6a84]">Sin novedades pendientes de PJN.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(g => (
            <div key={g.key}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#7a9ab4] mb-2">
                {g.items.length} {g.items.length === 1 ? 'movimiento detectado' : 'movimientos detectados'} el {formatFecha(g.fecha_deteccion)}
              </p>
              <div className="space-y-3">
                {g.items.map(n => (
                  <NovedadPjnCard key={n.id} novedad={n} mostrarActuacion />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
