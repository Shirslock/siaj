import { RUTAS } from '../../utils/routing'
import {
  KpiCard, WidgetCard, WidgetVencimientos, WidgetCerradas, WidgetAudiencias,
  BarrasDistribucion, useHomeData, type FilaBarra,
} from './homeShared'

// Pantalla Principal del rol ABOGADO (Etapa 1).
// Fila de 5 KPIs + "Vencimientos y tareas" (tabs Todas/Vencidas/Por vencer +
// buscador, agrupado en Vencidas/Próximas) a la izquierda; distribuciones por rol
// y por tipo de gestión + actuaciones cerradas a la derecha.
// Ver homeShared.tsx para la lógica/cálculos y los componentes.
export default function HomePage() {
  const {
    usuarioActivo, navigate, misActivos, vencimientos,
    causasActivasCount, documentosActivosCount, asignadoCount, intervencion,
    urgentesCount, estadosActivos, audiencias, cerradasCount,
  } = useHomeData()

  const filasPorRol: FilaBarra[] = [
    {
      label: 'Actora', valor: intervencion.actora, color: '#2a78d6',
      onClick: () => navigate(`${RUTAS.ACTUACIONES}?parte=Actora`),
    },
    {
      label: 'Demandada', valor: intervencion.demandada, color: '#eda100',
      onClick: () => navigate(`${RUTAS.ACTUACIONES}?parte=Demandada`),
    },
    {
      label: 'Denunciante', valor: intervencion.denunciante, color: '#7F77DD',
      onClick: () => navigate(`${RUTAS.ACTUACIONES}?parte=Denunciante`),
    },
    {
      label: 'Sin intervención', valor: intervencion.sinIntervencion, color: '#85B7EB',
      onClick: () => navigate(`${RUTAS.ACTUACIONES}?parte=${encodeURIComponent('Sin Intervención')}`),
    },
  ]

  const filasPorEstado: FilaBarra[] = estadosActivos.map(e => ({
    label: e.label,
    valor: e.count,
    color: '#2a78d6',
    onClick: () => navigate(`${RUTAS.ACTUACIONES}?estado=${encodeURIComponent(e.code)}`),
  }))

  return (
    <div className="p-8 space-y-5">

      {/* ENCABEZADO */}
      <div>
        <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57]">Principal</h1>
        <p className="text-sm text-[#4a6a84] mt-1.5">
          Hola, <span className="font-semibold text-[#1b3a57]">{usuarioActivo?.nombre} {usuarioActivo?.apellido}</span>.
          Gestionando <span className="font-semibold text-[#1b3a57]">{misActivos.length}</span> actuación
          {misActivos.length !== 1 ? 'es' : ''} activa{misActivos.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          icono="folder" label="Causas judiciales activas" valor={causasActivasCount} tono="azul"
          onClick={() => navigate(`${RUTAS.ACTUACIONES}?clase=causa`)}
        />
        <KpiCard
          icono="description" label="Documentos activos" valor={documentosActivosCount} tono="teal"
          onClick={() => navigate(`${RUTAS.ACTUACIONES}?clase=documento`)}
        />
        <KpiCard
          icono="person_add" label="Nuevas asignadas" valor={asignadoCount} tono="azul"
          onClick={() => navigate(`${RUTAS.ACTUACIONES}?estado=ASIGNADO`)}
        />
        <KpiCard
          icono="gavel" label="Actuaciones parte actora" valor={intervencion.actora} tono="destacado"
          onClick={() => navigate(`${RUTAS.ACTUACIONES}?parte=Actora`)}
        />
        <KpiCard
          icono="error" label="Urgentes" valor={urgentesCount} tono="rojo"
          onClick={() => navigate(`${RUTAS.ACTUACIONES}?urgente=1`)}
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
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?tab=archivados`)}
          />
        </div>
      </div>
    </div>
  )
}
