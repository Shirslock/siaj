import { useState, useEffect, useMemo } from 'react'
import type { Expediente, Actividad, TipoActividad, Tarea, Reply, LogAuditoria } from '../../../types'
import { getUsuarioById, getNombreCompleto } from '../../../data/usuarios'
import { TimelinePenal } from './TimelinePenal'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { useUIStore } from '../../../store/ui.store'
import { Modal } from '../../../components/ui/Modal'
import { formatFecha } from '../../../utils/format'
import { getEstadoProcesal, getEstadosProcesales, calcularUrgencia } from '../../../data/estadosProcesales'
import Icon from '../../../components/ui/Icon'
import { toast } from 'react-toastify'
import {
  actividadesToFilas, tareasToFilas, exportarExcel, exportarPDF,
  type FilaTimelineExport,
} from '../../../utils/exportTimeline'
import { useSolicitudesStore, PERSONAS_POR_AREA } from '../../../store/tareas.store'
import { useNotificacionesStore } from '../../../store/notificaciones.store'
import { SolicitudForm, BLANK_SOLICITUD } from '../../../components/SolicitudForm'
import { GenerarEscritoModal } from '../../../components/escritos/GenerarEscritoModal'
import { AdjuntosInput } from '../../../components/ui/AdjuntosInput'
import { StepperPRD, type PasoStepper } from '../../../components/timeline/StepperPRD'
import { EtapasAcordeon, type EtapaTL } from '../../../components/timeline/EtapasAcordeon'
import { aAdjuntoRef, adjuntosDeActividad } from '../../../utils/validarAdjuntos'

interface Props { exp: Expediente }

const TIPOS: { value: TipoActividad; label: string }[] = [
  { value: 'RECEPCION',      label: 'Recepción' },
  { value: 'CONTESTACION',   label: 'Contestación' },
  { value: 'PRESENTACION',   label: 'Presentación' },
  { value: 'AUDIENCIA',      label: 'Audiencia' },
  { value: 'PERICIA',        label: 'Pericia' },
  { value: 'TRASLADO',       label: 'Traslado' },
  { value: 'NOTIFICACION',   label: 'Notificación' },
  { value: 'MOVIMIENTO',     label: 'Movimiento' },
  { value: 'NOTA_RESPUESTA', label: 'Nota / Respuesta' },
  { value: 'RECURSO_INCIDENTE', label: 'Interposición de Recurso' },
  { value: 'DILIGENCIAMIENTO', label: 'Diligenciamiento' },
  { value: 'OTRO',           label: 'Otro' },
]

const HOY = new Date().toISOString().split('T')[0]

const BLANK_ACT = {
  tipo:              'MOVIMIENTO' as TipoActividad,
  titulo:            '',
  descripcion:       '',
  fecha:             HOY,
  doc_gde:           '',
  fecha_vencimiento: '',
  fecha_aviso:       '',
  mostrar_en_agenda: false,
  rango_aviso:       null as 'diario' | 5 | 10 | 15 | null,
}

type FiltroTab = 'todo' | 'sistema' | 'actividades' | 'tareas'

// ── Stepper de estados procesales ───────────────────────────────────────────

function ProcesalStepper({ exp }: { exp: Expediente }) {
  // En DESARCHIVADO (sub-estado fuera del ciclo) el stepper sigue marcando el
  // estado terminal del que salió la actuación.
  const estadoCodigo = exp.estadoProcesal === 'DESARCHIVADO'
    ? (exp.estado_previo_desarchivo ?? 'INICIO')
    : (exp.estadoProcesal ?? 'INICIO')
  const todosEstados = getEstadosProcesales(exp.tipo)

  // Filtrar ASIGNADO del stepper visual, empezar desde INICIO
  const estados = todosEstados.filter(e => e.codigo !== 'ASIGNADO')
  const idxActual = estados.findIndex(e => e.codigo === estadoCodigo)

  const pasos: PasoStepper[] = estados.map((estado, idx) => ({
    key: estado.codigo,
    label: estado.label,
    estado: idx === idxActual ? 'current' : idx < idxActual ? 'done' : 'pending',
  }))

  return <StepperPRD pasos={pasos} pendienteDeInicio={(exp.estadoProcesal ?? 'INICIO') === 'ASIGNADO'} />
}

// ── Tareas de una etapa (PRD §8.4 c) ─────────────────────────────────────────

function TareasEtapa({
  tareas,
  soloLectura = false,
  seleccionadaId,
  onSelect,
  puedeAvanzar = false,
}: {
  tareas: Tarea[]
  soloLectura?: boolean
  seleccionadaId?: string
  onSelect?: (t: Tarea) => void
  puedeAvanzar?: boolean
}) {
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const total = tareas.length
  const completadas = tareas.filter(t => t.estado === 'cumplido' || t.estado === 'no_procedente').length
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0
  const visibles = mostrarTodas ? tareas : tareas.slice(0, 8)

  if (total === 0) {
    return (
      <p className="text-center text-xs text-gray-400 py-3 border-b border-gray-100">
        Este estado no requiere tareas.
      </p>
    )
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      {soloLectura && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
          <Icon name="lock" size={14} className="flex-shrink-0" />
          Estado con retroceso activo — solo lectura. Podés agregar actividades genéricas.
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-gray-500">{completadas}/{total}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-gray-500">{pct}%</span>
      </div>

      <ul>
        {visibles.map((t, idx) => {
          const urg = calcularUrgencia(t.fechaVencimiento)
          const hecha = t.estado === 'cumplido'
          const clickeable = !!onSelect && !soloLectura
          return (
            <li
              key={t.id}
              onClick={clickeable ? () => onSelect!(t) : undefined}
              className={`flex items-center gap-2.5 py-2 px-2 -mx-2 rounded transition-colors ${
                clickeable ? 'cursor-pointer hover:bg-gray-50' : ''
              } ${seleccionadaId === t.id ? 'bg-blue-50' : ''}`}
            >
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                hecha ? 'bg-green-100 text-green-600'
                : t.estado === 'en_curso' ? 'bg-amber-100 text-amber-600'
                : t.estado === 'no_procedente' ? 'bg-gray-100 text-gray-400'
                : 'border-2 border-gray-300'
              }`}>
                {hecha && <Icon name="check" size={12} />}
                {t.estado === 'en_curso' && <Icon name="schedule" size={12} />}
                {t.estado === 'no_procedente' && <Icon name="block" size={12} />}
              </span>
              <span className={`text-sm flex-1 ${t.estado === 'no_procedente' ? 'text-gray-400' : 'text-gray-800'}`}>
                {String(idx + 1).padStart(2, '0')}. {t.nombre}
              </span>
              {t.fechaVencimiento && urg === 'rojo' && t.estado !== 'cumplido' && t.estado !== 'no_procedente' && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 flex-shrink-0">
                  <Icon name="warning" size={11} />
                  VENCIDA
                </span>
              )}
              {t.estado !== 'sin_estado' && (
                <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  hecha ? 'bg-green-100 text-green-700'
                  : t.estado === 'en_curso' ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
                }`}>
                  {hecha ? 'Cumplido' : t.estado === 'en_curso' ? 'En curso' : 'No proc.'}
                </span>
              )}
              {clickeable && <Icon name="chevron_right" size={14} className="text-gray-400 flex-shrink-0" />}
            </li>
          )
        })}
      </ul>

      {!mostrarTodas && total > 8 && (
        <button
          className="mt-1 text-xs text-gray-500 hover:text-gray-800"
          onClick={() => setMostrarTodas(true)}
        >
          + {total - 8} tareas más...
        </button>
      )}

      {puedeAvanzar && (
        <div className="mt-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          ✓ Ya podés pasar de Estado
        </div>
      )}
    </div>
  )
}

