import { useState, useMemo } from 'react'
import type {
  Expediente,
  EstadoActividadPenal,
  ResultadoBinario,
  ResultadoAcuerdo,
  RegistroActividadPenal,
  SubActividadPenal,
  CampoPenal,
  EtapaPenal,
  TipoActividad,
} from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { useUIStore } from '../../../store/ui.store'
import { Modal } from '../../../components/ui/Modal'
import Icon from '../../../components/ui/Icon'
import { formatFecha } from '../../../utils/format'
import { getEtapasPenales, getEtapaPenal } from '../../../data/etapasPenales'
import { getNombreCompleto } from '../../../data/usuarios'
import { toast } from 'react-toastify'

interface Props { exp: Expediente }

const HOY = new Date().toISOString().split('T')[0]

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

const BLANK_ACT = {
  tipo: 'MOVIMIENTO' as TipoActividad,
  titulo: '',
  descripcion: '',
  fecha: HOY,
  doc_gde: '',
}

// ── Tipos del historial unificado ────────────────────

type EntradaHistorial =
  | { kind: 'sistema';  fecha: string; etapaAnteriorLabel: string; etapaNuevaLabel: string; descripcion: string; doc_gde?: string | null }
  | { kind: 'generica'; fecha: string; titulo: string; descripcion: string; tipo: string; doc_gde?: string | null }
  | { kind: 'procesal'; fecha: string; numero: string; nombre: string; estado: EstadoActividadPenal; etapaLabel: string; etapaCodigo: string; resultado: string | null }

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
    if (resultado === 'HAY_ACUERDO')    return sa.camposHayAcuerdo ?? []
    if (resultado === 'NO_HAY_ACUERDO') return sa.camposNoAcuerdo ?? []
  }
  return sa.camposLibres ?? []
}

// ── Stepper penal clickeable ──────────────────────────

