import { RUTAS } from '../../utils/routing'
import {
  Tag, SeparadorTags, WidgetVencimientos, WidgetPorSubEstado, WidgetTipoIntervencion,
  HomeDesignSwitcher, useHomeData,
} from './homeShared'

// Diseño 3: mismo esquema izquierda/derecha del Diseño 1, pero la columna
// izquierda es más angosta (w-56) y los grupos de tags se acomodan de a 2 por
// fila en vez de apilados. Ver homeShared.tsx para la lógica/cálculos compartidos.
export default function Home3Page() {
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

      <HomeDesignSwitcher activo={3} />

      <div className="flex gap-8 items-start">
        {/* Columna izquierda, más angosta: tags/contadores de a 2 por fila */}
        <div className="w-56 flex-shrink-0 space-y-2.5">
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

          <SeparadorTags />

          <div className="grid grid-cols-2 gap-2">
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

          <div className="grid grid-cols-2 gap-2">
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
              <p className="text-[10px] font-black text-[#7a9ab4] uppercase tracking-widest px-1 mb-1">
                Por tipo de gestión
              </p>
              <div className="grid grid-cols-2 gap-2">
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

          <Tag
            label="Actuaciones cerradas" valor={cerradasCount}
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?tab=archivados`)}
          />
        </div>

        {/* Columna derecha: sin cambios — vencimientos arriba, donuts abajo en fila */}
        <div className="flex-1 min-w-0 space-y-6">
          <WidgetVencimientos items={vencimientos} />

          <div className="grid grid-cols-2 gap-6">
            <WidgetPorSubEstado expedientes={misActivos} />
            <WidgetTipoIntervencion expedientes={misActivos} />
          </div>
        </div>
      </div>
    </div>
  )
}
