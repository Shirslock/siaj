import { useState } from 'react'
import { useUIStore } from '../../store/ui.store'
import { RUTAS } from '../../utils/routing'
import {
  KpiCard, WidgetCard, WidgetVencimientos, WidgetCerradas, WidgetAudiencias,
  BarrasDistribucion, useHomeData, type FilaBarra, type Scope,
} from './homeShared'

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
  const [scope, setScope] = useState<Scope>(() => SCOPE_DEFAULT[rolSistema] ?? 'MIAS')

  const {
    usuarioActivo, navigate, misActivos, vencimientos,
    causasActivasCount, documentosActivosCount, asignadoCount, intervencion,
    urgentesCount, estadosActivos, audiencias, cerradasCount,
  } = useHomeData(scope)

  // Filtro de alcance que se agrega a cada deep-link hacia la Bandeja, además del filtro
  // propio de cada KPI/fila — así el número del indicador coincide con el resultado.
  const qsAlcance = (() => {
    if (scope === 'MIAS') return `letrado=${encodeURIComponent(usuarioActivo?.id ?? '')}`
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
    scope === 'AREA' ? `Área ${(usuarioActivo?.areas ?? []).join(', ')}: `
    : scope === 'TODO' ? 'Sistema: '
    : 'Gestionando '

  const mostrarToggle = rolSistema === 'COORDINADOR' || rolSistema === 'REFERENTE'
  const opcionesToggle: { valor: Scope; label: string }[] =
    rolSistema === 'COORDINADOR'
      ? [{ valor: 'MIAS', label: 'Mías' }, { valor: 'AREA', label: 'Mi área' }]
      : [{ valor: 'MIAS', label: 'Mías' }, { valor: 'TODO', label: 'Todo' }]

  return (
    <div className="p-8 space-y-5">

      {/* ENCABEZADO */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57]">Principal</h1>
          <p className="text-sm text-[#4a6a84] mt-1.5">
            Hola, <span className="font-semibold text-[#1b3a57]">{usuarioActivo?.nombre} {usuarioActivo?.apellido}</span>.{' '}
            {prefijoScope}<span className="font-semibold text-[#1b3a57]">{n}</span> {sufijoActuacion}.
          </p>
        </div>

        {mostrarToggle && (
          <div className="flex gap-1 bg-[#eef2f7] rounded-xl p-1">
            {opcionesToggle.map(o => (
              <button
                key={o.valor}
                onClick={() => setScope(o.valor)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                  scope === o.valor
                    ? 'bg-[#2a78d6] text-white shadow-sm'
                    : 'text-[#4a6a84] hover:text-[#1b3a57]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          icono="folder" label="Causas judiciales activas" valor={causasActivasCount} tono="azul"
          onClick={() => irABandeja('clase=causa')}
        />
        <KpiCard
          icono="description" label="Documentos activos" valor={documentosActivosCount} tono="teal"
          onClick={() => irABandeja('clase=documento')}
        />
        <KpiCard
          icono="person_add" label="Nuevas asignadas" valor={asignadoCount} tono="azul"
          onClick={() => irABandeja('estado=ASIGNADO')}
        />
        <KpiCard
          icono="gavel" label="Actuaciones parte actora" valor={intervencion.actora} tono="destacado"
          onClick={() => irABandeja('parte=Actora')}
        />
        <KpiCard
          icono="error" label="Urgentes" valor={urgentesCount} tono="rojo"
          onClick={() => irABandeja('urgente=1')}
        />
      </div>

      {/* CUERPO */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">

        {/* Izquierda: vencimientos y tareas */}
        <WidgetVencimientos items={vencimientos} />

        {/* Derecha: audiencias, distribuciones y cerradas */}
        <div className="space-y-5">
          <WidgetAudiencias items={audiencias} />

          <WidgetCard titulo="Por rol" sub="Distribución de causas activas.">
            <BarrasDistribucion filas={filasPorRol} />
          </WidgetCard>

          <WidgetCard titulo="Por estado procesal" sub="Distribución de actuaciones activas.">
            {filasPorEstado.length === 0 ? (
              <p className="text-[12px] text-[#7a9ab4] text-center py-4">Sin actuaciones activas.</p>
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