function ProcesalStepperPenal({
  exp,
  onEtapaClick,
}: {
  exp: Expediente
  onEtapaClick: (etapa: EtapaPenal) => void
}) {
  const todos = getEtapasPenales(exp.tipo)
  const etapasBase = todos.filter(e => e.numero >= 1)
  const rechazado  = todos.find(e => e.codigo === 'RECHAZADO')
  // Insertar RECHAZADO entre ACEPTADO (idx 1) e INSTRUCCION (idx 2)
  const etapas = rechazado
    ? [...etapasBase.slice(0, 2), rechazado, ...etapasBase.slice(2)]
    : etapasBase

  const etapaCodigo = exp.estadoProcesal ?? 'EN_ANALISIS'
  const idxActual   = etapas.findIndex(e => e.codigo === etapaCodigo)

  if (etapas.length <= 1) return null

  return (
    <div className="bg-white rounded-2xl shadow-card px-8 py-4 mb-4 overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {etapas.map((etapa, idx) => {
          const isPast    = idx < idxActual
          const isCurrent = idx === idxActual
          const isLast    = idx === etapas.length - 1
          const isRechazado = etapa.codigo === 'RECHAZADO'
          const isClickable = !isCurrent

          return (
            <div key={etapa.codigo} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onEtapaClick(etapa)}
                  disabled={!isClickable}
                  title={isClickable ? `Ir a ${etapa.label}` : undefined}
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                    isClickable ? 'hover:ring-2 hover:ring-[#1b3a57]/30 cursor-pointer' : 'cursor-default',
                    isCurrent
                      ? 'bg-[#1b3a57] border-[#1b3a57] text-white shadow-md'
                      : isRechazado
                      ? 'bg-[#fee2e2] border-[#fca5a5] text-[#b91c1c]'
                      : isPast
                      ? 'bg-[rgba(27,58,87,0.20)] border-[rgba(27,58,87,0.40)] text-[#1b3a57]'
                      : 'bg-[#e8e8e8] border-[rgba(0,0,0,0.12)] text-[#4a6a84]',
                  ].join(' ')}
                >
                  {isPast && !isRechazado
                    ? <Icon name="check" size={14} />
                    : isRechazado
                    ? <Icon name="close" size={12} />
                    : <span className="text-[11px]">{idx + 1}</span>
                  }
                </button>
                <span className={[
                  'mt-1.5 text-[10px] font-semibold text-center whitespace-nowrap max-w-[72px] truncate',
                  isCurrent    ? 'text-[#1b3a57]'
                  : isRechazado ? 'text-[#b91c1c]'
                  : isPast     ? 'text-[rgba(27,58,87,0.70)]'
                  :              'text-[#4a6a84]',
                ].join(' ')}>
                  {etapa.label}
                </span>
              </div>
              {!isLast && (
                <div className="w-8 h-px mx-1 mb-4 relative">
                  <div className="absolute inset-0 bg-[rgba(0,0,0,0.08)] rounded-full" />
                  {isPast && !isRechazado && (
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

// ── Campo genérico de input ───────────────────────────

function CampoInput({
  campo,
  value,
  onChange,
}: {
  campo: CampoPenal
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className={campo.full ? 'col-span-2' : ''}>
      <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1">
        {campo.label}
      </label>
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
  const etapa  = etapas.find(e => e.codigo === etapaCodigo)
  const subAct = etapa?.subActividades.find(s => s.id === registro.subActividadId)

  const [draft, setDraft] = useState<Partial<RegistroActividadPenal>>({
    estado:       registro.estado,
    resultado:    registro.resultado,
    campos:       { ...registro.campos },
    fecha:        registro.fecha,
    observaciones: registro.observaciones,
  })

  const camposActivos    = subAct ? getCamposActivos(subAct, draft.resultado ?? registro.resultado) : []
  const mostrarAvisoFirme =
    subAct &&
    (draft.resultado ?? registro.resultado) === 'SI' &&
    (draft.campos?.sentencia_firme ?? registro.campos?.sentencia_firme) === 'SI' &&
    (subAct.finalizaCausa || subAct.avanzaEtapa)

  function setCampo(id: string, val: string | boolean) {
    setDraft(p => ({ ...p, campos: { ...(p.campos ?? registro.campos), [id]: val } }))
  }

  const estadoConfig: Record<EstadoActividadPenal, { label: string; activeClass: string }> = {
    en_curso:      { label: '⏱ En curso',  activeClass: 'border-[#1b3a57] bg-[#f0f6ff] text-[#1b3a57]' },
    cumplido:      { label: '✓ Cumplido',  activeClass: 'border-green-500 bg-green-50 text-green-700' },
    no_procedente: { label: '⊘ No proc.',  activeClass: 'border-[rgba(0,0,0,0.20)] bg-[#e8e8e8] text-[#4a6a84]' },
    sin_estado:    { label: 'Sin estado',  activeClass: 'border-[rgba(0,0,0,0.12)] text-[#4a6a84]' },
  }

  return (
    <div className="w-80 flex-shrink-0 sticky top-4 self-start">
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl overflow-hidden shadow-card">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[rgba(0,0,0,0.06)] bg-[#f0f0f0]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] mb-1">Detalle</p>
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
              {(['en_curso', 'cumplido', 'no_procedente'] as EstadoActividadPenal[]).map(val => (
                <button
                  key={val}
                  onClick={() => setDraft(p => ({ ...p, estado: val }))}
                  className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                    (draft.estado ?? registro.estado) === val
                      ? estadoConfig[val].activeClass
                      : 'border-[rgba(0,0,0,0.12)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {estadoConfig[val].label}
                </button>
              ))}
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
                  >{r}</button>
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
                  { val: 'HAY_ACUERDO' as ResultadoAcuerdo, label: 'Hay Acuerdo' },
                  { val: 'NO_HAY_ACUERDO' as ResultadoAcuerdo, label: 'No Hay Acuerdo' },
                ]).map(r => (
                  <button
                    key={r.val!}
                    onClick={() => setDraft(p => ({ ...p, resultado: r.val }))}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      (draft.resultado ?? registro.resultado) === r.val
                        ? 'bg-[#1b3a57] border-[#1b3a57] text-white'
                        : 'border-[rgba(0,0,0,0.15)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                    }`}
                  >{r.label}</button>
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

// ── Componente principal ──────────────────────────────

export function TimelinePenal({ exp }: Props) {
  const {
    registrosPenales, agregarRegistroPenal, actualizarRegistroPenal,
    agregarActividad, actualizarEstado, actualizarExpediente,
  } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  const registros = registrosPenales[exp.id] ?? []

  // Estado para registros procesales
  const [registroSeleccionado, setRegistroSeleccionado] = useState<RegistroActividadPenal | null>(null)
  const [subActSeleccionada,   setSubActSeleccionada]   = useState<SubActividadPenal | null>(null)
  const [resultadoModal,       setResultadoModal]       = useState<ResultadoBinario | ResultadoAcuerdo>(null)
  const [camposModal,          setCamposModal]           = useState<Record<string, string | boolean>>({})
  const [estadoModal,          setEstadoModal]           = useState<EstadoActividadPenal>('en_curso')
  const [fechaModal,           setFechaModal]            = useState(HOY)

  // Estado para cambio de etapa desde stepper
  const [modalCambiarEstado, setModalCambiarEstado] = useState(false)
  const [etapaDestino,       setEtapaDestino]       = useState<EtapaPenal | null>(null)

  // Estado para modal dual (procesales + genéricas)
  const [modalNueva, setModalNueva] = useState(false)
  const [tabNueva,   setTabNueva]   = useState<'procesales' | 'genericas'>('procesales')
  const [formAct,    setFormAct]    = useState(BLANK_ACT)

  // Estado para modal de detalle de actividad procesal
  const [modalDetalle, setModalDetalle] = useState(false)

  // Datos de la etapa actual
  const etapaCodigo = exp.estadoProcesal ?? 'EN_ANALISIS'
  const etapaActual = getEtapaPenal(exp.tipo, etapaCodigo)

  const subActDisponibles = etapaActual?.subActividades.filter(
    sa => !registros.some(r => r.subActividadId === sa.id && r.etapaCodigo === etapaCodigo)
  ) ?? []

  // ── Helpers de reset ───────────────────────────────

  function resetProcesales() {
    setSubActSeleccionada(null)
    setResultadoModal(null)
    setCamposModal({})
    setEstadoModal('en_curso')
    setFechaModal(HOY)
  }

  function closeModalNueva() {
    setModalNueva(false)
    resetProcesales()
    setFormAct(BLANK_ACT)
  }

  // ── Acción: registrar actividad procesal ────────────

  function confirmarRegistro() {
    if (!subActSeleccionada) return
    const nuevoRegistro: RegistroActividadPenal = {
      id:            `${exp.id}_${subActSeleccionada.id}_${Date.now()}`,
      subActividadId: subActSeleccionada.id,
      numero:        subActSeleccionada.numero,
      nombre:        subActSeleccionada.nombre,
      estado:        estadoModal,
      resultado:     resultadoModal,
      fecha:         fechaModal,
      campos:        camposModal,
      etapaCodigo,
    }
    agregarRegistroPenal(exp.id, nuevoRegistro)
    toast.success(`Actividad "${subActSeleccionada.nombre}" registrada.`)
    closeModalNueva()
  }

  // ── Acción: guardar actividad genérica ──────────────

  function guardarActividadGenerica() {
    if (!formAct.titulo.trim()) return
    agregarActividad(exp.id, {
      id:            `ACT_${Date.now()}`,
      expediente_id: exp.id,
      tipo:          formAct.tipo,
      titulo:        formAct.titulo,
      descripcion:   formAct.descripcion,
      fecha:         formAct.fecha,
      activo:        true,
      subitems:      [],
      doc_gde:       formAct.doc_gde.trim() || null,
      tareasSnapshot: [],
    })
    toast.success('Actividad registrada.')
    closeModalNueva()
  }

  // ── Acción: cambiar estado desde stepper ────────────

  function handleEtapaClick(etapa: EtapaPenal) {
    setEtapaDestino(etapa)
    setModalCambiarEstado(true)
  }

  function confirmarCambioEstado() {
    if (!etapaDestino) return
    const nombre = usuarioActivo ? getNombreCompleto(usuarioActivo) : 'Usuario'
    agregarActividad(exp.id, {
      id:            `ACT_${Date.now()}`,
      expediente_id: exp.id,
      tipo:          'MOVIMIENTO',
      titulo:        `Cambio de estado: ${etapaActual?.label ?? etapaCodigo} → ${etapaDestino.label}`,
      descripcion:   `Estado modificado por ${nombre}.`,
      fecha:         HOY,
      activo:        true,
      subitems:      [],
      estadoExpediente:  etapaDestino.codigo,
      etapaAnteriorLabel: etapaActual?.label ?? etapaCodigo,
      etapaNuevaLabel:    etapaDestino.label,
      doc_gde:       null,
      tareasSnapshot: [],
    })
    actualizarEstado(exp.id, etapaDestino.codigo)
    actualizarExpediente(exp.id, { estadoProcesal: etapaDestino.codigo })
    toast.success(`Estado cambiado a ${etapaDestino.label}.`)
    setModalCambiarEstado(false)
    setEtapaDestino(null)
    // Limpiar registro seleccionado si no pertenece a la nueva etapa
    setRegistroSeleccionado(null)
  }

  // ── Campos del modal procesal según resultado ───────

  const camposActualesModal = subActSeleccionada
    ? getCamposActivos(subActSeleccionada, resultadoModal)
    : []

  // ── Historial unificado ──────────────────────────────

  const [filtroHistorial, setFiltroHistorial] =
    useState<'todo' | 'sistema' | 'procesales' | 'genericas'>('todo')
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [estadosExpandidos, setEstadosExpandidos] = useState<Set<number>>(new Set())

  function toggleGrupo(idx: number) {
    setEstadosExpandidos(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const historialCompleto = useMemo((): EntradaHistorial[] => {
    type EntradaConIdx = EntradaHistorial & { _idx: number }
    const entradas: EntradaConIdx[] = []

    exp.timeline.forEach(act => {
      const esSistema =
        act.tipo === 'MOVIMIENTO' && act.titulo.startsWith('Cambio de estado')
      if (esSistema) {
        const parts = act.titulo.replace('Cambio de estado: ', '').split(' → ')
        entradas.push({
          kind: 'sistema',
          fecha: act.fecha,
          etapaAnteriorLabel: act.etapaAnteriorLabel ?? parts[0] ?? '',
          etapaNuevaLabel:    act.etapaNuevaLabel    ?? parts[1] ?? '',
          descripcion: act.descripcion ?? '',
          doc_gde: act.doc_gde,
          _idx: entradas.length,
        })
      } else {
        entradas.push({ kind: 'generica', fecha: act.fecha, titulo: act.titulo, descripcion: act.descripcion ?? '', tipo: act.tipo, doc_gde: act.doc_gde, _idx: entradas.length })
      }
    })

    registros.forEach(r => {
      const etapa = getEtapaPenal(exp.tipo, r.etapaCodigo)
      entradas.push({
        kind: 'procesal',
        fecha: r.fecha,
        numero: r.numero,
        nombre: r.nombre,
        estado: r.estado,
        etapaLabel: etapa?.label ?? r.etapaCodigo,
        etapaCodigo: r.etapaCodigo,
        resultado: r.resultado as string | null,
        _idx: entradas.length,
      })
    })

    return entradas.sort((a, b) => {
      const diff = b.fecha.localeCompare(a.fecha)
      if (diff !== 0) return diff
      // En misma fecha: sistema siempre antes que procesal/generica
      const aSistema = a.kind === 'sistema' ? 0 : 1
      const bSistema = b.kind === 'sistema' ? 0 : 1
      return aSistema - bSistema
    }) as EntradaHistorial[]
  }, [exp.timeline, registros, exp.tipo])

  const historialFiltrado = useMemo(() => {
    return historialCompleto.filter(e => {
      if (filtroHistorial !== 'todo') {
        const kindMap = { sistema: 'sistema', procesales: 'procesal', genericas: 'generica' } as const
        if (e.kind !== kindMap[filtroHistorial]) return false
      }
      if (busquedaHistorial.trim()) {
        const q = busquedaHistorial.toLowerCase()
        const titulo = e.kind === 'procesal'
          ? e.nombre
          : e.kind === 'generica'
          ? e.titulo
          : `${e.etapaAnteriorLabel} → ${e.etapaNuevaLabel}`
        const descripcion = e.kind === 'generica' ? e.descripcion : ''
        if (!`${titulo} ${descripcion}`.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [historialCompleto, filtroHistorial, busquedaHistorial])

  const gruposHistorial = useMemo(() => {
    const entradaRecepcion = historialFiltrado.find(
      e => e.kind === 'sistema' &&
           (e.etapaNuevaLabel?.toLowerCase().includes('recib') ||
            e.etapaNuevaLabel?.toLowerCase().includes('asignado') ||
            e.etapaAnteriorLabel?.toLowerCase().includes('recib') ||
            e.etapaAnteriorLabel?.toLowerCase().includes('asignado'))
    )

    const sinRecepcion = historialFiltrado.filter(e => e !== entradaRecepcion)

    const sistemasIdx = sinRecepcion
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.kind === 'sistema')
      .map(({ i }) => i)

    if (sistemasIdx.length === 0) {
      return {
        grupos: [],
        actividadesActuales: sinRecepcion.filter(e => e.kind !== 'sistema'),
        entradaRecepcion,
      }
    }

    // Orden descendente: sistema[gi+1] es el más antiguo (índice mayor)
    const grupos = sistemasIdx.map((si, gi) => {
      const sistema = sinRecepcion[si]
      const idxNext = gi < sistemasIdx.length - 1
        ? sistemasIdx[gi + 1]
        : sinRecepcion.length
      const actividades = sinRecepcion
        .slice(si + 1, idxNext)
        .filter(e => e.kind !== 'sistema')
      return { sistema, actividades }
    })

    const actividadesActuales = sinRecepcion
      .slice(0, sistemasIdx[0])
      .filter(e => e.kind !== 'sistema')

    return {
      grupos,
      actividadesActuales,
      entradaRecepcion,
    }
  }, [historialFiltrado])

  const countSistema    = historialCompleto.filter(e => e.kind === 'sistema').length
  const countProcesales = historialCompleto.filter(e => e.kind === 'procesal').length
  const countGenericas  = historialCompleto.filter(e => e.kind === 'generica').length

  // ── Render de una entrada individual ────────────────

  function renderEntrada(entrada: EntradaHistorial) {
    if (entrada.kind === 'sistema') {
      return (
        <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#f9f9f9] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-[#C4DFE8] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="swap_horiz" size={16} className="text-[#1b3a57]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1b3a57] mb-0.5">
              {entrada.etapaAnteriorLabel} → {entrada.etapaNuevaLabel}
            </p>
            {entrada.descripcion && <p className="text-xs text-[#4a6a84]">{entrada.descripcion}</p>}
            {entrada.doc_gde && (
              <p className="text-[10px] font-mono text-[#1b3a57] mt-1 flex items-center gap-1">
                <Icon name="attach_file" size={12} />{entrada.doc_gde}
              </p>
            )}
          </div>
          <span className="text-[11px] text-[#7a9ab4] flex-shrink-0 mt-0.5">{formatFecha(entrada.fecha)}</span>
        </div>
      )
    }
    if (entrada.kind === 'generica') {
      return (
        <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#f9f9f9] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-[#e8e8e8] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="description" size={16} className="text-[#4a6a84]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1b3a57] mb-0.5">{entrada.titulo}</p>
            {entrada.descripcion && <p className="text-xs text-[#4a6a84]">{entrada.descripcion}</p>}
            {entrada.doc_gde && (
              <p className="text-[10px] font-mono text-[#1b3a57] mt-1 flex items-center gap-1">
                <Icon name="attach_file" size={12} />{entrada.doc_gde}
              </p>
            )}
          </div>
          <span className="text-[11px] text-[#7a9ab4] flex-shrink-0 mt-0.5">{formatFecha(entrada.fecha)}</span>
        </div>
      )
    }
    // procesal
    return (
      <div
        onClick={() => {
          const reg = registros.find(r => r.numero === entrada.numero && r.etapaCodigo === entrada.etapaCodigo)
          if (reg) { setRegistroSeleccionado(reg); setModalDetalle(true) }
        }}
        className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#f9f9f9] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[rgba(27,58,87,0.08)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name="gavel" size={16} className="text-[#1b3a57]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-[#1b3a57]">{entrada.numero} {entrada.nombre}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(27,58,87,0.08)] text-[#1b3a57]">
              {entrada.etapaLabel}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              entrada.estado === 'cumplido'        ? 'bg-green-100 text-green-700'
              : entrada.estado === 'en_curso'      ? 'bg-[#C4DFE8] text-[#1b3a57]'
              : entrada.estado === 'no_procedente' ? 'bg-[#e8e8e8] text-[#4a6a84]'
              : 'bg-[#f5f5f5] text-[#7a9ab4]'
            }`}>
              {entrada.estado === 'cumplido' ? 'Cumplido'
                : entrada.estado === 'en_curso' ? 'En curso'
                : entrada.estado === 'no_procedente' ? 'No proc.'
                : 'Sin estado'}
            </span>
          </div>
          {entrada.resultado && <p className="text-xs text-[#4a6a84]">Resultado: {entrada.resultado}</p>}
        </div>
        <span className="text-[11px] text-[#7a9ab4] flex-shrink-0 mt-0.5">{formatFecha(entrada.fecha)}</span>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Stepper clickeable */}
      <ProcesalStepperPenal exp={exp} onEtapaClick={handleEtapaClick} />

      {/* Card principal — feed unificado */}
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.10)] overflow-hidden">

        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-[#1b3a57]">Ciclo de Vida — Actividades</p>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[rgba(27,58,87,0.08)] text-[#1b3a57]">
              {historialCompleto.length} registros
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tabs de filtro */}
            <div className="flex gap-0.5 bg-[#f5f5f5] rounded-lg p-0.5">
              {([
                ['todo',       'Todo',       null],
                ['sistema',    'Sistema',    countSistema],
                ['procesales', 'Procesales', countProcesales],
                ['genericas',  'Genéricas',  countGenericas],
              ] as const).map(([val, lbl, count]) => (
                <button
                  key={val}
                  onClick={() => setFiltroHistorial(val)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    filtroHistorial === val
                      ? 'bg-white text-[#1b3a57] shadow-sm'
                      : 'text-[#4a6a84] hover:text-[#1b3a57]'
                  }`}
                >
                  {lbl}
                  {count !== null && count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      filtroHistorial === val
                        ? 'bg-[rgba(27,58,87,0.10)] text-[#1b3a57]'
                        : 'bg-[#e8e8e8] text-[#4a6a84]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {/* Botón Nueva Actividad */}
            <button
              onClick={() => { setTabNueva('procesales'); setModalNueva(true) }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1b3a57] text-white rounded-xl text-xs font-bold hover:bg-[#2a5278] transition-colors"
            >
              <Icon name="add" size={14} />
              Nueva Actividad
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="px-5 py-3 border-b border-[rgba(0,0,0,0.06)]">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7a9ab4]">
              <Icon name="search" size={14} />
            </div>
            <input
              type="text"
              placeholder="Buscar actividad..."
              value={busquedaHistorial}
              onChange={e => setBusquedaHistorial(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg bg-[#f9f9f9] text-[#1b3a57] placeholder-[#7a9ab4] focus:outline-none focus:border-[#1b3a57]"
            />
            {busquedaHistorial && (
              <button
                onClick={() => setBusquedaHistorial('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7a9ab4] hover:text-[#1b3a57]"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Estado ASIGNADO */}
        {etapaCodigo === 'ASIGNADO' && (
          <div className="px-5 py-10 text-center">
            <Icon name="inbox" size={32} className="text-[#7a9ab4] mx-auto mb-3 block" />
            <p className="text-sm font-semibold text-[#1b3a57] mb-1">Actuación pendiente de inicio</p>
            <p className="text-xs text-[#4a6a84]">
              Usá <strong>Acciones → Cambiar estado</strong> para comenzar.
            </p>
          </div>
        )}

        {/* Feed unificado con agrupación colapsable */}
        {etapaCodigo !== 'ASIGNADO' && (
          historialFiltrado.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Icon name="history" size={28} className="text-[#7a9ab4] mx-auto mb-2 block" />
              <p className="text-sm text-[#4a6a84]">No hay entradas que coincidan.</p>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.05)]">

              {/* A) Actividades del período actual (sin grupo) */}
              {gruposHistorial.actividadesActuales.map((entrada, ei) => (
                <div key={`actual-${ei}`} className="border-b border-[rgba(0,0,0,0.05)] last:border-0">
                  {renderEntrada(entrada)}
                </div>
              ))}

              {/* B) Grupos colapsables por cambio de estado */}
              {gruposHistorial.grupos.map((grupo, gi) => (
                <div key={`grupo-${gi}`} className="border-b border-[rgba(0,0,0,0.05)]">

                  {/* Cabecera colapsable */}
                  <div
                    onClick={() => toggleGrupo(gi)}
                    className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#f9f9f9] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#C4DFE8] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon
                        name={estadosExpandidos.has(gi) ? 'expand_less' : 'expand_more'}
                        size={16} className="text-[#1b3a57]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon name="swap_horiz" size={14} className="text-[#1b7a8a] flex-shrink-0" />
                        <p className="text-sm font-semibold text-[#1b3a57] truncate">
                          {grupo.sistema.etapaAnteriorLabel} → {grupo.sistema.etapaNuevaLabel}
                        </p>
                      </div>
                      {grupo.sistema.descripcion && (
                        <p className="text-xs text-[#4a6a84]">{grupo.sistema.descripcion}</p>
                      )}
                      {grupo.actividades.length > 0 && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-[#4a6a84] bg-[#e8e8e8] px-2 py-0.5 rounded-full">
                          <Icon name="history" size={11} />
                          {grupo.actividades.length}{grupo.actividades.length === 1 ? ' registro' : ' registros'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#7a9ab4] flex-shrink-0 mt-0.5">
                      {formatFecha(grupo.sistema.fecha)}
                    </span>
                  </div>

                  {/* Actividades del período — colapsables */}
                  {estadosExpandidos.has(gi) && (
                    <div className="bg-[#fafafa] border-t border-[rgba(0,0,0,0.04)]">
                      {grupo.actividades.length === 0 ? (
                        <p className="px-16 py-3 text-xs text-[#7a9ab4] italic">Sin registros en este período.</p>
                      ) : (
                        grupo.actividades.map((entrada, ai) => (
                          <div key={`act-${gi}-${ai}`} className="ml-10 border-b border-[rgba(0,0,0,0.04)] last:border-0">
                            {renderEntrada(entrada)}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* C) Entrada de recepción — siempre al final */}
              {gruposHistorial.entradaRecepcion && (
                <div className="border-t border-[rgba(0,0,0,0.05)]">
                  {renderEntrada(gruposHistorial.entradaRecepcion)}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* ── Modal: Detalle actividad procesal ── */}
      <Modal
        open={modalDetalle}
        onClose={() => { setModalDetalle(false); setRegistroSeleccionado(null) }}
        titulo={registroSeleccionado ? `${registroSeleccionado.numero} ${registroSeleccionado.nombre}` : ''}
        size="md"
        footer={null}
      >
        {registroSeleccionado && (
          <PanelDetalleRegistro
            registro={registroSeleccionado}
            exp={exp}
            etapaCodigo={registroSeleccionado.etapaCodigo}
            onGuardar={(cambios) => {
              actualizarRegistroPenal(exp.id, registroSeleccionado.id, cambios)
              toast.success('Actividad actualizada.')
              setModalDetalle(false)
              setRegistroSeleccionado(null)
            }}
            onCancelar={() => { setModalDetalle(false); setRegistroSeleccionado(null) }}
          />
        )}
      </Modal>

      {/* ── Modal: Cambiar estado desde stepper ── */}
      <Modal
        open={modalCambiarEstado}
        onClose={() => { setModalCambiarEstado(false); setEtapaDestino(null) }}
        titulo="Cambiar estado de la actuación"
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setModalCambiarEstado(false); setEtapaDestino(null) }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarCambioEstado}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 transition-opacity"
            >
              Confirmar
            </button>
          </>
        }
      >
        <div className="py-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-sm font-bold text-[#1b3a57] px-3 py-1.5 bg-[#e8e8e8] rounded-lg">
              {etapaActual?.label ?? etapaCodigo}
            </span>
            <Icon name="arrow_forward" size={16} className="text-[#4a6a84]" />
            <span className="text-sm font-bold text-white px-3 py-1.5 bg-[#1b3a57] rounded-lg">
              {etapaDestino?.label}
            </span>
          </div>
          {etapaDestino?.codigo === 'RECHAZADO' && (
            <div className="bg-[#fee2e2] border border-[#fca5a5] rounded-xl p-3 mb-3">
              <p className="text-xs text-[#991b1b] font-semibold flex items-center gap-2">
                <Icon name="warning" size={14} />
                Esta acción marca la querella como rechazada.
              </p>
            </div>
          )}
          <p className="text-xs text-[#4a6a84] text-center">
            Esta acción quedará registrada en el timeline.
          </p>
        </div>
      </Modal>

      {/* ── Modal dual: Nueva Actividad ── */}
      <Modal
        open={modalNueva}
        onClose={closeModalNueva}
        titulo="Nueva Actividad"
        size="lg"
        footer={
          tabNueva === 'procesales' ? (
            <>
              <button
                onClick={() => {
                  if (subActSeleccionada) {
                    setSubActSeleccionada(null)
                    setResultadoModal(null)
                    setCamposModal({})
                  } else {
                    closeModalNueva()
                  }
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
              >
                {subActSeleccionada ? 'Volver' : 'Cancelar'}
              </button>
              <button
                onClick={confirmarRegistro}
                disabled={!subActSeleccionada}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Registrar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={closeModalNueva}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarActividadGenerica}
                disabled={!formAct.titulo.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Guardar
              </button>
            </>
          )
        }
      >
        {/* Solapas */}
        <div className="flex gap-0 border-b border-[rgba(0,0,0,0.08)] mb-4 -mx-6 px-6">
          <button
            onClick={() => { setTabNueva('procesales'); setSubActSeleccionada(null); setResultadoModal(null); setCamposModal({}) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tabNueva === 'procesales'
                ? 'border-[#1b3a57] text-[#1b3a57] font-bold'
                : 'border-transparent text-[#4a6a84] hover:text-[#1b3a57]'
            }`}
          >
            Actividades Procesales
          </button>
          <button
            onClick={() => { setTabNueva('genericas'); setFormAct(BLANK_ACT) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tabNueva === 'genericas'
                ? 'border-[#1b3a57] text-[#1b3a57] font-bold'
                : 'border-transparent text-[#4a6a84] hover:text-[#1b3a57]'
            }`}
          >
            Actividades Genéricas
          </button>
        </div>

        {/* ── Tab: Procesales ── */}
        {tabNueva === 'procesales' && (
          !subActSeleccionada ? (
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
                      {sa.finalizaCausa && <Icon name="warning"       size={14} className="text-[#d97706] mt-0.5 flex-shrink-0" />}
                      {sa.avanzaEtapa  && <Icon name="arrow_forward"  size={14} className="text-[#1b3a57] mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-semibold text-[#1b3a57]">{sa.numero} {sa.nombre}</p>
                        {sa.finalizaCausa && <p className="text-[10px] text-[#d97706] mt-0.5">Si queda firme → finaliza la causa</p>}
                        {sa.avanzaEtapa  && <p className="text-[10px] text-[#1b3a57] mt-0.5">Si queda firme → avanza a siguiente etapa</p>}
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
                      >{r}</button>
                    ))}
                  </div>
                </div>
              )}

              {subActSeleccionada.tipo === 'ACUERDO' && (
                <div className="mb-4">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#4a6a84] block mb-1.5">Resultado</label>
                  <div className="flex gap-2">
                    {([
                      { val: 'HAY_ACUERDO' as ResultadoAcuerdo,    label: 'Hay Acuerdo' },
                      { val: 'NO_HAY_ACUERDO' as ResultadoAcuerdo, label: 'No Hay Acuerdo' },
                    ]).map(r => (
                      <button
                        key={r.val!}
                        onClick={() => setResultadoModal(r.val)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                          resultadoModal === r.val
                            ? 'bg-[#1b3a57] border-[#1b3a57] text-white'
                            : 'border-[rgba(0,0,0,0.15)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                        }`}
                      >{r.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {camposActualesModal.map(campo => (
                <div key={campo.id} className="mb-3">
                  <CampoInput
                    campo={campo}
                    value={(camposModal[campo.id] as string) ?? ''}
                    onChange={val => setCamposModal(p => ({ ...p, [campo.id]: val }))}
                  />
                </div>
              ))}

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
                      >{lbl}</button>
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
          )
        )}

        {/* ── Tab: Genéricas ── */}
        {tabNueva === 'genericas' && (
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
              <label className="field-label">Título <span className="text-[#b91c1c]">*</span></label>
              <input
                type="text"
                className="field-input w-full"
                placeholder="Descripción breve de la actividad"
                value={formAct.titulo}
                onChange={e => setFormAct(p => ({ ...p, titulo: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="field-label">Descripción</label>
              <textarea
                className="field-input resize-none w-full"
                style={{ minHeight: 80 }}
                placeholder="Detalle de la actividad..."
                value={formAct.descripcion}
                onChange={e => setFormAct(p => ({ ...p, descripcion: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <label className="field-label">N° Documento GDE</label>
                <input
                  type="text"
                  className="field-input w-full font-mono text-xs"
                  placeholder="EX-2026-..."
                  value={formAct.doc_gde}
                  onChange={e => setFormAct(p => ({ ...p, doc_gde: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
