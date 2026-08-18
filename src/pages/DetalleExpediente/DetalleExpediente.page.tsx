import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import type { Expediente } from '../../types'
import { useUIStore } from '../../store/ui.store'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { TIPOS_GESTION, JUZGADOS, TRIBUNALES, FISCALIAS, UFIS, COMISARIAS } from '../../data/catalogos'
import { USUARIOS, getNombreCompleto, puedeReasignar, esAbogadoPenal } from '../../data/usuarios'
import { ESTADOS_POR_TIPO } from '../../data/expedientes.mock'
import { getEstadoProcesal, getEstadosProcesales } from '../../data/estadosProcesales'
import { getCausalesPorEstado } from '../../data/causalesFinalizacion'
import { MAPA_INICIAR_JUICIO } from '../../utils/iniciarJuicio'
import { FUEROS_PENAL, getJuzgadosPorFuero } from '../../data/juzgadosPJN'
import { getEtapasPenales } from '../../data/etapasPenales'
import { DatosTab }          from './tabs/DatosTab'
import { VinculosTab }       from './tabs/VinculosTab'
import { IntervinientesTab } from './tabs/IntervinientesTab'
import { TimelineTab }       from './tabs/TimelineTab'
import { DocumentosTab }     from './tabs/DocumentosTab'
import { PrevisionTab }      from './tabs/PrevisionTab'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'
import { formatFecha } from '../../utils/format'
import { getAlertaExpediente, getAlertaTimer } from '../../utils/alertas'
import { RUTAS } from '../../utils/routing'

type Tab = 'datos' | 'vinculos' | 'intervinientes' | 'timeline' | 'docs' | 'prevision'
type AccionMenu = 'estado' | 'causa' | 'desagrupar' | 'reasignar' | 'iniciar_juicio' | 'nueva_actuacion_penal' | 'nueva_querella'

const ALL_JUZGADOS = [...JUZGADOS, ...TRIBUNALES, ...FISCALIAS, ...UFIS, ...COMISARIAS]
const HOY = new Date().toISOString().split('T')[0]
const TIPOS_CON_JUICIO = new Set([
  'COBRO_CANON', 'RECLAMO_CONTRAT', 'RECUPERO', 'EJECUCION_GAR',
  'LANZAMIENTO', 'CONSIGNACION', 'DESAFUERO',
])
// Tipos con flujo MATRIZ SACO — "Finalizado" siempre disponible en el select
const TIPOS_FINALIZACION_LIBRE = new Set([
  'DEMANDA_CIVIL', 'DEMANDA_LABORAL', 'DEMANDA_CIVIL_ACTORA', 'DEMANDA_LABORAL_ACTORA',
  'LANZAMIENTO_JUDICIALIZADO',
])

// Código del estado terminal por tipo — la mayoría usa 'FINALIZADO', pero
// LANZAMIENTO_JUDICIALIZADO usa 'TERMINADO' (label igual: "Finalizado").
const CODIGO_FINALIZADO_POR_TIPO: Record<string, string> = {
  DEMANDA_CIVIL: 'FINALIZADO',
  DEMANDA_LABORAL: 'FINALIZADO',
  DEMANDA_CIVIL_ACTORA: 'FINALIZADO',
  DEMANDA_LABORAL_ACTORA: 'FINALIZADO',
  LANZAMIENTO_JUDICIALIZADO: 'TERMINADO',
}
function getCodigoFinalizado(tipo: string): string {
  return CODIGO_FINALIZADO_POR_TIPO[tipo] ?? 'FINALIZADO'
}

// Ramificaciones genéricas por CÓDIGO de estado — válidas para cualquier tipo
// de expediente que llegue a ese código (p.ej. ALEGATO/APELACION son iguales
// en los 4 ciclos de Demanda Civil/Laboral). EN_ANALISIS es la excepción:
// su ramificación depende del tipo ("ciclo A" vs "ciclo B"), se resuelve
// en getRamificaciones() antes de caer acá.
const RAMIFICACIONES_POR_CODIGO: Record<string, string[]> = {
  ALEGATO:    ['SENTENCIA_1_FAV', 'SENTENCIA_1_DESFAV'],
  APELACION:  ['SENTENCIA_2_FAV', 'SENTENCIA_2_DESFAV'],
  CONSTATACION_JUDICIAL: ['SENTENCIA_LANZAMIENTO', 'TRASLADO_DEFENSOR_OFICIAL'],
}

// Split Operativo/Comercial de LANZAMIENTO_JUDICIALIZADO — el circuito
// Comercial salta directo entre estos 4 nodos, ignorando la bifurcación de
// CONSTATACION_JUDICIAL y las instancias recursivas intermedias.
const SALTOS_LANZAMIENTO_COMERCIAL: Record<string, string> = {
  INICIO: 'SENTENCIA_LANZAMIENTO',
  SENTENCIA_LANZAMIENTO: 'MANDAMIENTO_LIBRADO',
  MANDAMIENTO_LIBRADO: 'LANZAMIENTO_EFECTIVIZADO',
  LANZAMIENTO_EFECTIVIZADO: 'TERMINADO',
}
/** Próximo código del circuito Comercial de Lanzamiento, o null si no aplica
 * (tipo distinto de Comercial, o el estado actual no tiene salto definido —
 * en ese caso el modal cae al flujo normal/ramificado). */
function getSiguienteLanzamiento(codigoActual: string, tipoLanzamiento: string): string | null {
  if (tipoLanzamiento !== 'Comercial') return null
  return SALTOS_LANZAMIENTO_COMERCIAL[codigoActual] ?? null
}

const TIPOS_EN_ANALISIS_CICLO_A = new Set([
  'COBRO_CANON', 'RECLAMO_CONTRAT', 'RECUPERO', 'EJECUCION_GAR', 'LANZAMIENTO',
])
const TIPOS_EN_ANALISIS_CICLO_B = new Set(['CONSIGNACION', 'DESAFUERO'])

/** Códigos de estado destino disponibles como ramificación desde `codigoEstado`,
 * dado el `tipoExpediente` (solo relevante para EN_ANALISIS). Vacío si el
 * estado no ramifica (es una transición lineal vía `siguiente`). */
function getRamificaciones(codigoEstado: string, tipoExpediente: string): string[] {
  if (codigoEstado === 'EN_ANALISIS') {
    if (TIPOS_EN_ANALISIS_CICLO_B.has(tipoExpediente)) {
      return ['JUICIO_INICIADO', 'DEVUELTO_SECTOR_REQUIRENTE']
    }
    if (TIPOS_EN_ANALISIS_CICLO_A.has(tipoExpediente)) {
      return ['ACUERDO_EXTRAJUDICIAL', 'JUICIO_INICIADO', 'DEVUELTO_SECTOR_REQUIRENTE']
    }
    return []
  }
  return RAMIFICACIONES_POR_CODIGO[codigoEstado] ?? []
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'datos',          label: 'Datos',          icon: 'info' },
  { key: 'timeline',       label: 'Línea de Tiempo', icon: 'timeline' },
  { key: 'intervinientes', label: 'Intervinientes', icon: 'people' },
  { key: 'docs',           label: 'Documentos',     icon: 'folder' },
  { key: 'prevision',      label: 'Previsión',      icon: 'trending_up' },
  { key: 'vinculos',       label: 'Vinculados',     icon: 'account_tree' },
]

