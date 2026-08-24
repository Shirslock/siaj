import { useMemo, useState } from 'react'
import { usePjnStore } from '../../store/pjn.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { filtrarNovedadesPorRol } from '../../utils/pjnVisibilidad'
import { NovedadPjnCard } from '../../components/pjn/NovedadPjnCard'
import Icon from '../../components/ui/Icon'

type Filtro = 'pendientes' | 'todas'

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
  const lista = (filtro === 'pendientes' ? pendientes : visibles)
    .slice()
    .sort((a, b) => new Date(b.fecha_deteccion).getTime() - new Date(a.fecha_deteccion).getTime())

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
        <div className="space-y-3">
          {lista.map(n => (
            <NovedadPjnCard key={n.id} novedad={n} mostrarActuacion />
          ))}
        </div>
      )}
    </div>
  )
}
