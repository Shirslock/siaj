import { RUTAS } from '../../utils/routing'
import {
  Tag, SeparadorTags, WidgetVencimientos, WidgetPorSubEstado, WidgetTipoIntervencion,
  HomeDesignSwitcher, useHomeData,
} from './homeShared'

// Diseño 2: los contadores suben arriba de todo en filas horizontales agrupadas
// (flex-wrap, ancho completo), y abajo Vencimientos (más angosto) al lado de
// los 2 donuts. Ver homeShared.tsx para la lógica/cálculos compartidos.
export default function Home2Page() {
  const {
    usuarioActivo, navigate, misActivos, vencimientos,
    causasActivasCount, asignadoCount, intervencion, porVencerCount,
    urgentesCount, tiposActivos, cerradasCount,
  } = useHomeData()

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57]">Inicio</h1>
        <p className="text-sm text-[#4a6a84] mt-1.5">
          Hola, <span className="font-semibold text-[#1b3a57]">{usuarioActivo?.nombre} {usuarioActivo?.apellido}</span>.
          Gestionando <span className="font-semibold text-[#1b3a57]">{misActivos.length}</span> actuación
          {misActivos.length !== 1 ? 'es' : ''} activa{misActivos.length !== 1 ? 's' : ''}.
        </p>
      </div>

      <HomeDesignSwitcher activo={2} />

      {/* Contadores: filas horizontales agrupadas, ancho completo */}
      <div>
        <div className="flex flex-wrap gap-2">
          <Tag
            label="Total de Causas Activas" valor={causasActivasCount}
            onClick={() => navigate(RUTAS.ACTUACIONES)}
          />
          <Tag
            label="Total de actuaciones activas" valor={misActivos.length}
            onClick={() => navigate(RUTAS.ACTUACIONES)}
          />
          <Tag
            label="Nuevas actuaciones (Asignado)" valor={asignadoCount}
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?estado=ASIGNADO`)}
          />
        </div>

        <SeparadorTags />

        <div className="flex flex-wrap gap-2">
          <Tag
            label="Actora" valor={intervencion.actora} color="#2a78d6"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?parte=Actora`)}
          />
          <Tag
            label="Demandada" valor={intervencion.demandada} color="#eda100"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?parte=Demandada`)}
          />
          <Tag
            label="Sin Intervención" valor={intervencion.sinIntervencion} color="#8aa0b3"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?parte=${encodeURIComponent('Sin Intervención')}`)}
          />
          <Tag
            label="Penal" valor={intervencion.penal} color="#7F77DD"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?area=PENAL`)}
          />
        </div>

        <SeparadorTags />

        <div className="flex flex-wrap gap-2">
          <Tag
            label="Tareas por vencer" valor={porVencerCount} color="#d97706"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?alerta=1`)}
          />
          <Tag
            label="Urgentes" valor={urgentesCount} color="#e34948"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?urgente=1`)}
          />
        </div>

        {tiposActivos.length > 0 && (
          <>
            <SeparadorTags />
            <p className="text-[10px] font-black text-[#7a9ab4] uppercase tracking-widest px-1 mb-1.5">
              Por tipo de gestión
            </p>
            <div className="flex flex-wrap gap-2">
              {tiposActivos.map(t => (
                <Tag
                  key={t.code} label={t.label} valor={t.count}
                  onClick={() => navigate(`${RUTAS.ACTUACIONES}?tipo=${encodeURIComponent(t.code)}`)}
                />
              ))}
            </div>
          </>
        )}

        <SeparadorTags />

        <div className="flex flex-wrap gap-2">
          <Tag
            label="Actuaciones cerradas" valor={cerradasCount}
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?tab=archivados`)}
          />
        </div>
      </div>

      {/* Vencimientos (angosto) + donuts */}
      <div className="grid grid-cols-[2fr_3fr] gap-6 items-start">
        <WidgetVencimientos items={vencimientos} />

        <div className="grid grid-cols-2 gap-4">
          <WidgetPorSubEstado expedientes={misActivos} />
          <WidgetTipoIntervencion expedientes={misActivos} />
        </div>
      </div>
    </div>
  )
}
