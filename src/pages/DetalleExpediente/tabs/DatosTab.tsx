import { useState } from 'react'
import type { Expediente, CampoFormulario } from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { getCamposFormulario } from '../../../data/formularios'
import { TIPOS_GESTION, JUZGADOS, TRIBUNALES, FISCALIAS, UFIS, COMISARIAS, LINEAS_FERROVIARIAS } from '../../../data/catalogos'
import { USUARIOS, getNombreCompleto, getUsuarioById } from '../../../data/usuarios'
import { formatFecha, formatMonto } from '../../../utils/format'
import { EstadoBadge, AreaBadge } from '../../../components/ui/Badge'

const ALL_JUZGADOS = [...JUZGADOS, ...TRIBUNALES, ...FISCALIAS, ...UFIS, ...COMISARIAS]

function getJuzgadoLabel(id: string): string {
  return ALL_JUZGADOS.find(j => j.id === id)?.label ?? id
}
function getLineaLabel(id: string): string {
  return LINEAS_FERROVIARIAS.find(l => l.id === id)?.label ?? id
}

function valorDisplay(campo: CampoFormulario, val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  if (campo.type === 'date')    return formatFecha(String(val))
  if (campo.type === 'money')   return formatMonto(Number(val))
  if (campo.type === 'boolean') return Boolean(val) ? 'Sí' : 'No'
  if (campo.type === 'juzgado') return getJuzgadoLabel(String(val))
  if (campo.type === 'linea')   return getLineaLabel(String(val))
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
    <div className="py-3 flex gap-6 items-start border-b border-outline-variant/30 last:border-0">
      <dt className="w-48 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pt-0.5">
        {label}
      </dt>
      <dd className="flex-1 text-sm text-on-surface">
        {edit && input ? input : (value ?? <span className="text-on-surface-variant">—</span>)}
      </dd>
    </div>
  )
}

function Seccion({ titulo }: { titulo: string }) {
  return (
    <div className="pt-5 pb-1 first:pt-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/50 pb-2">
        {titulo}
      </p>
    </div>
  )
}

interface Props { exp: Expediente }

