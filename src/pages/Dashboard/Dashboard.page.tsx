import { useMemo } from 'react'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { AreaBadge } from '../../components/ui/Badge'
import { TablaExpedientes } from '../../components/expedientes/TablaExpedientes'
import type { Area } from '../../types'

const AREAS: Area[] = ['CIVIL', 'LABORAL', 'PENAL']

const AREA_ICON: Record<Area, string> = {
  CIVIL:   'gavel',
  LABORAL: 'work',
  PENAL:   'local_police',
}

export default function DashboardPage() {
  const { expedientes, queue } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  const stats = useMemo(() =>
    AREAS.map(area => ({
      area,
      total:   expedientes.filter(e => e.area === area).length,
      activos: expedientes.filter(e => e.area === area && e.estado !== 'ARCHIVADO' && e.estado !== 'ARCHIVADA').length,
    })),
    [expedientes])

  const pendientesQueue = queue.filter(q => q.estado === 'PENDIENTE').length

  const recientes = useMemo(() =>
    [...expedientes]
      .sort((a, b) => b.fecha_recepcion.localeCompare(a.fecha_recepcion))
      .slice(0, 5),
    [expedientes])

  return (
    <div className="p-6 space-y-6 max-w-screen-xl">
      <div>
        <p className="text-[#4a6a84] text-sm">
          Bienvenido/a,{' '}
          <span className="font-semibold text-[#1b3a57]">
            {usuarioActivo?.nombre} {usuarioActivo?.apellido}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.area} className="bg-white rounded-2xl p-5 shadow-card">
            <div className="flex items-start justify-between mb-3">
              <AreaBadge area={s.area} />
              <span className="material-symbols-outlined text-[20px] text-[#4a6a84]">{AREA_ICON[s.area]}</span>
            </div>
            <p className="text-3xl font-headline font-bold text-[#1b3a57] mt-2">{s.total}</p>
            <p className="text-xs text-[#4a6a84] mt-1">{s.activos} activos</p>
          </div>
        ))}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4a6a84]">Mesa SIAJ</span>
            <span className="material-symbols-outlined text-[20px] text-[#4a6a84]">inbox</span>
          </div>
          <p className="text-3xl font-headline font-bold text-[#1b3a57] mt-2">{pendientesQueue}</p>
          <p className="text-xs text-[#4a6a84] mt-1">pendientes en cola</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card">
        <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.12)]">
          <h2 className="font-headline font-semibold text-[#1b3a57]">Expedientes recientes</h2>
        </div>
        <TablaExpedientes expedientes={recientes} />
      </div>
    </div>
  )
}
