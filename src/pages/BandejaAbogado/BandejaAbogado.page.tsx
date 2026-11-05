import { Fragment, useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { usePjnStore } from '../../store/pjn.store'
import { ConsultarNovedadPjnModal } from '../../components/pjn/ConsultarNovedadPjnModal'
import { construirFilasBandejaExport, exportarBandejaExcel } from '../../utils/exportBandeja'
import { TIPOS_GESTION, esTipoDocumental } from '../../data/catalogos'
import { USUARIOS, getNombreCompleto, getUsuarioById, puedeReasignar, esAbogadoPenal } from '../../data/usuarios'

import { AreaBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { formatFecha } from '../../utils/format'
import { formatNumeroCausaPjn } from '../../utils/numeroCausa'
import { RUTAS } from '../../utils/routing'
import { getAlertaExpediente, getAlertaTimer, type EstadoAlerta } from '../../utils/alertas'
import { labelEstado } from '../../utils/estadoLabel'
import type { Area, Expediente, TipoGestion } from '../../types'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'

// ─── Constants ─────────────────────────────────────────────────────────────────

// 'ARCHIVO' es el código de estado terminal real del ciclo Penal (etapasPenales.ts) —
// distinto de 'ARCHIVADO'/'ARCHIVADA' que usan los demás tipos.
// Incluye los terminales de los ciclos procesales C/L (Delta 13) — mismo criterio que homeShared.
const ESTADOS_CERRADO = ['ARCHIVADO', 'ARCHIVADA', 'ARCHIVO', 'CERRADO', 'CUMPLIDO', 'COMPLETADA', 'FINALIZADO', 'TERMINADO', 'DEVUELTO_SECTOR_REQUIRENTE', 'CUMPLIDO_ACUERDO', 'CUMPLIDO_SIN_ACUERDO', 'NO_ASUME_REPRESENTACION'] as const

// ─── Types & helpers ───────────────────────────────────────────────────────────

type ItemBandeja =
  | { kind: 'causa'; numeroCausa: string; expedientes: Expediente[] }
  | { kind: 'suelto'; exp: Expediente }

function construirItems(exps: Expediente[]): ItemBandeja[] {
  const causaMap: Record<string, Expediente[]> = {}
  const sueltos: Expediente[] = []
  exps.forEach(e => {
    const nc = (e.numero_causa ?? '').trim()
    if (nc && nc.toUpperCase() !== 'SS') {
      if (!causaMap[nc]) causaMap[nc] = []
      causaMap[nc].push(e)
    } else {
      sueltos.push(e)
    }
  })
  const items: ItemBandeja[] = []
  Object.entries(causaMap).forEach(([nc, es]) => items.push({ kind: 'causa', numeroCausa: nc, expedientes: es }))
  sueltos.forEach(e => items.push({ kind: 'suelto', exp: e }))
  return items
}

const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS_GESTION.map(t => [t.code, t.label]))

const filterInputCls =
  'w-full text-sm py-1 px-2 rounded-md border border-gray-300 bg-white ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300'

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BandejaAbogadoPage() {
  const navigate = useNavigate()
  const { expedientes, actualizarExpediente, asignarAbogado, tareasMap } = useExpedientesStore()
  const { usuarioActivo, busquedaGlobal } = useUIStore()
  const { novedades: novedadesPjn } = usePjnStore()
  const expedientesConNovedadPjn = new Set(
    novedadesPjn.filter(n => n.estado === 'pendiente').map(n => n.expediente_id)
  )
  const [searchParams] = useSearchParams()

  const rolSistema  = usuarioActivo?.rolSistema
  const esCoordi    = rolSistema === 'COORDINADOR'
  const esReferente = rolSistema === 'REFERENTE'
  const esAbogado   = !esCoordi && !esReferente

  const buscarInicial = busquedaGlobal || searchParams.get('q') || ''

  const filtroInicial = useMemo(() => ({
    buscar:     buscarInicial,
    // Deep-link desde Principal (`?area=`, string vacío incluido = "todas mis áreas"): tiene
    // prioridad sobre el default de COORDINADOR (su primera área). El `poolBase` ya restringe
    // COORDINADOR a sus áreas y REFERENTE a todo, así que un `?area=` vacío no amplía el pool.
    area:       esCoordi ? (searchParams.get('area') ?? usuarioActivo?.areas[0] ?? '') : (searchParams.get('area') ?? ''),
    tipo:       searchParams.get('tipo') ?? '',
    estado:     searchParams.get('estado') ?? '',
    // Deep-link desde Principal (`?letrado=`), con el default actual de ABOGADO si no viene.
    letrado:    searchParams.get('letrado') ?? (esAbogado ? (usuarioActivo?.id ?? '') : ''),
    fechaDesde: searchParams.get('fechaDesde') ?? '',
    fechaHasta: '',
    soloUrgentes: searchParams.get('urgente') === '1',
    soloAlerta:   searchParams.get('alerta') === '1',
    parte:        searchParams.get('parte') ?? '', // deep-link desde Principal: valor exacto de campos_mesa.mesa_tipo_intervencion ('Actora' | 'Demandada' | 'Denunciante' | 'Actuación de Oficio' | 'Sin Intervención')
    clase:        searchParams.get('clase') ?? '', // deep-link desde Principal: 'causa' | 'documento' (ver TIPOS_DOCUMENTALES en catalogos.ts)
  }), [usuarioActivo?.id, esCoordi, esAbogado, buscarInicial, searchParams])

  const [tabEstado,      setTabEstado]      = useState<'activos' | 'archivados'>(
    searchParams.get('tab') === 'archivados' ? 'archivados' : 'activos'
  )
  const [filtros,        setFiltros]        = useState(filtroInicial)
  const [menuAbierto,    setMenuAbierto]    = useState<string | null>(null)
  const [menuPos,        setMenuPos]        = useState({ top: 0, right: 0 })
  const [modalAgrupar,   setModalAgrupar]   = useState<string | null>(null)
  const [inputCausa,     setInputCausa]     = useState('')
  const [expandedCausas, setExpandedCausas] = useState<Set<string>>(new Set())
  const [expADesagrupar,  setExpADesagrupar]  = useState<Expediente | null>(null)
  const [modalReasignar,  setModalReasignar]  = useState<Expediente | null>(null)
  const [modalConsultarPjn, setModalConsultarPjn] = useState<Expediente | null>(null)
  const [nuevoAbogadoId,  setNuevoAbogadoId]  = useState('')

  // Resetear filtros cuando cambia el usuario activo
  useEffect(() => {
    setFiltros(filtroInicial)
  }, [usuarioActivo?.id])

  // Si el usuario escribe en el buscador global (desde esta u otra página), reflejarlo en el filtro
  useEffect(() => {
    if (busquedaGlobal) {
      setFiltros(prev => ({ ...prev, buscar: busquedaGlobal }))
    }
  }, [busquedaGlobal])

  // Cerrar menú contextual al click fuera
  useEffect(() => {
    if (!menuAbierto) return
    const h = () => setMenuAbierto(null)
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [menuAbierto])

  // ── Computed ──────────────────────────────────────────────────────────────────

  const poolBase = useMemo(() => {
    if (esReferente) return expedientes
    if (esCoordi) {
      const misAreas = usuarioActivo?.areas ?? []
      return expedientes.filter(e => misAreas.includes(e.area as Area))
    }
    return expedientes.filter(e => e.abogado_id === usuarioActivo?.id)
  }, [expedientes, usuarioActivo, esCoordi, esReferente])

  const expedientesFiltrados = useMemo(() => {
    return poolBase.filter(e => {
      const esCerrado = ESTADOS_CERRADO.includes(e.estado as typeof ESTADOS_CERRADO[number])
      if (tabEstado === 'activos'     &&  esCerrado) return false
      if (tabEstado === 'archivados'  && !esCerrado) return false
      if (filtros.letrado   && e.abogado_id !== filtros.letrado)   return false
      if (filtros.area      && e.area !== filtros.area)             return false
      if (filtros.tipo      && e.tipo !== filtros.tipo)             return false
      // El select de la tabla filtra por `estado`; el deep-link "Por estado procesal" de la
      // pantalla Principal usa `estadoProcesal`. Se acepta cualquiera de los dos para que el
      // contador de la Principal y el resultado de la Bandeja no se contradigan.
      if (filtros.estado && e.estado !== filtros.estado && (e.estadoProcesal ?? e.estado) !== filtros.estado) return false
      if (filtros.fechaDesde && e.fecha_recepcion < filtros.fechaDesde) return false
      if (filtros.fechaHasta && e.fecha_recepcion > filtros.fechaHasta) return false
      if (filtros.soloUrgentes && !e.es_urgente) return false
      if (filtros.soloAlerta && !getAlertaExpediente(e.id, tareasMap, e.timeline).activa && !getAlertaTimer(e).activa) return false
      // Una actuación sin tipo de intervención cargado cuenta como 'Sin Intervención' —
      // mismo criterio que usa el contador de la pantalla Principal (useHomeData), para que
      // el número del contador y el resultado del deep-link no se contradigan.
      if (filtros.parte) {
        const tipoInterv = String(e.campos_mesa?.['mesa_tipo_intervencion'] ?? '') || 'Sin Intervención'
        if (tipoInterv !== filtros.parte) return false
      }
      // Causa vs. documento: por TIPO de gestión (TIPOS_DOCUMENTALES), no por n° de causa.
      if (filtros.clase === 'documento' && !esTipoDocumental(e.tipo)) return false
      if (filtros.clase === 'causa'     &&  esTipoDocumental(e.tipo)) return false
      if (filtros.buscar) {
        const q = filtros.buscar.toLowerCase()
        const campos = [
          e.id,
          e.caratula,
          e.numero_causa ?? '',
          e.numero_ee_gde ?? '',
          TIPO_LABEL[e.tipo] ?? e.tipo,
        ]
        return campos.some(c => c?.toLowerCase().includes(q))
      }
      return true
    })
  }, [poolBase, filtros, tareasMap])

  const items = useMemo(() => construirItems(expedientesFiltrados), [expedientesFiltrados])

  const contadorAlerta = useMemo(() =>
    expedientesFiltrados.filter(e =>
      getAlertaExpediente(e.id, tareasMap, e.timeline).activa || getAlertaTimer(e).activa
    ).length
  , [expedientesFiltrados, tareasMap])

  const tiposUnicos = useMemo(() =>
    [...new Set(poolBase.map(e => e.tipo))]
      .map(code => ({ code, label: TIPO_LABEL[code] ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [poolBase]
  )
  const estadosUnicos = useMemo(() =>
    [...new Set(poolBase.map(e => e.estado))].sort(),
    [poolBase]
  )

  const causasExistentes = useMemo(() => {
    if (!inputCausa.trim()) return []
    const q = inputCausa.toLowerCase()
    return [...new Set(
      expedientes
        .filter(e => e.numero_causa && e.numero_causa.toUpperCase() !== 'SS')
        .map(e => e.numero_causa!)
        .filter(nc => nc.toLowerCase().includes(q))
    )]
  }, [expedientes, inputCausa])

  const activosCount = useMemo(() =>
    poolBase.filter(e => !ESTADOS_CERRADO.includes(e.estado as typeof ESTADOS_CERRADO[number])).length,
    [poolBase]
  )

  const mostrarColumnaLetrado = esCoordi || esReferente

  const abogadosDisponibles = useMemo(() =>
    USUARIOS.filter(u =>
      u.rolSistema === 'ABOGADO' &&
      (esCoordi || esReferente
        ? (usuarioActivo?.areas ?? []).some(a => u.areas.includes(a as Area))
        : true)
    ).sort((a, b) => a.apellido.localeCompare(b.apellido))
  , [usuarioActivo, esCoordi, esReferente])

  // ── Actions ───────────────────────────────────────────────────────────────────

  function setFiltro(key: string, val: string | boolean) {
    setFiltros(prev => ({ ...prev, [key]: val }))
  }

  function limpiarFiltros() {
    setFiltros(filtroInicial)
  }

  function expandAll() {
    setExpandedCausas(new Set(
      items.filter((i): i is Extract<ItemBandeja, { kind: 'causa' }> => i.kind === 'causa')
           .map(i => i.numeroCausa)
    ))
  }

  function collapseAll() { setExpandedCausas(new Set()) }

  function handleExportarExcel() {
    const filas = construirFilasBandejaExport(items, expedientesFiltrados, poolBase, {
      letrado: filtros.letrado,
      area: filtros.area,
    })
    const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    exportarBandejaExcel(filas, `Bandeja_Actuaciones_${hoy}`)
    toast.success('Excel exportado.')
  }

  function abrirMenu(e: React.MouseEvent<HTMLButtonElement>, expId: string) {
    e.stopPropagation()
    if (menuAbierto === expId) { setMenuAbierto(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    const menuHeight = 120
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4
    setMenuPos({ top, right: window.innerWidth - rect.right })
    setMenuAbierto(expId)
  }

  function confirmarReasignar() {
    if (!modalReasignar || !nuevoAbogadoId) return
    asignarAbogado(modalReasignar.id, nuevoAbogadoId)
    toast.success('Actuación reasignada.')
    setModalReasignar(null)
    setNuevoAbogadoId('')
  }

  function confirmarDesagrupar() {
    if (!expADesagrupar) return
    actualizarExpediente(expADesagrupar.id, { numero_causa: null })
    toast.success('Actuación desagrupada correctamente.')
    setExpADesagrupar(null)
  }

  function confirmarAgrupar() {
    if (!inputCausa.trim() || !modalAgrupar) return
    actualizarExpediente(modalAgrupar, { numero_causa: inputCausa.trim() })
    toast.success('Actuación agrupada a la causa correctamente.')
    setModalAgrupar(null)
    setInputCausa('')
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  function renderMenu(exp: Expediente) {
    const sinCausa = !exp.numero_causa || exp.numero_causa.toUpperCase() === 'SS'
    return (
      <div
        style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 50 }}
        className="bg-white border border-gray-200 rounded-md shadow-lg py-1 w-48"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => { navigate(RUTAS.EXPEDIENTE(exp.id)); setMenuAbierto(null) }}
        >
          <Icon name="open_in_new" size={16} />
          Visualizar
        </button>
        {puedeReasignar(usuarioActivo) && (
          <>
            <div className="my-1 border-t border-gray-200" />
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                setModalReasignar(exp)
                setNuevoAbogadoId(exp.abogado_id ?? '')
                setMenuAbierto(null)
              }}
            >
              <Icon name="person_search" size={16} />
              Reasignar
            </button>
          </>
        )}
        {sinCausa ? (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => { setModalAgrupar(exp.id); setMenuAbierto(null) }}
          >
            <Icon name="folder_open" size={16} />
            Agrupar a causa
          </button>
        ) : (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => { setExpADesagrupar(exp); setMenuAbierto(null) }}
          >
            <Icon name="link_off" size={16} />
            Desagrupar
          </button>
        )}
        {!!exp.numero_causa && (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => { setModalConsultarPjn(exp); setMenuAbierto(null) }}
          >
            <Icon name="search" size={16} />
            Consultar Novedad PJN
          </button>
        )}
      </div>
    )
  }

  function renderExpRow(exp: Expediente, idx: number, arr: Expediente[], isSuelto: boolean = false) {
    const isLast = idx === arr.length - 1
    const tieneCausa =
      exp.numero_causa &&
      exp.numero_causa.trim() !== '' &&
      exp.numero_causa.toUpperCase() !== 'SS SOFSE'
    const letrado = exp.abogado_id ? getUsuarioById(exp.abogado_id) : undefined

    return (
      <tr
        key={exp.id}
        className="hover:bg-gray-50 transition-colors"
      >
        {/* Connector */}
        <td className="w-10 px-4 py-3 relative">
          {tieneCausa ? (
            <div className="relative min-h-[56px]">
              <div className={`absolute left-3 w-px bg-gray-200 ${isLast ? 'top-0 h-1/2' : 'top-0 bottom-0'}`} />
              <div className="absolute left-3 top-1/2 w-3 h-px bg-gray-200" />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 text-gray-400">
                <Icon name="description" size={16} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center text-gray-400">
                <Icon name="description" size={18} />
              </div>
            </div>
          )}
        </td>
        {/* N° + badges */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-medium text-blue-700">{exp.id}</span>
            {exp.es_principal && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white">Principal</span>
            )}
          </span>
          {isSuelto && (
            <span className="block text-xs text-gray-400 italic">Sin causa</span>
          )}
          {(() => {
            const alertaTareas = getAlertaExpediente(exp.id, tareasMap, exp.timeline)
            const alertaTimer  = getAlertaTimer(exp)
            const timerVencido = alertaTimer.activa && alertaTimer.diasRestantes !== undefined && alertaTimer.diasRestantes <= 0
            const estadoFinal: EstadoAlerta =
              alertaTareas.estado === 'vencido' || timerVencido
                ? 'vencido'
                : alertaTareas.estado === 'por_vencer' || alertaTimer.activa
                  ? 'por_vencer'
                  : 'ninguna'
            if (estadoFinal === 'ninguna') return null
            if (estadoFinal === 'vencido') {
              const tooltip = alertaTareas.nombreElemento
                ? `Vencido: ${alertaTareas.nombreElemento}`
                : 'Plazo vencido'
              return (
                <span title={tooltip} className="flex items-center gap-1 text-[10px] font-semibold text-red-600 cursor-default">
                  <Icon name="warning" size={12} className="shrink-0" />
                  VENCIDO
                </span>
              )
            }
            const tooltip = alertaTimer.activa
              ? `Plazo procesal: vence ${formatFecha(alertaTimer.fechaVencimiento!)} (${alertaTimer.diasRestantes} días restantes)`
              : alertaTareas.nombreElemento
                ? `Por vencer: ${alertaTareas.nombreElemento}${alertaTareas.fechaVencimiento ? ` — ${formatFecha(alertaTareas.fechaVencimiento)}` : ''}`
                : 'Tarea por vencer'
            return (
              <span title={tooltip} className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 cursor-default">
                <Icon name="schedule" size={12} className="shrink-0" />
                POR VENCER{alertaTimer.activa && alertaTimer.diasRestantes !== undefined ? ` · ${alertaTimer.diasRestantes}d` : ''}
              </span>
            )
          })()}
          {exp.es_urgente && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
              <Icon name="warning" size={12} className="shrink-0" />
              URGENTE
            </span>
          )}
          {expedientesConNovedadPjn.has(exp.id) && (
            <span
              title="Novedades detectadas por PJN"
              className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold"
            >
              <Icon name="refresh" size={9} />
              PJN
            </span>
          )}
        </td>
        {/* Carátula */}
        <td className="px-4 py-3 max-w-xs">
          <p className="text-sm text-gray-900 line-clamp-2">{exp.caratula}</p>
          {exp.numero_causa && (
            <p className="text-xs text-gray-400 mt-0.5">{formatNumeroCausaPjn(exp)}</p>
          )}
        </td>
        {/* Área */}
        <td className="px-4 py-3"><AreaBadge area={exp.area} /></td>
        {/* Tipo */}
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{TIPO_LABEL[exp.tipo] ?? exp.tipo}</td>
        {/* Letrado (condicional) */}
        {mostrarColumnaLetrado && (
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
            {letrado ? getNombreCompleto(letrado) : <span className="text-gray-400">—</span>}
          </td>
        )}
        {/* Estado */}
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{labelEstado(exp)}</td>
        {/* Recepción */}
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatFecha(exp.fecha_recepcion)}</td>
        {/* Menú */}
        <td className="px-4 py-3 text-center">
          <button
            className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
            onClick={e => abrirMenu(e, exp.id)}
          >
            <Icon name="more_vert" size={18} />
          </button>
          {menuAbierto === exp.id && renderMenu(exp)}
        </td>
      </tr>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const colSpanTotal = mostrarColumnaLetrado ? 9 : 8

  return (
    <div className="p-6 space-y-4">

      {/* HEADER: título a la izquierda, acciones a la derecha (PRD) */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Actuaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestionando {activosCount} actuación{activosCount !== 1 ? 'es' : ''} activa{activosCount !== 1 ? 's' : ''}
          </p>
        </div>

      {/* BARRA DE ACCIONES */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {esAbogadoPenal(usuarioActivo) && (
          <button
            onClick={() => navigate(RUTAS.NUEVA_ACTUACION_PENAL)}
            className="px-4 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800 inline-flex items-center gap-1"
          >
            <Icon name="add" size={16} />
            Nueva Actuación
          </button>
        )}

        <div className="inline-flex">
          {(['activos', 'archivados'] as const).map(val => (
            <button
              key={val}
              onClick={() => setTabEstado(val)}
              className={`px-4 py-1.5 text-sm font-medium border transition-colors ${
                val === 'activos' ? 'rounded-l-md' : 'rounded-r-md -ml-px'
              } ${
                tabEstado === val
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {val === 'activos' ? 'Activos' : 'Archivados'}
            </button>
          ))}
        </div>

        <button onClick={expandAll} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors border-gray-300 text-gray-600 hover:bg-gray-50">
          <Icon name="unfold_more" size={14} />
          Expandir todo
        </button>
        <button onClick={collapseAll} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors border-gray-300 text-gray-600 hover:bg-gray-50">
          <Icon name="unfold_less" size={14} />
          Colapsar todo
        </button>
        <button
          onClick={() => setFiltros(p => ({ ...p, soloUrgentes: !p.soloUrgentes }))}
          className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors ${
            filtros.soloUrgentes
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Icon name="fire" size={14} />
          Urgentes
        </button>
        <button
          onClick={() => setFiltros(p => ({ ...p, soloAlerta: !p.soloAlerta }))}
          className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors ${
            filtros.soloAlerta
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Icon name="warning" size={14} />
          Por vencer
          {contadorAlerta > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {contadorAlerta}
            </span>
          )}
        </button>
        <button onClick={limpiarFiltros} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors border-gray-300 text-gray-600 hover:bg-gray-50">
          <Icon name="close" size={14} />
          Limpiar filtros
        </button>
        <button
          onClick={handleExportarExcel}
          disabled={items.length === 0}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="download" size={14} />
          Exportar Excel
        </button>
      </div>
      </div>

      {/* TABLA */}
      {poolBase.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <Icon name="inbox" size={48} />
          <p className="mt-4 text-gray-500 text-sm">No tenés expedientes asignados.</p>
        </div>
      ) : (
        <div className="bg-white border border-black/20 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 min-w-[780px]">
              <thead>
                {/* Fila 1: labels */}
                <tr className="bg-gray-50">
                  <th className="w-10 px-4 py-3 border-b border-gray-200" />
                  <th className="w-52 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-gray-200 whitespace-nowrap">N° Causa / Exp.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-gray-200 whitespace-nowrap">Carátula</th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-gray-200 whitespace-nowrap">Área</th>
                  <th className="w-36 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-gray-200 whitespace-nowrap">Tipo</th>
                  {mostrarColumnaLetrado && (
                    <th className="w-36 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-gray-200 whitespace-nowrap">Letrado</th>
                  )}
                  <th className="w-28 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-gray-200 whitespace-nowrap">Estado</th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-gray-200 whitespace-nowrap">Recepción</th>
                  <th className="w-16 px-4 py-3 border-b border-gray-200" />
                </tr>

                {/* Fila 2: inputs de filtro */}
                <tr className="bg-gray-100">
                  <th className="px-4 py-2" />
                  <th className="px-4 py-2">
                    <input type="text" placeholder="Causa / N°…" value={filtros.buscar} onChange={e => setFiltro('buscar', e.target.value)} className={filterInputCls} />
                  </th>
                  <th className="px-4 py-2">
                    <input type="text" placeholder="Carátula…" value={filtros.buscar} onChange={e => setFiltro('buscar', e.target.value)} className={filterInputCls} />
                  </th>
                  <th className="px-4 py-2">
                    <select value={filtros.area} onChange={e => setFiltro('area', e.target.value)} className={filterInputCls}>
                      <option value="">Todas</option>
                      <option value="CIVIL">Civil</option>
                      <option value="LABORAL">Laboral</option>
                      <option value="PENAL">Penal</option>
                    </select>
                  </th>
                  <th className="px-4 py-2">
                    <select value={filtros.tipo} onChange={e => setFiltro('tipo', e.target.value as TipoGestion | '')} className={filterInputCls}>
                      <option value="">Todos</option>
                      {tiposUnicos.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </th>
                  <th className="px-4 py-2">
                    <select value={filtros.letrado} onChange={e => setFiltro('letrado', e.target.value)} className={filterInputCls}>
                      <option value="">Todos</option>
                      <option value={usuarioActivo?.id ?? ''} style={{ fontWeight: 'bold' }}>★ Mis actuaciones</option>
                      <option disabled>──────────────</option>
                      {abogadosDisponibles
                        .filter(u => u.id !== usuarioActivo?.id)
                        .map(u => (
                          <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
                        ))
                      }
                    </select>
                  </th>
                  <th className="px-4 py-2">
                    <select value={filtros.estado} onChange={e => setFiltro('estado', e.target.value)} className={filterInputCls}>
                      <option value="">Todos</option>
                      {estadosUnicos.map(est => <option key={est} value={est}>{est}</option>)}
                    </select>
                  </th>
                  <th className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <input type="date" value={filtros.fechaDesde} onChange={e => setFiltro('fechaDesde', e.target.value)} className={filterInputCls} />
                      <input type="date" value={filtros.fechaHasta} onChange={e => setFiltro('fechaHasta', e.target.value)} className={filterInputCls} />
                    </div>
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={colSpanTotal} className="py-16 text-center text-gray-500 text-sm">
                      <Icon name="search_off" className="block mb-3" size={40} />
                      Sin resultados para los filtros aplicados.
                    </td>
                  </tr>
                )}
                {items.map(item => {
                  if (item.kind === 'causa') {
                    const { numeroCausa, expedientes: exps } = item
                    const principal = exps.find(e => e.es_principal) ?? exps[0]
                    const areasBadges = [...new Set(exps.map(e => e.area))] as Area[]
                    const isExpanded = expandedCausas.has(numeroCausa)

                    return (
                      <Fragment key={numeroCausa}>
                        <tr
                          className="bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => setExpandedCausas(prev => {
                            const next = new Set(prev)
                            next.has(numeroCausa) ? next.delete(numeroCausa) : next.add(numeroCausa)
                            return next
                          })}
                        >
                          <td className="w-10 px-4 py-3 text-center">
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-900 text-white hover:bg-blue-800 mx-auto">
                              <Icon name="chevron_right" size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <Icon name="folder" size={16} className="text-blue-900" />
                              <span className="font-medium text-gray-800 whitespace-nowrap">{formatNumeroCausaPjn(principal)}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {exps.length} actuación{exps.length !== 1 ? 'es' : ''} agrupada{exps.length !== 1 ? 's' : ''}
                            </p>
                          </td>
                          <td className="px-4 py-3 max-w-[280px]">
                            <p className="text-sm text-gray-900 line-clamp-2">{principal.caratula}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {areasBadges.map(a => <AreaBadge key={a} area={a} />)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                              <Icon name="link" size={11} />
                              Causa judicial
                            </span>
                          </td>
                          {mostrarColumnaLetrado && <td className="px-4 py-3" />}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{labelEstado(principal)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatFecha(principal.fecha_recepcion)}</td>
                          <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(RUTAS.CAUSA(numeroCausa))}
                              className="text-sm text-blue-700 hover:underline whitespace-nowrap cursor-pointer"
                            >
                              Ver todo
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (() => {
                          // El principal siempre va primero; el resto conserva su orden relativo (sort estable).
                          const expsOrdenados = [...exps].sort((a, b) => {
                            if (a.es_principal && !b.es_principal) return -1
                            if (!a.es_principal && b.es_principal) return 1
                            return 0
                          })
                          return expsOrdenados.map((exp, idx, arr) => renderExpRow(exp, idx, arr))
                        })()}
                      </Fragment>
                    )
                  }
                  return renderExpRow(item.exp, 0, [item.exp], true)
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
            Mostrando {expedientesFiltrados.length === 0 ? 0 : 1}–{expedientesFiltrados.length} de{' '}
            <span className="font-semibold">{expedientesFiltrados.length}</span>
          </div>
        </div>
      )}

      {/* MODAL AGRUPAR */}
      <Modal
        open={!!modalAgrupar}
        onClose={() => { setModalAgrupar(null); setInputCausa('') }}
        titulo="Agrupar a Causa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalAgrupar(null); setInputCausa('') }}>Cancelar</Button>
            <Button variant="primary" onClick={confirmarAgrupar} disabled={!inputCausa.trim()}>Confirmar</Button>
          </>
        }
      >
        <FormField label="N° de Causa" required hint="Ingresá el número de causa o seleccioná una existente">
          <input
            type="text"
            className="field-input font-mono"
            placeholder="Ej: 12345/2026"
            value={inputCausa}
            onChange={e => setInputCausa(e.target.value)}
          />
        </FormField>
        {causasExistentes.length > 0 && (
          <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-sm max-h-32 overflow-y-auto">
            {causasExistentes.map(nc => (
              <button
                key={nc}
                className="w-full text-left px-3 py-2 text-sm font-mono text-gray-800 hover:bg-gray-100 transition-colors"
                onClick={() => setInputCausa(nc)}
              >
                {nc}
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* MODAL CONSULTAR NOVEDAD PJN (manual) */}
      {modalConsultarPjn && (
        <ConsultarNovedadPjnModal
          expediente={modalConsultarPjn}
          open={!!modalConsultarPjn}
          onClose={() => setModalConsultarPjn(null)}
        />
      )}

      {/* MODAL REASIGNAR */}
      <Modal
        open={!!modalReasignar}
        onClose={() => { setModalReasignar(null); setNuevoAbogadoId('') }}
        titulo="Reasignar actuación"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalReasignar(null); setNuevoAbogadoId('') }}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!nuevoAbogadoId || nuevoAbogadoId === modalReasignar?.abogado_id}
              onClick={confirmarReasignar}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <div className="bg-gray-100 rounded-lg px-4 py-3 space-y-1">
            <p className="text-xs font-semibold font-mono text-gray-800">{modalReasignar?.id}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{modalReasignar?.caratula}</p>
          </div>
          <div>
            <label className="field-label">Letrado asignado</label>
            <select
              className="field-input w-full"
              value={nuevoAbogadoId}
              onChange={e => setNuevoAbogadoId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {USUARIOS
                .filter(u =>
                  u.rolSistema === 'ABOGADO' &&
                  modalReasignar?.area &&
                  u.areas.includes(modalReasignar.area as Area)
                )
                .map(u => (
                  <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
                ))
              }
            </select>
          </div>
        </div>
      </Modal>

      {/* MODAL DESAGRUPAR */}
      <Modal
        open={!!expADesagrupar}
        onClose={() => setExpADesagrupar(null)}
        titulo="Desagrupar actuación"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExpADesagrupar(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmarDesagrupar}>Desagrupar</Button>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <p className="text-sm text-gray-800">¿Confirmás que querés desagrupar esta actuación de la causa?</p>
          <div className="bg-gray-100 rounded-lg px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-gray-800 font-mono">{expADesagrupar?.id}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{expADesagrupar?.caratula}</p>
            {expADesagrupar?.numero_causa && (
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                <Icon name="folder" size={12} />
                Causa: {formatNumeroCausaPjn(expADesagrupar)}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400">
            La actuación pasará a estar sin causa asignada. Esta acción se puede revertir agrupándola nuevamente.
          </p>
        </div>
      </Modal>
    </div>
  )
}