// ── Panel lateral de tarea ───────────────────────────────────────────────────

function TareaDetailPanel({
  tarea,
  estadoLabel,
  cambiosLocales,
  setCambiosLocales,
  onGuardar,
  onCerrar,
}: {
  tarea: Tarea
  estadoLabel: string
  cambiosLocales: Partial<Tarea>
  setCambiosLocales: React.Dispatch<React.SetStateAction<Partial<Tarea>>>
  onGuardar: () => void
  onCerrar: () => void
}) {
  // Adjuntos múltiples de la tarea: los ya guardados + los que se sumen en esta edición.
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([])
  useEffect(() => { setArchivosNuevos([]) }, [tarea.id])
  function cambiarArchivosNuevos(files: File[]) {
    setArchivosNuevos(files)
    setCambiosLocales(p => ({ ...p, adjuntos: [...(tarea.adjuntos ?? []), ...files.map(aAdjuntoRef)] }))
  }
  const estadoLocal = cambiosLocales.estado ?? tarea.estado ?? 'sin_estado'
  const urgenciaLocal = calcularUrgencia(
    cambiosLocales.fechaVencimiento !== undefined
      ? cambiosLocales.fechaVencimiento
      : tarea.fechaVencimiento
  )

  const estadoOpts: { value: Tarea['estado']; label: string; icon: string }[] = [
    { value: 'en_curso',      label: 'En curso',        icon: 'schedule' },
    { value: 'cumplido',      label: 'Cumplido',        icon: 'check_circle' },
    { value: 'no_procedente', label: 'No procedente',   icon: 'block' },
  ]

  return (
    <div className="w-96 flex-shrink-0 sticky top-4 self-start">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-card">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-200 bg-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                ESTADO PROCESAL · {estadoLabel.toUpperCase()}
              </p>
              <p className="text-sm font-semibold text-gray-800 leading-snug">{tarea.nombre}</p>
            </div>
            <button
              onClick={onCerrar}
              className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Pill estado actual */}
          <div className="mt-2">
            {estadoLocal === 'sin_estado' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                <Icon name="radio_button_unchecked" size={12} />
                Pendiente
              </span>
            ) : estadoLocal === 'cumplido' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                <Icon name="check_circle" size={12} />
                Cumplido
              </span>
            ) : estadoLocal === 'en_curso' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                <Icon name="schedule" size={12} />
                En curso
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                <Icon name="block" size={12} />
                No procedente
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* Observaciones */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">Observaciones</label>
              <span className="text-[9px] text-gray-500">
                {(cambiosLocales.observaciones ?? tarea.observaciones ?? '').length} car.
              </span>
            </div>
            <textarea
              className="field-input resize-none w-full text-xs"
              style={{ minHeight: 80 }}
              value={cambiosLocales.observaciones ?? tarea.observaciones ?? ''}
              onChange={e => setCambiosLocales(p => ({ ...p, observaciones: e.target.value }))}
              placeholder="Registrá notas o avances..."
            />
          </div>

          {/* Estado de la actividad */}
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-2">
              Estado de la actividad
            </label>
            <div className="flex gap-2 py-2">
              {estadoOpts.map(opt => {
                const isActive = estadoLocal === opt.value
                const activeClass =
                  opt.value === 'cumplido'      ? 'border-blue-700 bg-blue-700 text-white text-sm' :
                  opt.value === 'en_curso'       ? 'border-amber-500 bg-amber-50 text-amber-700 text-sm' :
                                                   'border-gray-300 bg-gray-100 text-gray-500 text-sm'
                return (
                  <button
                    key={opt.value}
                    onClick={() => setCambiosLocales(p => ({ ...p, estado: opt.value }))}
                    className={`flex flex-1 items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                      isActive ? activeClass : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Icon name={opt.icon} size={20} />
                    <span className="text-[10px] font-semibold leading-tight">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">
                Fecha de actualización
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="field-input w-full text-xs [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  value={cambiosLocales.fecha ?? tarea.fecha ?? HOY}
                  onChange={e => setCambiosLocales(p => ({ ...p, fecha: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">
                Fecha de vencimiento
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="field-input w-full text-xs [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  value={cambiosLocales.fechaVencimiento ?? tarea.fechaVencimiento ?? ''}
                  onChange={e => setCambiosLocales(p => ({ ...p, fechaVencimiento: e.target.value || null }))}
                />
              </div>
              {urgenciaLocal === 'rojo' && (
                <p className="text-[9px] text-red-700 mt-1 flex items-center gap-1">
                  <Icon name="warning" size={11} />
                  Plazo vencido
                </p>
              )}
              {/* Sin fecha pill */}
              <div className="h-3 mt-1">
                {!(cambiosLocales.fechaVencimiento ?? tarea.fechaVencimiento) && (
                  <span className="text-[9px] text-gray-500">Sin fecha</span>
                )}
              </div>
            </div>
          </div>

          {/* Mostrar en agenda — opcional */}
          {(cambiosLocales.fechaVencimiento ?? tarea.fechaVencimiento) && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setCambiosLocales(p => ({ ...p, mostrar_en_agenda: !(p.mostrar_en_agenda ?? tarea.mostrar_en_agenda ?? false) }))}
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${
                  (cambiosLocales.mostrar_en_agenda ?? tarea.mostrar_en_agenda ?? false) ? 'bg-blue-700' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  (cambiosLocales.mostrar_en_agenda ?? tarea.mostrar_en_agenda ?? false) ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800">Mostrar en agenda</p>
                <p className="text-[10px] text-gray-500">Aparecerá en el calendario en la fecha de vencimiento</p>
              </div>
            </label>
          )}

          {/* Fecha de aviso */}
          {(cambiosLocales.fechaVencimiento ?? tarea.fechaVencimiento) && (
            <div>
              <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide block mb-1">
                Fecha de aviso
              </label>
              <p className="text-[10px] text-gray-400 mb-1.5">
                A partir de qué fecha recibir el aviso de proximidad al vencimiento.
              </p>
              <input
                type="date"
                className="field-input w-full text-xs [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                max={cambiosLocales.fechaVencimiento ?? tarea.fechaVencimiento ?? undefined}
                value={cambiosLocales.fecha_aviso ?? tarea.fecha_aviso ?? ''}
                onChange={e => setCambiosLocales(p => ({
                  ...p,
                  fecha_aviso: e.target.value || undefined,
                  alertaActiva: !!e.target.value,
                }))}
              />
            </div>
          )}

          {/* Rango de aviso */}
          {(cambiosLocales.fecha_aviso ?? tarea.fecha_aviso) && (
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-2">
                Frecuencia de notificación
              </label>
              <div className="flex gap-2">
                {([
                  { value: 'diario', label: 'Todos los días' },
                  { value: 5,        label: 'Cada 5 días' },
                  { value: 10,       label: 'Cada 10 días' },
                  { value: 15,       label: 'Cada 15 días' },
                ] as const).map(op => {
                  const actual = cambiosLocales.rango_aviso ?? tarea.rango_aviso ?? null
                  return (
                    <button
                      key={String(op.value)}
                      onClick={() => setCambiosLocales(p => ({ ...p, rango_aviso: op.value }))}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                        actual === op.value
                          ? 'bg-blue-700 border-blue-700 text-white'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {op.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documento GDE */}
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">
              Documento GDE
            </label>
            <input
              type="text"
              className="field-input font-mono text-xs w-full"
              placeholder="EX-2026-..."
              value={cambiosLocales.docGde ?? tarea.docGde ?? ''}
              onChange={e => setCambiosLocales(p => ({ ...p, docGde: e.target.value || null }))}
            />
          </div>

          {/* Adjunto */}
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">
              Adjuntos
            </label>
            {(tarea.adjuntos ?? []).length > 0 && (
              <div className="space-y-1 mb-1.5">
                {(tarea.adjuntos ?? []).map((a, i) => (
                  <div key={`${a.nombre}-${i}`} className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Icon name="attach_file" size={13} />
                    <span className="truncate flex-1">{a.nombre}</span>
                    <span className="text-[10px]">{a.size}</span>
                  </div>
                ))}
              </div>
            )}
            <AdjuntosInput archivos={archivosNuevos} onChange={cambiarArchivosNuevos} compacto />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex gap-2 justify-end border-t border-gray-200 pt-3">
          <button
            onClick={onCerrar}
            className="px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-700 text-white hover:opacity-90 transition-opacity"
          >
            <Icon name="save" size={14} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Lista de replies ─────────────────────────────────────────────────────────

function ReplyList({ replies }: { replies: Reply[] }) {
  if (!replies.length) return null
  return (
    <div className="ml-10 mr-4 mb-2 space-y-1.5">
      {replies.map(reply => {
        const autorU = getUsuarioById(reply.autor_id)
        return (
          <div key={reply.id} className="pl-4 border-l-2 border-blue-200">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-gray-800">
                  {autorU ? getNombreCompleto(autorU) : reply.autor_id}
                </span>
                <span className="text-[10px] text-gray-400">{formatFecha(reply.fecha)}</span>
              </div>
              <p className="text-xs text-gray-800 whitespace-pre-wrap">{reply.texto}</p>
              {reply.doc_gde && (
                <p className="text-[10px] font-mono text-gray-800 mt-1.5 flex items-center gap-1">
                  <Icon name="attach_file" size={11} />
                  {reply.doc_gde}
                </p>
              )}
              {reply.fecha_vencimiento && (
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-500">Vence: {formatFecha(reply.fecha_vencimiento)}</span>
                  {reply.fecha_aviso && (
                    <span className="text-[10px] text-amber-700">Aviso: {formatFecha(reply.fecha_aviso)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Historial de auditoría ───────────────────────────────────────────────────

function LogAuditoriaList({ log }: { log: LogAuditoria[] }) {
  if (!log.length) return null
  return (
    <div className="ml-10 mr-4 mb-1">
      <details className="group">
        <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-500 list-none flex items-center gap-1 select-none">
          <Icon name="history" size={11} />
          {log.length} registro{log.length > 1 ? 's' : ''} de auditoría
          <Icon name="expand_more" size={11} className="group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
          {log.map(entry => {
            const autor = getUsuarioById(entry.usuario_id)
            return (
              <div key={entry.id} className="text-[10px] text-gray-400">
                <span className={`font-semibold mr-1 ${entry.tipo === 'ELIMINACION' ? 'text-red-700' : 'text-gray-500'}`}>
                  {entry.tipo === 'EDICION' ? '✎ Editado' : '✕ Eliminado'}
                </span>
                por {autor ? getNombreCompleto(autor) : entry.usuario_id}
                {' · '}
                {new Date(entry.timestamp).toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
                })}
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export function TimelineTab({ exp }: Props) {
  if (exp.area === 'PENAL') {
    return <TimelinePenal exp={exp} />
  }

  const {
    tareasMap, inicializarTareas, actualizarTarea,
    agregarActividad, actualizarExpediente, agregarReply,
    editarActividad, eliminarActividad,
  } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const { agregarSolicitud } = useSolicitudesStore()

  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null)
  const [cambiosLocales, setCambiosLocales] = useState<Partial<Tarea>>({})
  const [modalNuevaActividad, setModalNuevaActividad] = useState(false)
  const [formAct, setFormAct] = useState(BLANK_ACT)
  const [adjuntosNuevaAct, setAdjuntosNuevaAct] = useState<File[]>([])
  const [esImpulsorio, setEsImpulsorio] = useState(false)
  const [filtroTab, setFiltroTab] = useState<FiltroTab>('todo')
  const [busqueda, setBusqueda] = useState('')
  const [menuExport, setMenuExport] = useState(false)
  const [replyTarget, setReplyTarget] = useState<{ act: Actividad; globalIdx: number } | null>(null)
  const [formReply, setFormReply] = useState({ texto: '', doc_gde: '', fecha: HOY, fecha_vencimiento: '', fecha_aviso: '' })
  const [editTarget, setEditTarget] = useState<{ act: Actividad; globalIdx: number } | null>(null)
  const [formEdit, setFormEdit] = useState({
    titulo: '', descripcion: '', fecha: '', doc_gde: '', fecha_vencimiento: '', fecha_aviso: '',
  })
  const [menuActividad, setMenuActividad] = useState<{ act: Actividad; globalIdx: number; x: number; y: number } | null>(null)
  const [tabModal, setTabModal] = useState<'generica' | 'solicitud'>('generica')
  const [formSolicitud, setFormSolicitud] = useState(BLANK_SOLICITUD)
  const [modalEscrito, setModalEscrito] = useState(false)
  const [escritoIdSeleccionado, setEscritoIdSeleccionado] = useState<string | null>(null)

  function limpiarFormReply() {
    setFormReply({ texto: '', doc_gde: '', fecha: HOY, fecha_vencimiento: '', fecha_aviso: '' })
  }

  function cerrarModal() {
    setModalNuevaActividad(false)
    setEsImpulsorio(false)
    setTabModal('generica')
    setFormSolicitud(BLANK_SOLICITUD)
    setEscritoIdSeleccionado(null)
  }

  function guardarSolicitud() {
    if (!formSolicitud.titulo.trim()) return

    const esExterna = !!formSolicitud.area_destinataria
    // Destinatario obligatorio: interno vía asignado_a, externo vía área destinataria
    if (!formSolicitud.asignado_a.length && !formSolicitud.area_destinataria) {
      toast.error('Debés seleccionar un destinatario.')
      return
    }

    // Nombres de destinatarios (internos por USUARIOS, externos por PERSONAS_POR_AREA)
    const nombres = formSolicitud.asignado_a.map(id => {
      const u = getUsuarioById(id)
      if (u) return `${u.apellido}, ${u.nombre}`
      return PERSONAS_POR_AREA.find(p => p.id === id)?.nombre ?? id
    })
    const asignadoNombre = nombres.length ? nombres.join(', ') : (formSolicitud.area_destinataria || 'Sin asignar')

    agregarSolicitud({
      tipo:                esExterna ? 'externa' : 'interna',
      titulo:              formSolicitud.titulo.trim(),
      descripcion:         formSolicitud.descripcion.trim(),
      expediente_id:       exp.id,
      expediente_caratula: exp.caratula ?? exp.id,
      expediente_area:     exp.area,
      creado_por:          usuarioActivo?.id ?? '',
      asignado_a:          formSolicitud.asignado_a,
      asignado_a_nombre:   asignadoNombre,
      area_destinataria:   formSolicitud.area_destinataria || undefined,
      persona_contacto_id: formSolicitud.persona_contacto_id || undefined,
      persona_contacto:    formSolicitud.persona_contacto || undefined,
      prioridad:           formSolicitud.prioridad,
      fecha_limite:        formSolicitud.fecha_limite || null,
      estado:              'pendiente',
      created_at:          new Date().toISOString(),
    })

    const prioridadLabel = {
      alta:  '🔴 Alta',
      media: '🟡 Media',
      baja:  '🟢 Baja',
    }[formSolicitud.prioridad] ?? formSolicitud.prioridad

    agregarActividad(exp.id, {
      id: `SOL_${Date.now()}`,
      expediente_id: exp.id,
      tipo: 'OTRO' as TipoActividad,
      titulo: `Solicitud: ${formSolicitud.titulo.trim()}`,
      descripcion: [
        formSolicitud.descripcion.trim(),
        `Asignado a: ${asignadoNombre}`,
        `Prioridad: ${prioridadLabel}`,
        formSolicitud.fecha_limite ? `Fecha límite: ${formSolicitud.fecha_limite}` : null,
      ].filter(Boolean).join('\n'),
      fecha: new Date().toISOString().split('T')[0],
      activo: true,
      subitems: [],
      estadoExpediente: exp.estadoProcesal ?? exp.estado,
      es_solicitud: true,
      ...(formSolicitud.fecha_limite ? { fecha_vencimiento: formSolicitud.fecha_limite, fecha_aviso: formSolicitud.fecha_limite } : {}),
    } as Actividad)

    toast.success('Solicitud creada.')
    cerrarModal()
  }

  function confirmarReply() {
    if (!replyTarget || !formReply.texto.trim()) return
    agregarReply(exp.id, replyTarget.globalIdx, {
      autor_id:           usuarioActivo?.id ?? '',
      texto:              formReply.texto.trim(),
      fecha:              formReply.fecha,
      doc_gde:            formReply.doc_gde || undefined,
      fecha_vencimiento:  formReply.fecha_vencimiento || undefined,
      fecha_aviso:        formReply.fecha_aviso || undefined,
    })
    limpiarFormReply()
    setReplyTarget(null)
    toast.success('Comentario agregado.')
  }

  function abrirEdicion(act: Actividad, globalIdx: number) {
    setEditTarget({ act, globalIdx })
    setFormEdit({
      titulo:            act.titulo,
      descripcion:       act.descripcion ?? '',
      fecha:             act.fecha,
      doc_gde:           act.doc_gde ?? '',
      fecha_vencimiento: act.fecha_vencimiento ?? '',
      fecha_aviso:       act.fecha_aviso ?? '',
    })
  }

  function confirmarEdicion() {
    if (!editTarget || !formEdit.titulo.trim()) return
    editarActividad(
      exp.id,
      editTarget.globalIdx,
      {
        titulo:            formEdit.titulo.trim(),
        descripcion:       formEdit.descripcion.trim(),
        fecha:             formEdit.fecha,
        doc_gde:           formEdit.doc_gde || undefined,
        fecha_vencimiento: formEdit.fecha_vencimiento || undefined,
        fecha_aviso:       formEdit.fecha_aviso || undefined,
      },
      usuarioActivo?.id ?? ''
    )
    toast.success('Actividad actualizada.')
    setEditTarget(null)
  }

  // El vencimiento ya se cumplió: la actividad queda con su registro pero deja de alertar
  // (Home, Bandeja, campana) y en la Agenda figura como cumplida.
  function marcarVencimientoCumplido(globalIdx: number) {
    editarActividad(exp.id, globalIdx, { estado: 'COMPLETADA' }, usuarioActivo?.id ?? '')
    toast.success('Vencimiento marcado como cumplido.')
  }

  function confirmarEliminacion(globalIdx: number) {
    if (!confirm('¿Eliminás esta actividad? Quedará un registro de auditoría.')) return
    eliminarActividad(exp.id, globalIdx, usuarioActivo?.id ?? '')
    toast.success('Actividad eliminada. Registro de auditoría generado.')
  }

  const estadoCodigo = exp.estadoProcesal ?? 'INICIO'
  const estadoProcesal = getEstadoProcesal(exp.tipo, estadoCodigo)
  const key = `${exp.id}__${estadoCodigo}`
  const esEstadoInicial = estadoCodigo === 'ASIGNADO'

  useEffect(() => {
    if (!tareasMap[key] && estadoProcesal) {
      inicializarTareas(exp.id, estadoCodigo, estadoProcesal.tareas)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exp.id, estadoCodigo])

  useEffect(() => {
    setCambiosLocales({})
  }, [tareaSeleccionada?.id])

  const tareas = tareasMap[key] ?? estadoProcesal?.tareas ?? []
  const completadas = tareas.filter(t => t.estado === 'cumplido' || t.estado === 'no_procedente').length
  const total = tareas.length

  const estadoFueAvanzado = useMemo(() =>
    estadoProcesal
      ? exp.timeline.some(act =>
          act.tipo === 'MOVIMIENTO' &&
          (act.titulo.startsWith(`Cambio de estado: ${estadoProcesal.label} →`) ||
           act.titulo.startsWith(`Retroceso de estado: ${estadoProcesal.label} →`))
        )
      : false
  , [exp.timeline, estadoProcesal])

  const sorted = [...exp.timeline].filter(a => !a.eliminado).sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Filtrar feed
  const feedFiltrado = sorted.filter(act => {
    if (act.tipo === 'RECEPCION') return false  // se renderiza por separado
    const esSistema = act.tipo === 'MOVIMIENTO' && !!act.estadoExpediente &&
      (act.titulo.startsWith('Cambio de estado') || act.titulo.startsWith('Retroceso de estado'))
    const esActividad = !esSistema
    const esHija = esActividad && !!act.estadoExpediente && sorted.some(
      padre => padre !== act && padre.tipo === 'MOVIMIENTO' &&
        (padre.titulo.startsWith('Cambio de estado') || padre.titulo.startsWith('Retroceso de estado')) &&
        padre.estadoExpediente === act.estadoExpediente
    )
    if (filtroTab === 'sistema') return esSistema
    if (filtroTab === 'actividades') return esActividad
    if (filtroTab === 'tareas') return false
    return !esHija  // en "todo": solo raíz (sistema + actividades sin estado asignado)
  }).filter(act => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return act.titulo.toLowerCase().includes(q) || act.descripcion?.toLowerCase().includes(q)
  })

  // Grupos para feed colapsable (sistema + actividades del período)
  const gruposFeed = useMemo(() => {
    const esSistemaEntry = (a: Actividad) =>
      a.tipo === 'MOVIMIENTO' && !!a.estadoExpediente &&
      (a.titulo.startsWith('Cambio de estado') || a.titulo.startsWith('Retroceso de estado'))

    // La entrada de recepción se renderiza siempre fija al final, fuera de los bloques
    const entradaRecepcion = sorted.find(a => a.tipo === 'RECEPCION') ?? null
    const sortedSinRecepcion = sorted.filter(a => a.tipo !== 'RECEPCION')

    // Índices de cada entrada sistema en sortedSinRecepcion
    const sistemasIdx = sortedSinRecepcion
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => esSistemaEntry(a))
      .map(({ i }) => i)

    const result: { sistema: Actividad | null; tareasHist: Tarea[]; actividades: Actividad[] }[] = []

    for (let gi = 0; gi < sistemasIdx.length; gi++) {
      const idxS = sistemasIdx[gi]
      const idxNext = gi + 1 < sistemasIdx.length ? sistemasIdx[gi + 1] : sortedSinRecepcion.length
      const actsDelPeriodo = sortedSinRecepcion.slice(idxS + 1, idxNext).filter(a => !esSistemaEntry(a))
      result.push({ sistema: sortedSinRecepcion[idxS], tareasHist: getTareasHistoricas(sortedSinRecepcion[idxS]), actividades: actsDelPeriodo })
    }

    // Período actual: actividades más recientes que el último cambio de estado
    const ultimoSistemaIdx = sistemasIdx.length > 0 ? sistemasIdx[sistemasIdx.length - 1] : -1
    const actsActuales = sortedSinRecepcion.slice(ultimoSistemaIdx + 1).filter(a => !esSistemaEntry(a))
    result.push({ sistema: null, tareasHist: [], actividades: actsActuales })

    return { grupos: result.reverse(), entradaRecepcion }
  }, [sorted])

  // Delta 3 / 4B — en DESARCHIVADO se admite UNA actividad genérica (lo cargado
  // desde el último cambio de estado, que es el que llevó a Desarchivado);
  // después hay que volver a archivo desde Cambiar estado.
  const enDesarchivado = (exp.estadoProcesal ?? exp.estado) === 'DESARCHIVADO'
  const yaCargoEnDesarchivado = enDesarchivado && (gruposFeed.grupos[0]?.actividades.length ?? 0) > 0

  // Contadores para tabs
  const cntSistema     = sorted.filter(a => a.tipo === 'MOVIMIENTO' && !!a.estadoExpediente).length
  const cntActividades = sorted.filter(a => !(a.tipo === 'MOVIMIENTO' && !!a.estadoExpediente)).length
  const cntTareas      = total

  function getEstadoAnterior(act: Actividad): string | null {
    const match = act.titulo.match(/(?:Cambio|Retroceso) de estado: (.+) → (.+)/)
    if (!match) return null
    const labelAnterior = match[1].trim()
    const encontrado = getEstadosProcesales(exp.tipo).find(e => e.label === labelAnterior)
    return encontrado?.codigo ?? null
  }

  function getTareasHistoricas(act: Actividad): Tarea[] {
    const codigoAnterior = getEstadoAnterior(act)
    if (!codigoAnterior || codigoAnterior === 'ASIGNADO') return []
    const keyAnterior = `${exp.id}__${codigoAnterior}`
    return tareasMap[keyAnterior] ?? act.tareasSnapshot ?? []
  }

  function guardarTarea() {
    if (!tareaSeleccionada) return
    actualizarTarea(exp.id, estadoCodigo, tareaSeleccionada.id, cambiosLocales)
    const rangoFinal = cambiosLocales.rango_aviso ?? tareaSeleccionada.rango_aviso
    const fechaAvisoFinal = cambiosLocales.fecha_aviso ?? tareaSeleccionada.fecha_aviso
    if (fechaAvisoFinal && rangoFinal && usuarioActivo?.id) {
      useNotificacionesStore.getState().agregarNotificacion({
        tipo: 'ALERTA_VENCIMIENTO',
        titulo: `Vencimiento próximo: ${tareaSeleccionada.nombre}`,
        descripcion: `Vence el ${tareaSeleccionada.fechaVencimiento ?? cambiosLocales.fechaVencimiento}. Aviso desde ${fechaAvisoFinal}.`,
        expedienteId: exp.id,
        tipoGestion: exp.tipo ?? '',
        caratula: exp.caratula ?? '',
        numeroCausa: exp.numero_causa ?? null,
        leida: false,
        fecha: new Date().toISOString(),
        destinatarioId: usuarioActivo.id,
      })
    }
    toast.success('Tarea actualizada.')
    setTareaSeleccionada(null)
  }

  // ⚠️ MODO DEMO TEMPORAL — cualquier rol puede Comentar/Editar/Eliminar
  // para facilitar pruebas. Regla real (revertir después de la demo):
  //   usuarioActivo?.id === exp.abogado_id
  //   || usuarioActivo?.rolSistema === 'COORDINADOR'
  const esLetrado = true

  function globalIdxDe(act: Actividad): number {
    return exp.timeline.indexOf(act)
  }

  function esMovimientoSistema(act: Actividad): boolean {
    return act.tipo === 'MOVIMIENTO' && !!act.estadoExpediente &&
      (act.titulo.startsWith('Cambio de estado') || act.titulo.startsWith('Retroceso de estado'))
  }

  function agregarNuevaActividad() {
    if (!formAct.titulo.trim() || !formAct.descripcion.trim()) return
    const act: Actividad = {
      id: `ACT_${Date.now()}`,
      expediente_id: exp.id,
      tipo: formAct.tipo,
      titulo: formAct.titulo,
      descripcion: formAct.descripcion,
      fecha: formAct.fecha,
      doc_gde: formAct.doc_gde.trim() || null,
      ...(adjuntosNuevaAct.length > 0 ? { adjuntos: adjuntosNuevaAct.map(aAdjuntoRef) } : {}),
      subitems: [],
      activo: false,
      creado_por: usuarioActivo?.id,
      es_movimiento_impulsorio: esImpulsorio || undefined,
      escrito_id: escritoIdSeleccionado ?? undefined,
      escrito_estado: escritoIdSeleccionado ? 'GENERADO' : undefined,
      ...(formAct.fecha_vencimiento ? { fecha_vencimiento: formAct.fecha_vencimiento } : {}),
      ...(formAct.fecha_aviso       ? { fecha_aviso:       formAct.fecha_aviso       } : {}),
    } as Actividad
    agregarActividad(exp.id, act)
    if (esImpulsorio) {
      actualizarExpediente(exp.id, {
        fecha_ultimo_impulsorio: formAct.fecha || new Date().toISOString().split('T')[0],
      })
    }
    toast.success('Actividad registrada.')
    cerrarModal()
    setFormAct(BLANK_ACT)
    setAdjuntosNuevaAct([])
    setEscritoIdSeleccionado(null)
  }

  const nombreArchivo = `timeline_${exp.id.replace('/', '-')}_${new Date().toISOString().split('T')[0]}`
  const tituloDoc     = `Timeline — ${exp.id}`
  const subtituloDoc  = exp.caratula

  function getFilasExport(): FilaTimelineExport[] {
    const filasActividades = actividadesToFilas(feedFiltrado, exp.id, exp.area).map((fila, i) => {
      if (fila.tipo !== 'Sistema') return fila
      const tareasHist = getTareasHistoricas(feedFiltrado[i])
      const tareasDetalle = tareasHist.length > 0
        ? tareasHist.map(t => {
            const icono = t.estado === 'cumplido' ? '✓'
              : t.estado === 'no_procedente' ? '⊘'
              : t.estado === 'en_curso' ? '⏱'
              : '○'
            return `${icono} ${t.nombre}`
          }).join('\n')
        : ''
      return { ...fila, tareasDetalle }
    })
    const recepcion = gruposFeed.entradaRecepcion
    if (recepcion) {
      filasActividades.push(...actividadesToFilas([recepcion], exp.id, exp.area))
    }
    const filasTareas = tareasToFilas(tareas, estadoCodigo, exp.id, exp.area)
    if (filtroTab === 'tareas')      return filasTareas
    if (filtroTab === 'sistema' || filtroTab === 'actividades') return filasActividades
    return [...filasActividades, ...filasTareas]
      .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
  }

  useEffect(() => {
    if (!menuExport) return
    const handler = () => setMenuExport(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuExport])

  useEffect(() => {
    if (!menuActividad) return
    const handler = () => setMenuActividad(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuActividad])

  // ── Etapas (acordeón del PRD) ───────────────────────
  const nombreDe = (id?: string) => {
    const u = id ? getUsuarioById(id) : undefined
    return u ? getNombreCompleto(u) : undefined
  }

  const TIPO_LABEL_ACT: Record<string, string> = Object.fromEntries(TIPOS.map(t => [t.value, t.label]))

  function renderEventoCL(a: Actividad) {
    const adjuntos = adjuntosDeActividad(a)
    return (
      <div>
        <div className="flex items-start gap-2.5 py-3 -mx-2 px-2 rounded hover:bg-gray-50 transition-colors">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mt-0.5">
            <Icon name="notes" size={12} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700">
                {TIPO_LABEL_ACT[a.tipo] ?? a.tipo}
              </span>
              {a.es_solicitud && a.tipo === 'NOTA_RESPUESTA' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">Respuesta</span>
              )}
              {a.es_solicitud && a.tipo !== 'NOTA_RESPUESTA' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700">Solicitud</span>
              )}
              {a.es_movimiento_impulsorio && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700">Impulsorio</span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800">{a.titulo}</p>
            {a.descripcion && <p className="text-xs text-gray-500">{a.descripcion}</p>}
            {(a.doc_gde || adjuntos.length > 0) && (
              <div className="flex flex-wrap gap-3 mt-1">
                {a.doc_gde && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-700">
                    <Icon name="description" size={12} />{a.doc_gde}
                  </span>
                )}
                {adjuntos.map((adj, i) => (
                  <span key={`${adj.nombre}-${i}`} className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                    <Icon name="attach_file" size={12} />{adj.nombre}
                  </span>
                ))}
              </div>
            )}
            {a.fecha_vencimiento && (
              <div className="mt-1.5">
                {a.estado === 'COMPLETADA' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    <Icon name="check_circle" size={12} />
                    Vencimiento cumplido · {formatFecha(a.fecha_vencimiento)}
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    a.fecha_vencimiento <= HOY ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    <Icon name="clock" size={12} />
                    {a.fecha_vencimiento < HOY ? 'Venció' : a.fecha_vencimiento === HOY ? 'Vence hoy' : 'Vence'} · {formatFecha(a.fecha_vencimiento)}
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{formatFecha(a.fecha)}</span>
        </div>
        {esLetrado && !a.es_solicitud && (
          <div className="ml-7 pb-2 flex items-center gap-3">
            <button
              onClick={() => setReplyTarget({ act: a, globalIdx: globalIdxDe(a) })}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Icon name="reply" size={13} />
              Comentar
            </button>
            {a.tipo !== 'RECEPCION' && !esMovimientoSistema(a) && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  const r = e.currentTarget.getBoundingClientRect()
                  setMenuActividad({ act: a, globalIdx: globalIdxDe(a), x: r.left, y: r.bottom + 4 })
                }}
                className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Icon name="more_vert" size={14} />
              </button>
            )}
          </div>
        )}
        {(a.replies ?? []).length > 0 && (
          <div className="ml-7 mb-2 space-y-1.5">
            <ReplyList replies={a.replies ?? []} />
          </div>
        )}
        <LogAuditoriaList log={a.log ?? []} />
      </div>
    )
  }

  function renderRecepcionCL(a: Actividad) {
    return (
      <div className="flex items-start gap-2.5 py-3">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center mt-0.5">
          <Icon name="swap_horiz" size={12} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-800 font-medium leading-snug">{a.titulo}</p>
          {a.descripcion && <p className="text-xs text-gray-500">{a.descripcion}</p>}
          {a.doc_gde && (
            <p className="text-[10px] font-mono text-gray-700 mt-1 flex items-center gap-1">
              <Icon name="attach_file" size={12} />{a.doc_gde}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatFecha(a.fecha)}</span>
      </div>
    )
  }

  // El orden de exp.timeline es cronológico: lo posterior a una transición de estado ocurrió en
  // el estado al que esa transición ingresó.
  const etapasCL: EtapaTL[] = (() => {
    const sinRecep = sorted.filter(a => a.tipo !== 'RECEPCION')
    const recepcion = sorted.find(a => a.tipo === 'RECEPCION')
    const idxT = sinRecep.map((a, i) => ({ a, i })).filter(({ a }) => esMovimientoSistema(a)).map(({ i }) => i)
    const q = busqueda.trim().toLowerCase()
    const mostrarEventos = filtroTab === 'todo' || filtroTab === 'actividades'
    const mostrarTareas  = filtroTab === 'todo' || filtroTab === 'tareas'
    const pasa = (a: Actividad) => {
      if (!mostrarEventos || esMovimientoSistema(a)) return false
      if (q && !(a.titulo.toLowerCase().includes(q) || a.descripcion?.toLowerCase().includes(q))) return false
      return true
    }
    const entre = (desde: number, hasta: number) => sinRecep.slice(desde, hasta).filter(pasa).reverse()
    const parse = (a: Actividad) => {
      const m = a.titulo.match(/(?:Cambio|Retroceso) de estado: (.+) → (.+)/)
      return { anterior: m?.[1]?.trim() ?? '', nueva: m?.[2]?.trim() ?? a.estadoExpediente ?? '' }
    }
    const esAsignado = (label: string) => /asignad/i.test(label)
    const recepcionNodo = recepcion && mostrarEventos && (!q || (recepcion.titulo + (recepcion.descripcion ?? '')).toLowerCase().includes(q))
      ? [renderRecepcionCL(recepcion)] : []

    const tareasActual = mostrarTareas && !esEstadoInicial && estadoProcesal ? (
      <TareasEtapa
        tareas={tareas}
        soloLectura={estadoFueAvanzado}
        seleccionadaId={tareaSeleccionada?.id}
        onSelect={t => { setTareaSeleccionada(t); setCambiosLocales({}) }}
        puedeAvanzar={(total === 0 || completadas === total) && !!estadoProcesal.siguiente}
      />
    ) : undefined

    if (idxT.length === 0) {
      return [{
        key: 'actual',
        label: estadoProcesal?.label ?? estadoCodigo,
        actual: true,
        fecha: sorted.length ? sorted[0].fecha : HOY,
        extra: tareasActual,
        eventos: [...entre(0, sinRecep.length).map(renderEventoCL), ...recepcionNodo],
        vacio: esEstadoInicial ? 'Actuación pendiente de inicio.' : undefined,
      }]
    }

    const etapas: EtapaTL[] = []
    for (let j = idxT.length - 1; j >= 0; j--) {
      const T = sinRecep[idxT[j]]
      const sig = j + 1 < idxT.length ? sinRecep[idxT[j + 1]] : undefined
      const { anterior } = parse(T)
      const fin = sig ? idxT[j + 1] : sinRecep.length
      let nodos = entre(idxT[j] + 1, fin).map(renderEventoCL)
      if (j === 0 && esAsignado(anterior)) {
        nodos = [...nodos, ...entre(0, idxT[0]).map(renderEventoCL), ...recepcionNodo]
      }
      etapas.push({
        key: `et-${j}`,
        label: parse(T).nueva,
        actual: !sig,
        fecha: T.fecha,
        ingreso: !sig ? { label: anterior, por: nombreDe(T.creado_por) } : undefined,
        salida: sig ? { label: parse(sig).nueva, por: nombreDe(sig.creado_por) } : undefined,
        extra: !sig
          ? tareasActual
          : (mostrarTareas
              ? (() => {
                  const hist = getTareasHistoricas(sig)
                  return hist.length > 0 ? <TareasEtapa tareas={hist} soloLectura={false} /> : undefined
                })()
              : undefined),
        eventos: nodos,
      })
    }
    const primera = sinRecep[idxT[0]]
    if (!esAsignado(parse(primera).anterior)) {
      const pre = entre(0, idxT[0])
      etapas.push({
        key: 'et-pre',
        label: parse(primera).anterior,
        actual: false,
        fecha: sinRecep[0]?.fecha ?? primera.fecha,
        salida: { label: parse(primera).nueva, por: nombreDe(primera.creado_por) },
        eventos: [...pre.map(renderEventoCL), ...recepcionNodo],
      })
    }
    return etapas
  })()

  const FILTRO_TABS: { key: FiltroTab; label: string; count?: number }[] = [
    { key: 'todo',        label: 'Todo' },
    { key: 'sistema',     label: 'Sistema',     count: cntSistema },
    { key: 'actividades', label: 'Actividades', count: cntActividades },
    { key: 'tareas',      label: 'Tareas',      count: cntTareas },
  ]

  return (
    <div className="space-y-5">

      {/* ── Stepper procesal ── */}
      <ProcesalStepper exp={exp} />

      {enDesarchivado && (
        <div className="flex items-start gap-2 px-4 py-3 bg-amber-100 border border-amber-200 rounded-lg">
          <Icon name="info" size={14} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            {yaCargoEnDesarchivado
              ? 'Ya se registró la actividad en Desarchivado. Volvé a archivo desde el botón + → Cambiar estado.'
              : 'Actuación desarchivada: podés cargar una actividad genérica. Después volvé a archivo desde el botón + → Cambiar estado.'}
          </p>
        </div>
      )}

      {/* ── Ciclo de Vida — Actividades (PRD letrado §6) ── */}
      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-700">Ciclo de Vida — Actividades</h2>
                {total > 0 && !esEstadoInicial && (
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {completadas} de {total} completadas
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  {FILTRO_TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFiltroTab(tab.key)}
                      className={`px-3 py-1.5 text-xs flex items-center gap-1.5 border-r border-gray-200 last:border-r-0 transition-colors ${
                        filtroTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{tab.count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Exportar */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuExport(v => !v)}
                    className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <Icon name="download" size={14} />
                    Exportar
                  </button>
                  {menuExport && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                      <button
                        onClick={() => { exportarExcel(getFilasExport(), nombreArchivo); setMenuExport(false) }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Icon name="description" size={16} className="text-green-700" />
                        Descargar Excel
                      </button>
                      <button
                        onClick={() => { exportarPDF(getFilasExport(), nombreArchivo, tituloDoc, subtituloDoc); setMenuExport(false) }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Icon name="picture_as_pdf" size={16} className="text-red-700" />
                        Descargar PDF
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setFormAct(BLANK_ACT); setModalNuevaActividad(true) }}
                  disabled={yaCargoEnDesarchivado}
                  title={yaCargoEnDesarchivado ? 'Ya se registró una actividad en Desarchivado. Volvé a archivo para continuar.' : undefined}
                  className="flex items-center gap-1 text-xs bg-blue-700 text-white rounded-md px-2.5 py-1.5 hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="add" size={14} />
                  Nueva Actividad
                </button>
              </div>
            </div>

            {/* Buscador */}
            <div className="relative mb-4">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar actividad..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            <EtapasAcordeon
              key={etapasCL.map(e => e.key).join('|')}
              etapas={etapasCL}
              vacio="No hay actividades que coincidan."
            />
          </div>
        </div>

        {/* ── Panel lateral tarea ── */}
        {tareaSeleccionada && estadoProcesal && (
          <TareaDetailPanel
            tarea={tareaSeleccionada}
            estadoLabel={estadoProcesal.label}
            cambiosLocales={cambiosLocales}
            setCambiosLocales={setCambiosLocales}
            onGuardar={guardarTarea}
            onCerrar={() => setTareaSeleccionada(null)}
          />
        )}
      </div>

      {/* ── Menú flotante editar/eliminar actividad ── */}
      {menuActividad && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', left: menuActividad.x, top: menuActividad.y }}
          className="w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
        >
          <button
            onClick={() => { abrirEdicion(menuActividad.act, menuActividad.globalIdx); setMenuActividad(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-800 hover:bg-gray-100 transition-colors text-left"
          >
            <Icon name="edit" size={13} />
            Editar
          </button>
          {menuActividad.act.fecha_vencimiento && menuActividad.act.estado !== 'COMPLETADA' && (
            <button
              onClick={() => { marcarVencimientoCumplido(menuActividad.globalIdx); setMenuActividad(null) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-green-800 hover:bg-green-100 transition-colors text-left"
            >
              <Icon name="check_circle" size={13} />
              Marcar vencimiento cumplido
            </button>
          )}
          <button
            onClick={() => { confirmarEliminacion(menuActividad.globalIdx); setMenuActividad(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-700 hover:bg-red-100 transition-colors text-left"
          >
            <Icon name="delete" size={13} />
            Eliminar
          </button>
        </div>
      )}

      {/* ── Modal nueva actividad ── */}
      <Modal
        open={modalNuevaActividad}
        onClose={cerrarModal}
        titulo="Nueva actividad"
        size="md"
        footer={
          <>
            <button onClick={cerrarModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={tabModal === 'generica' ? agregarNuevaActividad : guardarSolicitud}
              disabled={
                tabModal === 'generica'
                  ? (!formAct.titulo.trim() || !formAct.descripcion.trim())
                  : (!formSolicitud.titulo.trim() || (!formSolicitud.asignado_a.length && !formSolicitud.area_destinataria))
              }
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {tabModal === 'generica' ? 'Agregar' : 'Crear solicitud'}
            </button>
          </>
        }
      >
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
          {([
            ['generica',  'Actividad Genérica'],
            ['solicitud', 'Nueva Solicitud'],
          ] as const).map(([val, lbl]) => (
            <button key={val} type="button"
              onClick={() => setTabModal(val)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tabModal === val
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}>
              {lbl}
            </button>
          ))}
        </div>

        {tabModal === 'solicitud' && (
          <SolicitudForm
            form={formSolicitud}
            setForm={setFormSolicitud}
            usuarioActivo={usuarioActivo}
          />
        )}

        {tabModal === 'generica' && <div className="space-y-3">
          <div>
            <label className="field-label">Tipo</label>
            <select className="field-input w-full" value={formAct.tipo} onChange={e => setFormAct(p => ({ ...p, tipo: e.target.value as TipoActividad }))}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {formAct.tipo === 'PRESENTACION' && (
              <button
                type="button"
                onClick={() => setModalEscrito(true)}
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-blue-500 text-gray-800 text-xs font-semibold hover:bg-blue-50 transition-colors"
              >
                <Icon name="article" size={16} />
                Generar Escrito
              </button>
            )}
          </div>
          <div>
            <label className="field-label">Título <span className="text-red-700">*</span></label>
            <input type="text" className="field-input w-full" value={formAct.titulo} onChange={e => setFormAct(p => ({ ...p, titulo: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="field-label">Fecha</label>
            <input type="date" className="field-input w-full" value={formAct.fecha} onChange={e => setFormAct(p => ({ ...p, fecha: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Descripción <span className="text-red-700">*</span></label>
            <textarea className="field-input w-full resize-y" style={{ minHeight: 72 }} value={formAct.descripcion} onChange={e => setFormAct(p => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">N° GDE</label>
            <input
              type="text"
              className="field-input w-full font-mono text-sm"
              placeholder="EX-2026-..."
              value={formAct.doc_gde}
              onChange={e => setFormAct(p => ({ ...p, doc_gde: e.target.value }))}
            />
          </div>
          <div>
            <label className="field-label">Fecha de vencimiento (opcional)</label>
            <input
              type="date"
              className="field-input w-full"
              value={formAct.fecha_vencimiento}
              onChange={e => setFormAct(p => ({
                ...p,
                fecha_vencimiento: e.target.value,
                fecha_aviso: e.target.value ? p.fecha_aviso : '',
              }))}
            />
          </div>
          {formAct.fecha_vencimiento && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setFormAct(p => ({ ...p, mostrar_en_agenda: !p.mostrar_en_agenda }))}
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${
                  formAct.mostrar_en_agenda ? 'bg-blue-700' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  formAct.mostrar_en_agenda ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Mostrar en agenda</p>
                <p className="text-[11px] text-gray-500">Aparecerá en el calendario en la fecha de vencimiento</p>
              </div>
            </label>
          )}
          {formAct.fecha_vencimiento && (
            <div>
              <label className="field-label">Fecha de aviso (opcional)</label>
              <p className="text-[10px] text-gray-400 mb-1">
                A partir de qué fecha recibir el aviso de proximidad al vencimiento.
              </p>
              <input
                type="date"
                className="field-input w-full"
                max={formAct.fecha_vencimiento}
                value={formAct.fecha_aviso}
                onChange={e => setFormAct(p => ({ ...p, fecha_aviso: e.target.value }))}
              />
            </div>
          )}
          {formAct.fecha_aviso && (
            <div>
              <label className="field-label">Frecuencia de notificación</label>
              <div className="flex gap-2 mt-1">
                {([
                  { value: 'diario', label: 'Todos los días' },
                  { value: 5,        label: 'Cada 5 días' },
                  { value: 10,       label: 'Cada 10 días' },
                  { value: 15,       label: 'Cada 15 días' },
                ] as const).map(op => (
                  <button
                    key={String(op.value)}
                    type="button"
                    onClick={() => setFormAct(p => ({ ...p, rango_aviso: op.value }))}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                      formAct.rango_aviso === op.value
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="field-label">Adjuntos</label>
            <AdjuntosInput archivos={adjuntosNuevaAct} onChange={setAdjuntosNuevaAct} />
          </div>

          {exp.es_juicio_iniciado && !exp.id_juicio_derivado && (
            <div className="pt-3 border-t border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-blue-700 w-4 h-4 flex-shrink-0"
                  checked={esImpulsorio}
                  onChange={e => setEsImpulsorio(e.target.checked)}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-800">
                    Marcar como movimiento impulsorio
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Resetea el timer de 3 meses desde la fecha de esta actividad.
                  </p>
                </div>
              </label>
              {esImpulsorio && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2.5 bg-blue-100 rounded-lg">
                  <Icon name="schedule" size={14} className="text-gray-800 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-800">
                    El plazo procesal se reiniciará a partir del{' '}
                    <span className="font-semibold">{formAct.fecha || 'hoy'}</span>.
                    Nueva alerta: en 75 días.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>}
      </Modal>

      <GenerarEscritoModal
        open={modalEscrito}
        onClose={() => setModalEscrito(false)}
        exp={exp}
        onGenerar={({ titulo, cuerpo, escrito_id }) => {
          setFormAct(p => ({ ...p, titulo, descripcion: cuerpo }))
          setEscritoIdSeleccionado(escrito_id)
          setModalEscrito(false)
          toast.success('Word descargado. Revisá el texto y confirmá la actividad — quedará como "pendiente de aprobación".')
        }}
      />

      {/* ── Modal agregar comentario (reply) ── */}
      <Modal
        open={!!replyTarget}
        onClose={() => { setReplyTarget(null); limpiarFormReply() }}
        titulo="Agregar comentario"
        size="sm"
        footer={
          <>
            <button onClick={() => { setReplyTarget(null); limpiarFormReply() }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarReply}
              disabled={!formReply.texto.trim()}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-3 py-1">
          {replyTarget && (
            <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-start gap-2">
              <Icon name="reply" size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 line-clamp-2">{replyTarget.act.titulo}</p>
            </div>
          )}
          <div>
            <label className="field-label">Comentario <span className="text-red-700">*</span></label>
            <textarea
              className="field-input w-full resize-none"
              style={{ minHeight: 80 }}
              placeholder="Escribí tu comentario..."
              value={formReply.texto}
              onChange={e => setFormReply(p => ({ ...p, texto: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="field-label">Fecha</label>
            <input type="date" className="field-input w-full" value={formReply.fecha} onChange={e => setFormReply(p => ({ ...p, fecha: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Documento GDE (opcional)</label>
            <input type="text" className="field-input w-full font-mono" placeholder="EX-2026-..." value={formReply.doc_gde} onChange={e => setFormReply(p => ({ ...p, doc_gde: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Fecha de vencimiento (opcional)</label>
            <input
              type="date"
              className="field-input w-full"
              value={formReply.fecha_vencimiento}
              onChange={e => setFormReply(p => ({
                ...p,
                fecha_vencimiento: e.target.value,
                fecha_aviso: e.target.value ? p.fecha_aviso : '',
              }))}
            />
          </div>
          {formReply.fecha_vencimiento && (
            <div>
              <label className="field-label">Fecha de aviso (opcional)</label>
              <p className="text-[10px] text-gray-400 mb-1">A partir de qué fecha recibir el aviso de proximidad al vencimiento.</p>
              <input
                type="date"
                className="field-input w-full"
                max={formReply.fecha_vencimiento}
                value={formReply.fecha_aviso}
                onChange={e => setFormReply(p => ({ ...p, fecha_aviso: e.target.value }))}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* ── Modal editar actividad ── */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        titulo="Editar actividad"
        size="md"
        footer={
          <>
            <button onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarEdicion}
              disabled={!formEdit.titulo.trim()}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Guardar cambios
            </button>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <div>
            <label className="field-label">Título <span className="text-red-700">*</span></label>
            <input type="text" className="field-input w-full" value={formEdit.titulo} onChange={e => setFormEdit(p => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Descripción</label>
            <textarea className="field-input w-full min-h-[80px] resize-none" value={formEdit.descripcion} onChange={e => setFormEdit(p => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Fecha</label>
            <input type="date" className="field-input w-full" value={formEdit.fecha} onChange={e => setFormEdit(p => ({ ...p, fecha: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Documento GDE</label>
            <input type="text" className="field-input w-full font-mono" placeholder="EX-2026-..." value={formEdit.doc_gde} onChange={e => setFormEdit(p => ({ ...p, doc_gde: e.target.value }))} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="field-label">Fecha de vencimiento</label>
              {formEdit.fecha_vencimiento && (
                <button
                  type="button"
                  onClick={() => setFormEdit(p => ({ ...p, fecha_vencimiento: '', fecha_aviso: '' }))}
                  className="flex items-center gap-1 text-[11px] font-semibold text-red-700 hover:underline"
                >
                  <Icon name="close" size={12} />
                  Quitar vencimiento
                </button>
              )}
            </div>
            <input
              type="date"
              className="field-input w-full"
              value={formEdit.fecha_vencimiento}
              onChange={e => setFormEdit(p => ({
                ...p,
                fecha_vencimiento: e.target.value,
                fecha_aviso: e.target.value ? p.fecha_aviso : '',
              }))}
            />
          </div>
          {formEdit.fecha_vencimiento && (
            <div>
              <label className="field-label">Fecha de aviso</label>
              <input
                type="date"
                className="field-input w-full"
                max={formEdit.fecha_vencimiento}
                value={formEdit.fecha_aviso}
                onChange={e => setFormEdit(p => ({ ...p, fecha_aviso: e.target.value }))}
              />
            </div>
          )}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <Icon name="info" size={14} className="text-amber-800 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800">
              Los cambios quedan registrados en el log de auditoría de la actividad.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}