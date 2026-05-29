import { useState } from 'react'
import type {
  Expediente,
  EstadoActividadPenal,
  ResultadoBinario,
  ResultadoAcuerdo,
  RegistroActividadPenal,
  SubActividadPenal,
  CampoPenal,
} from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { Modal } from '../../../components/ui/Modal'
import Icon from '../../../components/ui/Icon'
import { formatFecha } from '../../../utils/format'
import { getEtapasPenales, getEtapaPenal } from '../../../data/etapasPenales'
import { toast } from 'react-toastify'

interface Props { exp: Expediente }

const HOY = new Date().toISOString().split('T')[0]

// ── Stepper penal ─────────────────────────────────────

function ProcesalStepperPenal({ exp }: { exp: Expediente }) {
  const etapas = getEtapasPenales(exp.tipo).filter(e => e.numero >= 1)
  const etapaCodigo = exp.estadoProcesal ?? 'EN_ANALISIS'
  const idxActual = etapas.findIndex(e => e.codigo === etapaCodigo)

  if (etapas.length <= 1) return null

  return (
    <div className="bg-white rounded-2xl shadow-card px-8 py-4 mb-4 overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {etapas.map((etapa, idx) => {
          const isPast    = idx < idxActual
          const isCurrent = idx === idxActual
          const isLast    = idx === etapas.length - 1

          return (
            <div key={etapa.codigo} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  isCurrent
                    ? 'bg-[#1b3a57] border-[#1b3a57] text-white shadow-md'
                    : isPast
                    ? 'bg-[rgba(27,58,87,0.20)] border-[rgba(27,58,87,0.40)] text-[#1b3a57]'
                    : 'bg-[#e8e8e8] border-[rgba(0,0,0,0.12)] text-[#4a6a84]'
                }`}>
                  {isPast ? <Icon name="check" size={14} /> : <span className="text-[11px]">{idx + 1}</span>}
                </div>
                <span className={`mt-1.5 text-[10px] font-semibold text-center whitespace-nowrap max-w-[72px] truncate ${
                  isCurrent ? 'text-[#1b3a57]' : isPast ? 'text-[rgba(27,58,87,0.70)]' : 'text-[#4a6a84]'
                }`}>
                  {etapa.label}
                </span>
              </div>
              {!isLast && (
                <div className="w-8 h-px mx-1 mb-4 relative">
                  <div className="absolute inset-0 bg-[rgba(0,0,0,0.08)] rounded-full" />
                  {isPast && <div className="absolute inset-0 bg-[rgba(27,58,87,0.40)] rounded-full" />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────

function getCamposActivos(
  sa: SubActividadPenal,
  resultado: ResultadoBinario | ResultadoAcuerdo
): CampoPenal[] {
  if (sa.tipo === 'SI_NO') {
    if (resultado === 'SI') return sa.camposSI ?? []
    if (resultado === 'NO') return sa.camposNO ?? []
  }
  if (sa.tipo === 'ACUERDO') {
    if (resultado === 'HAY_ACUERDO')  return sa.camposHayAcuerdo ?? []
    if (resultado === 'NO_HAY_ACUERDO') return sa.camposNoAcuerdo ?? []
  }
  return sa.camposLibres ?? []
}

// ── Panel de detalle de registro ──────────────────────

function PanelDetalleRegistro({
  registro,
  etapaCodigo,
  exp,
  onGuardar,
  onCancelar,
}: {
  registro: RegistroActividadPenal
  etapaCodigo: string
  exp: Expediente
  onGuardar: (cambios: Partial<RegistroActividadPenal>) => void
  onCancelar: () => void
}) {
  const etapas = getEtapasPenales(exp.tipo)
  const etapa = etapas.find(e => e.codigo === etapaCodigo)
  const subAct = etapa?.subActividades.find(s => s.id === registro.subActividadId)

  const [draft, setDraft] = useState<Partial<RegistroActividadPenal>>({
    estado: registro.estado,
    resultado: registro.resultado,
    campos: { ...registro.campos },
    fecha: registro.fecha,
    observaciones: registro.observaciones,
  })

  const camposActivos = subAct ? getCamposActivos(subAct, draft.resultado ?? registro.resultado) : []
  const mostrarAvisoFirme =
    subAct && (draft.resultado ?? registro.resultado) === 'SI' &&
    (draft.campos?.sentencia_firme ?? registro.campos?.sentencia_firme) === 'SI' &&
    (subAct.finalizaCausa || subAct.avanzaEtapa)

  function setEstado(estado: EstadoActividadPenal) {
    setDraft(p => ({ ...p, estado }))
  }

  function setCampo(id: string, val: string | boolean) {
    setDraft(p => ({ ...p, campos: { ...(p.campos ?? registro.campos), [id]: val } }))
  }

  const estadoConfig: Record<EstadoActividadPenal, { label: string; activeClass: string }> = {
    en_curso:      { label: '⏱ En curso',   activeClass: 'border-[#1b3a57] bg-[#f0f6ff] text-[#1b3a57]' },
    cumplido:      { label: '✓ Cumplido',   activeClass: 'border-green-500 bg-green-50 text-green-700' },
    no_procedente: { label: '⊘ No proc.',   activeClass: 'border-[rgba(0,0,0,0.20)] bg-[#e8e8e8] text-[#4a6a84]' },
    sin_estado:    { label: 'Sin estado',   activeClass: 'border-[rgba(0,0,0,0.12)] text-[#4a6a84]' },
  }

  return (
    <div className="w-80 flex-shrink-0 sticky top-4 self-start">
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl overflow-hidden shadow-card">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[rgba(0,0,0,0.06)] bg-[#f0f0f0]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] mb-1">
                Detalle de actividad
              </p>
              <p className="text-sm font-bold text-[#1b3a57] leading-snug">
                {registro.numero} {registro.nombre}
              </p>
            </div>
            <button onClick={onCancelar} className="p-1 rounded-lg text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors flex-shrink-0">
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3 max-h-[60vh] overflow-y-auto">

          {/* Estado */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Estado</label>
            <div className="flex gap-1.5">
              {(['en_curso', 'cumplido', 'no_procedente'] as EstadoActividadPenal[]).map(val => {
                const isActive = (draft.estado ?? registro.estado) === val
                return (
                  <button
                    key={val}
                    onClick={() => setEstado(val)}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                      isActive ? estadoConfig[val].activeClass : 'border-[rgba(0,0,0,0.12)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {estadoConfig[val].label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Resultado SI/NO */}
          {subAct?.tipo === 'SI_NO' && (
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Resultado</label>
              <div className="flex gap-2">
                {(['SI', 'NO'] as ResultadoBinario[]).filter(Boolean).map(r => (
                  <button
                    key={r!}
                    onClick={() => setDraft(p => ({ ...p, resultado: r }))}
                    className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${
                      (draft.resultado ?? registro.resultado) === r
                        ? 'bg-[#1b3a57] border-[#1b3a57] text-white'
                        : 'border-[rgba(0,0,0,0.15)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultado ACUERDO */}
          {subAct?.tipo === 'ACUERDO' && (
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Resultado</label>
              <div className="flex gap-2">
                {([
                  { val: 'HAY_ACUERDO', label: 'Hay Acuerdo' },
                  { val: 'NO_HAY_ACUERDO', label: 'No Hay Acuerdo' },
                ] as { val: ResultadoAcuerdo; label: string }[]).map(r => (
                  <button
                    key={r.val!}
                    onClick={() => setDraft(p => ({ ...p, resultado: r.val }))}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      (draft.resultado ?? registro.resultado) === r.val
                        ? 'bg-[#1b3a57] border-[#1b3a57] text-white'
                        : 'border-[rgba(0,0,0,0.15)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campos dinámicos */}
          {camposActivos.map(campo => (
            <CampoInput
              key={campo.id}
              campo={campo}
              value={(draft.campos?.[campo.id] ?? registro.campos?.[campo.id] ?? '') as string}
              onChange={val => setCampo(campo.id, val)}
            />
          ))}

          {/* Aviso sentencia firme */}
          {mostrarAvisoFirme && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <Icon name="warning" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-snug">
                {subAct?.finalizaCausa
                  ? 'Esta resolución queda firme. La causa FINALIZA en este estado.'
                  : `Esta resolución queda firme. La causa AVANZA a ${subAct?.avanzaEtapa ?? 'siguiente etapa'}.`}
              </p>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Observaciones</label>
            <textarea
              className="field-input resize-none w-full text-xs"
              style={{ minHeight: 64 }}
              value={draft.observaciones ?? registro.observaciones ?? ''}
              onChange={e => setDraft(p => ({ ...p, observaciones: e.target.value }))}
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Fecha</label>
            <input
              type="date"
              className="field-input w-full text-xs"
              value={draft.fecha ?? registro.fecha}
              onChange={e => setDraft(p => ({ ...p, fecha: e.target.value }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex gap-2 justify-end border-t border-[rgba(0,0,0,0.06)] pt-3">
          <button onClick={onCancelar} className="px-3 py-2 rounded-xl text-xs font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => onGuardar(draft)}
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

// ── Campo genérico de input ───────────────────────────

function CampoInput({ campo, value, onChange }: { campo: CampoPenal; value: string; onChange: (v: string) => void }) {
  return (
    <div className={campo.full ? 'col-span-2' : ''}>
      <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1">{campo.label}</label>
      {campo.type === 'textarea' ? (
        <textarea
          className="field-input resize-none w-full text-xs"
          style={{ minHeight: 64 }}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : campo.type === 'upload' ? (
        <div className="border-2 border-dashed border-[rgba(0,0,0,0.15)] rounded-xl p-3 text-center text-xs text-[#7a9ab4]">
          <Icon name="upload_file" size={18} className="mx-auto mb-1 text-[#7a9ab4] block" />
          Arrastrá el archivo o hacé click · PDF máx 25MB
        </div>
      ) : campo.type === 'select' ? (
        <select
          className="field-input w-full text-xs"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Seleccionar…</option>
          {campo.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={campo.type === 'date' ? 'date' : campo.type === 'money' ? 'number' : 'text'}
          className="field-input w-full text-xs"
          value={value}
          placeholder={campo.placeholder ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────

export function TimelinePenal({ exp }: Props) {
  const { registrosPenales, agregarRegistroPenal, actualizarRegistroPenal } = useExpedientesStore()
  const registros = registrosPenales[exp.id] ?? []

  const [registroSeleccionado, setRegistroSeleccionado] = useState<RegistroActividadPenal | null>(null)
  const [modalRegistrar, setModalRegistrar] = useState(false)
  const [subActSeleccionada, setSubActSeleccionada] = useState<SubActividadPenal | null>(null)
  const [resultadoModal, setResultadoModal] = useState<ResultadoBinario | ResultadoAcuerdo>(null)
  const [camposModal, setCamposModal] = useState<Record<string, string | boolean>>({})
  const [estadoModal, setEstadoModal] = useState<EstadoActividadPenal>('en_curso')
  const [fechaModal, setFechaModal] = useState(HOY)

  const etapaCodigo = exp.estadoProcesal ?? 'RECEPCIONADO'
  const etapaActual = getEtapaPenal(exp.tipo, etapaCodigo)

  const subActDisponibles = etapaActual?.subActividades.filter(
    sa => !registros.some(r => r.subActividadId === sa.id && r.etapaCodigo === etapaCodigo)
  ) ?? []

  const registrosEtapa = registros.filter(r => r.etapaCodigo === etapaCodigo)

  function resetModal() {
    setSubActSeleccionada(null)
    setResultadoModal(null)
    setCamposModal({})
    setEstadoModal('en_curso')
    setFechaModal(HOY)
  }

  function confirmarRegistro() {
    if (!subActSeleccionada) return
    const nuevoRegistro: RegistroActividadPenal = {
      id: `${exp.id}_${subActSeleccionada.id}_${Date.now()}`,
      subActividadId: subActSeleccionada.id,
      numero: subActSeleccionada.numero,
      nombre: subActSeleccionada.nombre,
      estado: estadoModal,
      resultado: resultadoModal,
      fecha: fechaModal,
      campos: camposModal,
      etapaCodigo,
    }
    agregarRegistroPenal(exp.id, nuevoRegistro)
    toast.success(`Actividad "${subActSeleccionada.nombre}" registrada.`)
    setModalRegistrar(false)
    resetModal()
    setRegistroSeleccionado(nuevoRegistro)
  }

  const camposActualesModal = subActSeleccionada
    ? getCamposActivos(subActSeleccionada, resultadoModal)
    : []

  const badgeEstado = (estado: EstadoActividadPenal) => {
    if (estado === 'cumplido')      return 'bg-green-100 text-green-700'
    if (estado === 'en_curso')      return 'bg-[#C4DFE8] text-[#1b3a57]'
    return 'bg-[#e8e8e8] text-[#4a6a84]'
  }
  const labelEstado = (estado: EstadoActividadPenal) => {
    if (estado === 'cumplido')      return 'Cumplido'
    if (estado === 'en_curso')      return 'En curso'
    if (estado === 'no_procedente') return 'No proc.'
    return 'Sin estado'
  }

  return (
    <div className="space-y-4">

      {/* Stepper */}
      <ProcesalStepperPenal exp={exp} />

      {/* Layout dos columnas */}
      <div className="flex gap-4 items-start">

        {/* Columna izquierda */}
        <div className="flex-1 min-w-0">

          {/* Card actividades */}
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.10)] overflow-hidden mb-4 shadow-card">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[rgba(0,0,0,0.08)]">
              <div>
                <p className="text-sm font-bold text-[#1b3a57]">Actividades procesales</p>
                <p className="text-xs text-[#4a6a84] mt-0.5">
                  {etapaActual?.label} — {registrosEtapa.length} registradas
                </p>
              </div>
              <button
                onClick={() => setModalRegistrar(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1b3a57] text-white rounded-xl text-xs font-bold hover:bg-[#2a5278] transition-colors"
              >
                <Icon name="add" size={14} />
                Registrar actividad
              </button>
            </div>

            {/* Lista */}
            {registrosEtapa.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Icon name="inbox" size={32} className="text-[#7a9ab4] mx-auto mb-3 block" />
                <p className="text-sm text-[#4a6a84]">No hay actividades registradas en esta etapa.</p>
                <p className="text-xs text-[#7a9ab4] mt-1">Usá "Registrar actividad" para agregar una.</p>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(0,0,0,0.06)]">
                {registrosEtapa.map(registro => (
                  <div
                    key={registro.id}
                    onClick={() => setRegistroSeleccionado(registro)}
                    className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-[#f5f5f5] ${
                      registroSeleccionado?.id === registro.id ? 'bg-[#f0f6ff] border-l-[3px] border-l-[#1b3a57]' : ''
                    }`}
                  >
                    {/* Ícono estado */}
                    {registro.estado === 'cumplido' && (
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Icon name="check" size={12} className="text-green-600" />
                      </div>
                    )}
                    {registro.estado === 'en_curso' && (
                      <div className="w-5 h-5 rounded-full bg-[#C4DFE8] flex items-center justify-center flex-shrink-0">
                        <Icon name="schedule" size={12} className="text-[#1b3a57]" />
                      </div>
                    )}
                    {registro.estado === 'no_procedente' && (
                      <div className="w-5 h-5 rounded-full bg-[#e8e8e8] flex items-center justify-center flex-shrink-0 text-[#4a6a84] text-[11px]">⊘</div>
                    )}
                    {registro.estado === 'sin_estado' && (
                      <div className="w-5 h-5 rounded-full border-2 border-[rgba(0,0,0,0.20)] flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1b3a57] truncate">
                        {registro.numero} {registro.nombre}
                      </p>
                      <p className="text-[11px] text-[#7a9ab4]">{formatFecha(registro.fecha)}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeEstado(registro.estado)}`}>
                      {labelEstado(registro.estado)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Columna derecha — detalle */}
        <div className="w-80 flex-shrink-0">
          {!registroSeleccionado ? (
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.10)] p-8 text-center shadow-card">
              <Icon name="description" size={32} className="text-[#7a9ab4] mx-auto mb-3 block" />
              <p className="text-sm text-[#4a6a84]">Seleccioná una actividad para ver su detalle</p>
            </div>
          ) : (
            <PanelDetalleRegistro
              registro={registroSeleccionado}
              exp={exp}
              etapaCodigo={etapaCodigo}
              onGuardar={(cambios) => {
                actualizarRegistroPenal(exp.id, registroSeleccionado.id, cambios)
                toast.success('Actividad actualizada.')
                setRegistroSeleccionado(null)
              }}
              onCancelar={() => setRegistroSeleccionado(null)}
            />
          )}
        </div>
      </div>

      {/* Modal registrar actividad */}
      <Modal
        open={modalRegistrar}
        onClose={() => { setModalRegistrar(false); resetModal() }}
        titulo="Registrar actividad procesal"
        size="lg"
        footer={
          <>
            <button
              onClick={() => { setModalRegistrar(false); resetModal() }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarRegistro}
              disabled={!subActSeleccionada}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Registrar
            </button>
          </>
        }
      >
        {!subActSeleccionada ? (
          /* PASO 1: Seleccionar sub-actividad */
          <div>
            <p className="text-xs text-[#4a6a84] mb-3">
              Etapa: <strong>{etapaActual?.label}</strong> — Seleccioná la actividad que ocurrió
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {subActDisponibles.map(sa => (
                <button
                  key={sa.id}
                  onClick={() => setSubActSeleccionada(sa)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-[#1b3a57] hover:bg-[#f0f6ff] ${
                    sa.finalizaCausa
                      ? 'border-l-4 border-l-[#d97706] border-[rgba(0,0,0,0.12)]'
                      : sa.avanzaEtapa
                      ? 'border-l-4 border-l-[#1b3a57] border-[rgba(0,0,0,0.12)]'
                      : 'border-[rgba(0,0,0,0.12)]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {sa.finalizaCausa && <Icon name="warning" size={14} className="text-[#d97706] mt-0.5 flex-shrink-0" />}
                    {sa.avanzaEtapa && <Icon name="arrow_forward" size={14} className="text-[#1b3a57] mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold text-[#1b3a57]">{sa.numero} {sa.nombre}</p>
                      {sa.finalizaCausa && (
                        <p className="text-[10px] text-[#d97706] mt-0.5">Si queda firme → finaliza la causa</p>
                      )}
                      {sa.avanzaEtapa && (
                        <p className="text-[10px] text-[#1b3a57] mt-0.5">Si queda firme → avanza a siguiente etapa</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {subActDisponibles.length === 0 && (
                <p className="text-sm text-[#4a6a84] text-center py-8">
                  Todas las actividades de esta etapa ya fueron registradas.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* PASO 2: Completar campos */
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => { setSubActSeleccionada(null); setResultadoModal(null); setCamposModal({}) }}
                className="p-1 rounded-lg text-[#4a6a84] hover:text-[#1b3a57] transition-colors"
              >
                <Icon name="arrow_back" size={16} />
              </button>
              <p className="text-sm font-bold text-[#1b3a57]">
                {subActSeleccionada.numero} {subActSeleccionada.nombre}
              </p>
            </div>

            {/* Resultado SI/NO */}
            {subActSeleccionada.tipo === 'SI_NO' && (
              <div className="mb-4">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Resultado</label>
                <div className="flex gap-2">
                  {(['SI', 'NO'] as ResultadoBinario[]).filter(Boolean).map(r => (
                    <button
                      key={r!}
                      onClick={() => setResultadoModal(r)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        resultadoModal === r
                          ? 'bg-[#1b3a57] border-[#1b3a57] text-white'
                          : 'border-[rgba(0,0,0,0.15)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Resultado ACUERDO */}
            {subActSeleccionada.tipo === 'ACUERDO' && (
              <div className="mb-4">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Resultado</label>
                <div className="flex gap-2">
                  {([
                    { val: 'HAY_ACUERDO', label: 'Hay Acuerdo' },
                    { val: 'NO_HAY_ACUERDO', label: 'No Hay Acuerdo' },
                  ] as { val: ResultadoAcuerdo; label: string }[]).map(r => (
                    <button
                      key={r.val!}
                      onClick={() => setResultadoModal(r.val)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        resultadoModal === r.val
                          ? 'bg-[#1b3a57] border-[#1b3a57] text-white'
                          : 'border-[rgba(0,0,0,0.15)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campos dinámicos */}
            {camposActualesModal.map(campo => (
              <div key={campo.id} className="mb-3">
                <CampoInput
                  campo={campo}
                  value={(camposModal[campo.id] as string) ?? ''}
                  onChange={val => setCamposModal(p => ({ ...p, [campo.id]: val }))}
                />
              </div>
            ))}

            {/* Estado y fecha */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Estado</label>
                <div className="flex gap-1">
                  {([
                    ['en_curso',      '⏱ En curso'],
                    ['cumplido',      '✓ Cumplido'],
                    ['no_procedente', '⊘ No proc.'],
                  ] as const).map(([val, lbl]) => (
                    <button
                      key={val}
                      onClick={() => setEstadoModal(val)}
                      className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                        estadoModal === val
                          ? val === 'cumplido'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : val === 'en_curso'
                            ? 'border-[#1b3a57] bg-[#f0f6ff] text-[#1b3a57]'
                            : 'border-[rgba(0,0,0,0.20)] bg-[#e8e8e8] text-[#4a6a84]'
                          : 'border-[rgba(0,0,0,0.12)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Fecha</label>
                <input
                  type="date"
                  className="field-input w-full text-xs"
                  value={fechaModal}
                  onChange={e => setFechaModal(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
