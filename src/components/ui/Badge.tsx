import type { Area, RolSistema } from '../../types'

interface BadgeConfig {
  bg: string
  text: string
  dot?: string
}

const ESTADO_CONFIG: Record<string, BadgeConfig> = {
  EN_TRAMITE:           { bg: 'bg-[#E4EDF2]',  text: 'text-[#242C4F]', dot: 'bg-[#4a9ab5]' },
  'EN TRAMITACIÓN':     { bg: 'bg-[#E4EDF2]',  text: 'text-[#242C4F]', dot: 'bg-[#4a9ab5]' },
  'EN TRAMITACION':     { bg: 'bg-[#E4EDF2]',  text: 'text-[#242C4F]', dot: 'bg-[#4a9ab5]' },
  EN_PLAZO_CONTESTAR:   { bg: 'bg-[#dbeafe]',  text: 'text-[#242C4F]', dot: 'bg-[#2a5278]' },
  'EN ANÁLISIS':        { bg: 'bg-[#dbeafe]',  text: 'text-[#242C4F]', dot: 'bg-[#2a5278]' },
  SUSPENSION_TERMINOS:  { bg: 'bg-[#E3E4E9]',  text: 'text-[#758A93]' },
  'AUDIENCIA PACTADA':  { bg: 'bg-[#E3E4E9]',  text: 'text-[#758A93]', dot: 'bg-[#7dbad2]' },
  EN_PRUEBA:            { bg: 'bg-[#E3E4E9]',  text: 'text-[#758A93]' },
  PENDIENTE_GDE:        { bg: 'bg-[#fef3c7]',  text: 'text-[#d97706]' },
  PENDIENTE:            { bg: 'bg-[#fef3c7]',  text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  'PENDIENTE CARGA':    { bg: 'bg-[#fef3c7]',  text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  CUMPLIDO:             { bg: 'bg-[#dcfce7]',  text: 'text-[#267F33]', dot: 'bg-[#267F33]' },
  ACUERDO:              { bg: 'bg-[#dcfce7]',  text: 'text-[#267F33]', dot: 'bg-[#267F33]' },
  ARCHIVADO:            { bg: 'bg-[#E3E4E9]',  text: 'text-[#758A93]' },
  ARCHIVADA:            { bg: 'bg-[#E3E4E9]',  text: 'text-[#758A93]' },
  URGENTE:              { bg: 'bg-[#fee2e2]',  text: 'text-[#C3292F]', dot: 'bg-[#C3292F]' },
  INSTRUCCIÓN:          { bg: 'bg-[#E4EDF2]',  text: 'text-[#242C4F]', dot: 'bg-[#4a9ab5]' },
  'ELEVADA A JUICIO':   { bg: 'bg-[#dbeafe]',  text: 'text-[#242C4F]', dot: 'bg-[#256386]' },
  SENTENCIA:            { bg: 'bg-[#E3E4E9]',  text: 'text-[#758A93]' },
  OBSERVADO:            { bg: 'bg-[#fef3c7]',  text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  ASIGNADO:             { bg: 'bg-[#E5E5E5]',  text: 'text-[#242C4F]', dot: 'bg-[#7dbad2]' },
}

const DEFAULT_CONFIG: BadgeConfig = {
  bg: 'bg-[#E3E4E9]',
  text: 'text-[#758A93]',
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
    CIVIL:   'bg-[#E4EDF2] text-[#242C4F]',
    LABORAL: 'bg-[#dbeafe] text-[#242C4F]',
    PENAL:   'bg-[#E3E4E9] text-[#242C4F]',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${config[area]}`}>
      {area}
    </span>
  )
}

export function RolBadge({ rol }: { rol: RolSistema }) {
  const config: Record<RolSistema, string> = {
    REFERENTE:      'bg-[#256386] text-white',
    COORDINADOR:    'bg-[#2a5278] text-white',
    ABOGADO:        'bg-[#E4EDF2] text-[#242C4F]',
    ADMINISTRATIVO: 'bg-[#E3E4E9] text-[#758A93]',
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
