import { useMemo, useState } from 'react'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { TablaExpedientes } from '../../components/expedientes/TablaExpedientes'

export default function BandejaAreaPage() {
  const { expedientes } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroBusqueda, setFiltroBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const areas = usuarioActivo?.areas ?? []
    return expedientes.filter(e => {
      if (!areas.includes(e.area)) return false
      if (filtroEstado && e.estado !== filtroEstado) return false
      if (filtroBusqueda) {
        const q = filtroBusqueda.toLowerCase()
        return (
          e.caratula.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          (e.numero_causa ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [expedientes, usuarioActivo, filtroEstado, filtroBusqueda])

  const estados = useMemo(() => {
    const areas = usuarioActivo?.areas ?? []
    const set = new Set(expedientes.filter(e => areas.includes(e.area)).map(e => e.estado))
    return Array.from(set).sort()
  }, [expedientes, usuarioActivo])

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            className="field-input pl-9"
            placeholder="Buscar carátula, número, causa…"
            value={filtroBusqueda}
            onChange={e => setFiltroBusqueda(e.target.value)}
          />
        </div>
        <select
          className="field-input w-auto"
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {estados.map(est => <option key={est} value={est}>{est}</option>)}
        </select>
        <span className="text-xs text-on-surface-variant ml-auto">
          {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card">
        <TablaExpedientes expedientes={filtrados} />
      </div>
    </div>
  )
}
