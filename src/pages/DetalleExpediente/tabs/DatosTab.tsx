import { useState } from 'react'
import type { Expediente, CampoFormulario } from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { getCamposFormulario } from '../../../data/formularios'
import { TIPOS_GESTION, JUZGADOS, TRIBUNALES, FISCALIAS, UFIS, COMISARIAS, LINEAS_FERROVIARIAS } from '../../../data/catalogos'
import { FUEROS_CIVIL_LAB, FUEROS_PENAL, getJuzgadosPorFuero, getSecretarias } from '../../../data/juzgadosPJN'
import { getNombreCompleto, getUsuarioById } from '../../../data/usuarios'
import { formatFecha, formatMonto, normalizarMoneda, normalizarMontos, normalizarRemitentes, MAX_REMITENTES, limpiarMontos, opcionesMonedaDisponibles, proximaMonedaLibre, type Moneda, type ParMoneda } from '../../../utils/format'
import Icon from '../../../components/ui/Icon'
import { useConfiguracionStore } from '../../../store/configuracion.store'
import { opcionesDeCampo } from '../../../components/expedientes/FormularioDinamico'
import { calcularAgrupadorOficioPenal, usaAgrupadorOficioPenal, CAMPOS_AGRUPADOR_OFICIO_PENAL } from '../../../utils/numeroCausa'
import { toast } from 'react-toastify'
import type { MonedaItem } from '../../../types'

const ALL_JUZGADOS = [...JUZGADOS, ...TRIBUNALES, ...FISCALIAS, ...UFIS, ...COMISARIAS]

// Tipos con flujo MATRIZ SACO — muestran el campo bloqueado "Causal de finalización"
const TIPOS_FINALIZACION_LIBRE = new Set([
  'DEMANDA_CIVIL', 'DEMANDA_LABORAL', 'DEMANDA_CIVIL_ACTORA', 'DEMANDA_LABORAL_ACTORA',
])

function getJuzgadoLabel(id: string): string {
  return ALL_JUZGADOS.find(j => j.id === id)?.label ?? id
}
function getLineaLabel(id: string): string {
  return LINEAS_FERROVIARIAS.find(l => l.id === id)?.label ?? id
}

