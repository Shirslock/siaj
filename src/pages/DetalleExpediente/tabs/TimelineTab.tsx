import { useState, useEffect } from 'react'
import type { Expediente, Actividad, TipoActividad, Tarea } from '../../../types'
import { TimelinePenal } from './TimelinePenal'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { useUIStore } from '../../../store/ui.store'
import { Modal } from '../../../components/ui/Modal'
import { formatFecha } from '../../../utils/format'
import { getNombreCompleto } from '../../../data/usuarios'
import { getEstadoProcesal, getEstadosProcesales, calcularUrgencia } from '../../../data/estadosProcesales'
import Icon from '../../../components/ui/Icon'
import { toast } from 'react-toastify'
import {
  actividadesToFilas, tareasToFilas, exportarExcel, exportarPDF,
  type FilaTimelineExport,
} from '../../../utils/exportTimeline'

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
  tipo: 'MOVIMIENTO' as TipoActividad,
  titulo: '',
  descripcion: '',
  fecha: HOY,
  doc_gde: '',
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
  onClick: () => void
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
                  className="field-input w-full text-xs pl-6 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
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
                  className={`field-input w-full text-xs pl-6 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute`}
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
  const isSistema = act.tipo === 'MOVIMIENTO' && !!act.estadoExpediente && act.titulo.startsWith('Cambio de estado')

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
            <p className="text-sm font-semibold text-[#1b3a57] leading-snug">{act.titulo}</p>
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
            <span className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">
              Tareas del estado anterior — Solo lectura
            </span>
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
  tareaSeleccionada,
  setTareaSeleccionada,
  onAvanzar,
}: {
  exp: Expediente
  tareas: Tarea[]
  estadoProcesal: NonNullable<ReturnType<typeof getEstadoProcesal>>
  completadas: number
  total: number
  tareaSeleccionada: Tarea | null
  setTareaSeleccionada: (t: Tarea) => void
  onAvanzar: () => void
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
          <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
            progresoPct === 100 ? 'bg-green-100 text-green-700' : 'bg-[#C4DFE8] text-[#1b3a57]'
          }`}>
            {estadoProcesal.label.toUpperCase()}
          </span>
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

        <button
          onClick={onAvanzar}
          disabled={!puedeAvanzar}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
            puedeAvanzar
              ? 'bg-[#1b3a57] text-white hover:opacity-90 animate-pulse'
              : 'bg-[#e8e8e8] text-[#7a9ab4] cursor-not-allowed'
          }`}
          title={!puedeAvanzar ? `Faltan ${total - completadas} tarea(s)` : `Avanzar a ${siguienteEstado?.label}`}
        >
          Avanzar
          <Icon name="arrow_forward" size={14} />
        </button>
      </div>

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
              onClick={() => setTareaSeleccionada(tarea)}
              isSelected={tareaSeleccionada?.id === tarea.id}
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

// ── Componente principal ─────────────────────────────────────────────────────

