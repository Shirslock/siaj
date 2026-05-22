import { useMemo } from 'react'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { AreaBadge } from '../../components/ui/Badge'
import { TablaExpedientes } from '../../components/expedientes/TablaExpedientes'
import type { Area } from '../../types'
import Icon from '../../components/ui/Icon'

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

      {/* Aviso institucional */}
      <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200">
        <Icon name="warning" size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-0.5">
            Información preliminar — sujeta a revisión
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Los indicadores y métricas presentados en este panel tienen carácter ilustrativo.
            Los datos, criterios de cálculo y categorías de visualización deberán ser
            validados y relevados con las áreas requirentas antes de su implementación definitiva.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.area} className="bg-white rounded-2xl p-5 shadow-card">
            <div className="flex items-start justify-between mb-3">
              <AreaBadge area={s.area} />
              <Icon name={AREA_ICON[s.area]} size={20} />
            </div>
            <p className="text-3xl font-headline font-bold text-[#1b3a57] mt-2">{s.total}</p>
            <p className="text-xs text-[#4a6a84] mt-1">{s.activos} activos</p>
          </div>
        ))}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4a6a84]">Mesa SACO</span>
            <Icon name="inbox" size={20} />
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
