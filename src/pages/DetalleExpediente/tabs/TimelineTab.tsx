import { useState } from 'react'
import type { Expediente, Actividad, TipoActividad, SubActividad } from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { useUIStore } from '../../../store/ui.store'
import { Modal } from '../../../components/ui/Modal'
import { EstadoBadge } from '../../../components/ui/Badge'
import { formatFecha } from '../../../utils/format'
import { getUsuarioById, getNombreCompleto } from '../../../data/usuarios'

interface Props { exp: Expediente }

const TIPOS: { value: TipoActividad; label: string; icon: string }[] = [
  { value: 'RECEPCION',     label: 'Recepción',       icon: 'inbox' },
  { value: 'CONTESTACION',  label: 'Contestación',    icon: 'reply' },
  { value: 'PRESENTACION',  label: 'Presentación',    icon: 'upload_file' },
  { value: 'AUDIENCIA',     label: 'Audiencia',       icon: 'gavel' },
  { value: 'PERICIA',       label: 'Pericia',         icon: 'science' },
  { value: 'TRASLADO',      label: 'Traslado',        icon: 'forward_to_inbox' },
  { value: 'NOTIFICACION',  label: 'Notificación',    icon: 'notifications' },
  { value: 'MOVIMIENTO',    label: 'Movimiento',      icon: 'sync_alt' },
  { value: 'NOTA_RESPUESTA',label: 'Nota / Respuesta',icon: 'sticky_note_2' },
  { value: 'OTRO',          label: 'Otro',            icon: 'radio_button_unchecked' },
]

