import { Fragment, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { TIPOS_GESTION } from '../../data/catalogos'
import { USUARIOS, getNombreCompleto, getUsuarioById, puedeReasignar } from '../../data/usuarios'

import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { formatFecha } from '../../utils/format'
import { RUTAS } from '../../utils/routing'
import { getAlertaExpediente } from '../../utils/alertas'
import type { Area, Expediente, TipoGestion } from '../../types'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'

// ─── Constants ─────────────────────────────────────────────────────────────────

const ESTADOS_CERRADO = ['ARCHIVADO', 'ARCHIVADA', 'CERRADO', 'CUMPLIDO', 'COMPLETADA'] as const

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
  'w-full px-2 py-1.5 text-xs border border-[rgba(0,0,0,0.15)] rounded-md bg-white ' +
  'text-[#1b3a57] placeholder-[#a0b0bc] focus:outline-none focus:border-[#1b3a57]'

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BandejaAbogadoPage() {
  const navigate = useNavigate()
  const { expedientes, actualizarExpediente, asignarAbogado, tareasMap } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  const rolSistema  = usuarioActivo?.rolSistema
  const esCoordi    = rolSistema === 'COORDINADOR'
  const esReferente = rolSistema === 'REFERENTE'
  const esAbogado   = !esCoordi && !esReferente

  const filtroInicial = useMemo(() => ({
    buscar:     '',
    area:       esCoordi ? (usuarioActivo?.areas[0] ?? '') : '',
    tipo:       '',
    estado:     '',
    letrado:    esAbogado ? (usuarioActivo?.id ?? '') : '',
    fechaDesde: '',
    fechaHasta: '',
    soloUrgentes: false,
    soloAlerta:   false,
  }), [usuarioActivo?.id, esCoordi, esAbogado])

  const [tabEstado,      setTabEstado]      = useState<'activos' | 'archivados'>('activos')
  const [filtros,        setFiltros]        = useState(filtroInicial)
  const [menuAbierto,    setMenuAbierto]    = useState<string | null>(null)
  const [menuPos,        setMenuPos]        = useState({ top: 0, right: 0 })
  const [modalAgrupar,   setModalAgrupar]   = useState<string | null>(null)
  const [inputCausa,     setInputCausa]     = useState('')
  const [expandedCausas, setExpandedCausas] = useState<Set<string>>(new Set())
  const [expADesagrupar,  setExpADesagrupar]  = useState<Expediente | null>(null)
  const [modalReasignar,  setModalReasignar]  = useState<Expediente | null>(null)
  const [nuevoAbogadoId,  setNuevoAbogadoId]  = useState('')

  // Resetear filtros cuando cambia el usuario activo
  useEffect(() => {
    setFiltros(filtroInicial)
  }, [usuarioActivo?.id])

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
      if (filtros.estado    && e.estado !== filtros.estado)         return false
      if (filtros.fechaDesde && e.fecha_recepcion < filtros.fechaDesde) return false
      if (filtros.fechaHasta && e.fecha_recepcion > filtros.fechaHasta) return false
      if (filtros.soloUrgentes && !e.es_urgente) return false
      if (filtros.soloAlerta && !getAlertaExpediente(e.id, tareasMap).activa) return false
      if (filtros.buscar) {
        const q = filtros.buscar.toLowerCase()
        return (
          e.caratula.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          (e.numero_causa ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [poolBase, filtros, tareasMap])

  const items = useMemo(() => construirItems(expedientesFiltrados), [expedientesFiltrados])

  const contadorAlerta = useMemo(() =>
    expedientesFiltrados.filter(e => getAlertaExpediente(e.id, tareasMap).activa).length
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

  const mostrarLetrado = esCoordi || esReferente

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
        className="bg-white border border-[rgba(0,0,0,0.12)] rounded-xl shadow-card-lg py-1 min-w-[160px]"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[#e8e8e8] transition-colors cursor-pointer"
          onClick={() => { navigate(RUTAS.EXPEDIENTE(exp.id)); setMenuAbierto(null) }}
        >
          <Icon name="open_in_new" size={16} />
          Visualizar
        </button>
        {puedeReasignar(usuarioActivo) && (
          <>
            <div className="my-1 border-t border-[rgba(0,0,0,0.06)]" />
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[#e8e8e8] transition-colors cursor-pointer"
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
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[#e8e8e8] transition-colors cursor-pointer"
            onClick={() => { setModalAgrupar(exp.id); setMenuAbierto(null) }}
          >
            <Icon name="folder_open" size={16} />
            Agrupar a causa
          </button>
        ) : (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[#e8e8e8] transition-colors cursor-pointer"
            onClick={() => { setExpADesagrupar(exp); setMenuAbierto(null) }}
          >
            <Icon name="link_off" size={16} />
            Desagrupar
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
        className={`animate-slide-down border-l-4 ${
          exp.es_principal
            ? 'border-emerald-400/60 bg-green-50/60'
            : tieneCausa
              ? 'border-[rgba(27,58,87,0.10)]'
              : 'border-transparent'
        }`}
        style={exp.es_principal ? {} : { background: '#fafcfd' }}
      >
        {/* Connector */}
        <td className="w-10 py-3 px-2 relative">
          {tieneCausa ? (
            <div className="relative min-h-[56px]">
              <div className={`absolute left-3 w-px bg-[rgba(0,0,0,0.08)] ${isLast ? 'top-0 h-1/2' : 'top-0 bottom-0'}`} />
              <div className="absolute left-3 top-1/2 w-3 h-px bg-[rgba(0,0,0,0.08)]" />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                <Icon name="description" size={16} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#f0f7f8] text-[#4a6a84]">
                <Icon name="description" size={18} />
              </div>
            </div>
          )}
        </td>
        {/* N° + badges */}
        <td className="py-3 pl-2 pr-3">
          <p className="font-mono text-xs font-bold text-[#1b3a57]">{exp.id}</p>
          {isSuelto && (
            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-[#4a6a84]">
              <Icon name="folder_off" size={11} />
              Sin causa
            </span>
          )}
          {exp.es_principal && (
            <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 w-fit bg-green-100 text-green-700 border border-green-200/60">
              Principal · PJN
            </span>
          )}
          {(() => {
            const alerta = getAlertaExpediente(exp.id, tareasMap)
            if (!alerta.activa) return null
            const tooltip = alerta.nombreTarea
              ? `Por vencer: ${alerta.nombreTarea}${alerta.fechaVencimiento ? ` — ${formatFecha(alerta.fechaVencimiento)}` : ''}`
              : 'Tarea por vencer'
            return (
              <div title={tooltip} className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-[#fef3c7] border border-[#fde68a] cursor-default">
                <Icon name="warning" size={10} className="text-[#d97706]" />
                <span className="text-[9px] font-black text-[#d97706] uppercase tracking-wide">Por vencer</span>
              </div>
            )
          })()}
          {exp.es_urgente && (
            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-[#fee2e2] border border-[#fca5a5]">
              <Icon name="warning" size={10} className="text-[#b91c1c]" />
              <span className="text-[9px] font-black text-[#b91c1c] uppercase tracking-wide">Urgente</span>
            </div>
          )}
        </td>
        {/* Carátula */}
        <td className="py-3 px-3 max-w-xs">
          <p className="text-sm font-semibold text-[#1b3a57] line-clamp-2">{exp.caratula}</p>
          {exp.numero_causa && (
            <p className="font-mono text-[10px] text-[#4a6a84] mt-0.5">{exp.numero_causa}</p>
          )}
        </td>
        {/* Área */}
        <td className="py-3 px-3"><AreaBadge area={exp.area} /></td>
        {/* Tipo */}
        <td className="py-3 px-3">
          <span className="text-xs text-[#4a6a84]">{TIPO_LABEL[exp.tipo] ?? exp.tipo}</span>
        </td>
        {/* Letrado (condicional) */}
        {mostrarLetrado && (
          <td className="py-3 px-3">
            <span className="text-xs text-[#4a6a84]">
              {letrado ? getNombreCompleto(letrado) : '—'}
            </span>
          </td>
        )}
        {/* Estado */}
        <td className="py-3 px-3"><EstadoBadge code={exp.estado} label={exp.estado} /></td>
        {/* Recepción */}
        <td className="py-3 px-3 whitespace-nowrap">
          <span className="text-xs text-[#4a6a84]">{formatFecha(exp.fecha_recepcion)}</span>
        </td>
        {/* Menú */}
        <td className="py-3 px-3 text-center">
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#e8e8e8] text-[#4a6a84] transition-colors cursor-pointer"
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

  const colSpanTotal = mostrarLetrado ? 9 : 8

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">

      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57]">Actuaciones</h1>
          <p className="text-sm text-[#4a6a84] mt-1">
            Hola, {usuarioActivo?.nombre ?? ''}. Gestionando{' '}
            <span className="font-semibold text-[#1b3a57]">{activosCount}</span>{' '}
            actuación{activosCount !== 1 ? 'es' : ''} activa{activosCount !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex gap-1 bg-[#f5f5f5] rounded-xl p-1 self-start">
          {(['activos', 'archivados'] as const).map(val => (
            <button
              key={val}
              onClick={() => setTabEstado(val)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                tabEstado === val
                  ? 'bg-white text-[#1b3a57] shadow-sm'
                  : 'text-[#4a6a84] hover:text-[#1b3a57]'
              }`}
            >
              {val === 'activos' ? 'Activos' : 'Archivados'}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA */}
      {poolBase.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <Icon name="inbox" size={48} />
          <p className="mt-4 text-[#4a6a84] text-sm">No tenés expedientes asignados.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-[rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(0,0,0,0.08)]">
            <span className="text-xs text-[#4a6a84] font-medium">
              {expedientesFiltrados.length} elemento{expedientesFiltrados.length !== 1 ? 's' : ''}
            </span>

            <div className="flex items-center gap-4">
              <button onClick={expandAll} className="flex items-center gap-1 text-[10px] font-bold text-[#1b3a57] hover:opacity-80 transition-opacity">
                <Icon name="unfold_more" size={14} />
                Expandir todo
              </button>
              <span className="text-[rgba(0,0,0,0.35)] text-xs">·</span>
              <button onClick={collapseAll} className="flex items-center gap-1 text-[10px] font-bold text-[#4a6a84] hover:text-[#1b3a57] transition-colors">
                <Icon name="unfold_less" size={14} />
                Colapsar
              </button>
              <span className="text-[rgba(0,0,0,0.35)] text-xs">·</span>
              <button
                onClick={() => setFiltros(p => ({ ...p, soloUrgentes: !p.soloUrgentes }))}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors px-3 py-1.5 rounded-lg border ${
                  filtros.soloUrgentes
                    ? 'bg-[#fee2e2] border-[#fca5a5] text-[#b91c1c]'
                    : 'bg-white border-[rgba(0,0,0,0.12)] text-[#4a6a84] hover:text-[#1b3a57]'
                }`}
              >
                <Icon name="warning" size={14} className={filtros.soloUrgentes ? 'text-[#b91c1c]' : 'text-[#4a6a84]'} />
                Urgentes
              </button>
              <span className="text-[rgba(0,0,0,0.35)] text-xs">·</span>
              <button
                onClick={() => setFiltros(p => ({ ...p, soloAlerta: !p.soloAlerta }))}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors px-3 py-1.5 rounded-lg border ${
                  filtros.soloAlerta
                    ? 'bg-[#fef3c7] border-[#fde68a] text-[#d97706]'
                    : 'bg-white border-[rgba(0,0,0,0.12)] text-[#4a6a84] hover:text-[#1b3a57]'
                }`}
              >
                <Icon name="schedule" size={14} className={filtros.soloAlerta ? 'text-[#d97706]' : 'text-[#4a6a84]'} />
                Por vencer
                {contadorAlerta > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    filtros.soloAlerta ? 'bg-[#fde68a] text-[#d97706]' : 'bg-[#e8e8e8] text-[#4a6a84]'
                  }`}>
                    {contadorAlerta}
                  </span>
                )}
              </button>
              <span className="text-[rgba(0,0,0,0.35)] text-xs">·</span>
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-1.5 text-xs font-bold text-[#4a6a84] hover:text-[#1b3a57] transition-colors"
              >
                <Icon name="filter_alt_off" size={14} />
                Limpiar filtros
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                {/* Fila 1: labels */}
                <tr className="border-b border-[rgba(0,0,0,0.08)] bg-[#f9f9f9]">
                  <th className="w-10 px-3 py-2.5" />
                  <th className="w-40 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">N° Causa / Exp.</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">Carátula</th>
                  <th className="w-24 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">Área</th>
                  <th className="w-36 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">Tipo</th>
                  {mostrarLetrado && (
                    <th className="w-36 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">Letrado</th>
                  )}
                  <th className="w-28 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">Estado</th>
                  <th className="w-24 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">Recepción</th>
                  <th className="w-16 px-3 py-2.5" />
                </tr>

                {/* Fila 2: inputs de filtro */}
                <tr className="border-b-2 border-[rgba(0,0,0,0.10)] bg-[#f5f5f5]">
                  <th className="px-2 py-1.5" />
                  <th className="px-2 py-1.5">
                    <input type="text" placeholder="Causa / N°…" value={filtros.buscar} onChange={e => setFiltro('buscar', e.target.value)} className={filterInputCls} />
                  </th>
                  <th className="px-2 py-1.5">
                    <input type="text" placeholder="Carátula…" value={filtros.buscar} onChange={e => setFiltro('buscar', e.target.value)} className={filterInputCls} />
                  </th>
                  <th className="px-2 py-1.5">
                    <select value={filtros.area} onChange={e => setFiltro('area', e.target.value)} className={filterInputCls}>
                      <option value="">Todas</option>
                      <option value="CIVIL">Civil</option>
                      <option value="LABORAL">Laboral</option>
                      <option value="PENAL">Penal</option>
                    </select>
                  </th>
                  <th className="px-2 py-1.5">
                    <select value={filtros.tipo} onChange={e => setFiltro('tipo', e.target.value as TipoGestion | '')} className={filterInputCls}>
                      <option value="">Todos</option>
                      {tiposUnicos.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </th>
                  {mostrarLetrado && (
                    <th className="px-2 py-1.5">
                      <select value={filtros.letrado} onChange={e => setFiltro('letrado', e.target.value)} className={filterInputCls}>
                        <option value="">Todos</option>
                        {abogadosDisponibles.map(u => (
                          <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
                        ))}
                      </select>
                    </th>
                  )}
                  <th className="px-2 py-1.5">
                    <select value={filtros.estado} onChange={e => setFiltro('estado', e.target.value)} className={filterInputCls}>
                      <option value="">Todos</option>
                      {estadosUnicos.map(est => <option key={est} value={est}>{est}</option>)}
                    </select>
                  </th>
                  <th className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <input type="date" value={filtros.fechaDesde} onChange={e => setFiltro('fechaDesde', e.target.value)} className={filterInputCls} />
                      <input type="date" value={filtros.fechaHasta} onChange={e => setFiltro('fechaHasta', e.target.value)} className={filterInputCls} />
                    </div>
                  </th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={colSpanTotal} className="py-16 text-center text-[#4a6a84] text-sm">
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
                          className="bg-[#f0f0f0] border-l-4 border-[rgba(27,58,87,0.40)] hover:border-[#1b3a57] cursor-pointer transition-colors"
                          onClick={() => setExpandedCausas(prev => {
                            const next = new Set(prev)
                            next.has(numeroCausa) ? next.delete(numeroCausa) : next.add(numeroCausa)
                            return next
                          })}
                        >
                          <td className="w-10 py-3 px-2 text-center">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                              isExpanded ? 'bg-[#1b3a57] text-white' : 'bg-[#C4DFE8] text-[#1b3a57]'
                            }`}>
                              <Icon name="chevron_right" size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <Icon name="folder" size={14} className="text-[#1b3a57]" />
                              <span className="font-mono text-xs font-bold text-[#1b3a57]">{numeroCausa}</span>
                            </div>
                            <p className="text-[10px] text-[#4a6a84] mt-0.5">
                              {exps.length} actuación{exps.length !== 1 ? 'es' : ''} agrupada{exps.length !== 1 ? 's' : ''}
                            </p>
                          </td>
                          <td className="py-3 px-3 max-w-[280px]">
                            <p className="text-sm text-[#1b3a57] line-clamp-2">{principal.caratula}</p>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {areasBadges.map(a => <AreaBadge key={a} area={a} />)}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[rgba(27,58,87,0.10)] text-[#1b3a57]">
                              <Icon name="link" size={11} />
                              Causa judicial
                            </span>
                          </td>
                          {mostrarLetrado && <td className="py-3 px-3" />}
                          <td className="py-3 px-3">
                            <EstadoBadge code={principal.estado} label={principal.estado} />
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-xs text-[#4a6a84]">{formatFecha(principal.fecha_recepcion)}</span>
                          </td>
                          <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(RUTAS.CAUSA(numeroCausa))}
                              className="text-[11px] font-bold text-[#1b3a57] hover:underline whitespace-nowrap cursor-pointer"
                            >
                              Ver todo
                            </button>
                          </td>
                        </tr>
                        {isExpanded && exps.map((exp, idx, arr) => renderExpRow(exp, idx, arr))}
                      </Fragment>
                    )
                  }
                  return renderExpRow(item.exp, 0, [item.exp], true)
                })}
              </tbody>
            </table>
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
          <div className="mt-1 border border-[rgba(0,0,0,0.12)] rounded-lg bg-white shadow-sm max-h-32 overflow-y-auto">
            {causasExistentes.map(nc => (
              <button
                key={nc}
                className="w-full text-left px-3 py-2 text-sm font-mono text-[#1b3a57] hover:bg-[#e8e8e8] transition-colors"
                onClick={() => setInputCausa(nc)}
              >
                {nc}
              </button>
            ))}
          </div>
        )}
      </Modal>

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
          <div className="bg-[#f5f5f5] rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs font-bold font-mono text-[#1b3a57]">{modalReasignar?.id}</p>
            <p className="text-xs text-[#4a6a84] line-clamp-2">{modalReasignar?.caratula}</p>
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
          <p className="text-sm text-[#1b3a57]">¿Confirmás que querés desagrupar esta actuación de la causa?</p>
          <div className="bg-[#f5f5f5] rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs font-bold text-[#1b3a57] font-mono">{expADesagrupar?.id}</p>
            <p className="text-xs text-[#4a6a84] line-clamp-2">{expADesagrupar?.caratula}</p>
            {expADesagrupar?.numero_causa && (
              <p className="text-[11px] text-[#7a9ab4] flex items-center gap-1 mt-1">
                <Icon name="folder" size={12} />
                Causa: {expADesagrupar.numero_causa}
              </p>
            )}
          </div>
          <p className="text-xs text-[#7a9ab4]">
            La actuación pasará a estar sin causa asignada. Esta acción se puede revertir agrupándola nuevamente.
          </p>
        </div>
      </Modal>
    </div>
  )
}