export default function DetalleExpedientePage() {
  const navigate = useNavigate()
  const params = useParams()
  const expId = params['*'] ?? ''

  const { expedienteActivo: exp, setExpedienteActivo, actualizarEstado, asignarAbogado, actualizarExpediente, agregarActividad, agregarExpediente, tareasMap, inicializarTareas } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  const [tab, setTab] = useState<Tab>('datos')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accion, setAccion] = useState<AccionMenu | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevaCausa, setNuevaCausa] = useState('')
  const [nuevoAbogado, setNuevoAbogado] = useState('')
  const [motivoEstado, setMotivoEstado] = useState('')
  const [modalCausal, setModalCausal] = useState(false)
  const [causalSeleccionada, setCausalSeleccionada] = useState('')
  const [causalLibre, setCausalLibre] = useState('')
  const [formJuicio, setFormJuicio] = useState({
    oficio_judicial: '',
    tipo_intervencion: 'Actora',
    secretaria: '',
    numero_causa: '',
    juzgado: '',
    caratula: '',
    abogado_contraria: '',
    parte_actora: '',
    parte_demandada: 'SOFSE',
    coactores: '',
    codemandados: '',
    fecha_inicio: HOY,
    tipo_juicio: '',
    monto: '',
    ubicacion: '',
    linea: '',
    tipo_lanzamiento: '',
  })

  const BLANK_QUERELLA = {
    numero_causa:  '',
    juzgado_fuero: '',
    juzgado:       '',
    fiscalia:      '',
    caratula:      '',
    abogado_id:    exp?.abogado_id ?? '',
    observaciones: '',
  }
  const [formQuerella, setFormQuerella] = useState(BLANK_QUERELLA)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expId) setExpedienteActivo(expId)
  }, [expId, setExpedienteActivo])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!exp) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <Icon name="search_off" size={48} />
          <p className="mt-4 text-[#242C4F] font-medium">Actuación no encontrada</p>
          <p className="text-sm text-[#758A93] mt-1 font-mono">{expId}</p>
          <Link to="/bandeja/abogado" className="inline-block mt-4 text-sm text-[#242C4F] hover:underline">
            Volver a la bandeja
          </Link>
        </div>
      </div>
    )
  }

  const tipoLabel    = TIPOS_GESTION.find(t => t.code === exp.tipo)?.label ?? exp.tipo
  const juzgadoLabel = exp.juzgado ? (ALL_JUZGADOS.find(j => j.id === exp.juzgado)?.label ?? exp.juzgado) : null
  const estadosPosibles = ESTADOS_POR_TIPO[exp.tipo] ?? []
  const abogadosArea = USUARIOS.filter(u => u.areas.includes(exp.area) && u.rolSistema !== 'ADMINISTRATIVO')

  const estadoProcesalActual = getEstadoProcesal(exp.tipo, exp.estadoProcesal ?? exp.estado)
  const siguienteEstadoProcesal = estadoProcesalActual?.siguiente
    ? getEstadoProcesal(exp.tipo, estadoProcesalActual.siguiente)
    : undefined
  const esFlujoProcesal = !!siguienteEstadoProcesal || getRamificaciones(exp.estadoProcesal ?? exp.estado, exp.tipo).length > 0

  function openAccion(a: AccionMenu) {
    setMenuOpen(false)
    if (a === 'nueva_actuacion_penal') { navigate(RUTAS.NUEVA_ACTUACION_PENAL); return }
    if (a === 'estado') {
      if (exp!.area === 'PENAL') {
        setNuevoEstado('')
      } else if (esFlujoProcesal) {
        const todosEstados = getEstadosProcesales(exp!.tipo)
        const estadoCod = exp!.estadoProcesal ?? exp!.estado
        const tipoLanz = String(exp!.campos_mesa?.['mesa_tipo_lanzamiento'] ?? '')
        const saltoComercial = exp!.tipo === 'LANZAMIENTO_JUDICIALIZADO' && tipoLanz === 'Comercial'
          ? getSiguienteLanzamiento(estadoCod, tipoLanz)
          : null
        const ramificados = saltoComercial ? [] : getRamificaciones(estadoCod, exp!.tipo)
        if (saltoComercial) {
          setNuevoEstado(saltoComercial)
        } else if (ramificados.length > 0) {
          setNuevoEstado(ramificados[0])
        } else {
          // Usar el campo explícito .siguiente, no el vecino posicional en el
          // array: códigos que son destino de una bifurcación previa (p.ej.
          // SENTENCIA_1_FAV/SENTENCIA_2_FAV) tienen como vecino físico a su
          // hermano DESFAV, no a su verdadero siguiente estado.
          const estadoActualObj = todosEstados.find(e => e.codigo === estadoCod)
          setNuevoEstado(estadoActualObj?.siguiente ?? '')
        }
      } else {
        setNuevoEstado(exp!.estado)
      }
      setMotivoEstado('')
    }
    if (a === 'causa')  setNuevaCausa(exp!.numero_causa ?? '')
    if (a === 'reasignar') setNuevoAbogado(exp!.abogado_id ?? '')
    if (a === 'iniciar_juicio') {
      setFormJuicio(p => ({ ...p, caratula: exp!.caratula, numero_causa: exp!.numero_causa ?? '' }))
    }
    if (a === 'nueva_querella') {
      setFormQuerella({
        ...BLANK_QUERELLA,
        caratula:     exp!.caratula,
        numero_causa: exp!.numero_causa ?? '',
        abogado_id:   exp!.abogado_id ?? '',
      })
    }
    setAccion(a)
  }

  function confirmarEstado() {
    if (exp!.area === 'PENAL') {
      if (!nuevoEstado || nuevoEstado === exp!.estadoProcesal) { setAccion(null); return }
      const etapas = getEtapasPenales(exp!.tipo)
      const etapaActual = etapas.find(e => e.codigo === (exp!.estadoProcesal ?? exp!.estado))
      const etapaDestino = etapas.find(e => e.codigo === nuevoEstado)
      const nombre = usuarioActivo ? getNombreCompleto(usuarioActivo) : 'Usuario'
      agregarActividad(exp!.id, {
        id: `ACT_${Date.now()}`,
        expediente_id: exp!.id,
        tipo: 'MOVIMIENTO',
        titulo: `Cambio de estado: ${etapaActual?.label ?? exp!.estadoProcesal} → ${etapaDestino?.label ?? nuevoEstado}`,
        descripcion: motivoEstado.trim() || `Estado avanzado por ${nombre}.`,
        fecha: HOY,
        activo: true,
        subitems: [],
        estadoExpediente: nuevoEstado,
        doc_gde: null,
        creado_por: usuarioActivo?.id,
      })
      actualizarEstado(exp!.id, nuevoEstado)
      actualizarExpediente(exp!.id, { estadoProcesal: nuevoEstado })
      toast.success(`Estado actualizado a ${etapaDestino?.label ?? nuevoEstado}`)
      setMotivoEstado('')
      setAccion(null)
      return
    }
    if (esFlujoProcesal) {
      if (!nuevoEstado) { setAccion(null); return }
      if (TIPOS_FINALIZACION_LIBRE.has(exp!.tipo) && nuevoEstado === getCodigoFinalizado(exp!.tipo)) {
        setAccion(null)
        setModalCausal(true)
        return
      }
      const todosEstados = getEstadosProcesales(exp!.tipo)
      const idxActual = todosEstados.findIndex(e => e.codigo === (exp!.estadoProcesal ?? exp!.estado))
      const destCodigo = nuevoEstado
      const destEstado = todosEstados.find(e => e.codigo === destCodigo) ?? siguienteEstadoProcesal!
      const idxDest = todosEstados.findIndex(e => e.codigo === destCodigo)
      const esRetroceso = idxDest < idxActual
      const nombre = usuarioActivo ? getNombreCompleto(usuarioActivo) : 'Usuario'
      const tareas = tareasMap[`${exp!.id}__${exp!.estadoProcesal ?? exp!.estado}`] ?? estadoProcesalActual?.tareas ?? []
      agregarActividad(exp!.id, {
        id: `ACT_${Date.now()}`,
        expediente_id: exp!.id,
        tipo: 'MOVIMIENTO',
        titulo: `${esRetroceso ? 'Retroceso' : 'Cambio'} de estado: ${estadoProcesalActual!.label} → ${destEstado.label}`,
        descripcion: motivoEstado.trim() || `Estado ${esRetroceso ? 'retrocedido' : 'avanzado'} por ${nombre}.`,
        fecha: HOY,
        activo: true,
        subitems: [],
        estadoExpediente: destCodigo,
        tareasSnapshot: tareas,
        doc_gde: null,
        creado_por: usuarioActivo?.id,
      })
      // Inicializar tareas del destino si no existen aún
      const keyDest = `${exp!.id}__${destCodigo}`
      if (!tareasMap[keyDest] && destEstado.tareas?.length) {
        inicializarTareas(exp!.id, destCodigo, destEstado.tareas)
      }
      actualizarEstado(exp!.id, destCodigo)
      actualizarExpediente(exp!.id, { estadoProcesal: destCodigo })
      toast.success(`Estado actualizado a ${destEstado.label}`)
      if (destCodigo === 'JUICIO_INICIADO' && MAPA_INICIAR_JUICIO[exp!.tipo]) {
        toast.info(
          "La actuación pasó a Juicio iniciado. Podés ejecutar 'Iniciar Juicio' desde el botón + del encabezado.",
          { autoClose: 6000 }
        )
      }
      setNuevoEstado('')
      setMotivoEstado('')
      setAccion(null)
      return
    }
    if (!nuevoEstado || nuevoEstado === exp!.estado) { setAccion(null); return }
    actualizarEstado(exp!.id, nuevoEstado)
    toast.success(`Estado actualizado a "${nuevoEstado}".`)
    setAccion(null)
  }

  function confirmarCausal() {
    const causal = causalSeleccionada || causalLibre.trim()
    if (!causal) return
    const estadoCodigo = exp!.estadoProcesal ?? exp!.estado
    const estadoActual = getEstadoProcesal(exp!.tipo, estadoCodigo)
    const nombre = usuarioActivo ? getNombreCompleto(usuarioActivo) : 'Usuario'
    const tareas = tareasMap[`${exp!.id}__${estadoCodigo}`] ?? estadoActual?.tareas ?? []
    const codigoFinalizado = getCodigoFinalizado(exp!.tipo)
    agregarActividad(exp!.id, {
      id: `ACT_${Date.now()}`,
      expediente_id: exp!.id,
      tipo: 'MOVIMIENTO',
      titulo: `Cambio de estado: ${estadoActual?.label ?? estadoCodigo} → Finalizado`,
      descripcion: `Actuación finalizada por ${nombre}. Causal: ${causal}`,
      fecha: HOY,
      activo: true,
      subitems: [],
      estadoExpediente: codigoFinalizado,
      tareasSnapshot: tareas,
      doc_gde: null,
      creado_por: usuarioActivo?.id,
    })
    actualizarEstado(exp!.id, codigoFinalizado)
    actualizarExpediente(exp!.id, { estadoProcesal: codigoFinalizado, causal_finalizacion: causal })
    toast.success('Actuación finalizada.')
    setModalCausal(false)
    setCausalSeleccionada('')
    setCausalLibre('')
    setNuevoEstado('')
    setMotivoEstado('')
  }

  function confirmarCausa() {
    actualizarExpediente(exp!.id, { numero_causa: nuevaCausa.trim() || null })
    toast.success('N° Causa actualizado.')
    setAccion(null)
  }

  function confirmarDesagrupar() {
    actualizarExpediente(exp!.id, { numero_causa: null })
    toast.success('Actuación desagrupada de la causa.')
    setAccion(null)
  }

  function confirmarReasignar() {
    if (!nuevoAbogado) { setAccion(null); return }
    asignarAbogado(exp!.id, nuevoAbogado)
    toast.success('Actuación reasignada.')
    setAccion(null)
  }

  function confirmarIniciarJuicio() {
    const tipoDestino = MAPA_INICIAR_JUICIO[exp!.tipo]

    // LANZAMIENTO es el único origen que crea un expediente NUEVO
    // (LANZAMIENTO_JUDICIALIZADO) — mismo patrón que confirmarNuevaQuerella.
    // El resto de MAPA_INICIAR_JUICIO sigue parcheando el expediente actual.
    if (tipoDestino === 'LANZAMIENTO_JUDICIALIZADO') {
      const idNuevo = `${exp!.area === 'CIVIL' ? 'C' : 'L'}-LJ${Date.now().toString().slice(-6)}`
      // "Principal · PJN" solo si hay número de causa REAL — el id del
      // expediente origen es un sentinela de agrupación, no una causa.
      const tieneCausaReal = !!(formJuicio.numero_causa.trim() || exp!.numero_causa)
      const causaComun = formJuicio.numero_causa.trim() || exp!.numero_causa || exp!.id

      const nuevoLanzamiento: Expediente = {
        id:              idNuevo,
        area:            exp!.area,
        tipo:            'LANZAMIENTO_JUDICIALIZADO',
        estado:          'ASIGNADO',
        estadoProcesal:  'ASIGNADO',
        caratula:        formJuicio.caratula || exp!.caratula,
        numero_ee_gde:   exp!.numero_ee_gde,
        abogado_id:      exp!.abogado_id,
        fecha_recepcion: HOY,
        numero_causa:    causaComun,
        es_principal:    tieneCausaReal,
        es_urgente:      exp!.es_urgente,
        campos_mesa: {
          mesa_num_causa:        formJuicio.numero_causa,
          mesa_juzgado:          formJuicio.juzgado,
          mesa_secretaria:       formJuicio.secretaria,
          mesa_caratula:         formJuicio.caratula,
          mesa_abogado_contr:    formJuicio.abogado_contraria,
          mesa_parte_actora:     formJuicio.parte_actora,
          mesa_parte_dem:        formJuicio.parte_demandada,
          mesa_codemandados:     formJuicio.codemandados,
          mesa_fecha_inicio:     formJuicio.fecha_inicio,
          mesa_juicio:           formJuicio.tipo_juicio,
          mesa_ubicacion:        formJuicio.ubicacion,
          mesa_linea:            formJuicio.linea,
          mesa_tipo_lanzamiento: formJuicio.tipo_lanzamiento,
        },
        campos_abogado: {},
        timeline: [
          {
            id:               `${idNuevo}_REC_01`,
            expediente_id:    idNuevo,
            tipo:             'RECEPCION',
            titulo:           'Lanzamiento judicializado iniciado',
            descripcion:      `Iniciado desde el lanzamiento administrativo ${exp!.id}. Tipo de lanzamiento: ${formJuicio.tipo_lanzamiento}.`,
            fecha:            HOY,
            activo:           true,
            subitems:         [],
            estadoExpediente: 'ASIGNADO',
            creado_por:       usuarioActivo?.id,
          },
        ],
        intervinientes: [],
        documentos:     [],
        vinculos:       [],
      }

      agregarExpediente(nuevoLanzamiento)

      actualizarExpediente(exp!.id, {
        es_juicio_iniciado:  true,
        fecha_inicio_juicio: HOY,
        numero_causa:        causaComun,
        es_principal:        false,
      })

      agregarActividad(exp!.id, {
        id:               `${exp!.id}_JUI_${Date.now()}`,
        expediente_id:    exp!.id,
        tipo:             'MOVIMIENTO',
        titulo:           'Juicio iniciado — Lanzamiento judicializado',
        descripcion:      `Se inició el lanzamiento judicializado ${idNuevo} (${formJuicio.tipo_lanzamiento}).`,
        fecha:            HOY,
        activo:           true,
        subitems:         [],
        estadoExpediente: exp!.estado,
        es_movimiento_impulsorio: true,
        creado_por:       usuarioActivo?.id,
      })

      toast.success(`Lanzamiento judicializado ${idNuevo} creado (${formJuicio.tipo_lanzamiento}).`, { autoClose: 6000 })
      setAccion(null)
      setTimeout(() => navigate(RUTAS.EXPEDIENTE(idNuevo)), 800)
      return
    }

    actualizarExpediente(exp!.id, {
      numero_causa: formJuicio.numero_causa.trim() || exp!.numero_causa,
      es_juicio_iniciado: true,
      fecha_inicio_juicio: new Date().toISOString().split('T')[0],
      fecha_ultimo_impulsorio: undefined,
      campos_mesa: {
        ...exp!.campos_mesa,
        mesa_num_causa:     formJuicio.numero_causa,
        mesa_juzgado:       formJuicio.juzgado,
        mesa_secretaria:    formJuicio.secretaria,
        mesa_caratula:      formJuicio.caratula,
        mesa_abogado_contr: formJuicio.abogado_contraria,
        mesa_parte_actora:  formJuicio.parte_actora,
        mesa_parte_dem:     formJuicio.parte_demandada,
        mesa_coactores:     formJuicio.coactores,
        mesa_codemandados:  formJuicio.codemandados,
        mesa_fecha_inicio:  formJuicio.fecha_inicio,
        mesa_juicio:        formJuicio.tipo_juicio,
        mesa_monto:         formJuicio.monto,
        mesa_oficio_judicial: formJuicio.oficio_judicial,
        mesa_tipo_intervencion: formJuicio.tipo_intervencion,
        mesa_ubicacion:     formJuicio.ubicacion,
        mesa_linea:         formJuicio.linea,
        ...(formJuicio.tipo_lanzamiento ? { mesa_tipo_lanzamiento: formJuicio.tipo_lanzamiento } : {}),
      },
    })
    toast.success('Juicio iniciado y datos registrados.')
    setAccion(null)
  }

  function confirmarNuevaQuerella() {
    if (!formQuerella.caratula.trim()) {
      toast.error('La carátula es obligatoria.')
      return
    }

    const idQuerella = `P-Q${Date.now().toString().slice(-6)}`

    // Causa común para agrupar ambas actuaciones.
    // Prioridad: lo que ingresó el letrado en el modal → número de
    // causa del expediente origen → id del expediente origen como
    // último recurso.
    const causaComun = (
      formQuerella.numero_causa.trim() ||
      exp!.numero_causa?.trim() ||
      exp!.id
    )
    // "Principal · PJN" solo si hay número de causa REAL — el id del
    // expediente origen es un sentinela de agrupación, no una causa.
    const tieneCausaReal = !!(formQuerella.numero_causa.trim() || exp!.numero_causa?.trim())

    const nuevaQuerella: Expediente = {
      id:              idQuerella,
      area:            'PENAL',
      tipo:            'QUERELLA',
      estado:          'INSTRUCCION',
      estadoProcesal:  'INSTRUCCION',
      caratula:        formQuerella.caratula.trim(),
      numero_ee_gde:   exp!.numero_ee_gde,
      numero_causa:    causaComun,
      es_principal:    tieneCausaReal,
      abogado_id:      formQuerella.abogado_id || exp!.abogado_id || undefined,
      fecha_recepcion: HOY,
      es_urgente:      exp!.es_urgente,
      campos_mesa: {
        area_requirente: exp!.campos_mesa?.area_requirente ?? '',
        linea:           exp!.linea ?? exp!.campos_mesa?.linea ?? '',
        numero_causa:    causaComun,
        juzgado_fuero:   formQuerella.juzgado_fuero,
        juzgado:         formQuerella.juzgado,
        fiscalia:        formQuerella.fiscalia,
      },
      campos_abogado: {
        abg_caratula:    formQuerella.caratula.trim(),
        abg_tipo_hecho:  exp!.campos_abogado?.abg_tipo_hecho ?? '',
        abg_fecha_hecho: exp!.campos_abogado?.abg_fecha_hecho ?? '',
        abg_lugar_hecho: exp!.campos_abogado?.abg_lugar_hecho ?? '',
        observaciones:   formQuerella.observaciones,
      },
      timeline: [
        {
          id:               `${idQuerella}_REC_01`,
          expediente_id:    idQuerella,
          tipo:             'RECEPCION',
          titulo:           'Querella iniciada desde Carta SAE',
          descripcion:      `Querella derivada de la Carta SAE ${exp!.id}.${formQuerella.observaciones ? ' ' + formQuerella.observaciones : ''}`,
          fecha:            HOY,
          activo:           true,
          subitems:         [],
          estadoExpediente: 'INSTRUCCION',
          creado_por:       usuarioActivo?.id,
        },
      ],
      vinculos: [],
      intervinientes: [],
      documentos:     [],
    }

    agregarExpediente(nuevaQuerella)

    actualizarExpediente(exp!.id, {
      es_querella_iniciada: true,
      id_querella_derivada: idQuerella,
      numero_causa:         causaComun,
      es_principal:         false,
    })

    agregarActividad(exp!.id, {
      id:               `${exp!.id}_QRL_${Date.now()}`,
      expediente_id:    exp!.id,
      tipo:             'MOVIMIENTO',
      titulo:           'Nueva Querella iniciada',
      descripcion:      `Se inició la Querella ${idQuerella} — ${formQuerella.caratula.trim()}. La causa penal pasa a tramitarse como Querella.`,
      fecha:            HOY,
      activo:           true,
      subitems:         [],
      estadoExpediente: exp!.estado,
      es_movimiento_impulsorio: true,
      creado_por:       usuarioActivo?.id,
    })

    toast.success(`Querella ${idQuerella} creada correctamente.`, { autoClose: 6000 })
    setAccion(null)
    setFormQuerella(BLANK_QUERELLA)
    setTimeout(() => navigate(RUTAS.EXPEDIENTE(idQuerella)), 800)
  }

  const alerta      = getAlertaExpediente(exp.id, tareasMap, exp.timeline)
  const alertaTimer = getAlertaTimer(exp)

  const tareasEstadoActual = tareasMap[`${exp.id}__${exp.estadoProcesal ?? exp.estado}`] ?? []
  const tieneTareasPendientes = tareasEstadoActual.length > 0 && tareasEstadoActual.some(t => t.estado === 'en_curso')

  const tabCounters: Partial<Record<Tab, number>> = {
    vinculos:       exp.vinculos.length,
    intervinientes: exp.intervinientes.length,
    timeline:       exp.timeline.length,
    docs:           exp.documentos.length,
  }

  return (
    <div className="p-6 space-y-5 max-w-screen-xl overflow-hidden">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#758A93] mb-3">
          <Link to="/actuaciones" className="hover:text-[#242C4F] transition-colors">Actuaciones</Link>
          <Icon name="chevron_right" size={14} />
          <span className="text-[#242C4F]">Actuación</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-mono font-bold text-lg text-[#242C4F]">{exp.id}</span>
              <AreaBadge area={exp.area} />
              <EstadoBadge code={exp.estado} label={exp.estado} />
              {(alerta.activa || alertaTimer.activa) && (() => {
                const timerVencido = alertaTimer.activa && alertaTimer.diasRestantes !== undefined && alertaTimer.diasRestantes <= 0
                const esVencido = alerta.estado === 'vencido' || timerVencido
                if (esVencido) {
                  return (
                    <div
                      title={alerta.nombreElemento ? `Vencido: ${alerta.nombreElemento}` : 'Plazo vencido'}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fee2e2] border border-[#fca5a5]"
                    >
                      <Icon name="warning" size={11} className="text-[#C3292F]" />
                      <span className="text-[10px] font-black text-[#C3292F] uppercase tracking-wide">Vencido</span>
                    </div>
                  )
                }
                return (
                  <div
                    title={alerta.nombreElemento ? `Por vencer: ${alerta.nombreElemento}${alerta.fechaVencimiento ? ` — vence ${formatFecha(alerta.fechaVencimiento)}` : ''}` : 'Tarea por vencer'}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fef3c7] border border-[#fde68a]"
                  >
                    <Icon name="schedule" size={11} className="text-[#d97706]" />
                    <span className="text-[10px] font-black text-[#d97706] uppercase tracking-wide">Por vencer</span>
                  </div>
                )
              })()}
              <button
                onClick={() => actualizarExpediente(exp.id, { es_urgente: !exp.es_urgente })}
                title={exp.es_urgente ? 'Marcar como no urgente' : 'Marcar como urgente'}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  exp.es_urgente
                    ? 'bg-[#fee2e2] border-[#fca5a5] text-[#C3292F]'
                    : 'bg-white border-[rgba(0,0,0,0.12)] text-[#758A93] hover:border-[#fca5a5] hover:text-[#C3292F]'
                }`}
              >
                <Icon name="warning" size={11} className={exp.es_urgente ? 'text-[#C3292F]' : 'text-[#758A93]'} />
                <span className="text-[10px] font-black uppercase tracking-wide">
                  {exp.es_urgente ? 'Urgente' : 'Marcar urgente'}
                </span>
              </button>
              {exp.numero_causa && (
                <span className="text-[10px] font-bold bg-[#E3E4E9] text-[#758A93] px-2 py-0.5 rounded-full font-mono">
                  {exp.numero_causa}
                </span>
              )}
              {exp.es_querella_iniciada && exp.id_querella_derivada && (
                <button
                  onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id_querella_derivada!))}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#eeedfe] text-[#534ab7] border border-[#AFA9EC] hover:bg-[#CECBF6] transition-colors"
                >
                  <Icon name="gavel" size={12} />
                  Ver Querella →
                </button>
              )}
            </div>
            <h1 className="font-headline font-bold text-xl text-[#242C4F] leading-snug">{exp.caratula}</h1>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-[#758A93] flex-wrap">
              <span>{tipoLabel}</span>
              {juzgadoLabel && (
                <>
                  <span className="text-[rgba(0,0,0,0.35)]">·</span>
                  <span>{juzgadoLabel}</span>
                </>
              )}
            </div>
          </div>

          {/* Acción menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#256386] text-white hover:opacity-90 transition-opacity shadow-md"
            >
              <Icon name="add" size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-card-lg z-10 overflow-hidden border border-[rgba(0,0,0,0.10)]">
                {[
                  { key: 'nueva_actuacion_penal' as AccionMenu, icon: 'add_circle', label: 'Nueva Actuación', show: esAbogadoPenal(usuarioActivo) },
                  { key: 'estado' as AccionMenu,    icon: 'swap_horiz',    label: 'Cambiar estado',  show: true },
                  { key: 'causa' as AccionMenu,     icon: 'link',          label: 'Agrupar a causa', show: !exp.numero_causa },
                  { key: 'desagrupar' as AccionMenu,icon: 'link_off',      label: 'Desagrupar',      show: !!exp.numero_causa },
                  { key: 'reasignar' as AccionMenu, icon: 'person_search', label: 'Reasignar',       show: puedeReasignar(usuarioActivo) },
                  { key: 'iniciar_juicio' as AccionMenu, icon: 'gavel', label: 'Iniciar Juicio', show: TIPOS_CON_JUICIO.has(exp.tipo) && (exp.estadoProcesal ?? exp.estado) === 'JUICIO_INICIADO' },
                  { key: 'nueva_querella' as AccionMenu, icon: 'gavel', label: 'Nueva Querella', show: exp.tipo === 'CARTA_SUCESO' && !exp.es_querella_iniciada },
                ]
                .filter(item => item.show)
                .map(item => (
                  <button
                    key={item.key}
                    onClick={() => openAccion(item.key)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-[#242C4F] hover:bg-[#E3E4E9] transition-colors"
                  >
                    <Icon name={item.icon} size={18} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[rgba(0,0,0,0.10)] w-full">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-px ${
              tab === t.key
                ? 'border-[#242C4F] text-[#242C4F]'
                : 'border-transparent text-[#758A93] hover:text-[#242C4F]'
            }`}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
            {tabCounters[t.key] !== undefined && (
              <span className="text-xs bg-[#e0e0e0] rounded-full px-1.5 py-0.5 text-[#758A93]">
                {tabCounters[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'datos'          && <DatosTab          exp={exp} />}
      {tab === 'vinculos'       && <VinculosTab        exp={exp} />}
      {tab === 'intervinientes' && <IntervinientesTab  exp={exp} />}
      {tab === 'timeline'       && <TimelineTab        exp={exp} />}
      {tab === 'docs'           && <DocumentosTab      exp={exp} />}
      {tab === 'prevision'      && <PrevisionTab       exp={exp} />}

      {/* Modal: Cambiar estado */}
      <Modal
        open={accion === 'estado'}
        onClose={() => setAccion(null)}
        titulo="Cambiar estado"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarEstado}
              disabled={(() => {
                if (exp.area === 'PENAL') return !nuevoEstado
                if (!esFlujoProcesal) return !nuevoEstado
                const estadoCodigo = exp.estadoProcesal ?? exp.estado
                if (estadoCodigo === 'ASIGNADO') return false
                if (!nuevoEstado) return true
                if (TIPOS_FINALIZACION_LIBRE.has(exp.tipo) && nuevoEstado === getCodigoFinalizado(exp.tipo)) return false
                const todos = getEstadosProcesales(exp.tipo)
                const idxActual = todos.findIndex(e => e.codigo === estadoCodigo)
                const idxDest = todos.findIndex(e => e.codigo === nuevoEstado)
                const esRetroceso = idxDest < idxActual
                if (esRetroceso) return !motivoEstado.trim()
                return tieneTareasPendientes
              })()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#256386] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Confirmar
            </button>
          </>
        }
      >
        {exp.area === 'PENAL' ? (
          <div className="space-y-4">
            <div>
              <label className="field-label">Nuevo estado procesal</label>
              <select className="field-input w-full" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
                <option value="">Seleccionar…</option>
                {getEtapasPenales(exp.tipo)
                  .filter(e => e.codigo !== 'ASIGNADO' && e.codigo !== exp.estadoProcesal)
                  .sort((a, b) => {
                    if (a.codigo === 'RECHAZADO') return 1
                    if (b.codigo === 'RECHAZADO') return -1
                    return a.numero - b.numero
                  })
                  .map(e => <option key={e.codigo} value={e.codigo}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Motivo (opcional)</label>
              <textarea
                className="field-input resize-none h-20 w-full"
                placeholder="Anotá el motivo del cambio..."
                value={motivoEstado}
                onChange={e => setMotivoEstado(e.target.value)}
              />
            </div>
            <p className="text-xs text-[#758A93] italic text-center">
              Esta acción quedará registrada en el timeline.
            </p>
          </div>
        ) : esFlujoProcesal ? (
          (() => {
            const estadoCodigo = exp.estadoProcesal ?? exp.estado
            const esAsignado = estadoCodigo === 'ASIGNADO'
            const todos = getEstadosProcesales(exp.tipo)
            const idxActual = todos.findIndex(e => e.codigo === estadoCodigo)
            const anteriores = todos.slice(0, idxActual).filter(e => !e.esArchivado)
            const codigoFinalizado = getCodigoFinalizado(exp.tipo)
            const tipoLanzamiento = String(exp.campos_mesa?.['mesa_tipo_lanzamiento'] ?? '')
            const siguienteComercial = exp.tipo === 'LANZAMIENTO_JUDICIALIZADO' && tipoLanzamiento === 'Comercial'
              ? getSiguienteLanzamiento(estadoCodigo, tipoLanzamiento)
              : null
            const codigosRamificados = siguienteComercial ? [] : getRamificaciones(estadoCodigo, exp.tipo)
            const siguientes = siguienteComercial
              ? [todos.find(e => e.codigo === siguienteComercial)].filter(Boolean) as typeof todos
              : codigosRamificados.length > 0
                ? codigosRamificados.map(cod => todos.find(e => e.codigo === cod)).filter(Boolean) as typeof todos
                : (siguienteEstadoProcesal ? [siguienteEstadoProcesal] : [])
            const idxDest = todos.findIndex(e => e.codigo === nuevoEstado)
            const esRetroceso = !esAsignado && codigosRamificados.length === 0 && !siguienteComercial && nuevoEstado !== codigoFinalizado && idxDest < idxActual
            const esTipoConFinalizacionLibre = TIPOS_FINALIZACION_LIBRE.has(exp.tipo)
            const mostrarFinalizarSiempre = esTipoConFinalizacionLibre && estadoCodigo !== codigoFinalizado &&
              !siguientes.some(e => e.codigo === codigoFinalizado)
            return (
              <div className="space-y-3">
                {!esAsignado && !esRetroceso && nuevoEstado !== codigoFinalizado && tieneTareasPendientes && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-[#fee2e2] border border-[#fca5a5] rounded-xl">
                    <Icon name="warning" size={14} className="text-[#C3292F] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#C3292F]">
                      No podés avanzar al siguiente estado mientras haya tareas en curso.
                      Completá o marcá como "No procedente" todas las tareas del estado actual.
                    </p>
                  </div>
                )}
                {esRetroceso && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-[#fef3c7] border border-[#fde68a] rounded-xl">
                    <Icon name="warning" size={14} className="text-[#d97706] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#d97706]">
                      Este es un retroceso de estado. Es una operación excepcional — el motivo es
                      obligatorio y quedará registrado en el historial de la actuación.
                    </p>
                  </div>
                )}
                <div>
                  <label className="field-label">Estado destino</label>
                  {esAsignado ? (
                    <div className="bg-[#EEEBE6] rounded-xl px-4 py-3">
                      <p className="text-xs text-[#758A93] mb-1">Próximo estado</p>
                      <p className="text-sm font-bold text-[#242C4F]">{siguienteEstadoProcesal?.label}</p>
                    </div>
                  ) : (
                    <select
                      className="field-input w-full"
                      value={nuevoEstado}
                      onChange={e => setNuevoEstado(e.target.value)}
                    >
                      {(siguientes.length > 0 || mostrarFinalizarSiempre) && (
                        <optgroup label="Avanzar">
                          {siguientes.map(e => (
                            <option key={e.codigo} value={e.codigo} disabled={tieneTareasPendientes}>
                              {e.label}{tieneTareasPendientes ? ' (tareas pendientes)' : ''}
                            </option>
                          ))}
                          {mostrarFinalizarSiempre && (
                            <option value={codigoFinalizado}>Finalizado</option>
                          )}
                        </optgroup>
                      )}
                      {anteriores.length > 0 && (
                        <optgroup label="Retroceder">
                          {[...anteriores].reverse().map(e => (
                            <option key={e.codigo} value={e.codigo}>{e.label}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  )}
                </div>
                <div>
                  <label className="field-label">
                    Motivo {esRetroceso && <span className="text-[#C3292F]">*</span>}
                    {!esRetroceso && ' (opcional)'}
                  </label>
                  <textarea
                    className="field-input resize-none h-20 w-full"
                    placeholder={esRetroceso ? 'Obligatorio: indicá el motivo del retroceso...' : 'Anotá el motivo del cambio...'}
                    value={motivoEstado}
                    onChange={e => setMotivoEstado(e.target.value)}
                  />
                </div>
                <p className="text-xs text-[#758A93] italic text-center">
                  Esta acción quedará registrada en el timeline.
                </p>
              </div>
            )
          })()
        ) : (
          <div>
            <label className="field-label">Nuevo estado</label>
            <select className="field-input w-full" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
              <option value="">Seleccionar…</option>
              {estadosPosibles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </Modal>

      {/* Modal: Finalizar actuación — causal de finalización */}
      <Modal
        open={modalCausal}
        onClose={() => { setModalCausal(false); setCausalSeleccionada(''); setCausalLibre('') }}
        titulo="Finalizar actuación"
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setModalCausal(false); setCausalSeleccionada(''); setCausalLibre('') }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarCausal}
              disabled={!causalSeleccionada && !causalLibre.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#256386] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Confirmar
            </button>
          </>
        }
      >
        {(() => {
          const grupoCausalActual = getEstadoProcesal(exp.tipo, exp.estadoProcesal ?? exp.estado)?.grupoCausal
          const opcionesCausal = getCausalesPorEstado(grupoCausalActual)
          return (
            <div className="space-y-3">
              <p className="text-xs text-[#758A93]">
                Vas a finalizar la actuación <span className="font-mono font-bold">{exp.id}</span>. Indicá la causal de finalización.
              </p>
              {opcionesCausal.length > 0 ? (
                <div>
                  <label className="field-label">Causal de finalización</label>
                  <select
                    className="field-input w-full"
                    value={causalSeleccionada}
                    onChange={e => setCausalSeleccionada(e.target.value)}
                  >
                    <option value="">Seleccionar causal...</option>
                    {opcionesCausal.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="field-label">Comentario</label>
                  <textarea
                    className="field-input resize-none h-20 w-full"
                    placeholder="Comentario sobre el motivo de finalización..."
                    value={causalLibre}
                    onChange={e => setCausalLibre(e.target.value)}
                  />
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* Modal: Agrupar a causa */}
      <Modal
        open={accion === 'causa'}
        onClose={() => setAccion(null)}
        titulo="Agrupar a causa"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarCausa}
              disabled={!nuevaCausa.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#256386] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Agrupar
            </button>
          </>
        }
      >
        <div>
          <label className="field-label">N° Causa</label>
          <input
            type="text"
            className="field-input w-full font-mono"
            placeholder="Ej: 12345/2026"
            value={nuevaCausa}
            onChange={e => setNuevaCausa(e.target.value)}
            autoFocus
          />
          <p className="field-hint">Ingresá el número de causa a la que se agrupará este expediente.</p>
        </div>
      </Modal>

      {/* Modal: Desagrupar */}
      <Modal
        open={accion === 'desagrupar'}
        onClose={() => setAccion(null)}
        titulo="Desagrupar actuación"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarDesagrupar}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:opacity-90 transition-opacity"
            >
              Desagrupar
            </button>
          </>
        }
      >
        <p className="text-sm text-[#242C4F]">
          Se desvinculará la actuación <span className="font-mono font-bold">{exp.id}</span> de la causa{' '}
          <span className="font-mono font-bold">{exp.numero_causa}</span>.
        </p>
        <p className="text-xs text-[#758A93] mt-2">Esta acción no elimina los datos de la actuación.</p>
      </Modal>

      {/* Modal: Reasignar */}
      <Modal
        open={accion === 'reasignar'}
        onClose={() => setAccion(null)}
        titulo="Reasignar actuación"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarReasignar}
              disabled={!nuevoAbogado}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#256386] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Reasignar
            </button>
          </>
        }
      >
        <div>
          <label className="field-label">Letrado/a</label>
          <select className="field-input w-full" value={nuevoAbogado} onChange={e => setNuevoAbogado(e.target.value)}>
            <option value="">Sin asignar</option>
            {abogadosArea.map(u => (
              <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Modal: Iniciar Juicio */}
      <Modal
        open={accion === 'iniciar_juicio'}
        onClose={() => setAccion(null)}
        titulo="Iniciar Juicio"
        size="lg"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarIniciarJuicio}
              disabled={MAPA_INICIAR_JUICIO[exp.tipo] === 'LANZAMIENTO_JUDICIALIZADO' && !formJuicio.tipo_lanzamiento}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#256386] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Icon name="gavel" size={16} />
              Confirmar Inicio
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Aviso */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Icon name="warning" size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">Confirmar inicio de acción judicial</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Esta acción registrará el inicio del proceso judicial para{' '}
                <span className="font-mono font-bold">{exp.id}</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* N° de Causa — siempre */}
            <div>
              <label className="field-label">N° de Causa <span className="text-[#C3292F]">*</span></label>
              <input type="text" className="field-input w-full font-mono" placeholder="FSM-XXXXX/2026"
                value={formJuicio.numero_causa}
                onChange={e => setFormJuicio(p => ({ ...p, numero_causa: e.target.value }))} />
            </div>

            {/* Secretaría — siempre */}
            <div>
              <label className="field-label">Secretaría</label>
              <input type="text" className="field-input w-full" placeholder="Ej: Secretaría N°3"
                value={formJuicio.secretaria}
                onChange={e => setFormJuicio(p => ({ ...p, secretaria: e.target.value }))} />
            </div>

            {/* Juzgado — siempre, col-span-2 */}
            <div className="col-span-2">
              <label className="field-label">Juzgado</label>
              <select className="field-input w-full"
                value={formJuicio.juzgado}
                onChange={e => setFormJuicio(p => ({ ...p, juzgado: e.target.value }))}>
                <option value="">— Seleccioná juzgado —</option>
                {ALL_JUZGADOS.map(j => <option key={j.id} value={j.id}>{j.label}</option>)}
              </select>
            </div>

            {/* Carátula — siempre, col-span-2 */}
            <div className="col-span-2">
              <label className="field-label">Carátula</label>
              <input type="text" className="field-input w-full"
                value={formJuicio.caratula}
                onChange={e => setFormJuicio(p => ({ ...p, caratula: e.target.value }))} />
            </div>

            {/* Abogado de la contraria — siempre */}
            <div>
              <label className="field-label">Abogado de la Contraria <span className="text-[#C3292F]">*</span></label>
              <input type="text" className="field-input w-full" placeholder="Dr. Apellido, Nombre"
                value={formJuicio.abogado_contraria}
                onChange={e => setFormJuicio(p => ({ ...p, abogado_contraria: e.target.value }))} />
            </div>

            {/* Parte Actora — siempre */}
            <div>
              <label className="field-label">Parte Actora <span className="text-[#C3292F]">*</span></label>
              <input type="text" className="field-input w-full" placeholder="Nombre del actor"
                value={formJuicio.parte_actora}
                onChange={e => setFormJuicio(p => ({ ...p, parte_actora: e.target.value }))} />
            </div>

            {/* Parte Demandada — siempre */}
            <div>
              <label className="field-label">Parte Demandada <span className="text-[#C3292F]">*</span></label>
              <input type="text" className="field-input w-full"
                value={formJuicio.parte_demandada}
                onChange={e => setFormJuicio(p => ({ ...p, parte_demandada: e.target.value }))} />
            </div>

            {/* Codemandados — siempre */}
            <div>
              <label className="field-label">Codemandado</label>
              <input type="text" className="field-input w-full" placeholder="Si corresponde"
                value={formJuicio.codemandados}
                onChange={e => setFormJuicio(p => ({ ...p, codemandados: e.target.value }))} />
            </div>

            {/* Fecha de Inicio — siempre */}
            <div>
              <label className="field-label">Fecha de Inicio <span className="text-[#C3292F]">*</span></label>
              <input type="date" className="field-input w-full"
                value={formJuicio.fecha_inicio}
                onChange={e => setFormJuicio(p => ({ ...p, fecha_inicio: e.target.value }))} />
            </div>

            {/* Tipo de Juicio — siempre pero opciones según tipo */}
            <div>
              <label className="field-label">Tipo de Juicio <span className="text-[#C3292F]">*</span></label>
              <select className="field-input w-full"
                value={formJuicio.tipo_juicio}
                onChange={e => setFormJuicio(p => ({ ...p, tipo_juicio: e.target.value }))}>
                <option value="">— Seleccioná —</option>
                {(exp.tipo === 'LANZAMIENTO'
                  ? ['LANZAMIENTO', 'DESALOJO', 'RECUPERACIÓN DE INMUEBLE', 'OTROS']
                  : ['DAÑOS Y PERJUICIOS', 'COBRO DE SUMAS DE DINERO', 'EJECUTIVO O PREPARACIÓN VÍA EJECUTIVA',
                     'ACCIDENTE - ACCIÓN CIVIL', 'AMPARO', 'BENEFICIO DE LSG', 'CONSIGNACIÓN', 'OTROS']
                ).map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Ubicación — solo LANZAMIENTO, col-span-2 */}
            {exp.tipo === 'LANZAMIENTO' && (
              <div className="col-span-2">
                <label className="field-label">Ubicación del inmueble</label>
                <input type="text" className="field-input w-full" placeholder="Ej: Km 12 — Línea Roca — Lomas de Zamora"
                  value={formJuicio.ubicacion}
                  onChange={e => setFormJuicio(p => ({ ...p, ubicacion: e.target.value }))} />
              </div>
            )}

            {/* Línea Ferroviaria — solo LANZAMIENTO */}
            {exp.tipo === 'LANZAMIENTO' && (
              <div>
                <label className="field-label">Línea Ferroviaria</label>
                <select className="field-input w-full"
                  value={formJuicio.linea}
                  onChange={e => setFormJuicio(p => ({ ...p, linea: e.target.value }))}>
                  <option value="">— Seleccioná —</option>
                  {['ROCA','SAN MARTÍN','SARMIENTO','MITRE','BELGRANO SUR','REGIONALES','LARGA DISTANCIA','CENTRAL','TREN DE LA COSTA']
                    .map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            )}

            {/* Tipo de lanzamiento — solo si el documento nuevo es LANZAMIENTO_JUDICIALIZADO. Determina el circuito Operativo/Comercial (ver Sección 13). Se completa una única vez, después queda bloqueado en Datos Maestros. */}
            {MAPA_INICIAR_JUICIO[exp.tipo] === 'LANZAMIENTO_JUDICIALIZADO' && (
              <div className="col-span-2">
                <label className="field-label">Tipo de lanzamiento <span className="text-[#C3292F]">*</span></label>
                <select className="field-input w-full"
                  value={formJuicio.tipo_lanzamiento}
                  onChange={e => setFormJuicio(p => ({ ...p, tipo_lanzamiento: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  <option value="Operativo">Operativo</option>
                  <option value="Comercial">Comercial</option>
                </select>
                <p className="text-[10px] text-[#9AA6B2] mt-1">
                  Determina el circuito de estados a seguir. Una vez guardado, este campo queda bloqueado.
                </p>
              </div>
            )}

            {/* OJ y Monto — solo si NO es LANZAMIENTO */}
            {exp.tipo !== 'LANZAMIENTO' && (
              <div>
                <label className="field-label">Oficio Judicial (OJ)</label>
                <input type="text" className="field-input w-full" placeholder="OJ-2026-XXXX"
                  value={formJuicio.oficio_judicial}
                  onChange={e => setFormJuicio(p => ({ ...p, oficio_judicial: e.target.value }))} />
              </div>
            )}
            {exp.tipo !== 'LANZAMIENTO' && (
              <div>
                <label className="field-label">Monto de la Demanda <span className="text-[#C3292F]">*</span></label>
                <input type="number" className="field-input w-full" placeholder="$ 0"
                  value={formJuicio.monto}
                  onChange={e => setFormJuicio(p => ({ ...p, monto: e.target.value }))} />
              </div>
            )}
            {exp.tipo !== 'LANZAMIENTO' && (
              <div>
                <label className="field-label">Coactores</label>
                <input type="text" className="field-input w-full" placeholder="Si corresponde"
                  value={formJuicio.coactores}
                  onChange={e => setFormJuicio(p => ({ ...p, coactores: e.target.value }))} />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: Nueva Querella */}
      <Modal
        open={accion === 'nueva_querella'}
        onClose={() => { setAccion(null); setFormQuerella(BLANK_QUERELLA) }}
        titulo="Nueva Querella"
        size="md"
        footer={
          <>
            <button onClick={() => { setAccion(null); setFormQuerella(BLANK_QUERELLA) }} className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarNuevaQuerella}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#256386] text-white hover:opacity-90 transition-opacity"
            >
              <Icon name="gavel" size={16} />
              Iniciar Querella
            </button>
          </>
        }
      >
        <div className="space-y-3 py-1">

          {/* Info del origen */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f0f7ff] border border-[#E4EDF2]">
            <Icon name="info" size={14} className="text-[#1b7a8a] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[12px] font-semibold text-[#242C4F] mb-0.5">
                Se creará una nueva actuación de tipo Querella
              </p>
              <p className="text-[11px] text-[#758A93]">
                La Querella quedará vinculada a esta Carta SAE y pasará a ser la actuación principal dentro de la causa.
              </p>
            </div>
          </div>

          {/* Carátula */}
          <div>
            <label className="field-label">Carátula <span className="text-[#C3292F]">*</span></label>
            <input type="text" className="field-input w-full" placeholder="SOFSE S.A. C/ NN S/ QUERELLA"
              value={formQuerella.caratula}
              onChange={e => setFormQuerella(p => ({ ...p, caratula: e.target.value }))} />
          </div>

          {/* Fuero + Juzgado en cascada */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Fuero</label>
              <select className="field-input w-full"
                value={formQuerella.juzgado_fuero}
                onChange={e => setFormQuerella(p => ({ ...p, juzgado_fuero: e.target.value, juzgado: '' }))}>
                <option value="">Seleccionar...</option>
                {FUEROS_PENAL.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Juzgado / Tribunal</label>
              <select className="field-input w-full"
                value={formQuerella.juzgado}
                disabled={!formQuerella.juzgado_fuero}
                onChange={e => setFormQuerella(p => ({ ...p, juzgado: e.target.value }))}>
                <option value="">
                  {formQuerella.juzgado_fuero ? 'Seleccionar...' : 'Primero elegí un fuero'}
                </option>
                {getJuzgadosPorFuero(formQuerella.juzgado_fuero).map(j => (
                  <option key={j.nombre} value={j.nombre}>{j.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fiscalía */}
          <div>
            <label className="field-label">Fiscalía</label>
            <input type="text" className="field-input w-full" placeholder="Fiscalía interviniente"
              value={formQuerella.fiscalia}
              onChange={e => setFormQuerella(p => ({ ...p, fiscalia: e.target.value }))} />
          </div>

          {/* N° de Causa */}
          <div>
            <label className="field-label">N° de Causa / IPP</label>
            <input type="text" className="field-input w-full font-mono" placeholder="Ej: 88.441/2024"
              value={formQuerella.numero_causa}
              onChange={e => setFormQuerella(p => ({ ...p, numero_causa: e.target.value }))} />
          </div>

          {/* Letrado asignado */}
          <div>
            <label className="field-label">Letrado asignado</label>
            <select className="field-input w-full"
              value={formQuerella.abogado_id}
              onChange={e => setFormQuerella(p => ({ ...p, abogado_id: e.target.value }))}>
              <option value="">Sin asignar</option>
              {USUARIOS.filter(u => u.rolSistema === 'ABOGADO' || u.rolSistema === 'COORDINADOR').map(u => (
                <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>
              ))}
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="field-label">Observaciones</label>
            <textarea className="field-input w-full resize-none" style={{ minHeight: 64 }}
              placeholder="Motivo de la querella..."
              value={formQuerella.observaciones}
              onChange={e => setFormQuerella(p => ({ ...p, observaciones: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
