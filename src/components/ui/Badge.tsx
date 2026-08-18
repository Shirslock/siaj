import type { Area, RolSistema } from '../../types'

// Tanda 2 — identidad visual: todo badge de "Estado" (EstadoBadge) usa un único
// fondo neutro plano (--color-neutral) + texto blanco, siguiendo docs/siaj-theme.css
// (.badge--estado). El "dot" por estado es lo único que sigue diferenciando
// visualmente cada código — ya no hay un bg/text por estado.
//
// HALLAZGO PARA DISEÑO (no es solo un número de contraste): antes, cada estado
// procesal tenía su propio color de fondo (pastel distinto por familia: azul,
// ámbar, verde, rojo, gris). Con el fondo único #9AA6B2, TODOS los estados se
// ven idénticos a simple vista — el único diferenciador que queda es un punto
// de 6px. En la bandeja principal, donde un coordinador escanea ~200
// actuaciones buscando cuáles requieren atención, esto elimina la lectura de
// estado "de un vistazo" que antes daba el color de fondo — no es solo que el
// texto blanco a 2.48:1 sea difícil de leer, es que la señal visual que
// distinguía "en análisis" de "pendiente" de "cumplido" desaparece. Es fiel
// al Figma/manual de marca — la pérdida funcional es la que hay que sumar a
// la consulta de diseño, no solo el número de contraste.
const ESTADO_DOT: Record<string, string> = {
  EN_TRAMITE:           'bg-[#4a9ab5]',
  'EN TRAMITACIÓN':     'bg-[#4a9ab5]',
  'EN TRAMITACION':     'bg-[#4a9ab5]',
  EN_PLAZO_CONTESTAR:   'bg-[#2a5278]',
  'EN ANÁLISIS':        'bg-[#2a5278]',
  'AUDIENCIA PACTADA':  'bg-[#7dbad2]',
  PENDIENTE_GDE:        'bg-[#d97706]',
  PENDIENTE:            'bg-[#d97706]',
  'PENDIENTE CARGA':    'bg-[#d97706]',
  CUMPLIDO:             'bg-[#267F33]',
  ACUERDO:              'bg-[#267F33]',
  URGENTE:              'bg-[#C3292F]',
  INSTRUCCIÓN:          'bg-[#4a9ab5]',
  'ELEVADA A JUICIO':   'bg-[#256386]',
  OBSERVADO:            'bg-[#d97706]',
  ASIGNADO:             'bg-[#7dbad2]',
}

export function EstadoBadge({ code, label }: { code: string; label: string }) {
  const dot = ESTADO_DOT[code] ?? ESTADO_DOT[label]
  return (
    <span className="inline-flex items-center h-[30px] gap-1 px-2 rounded-badge text-[10px] font-bold tracking-wide bg-neutral text-white">
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />}
      {label}
    </span>
  )
}

export function AreaBadge({ area }: { area: Area }) {
  // Un color por área jurídica — docs/siaj-theme.css sección 3, no reutilizar en otro contexto.
  const config: Record<Area, string> = {
    CIVIL:   'bg-area-civil',
    LABORAL: 'bg-area-laboral',
    PENAL:   'bg-area-penal',
  }
  return (
    <span className={`inline-flex items-center h-[30px] px-2 rounded-badge text-[10px] font-bold tracking-wide text-white ${config[area]}`}>
      {area}
    </span>
  )
}

export function RolBadge({ rol }: { rol: RolSistema }) {
  // REFERENTE/COORDINADOR: tokens de marca (navy/teal), definidos en docs/siaj-theme.css.
  // ABOGADO/ADMINISTRATIVO NO vienen del Figma/manual de marca — no hay color de rol
  // asignado para ellos ahí. bg-neutral-dark / bg-navy-active son DECISIÓN NUESTRA
  // (reutilizamos tokens ya definidos para otro uso) para que el texto blanco quede
  // legible; llevar a la consulta de diseño junto con el resto de los 5 puntos.
  const config: Record<RolSistema, string> = {
    REFERENTE:      'bg-navy text-white',
    COORDINADOR:    'bg-teal text-white',
    ABOGADO:        'bg-neutral-dark text-white',
    ADMINISTRATIVO: 'bg-navy-active text-white',
  }
  const labels: Record<RolSistema, string> = {
    REFERENTE:      'Referente',
    COORDINADOR:    'Coordinador',
    ABOGADO:        'Abogado/a',
    ADMINISTRATIVO: 'Administrativo',
  }
  return (
    <span className={`inline-flex items-center h-[30px] px-2 rounded-badge text-[10px] font-bold tracking-wide ${config[rol]}`}>
      {labels[rol]}
    </span>
  )
}
