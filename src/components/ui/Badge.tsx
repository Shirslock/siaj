import type { Area, RolSistema } from '../../types'

interface BadgeConfig {
  bg: string
  text: string
  dot?: string
}

const ESTADO_CONFIG: Record<string, BadgeConfig> = {
  EN_TRAMITE:           { bg: 'bg-[#C4DFE8]',  text: 'text-[#1b3a57]', dot: 'bg-[#4a9ab5]' },
  'EN TRAMITACIÓN':     { bg: 'bg-[#C4DFE8]',  text: 'text-[#1b3a57]', dot: 'bg-[#4a9ab5]' },
  'EN TRAMITACION':     { bg: 'bg-[#C4DFE8]',  text: 'text-[#1b3a57]', dot: 'bg-[#4a9ab5]' },
  EN_PLAZO_CONTESTAR:   { bg: 'bg-[#dbeafe]',  text: 'text-[#1b3a57]', dot: 'bg-[#2a5278]' },
  'EN ANÁLISIS':        { bg: 'bg-[#dbeafe]',  text: 'text-[#1b3a57]', dot: 'bg-[#2a5278]' },
  SUSPENSION_TERMINOS:  { bg: 'bg-[#e8e8e8]',  text: 'text-[#4a6a84]' },
  'AUDIENCIA PACTADA':  { bg: 'bg-[#e8e8e8]',  text: 'text-[#4a6a84]', dot: 'bg-[#7dbad2]' },
  EN_PRUEBA:            { bg: 'bg-[#e8e8e8]',  text: 'text-[#4a6a84]' },
  PENDIENTE_GDE:        { bg: 'bg-[#fef3c7]',  text: 'text-[#d97706]' },
  PENDIENTE:            { bg: 'bg-[#fef3c7]',  text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  'PENDIENTE CARGA':    { bg: 'bg-[#fef3c7]',  text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  CUMPLIDO:             { bg: 'bg-[#dcfce7]',  text: 'text-[#15803d]', dot: 'bg-[#15803d]' },
  ACUERDO:              { bg: 'bg-[#dcfce7]',  text: 'text-[#15803d]', dot: 'bg-[#15803d]' },
  ARCHIVADO:            { bg: 'bg-[#e8e8e8]',  text: 'text-[#4a6a84]' },
  ARCHIVADA:            { bg: 'bg-[#e8e8e8]',  text: 'text-[#4a6a84]' },
  URGENTE:              { bg: 'bg-[#fee2e2]',  text: 'text-[#b91c1c]', dot: 'bg-[#b91c1c]' },
  INSTRUCCIÓN:          { bg: 'bg-[#C4DFE8]',  text: 'text-[#1b3a57]', dot: 'bg-[#4a9ab5]' },
  'ELEVADA A JUICIO':   { bg: 'bg-[#dbeafe]',  text: 'text-[#1b3a57]', dot: 'bg-[#1b3a57]' },
  SENTENCIA:            { bg: 'bg-[#e8e8e8]',  text: 'text-[#4a6a84]' },
  OBSERVADO:            { bg: 'bg-[#fef3c7]',  text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  ASIGNADO:             { bg: 'bg-[#E5E5E5]',  text: 'text-[#1b3a57]', dot: 'bg-[#7dbad2]' },
}

const DEFAULT_CONFIG: BadgeConfig = {
  bg: 'bg-[#e8e8e8]',
  text: 'text-[#4a6a84]',
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
    CIVIL:   'bg-[#C4DFE8] text-[#1b3a57]',
    LABORAL: 'bg-[#dbeafe] text-[#1b3a57]',
    PENAL:   'bg-[#e8e8e8] text-[#1b3a57]',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${config[area]}`}>
      {area}
    </span>
  )
}

export function RolBadge({ rol }: { rol: RolSistema }) {
  const config: Record<RolSistema, string> = {
    REFERENTE:      'bg-[#1b3a57] text-white',
    COORDINADOR:    'bg-[#2a5278] text-white',
    ABOGADO:        'bg-[#C4DFE8] text-[#1b3a57]',
    ADMINISTRATIVO: 'bg-[#e8e8e8] text-[#4a6a84]',
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
