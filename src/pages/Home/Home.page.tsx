import { useState } from 'react'
import { useUIStore } from '../../store/ui.store'
import { RUTAS } from '../../utils/routing'
import {
  KpiCard, WidgetCard, WidgetVencimientos, WidgetCerradas, WidgetAudiencias,
  BarrasDistribucion, useHomeData, letradosDisponibles, type FilaBarra, type Scope,
} from './homeShared'
import { getNombreCompleto, getUsuarioById } from '../../data/usuarios'

// Pantalla Principal.
// Home de ABOGADO (scope fijo "Mías") y, con alcance ampliado, de COORDINADOR ("Mías"/"Mi
// área") y REFERENTE/Gerente ("Mías"/"Todo") — conviven con el Dashboard, no lo reemplazan.
// Fila de 5 KPIs + "Vencimientos y tareas" (tabs Todas/Vencidas/Por vencer +
// buscador, agrupado en Vencidas/Próximas) a la izquierda; distribuciones por rol
// y por tipo de gestión + actuaciones cerradas a la derecha.
// Ver homeShared.tsx para la lógica/cálculos y los componentes.

const SCOPE_DEFAULT: Record<string, Scope> = {
  COORDINADOR: 'AREA',
  REFERENTE: 'TODO',
  ABOGADO: 'MIAS',
}