export function TimelineTab({ exp }: Props) {
  if (exp.area === 'PENAL') {
    return <TimelinePenal exp={exp} />
  }

  const {
    tareasMap, inicializarTareas, actualizarTarea,
    agregarActividad, actualizarEstado, actualizarExpediente,
  } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null)
  const [cambiosLocales, setCambiosLocales] = useState<Partial<Tarea>>({})
  const [modalNuevaActividad, setModalNuevaActividad] = useState(false)
  const [modalAvanzarEstado, setModalAvanzarEstado] = useState(false)
  const [formAct, setFormAct] = useState(BLANK_ACT)
  const [adjuntoNuevaAct, setAdjuntoNuevaAct] = useState<File | null>(null)
  const [filtroTab, setFiltroTab] = useState<FiltroTab>('todo')
  const [busqueda, setBusqueda] = useState('')
  const [menuExport, setMenuExport] = useState(false)
  const [snapshotsExpandidos, setSnapshotsExpandidos] = useState<Set<number>>(new Set())

  const toggleSnapshot = (idx: number) =>
    setSnapshotsExpandidos(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })

  const estadoCodigo = exp.estadoProcesal ?? 'INICIO'
  const estadoProcesal = getEstadoProcesal(exp.tipo, estadoCodigo)
  const key = `${exp.id}__${estadoCodigo}`
  const siguienteEstado = estadoProcesal?.siguiente
    ? getEstadoProcesal(exp.tipo, estadoProcesal.siguiente)
    : undefined
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

  const sorted = [...exp.timeline].sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Filtrar feed
  const feedFiltrado = sorted.filter(act => {
    const esSistema = act.tipo === 'MOVIMIENTO' && !!act.estadoExpediente && act.titulo.startsWith('Cambio de estado')
    const esActividad = !esSistema
    const esHija = esActividad && !!act.estadoExpediente && sorted.some(
      padre => padre !== act && padre.tipo === 'MOVIMIENTO' && padre.titulo.startsWith('Cambio de estado') && padre.estadoExpediente === act.estadoExpediente
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

  // Contadores para tabs
  const cntSistema     = sorted.filter(a => a.tipo === 'MOVIMIENTO' && !!a.estadoExpediente).length
  const cntActividades = sorted.filter(a => !(a.tipo === 'MOVIMIENTO' && !!a.estadoExpediente)).length
  const cntTareas      = total

  function getEstadoAnterior(act: Actividad): string | null {
    const match = act.titulo.match(/Cambio de estado: (.+) → (.+)/)
    if (!match) return null
    const labelAnterior = match[1].trim()
    const encontrado = getEstadosProcesales(exp.tipo).find(e => e.label === labelAnterior)
    return encontrado?.codigo ?? null
  }

  function getTareasHistoricas(act: Actividad): Tarea[] {
    const codigoAnterior = getEstadoAnterior(act)
    if (!codigoAnterior) return act.tareasSnapshot ?? []
    const keyAnterior = `${exp.id}__${codigoAnterior}`
    return tareasMap[keyAnterior] ?? act.tareasSnapshot ?? []
  }

  function guardarTarea() {
    if (!tareaSeleccionada) return
    actualizarTarea(exp.id, estadoCodigo, tareaSeleccionada.id, cambiosLocales)
    toast.success('Tarea actualizada.')
    setTareaSeleccionada(null)
  }

  function confirmarAvance() {
    if (!estadoProcesal || !siguienteEstado) return
    const nombre = usuarioActivo ? getNombreCompleto(usuarioActivo) : 'Usuario'
    agregarActividad(exp.id, {
      id: `ACT_${Date.now()}`,
      expediente_id: exp.id,
      tipo: 'MOVIMIENTO',
      titulo: `Cambio de estado: ${estadoProcesal.label} → ${siguienteEstado.label}`,
      descripcion: `Estado avanzado por ${nombre}.`,
      fecha: HOY,
      activo: true,
      subitems: [],
      estadoExpediente: siguienteEstado.codigo,
      doc_gde: null,
      creado_por: usuarioActivo?.id,
      tareasSnapshot: [...tareas],
    })
    actualizarEstado(exp.id, siguienteEstado.codigo)
    actualizarExpediente(exp.id, { estadoProcesal: siguienteEstado.codigo })
    setModalAvanzarEstado(false)
    toast.success(`Estado actualizado a ${siguienteEstado.label}`)
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
    }
    agregarActividad(exp.id, act)
    toast.success('Actividad registrada.')
    setModalNuevaActividad(false)
    setFormAct(BLANK_ACT)
    setAdjuntoNuevaAct(null)
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
          }).join(' | ')
        : ''
      return { ...fila, tareasDetalle }
    })
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
          <Icon name="search" size={16} />
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

          {/* Feed actividades */}
          {filtroTab !== 'tareas' && feedFiltrado.length > 0 && (
            <div className="mb-4">
              {feedFiltrado.map((act, idx) => {
                const hijasDeEsteItem = !!act.estadoExpediente
                  ? sorted.filter(a =>
                      !!a.estadoExpediente &&
                      a.estadoExpediente === act.estadoExpediente &&
                      !(a.tipo === 'MOVIMIENTO' && a.titulo.startsWith('Cambio de estado')) &&
                      a.id !== act.id
                    )
                  : []
                const esSistemaEntry = act.tipo === 'MOVIMIENTO' && !!act.estadoExpediente && act.titulo.startsWith('Cambio de estado')
                const tareasHist = esSistemaEntry ? getTareasHistoricas(act) : []
                return (
                  <ActividadFeedItem
                    key={act.id ?? idx}
                    act={act}
                    idx={idx}
                    isLast={idx === feedFiltrado.length - 1}
                    hijas={hijasDeEsteItem}
                    snapshotOpen={snapshotsExpandidos.has(idx)}
                    onToggleSnapshot={() => toggleSnapshot(idx)}
                    tareasHistoricas={tareasHist}
                  />
                )
              })}
            </div>
          )}

          {/* Mensaje estado inicial */}
          {esEstadoInicial && filtroTab !== 'tareas' && (
            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 text-center mb-4">
              <Icon name="inbox" className="block mb-2" size={32} />
              <p className="text-sm font-semibold text-[#1b3a57] mb-1">Expediente pendiente de inicio</p>
              <p className="text-xs text-[#4a6a84]">
                Usá <strong>Acciones → Cambiar estado</strong> para comenzar.
              </p>
            </div>
          )}

          {filtroTab !== 'tareas' && feedFiltrado.length === 0 && !esEstadoInicial && (
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-8 text-center text-[#4a6a84] text-sm mb-4">
              No hay actividades que coincidan.
            </div>
          )}

          {/* Bloque tareas (tab todo o tareas) */}
          {(filtroTab === 'todo' || filtroTab === 'tareas') && !esEstadoInicial && estadoProcesal && (
            <TareasBlock
              exp={exp}
              tareas={tareas}
              estadoProcesal={estadoProcesal}
              completadas={completadas}
              total={total}
              tareaSeleccionada={tareaSeleccionada}
              setTareaSeleccionada={(t) => {
                setTareaSeleccionada(t)
                setCambiosLocales({})
              }}
              onAvanzar={() => setModalAvanzarEstado(true)}
            />
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

      {/* ── Modal avanzar estado ── */}
      <Modal
        open={modalAvanzarEstado}
        onClose={() => setModalAvanzarEstado(false)}
        titulo="Confirmar avance de estado"
        size="sm"
        footer={
          <>
            <button onClick={() => setModalAvanzarEstado(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button onClick={confirmarAvance} className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 transition-opacity">
              Confirmar avance
            </button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-[#C4DFE8] flex items-center justify-center mx-auto mb-4">
            <Icon name="arrow_forward" size={24} />
          </div>
          <p className="text-sm text-[#1b3a57] mb-3">
            Estás por cambiar el estado de{' '}
            <strong>{estadoProcesal?.label}</strong> a{' '}
            <strong>{siguienteEstado?.label}</strong>.
          </p>
          <div className="bg-green-50 rounded-lg p-3 text-xs text-green-700 font-semibold mb-3">
            ✓ {total} de {total} tareas completadas
          </div>
          <p className="text-xs text-[#4a6a84] italic">
            Esta acción quedará registrada en el timeline del expediente.
          </p>
        </div>
      </Modal>

      {/* ── Modal nueva actividad ── */}
      <Modal
        open={modalNuevaActividad}
        onClose={() => setModalNuevaActividad(false)}
        titulo="Nueva actividad"
        size="md"
        footer={
          <>
            <button onClick={() => setModalNuevaActividad(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={agregarNuevaActividad}
              disabled={!formAct.titulo.trim() || !formAct.descripcion.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Agregar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="field-label">Tipo</label>
            <select className="field-input w-full" value={formAct.tipo} onChange={e => setFormAct(p => ({ ...p, tipo: e.target.value as TipoActividad }))}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
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
        </div>
      </Modal>
    </div>
  )
}