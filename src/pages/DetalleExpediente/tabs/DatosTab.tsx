import { useState } from 'react'
import type { Expediente, CampoFormulario } from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { getCamposFormulario } from '../../../data/formularios'
import { TIPOS_GESTION, JUZGADOS, TRIBUNALES, FISCALIAS, UFIS, COMISARIAS, LINEAS_FERROVIARIAS } from '../../../data/catalogos'
import { getNombreCompleto, getUsuarioById } from '../../../data/usuarios'
import { formatFecha, formatMonto } from '../../../utils/format'
import { EstadoBadge, AreaBadge } from '../../../components/ui/Badge'
import Icon from '../../../components/ui/Icon'

const ALL_JUZGADOS = [...JUZGADOS, ...TRIBUNALES, ...FISCALIAS, ...UFIS, ...COMISARIAS]

function getJuzgadoLabel(id: string): string {
  return ALL_JUZGADOS.find(j => j.id === id)?.label ?? id
}
function getLineaLabel(id: string): string {
  return LINEAS_FERROVIARIAS.find(l => l.id === id)?.label ?? id
}

function valorDisplay(campo: CampoFormulario, val: unknown): React.ReactNode {
  if (val === null || val === undefined || val === '') return '—'
  if (campo.type === 'date')    return formatFecha(String(val))
  if (campo.type === 'money')   return formatMonto(Number(val))
  if (campo.type === 'boolean') return Boolean(val) ? 'Sí' : 'No'
  if (campo.type === 'juzgado') return getJuzgadoLabel(String(val))
  if (campo.type === 'linea')   return getLineaLabel(String(val))
  if (campo.type === 'multiselect') {
    if (!Array.isArray(val) || val.length === 0) return '—'
    return (
      <div className="flex flex-wrap gap-1.5">
        {(val as string[]).map(v => (
          <span key={v} className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#C4DFE8] text-[#1b3a57]">
            {v}
          </span>
        ))}
      </div>
    )
  }
  return String(val)
}

interface RowProps {
  label: string
  value: React.ReactNode
  edit: boolean
  input?: React.ReactNode
}

function FieldRow({ label, value, edit, input }: RowProps) {
  return (
    <div className="py-3 flex gap-6 items-start border-b border-[rgba(0,0,0,0.08)] last:border-0">
      <dt className="w-48 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#4a6a84] pt-0.5">
        {label}
      </dt>
      <dd className="flex-1 text-sm text-[#1b3a57]">
        {edit && input ? input : (value ?? <span className="text-[#4a6a84]">—</span>)}
      </dd>
    </div>
  )
}