export default function HomePage() {
  const { usuarioActivo: usuarioParaDefault } = useUIStore()
  const rolSistema = usuarioParaDefault?.rolSistema ?? 'ABOGADO'
  // scopeBase = Mías / Mi área / Todo. "Por letrado" es un cuarto modo (porLetrado) que, hasta
  // elegir a alguien, deja el tablero con el alcance anterior.
  const [scopeBase, setScopeBase] = useState<Scope>(() => SCOPE_DEFAULT[rolSistema] ?? 'MIAS')
  const [porLetrado, setPorLetrado] = useState(false)
  const [letradoId, setLetradoId] = useState('')
  const scope: Scope = porLetrado && letradoId ? 'LETRADO' : scopeBase

  const {
    usuarioActivo, navigate, misActivos, vencimientos,
    causasActivasCount, documentosActivosCount, asignadoCount, intervencion,
    urgentesCount, estadosActivos, audiencias, cerradasCount,
  } = useHomeData(scope, letradoId)

  // Filtro de alcance que se agrega a cada deep-link hacia la Bandeja, además del filtro
  // propio de cada KPI/fila — así el número del indicador coincide con el resultado.
  const qsAlcance = (() => {
    if (scope === 'MIAS') return `letrado=${encodeURIComponent(usuarioActivo?.id ?? '')}`
    if (scope === 'LETRADO') return `letrado=${encodeURIComponent(letradoId)}`
    if (scope === 'AREA') {
      const areas = usuarioActivo?.areas ?? []
      return `area=${areas.length === 1 ? encodeURIComponent(areas[0]) : ''}`
    }
    return ''
  })()

  const irABandeja = (filtroPropio: string) => {
    const partes = [filtroPropio, qsAlcance].filter(Boolean)
    navigate(`${RUTAS.ACTUACIONES}${partes.length ? `?${partes.join('&')}` : ''}`)
  }

  const filasPorRol: FilaBarra[] = [
    {
      label: 'Actora', valor: intervencion.actora, color: '#2a78d6',
      onClick: () => irABandeja('parte=Actora'),
    },
    {
      label: 'Demandada', valor: intervencion.demandada, color: '#eda100',
      onClick: () => irABandeja('parte=Demandada'),
    },
    {
      label: 'Denunciante', valor: intervencion.denunciante, color: '#7F77DD',
      onClick: () => irABandeja('parte=Denunciante'),
    },
    {
      label: 'Sin intervención', valor: intervencion.sinIntervencion, color: '#85B7EB',
      onClick: () => irABandeja(`parte=${encodeURIComponent('Sin Intervención')}`),
    },
  ]

  const filasPorEstado: FilaBarra[] = estadosActivos.map(e => ({
    label: e.label,
    valor: e.count,
    color: '#2a78d6',
    onClick: () => irABandeja(`estado=${encodeURIComponent(e.code)}`),
  }))

  // Segunda línea del encabezado, según scope. N = total del set base activo (misActivos).
  const n = misActivos.length
  const plural = n !== 1
  const sufijoActuacion = `actuación${plural ? 'es' : ''} activa${plural ? 's' : ''}`
  const prefijoScope =
    scope === 'LETRADO' ? `Letrado ${getNombreCompleto(getUsuarioById(letradoId)!)}: `
    : scope === 'AREA' ? `Área ${(usuarioActivo?.areas ?? []).join(', ')}: `
    : scope === 'TODO' ? 'Sistema: '
    : 'Gestionando '

  const mostrarToggle = rolSistema === 'COORDINADOR' || rolSistema === 'REFERENTE'
  const opcionesToggle: { valor: Scope; label: string }[] =
    rolSistema === 'COORDINADOR'
      ? [{ valor: 'MIAS', label: 'Mías' }, { valor: 'AREA', label: 'Mi área' }]
      : [{ valor: 'MIAS', label: 'Mías' }, { valor: 'TODO', label: 'Todo' }]

  const letrados = letradosDisponibles(usuarioActivo)

  return (
    <div className="p-6 flex flex-col gap-4">

      {/* ENCABEZADO */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Principal</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Hola, <span className="font-semibold text-gray-800">{usuarioActivo?.nombre} {usuarioActivo?.apellido}</span>.{' '}
            {prefijoScope}<span className="font-semibold text-gray-800">{n}</span> {sufijoActuacion}.
          </p>
        </div>

        {mostrarToggle && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden shrink-0">
              {opcionesToggle.map(o => (
                <button
                  key={o.valor}
                  onClick={() => { setScopeBase(o.valor); setPorLetrado(false) }}
                  className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    !porLetrado && scopeBase === o.valor
                      ? 'bg-blue-700 text-white'
                      : 'border-l border-gray-300 first:border-l-0 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
              <button
                onClick={() => setPorLetrado(true)}
                className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  porLetrado
                    ? 'bg-blue-700 text-white'
                    : 'border-l border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Por letrado
              </button>
            </div>
            {porLetrado && (
              <select
                value={letradoId}
                onChange={e => setLetradoId(e.target.value)}
                aria-label="Letrado"
                className="field-input text-[12px] py-1.5 min-w-[220px]"
              >
                <option value="">Elegir letrado…</option>
                {letrados.map(u => (
                  <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          icono="kpi_causas" label="Causas judiciales activas" valor={causasActivasCount} tono="azul"
          onClick={() => irABandeja('clase=causa')}
        />
        <KpiCard
          icono="kpi_documentos" label="Documentos activos" valor={documentosActivosCount} tono="teal"
          onClick={() => irABandeja('clase=documento')}
        />
        <KpiCard
          icono="kpi_nuevas" label="Nuevas asignadas" valor={asignadoCount} tono="azul"
          onClick={() => irABandeja('estado=ASIGNADO')}
        />
        <KpiCard
          icono="gavel" label="Actuaciones parte actora" valor={intervencion.actora} tono="destacado"
          onClick={() => irABandeja('parte=Actora')}
        />
        <KpiCard
          icono="kpi_urgente" label="Urgentes" valor={urgentesCount} tono="rojo"
          onClick={() => irABandeja('urgente=1')}
        />
      </div>

      {/* CUERPO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Izquierda: vencimientos y tareas */}
        <div className="lg:col-span-2">
          <WidgetVencimientos items={vencimientos} />
        </div>

        {/* Derecha: audiencias, distribuciones y cerradas */}
        <div className="space-y-4">
          <WidgetAudiencias items={audiencias} />

          <WidgetCard titulo="Por rol" sub="Distribución de causas activas.">
            <BarrasDistribucion filas={filasPorRol} />
          </WidgetCard>

          <WidgetCard titulo="Por estado procesal" sub="Distribución de actuaciones activas.">
            {filasPorEstado.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-4">Sin actuaciones activas.</p>
            ) : (
              <BarrasDistribucion filas={filasPorEstado} />
            )}
          </WidgetCard>

          <WidgetCerradas
            valor={cerradasCount}
            onClick={() => irABandeja('tab=archivados')}
          />
        </div>
      </div>
    </div>
  )
}