export function DatosTab({ exp }: Props) {
  const { actualizarExpediente, expedientes } = useExpedientesStore()

  const [edit, setEdit] = useState(false)
  const [draftTop, setDraftTop] = useState<Record<string, unknown>>({})
  const [draftMesa, setDraftMesa] = useState<Record<string, unknown>>({})
  const [draftAbogado, setDraftAbogado] = useState<Record<string, unknown>>({})

  const camposMesa    = getCamposFormulario(exp.tipo, 'mesa', exp.area)
  const camposAbogado = getCamposFormulario(exp.tipo, 'abogado', exp.area)
  const tipoLabel     = TIPOS_GESTION.find(t => t.code === exp.tipo)?.label ?? exp.tipo
  const abogado       = exp.abogado_id ? getUsuarioById(exp.abogado_id) : undefined
  const abogadosArea  = USUARIOS.filter(u => u.areas.includes(exp.area) && u.rolSistema !== 'ADMINISTRATIVO')

  const numeroCausaActual = (draftTop['numero_causa'] as string | undefined) ?? ''
  const causaDuplicada = edit && numeroCausaActual.trim()
    ? expedientes.filter(e => e.id !== exp.id && e.numero_causa === numeroCausaActual.trim())
    : []

  function startEdit() {
    setDraftTop({
      caratula:       exp.caratula,
      numero_ee_gde:  exp.numero_ee_gde,
      numero_causa:   exp.numero_causa ?? '',
      abogado_id:     exp.abogado_id ?? '',
      fecha_recepcion: exp.fecha_recepcion,
      observaciones:  exp.observaciones ?? '',
    })
    setDraftMesa({ ...exp.campos_mesa })
    setDraftAbogado({ ...exp.campos_abogado })
    setEdit(true)
  }

  function save() {
    actualizarExpediente(exp.id, {
      caratula:       String(draftTop['caratula'] ?? exp.caratula),
      numero_ee_gde:  String(draftTop['numero_ee_gde'] ?? exp.numero_ee_gde),
      numero_causa:   (draftTop['numero_causa'] as string | undefined)?.trim() || null,
      abogado_id:     (draftTop['abogado_id'] as string | undefined) || undefined,
      fecha_recepcion: String(draftTop['fecha_recepcion'] ?? exp.fecha_recepcion),
      observaciones:  (draftTop['observaciones'] as string | undefined) || undefined,
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
    if (campo.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-primary rounded" checked={Boolean(draft[campo.id])} onChange={e => setDraft(p => ({ ...p, [campo.id]: e.target.checked }))} />
          <span className="text-sm text-on-surface">Sí</span>
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
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-on-surface">Datos del expediente</p>
        {!edit ? (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEdit(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Guardar
            </button>
          </div>
        )}
      </div>

      <dl>
        <Seccion titulo="Expediente" />

        <FieldRow label="N° Expediente" edit={false}
          value={<span className="font-mono font-bold text-primary">{exp.id}</span>}
        />
        <FieldRow label="Área" edit={false}
          value={<AreaBadge area={exp.area} />}
        />
        <FieldRow label="Tipo de Gestión" edit={false}
          value={tipoLabel}
        />
        <FieldRow label="Estado" edit={false}
          value={<EstadoBadge code={exp.estado} label={exp.estado} />}
        />
        <FieldRow
          label="Carátula"
          edit={edit}
          value={exp.caratula}
          input={
            <input
              type="text"
              className="field-input w-full text-sm"
              value={(draftTop['caratula'] as string) ?? ''}
              onChange={e => setTop('caratula', e.target.value)}
            />
          }
        />
        <FieldRow
          label="N° Causa"
          edit={edit}
          value={exp.numero_causa ?? '—'}
          input={
            <div>
              <input
                type="text"
                className="field-input w-full text-sm font-mono"
                placeholder="12345/2026 o SS"
                value={(draftTop['numero_causa'] as string) ?? ''}
                onChange={e => setTop('numero_causa', e.target.value)}
              />
              {causaDuplicada.length > 0 && (
                <p className="mt-1 text-xs text-amber-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  Causa con {causaDuplicada.length} exp. más registrados
                </p>
              )}
            </div>
          }
        />
        <FieldRow
          label="Letrado/a"
          edit={edit}
          value={abogado ? getNombreCompleto(abogado) : '—'}
          input={
            <select
              className="field-input w-full text-sm"
              value={(draftTop['abogado_id'] as string) ?? ''}
              onChange={e => setTop('abogado_id', e.target.value)}
            >
              <option value="">Sin asignar</option>
              {abogadosArea.map(u => (
                <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
              ))}
            </select>
          }
        />
        {exp.observaciones !== undefined && (
          <FieldRow
            label="Observaciones"
            edit={edit}
            value={exp.observaciones}
            input={
              <textarea
                className="field-input resize-y w-full text-sm"
                style={{ minHeight: 64 }}
                value={(draftTop['observaciones'] as string) ?? ''}
                onChange={e => setTop('observaciones', e.target.value)}
              />
            }
          />
        )}

        <Seccion titulo="Datos de Recepción" />

        <FieldRow
          label="N° EE / Memo GDE"
          edit={edit}
          value={<span className="font-mono">{exp.numero_ee_gde}</span>}
          input={
            <input
              type="text"
              className="field-input w-full text-sm font-mono"
              value={(draftTop['numero_ee_gde'] as string) ?? ''}
              onChange={e => setTop('numero_ee_gde', e.target.value)}
            />
          }
        />
        <FieldRow
          label="Fecha de Recepción"
          edit={edit}
          value={formatFecha(exp.fecha_recepcion)}
          input={
            <input
              type="date"
              className="field-input w-full text-sm"
              value={(draftTop['fecha_recepcion'] as string) ?? ''}
              onChange={e => setTop('fecha_recepcion', e.target.value)}
            />
          }
        />

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

        {camposAbogado.length > 0 && (
          <>
            <Seccion titulo="Letrado/a" />
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
