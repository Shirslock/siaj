import { useState, useMemo, useEffect } from 'react'
import type {
  Expediente,
  Actividad,
  EstadoActividadPenal,
  ResultadoBinario,
  ResultadoAcuerdo,
  RegistroActividadPenal,
  SubActividadPenal,
  CampoPenal,
  EtapaPenal,
  TipoActividad,
  Reply,
} from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { useUIStore } from '../../../store/ui.store'
import { Modal } from '../../../components/ui/Modal'
import Icon from '../../../components/ui/Icon'
import { formatFecha } from '../../../utils/format'
import { getEtapasPenales, getEtapaPenal } from '../../../data/etapasPenales'
import { getNombreCompleto, getUsuarioById } from '../../../data/usuarios'
import { toast } from 'react-toastify'
import { validarAdjuntos } from '../../../utils/validarAdjuntos'
import { AdjuntosInput } from '../../../components/ui/AdjuntosInput'
import { StepperPRD, type PasoStepper } from '../../../components/timeline/StepperPRD'
import { EtapasAcordeon, type EtapaTL } from '../../../components/timeline/EtapasAcordeon'
import { actividadesToFilas, exportarExcel, exportarPDF } from '../../../utils/exportTimeline'
import { useSolicitudesStore, PERSONAS_POR_AREA } from '../../../store/tareas.store'
import { SolicitudForm, BLANK_SOLICITUD } from '../../../components/SolicitudForm'
import { TIPO_ACTIVIDAD_SOLICITUD_PENAL, getConfigPorTipoActividad, solicitudEstaCompleta } from '../../../data/solicitudesPenales'

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
  // Delta 6B — mismas 2 actividades simples que en Civil/Laboral
  { value: 'RECURSO_INCIDENTE', label: 'Interposición de Recurso' },
  { value: 'DILIGENCIAMIENTO',  label: 'Diligenciamiento' },
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
  | { kind: 'sistema';  fecha: string; etapaAnteriorLabel: string; etapaNuevaLabel: string; descripcion: string; doc_gde?: string | null; por?: string }
  | { kind: 'generica'; fecha: string; titulo: string; descripcion: string; tipo: string; doc_gde?: string | null; timelineIdx: number; act: Actividad }
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

  const pasos: PasoStepper[] = etapas.map((etapa, idx) => ({
    key: etapa.codigo,
    label: etapa.label,
    estado: idx === idxActual
      ? 'current'
      : etapa.codigo === 'RECHAZADO'
        ? 'rejected'
        : idx < idxActual ? 'done' : 'pending',
    onClick: () => onEtapaClick(etapa),
  }))

  return <StepperPRD pasos={pasos} pendienteDeInicio={etapaCodigo === 'ASIGNADO'} />
}

// ── Campo de archivos (múltiples) de un hito penal ────
// El valor del campo es la lista de nombres separados por salto de línea.

function CampoUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Nombres ya guardados al abrir el campo (edición de un hito cargado antes).
  const [previos] = useState<string[]>(() => (value ? value.split('\n').filter(Boolean) : []))
  const [nuevos, setNuevos] = useState<File[]>([])
  function cambiar(files: File[]) {
    setNuevos(files)
    onChange([...previos, ...files.map(f => f.name)].join('\n'))
  }
  return (
    <div className="space-y-1.5">
      {previos.map((n, i) => (
        <div key={`${n}-${i}`} className="flex items-center gap-2 text-[11px] text-gray-500">
          <Icon name="attach_file" size={13} />
          <span className="truncate">{n}</span>
        </div>
      ))}
      <AdjuntosInput archivos={nuevos} onChange={cambiar} compacto />
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
      <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1">
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
        <CampoUpload value={value} onChange={onChange} />
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
    en_curso:      { label: '⏱ En curso',  activeClass: 'border-blue-700 bg-blue-50 text-gray-800' },
    cumplido:      { label: '✓ Cumplido',  activeClass: 'border-green-500 bg-green-50 text-green-700' },
    no_procedente: { label: '⊘ No proc.',  activeClass: 'border-gray-300 bg-gray-100 text-gray-500' },
    sin_estado:    { label: 'Sin estado',  activeClass: 'border-gray-200 text-gray-500' },
  }

  return (
    <div className="w-80 flex-shrink-0 sticky top-4 self-start">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-card">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Detalle</p>
              <p className="text-sm font-semibold text-gray-800 leading-snug">
                {registro.numero} {registro.nombre}
              </p>
            </div>
            <button onClick={onCancelar} className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0">
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3 max-h-[60vh] overflow-y-auto">

          {/* Estado */}
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Estado</label>
            <div className="flex gap-1.5">
              {(['en_curso', 'cumplido', 'no_procedente'] as EstadoActividadPenal[]).map(val => (
                <button
                  key={val}
                  onClick={() => setDraft(p => ({ ...p, estado: val }))}
                  className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                    (draft.estado ?? registro.estado) === val
                      ? estadoConfig[val].activeClass
                      : 'border-gray-200 text-gray-500 hover:bg-gray-100'
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
              <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Resultado</label>
              <div className="flex gap-2">
                {(['SI', 'NO'] as ResultadoBinario[]).filter(Boolean).map(r => (
                  <button
                    key={r!}
                    onClick={() => setDraft(p => ({ ...p, resultado: r }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      (draft.resultado ?? registro.resultado) === r
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                    }`}
                  >{r}</button>
                ))}
              </div>
            </div>
          )}

          {/* Resultado ACUERDO */}
          {subAct?.tipo === 'ACUERDO' && (
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Resultado</label>
              <div className="flex gap-2">
                {([
                  { val: 'HAY_ACUERDO' as ResultadoAcuerdo, label: 'Hay Acuerdo' },
                  { val: 'NO_HAY_ACUERDO' as ResultadoAcuerdo, label: 'No Hay Acuerdo' },
                ]).map(r => (
                  <button
                    key={r.val!}
                    onClick={() => setDraft(p => ({ ...p, resultado: r.val }))}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                      (draft.resultado ?? registro.resultado) === r.val
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-100'
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
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
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
            <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Observaciones</label>
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
            <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Fecha</label>
            <input
              type="date"
              className="field-input w-full text-xs"
              value={draft.fecha ?? registro.fecha}
              onChange={e => setDraft(p => ({ ...p, fecha: e.target.value }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex gap-2 justify-end border-t border-gray-200 pt-3">
          <button onClick={onCancelar} className="px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => onGuardar(draft)}
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

// ── Componente principal ──────────────────────────────

export function TimelinePenal({ exp }: Props) {
  const {
    registrosPenales, agregarRegistroPenal, actualizarRegistroPenal,
    agregarActividad, actualizarEstado, actualizarExpediente,
    agregarDocumento, editarActividad, eliminarActividad, agregarReply,
  } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const { agregarSolicitud } = useSolicitudesStore()
  // ⚠️ MODO DEMO TEMPORAL — cualquier rol puede Comentar/Editar/Eliminar
  // para facilitar pruebas. Regla real (revertir después de la demo):
  //   usuarioActivo?.id === exp.abogado_id
  //   || usuarioActivo?.rolSistema === 'COORDINADOR'
  const esLetrado = true

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

  // Estado para modal dual (procesales + genéricas + solicitud)
  const [modalNueva,     setModalNueva]     = useState(false)
  const [tabNueva,       setTabNueva]       = useState<'procesales' | 'genericas' | 'solicitud'>('procesales')
  const [formAct,        setFormAct]        = useState(BLANK_ACT)
  const [formSolicitud,  setFormSolicitud]  = useState(BLANK_SOLICITUD)
  const [camposSolPenal,   setCamposSolPenal]   = useState<Record<string, string>>({})
  const [archivosSolPenal, setArchivosSolPenal] = useState<Record<string, string[]>>({})
  const [actividadEditando, setActividadEditando] = useState<{ act: Actividad; globalIdx: number } | null>(null)
  const [replyTarget, setReplyTarget] = useState<{ act: Actividad; globalIdx: number } | null>(null)
  const [formReply, setFormReply] = useState({ texto: '', doc_gde: '', fecha: HOY, fecha_vencimiento: '', fecha_aviso: '' })
  const [menuActividad, setMenuActividad] = useState<{ act: Actividad; globalIdx: number; x: number; y: number } | null>(null)

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
    setTabNueva('procesales')
    setFormSolicitud(BLANK_SOLICITUD)
    setCamposSolPenal({})
    setArchivosSolPenal({})
    setActividadEditando(null)
  }

  function guardarSolicitudPenal() {
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
    closeModalNueva()
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

    const config = getConfigPorTipoActividad(formAct.tipo)
    const datosExtra = config ? {
      solicitud_penal_campos:   camposSolPenal,
      solicitud_penal_archivos: archivosSolPenal,
    } : {}

    if (actividadEditando) {
      editarActividad(
        exp.id,
        actividadEditando.globalIdx,
        {
          titulo:      formAct.titulo,
          descripcion: formAct.descripcion,
          fecha:       formAct.fecha,
          doc_gde:     formAct.doc_gde.trim() || null,
          ...datosExtra,
        },
        usuarioActivo?.id ?? '',
      )
      toast.success('Solicitud actualizada.')
    } else {
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
        ...datosExtra,
      })
      toast.success('Actividad registrada.')
    }
    closeModalNueva()
  }

  function abrirEdicionActividad(act: Actividad, globalIdx: number) {
    setActividadEditando({ act, globalIdx })
    setFormAct({
      tipo:        act.tipo,
      titulo:      act.titulo,
      descripcion: act.descripcion ?? '',
      fecha:       act.fecha,
      doc_gde:     act.doc_gde ?? '',
    })
    // Solo cargar campos de solicitud penal si el tipo corresponde
    const config = getConfigPorTipoActividad(act.tipo)
    setCamposSolPenal(config ? (act.solicitud_penal_campos ?? {}) : {})
    setArchivosSolPenal(config ? (act.solicitud_penal_archivos ?? {}) : {})
    setTabNueva('genericas')
    setModalNueva(true)
  }

  function confirmarReply() {
    if (!replyTarget || !formReply.texto.trim()) return
    agregarReply(exp.id, replyTarget.globalIdx, {
      autor_id:          usuarioActivo?.id ?? '',
      texto:             formReply.texto.trim(),
      fecha:             formReply.fecha,
      doc_gde:           formReply.doc_gde || undefined,
      fecha_vencimiento: formReply.fecha_vencimiento || undefined,
      fecha_aviso:       formReply.fecha_aviso || undefined,
    })
    setFormReply({ texto: '', doc_gde: '', fecha: HOY, fecha_vencimiento: '', fecha_aviso: '' })
    setReplyTarget(null)
    toast.success('Comentario agregado.')
  }

  function confirmarEliminacion(globalIdx: number) {
    if (!confirm('¿Eliminás esta actividad? Quedará un registro de auditoría.')) return
    eliminarActividad(exp.id, globalIdx, usuarioActivo?.id ?? '')
    toast.success('Actividad eliminada. Registro de auditoría generado.')
  }

  function esMovimientoSistema(act: Actividad): boolean {
    return act.tipo === 'MOVIMIENTO' && !!act.estadoExpediente &&
      (act.titulo.startsWith('Cambio de estado') || act.titulo.startsWith('Retroceso de estado'))
  }

  useEffect(() => {
    if (!menuActividad) return
    const handler = () => setMenuActividad(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuActividad])

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
      creado_por:    usuarioActivo?.id,
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
  const [menuExport, setMenuExport] = useState(false)

  // helper para mostrar quién hizo un cambio de estado
  function nombreDe(id?: string) {
    const u = id ? getUsuarioById(id) : undefined
    return u ? getNombreCompleto(u) : undefined
  }

  const historialCompleto = useMemo((): EntradaHistorial[] => {
    type EntradaConIdx = EntradaHistorial & { _idx: number }
    const entradas: EntradaConIdx[] = []

    exp.timeline.forEach((act, timelineIdx) => {
      if (act.eliminado) return
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
          por: act.creado_por ? (nombreDe(act.creado_por) ?? act.creado_por) : undefined,
          _idx: entradas.length,
        })
      } else {
        entradas.push({ kind: 'generica', fecha: act.fecha, titulo: act.titulo, descripcion: act.descripcion ?? '', tipo: act.tipo, doc_gde: act.doc_gde, timelineIdx, act, _idx: entradas.length })
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

  const getTituloEntrada = (entrada: EntradaHistorial): string => {
    if (entrada.kind === 'sistema')  return `${entrada.etapaAnteriorLabel ?? ''} → ${entrada.etapaNuevaLabel ?? ''}`
    if (entrada.kind === 'generica') return entrada.titulo ?? ''
    if (entrada.kind === 'procesal') return entrada.nombre ?? ''
    return ''
  }

  const getDescripcionEntrada = (entrada: EntradaHistorial): string => {
    if (entrada.kind === 'generica') return entrada.descripcion ?? ''
    return ''
  }

  const historialFiltrado = useMemo(() => {
    return historialCompleto.filter(e => {
      if (filtroHistorial !== 'todo') {
        const kindMap = { sistema: 'sistema', procesales: 'procesal', genericas: 'generica' } as const
        if (e.kind !== kindMap[filtroHistorial]) return false
      }
      if (busquedaHistorial.trim()) {
        const q = busquedaHistorial.toLowerCase()
        if (!`${getTituloEntrada(e)} ${getDescripcionEntrada(e)}`.toLowerCase().includes(q)) return false
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

  // ── Restricción: en el sub-estado DESARCHIVADO solo se admite UNA actividad
  // genérica antes de volver a Archivo. actividadesActuales ya viene acotado a
  // lo registrado desde el último cambio de estado (el que llevó a DESARCHIVADO).
  const enDesarchivado = (exp.estadoProcesal ?? exp.estado) === 'DESARCHIVADO'
  const yaCargoUnaActividadEnDesarchivado =
    enDesarchivado && gruposHistorial.actividadesActuales.some(a => a.kind === 'generica')

  const RESULTADO_LABEL: Record<string, string> = {
    SI: 'Sí', NO: 'No', HAY_ACUERDO: 'Hay acuerdo', NO_HAY_ACUERDO: 'No hay acuerdo',
  }

  // Evento dentro de una etapa (PRD letrado §6.3): círculo violeta + título + chips + fecha.
  function renderEntrada(entrada: EntradaHistorial) {
    if (entrada.kind === 'sistema') return null

    if (entrada.kind === 'generica') {
      const tipoLabel = TIPOS.find(t => t.value === entrada.tipo)?.label ?? entrada.tipo
      return (
        <div>
          <div className="flex items-start gap-2.5 py-3 -mx-2 px-2 rounded hover:bg-gray-50 transition-colors">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mt-0.5">
              <Icon name="notes" size={12} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700">{tipoLabel}</span>
                {entrada.tipo === 'NOTA_RESPUESTA' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">Respuesta</span>
                )}
                {entrada.tipo !== 'NOTA_RESPUESTA' && entrada.titulo.startsWith('Solicitud:') && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700">Solicitud</span>
                )}
                {TIPO_ACTIVIDAD_SOLICITUD_PENAL[entrada.tipo] && !solicitudEstaCompleta(entrada.tipo, entrada.act.solicitud_penal_campos) && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Sin completar</span>
                )}
                {entrada.act.origen_pjn && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">PJN</span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800">{entrada.titulo}</p>
              {entrada.descripcion && <p className="text-xs text-gray-500">{entrada.descripcion}</p>}
              {entrada.doc_gde && (
                <p className="text-[10px] font-mono text-gray-700 mt-1 flex items-center gap-1">
                  <Icon name="attach_file" size={12} />{entrada.doc_gde}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{formatFecha(entrada.fecha)}</span>
          </div>
          {esLetrado && !entrada.act.es_solicitud && (
            <div className="ml-7 pb-2 flex items-center gap-3">
              <button
                onClick={() => setReplyTarget({ act: entrada.act, globalIdx: entrada.timelineIdx })}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Icon name="reply" size={13} />
                Comentar
              </button>
              {entrada.act.tipo !== 'RECEPCION' && !esMovimientoSistema(entrada.act) && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    const r = e.currentTarget.getBoundingClientRect()
                    setMenuActividad({ act: entrada.act, globalIdx: entrada.timelineIdx, x: r.left, y: r.bottom + 4 })
                  }}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Icon name="more_vert" size={14} />
                </button>
              )}
            </div>
          )}
          <ReplyList replies={entrada.act.replies ?? []} />
        </div>
      )
    }

    // hito procesal
    const abrirHito = () => {
      const reg = registros.find(r => r.numero === entrada.numero && r.etapaCodigo === entrada.etapaCodigo)
      if (reg) { setRegistroSeleccionado(reg); setModalDetalle(true) }
    }
    return (
      <div
        onClick={abrirHito}
        className="flex items-start gap-2.5 py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
      >
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mt-0.5">
          <Icon name="check" size={12} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-800 font-medium leading-snug">{entrada.numero} — {entrada.nombre}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">{entrada.etapaLabel}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              entrada.estado === 'cumplido'        ? 'bg-green-100 text-green-700'
              : entrada.estado === 'en_curso'      ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600'
            }`}>
              {entrada.estado === 'cumplido' ? 'Cumplido'
                : entrada.estado === 'en_curso' ? 'En curso'
                : entrada.estado === 'no_procedente' ? 'No proc.'
                : 'Sin estado'}
            </span>
            {entrada.resultado && (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                entrada.resultado === 'NO' || entrada.resultado === 'NO_HAY_ACUERDO'
                  ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {RESULTADO_LABEL[entrada.resultado] ?? entrada.resultado}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatFecha(entrada.fecha)}</span>
        <button
          onClick={e => { e.stopPropagation(); abrirHito() }}
          className="text-xs text-blue-600 hover:underline flex-shrink-0 mt-0.5 px-1"
        >
          Editar
        </button>
      </div>
    )
  }

  const nombreArchivo = `timeline_${exp.id.replace('/', '-')}_${new Date().toISOString().split('T')[0]}`
  const getFilasExport = () => actividadesToFilas(exp.timeline.filter(a => !a.eliminado), exp.id, exp.area)

  // ── Etapas (acordeón del PRD) ───────────────────────
  // historialCompleto viene en orden descendente: lo que está ANTES de una transición de estado
  // (más nuevo) ocurrió en el estado al que esa transición ingresó.
  const etapasPenal: EtapaTL[] = (() => {
    const todas = historialCompleto
    const idxSist = todas.map((e, i) => ({ e, i })).filter(({ e }) => e.kind === 'sistema').map(({ i }) => i)
    const sist = idxSist.map(i => todas[i] as Extract<EntradaHistorial, { kind: 'sistema' }>)
    const q = busquedaHistorial.trim().toLowerCase()
    const pasaFiltro = (e: EntradaHistorial) => {
      if (e.kind === 'sistema') return false
      if (filtroHistorial === 'sistema') return false
      if (filtroHistorial === 'procesales' && e.kind !== 'procesal') return false
      if (filtroHistorial === 'genericas' && e.kind !== 'generica') return false
      if (q && !`${getTituloEntrada(e)} ${getDescripcionEntrada(e)}`.toLowerCase().includes(q)) return false
      return true
    }
    const entre = (desde: number, hasta: number) => todas.slice(desde, hasta).filter(pasaFiltro)
    const esAsignado = (label: string) => /asignad|recib/i.test(label)

    if (sist.length === 0) {
      return [{
        key: 'actual',
        label: etapaActual?.label ?? etapaCodigo,
        actual: true,
        fecha: todas.length ? todas[todas.length - 1].fecha : HOY,
        eventos: entre(0, todas.length).map(renderEntrada),
      }]
    }

    const etapas: EtapaTL[] = sist.map((t, j) => {
      const ini = j === 0 ? 0 : idxSist[j - 1] + 1
      let eventos = entre(ini, idxSist[j])
      // Lo anterior a la primera transición desde "Asignado" pertenece a la etapa más antigua mostrada.
      if (j === sist.length - 1 && esAsignado(t.etapaAnteriorLabel)) {
        eventos = [...eventos, ...entre(idxSist[j] + 1, todas.length)]
      }
      return {
        key: `et-${j}`,
        label: t.etapaNuevaLabel,
        actual: j === 0,
        fecha: t.fecha,
        ingreso: j === 0 ? { label: t.etapaAnteriorLabel, por: t.por } : undefined,
        salida: j > 0 ? { label: sist[j - 1].etapaNuevaLabel, por: sist[j - 1].por } : undefined,
        eventos: eventos.map(renderEntrada),
      }
    })

    const ultima = sist[sist.length - 1]
    if (!esAsignado(ultima.etapaAnteriorLabel)) {
      const pre = entre(idxSist[idxSist.length - 1] + 1, todas.length)
      etapas.push({
        key: 'et-pre',
        label: ultima.etapaAnteriorLabel,
        actual: false,
        fecha: pre.length ? pre[pre.length - 1].fecha : ultima.fecha,
        salida: { label: ultima.etapaNuevaLabel, por: ultima.por },
        eventos: pre.map(renderEntrada),
      })
    }
    return etapas
  })()

  // ── Render ──────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Stepper */}
      <ProcesalStepperPenal exp={exp} onEtapaClick={handleEtapaClick} />

      {/* Card: Ciclo de Vida — Actividades (PRD letrado §6.1) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-base font-semibold text-gray-700">Ciclo de Vida — Actividades</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {([
                ['todo',       'Todo',       null],
                ['sistema',    'Sistema',    countSistema],
                ['procesales', 'Procesales', countProcesales],
                ['genericas',  'Genéricas',  countGenericas],
              ] as const).map(([val, lbl, count]) => (
                <button
                  key={val}
                  onClick={() => setFiltroHistorial(val)}
                  className={`px-3 py-1.5 text-xs flex items-center gap-1.5 border-r border-gray-200 last:border-r-0 transition-colors ${
                    filtroHistorial === val ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {lbl}
                  {count !== null && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Exportar */}
            <div className="relative">
              <button
                onClick={() => setMenuExport(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <Icon name="download" size={14} />
                Exportar
              </button>
              {menuExport && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuExport(false)} />
                  <div className="absolute right-0 z-50 mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1">
                    <button
                      onClick={() => { exportarExcel(getFilasExport(), nombreArchivo); setMenuExport(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Icon name="description" size={16} className="text-green-700" />
                      Descargar Excel
                    </button>
                    <button
                      onClick={() => { exportarPDF(getFilasExport(), nombreArchivo, `Timeline — ${exp.id}`, exp.caratula); setMenuExport(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Icon name="picture_as_pdf" size={16} className="text-red-700" />
                      Descargar PDF
                    </button>
                  </div>
                </>
              )}
            </div>

            {yaCargoUnaActividadEnDesarchivado ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                <Icon name="info" size={14} />
                Ya se registró una actividad en Desarchivado. Volvé a Archivo para continuar.
              </span>
            ) : (
              <button
                onClick={() => { setTabNueva(enDesarchivado ? 'genericas' : 'procesales'); setModalNueva(true) }}
                className="flex items-center gap-1 text-xs bg-blue-700 text-white rounded-md px-2.5 py-1.5 hover:bg-blue-800 transition-colors"
              >
                <Icon name="add" size={14} />
                Nueva Actividad
              </button>
            )}
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={busquedaHistorial}
            onChange={e => setBusquedaHistorial(e.target.value)}
            className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {etapaCodigo === 'ASIGNADO' && historialCompleto.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">Actuación pendiente de inicio.</p>
        ) : (
          <EtapasAcordeon key={etapasPenal.map(e => e.key).join('|')} etapas={etapasPenal} vacio="No hay entradas que coincidan." />
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
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarCambioEstado}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 transition-opacity"
            >
              Confirmar
            </button>
          </>
        }
      >
        <div className="py-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-sm font-semibold text-gray-800 px-3 py-1.5 bg-gray-100 rounded-lg">
              {etapaActual?.label ?? etapaCodigo}
            </span>
            <Icon name="arrow_forward" size={16} className="text-gray-500" />
            <span className="text-sm font-semibold text-white px-3 py-1.5 bg-blue-700 rounded-lg">
              {etapaDestino?.label}
            </span>
          </div>
          {etapaDestino?.codigo === 'RECHAZADO' && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-3">
              <p className="text-xs text-red-800 font-semibold flex items-center gap-2">
                <Icon name="warning" size={14} />
                Esta acción marca la querella como rechazada.
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500 text-center">
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
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {subActSeleccionada ? 'Volver' : 'Cancelar'}
              </button>
              <button
                onClick={confirmarRegistro}
                disabled={!subActSeleccionada}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Registrar
              </button>
            </>
          ) : tabNueva === 'genericas' ? (
            <>
              <button
                onClick={closeModalNueva}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarActividadGenerica}
                disabled={!formAct.titulo.trim()}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Guardar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={closeModalNueva}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarSolicitudPenal}
                disabled={!formSolicitud.titulo.trim() || (!formSolicitud.asignado_a.length && !formSolicitud.area_destinataria)}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Crear solicitud
              </button>
            </>
          )
        }
      >
        {/* Solapas */}
        <div className="flex gap-0 border-b border-gray-200 mb-4 -mx-6 px-6">
          <button
            onClick={() => { setTabNueva('procesales'); setSubActSeleccionada(null); setResultadoModal(null); setCamposModal({}) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tabNueva === 'procesales'
                ? 'border-blue-700 text-gray-800 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Actividades Procesales
          </button>
          <button
            onClick={() => { setTabNueva('genericas'); setFormAct(BLANK_ACT) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tabNueva === 'genericas'
                ? 'border-blue-700 text-gray-800 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Actividades Genéricas
          </button>
          <button
            onClick={() => setTabNueva('solicitud')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tabNueva === 'solicitud'
                ? 'border-blue-700 text-gray-800 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Nueva Solicitud
          </button>
        </div>

        {/* ── Tab: Procesales ── */}
        {tabNueva === 'procesales' && (
          !subActSeleccionada ? (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Etapa: <strong>{etapaActual?.label}</strong> — Seleccioná la actividad que ocurrió
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {subActDisponibles.map(sa => (
                  <button
                    key={sa.id}
                    onClick={() => setSubActSeleccionada(sa)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all hover:border-blue-700 hover:bg-blue-50 ${
                      sa.finalizaCausa
                        ? 'border-l-4 border-l-[#d97706] border-gray-200'
                        : sa.avanzaEtapa
                        ? 'border-l-4 border-l-[#1b3a57] border-gray-200'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {sa.finalizaCausa && <Icon name="warning"       size={14} className="text-amber-700 mt-0.5 flex-shrink-0" />}
                      {sa.avanzaEtapa  && <Icon name="arrow_forward"  size={14} className="text-gray-800 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{sa.numero} {sa.nombre}</p>
                        {sa.finalizaCausa && <p className="text-[10px] text-amber-700 mt-0.5">Si queda firme → finaliza la causa</p>}
                        {sa.avanzaEtapa  && <p className="text-[10px] text-gray-800 mt-0.5">Si queda firme → avanza a siguiente etapa</p>}
                      </div>
                    </div>
                  </button>
                ))}
                {subActDisponibles.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
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
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <Icon name="arrow_back" size={16} />
                </button>
                <p className="text-sm font-semibold text-gray-800">
                  {subActSeleccionada.numero} {subActSeleccionada.nombre}
                </p>
              </div>

              {subActSeleccionada.tipo === 'SI_NO' && (
                <div className="mb-4">
                  <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Resultado</label>
                  <div className="flex gap-2">
                    {(['SI', 'NO'] as ResultadoBinario[]).filter(Boolean).map(r => (
                      <button
                        key={r!}
                        onClick={() => setResultadoModal(r)}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                          resultadoModal === r
                            ? 'bg-blue-700 border-blue-700 text-white'
                            : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                        }`}
                      >{r}</button>
                    ))}
                  </div>
                </div>
              )}

              {subActSeleccionada.tipo === 'ACUERDO' && (
                <div className="mb-4">
                  <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Resultado</label>
                  <div className="flex gap-2">
                    {([
                      { val: 'HAY_ACUERDO' as ResultadoAcuerdo,    label: 'Hay Acuerdo' },
                      { val: 'NO_HAY_ACUERDO' as ResultadoAcuerdo, label: 'No Hay Acuerdo' },
                    ]).map(r => (
                      <button
                        key={r.val!}
                        onClick={() => setResultadoModal(r.val)}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                          resultadoModal === r.val
                            ? 'bg-blue-700 border-blue-700 text-white'
                            : 'border-gray-300 text-gray-500 hover:bg-gray-100'
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
                  <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Estado</label>
                  <div className="flex gap-1">
                    {([
                      ['en_curso',      '⏱ En curso'],
                      ['cumplido',      '✓ Cumplido'],
                      ['no_procedente', '⊘ No proc.'],
                    ] as const).map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => setEstadoModal(val)}
                        className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                          estadoModal === val
                            ? val === 'cumplido'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : val === 'en_curso'
                              ? 'border-blue-700 bg-blue-50 text-gray-800'
                              : 'border-gray-300 bg-gray-100 text-gray-500'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                      >{lbl}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Fecha</label>
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

        {/* ── Tab: Nueva Solicitud ── */}
        {tabNueva === 'solicitud' && (
          <SolicitudForm
            form={formSolicitud}
            setForm={setFormSolicitud}
            usuarioActivo={usuarioActivo}
          />
        )}

        {/* ── Tab: Genéricas ── */}
        {tabNueva === 'genericas' && (
          <div className="space-y-3">
            <div>
              <label className="field-label">Tipo</label>
              <select
                className="field-input w-full"
                value={formAct.tipo}
                onChange={e => {
                  setFormAct(p => ({ ...p, tipo: e.target.value as TipoActividad }))
                  setCamposSolPenal({})
                  setArchivosSolPenal({})
                }}
              >
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                {Object.entries(TIPO_ACTIVIDAD_SOLICITUD_PENAL).map(([codigo, label]) => (
                  <option key={codigo} value={codigo}>{label}</option>
                ))}
              </select>
              {formAct.tipo === 'PRESENTACION' && (
                <button
                  type="button"
                  disabled
                  title="Catálogo de escritos Penal — próximamente"
                  className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 text-xs font-semibold opacity-50 cursor-not-allowed"
                >
                  <Icon name="article" size={16} />
                  Generar Escrito
                </button>
              )}
            </div>
            <div>
              <label className="field-label">Título <span className="text-red-700">*</span></label>
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

            {(() => {
              const config = getConfigPorTipoActividad(formAct.tipo)
              if (!config) return null

              const campoDisparadorVal = config.camposCondicionales
                ? camposSolPenal[config.camposCondicionales.campoDisparador]
                : undefined

              const camposCondicionales =
                config.camposCondicionales && campoDisparadorVal
                  ? config.camposCondicionales.opciones[campoDisparadorVal] ?? []
                  : []

              const todosCampos = [...config.campos, ...camposCondicionales]

              function handleFileUpload(campoId: string, file: File, idx = 0) {
                const docId = `DOC_SOL_${Date.now()}_${idx}`
                agregarDocumento(exp.id, {
                  id: docId,
                  nombre: file.name,
                  tipo: file.name.split('.').pop()?.toUpperCase() ?? 'FILE',
                  fecha: new Date().toISOString().split('T')[0],
                  size: `${Math.round(file.size / 1024)} KB`,
                  icon: 'attach_file',
                  color: 'text-gray-500',
                })
                setArchivosSolPenal(p => ({
                  ...p,
                  [campoId]: [...(p[campoId] ?? []), docId],
                }))
                toast.success(`${file.name} agregado al repositorio de Documentos.`)
              }

              return (
                <div className="col-span-2 mt-2 pt-3 border-t border-dashed border-gray-200">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Datos de la solicitud
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {todosCampos.map(c => (
                      <div key={c.id} className={c.full ? 'col-span-2' : ''}>
                        <label className="field-label">{c.label}</label>
                        {c.tipo === 'select' ? (
                          <select
                            className="field-input w-full"
                            value={camposSolPenal[c.id] ?? ''}
                            onChange={e => setCamposSolPenal(p => ({ ...p, [c.id]: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            {c.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : c.tipo === 'textarea' ? (
                          <textarea
                            className="field-input w-full resize-none"
                            style={{ minHeight: 60 }}
                            value={camposSolPenal[c.id] ?? ''}
                            onChange={e => setCamposSolPenal(p => ({ ...p, [c.id]: e.target.value }))}
                          />
                        ) : (
                          <input
                            type={c.tipo === 'money' ? 'number' : c.tipo}
                            className="field-input w-full"
                            value={camposSolPenal[c.id] ?? ''}
                            onChange={e => setCamposSolPenal(p => ({ ...p, [c.id]: e.target.value }))}
                          />
                        )}
                        {c.permiteArchivo && (
                          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer mt-1 hover:text-gray-800">
                            <Icon name="attach_file" size={13} />
                            Adjuntar archivos
                            <input
                              type="file"
                              multiple
                              hidden
                              onChange={async e => {
                                const input = e.target
                                const seleccion = Array.from(input.files ?? [])
                                if (seleccion.length === 0) return
                                const { aceptados, rechazados } = await validarAdjuntos(seleccion)
                                rechazados.forEach(r => toast.error(`"${r.nombre}" no se adjuntó: ${r.motivo}.`, { autoClose: 7000 }))
                                aceptados.forEach((f, i) => handleFileUpload(c.id, f, i))
                                input.value = ''
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </Modal>

      {/* ── Menú flotante editar/eliminar actividad ── */}
      {menuActividad && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', left: menuActividad.x, top: menuActividad.y }}
          className="w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
        >
          <button
            onClick={() => { abrirEdicionActividad(menuActividad.act, menuActividad.globalIdx); setMenuActividad(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-800 hover:bg-gray-100 transition-colors text-left"
          >
            <Icon name="edit" size={13} />
            Editar
          </button>
          <button
            onClick={() => { confirmarEliminacion(menuActividad.globalIdx); setMenuActividad(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-700 hover:bg-red-100 transition-colors text-left"
          >
            <Icon name="delete" size={13} />
            Eliminar
          </button>
        </div>
      )}

      {/* ── Modal agregar comentario (reply) ── */}
      <Modal
        open={!!replyTarget}
        onClose={() => { setReplyTarget(null); setFormReply({ texto: '', doc_gde: '', fecha: HOY, fecha_vencimiento: '', fecha_aviso: '' }) }}
        titulo="Agregar comentario"
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setReplyTarget(null); setFormReply({ texto: '', doc_gde: '', fecha: HOY, fecha_vencimiento: '', fecha_aviso: '' }) }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
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
    </div>
  )
}

// ── Comentarios (replies) ─────────────────────────────

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