const ESTADOS_ACT = ['PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'VENCIDA']

const BLANK_ACT = {
  tipo: 'MOVIMIENTO' as TipoActividad,
  titulo: '',
  descripcion: '',
  fecha: new Date().toISOString().split('T')[0],
  vencimiento: '',
  estado: 'PENDIENTE',
  activo: true,
  doc_gde: '',
}

const BLANK_SUB = {
  titulo: '',
  descripcion: '',
  fecha: new Date().toISOString().split('T')[0],
  doc_gde: '',
}

export function TimelineTab({ exp }: Props) {
  const { agregarActividad, agregarSubitem } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  const [filtroTipo, setFiltroTipo] = useState<TipoActividad | ''>('')
  const [modalNueva, setModalNueva] = useState(false)
  const [formAct, setFormAct] = useState(BLANK_ACT)
  const [modalSub, setModalSub] = useState<string | null>(null)
  const [formSub, setFormSub] = useState(BLANK_SUB)

  const sorted = [...exp.timeline]
    .filter(a => !filtroTipo || a.tipo === filtroTipo)
    .sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1
      return b.fecha.localeCompare(a.fecha)
    })

  function agregarNuevaActividad() {
    if (!formAct.titulo.trim()) return
    const act: Actividad = {
      id: `ACT_${Date.now()}`,
      expediente_id: exp.id,
      tipo: formAct.tipo,
      titulo: formAct.titulo,
      descripcion: formAct.descripcion,
      estado: formAct.estado as Actividad['estado'],
      fecha: formAct.fecha,
      vencimiento: formAct.vencimiento || undefined,
      doc_gde: formAct.doc_gde || null,
      subitems: [],
      activo: formAct.activo,
      creado_por: usuarioActivo?.id,
    }
    agregarActividad(exp.id, act)
    setModalNueva(false)
    setFormAct(BLANK_ACT)
  }

  function agregarNuevoSubitem(actividadId: string) {
    if (!formSub.titulo.trim()) return
    const sub: SubActividad = {
      titulo: formSub.titulo,
      descripcion: formSub.descripcion,
      fecha: formSub.fecha,
      doc_gde: formSub.doc_gde || null,
    }
    agregarSubitem(exp.id, actividadId, sub)
    setModalSub(null)
    setFormSub(BLANK_SUB)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFiltroTipo('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filtroTipo === '' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Todos
            </button>
            {TIPOS.map(t => (
              <button
                key={t.value}
                onClick={() => setFiltroTipo(filtroTipo === t.value ? '' : t.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filtroTipo === t.value ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setFormAct(BLANK_ACT); setModalNueva(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-sm flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nueva actividad
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-10 text-center text-on-surface-variant text-sm">
            No hay actividades registradas.
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(act => {
              const creador = act.creado_por ? getUsuarioById(act.creado_por) : undefined
              return (
                <div
                  key={act.id}
                  className={`bg-surface-container-lowest rounded-2xl shadow-card p-5 ${act.activo ? 'ring-1 ring-primary/30' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {act.activo && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-container px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        )}
                        <p className="font-medium text-on-surface text-sm">{act.titulo}</p>
                        {act.estado && <EstadoBadge code={act.estado} label={act.estado.replace(/_/g, ' ')} />}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{act.descripcion}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-on-surface-variant flex-wrap">
                        <span>{formatFecha(act.fecha)}</span>
                        {act.vencimiento && (
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">event</span>
                            Vto. {formatFecha(act.vencimiento)}
                          </span>
                        )}
                        {creador && <span>{getNombreCompleto(creador)}</span>}
                        {act.doc_gde && (
                          <span className="font-mono flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">link</span>
                            {act.doc_gde}
                          </span>
                        )}
                      </div>

                      {act.checklist && act.checklist.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {act.checklist.map(ck => (
                            <div key={ck.id} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                              <span className={`material-symbols-outlined text-[13px] ${ck.completado ? 'text-green-600' : 'text-outline'}`}>
                                {ck.completado ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              {ck.texto}
                            </div>
                          ))}
                        </div>
                      )}

                      {act.subitems && act.subitems.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-outline-variant/40 space-y-1.5">
                          {act.subitems.map((sub, si) => (
                            <div key={si}>
                              <p className="text-xs font-medium text-on-surface">{sub.titulo}</p>
                              <p className="text-[10px] text-on-surface-variant">{sub.descripcion}</p>
                              {sub.doc_gde && (
                                <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">{sub.doc_gde}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => { setFormSub(BLANK_SUB); setModalSub(act.id ?? null) }}
                        className="mt-2 flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[13px]">add</span>
                        Agregar subitem
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal nueva actividad */}
      <Modal
        open={modalNueva}
        onClose={() => setModalNueva(false)}
        titulo="Nueva actividad"
        size="md"
        footer={
          <>
            <button onClick={() => setModalNueva(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancelar
            </button>
            <button
              onClick={agregarNuevaActividad}
              disabled={!formAct.titulo.trim()}
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
            <select className="field-input w-full" value={formAct.tipo} onChange={e => setFormAct(p => ({ ...p, tipo: e.target.value as TipoActividad }))}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Título <span className="text-error">*</span></label>
            <input type="text" className="field-input w-full" value={formAct.titulo} onChange={e => setFormAct(p => ({ ...p, titulo: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="field-label">Descripción</label>
            <textarea className="field-input w-full resize-y" style={{ minHeight: 72 }} value={formAct.descripcion} onChange={e => setFormAct(p => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Fecha</label>
              <input type="date" className="field-input w-full" value={formAct.fecha} onChange={e => setFormAct(p => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Vencimiento</label>
              <input type="date" className="field-input w-full" value={formAct.vencimiento} onChange={e => setFormAct(p => ({ ...p, vencimiento: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Estado</label>
              <select className="field-input w-full" value={formAct.estado} onChange={e => setFormAct(p => ({ ...p, estado: e.target.value }))}>
                {ESTADOS_ACT.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Doc GDE</label>
              <input type="text" className="field-input w-full font-mono text-sm" placeholder="EE-2026-..." value={formAct.doc_gde} onChange={e => setFormAct(p => ({ ...p, doc_gde: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-primary" checked={formAct.activo} onChange={e => setFormAct(p => ({ ...p, activo: e.target.checked }))} />
            <span className="text-sm text-on-surface">Marcar como actividad activa</span>
          </label>
        </div>
      </Modal>

      {/* Modal agregar subitem */}
      <Modal
        open={modalSub !== null}
        onClose={() => setModalSub(null)}
        titulo="Agregar subitem"
        size="sm"
        footer={
          <>
            <button onClick={() => setModalSub(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => modalSub && agregarNuevoSubitem(modalSub)}
              disabled={!formSub.titulo.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Agregar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="field-label">Título <span className="text-error">*</span></label>
            <input type="text" className="field-input w-full" value={formSub.titulo} onChange={e => setFormSub(p => ({ ...p, titulo: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="field-label">Descripción</label>
            <textarea className="field-input w-full resize-y" style={{ minHeight: 60 }} value={formSub.descripcion} onChange={e => setFormSub(p => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Fecha</label>
              <input type="date" className="field-input w-full" value={formSub.fecha} onChange={e => setFormSub(p => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Doc GDE</label>
              <input type="text" className="field-input w-full font-mono text-sm" placeholder="EE-…" value={formSub.doc_gde} onChange={e => setFormSub(p => ({ ...p, doc_gde: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
