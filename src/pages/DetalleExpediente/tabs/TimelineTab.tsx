import { useState, useEffect } from 'react'
import type { Expediente, Actividad, TipoActividad, Tarea } from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { useUIStore } from '../../../store/ui.store'
import { Modal } from '../../../components/ui/Modal'
import { formatFecha } from '../../../utils/format'
import { getNombreCompleto } from '../../../data/usuarios'
import { getEstadoProcesal, calcularUrgencia } from '../../../data/estadosProcesales'

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

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function mesAnio(fecha: string) {
  const [y, m] = fecha.split('-')
  return `${MESES[parseInt(m) - 1]} ${y}`
}

export function TimelineTab({ exp }: Props) {
  const {
    tareasMap, inicializarTareas, actualizarTarea,
    agregarActividad, actualizarEstado, actualizarExpediente,
  } = useExpedientesStore()
  const { usuarioActivo, showToast } = useUIStore()

  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null)
  const [cambiosLocales, setCambiosLocales] = useState<Partial<Tarea>>({})
  const [modalNuevaActividad, setModalNuevaActividad] = useState(false)
  const [modalAvanzarEstado, setModalAvanzarEstado] = useState(false)
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const [formAct, setFormAct] = useState(BLANK_ACT)

  const estadoCodigo = exp.estadoProcesal ?? 'INICIO'
  const estadoProcesal = getEstadoProcesal(exp.tipo, estadoCodigo)
  const key = `${exp.id}__${estadoCodigo}`
  const siguienteEstado = estadoProcesal?.siguiente
    ? getEstadoProcesal(exp.tipo, estadoProcesal.siguiente)
    : undefined

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
  const puedeAvanzar = total > 0 && completadas === total && !!siguienteEstado
  const progresoPct = total > 0 ? Math.round((completadas / total) * 100) : 0
  const tareasVisibles = mostrarTodas ? tareas : tareas.slice(0, 6)

  const sorted = [...exp.timeline].sort((a, b) => a.fecha.localeCompare(b.fecha))

  const estadoLocal = cambiosLocales.estado ?? tareaSeleccionada?.estado ?? 'sin_estado'
  const urgenciaLocal = calcularUrgencia(
    cambiosLocales.fechaVencimiento !== undefined
      ? cambiosLocales.fechaVencimiento
      : tareaSeleccionada?.fechaVencimiento
  )

  function guardarTarea() {
    if (!tareaSeleccionada) return
    actualizarTarea(exp.id, estadoCodigo, tareaSeleccionada.id, cambiosLocales)
    showToast('Tarea actualizada.', 'success')
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
    })
    actualizarEstado(exp.id, siguienteEstado.label)
    actualizarExpediente(exp.id, { estadoProcesal: siguienteEstado.codigo })
    setModalAvanzarEstado(false)
    showToast(`Estado actualizado a ${siguienteEstado.label}`, 'success')
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
      doc_gde: formAct.doc_gde || null,
      subitems: [],
      activo: false,
      creado_por: usuarioActivo?.id,
    }
    agregarActividad(exp.id, act)
    showToast('Actividad registrada.', 'success')
    setModalNuevaActividad(false)
    setFormAct(BLANK_ACT)
  }

  return (
    <div className="flex gap-5 items-start">

      {/* ── Columna izquierda ── */}
      <div className="flex-1 min-w-0">

        {/* Entradas del timeline */}
        {sorted.length > 0 && (
          <div className="mb-4">
            {sorted.map((act, idx) => {
              const prevMes = idx > 0 ? mesAnio(sorted[idx - 1].fecha) : null
              const thisMes = mesAnio(act.fecha)
              return (
                <div key={act.id ?? idx}>
                  {prevMes !== thisMes && (
                    <div className="flex items-center gap-2 mb-3 mt-1">
                      <div className="flex-1 h-px bg-outline-variant/30" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-outline-variant">
                        {thisMes}
                      </span>
                      <div className="flex-1 h-px bg-outline-variant/30" />
                    </div>
                  )}
                  <div className="flex gap-3 mb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-outline-variant mt-1 flex-shrink-0" />
                      {idx < sorted.length - 1 && (
                        <div className="w-px flex-1 bg-outline-variant/20 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-3 mb-1 shadow-card">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-on-surface">{act.titulo}</p>
                        <p className="text-[10px] text-on-surface-variant ml-auto whitespace-nowrap">
                          {formatFecha(act.fecha)}
                        </p>
                      </div>
                      {act.descripcion && (
                        <p className="text-xs text-on-surface-variant">{act.descripcion}</p>
                      )}
                      {act.doc_gde && (
                        <p className="text-[10px] font-mono text-primary mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">attach_file</span>
                          {act.doc_gde}
                        </p>
                      )}
                      {act.subitems && act.subitems.length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-outline-variant/30 space-y-1">
                          {act.subitems.map((sub, si) => (
                            <div key={si}>
                              <p className="text-xs font-medium text-on-surface">{sub.titulo}</p>
                              {sub.descripcion && (
                                <p className="text-[10px] text-on-surface-variant">{sub.descripcion}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Panel de tareas del estado actual */}
        {estadoProcesal && (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden mb-4">
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-2 bg-surface-container-low border-b border-outline-variant/20">
              <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">
                Tareas — {estadoProcesal.label}
              </p>
              <span className="text-xs text-on-surface-variant">{completadas}/{total}</span>
              <div className="flex-1 bg-surface-container h-1.5 rounded-full mx-2 max-w-[80px]">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${progresoPct}%` }}
                />
              </div>
              <div className="ml-auto">
                {puedeAvanzar ? (
                  <button
                    onClick={() => setModalAvanzarEstado(true)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary text-on-primary animate-pulse"
                  >
                    Avanzar →
                  </button>
                ) : (
                  <button
                    disabled
                    title={`Faltan ${total - completadas} tareas por completar`}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-surface-container text-outline cursor-not-allowed"
                  >
                    Avanzar →
                  </button>
                )}
              </div>
            </div>

            {/* Lista de tareas */}
            {tareasVisibles.map(tarea => {
              const urg = calcularUrgencia(tarea.fechaVencimiento)
              const isSelected = tareaSeleccionada?.id === tarea.id
              return (
                <div
                  key={tarea.id}
                  onClick={() => setTareaSeleccionada(tarea)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer border-b border-outline-variant/10 transition-colors hover:bg-surface-container-low ${
                    isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    urg === 'rojo'  ? 'bg-error' :
                    urg === 'ambar' ? 'bg-amber-500' :
                    urg === 'verde' ? 'bg-green-500' : 'bg-outline-variant'
                  }`} />

                  {tarea.estado === 'cumplido' && (
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-[10px]">✓</span>
                    </div>
                  )}
                  {tarea.estado === 'en_curso' && (
                    <div className="w-4 h-4 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '10px' }}>schedule</span>
                    </div>
                  )}
                  {tarea.estado === 'no_procedente' && (
                    <div className="w-4 h-4 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span className="text-outline text-[10px]">⊘</span>
                    </div>
                  )}
                  {tarea.estado === 'sin_estado' && (
                    <div className="w-4 h-4 rounded-full border-2 border-outline-variant flex-shrink-0" />
                  )}

                  <p className="text-xs text-on-surface flex-1 truncate">{tarea.nombre}</p>

                  {tarea.estado !== 'sin_estado' && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      tarea.estado === 'cumplido'
                        ? 'bg-green-100 text-green-700'
                        : tarea.estado === 'en_curso'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {tarea.estado === 'cumplido' ? 'Cumplido'
                        : tarea.estado === 'en_curso' ? 'En curso'
                        : 'No proc.'}
                    </span>
                  )}
                </div>
              )
            })}

            {!mostrarTodas && tareas.length > 6 && (
              <div
                className="px-4 py-2 bg-surface-container/50 cursor-pointer"
                onClick={() => setMostrarTodas(true)}
              >
                <p className="text-[11px] text-on-surface-variant hover:text-primary">
                  + {tareas.length - 6} tareas más...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botón nueva actividad genérica */}
        <button
          onClick={() => { setFormAct(BLANK_ACT); setModalNuevaActividad(true) }}
          className="w-full py-2.5 border-2 border-dashed border-outline-variant/50 rounded-xl text-xs font-bold text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Nueva actividad genérica
        </button>
      </div>

      {/* ── Columna derecha — detalle tarea ── */}
      {tareaSeleccionada && (
        <div className="w-72 flex-shrink-0 sticky top-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-outline-variant/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-outline-variant">
                Tarea — {estadoProcesal?.label}
              </p>
              <p className="text-sm font-bold text-on-surface mt-1 leading-snug">
                {tareaSeleccionada.nombre}
              </p>
              {estadoLocal !== 'sin_estado' && (
                <span className={`inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  estadoLocal === 'cumplido'
                    ? 'bg-green-100 text-green-700'
                    : estadoLocal === 'en_curso'
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {estadoLocal === 'cumplido' ? 'Cumplido'
                    : estadoLocal === 'en_curso' ? 'En curso'
                    : 'No proc.'}
                </span>
              )}
            </div>

            {/* Formulario */}
            <div className="px-4 py-3 space-y-3">
              <div>
                <label className="field-label">Observaciones</label>
                <textarea
                  className="field-input resize-none h-20 w-full"
                  value={cambiosLocales.observaciones ?? tareaSeleccionada.observaciones ?? ''}
                  onChange={e => setCambiosLocales(p => ({ ...p, observaciones: e.target.value }))}
                  placeholder="Registrá notas o avances..."
                />
              </div>

              <div>
                <label className="field-label">Estado</label>
                <div className="flex gap-1.5">
                  {(['en_curso', 'cumplido', 'no_procedente'] as const).map(est => (
                    <button
                      key={est}
                      onClick={() => setCambiosLocales(p => ({ ...p, estado: est }))}
                      className={`flex-1 py-2 rounded-lg border text-[11px] font-bold transition-all ${
                        estadoLocal === est
                          ? est === 'cumplido'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : est === 'en_curso'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-outline bg-surface-container text-outline'
                          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {est === 'en_curso' ? '⏱ En curso'
                        : est === 'cumplido' ? '✓ Cumplido'
                        : '⊘ No proc.'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Fecha</label>
                <input
                  type="date"
                  className="field-input w-full"
                  value={cambiosLocales.fecha ?? tareaSeleccionada.fecha ?? HOY}
                  onChange={e => setCambiosLocales(p => ({ ...p, fecha: e.target.value }))}
                />
              </div>

              <div>
                <label className="field-label">Fecha de vencimiento</label>
                <input
                  type="date"
                  className={`field-input w-full ${
                    urgenciaLocal === 'rojo'  ? 'border-error focus:border-error' :
                    urgenciaLocal === 'ambar' ? 'border-amber-400' : ''
                  }`}
                  value={cambiosLocales.fechaVencimiento ?? tareaSeleccionada.fechaVencimiento ?? ''}
                  onChange={e => setCambiosLocales(p => ({ ...p, fechaVencimiento: e.target.value || null }))}
                />
                {urgenciaLocal === 'rojo' && (
                  <p className="text-[10px] text-error mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Plazo vencido
                  </p>
                )}
              </div>

              <div>
                <label className="field-label">Documento GDE</label>
                <input
                  type="text"
                  className="field-input font-mono text-xs w-full"
                  placeholder="EX-2026-..."
                  value={cambiosLocales.docGde ?? tareaSeleccionada.docGde ?? ''}
                  onChange={e => setCambiosLocales(p => ({ ...p, docGde: e.target.value || null }))}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-4 flex gap-2 justify-end">
              <button
                onClick={() => setTareaSeleccionada(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTarea}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal avanzar estado ── */}
      <Modal
        open={modalAvanzarEstado}
        onClose={() => setModalAvanzarEstado(false)}
        titulo="Confirmar avance de estado"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setModalAvanzarEstado(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarAvance}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity"
            >
              Confirmar avance
            </button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-2xl">arrow_forward</span>
          </div>
          <p className="text-sm text-on-surface mb-3">
            Estás por cambiar el estado del expediente de{' '}
            <strong>{estadoProcesal?.label}</strong> a{' '}
            <strong>{siguienteEstado?.label}</strong>.
          </p>
          <div className="bg-green-50 rounded-lg p-3 text-xs text-green-700 font-semibold mb-3">
            ✓ {total} de {total} tareas completadas
          </div>
          <p className="text-xs text-on-surface-variant italic">
            Esta acción quedará registrada en el timeline del expediente.
          </p>
        </div>
      </Modal>

      {/* ── Modal nueva actividad genérica ── */}
      <Modal
        open={modalNuevaActividad}
        onClose={() => setModalNuevaActividad(false)}
        titulo="Nueva actividad genérica"
        size="md"
        footer={
          <>
            <button
              onClick={() => setModalNuevaActividad(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={agregarNuevaActividad}
              disabled={!formAct.titulo.trim() || !formAct.descripcion.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Agregar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="field-label">Tipo</label>
            <select
              className="field-input w-full"
              value={formAct.tipo}
              onChange={e => setFormAct(p => ({ ...p, tipo: e.target.value as TipoActividad }))}
            >
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Título <span className="text-error">*</span></label>
            <input
              type="text"
              className="field-input w-full"
              value={formAct.titulo}
              onChange={e => setFormAct(p => ({ ...p, titulo: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="field-label">Fecha</label>
            <input
              type="date"
              className="field-input w-full"
              value={formAct.fecha}
              onChange={e => setFormAct(p => ({ ...p, fecha: e.target.value }))}
            />
          </div>
          <div>
            <label className="field-label">Descripción <span className="text-error">*</span></label>
            <textarea
              className="field-input w-full resize-y"
              style={{ minHeight: 72 }}
              value={formAct.descripcion}
              onChange={e => setFormAct(p => ({ ...p, descripcion: e.target.value }))}
            />
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
        </div>
      </Modal>
    </div>
  )
}