function valorDisplay(
  campo: CampoFormulario,
  val: unknown,
  monedas: MonedaItem[],
  registro?: Record<string, unknown>,
): React.ReactNode {
  if (val === null || val === undefined || val === '') return '—'
  if (campo.type === 'date')    return formatFecha(String(val))
  if (campo.type === 'money')   return formatMonto(Number(val), normalizarMoneda(registro?.[`${campo.id}_moneda`], monedas), monedas)
  if (campo.type === 'money_multi') {
    const pares = normalizarMontos(val, registro?.[`${campo.id}_moneda`], monedas)
    if (pares.length === 0) return '—'
    return (
      <div className="flex flex-col gap-0.5">
        {pares.map((p, i) => <span key={i}>{formatMonto(p.monto, p.moneda, monedas)}</span>)}
      </div>
    )
  }
  if (campo.type === 'text_multi') {
    const lista = normalizarRemitentes(val)
    if (lista.length === 0) return '—'
    return (
      <div className="flex flex-col gap-0.5">
        {lista.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    )
  }
  if (campo.type === 'boolean') return Boolean(val) ? 'Sí' : 'No'
  if (campo.type === 'juzgado') return getJuzgadoLabel(String(val))
  if (campo.type === 'linea')   return getLineaLabel(String(val))
  if (campo.type === 'multiselect') {
    if (!Array.isArray(val) || val.length === 0) return '—'
    return (val as string[]).join(', ')
  }
  // Selects con options {value,label} (ej. Tipo de moneda): se muestra el label, no el código.
  if (campo.type === 'select' && Array.isArray(campo.options)) {
    const opt = (campo.options as Array<string | { value: string; label: string }>)
      .find(o => typeof o !== 'string' && o.value === val)
    if (opt && typeof opt !== 'string') return opt.label
  }
  return String(val)
}

interface RowProps {
  label: string
  value: React.ReactNode
  edit: boolean
  input?: React.ReactNode
  full?: boolean
}

// PRD §8.3: <dt> en mayúsculas gris chico y <dd> en gris oscuro, dentro de una grilla de 3 columnas.
function FieldRow({ label, value, edit, input, full }: RowProps) {
  return (
    <div className={full ? 'col-span-2 md:col-span-3' : ''}>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-800 break-words">
        {edit && input ? input : (value || <span className="text-gray-400">—</span>)}
      </dd>
    </div>
  )
}

function Seccion({ titulo }: { titulo: string }) {
  return (
    <div className="col-span-2 md:col-span-3 pt-2 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{titulo}</p>
    </div>
  )
}

interface Props { exp: Expediente }

export function DatosTab({ exp }: Props) {
  const { actualizarExpediente, renombrarAgrupador, expedientes } = useExpedientesStore()
  const config = useConfiguracionStore()
  const { monedas } = config

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

  // Una fila de money_multi agregada y dejada sin importe no debe persistir como "$0" —
  // se descarta al guardar (mismo criterio que el modal "Iniciar Juicio").
  function limpiarMontosDraft(draft: Record<string, unknown>, campos: CampoFormulario[]): Record<string, unknown> {
    const limpio = { ...draft }
    campos.forEach(c => {
      if (c.type === 'money_multi') {
        limpio[c.id] = limpiarMontos(normalizarMontos(draft[c.id], draft[`${c.id}_moneda`], monedas))
      }
      // Delta 28 — Remitente: se descartan las filas en blanco y los repetidos.
      if (c.type === 'text_multi') limpio[c.id] = normalizarRemitentes(draft[c.id])
    })
    return limpio
  }

  function save() {
    const mesaLimpio = limpiarMontosDraft(draftMesa, camposMesa)

    // Delta 1 / 2A — Tipo de Intervención obligatorio.
    if (!String(mesaLimpio['mesa_tipo_intervencion'] ?? '').trim()) {
      toast.error('El Tipo de Intervención es obligatorio.')
      return
    }

    actualizarExpediente(exp.id, {
      numero_ee_gde:  String(draftTop['numero_ee_gde'] ?? exp.numero_ee_gde),
      campos_mesa:    mesaLimpio,
      campos_abogado: limpiarMontosDraft(draftAbogado, camposAbogado),
    })

    // Delta 10 — agrupador de causa del Oficio Penal (Causa > IPP > Sumario).
    // Solo se recalcula si cambió alguno de los 3 campos: un agrupamiento hecho a
    // mano ("Agrupar a causa") no se pisa al guardar otros datos.
    if (usaAgrupadorOficioPenal(exp)) {
      const cambioCampos = CAMPOS_AGRUPADOR_OFICIO_PENAL.some(k =>
        String(mesaLimpio[k] ?? '').trim() !== String(exp.campos_mesa?.[k] ?? '').trim())
      const nuevo = calcularAgrupadorOficioPenal(mesaLimpio)
      const anterior = exp.numero_causa ?? null
      if (cambioCampos && nuevo !== anterior) {
        if (anterior) {
          // Renombra el agrupador: todas las actuaciones agrupadas bajo el valor
          // anterior se re-agrupan bajo el nuevo.
          const cuantas = expedientes.filter(e => e.numero_causa === anterior).length
          renombrarAgrupador(anterior, nuevo)
          toast.info(nuevo
            ? `Agrupador de causa: ${anterior} → ${nuevo}${cuantas > 1 ? ` (${cuantas} actuaciones re-agrupadas)` : ''}.`
            : `La actuación quedó sin agrupador de causa.`)
        } else {
          actualizarExpediente(exp.id, { numero_causa: nuevo })
          toast.info(`Agrupador de causa: ${nuevo}.`)
        }
      }
    }
    setEdit(false)
  }

  function setTop(key: string, val: unknown) {
    setDraftTop(p => ({ ...p, [key]: val }))
  }

  function renderCampoInput(
    campo: CampoFormulario,
    draft: Record<string, unknown>,
    setDraft: (fn: (p: Record<string, unknown>) => Record<string, unknown>) => void,
    campos: CampoFormulario[] = [],
  ): React.ReactNode {
    const val = (draft[campo.id] as string) ?? ''
    const change = (v: string) => setDraft(p => ({ ...p, [campo.id]: v }))

    if (campo.type === 'textarea') {
      return <textarea className="field-input resize-y w-full text-sm" style={{ minHeight: 72 }} value={val} onChange={e => change(e.target.value)} />
    }
    if (campo.type === 'select' && campo.options) {
      // mesa_tipo_lanzamiento se completa una única vez (al Iniciar Juicio) y
      // queda bloqueado apenas tiene valor — no se puede corregir desde acá.
      const bloqueadoPorLanzamiento = campo.id === 'mesa_tipo_lanzamiento' && !!exp.campos_mesa?.['mesa_tipo_lanzamiento']
      return (
        <select
          disabled={bloqueadoPorLanzamiento}
          className={`field-input w-full text-sm${bloqueadoPorLanzamiento ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
          value={val}
          onChange={e => change(e.target.value)}
        >
          <option value="">Seleccionar…</option>
          {opcionesDeCampo(campo, config as unknown as Record<string, unknown>, val).map(opt => {
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
    if (campo.type === 'fuero_select') {
      const fuerosPorArea = exp.area === 'PENAL' ? FUEROS_PENAL : FUEROS_CIVIL_LAB
      const baseId = campo.id.replace('_fuero', '')
      return (
        <select
          className="field-input w-full text-sm"
          value={val}
          onChange={e => {
            change(e.target.value)
            setDraft(p => ({ ...p, [baseId]: '' }))
          }}
        >
          <option value="">Seleccionar fuero...</option>
          {fuerosPorArea.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      )
    }
    if (campo.type === 'juzgado_filtered') {
      const fueroIdDirecto = `${campo.id}_fuero`
      const fueroIdHermano = `${campo.id.replace('tribunal', 'juzgado')}_fuero`
      const fueroVal = (draft[fueroIdDirecto] as string) || (draft[fueroIdHermano] as string) || ''
      const juzgados = fueroVal ? getJuzgadosPorFuero(fueroVal) : []
      const secretariaHija = campos.find(c => c.type === 'secretaria_juzgado' && c.juzgadoRef === campo.id)
      return (
        <select
          className="field-input w-full text-sm"
          value={val}
          disabled={!fueroVal}
          onChange={e => {
            change(e.target.value)
            if (secretariaHija) setDraft(p => ({ ...p, [secretariaHija.id]: '' }))
          }}
        >
          <option value="">{fueroVal ? 'Seleccionar juzgado / tribunal...' : 'Primero seleccioná un fuero'}</option>
          {juzgados.map(j => <option key={j.nombre} value={j.nombre}>{j.nombre}</option>)}
        </select>
      )
    }
    if (campo.type === 'secretaria_juzgado') {
      const juzgadoId = campo.juzgadoRef ?? campo.id.replace('secretaria', 'juzgado')
      const fueroId = `${juzgadoId}_fuero`
      const fueroVal = (draft[fueroId] as string) ?? ''
      const juzgadoVal = (draft[juzgadoId] as string) ?? ''
      const secs = fueroVal && juzgadoVal ? getSecretarias(fueroVal, juzgadoVal) : []

      if (!juzgadoVal) {
        return (
          <input className="field-input w-full text-sm" disabled placeholder="Seleccioná primero un juzgado" value="" onChange={() => {}} />
        )
      }
      if (secs.length === 1 && secs[0] === 'ÚNICA') {
        if (val !== 'ÚNICA') {
          setTimeout(() => change('ÚNICA'), 0)
        }
        return (
          <input className="field-input w-full text-sm bg-gray-100 text-gray-500 cursor-not-allowed" value="ÚNICA" readOnly />
        )
      }
      if (secs.length === 1 && secs[0] === 'A COMPLETAR') {
        return (
          <input className="field-input w-full text-sm" placeholder="Ingresar secretaría..." value={val} onChange={e => change(e.target.value)} />
        )
      }
      return (
        <select className="field-input w-full text-sm" value={val} onChange={e => change(e.target.value)}>
          <option value="">Seleccionar secretaría...</option>
          {secs.map(s => <option key={s} value={s}>{s}</option>)}
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
    if (campo.type === 'money_multi') {
      const pares = normalizarMontos(draft[campo.id], draft[`${campo.id}_moneda`], monedas)
      const filas: ParMoneda[] = pares.length > 0 ? pares : [{ moneda: proximaMonedaLibre([], monedas) as Moneda, monto: 0 }]
      const commit = (nuevas: ParMoneda[]) => setDraft(p => ({ ...p, [campo.id]: nuevas }))
      const proxima = proximaMonedaLibre(filas, monedas)
      return (
        <div className="space-y-2 w-full">
          {filas.map((par, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                className="field-input text-sm w-24 flex-shrink-0"
                value={par.moneda}
                onChange={e => {
                  const n = [...filas]; n[i] = { ...n[i], moneda: e.target.value as Moneda }; commit(n)
                }}
              >
                {opcionesMonedaDisponibles(filas, i, monedas).map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
              </select>
              <input
                type="number"
                className="field-input flex-1 text-sm"
                value={par.monto || ''}
                onChange={e => {
                  const n = [...filas]; n[i] = { ...n[i], monto: Number(e.target.value) || 0 }; commit(n)
                }}
              />
              {filas.length > 1 && (
                <button type="button" onClick={() => commit(filas.filter((_, idx) => idx !== i))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors flex-shrink-0">
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          ))}
          {proxima && (
            <button type="button" onClick={() => commit([...filas, { moneda: proxima, monto: 0 }])}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 hover:text-blue-800 transition-colors mt-1">
              <Icon name="add" size={14} />
              Agregar monto
            </button>
          )}
        </div>
      )
    }
    if (campo.type === 'text_multi') {
      const raw = normalizarRemitentes(draft[campo.id], true)
      const filas = raw.length > 0 ? raw : ['']
      const commit = (nuevas: string[]) => setDraft(p => ({ ...p, [campo.id]: nuevas }))
      return (
        <div className="space-y-2 w-full">
          {filas.map((txt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                className="field-input flex-1 text-sm"
                value={txt}
                placeholder={i === 0 ? undefined : 'Otro remitente'}
                onChange={e => { const n = [...filas]; n[i] = e.target.value; commit(n) }}
              />
              {filas.length > 1 && (
                <button type="button" title="Quitar remitente" onClick={() => commit(filas.filter((_, idx) => idx !== i))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors flex-shrink-0">
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          ))}
          {filas.length < MAX_REMITENTES && (
            <button type="button" onClick={() => commit([...filas, ''])}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 hover:text-blue-800 transition-colors mt-1">
              <Icon name="add" size={14} />
              Agregar remitente
            </button>
          )}
        </div>
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
                onChange={e => {
                  const nuevoValor = e.target.value
                  const n = [...slots]; n[si] = nuevoValor; commit(n)
                }}
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
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors flex-shrink-0">
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          ))}
          {slots.filter(v => v !== '').length < opts.length && (
            <button type="button" onClick={() => setDraft(p => ({ ...p, [campo.id]: [...slots, ''] }))}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 hover:text-blue-800 transition-colors mt-1">
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
          <span className="text-sm text-gray-800">Sí</span>
        </label>
      )
    }
    // Delta 10 — en el Oficio Penal, N° de IPP y N° de Sumario son mutuamente
    // excluyentes: con uno cargado, el otro queda bloqueado.
    const excluyente = usaAgrupadorOficioPenal(exp)
      ? ({ mesa_num_ipp: 'mesa_num_sumario', mesa_num_sumario: 'mesa_num_ipp' } as Record<string, string>)[campo.id]
      : undefined
    const bloqueadoPorExcluyente = !!excluyente && !!String(draft[excluyente] ?? '').trim()
    return (
      <input
        type={campo.type === 'date' ? 'date' : campo.type === 'money' ? 'number' : 'text'}
        className={`field-input w-full text-sm${campo.mono ? ' font-mono' : ''}${bloqueadoPorExcluyente ? ' bg-gray-100 cursor-not-allowed' : ''}`}
        value={val}
        disabled={bloqueadoPorExcluyente}
        title={bloqueadoPorExcluyente ? 'N° de IPP y N° de Sumario son excluyentes: vaciá el otro para cargar este.' : undefined}
        onChange={e => change(e.target.value)}
      />
    )
  }

  const CANAL_LABEL: Record<string, string> = { EE_GDE: 'EE GDE', MEMO_GDE: 'Memo GDE', OTROS: 'Otros' }
  const canal = (exp as unknown as { canal?: string }).canal

  // Botones de edición del header de la card (PRD letrado §3)
  const accionesEdicion = !edit ? (
    <button
      onClick={startEdit}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
    >
      <Icon name="edit" size={16} />
      Editar
    </button>
  ) : (
    <div className="flex gap-2">
      <button
        onClick={() => setEdit(false)}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
      >
        Cancelar
      </button>
      <button
        onClick={save}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Guardar
      </button>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Card 1: Datos de la Actuación ── */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-700 pb-2">
          <h2 className="text-base font-semibold text-gray-700">Datos de la Actuación</h2>
          {accionesEdicion}
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FieldRow
            label="N° EE / Memo"
            edit={edit}
            value={exp.numero_ee_gde}
            input={
              <input type="text"
                className="field-input w-full text-sm"
                value={(draftTop['numero_ee_gde'] as string) ?? ''}
                onChange={e => setTop('numero_ee_gde', e.target.value)}
              />
            }
          />
          <FieldRow label="Fecha recepción" edit={false} value={formatFecha(exp.fecha_recepcion)} />
          <FieldRow label="Canal" edit={false} value={canal ? (CANAL_LABEL[canal] ?? canal) : undefined} />
          <FieldRow label="Tipo de gestión" edit={false} value={tipoLabel} />
          <FieldRow
            label={edit ? 'Intervención *' : 'Intervención'}
            edit={edit}
            value={String(exp.campos_mesa['mesa_tipo_intervencion'] ?? '') || undefined}
            input={
              <select
                className="field-input w-full text-sm"
                value={(draftMesa['mesa_tipo_intervencion'] as string) ?? ''}
                onChange={e => setDraftMesa(p =>
                  ({ ...p, mesa_tipo_intervencion: e.target.value }))}
              >
                <option value="">— Sin especificar —</option>
                {(exp.area === 'PENAL'
                  ? ['Denunciante', 'Actuación de Oficio', 'Sin Intervención']
                  : ['Actora', 'Demandada', 'Sin Intervención']
                ).map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            }
          />
          <FieldRow
            label="Oficio judicial"
            edit={edit}
            value={valorDisplay(
              { id: 'mesa_oficio_judicial', label: '', type: 'text' },
              exp.campos_mesa['mesa_oficio_judicial'],
              monedas
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
          <FieldRow label="Letrado asignado" edit={false} value={abogado ? getNombreCompleto(abogado) : undefined} />
          {TIPOS_FINALIZACION_LIBRE.has(exp.tipo) && (
            <FieldRow label="Causal de finalización" edit={false}
              value={exp.causal_finalizacion ?? 'Se completa automáticamente al finalizar la actuación'}
            />
          )}
          <FieldRow
            full
            label="Comentarios"
            edit={edit}
            value={String(exp.campos_mesa['mesa_comentarios'] ?? '') || undefined}
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
        </dl>
      </section>

      {/* ── Card 2: Detalle — {tipo} ── */}
      {(camposMesa.length > 0 || camposAbogado.length > 0) && (
        <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-700 border-b border-gray-700 pb-2">
            Detalle — {tipoLabel}
          </h2>

          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {camposMesa.map(campo => (
              <FieldRow
                key={campo.id}
                full={campo.full || campo.type === 'textarea'}
                label={campo.label}
                edit={edit}
                value={valorDisplay(campo, exp.campos_mesa[campo.id], monedas, exp.campos_mesa)}
                input={renderCampoInput(campo, draftMesa, setDraftMesa, camposMesa)}
              />
            ))}

            {camposAbogado.length > 0 && (
              <>
                <Seccion titulo="Letrado/a" />
                <FieldRow
                  full
                  label="Datos de Contacto"
                  edit={edit}
                  value={String(exp.campos_abogado['abg_datos_contacto'] ?? '') || undefined}
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
                {camposAbogado.map(campo => (
                  <FieldRow
                    key={campo.id}
                    full={campo.full || campo.type === 'textarea'}
                    label={campo.label}
                    edit={edit}
                    value={valorDisplay(campo, exp.campos_abogado[campo.id], monedas, exp.campos_abogado)}
                    input={renderCampoInput(campo, draftAbogado, setDraftAbogado, camposAbogado)}
                  />
                ))}
              </>
            )}
          </dl>
        </section>
      )}
    </div>
  )
}
