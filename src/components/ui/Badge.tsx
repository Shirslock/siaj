import type { Area, RolSistema } from '../../types'

interface BadgeConfig {
  bg: string
  text: string
  dot?: string
}

const ESTADO_CONFIG: Record<string, BadgeConfig> = {
  EN_TRAMITE:           { bg: 'bg-secondary-container',          text: 'text-on-secondary-fixed',      dot: 'bg-secondary' },
  'EN TRAMITACIÓN':     { bg: 'bg-secondary-container',          text: 'text-on-secondary-fixed',      dot: 'bg-secondary' },
  'EN TRAMITACION':     { bg: 'bg-secondary-container',          text: 'text-on-secondary-fixed',      dot: 'bg-secondary' },
  EN_PLAZO_CONTESTAR:   { bg: 'bg-primary-container',            text: 'text-on-primary-container',    dot: 'bg-primary-dim' },
  'EN ANÁLISIS':        { bg: 'bg-primary-container',            text: 'text-on-primary-container',    dot: 'bg-primary-dim' },
  SUSPENSION_TERMINOS:  { bg: 'bg-surface-container',            text: 'text-on-surface-variant' },
  'AUDIENCIA PACTADA':  { bg: 'bg-surface-container',            text: 'text-on-surface-variant',      dot: 'bg-secondary-dim' },
  EN_PRUEBA:            { bg: 'bg-surface-container',            text: 'text-on-surface-variant' },
  PENDIENTE_GDE:        { bg: 'bg-yellow-100',                   text: 'text-yellow-800' },
  PENDIENTE:            { bg: 'bg-yellow-100',                   text: 'text-yellow-800',              dot: 'bg-yellow-500' },
  'PENDIENTE CARGA':    { bg: 'bg-yellow-100',                   text: 'text-yellow-800',              dot: 'bg-yellow-500' },
  CUMPLIDO:             { bg: 'bg-green-100',                    text: 'text-green-800',               dot: 'bg-green-600' },
  ACUERDO:              { bg: 'bg-green-100',                    text: 'text-green-800',               dot: 'bg-green-600' },
  ARCHIVADO:            { bg: 'bg-surface-container-highest',    text: 'text-outline' },
  ARCHIVADA:            { bg: 'bg-surface-container-highest',    text: 'text-outline' },
  URGENTE:              { bg: 'bg-red-100',                      text: 'text-red-800',                 dot: 'bg-red-500' },
  INSTRUCCIÓN:          { bg: 'bg-tertiary-container',           text: 'text-on-tertiary-fixed',       dot: 'bg-tertiary-dim' },
  'ELEVADA A JUICIO':   { bg: 'bg-primary-container',            text: 'text-on-primary-container',    dot: 'bg-primary' },
  SENTENCIA:            { bg: 'bg-surface-container-high',       text: 'text-on-surface-variant' },
  OBSERVADO:            { bg: 'bg-yellow-100',                   text: 'text-yellow-800',              dot: 'bg-yellow-500' },
  ASIGNADO:             { bg: 'bg-primary-container',            text: 'text-on-primary-container',    dot: 'bg-primary-dim' },
}

const DEFAULT_CONFIG: BadgeConfig = {
  bg: 'bg-surface-container',
  text: 'text-on-surface-variant',
}

export function EstadoBadge({ code, label }: { code: string; label: string }) {
  const cfg = ESTADO_CONFIG[code] ?? ESTADO_CONFIG[label] ?? DEFAULT_CONFIG
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}>
      {cfg.dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />}
      {label}
    </span>
  )
}

export function AreaBadge({ area }: { area: Area }) {
  const config: Record<Area, string> = {
    CIVIL:   'bg-primary-container text-on-primary-container',
    LABORAL: 'bg-secondary-container text-on-secondary-fixed',
    PENAL:   'bg-surface-container text-on-surface-variant',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${config[area]}`}>
      {area}
    </span>
  )
}

export function RolBadge({ rol }: { rol: RolSistema }) {
  const config: Record<RolSistema, string> = {
    REFERENTE:      'bg-primary-container text-on-primary-container',
    COORDINADOR:    'bg-secondary-container text-on-secondary-fixed',
    ABOGADO:        'bg-surface-container text-on-surface-variant',
    ADMINISTRATIVO: 'bg-surface-container-highest text-outline',
  }
  const labels: Record<RolSistema, string> = {
    REFERENTE:      'Referente',
    COORDINADOR:    'Coordinador',
    ABOGADO:        'Abogado/a',
    ADMINISTRATIVO: 'Administrativo',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${config[rol]}`}>
      {labels[rol]}
    </span>
  )
}
