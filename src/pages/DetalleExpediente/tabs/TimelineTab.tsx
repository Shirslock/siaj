import { useState, useEffect, useMemo } from 'react'
import type { Expediente, Actividad, TipoActividad, Tarea, Reply } from '../../../types'
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
import { useTareasStore } from '../../../store/tareas.store'
import { SolicitudForm, BLANK_SOLICITUD } from '../../../components/SolicitudForm'
import { GenerarEscritoModal } from '../../../components/escritos/GenerarEscritoModal'

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
}

type FiltroTab = 'todo' | 'sistema' | 'actividades' | 'tareas'

// ── Stepper de estados procesales ───────────────────────────────────────────

function ProcesalStepper({ exp }: { exp: Expediente }) {
  const estadoCodigo = exp.estadoProcesal ?? 'INICIO'
  const todosEstados = getEstadosProcesales(exp.tipo)

  // Filtrar ASIGNADO del stepper visual, empezar desde INICIO
  const estados = todosEstados.filter(e => e.codigo !== 'ASIGNADO')
  const idxActual = estados.findIndex(e => e.codigo === estadoCodigo)

  if (estados.length <= 1) return null

  return (
    <div className="bg-white rounded-2xl shadow-card px-16 py-4 mb-4">
      <div className="flex items-center gap-0">
        {estados.map((estado, idx) => {
          const isPast    = idx < idxActual
          const isCurrent = idx === idxActual
          const isFuture  = idx > idxActual
          const isLast    = idx === estados.length - 1

          return (
            <div key={estado.codigo} className="flex items-center flex-1 min-w-0">
              {/* Nodo */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    isCurrent
                      ? 'bg-[#1b3a57] border-[#1b3a57] text-white shadow-md'
                      : isPast
                      ? 'bg-[rgba(27,58,87,0.20)] border-[rgba(27,58,87,0.40)] text-[#1b3a57]'
                      : 'bg-[#e8e8e8] border-[rgba(0,0,0,0.12)] text-[#4a6a84]'
                  }`}
                >
                  {isPast
                    ? <Icon name="check" size={16} />
                    : <span className="text-xs">{idx + 1}</span>
                  }
                </div>
                <span className={`mt-1.5 text-[10px] font-semibold text-center whitespace-nowrap max-w-[80px] truncate ${
                  isCurrent ? 'text-[#1b3a57]' : isFuture ? 'text-[#4a6a84]' : 'text-[rgba(27,58,87,0.70)]'
                }`}>
                  {estado.label}
                </span>
              </div>
              {/* Línea conectora */}
              {!isLast && (
                <div className="flex-1 h-px mx-2 mb-4 relative">
                  <div className="absolute inset-0 bg-[rgba(0,0,0,0.08)] rounded-full" />
                  {isPast && (
                    <div className="absolute inset-0 bg-[rgba(27,58,87,0.40)] rounded-full" />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Ítem de tarea en el feed ─────────────────────────────────────────────────

function TareaFeedItem({
  tarea,
  numero,
  estadoLabel: _estadoLabel,
  onClick,
  isSelected,
}: {
  tarea: Tarea
  numero: number
  estadoLabel: string
  onClick?: () => void
  isSelected: boolean
}) {
  const urg = calcularUrgencia(tarea.fechaVencimiento)

  const estadoConfig = {
    cumplido:       { icon: 'check_circle', color: 'text-green-600', bg: 'bg-green-50',  badge: 'bg-green-100 text-green-700',   label: 'Cumplido' },
    en_curso:       { icon: 'schedule',     color: 'text-amber-500', bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700',   label: 'En curso' },
    no_procedente:  { icon: 'block',        color: 'text-[#7a9ab4]',   bg: 'bg-[#e8e8e8]', badge: 'bg-[#e8e8e8] text-[#4a6a84]', label: 'No proc.' },
    sin_estado:     { icon: 'radio_button_unchecked', color: 'text-[rgba(0,0,0,0.35)]', bg: '', badge: '', label: '' },
  }[tarea.estado]

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[rgba(0,0,0,0.04)] transition-all hover:bg-[#f0f0f0] ${
        isSelected ? 'bg-[rgba(27,58,87,0.05)] border-l-2 border-l-[#1b3a57]' : 'border-l-2 border-l-transparent'
      }`}
    >
      {/* Número */}
      <span className="text-[10px] font-bold text-[#4a6a84] w-5 flex-shrink-0 text-right">{String(numero).padStart(2,'0')}</span>

      {/* Ícono estado */}
      <Icon name={estadoConfig.icon} size={18} className={`flex-shrink-0 ${estadoConfig.color}`} />

      {/* Nombre */}
      <p className="text-xs text-[#1b3a57] flex-1 truncate">{tarea.nombre}</p>

      {/* Dot urgencia */}
      {tarea.fechaVencimiento && (
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          urg === 'rojo' ? 'bg-[#b91c1c]' : urg === 'ambar' ? 'bg-amber-500' : 'bg-green-500'
        }`} />
      )}

      {/* Badge estado */}
      {tarea.estado !== 'sin_estado' && (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${estadoConfig.badge}`}>
          {estadoConfig.label}
        </span>
      )}

      {/* Chevron */}
      <Icon name="chevron_right" className="flex-shrink-0" size={14} />
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
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl overflow-hidden shadow-card">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-[rgba(0,0,0,0.06)] bg-[#f0f0f0]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] mb-1">
                ESTADO PROCESAL · {estadoLabel.toUpperCase()}
              </p>
              <p className="text-sm font-bold text-[#1b3a57] leading-snug">{tarea.nombre}</p>
            </div>
            <button
              onClick={onCerrar}
              className="p-1 rounded-lg text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors flex-shrink-0"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Pill estado actual */}
          <div className="mt-2">
            {estadoLocal === 'sin_estado' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#e8e8e8] text-[#4a6a84] border border-[rgba(0,0,0,0.12)]">
                <Icon name="radio_button_unchecked" size={12} />
                Pendiente
              </span>
            ) : estadoLocal === 'cumplido' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                <Icon name="check_circle" size={12} />
                Cumplido
              </span>
            ) : estadoLocal === 'en_curso' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                <Icon name="schedule" size={12} />
                En curso
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#e8e8e8] text-[#4a6a84]">
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
              <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84]">Observaciones</label>
              <span className="text-[9px] text-[#4a6a84]">
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
            <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-2">
              Estado de la actividad
            </label>
            <div className="flex gap-2 py-2">
              {estadoOpts.map(opt => {
                const isActive = estadoLocal === opt.value
                const activeClass =
                  opt.value === 'cumplido'      ? 'border-[#1b3a57] bg-[#1b3a57] text-white text-sm' :
                  opt.value === 'en_curso'       ? 'border-amber-500 bg-amber-50 text-amber-700 text-sm' :
                                                   'border-[rgba(0,0,0,0.20)] bg-[#e8e8e8] text-[#4a6a84] text-sm'
                return (
                  <button
                    key={opt.value}
                    onClick={() => setCambiosLocales(p => ({ ...p, estado: opt.value }))}
                    className={`flex flex-1 items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                      isActive ? activeClass : 'border-[rgba(0,0,0,0.12)] text-[#4a6a84] hover:bg-[#e8e8e8]'
                    }`}
                  >
                    <Icon name={opt.icon} size={20} />
                    <span className="text-[10px] font-bold leading-tight">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">
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
              <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">
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
                <p className="text-[9px] text-[#b91c1c] mt-1 flex items-center gap-1">
                  <Icon name="warning" size={11} />
                  Plazo vencido
                </p>
              )}
              {/* Sin fecha pill */}
              <div className="h-3 mt-1">
                {!(cambiosLocales.fechaVencimiento ?? tarea.fechaVencimiento) && (
                  <span className="text-[9px] text-[#4a6a84]">Sin fecha</span>
                )}
              </div>
            </div>
          </div>

          {/* Fecha de aviso */}
          {(cambiosLocales.fechaVencimiento ?? tarea.fechaVencimiento) && (
            <div>
              <label className="text-[9px] text-[#4a6a84] font-black uppercase tracking-widest block mb-1">
                Fecha de aviso
              </label>
              <p className="text-[10px] text-[#7a9ab4] mb-1.5">
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

          {/* Documento GDE */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">
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
            <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">
              Adjunto
            </label>
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-[rgba(0,0,0,0.12)] cursor-pointer hover:border-[rgba(27,58,87,0.50)] hover:bg-[rgba(27,58,87,0.05)] transition-all group">
              <Icon name="attach_file" size={18} />
              <span className="text-xs text-[#4a6a84] group-hover:text-[#1b3a57] transition-colors">Adjuntar archivo</span>
              <input type="file" className="hidden" />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex gap-2 justify-end border-t border-[rgba(0,0,0,0.06)] pt-3">
          <button
            onClick={onCerrar}
            className="px-3 py-2 rounded-xl text-xs font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1b3a57] text-white hover:opacity-90 transition-opacity"
          >
            <Icon name="save" size={14} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Entrada del feed (actividad genérica o de sistema) ───────────────────────

function ActividadFeedItem({ act, idx: _idx, isLast, hijas = [], snapshotOpen, onToggleSnapshot, tareasHistoricas = [] }: {
  act: Actividad
  idx: number
  isLast: boolean
  hijas?: Actividad[]
  snapshotOpen?: boolean
  onToggleSnapshot?: () => void
  tareasHistoricas?: Tarea[]
}) {
  const iconMap: Record<string, string> = {
    RECEPCION:      'inbox',
    CONTESTACION:   'reply',
    PRESENTACION:   'upload_file',
    AUDIENCIA:      'gavel',
    PERICIA:        'science',
    TRASLADO:       'send',
    NOTIFICACION:   'notifications',
    MOVIMIENTO:     'swap_horiz',
    NOTA_RESPUESTA: 'edit_note',
    OTRO:           'more_horiz',
  }
  const isSistema = act.tipo === 'MOVIMIENTO' && !!act.estadoExpediente &&
    (act.titulo.startsWith('Cambio de estado') || act.titulo.startsWith('Retroceso de estado'))

  return (
    <div className="flex flex-col mb-3">
      <div className="flex gap-3">
        {/* Timeline dot */}
        <div className="flex flex-col items-center flex-shrink-0 mt-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
            isSistema ? 'bg-[#C4DFE8] border border-[rgba(27,58,87,0.20)]' : 'bg-[#e8e8e8] border border-[rgba(0,0,0,0.10)]'
          }`}>
            <Icon name={isSistema ? 'swap_horiz' : (iconMap[act.tipo] ?? 'radio_button_unchecked')} size={14} className={isSistema ? 'text-[#1b3a57]' : 'text-[#4a6a84]'} />
          </div>
          {!isLast && <div className="w-px flex-1 bg-[rgba(0,0,0,0.08)] mt-1" />}
        </div>

        {/* Card */}
        <div className={`flex-1 rounded-xl border p-3.5 mb-3 ${
          isSistema
            ? 'bg-[rgba(27,58,87,0.05)] border-[rgba(27,58,87,0.20)]'
            : 'bg-white border-[rgba(0,0,0,0.10)] shadow-card'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#1b3a57] leading-snug">{act.titulo}</p>
              {act.escrito_estado === 'GENERADO' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                  Pendiente de aprobación externa
                </span>
              )}
              {act.escrito_estado === 'APROBADO_CARGADO' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                  Aprobado y cargado
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <p className="text-[10px] text-[#4a6a84] whitespace-nowrap">{formatFecha(act.fecha)}</p>
              {isSistema && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#C4DFE8] text-[#1b3a57]">
                  Sistema
                </span>
              )}
              {isSistema && tareasHistoricas.length > 0 && (
                <button
                  onClick={onToggleSnapshot}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#4a6a84] hover:text-[#1b3a57] border border-[rgba(0,0,0,0.12)] rounded-lg px-2.5 py-1.5 transition-colors mt-1"
                >
                  <Icon name="checklist" size={14} />
                  {tareasHistoricas.filter(t => t.estado === 'cumplido' || t.estado === 'no_procedente').length} / {tareasHistoricas.length} tareas
                  <Icon name={snapshotOpen ? 'unfold_less' : 'unfold_more'} size={12} />
                </button>
              )}
            </div>
          </div>
          {act.descripcion && (
            <p className="text-xs text-[#4a6a84]">{act.descripcion}</p>
          )}
          {(act.doc_gde || act.adjunto_nombre) && (
            <div className="flex flex-wrap gap-3 mt-1.5">
              {act.doc_gde && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#1b3a57]">
                  <Icon name="description" size={14} />
                  {act.doc_gde}
                </span>
              )}
              {act.adjunto_nombre && (
                <a
                  href="#"
                  onClick={e => e.preventDefault()}
                  title="Descarga no disponible en esta versión"
                  className="group inline-flex items-center gap-1 text-[10px] text-[#4a6a84] hover:text-[#1b3a57] transition-colors"
                >
                  <Icon name="attach_file" size={14} />
                  {act.adjunto_nombre}
                  <Icon name="download" size={12} className="opacity-0 group-hover:opacity-60 transition-opacity ml-0.5" />
                </a>
              )}
            </div>
          )}
          {act.subitems && act.subitems.length > 0 && (
            <div className="mt-2 pl-3 border-l-2 border-[rgba(0,0,0,0.08)] space-y-1">
              {act.subitems.map((sub, si) => (
                <div key={si}>
                  <p className="text-xs font-medium text-[#1b3a57]">{sub.titulo}</p>
                  {sub.descripcion && <p className="text-[10px] text-[#4a6a84]">{sub.descripcion}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel tareas históricas — solo lectura */}
      {isSistema && tareasHistoricas.length > 0 && snapshotOpen && (
        <div className="border border-[rgba(0,0,0,0.10)] rounded-xl overflow-hidden bg-[#f9f9f9] mb-3 ml-10">
          <div className="px-4 py-2 flex items-center gap-2 border-b border-[rgba(0,0,0,0.06)]">
            {(() => {
              const matchEstado = act.titulo.match(/(?:Cambio|Retroceso) de estado: (.+) →/)
              const labelEstadoAnterior = matchEstado?.[1]?.trim() ?? 'estado anterior'
              return (
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">
                  TAREAS DEL ESTADO: {labelEstadoAnterior.toUpperCase()}
                </span>
              )
            })()}
            <span className="text-[10px] text-[#7a9ab4] ml-auto italic">No se pueden modificar</span>
          </div>

          {tareasHistoricas.map(tarea => {
            const dimmed = tarea.estado === 'sin_estado'
            return (
              <div key={tarea.id} className={`flex items-start gap-3 px-4 py-2 border-b border-[rgba(0,0,0,0.04)] last:border-0 ${dimmed ? 'opacity-40' : ''}`}>
                {/* Ícono estado */}
                <div className="flex-shrink-0 mt-0.5">
                  {tarea.estado === 'cumplido' && (
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-[10px]">✓</span>
                    </div>
                  )}
                  {tarea.estado === 'no_procedente' && (
                    <div className="w-4 h-4 rounded-full bg-[#e8e8e8] flex items-center justify-center text-[#4a6a84] text-[10px]">⊘</div>
                  )}
                  {tarea.estado === 'en_curso' && (
                    <div className="w-4 h-4 rounded-full bg-[#C4DFE8] flex items-center justify-center">
                      <Icon name="schedule" size={10} className="text-[#1b3a57]" />
                    </div>
                  )}
                  {tarea.estado === 'sin_estado' && (
                    <div className="w-4 h-4 rounded-full border-2 border-[rgba(0,0,0,0.15)]" />
                  )}
                </div>

                {/* Nombre + observaciones inline */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-medium ${
                    tarea.estado === 'cumplido'       ? 'line-through text-[#7a9ab4]'
                    : tarea.estado === 'no_procedente' ? 'text-[#7a9ab4]'
                    : 'text-[#1b3a57]'
                  }`}>{tarea.nombre}</p>
                  {tarea.observaciones && (
                    <p className="text-[10px] text-[#7a9ab4] mt-0.5 italic">{tarea.observaciones}</p>
                  )}
                </div>

                {/* Chip estado */}
                {tarea.estado !== 'sin_estado' && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                    tarea.estado === 'cumplido' ? 'bg-green-100 text-green-700'
                    : tarea.estado === 'en_curso' ? 'bg-[#C4DFE8] text-[#1b3a57]'
                    : 'bg-[#e8e8e8] text-[#4a6a84]'
                  }`}>
                    {tarea.estado === 'cumplido' ? 'Cumplido' : tarea.estado === 'en_curso' ? 'En curso' : 'No proc.'}
                  </span>
                )}

                {/* Fecha */}
                {tarea.fecha && (
                  <span className="text-[10px] text-[#7a9ab4] flex-shrink-0 mt-0.5">{tarea.fecha}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Actividades hijas indentadas */}
      {hijas.length > 0 && (
        <div className="ml-10 mt-1 space-y-1.5">
          {hijas.map((hija, hi) => (
            <div key={hija.id ?? hi} className="flex gap-3 pl-4 border-l-2 border-[rgba(27,58,87,0.20)] ml-3">
              <div className="flex flex-col items-center flex-shrink-0 mt-1">
                <div className="w-6 h-6 rounded-full bg-[#e8e8e8] border border-[rgba(0,0,0,0.10)] flex items-center justify-center">
                  <Icon name="subdirectory_arrow_right" size={12} className="text-[#4a6a84]" />
                </div>
              </div>
              <div className="flex-1 rounded-xl border border-[rgba(0,0,0,0.10)] bg-white shadow-card p-3 mb-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1b3a57] leading-snug">{hija.titulo}</p>
                  <p className="text-[10px] text-[#4a6a84] whitespace-nowrap flex-shrink-0">{formatFecha(hija.fecha)}</p>
                </div>
                {hija.descripcion && (
                  <p className="text-xs text-[#4a6a84] mt-0.5">{hija.descripcion}</p>
                )}
                {(hija.doc_gde || hija.adjunto_nombre) && (
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {hija.doc_gde && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#1b3a57]">
                        <Icon name="description" size={14} />
                        {hija.doc_gde}
                      </span>
                    )}
                    {hija.adjunto_nombre && (
                      <a
                        href="#"
                        onClick={e => e.preventDefault()}
                        title="Descarga no disponible en esta versión"
                        className="group inline-flex items-center gap-1 text-[10px] text-[#4a6a84] hover:text-[#1b3a57] transition-colors"
                      >
                        <Icon name="attach_file" size={14} />
                        {hija.adjunto_nombre}
                        <Icon name="download" size={12} className="opacity-0 group-hover:opacity-60 transition-opacity ml-0.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Bloque de tareas del estado actual ───────────────────────────────────────

function TareasBlock({
  exp,
  tareas,
  estadoProcesal,
  completadas,
  total,
  soloLectura = false,
  tareaSeleccionada,
  setTareaSeleccionada,
}: {
  exp: Expediente
  tareas: Tarea[]
  estadoProcesal: NonNullable<ReturnType<typeof getEstadoProcesal>>
  completadas: number
  total: number
  soloLectura?: boolean
  tareaSeleccionada: Tarea | null
  setTareaSeleccionada: (t: Tarea) => void
}) {
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const siguienteEstado = estadoProcesal.siguiente
    ? getEstadoProcesal(exp.tipo, estadoProcesal.siguiente)
    : undefined
  const puedeAvanzar = (total === 0 || completadas === total) && !!siguienteEstado
  const progresoPct = total > 0 ? Math.round((completadas / total) * 100) : 0
  const tareasVisibles = mostrarTodas ? tareas : tareas.slice(0, 8)

  return (
    <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl overflow-hidden mb-4 shadow-card">
      {/* Header bloque tareas */}
      <div className="px-5 py-3 flex items-center gap-3 bg-[#f0f0f0] border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#4a6a84] uppercase tracking-wide">
              Estado actual:
            </span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
              progresoPct === 100 ? 'bg-green-100 text-green-700' : 'bg-[#C4DFE8] text-[#1b3a57]'
            }`}>
              {estadoProcesal.label.toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-[#4a6a84]">{completadas}/{total} tareas</span>
          {/* Barra de progreso */}
          <div className="flex-1 bg-[#e8e8e8] h-1.5 rounded-full max-w-[100px]">
            <div
              className={`h-1.5 rounded-full transition-all ${progresoPct === 100 ? 'bg-green-500' : 'bg-[#1b3a57]'}`}
              style={{ width: `${progresoPct}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-[#4a6a84]">{progresoPct}%</span>
        </div>

        {puedeAvanzar && (
          <p className="text-[10px] text-green-700 font-semibold flex items-center gap-1 flex-shrink-0">
             <Icon name="check_circle" size={12} />
            Listo para avanzar al siguiente estado
          </p>
        )}
      </div>

      {/* Banner solo lectura */}
      {soloLectura && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fef3c7] border-b border-[#fde68a]">
          <Icon name="lock" size={14} className="text-[#d97706] flex-shrink-0" />
          <p className="text-xs text-[#d97706] font-medium">
            Estado con retroceso activo — solo lectura. Podés agregar actividades genéricas.
          </p>
        </div>
      )}

      {/* Lista tareas */}
      {tareas.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-xs text-[#4a6a84] italic">Este estado no requiere tareas. Podés avanzar directamente.</p>
        </div>
      ) : (
        <>
          {tareasVisibles.map((tarea, idx) => (
            <TareaFeedItem
              key={tarea.id}
              tarea={tarea}
              numero={idx + 1}
              estadoLabel={estadoProcesal.label}
              onClick={soloLectura ? undefined : () => setTareaSeleccionada(tarea)}
              isSelected={!soloLectura && tareaSeleccionada?.id === tarea.id}
            />
          ))}
          {!mostrarTodas && tareas.length > 8 && (
            <button
              className="w-full px-5 py-2.5 text-[11px] text-[#4a6a84] hover:text-[#1b3a57] hover:bg-[#f0f0f0] transition-colors text-left"
              onClick={() => setMostrarTodas(true)}
            >
              + {tareas.length - 8} tareas más...
            </button>
          )}
        </>
      )}
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
          <div key={reply.id} className="pl-4 border-l-2 border-[#C4DFE8]">
            <div className="bg-[#f9f9f9] rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#1b3a57]">
                  {autorU ? getNombreCompleto(autorU) : reply.autor_id}
                </span>
                <span className="text-[10px] text-[#7a9ab4]">{formatFecha(reply.fecha)}</span>
              </div>
              <p className="text-xs text-[#1b3a57] whitespace-pre-wrap">{reply.texto}</p>
              {reply.doc_gde && (
                <p className="text-[10px] font-mono text-[#1b3a57] mt-1.5 flex items-center gap-1">
                  <Icon name="attach_file" size={11} />
                  {reply.doc_gde}
                </p>
              )}
              {reply.fecha_vencimiento && (
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-[#4a6a84]">Vence: {formatFecha(reply.fecha_vencimiento)}</span>
                  {reply.fecha_aviso && (
                    <span className="text-[10px] text-[#d97706]">Aviso: {formatFecha(reply.fecha_aviso)}</span>
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

// ── Componente principal ─────────────────────────────────────────────────────

export function TimelineTab({ exp }: Props) {
  if (exp.area === 'PENAL') {
    return <TimelinePenal exp={exp} />
  }

  const {
    tareasMap, inicializarTareas, actualizarTarea,
    agregarActividad, actualizarExpediente, agregarReply,
  } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const { agregarTarea } = useTareasStore()

  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null)
  const [cambiosLocales, setCambiosLocales] = useState<Partial<Tarea>>({})
  const [modalNuevaActividad, setModalNuevaActividad] = useState(false)
  const [formAct, setFormAct] = useState(BLANK_ACT)
  const [adjuntoNuevaAct, setAdjuntoNuevaAct] = useState<File | null>(null)
  const [esImpulsorio, setEsImpulsorio] = useState(false)
  const [filtroTab, setFiltroTab] = useState<FiltroTab>('todo')
  const [busqueda, setBusqueda] = useState('')
  const [menuExport, setMenuExport] = useState(false)
  const [snapshotsExpandidos, setSnapshotsExpandidos] = useState<Set<number>>(new Set())
  const [estadosExpandidos, setEstadosExpandidos] = useState<Set<number>>(new Set())
  const [replyTarget, setReplyTarget] = useState<{ act: Actividad; globalIdx: number } | null>(null)
  const [formReply, setFormReply] = useState({ texto: '', doc_gde: '', fecha: HOY, fecha_vencimiento: '', fecha_aviso: '' })
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
    agregarTarea({
      titulo:              formSolicitud.titulo,
      descripcion:         formSolicitud.descripcion,
      expediente_id:       exp.id,
      expediente_caratula: exp.caratula,
      expediente_area:     exp.area,
      asignado_a:          formSolicitud.asignado_a,
      creado_por:          usuarioActivo?.id ?? '',
      fecha_limite:        formSolicitud.fecha_limite || null,
      prioridad:           formSolicitud.prioridad,
      estado:              'pendiente',
      mostrar_en_agenda:   false,
      area_destinataria:   formSolicitud.area_destinataria || undefined,
      persona_contacto_id: formSolicitud.persona_contacto_id || undefined,
      persona_contacto:    formSolicitud.persona_contacto || undefined,
      etiquetas:           [],
      created_at:          new Date().toISOString(),
    })
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

  const toggleEstado = (idx: number) =>
    setEstadosExpandidos(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })

  const toggleSnapshot = (idx: number) =>
    setSnapshotsExpandidos(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })

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

  const sorted = [...exp.timeline].sort((a, b) => a.fecha.localeCompare(b.fecha))

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
    toast.success('Tarea actualizada.')
    setTareaSeleccionada(null)
  }

  const esLetrado = !!usuarioActivo && usuarioActivo.id === exp.abogado_id

  function globalIdxDe(act: Actividad): number {
    return exp.timeline.indexOf(act)
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
      adjunto_nombre: adjuntoNuevaAct?.name ?? null,
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
    setAdjuntoNuevaAct(null)
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

  const FILTRO_TABS: { key: FiltroTab; label: string; count?: number }[] = [
    { key: 'todo',        label: 'Todo' },
    { key: 'sistema',     label: 'Sistema',     count: cntSistema },
    { key: 'actividades', label: 'Actividades', count: cntActividades },
    { key: 'tareas',      label: 'Tareas',      count: cntTareas },
  ]

  return (
    <div className="space-y-4">

      {/* ── Stepper procesal ── */}
      <ProcesalStepper exp={exp} />

      {/* ── Header: título + filtros + acción ── */}
      <div className="bg-white rounded-2xl shadow-card px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Título y contadores */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#1b3a57]">Ciclo de Vida — Actividades</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#C4DFE8] text-[#1b3a57] font-semibold">
              {completadas} de {total + sorted.length} completadas
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Tabs filtro */}
            <div className="flex items-center gap-1 bg-[#e8e8e8] rounded-xl p-1">
              {FILTRO_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFiltroTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filtroTab === tab.key
                      ? 'bg-white shadow-sm text-[#1b3a57]'
                      : 'text-[#4a6a84] hover:text-[#1b3a57]'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      filtroTab === tab.key
                        ? 'bg-[#1b3a57] text-white'
                        : 'bg-[#e0e0e0] text-[#4a6a84]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Botón exportar */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setMenuExport(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-[rgba(0,0,0,0.15)] rounded-lg bg-white text-[#1b3a57] hover:bg-[#f0f0f0] transition-colors"
              >
                <Icon name="download" size={14} />
                Exportar
                <Icon name="chevron_right" size={12} className={menuExport ? 'rotate-90 transition-transform' : 'transition-transform'} />
              </button>

              {menuExport && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[rgba(0,0,0,0.12)] rounded-xl shadow-card-lg z-50 py-1 min-w-[160px]">
                  <button
                    onClick={() => { exportarExcel(getFilasExport(), nombreArchivo); setMenuExport(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1b3a57] hover:bg-[#f5f5f5] transition-colors"
                  >
                    <Icon name="description" size={16} className="text-[#15803d]" />
                    Descargar Excel
                  </button>
                  <button
                    onClick={() => { exportarPDF(getFilasExport(), nombreArchivo, tituloDoc, subtituloDoc); setMenuExport(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1b3a57] hover:bg-[#f5f5f5] transition-colors"
                  >
                    <Icon name="picture_as_pdf" size={16} className="text-[#b91c1c]" />
                    Descargar PDF
                  </button>
                </div>
              )}
            </div>

            {/* Botón nueva actividad */}
            <button
              onClick={() => { setFormAct(BLANK_ACT); setModalNuevaActividad(true) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1b3a57] text-white hover:opacity-90 transition-opacity shadow-sm"
            >
              <Icon name="add" size={16} />
              Nueva Actividad
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mt-3">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a84] pointer-events-none" />
          <input
            className="field-input pl-9 w-full text-sm"
            placeholder="Buscar actividad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* ── Layout principal: feed + panel lateral ── */}
      <div className="flex gap-5 items-start">

        {/* ── Columna izquierda: feed ── */}
        <div className="flex-1 min-w-0 space-y-0">

          {/* Bloque tareas (tab todo o tareas) */}
          {(filtroTab === 'todo' || filtroTab === 'tareas') && !esEstadoInicial && estadoProcesal && (
            <TareasBlock
              exp={exp}
              tareas={tareas}
              estadoProcesal={estadoProcesal}
              completadas={completadas}
              total={total}
              soloLectura={estadoFueAvanzado}
              tareaSeleccionada={tareaSeleccionada}
              setTareaSeleccionada={(t) => {
                if (estadoFueAvanzado) return
                setTareaSeleccionada(t)
                setCambiosLocales({})
              }}
            />
          )}

          {/* Feed colapsable por estado */}
          {filtroTab !== 'tareas' && (
            <div className="mb-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl overflow-hidden shadow-card">
              {gruposFeed.grupos.map((grupo, gi) => {
                const { sistema, tareasHist, actividades } = grupo
                const expandido = estadosExpandidos.has(gi)
                const snapshotOpen = sistema ? snapshotsExpandidos.has(gi) : false

                if (!sistema) {
                  // Período actual — actividades sin agrupar
                  if (actividades.length === 0 && !esEstadoInicial) return null
                  return (
                    <div key={`actual-${gi}`}>
                      {esEstadoInicial && (
                        <div className="p-6 text-center">
                          <Icon name="inbox" className="block mb-2 mx-auto" size={32} />
                          <p className="text-sm font-semibold text-[#1b3a57] mb-1">Actuación pendiente de inicio</p>
                          <p className="text-xs text-[#4a6a84]">Usá <strong>Acciones → Cambiar estado</strong> para comenzar.</p>
                        </div>
                      )}
                      {actividades.map((a, ai) => (
                        <div key={a.id ?? ai}>
                          <ActividadFeedItem
                            act={a}
                            idx={ai}
                            isLast={ai === actividades.length - 1}
                            hijas={[]}
                            snapshotOpen={false}
                            onToggleSnapshot={() => {}}
                            tareasHistoricas={[]}
                          />
                          {esLetrado && (
                            <div className="pl-14 pb-2 -mt-2">
                              <button
                                onClick={() => setReplyTarget({ act: a, globalIdx: globalIdxDe(a) })}
                                className="flex items-center gap-1 text-[11px] text-[#4a6a84] hover:text-[#1b3a57] transition-colors font-medium"
                              >
                                <Icon name="reply" size={13} />
                                Comentar
                              </button>
                            </div>
                          )}
                          <ReplyList replies={a.replies ?? []} />
                        </div>
                      ))}
                    </div>
                  )
                }

                // Entrada de cambio de estado — colapsable
                return (
                  <div key={sistema.id ?? gi} className="border-t border-[rgba(0,0,0,0.06)] first:border-t-0">
                    {/* Cabecera colapsable */}
                    <div
                      onClick={() => toggleEstado(gi)}
                      className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#f9f9f9] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#C4DFE8] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon name={expandido ? 'expand_less' : 'expand_more'} size={16} className="text-[#1b3a57]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1b3a57]">{sistema.titulo}</p>
                        {sistema.descripcion && <p className="text-xs text-[#4a6a84]">{sistema.descripcion}</p>}
                        {tareasHist.length > 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); toggleSnapshot(gi) }}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-[#4a6a84] hover:text-[#1b3a57] border border-[rgba(0,0,0,0.12)] rounded-lg px-2.5 py-1 transition-colors mt-1.5"
                          >
                            <Icon name="checklist" size={14} />
                            {tareasHist.filter(t => t.estado === 'cumplido' || t.estado === 'no_procedente').length} / {tareasHist.length} tareas
                            <Icon name={snapshotOpen ? 'unfold_less' : 'unfold_more'} size={12} />
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-[#7a9ab4] flex-shrink-0 mt-1">{formatFecha(sistema.fecha)}</span>
                    </div>

                    {/* Snapshot tareas */}
                    {snapshotOpen && tareasHist.length > 0 && (
                      <div className="border border-[rgba(0,0,0,0.10)] rounded-xl overflow-hidden bg-[#f9f9f9] mb-3 ml-10">
                        <div className="px-4 py-2 flex items-center gap-2 border-b border-[rgba(0,0,0,0.06)]">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">
                            {(() => {
                              const match = sistema.titulo.match(/(?:Cambio|Retroceso) de estado: (.+) →/)
                              const label = match?.[1]?.trim() ?? 'estado anterior'
                              return `TAREAS DEL ESTADO: ${label.toUpperCase()}`
                            })()}
                          </span>
                          <span className="text-[10px] text-[#7a9ab4] ml-auto italic">No se pueden modificar</span>
                        </div>
                        {tareasHist.map(tarea => {
                          const dimmed = tarea.estado === 'sin_estado'
                          return (
                            <div key={tarea.id} className={`flex items-start gap-3 px-4 py-2 border-b border-[rgba(0,0,0,0.04)] last:border-0 ${dimmed ? 'opacity-40' : ''}`}>
                              <div className="flex-shrink-0 mt-0.5">
                                {tarea.estado === 'cumplido' && (
                                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600 text-[10px]">✓</span>
                                  </div>
                                )}
                                {tarea.estado === 'no_procedente' && (
                                  <div className="w-4 h-4 rounded-full bg-[#e8e8e8] flex items-center justify-center text-[#4a6a84] text-[10px]">⊘</div>
                                )}
                                {tarea.estado === 'en_curso' && (
                                  <div className="w-4 h-4 rounded-full bg-[#C4DFE8] flex items-center justify-center">
                                    <Icon name="schedule" size={10} className="text-[#1b3a57]" />
                                  </div>
                                )}
                                {tarea.estado === 'sin_estado' && (
                                  <div className="w-4 h-4 rounded-full border-2 border-[rgba(0,0,0,0.15)]" />
                                )}
                              </div>
                              <p className={`text-xs flex-1 ${
                                tarea.estado === 'cumplido' ? 'line-through text-[#7a9ab4]'
                                : tarea.estado === 'no_procedente' ? 'text-[#7a9ab4]'
                                : 'text-[#1b3a57]'
                              }`}>
                                {tarea.nombre}
                              </p>
                              {tarea.estado !== 'sin_estado' && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                  tarea.estado === 'cumplido' ? 'bg-green-100 text-green-700'
                                  : tarea.estado === 'en_curso' ? 'bg-[#C4DFE8] text-[#1b3a57]'
                                  : 'bg-[#e8e8e8] text-[#4a6a84]'
                                }`}>
                                  {tarea.estado === 'cumplido' ? 'Cumplido' : tarea.estado === 'en_curso' ? 'En curso' : 'No proc.'}
                                </span>
                              )}
                              {tarea.observaciones && (
                                <p className="text-[10px] text-[#7a9ab4] mt-0.5 italic w-full pl-7">{tarea.observaciones}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Actividades del período */}
                    {expandido && (
                      <div className="border-t border-[rgba(0,0,0,0.05)] bg-[#fafafa]">
                        {actividades.length === 0 ? (
                          <p className="px-16 py-3 text-xs text-[#7a9ab4] italic">Sin actividades en este período.</p>
                        ) : (
                          actividades.map((a, ai) => (
                            <div key={a.id ?? ai}>
                              <div className="flex items-start gap-3 px-5 py-3 border-b border-[rgba(0,0,0,0.04)] last:border-0 ml-10">
                                <div className="w-7 h-7 rounded-lg bg-[#e8e8e8] flex items-center justify-center flex-shrink-0">
                                  <Icon name="description" size={14} className="text-[#4a6a84]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[#1b3a57] font-medium">{a.titulo}</p>
                                  {a.descripcion && <p className="text-xs text-[#4a6a84]">{a.descripcion}</p>}
                                  {(a.doc_gde || a.adjunto_nombre) && (
                                    <div className="flex flex-wrap gap-3 mt-1">
                                      {a.doc_gde && <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#1b3a57]"><Icon name="description" size={12} />{a.doc_gde}</span>}
                                      {a.adjunto_nombre && <span className="inline-flex items-center gap-1 text-[10px] text-[#4a6a84]"><Icon name="attach_file" size={12} />{a.adjunto_nombre}</span>}
                                    </div>
                                  )}
                                  {esLetrado && (
                                    <button
                                      onClick={() => setReplyTarget({ act: a, globalIdx: globalIdxDe(a) })}
                                      className="flex items-center gap-1 text-[11px] text-[#4a6a84] hover:text-[#1b3a57] transition-colors font-medium mt-1.5"
                                    >
                                      <Icon name="reply" size={13} />
                                      Comentar
                                    </button>
                                  )}
                                </div>
                                <span className="text-[11px] text-[#7a9ab4] flex-shrink-0">{formatFecha(a.fecha)}</span>
                              </div>
                              {(a.replies ?? []).length > 0 && (
                                <div className="ml-20 mr-5 mb-2 space-y-1.5">
                                  <ReplyList replies={a.replies ?? []} />
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {!esEstadoInicial && gruposFeed.grupos.every(g => !g.sistema && g.actividades.length === 0) && !gruposFeed.entradaRecepcion && (
                <div className="p-8 text-center text-[#4a6a84] text-sm">
                  No hay actividades que coincidan.
                </div>
              )}
              {/* Entrada de recepción — siempre visible al final */}
              {gruposFeed.entradaRecepcion && (
                <div className="flex items-start gap-3 px-5 py-3.5 border-t border-[rgba(0,0,0,0.05)]">
                  <div className="w-8 h-8 rounded-lg bg-[#e8e8e8] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="inbox" size={16} className="text-[#4a6a84]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1b3a57]">{gruposFeed.entradaRecepcion.titulo}</p>
                    {gruposFeed.entradaRecepcion.descripcion && (
                      <p className="text-xs text-[#4a6a84]">{gruposFeed.entradaRecepcion.descripcion}</p>
                    )}
                    {gruposFeed.entradaRecepcion.doc_gde && (
                      <p className="text-[10px] font-mono text-[#1b3a57] mt-1 flex items-center gap-1">
                        <Icon name="attach_file" size={12} />
                        {gruposFeed.entradaRecepcion.doc_gde}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-[#7a9ab4] flex-shrink-0 mt-0.5">{formatFecha(gruposFeed.entradaRecepcion.fecha)}</span>
                </div>
              )}
            </div>
          )}

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

      {/* ── Modal nueva actividad ── */}
      <Modal
        open={modalNuevaActividad}
        onClose={cerrarModal}
        titulo="Nueva actividad"
        size="md"
        footer={
          <>
            <button onClick={cerrarModal} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={tabModal === 'generica' ? agregarNuevaActividad : guardarSolicitud}
              disabled={
                tabModal === 'generica'
                  ? (!formAct.titulo.trim() || !formAct.descripcion.trim())
                  : !formSolicitud.titulo.trim()
              }
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {tabModal === 'generica' ? 'Agregar' : 'Crear solicitud'}
            </button>
          </>
        }
      >
        {/* Tabs */}
        <div className="flex gap-1 bg-[#f5f5f5] rounded-xl p-1 mb-4">
          {([
            ['generica',  'Actividad Genérica'],
            ['solicitud', 'Nueva Solicitud'],
          ] as const).map(([val, lbl]) => (
            <button key={val} type="button"
              onClick={() => setTabModal(val)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                tabModal === val
                  ? 'bg-white text-[#1b3a57] shadow-sm'
                  : 'text-[#4a6a84] hover:text-[#1b3a57]'
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
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#4a9ab5] text-[#1b3a57] text-xs font-semibold hover:bg-[rgba(27,58,87,0.05)] transition-colors"
              >
                <Icon name="article" size={16} />
                Generar Escrito
              </button>
            )}
          </div>
          <div>
            <label className="field-label">Título <span className="text-[#b91c1c]">*</span></label>
            <input type="text" className="field-input w-full" value={formAct.titulo} onChange={e => setFormAct(p => ({ ...p, titulo: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="field-label">Fecha</label>
            <input type="date" className="field-input w-full" value={formAct.fecha} onChange={e => setFormAct(p => ({ ...p, fecha: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Descripción <span className="text-[#b91c1c]">*</span></label>
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
            <div>
              <label className="field-label">Fecha de aviso (opcional)</label>
              <p className="text-[10px] text-[#7a9ab4] mb-1">
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
          <div>
            <label className="field-label">Adjunto</label>
            {adjuntoNuevaAct ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#f5f5f5]">
                <Icon name="attach_file" size={18} />
                <span className="text-xs text-[#1b3a57] flex-1 truncate">{adjuntoNuevaAct.name}</span>
                <span className="text-[10px] text-[#4a6a84]">{(adjuntoNuevaAct.size / 1024).toFixed(0)} KB</span>
                <button
                  onClick={() => setAdjuntoNuevaAct(null)}
                  className="p-0.5 rounded text-[#4a6a84] hover:text-red-600 transition-colors"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-[rgba(0,0,0,0.12)] cursor-pointer hover:border-[rgba(27,58,87,0.50)] hover:bg-[rgba(27,58,87,0.05)] transition-all group">
                <Icon name="attach_file" size={18} className="text-[#4a6a84] group-hover:text-[#1b3a57]" />
                <span className="text-xs text-[#4a6a84] group-hover:text-[#1b3a57]">Adjuntar archivo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={e => setAdjuntoNuevaAct(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          {exp.es_juicio_iniciado && (
            <div className="pt-3 border-t border-[rgba(0,0,0,0.08)]">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[#1b3a57] w-4 h-4 flex-shrink-0"
                  checked={esImpulsorio}
                  onChange={e => setEsImpulsorio(e.target.checked)}
                />
                <div>
                  <p className="text-sm font-semibold text-[#1b3a57] group-hover:text-[#2a5278]">
                    Marcar como movimiento impulsorio
                  </p>
                  <p className="text-xs text-[#7a9ab4] mt-0.5">
                    Resetea el timer de 3 meses desde la fecha de esta actividad.
                  </p>
                </div>
              </label>
              {esImpulsorio && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2.5 bg-[#C4DFE8] rounded-xl">
                  <Icon name="schedule" size={14} className="text-[#1b3a57] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#1b3a57]">
                    El plazo procesal se reiniciará a partir del{' '}
                    <span className="font-bold">{formAct.fecha || 'hoy'}</span>.
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
            <button onClick={() => { setReplyTarget(null); limpiarFormReply() }} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarReply}
              disabled={!formReply.texto.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-3 py-1">
          {replyTarget && (
            <div className="bg-[#f5f5f5] rounded-xl px-3 py-2 flex items-start gap-2">
              <Icon name="reply" size={14} className="text-[#4a6a84] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#4a6a84] line-clamp-2">{replyTarget.act.titulo}</p>
            </div>
          )}
          <div>
            <label className="field-label">Comentario <span className="text-[#b91c1c]">*</span></label>
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
              <p className="text-[10px] text-[#7a9ab4] mb-1">A partir de qué fecha recibir el aviso de proximidad al vencimiento.</p>
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
    </div>
  )
}