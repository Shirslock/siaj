import type { Area, RolSistema } from '../../types'

// PRD (siaj-design-system.md §7): los estados se ven todos con el mismo chip neutro
// (no hay color por estado); el área es un chip rectangular con fondo sólido de marca.

export function EstadoBadge({ label }: { code?: string; label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
      {label}
    </span>
  )
}

const AREA_COLOR: Record<Area, string> = {
  CIVIL:   'var(--color-area-civil)',
  PENAL:   'var(--color-area-penal)',
  LABORAL: 'var(--color-area-laboral)',
}

export function AreaBadge({ area }: { area: Area }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
      style={{ backgroundColor: AREA_COLOR[area] }}
    >
      {area}
    </span>
  )
}

export function RolBadge({ rol }: { rol: RolSistema }) {
  const config: Record<RolSistema, string> = {
    REFERENTE:      'bg-blue-700 text-white',
    COORDINADOR:    'bg-blue-600 text-white',
    ABOGADO:        'bg-blue-50 text-blue-700 border border-blue-200',
    ADMINISTRATIVO: 'bg-gray-100 text-gray-700',
  }
  const labels: Record<RolSistema, string> = {
    REFERENTE:      'Referente',
    COORDINADOR:    'Coordinador',
    ABOGADO:        'Abogado/a',
    ADMINISTRATIVO: 'Administrativo',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config[rol]}`}>
      {labels[rol]}
    </span>
  )
}