function Seccion({ titulo }: { titulo: string }) {
  return (
    <div className="pt-6 pb-2 first:pt-0">
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full bg-[#1b3a57] flex-shrink-0" />
        <p className="text-xs font-bold tracking-tight text-[#1b3a57]">
          {titulo}
        </p>
        <div className="flex-1 h-px bg-[rgba(0,0,0,0.08)]" />
      </div>
    </div>
  )
}

interface Props { exp: Expediente }

export function DatosTab({ exp }: Props) {
  const { actualizarExpediente } = useExpedientesStore()

  const [edit, setEdit] = useState(false)
  const [draftTop, setDraftTop] = useState<Record<string, unknown>>({})
  const [draftMesa, setDraftMesa] = useState<Record<string, unknown>>({})
  const [draftAbogado, setDraftAbogado] = useState<Record<string, unknown>>({})

  const camposMesa    = getCamposFormulario(exp.tipo, 'mesa', exp.area)
  const camposAbogado = getCamposFormulario(exp.tipo, 'abogado', exp.area)
  const tipoLabel     = TIPOS_GESTION.find(t => t.code === exp.tipo)?.label ?? exp.tipo
  const abogado       = exp.abogado_id ? getUsuarioById(exp.abogado_id) : undefined

  function startEdit() {
    setDraftTop({
      numero_ee_gde: exp.numero_ee_gde,
    })
    setDraftMesa({ ...exp.campos_mesa })
    setDraftAbogado({ ...exp.campos_abogado })
    setEdit(true)
  }

  function save() {
    actualizarExpediente(exp.id, {
      numero_ee_gde:  String(draftTop['numero_ee_gde'] ?? exp.numero_ee_gde),
      campos_mesa:    draftMesa,
      campos_abogado: draftAbogado,
    })
    setEdit(false)
  }

  function setTop(key: string, val: unknown) {
    setDraftTop(p => ({ ...p, [key]: val }))
  }

  function renderCampoInput(
    campo: CampoFormulario,
    draft: Record<string, unknown>,
    setDraft: (fn: (p: Record<string, unknown>) => Record<string, unknown>) => void,
  ): React.ReactNode {
    const val = (draft[campo.id] as string) ?? ''
    const change = (v: string) => setDraft(p => ({ ...p, [campo.id]: v }))

    if (campo.type === 'textarea') {
      return <textarea className="field-input resize-y w-full text-sm" style={{ minHeight: 72 }} value={val} onChange={e => change(e.target.value)} />
    }
    if (campo.type === 'select' && campo.options) {
      return (
        <select className="field-input w-full text-sm" value={val} onChange={e => change(e.target.value)}>
          <option value="">Seleccionar…</option>
          {(campo.options as Array<string | { value: string; label: string }>).map(opt => {
            const v = typeof opt === 'string' ? opt : opt.value
            const l = typeof opt === 'string' ? opt : opt.label
            return <option key={v} value={v}>{l}</option>
          })}
        </select>
      )
    }
    if (campo.type === 'juzgado') {
      return (
        <select className="field-input w-full text-sm" value={val} onChange={e => change(e.target.value)}>
          <option value="">Seleccionar…</option>
          {ALL_JUZGADOS.map(j => <option key={j.id} value={j.id}>{j.label}</option>)}
        </select>
      )
    }
    if (campo.type === 'linea') {
      return (
        <select className="field-input w-full text-sm" value={val} onChange={e => change(e.target.value)}>
          <option value="">Seleccionar…</option>
          {LINEAS_FERROVIARIAS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      )
    }
    if (campo.type === 'multiselect' && campo.options) {
      const opts = campo.options as string[]
      const raw = draft[campo.id]
      const slots: string[] = Array.isArray(raw) && raw.length > 0 ? raw as string[] : ['']
      const commit = (newSlots: string[]) =>
        setDraft(p => ({ ...p, [campo.id]: newSlots.filter(v => v !== '') }))
      return (
        <div className="space-y-2 w-full">
          {slots.map((slotVal, si) => (
            <div key={si} className="flex items-center gap-2">
              <select
                value={slotVal}
                onChange={e => { const n = [...slots]; n[si] = e.target.value; commit(n) }}
                className="field-input flex-1 text-sm"
              >
                <option value="">Seleccioná una opción…</option>
                {opts.map(opt => (
                  <option key={opt} value={opt} disabled={slots.some((v, i) => i !== si && v === opt)}>
                    {opt}
                  </option>
                ))}
              </select>
              {slots.length > 1 && (
                <button type="button" onClick={() => commit(slots.filter((_, i) => i !== si))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#fee2e2] hover:text-[#b91c1c] transition-colors flex-shrink-0">
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          ))}
          {slots.filter(v => v !== '').length < opts.length && (
            <button type="button" onClick={() => commit([...slots, ''])}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1b3a57] hover:text-[#2a5278] transition-colors mt-1">
              <Icon name="add" size={14} />
              Agregar otro
            </button>
          )}
        </div>
      )
    }
    if (campo.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-primary rounded" checked={Boolean(draft[campo.id])} onChange={e => setDraft(p => ({ ...p, [campo.id]: e.target.checked }))} />
          <span className="text-sm text-[#1b3a57]">Sí</span>
        </label>
      )
    }
    return (
      <input
        type={campo.type === 'date' ? 'date' : campo.type === 'money' ? 'number' : 'text'}
        className={`field-input w-full text-sm${campo.mono ? ' font-mono' : ''}`}
        value={val}
        onChange={e => change(e.target.value)}
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#1b3a57]">Datos de la actuación</p>
        {!edit ? (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#e8e8e8] text-[#1b3a57] hover:bg-[#e0e0e0] transition-colors"
          >
            <Icon name="edit" size={16} />
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEdit(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1b3a57] text-white hover:opacity-90 transition-opacity"
            >
              <Icon name="save" size={16} />
              Guardar
            </button>
          </div>
        )}
      </div>

      <dl>

        {/* ── SECCIÓN 1: Expediente ── */}
        <Seccion titulo="Actuación" />
        <FieldRow label="N° Interno" edit={false}
          value={<span className="font-mono font-bold text-[#1b3a57]">{exp.id}</span>}
        />
        <FieldRow label="Tipo de Gestión" edit={false}
          value={tipoLabel}
        />
        <FieldRow label="Área" edit={false}
          value={<AreaBadge area={exp.area} />}
        />
        <FieldRow label="Estado" edit={false}
          value={<EstadoBadge code={exp.estado} label={exp.estado} />}
        />
        <FieldRow label="Letrado Asignado" edit={false}
          value={abogado ? getNombreCompleto(abogado) : '—'}
        />
        <FieldRow label="Fecha de Recepción" edit={false}
          value={formatFecha(exp.fecha_recepcion)}
        />

        {/* ── SECCIÓN 2: Datos de Recepción ── */}
        <Seccion titulo="Datos de Recepción" />
        <FieldRow
          label="N° EE / Memo GDE"
          edit={edit}
          value={<span className="font-mono">{exp.numero_ee_gde}</span>}
          input={
            <input type="text"
              className="field-input w-full text-sm font-mono"
              value={(draftTop['numero_ee_gde'] as string) ?? ''}
              onChange={e => setTop('numero_ee_gde', e.target.value)}
            />
          }
        />
        <FieldRow
          label="Oficio Judicial"
          edit={edit}
          value={valorDisplay(
            { id: 'mesa_oficio_judicial', label: '', type: 'text' },
            exp.campos_mesa['mesa_oficio_judicial']
          )}
          input={
            <input type="text"
              className="field-input w-full text-sm"
              value={(draftMesa['mesa_oficio_judicial'] as string) ?? ''}
              onChange={e => setDraftMesa(p =>
                ({ ...p, mesa_oficio_judicial: e.target.value }))}
            />
          }
        />
        <FieldRow
          label="Tipo de Intervención"
          edit={edit}
          value={String(exp.campos_mesa['mesa_tipo_intervencion'] ?? '—')}
          input={
            <select
              className="field-input w-full text-sm"
              value={(draftMesa['mesa_tipo_intervencion'] as string) ?? ''}
              onChange={e => setDraftMesa(p =>
                ({ ...p, mesa_tipo_intervencion: e.target.value }))}
            >
              <option value="">Seleccionar…</option>
              {(exp.area === 'PENAL'
                ? ['Denunciante', 'Sin Intervención']
                : ['Actora', 'Demandada', 'Sin Intervención']
              ).map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          }
        />
        <FieldRow
          label="Comentarios"
          edit={edit}
          value={String(exp.campos_mesa['mesa_comentarios'] ?? '—')}
          input={
            <textarea
              className="field-input resize-y w-full text-sm"
              style={{ minHeight: 64 }}
              value={(draftMesa['mesa_comentarios'] as string) ?? ''}
              onChange={e => setDraftMesa(p =>
                ({ ...p, mesa_comentarios: e.target.value }))}
            />
          }
        />

        {/* ── SECCIÓN 3: Mesa SACO ── */}
        {camposMesa.length > 0 && (
          <>
            <Seccion titulo="Mesa SACO" />
            {camposMesa.map(campo => (
              <FieldRow
                key={campo.id}
                label={campo.label}
                edit={edit}
                value={valorDisplay(campo, exp.campos_mesa[campo.id])}
                input={renderCampoInput(campo, draftMesa, setDraftMesa)}
              />
            ))}
          </>
        )}

        {/* ── SECCIÓN 4: Letrado/a ── */}
        {camposAbogado.length > 0 && (
          <>
            <Seccion titulo="Letrado/a" />

            {/* Datos de Contacto — siempre primero */}
            <FieldRow
              label="Datos de Contacto"
              edit={edit}
              value={String(exp.campos_abogado['abg_datos_contacto'] ?? '—')}
              input={
                <input type="text"
                  className="field-input w-full text-sm"
                  placeholder="Teléfono, Mail, Dirección, Contacto"
                  value={(draftAbogado['abg_datos_contacto'] as string) ?? ''}
                  onChange={e => setDraftAbogado(p =>
                    ({ ...p, abg_datos_contacto: e.target.value }))}
                />
              }
            />

            {/* Campos abogado del tipo */}
            {camposAbogado.map(campo => (
              <FieldRow
                key={campo.id}
                label={campo.label}
                edit={edit}
                value={valorDisplay(campo, exp.campos_abogado[campo.id])}
                input={renderCampoInput(campo, draftAbogado, setDraftAbogado)}
              />
            ))}
          </>
        )}

      </dl>
    </div>
  )
}
