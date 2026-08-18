import { Fragment, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { TIPOS_GESTION, LINEAS_FERROVIARIAS } from '../../data/catalogos'
import { USUARIOS, getUsuarioById, getNombreCompleto, puedeReasignar } from '../../data/usuarios'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { FormField } from '../../components/ui/FormField'
import { formatFecha } from '../../utils/format'
import { RUTAS } from '../../utils/routing'
import type { Area, Expediente, TipoGestion } from '../../types'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'

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
const AREA_LABEL: Record<Area, string> = { CIVIL: 'Civil', LABORAL: 'Laboral', PENAL: 'Penal' }

function nombreAbogado(id: string | undefined): string {
  if (!id) return '—'
  const u = getUsuarioById(id)
  return u ? getNombreCompleto(u) : id
}

const filterInputCls =
  'h-[45px] px-[16px] text-xs border border-line rounded-[4px] bg-paper ' +
  'text-[#242C4F] placeholder-[#a0b0bc] focus:outline-none focus:border-teal'

// Select con punto 10px a la izquierda y chevron 12px a la derecha — mismo
// patrón para los desplegables de la barra de filtros (Área, Tipo, Letrado,
// Línea, Estado).
function FiltroSelect({
  value, onChange, ariaLabel, children,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex-shrink-0">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-white/50 pointer-events-none" />
      <select
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className="appearance-none h-[45px] pl-8 pr-8 rounded-[4px] bg-teal text-white text-xs border-none focus:outline-none"
      >
        {children}
      </select>
      <Icon name="expand_more" size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BandejaAreaPage() {
  const navigate = useNavigate()
  const { expedientes, actualizarExpediente, asignarAbogado } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  const [filtros, setFiltros] = useState({
    buscar: '', area: '', tipo: '', estado: '', linea: '',
    fechaDesde: '', fechaHasta: '', letrado_id: '',
    soloUrgentes: false,
  })
  const [expandedCausas, setExpandedCausas] = useState<Set<string>>(new Set())
  const [menuAbierto,    setMenuAbierto]    = useState<string | null>(null)
  const [menuPos,        setMenuPos]        = useState({ top: 0, right: 0 })
  const [modalAgrupar,   setModalAgrupar]   = useState<string | null>(null)
  const [inputCausa,     setInputCausa]     = useState('')
  const [modalReasignar, setModalReasignar] = useState<string | null>(null)
  const [nuevoAbogadoId, setNuevoAbogadoId] = useState('')

  // Close menu on outside click
  useEffect(() => {
    if (!menuAbierto) return
    const h = () => setMenuAbierto(null)
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [menuAbierto])

  // ── Computed ──────────────────────────────────────────────────────────────────

  const expedientesFiltrados = useMemo(() => {
    return expedientes.filter(e => {
      if (e.estado === 'CUMPLIDO' || e.estado === 'ARCHIVADO' || e.estado === 'ARCHIVADA') return false
      if (filtros.area && e.area !== filtros.area) return false
      if (filtros.letrado_id && e.abogado_id !== filtros.letrado_id) return false
      if (filtros.tipo && e.tipo !== filtros.tipo) return false
      if (filtros.estado && e.estado !== filtros.estado) return false
      if (filtros.linea && e.linea !== filtros.linea) return false
      if (filtros.fechaDesde && e.fecha_recepcion < filtros.fechaDesde) return false
      if (filtros.fechaHasta && e.fecha_recepcion > filtros.fechaHasta) return false
      if (filtros.soloUrgentes) {
        const tieneVencimiento = e.campos_abogado?.plazo_respuesta || e.campos_mesa?.plazo_respuesta
        if (!tieneVencimiento) return false
        const fecha = String(tieneVencimiento)
        const dias = Math.ceil((new Date(fecha).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        if (dias > 7) return false
      }
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
  }, [expedientes, filtros])

  const items = useMemo(() => construirItems(expedientesFiltrados), [expedientesFiltrados])

  const tiposUnicos = useMemo(() =>
    [...new Set(expedientes.map(e => e.tipo))]
      .map(code => ({ code, label: TIPO_LABEL[code] ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [expedientes]
  )
  const estadosUnicos = useMemo(() =>
    [...new Set(expedientes.map(e => e.estado))].sort(),
    [expedientes]
  )
  const letradosUnicos = useMemo(() =>
    [...new Set(expedientes.map(e => e.abogado_id).filter(Boolean) as string[])]
      .map(id => getUsuarioById(id)!)
      .filter(Boolean)
      .sort((a, b) => a.apellido.localeCompare(b.apellido)),
    [expedientes]
  )


  const expModalReasignar = modalReasignar ? expedientes.find(e => e.id === modalReasignar) ?? null : null
  const abogadosPosibles = expModalReasignar
    ? USUARIOS.filter(u => u.rolSistema === 'ABOGADO' && u.areas.includes(expModalReasignar.area))
    : []

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

  // ── Actions ───────────────────────────────────────────────────────────────────

  function setFiltro(key: string, val: string | boolean) {
    setFiltros(prev => ({ ...prev, [key]: val }))
  }
  function limpiarFiltros() {
    setFiltros({ buscar: '', area: '', tipo: '', estado: '', linea: '', fechaDesde: '', fechaHasta: '', letrado_id: '', soloUrgentes: false })
  }
  function toggleCausa(nc: string) {
    setExpandedCausas(prev => {
      const next = new Set(prev)
      next.has(nc) ? next.delete(nc) : next.add(nc)
      return next
    })
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
    const menuHeight = 120 // altura estimada del menú
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4
    setMenuPos({ top, right: window.innerWidth - rect.right })
    setMenuAbierto(expId)
  }

  function desagrupar(expId: string) {
    actualizarExpediente(expId, { numero_causa: null })
    toast.info('Actuación desagrupada correctamente.')
    setMenuAbierto(null)
  }

  function confirmarAgrupar() {
    if (!inputCausa.trim() || !modalAgrupar) return
    actualizarExpediente(modalAgrupar, { numero_causa: inputCausa.trim() })
    toast.success('Actuación agrupada a la causa correctamente.')
    setModalAgrupar(null)
    setInputCausa('')
  }

  function confirmarReasignar() {
    if (!nuevoAbogadoId || !modalReasignar) return
    asignarAbogado(modalReasignar, nuevoAbogadoId)
    toast.success('Letrado reasignado correctamente.')
    setModalReasignar(null)
    setNuevoAbogadoId('')
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  function renderMenuExpediente(exp: Expediente) {
    const sinCausa = !exp.numero_causa || exp.numero_causa.toUpperCase() === 'SS'
    return (
      <div
        style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 50 }}
        className="bg-white border border-[rgba(0,0,0,0.12)] rounded-xl shadow-card-lg py-1 min-w-[160px]"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[#E3E4E9] transition-colors cursor-pointer"
          onClick={() => { navigate(RUTAS.EXPEDIENTE(exp.id)); setMenuAbierto(null) }}
        >
          <Icon name="open_in_new" size={16} />
          Visualizar
        </button>
        {sinCausa ? (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[#E3E4E9] transition-colors cursor-pointer"
            onClick={() => { setModalAgrupar(exp.id); setMenuAbierto(null) }}
          >
            <Icon name="folder_open" size={16} />
            Agrupar a causa
          </button>
        ) : (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[#E3E4E9] transition-colors cursor-pointer"
            onClick={() => desagrupar(exp.id)}
          >
            <Icon name="link_off" size={16} />
            Desagrupar
          </button>
        )}
        {puedeReasignar(usuarioActivo) && (
          <>
            <hr className="border-[rgba(0,0,0,0.12)] my-1" />
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[#E3E4E9] transition-colors cursor-pointer"
              onClick={() => { setModalReasignar(exp.id); setMenuAbierto(null) }}
            >
              <Icon name="forward" size={16} />
              Reasignar
            </button>
          </>
        )}
      </div>
    )
  }

  function renderFilasChild(exps: Expediente[]) {
    return exps.map((exp, idx) => {
      const isLast = idx === exps.length - 1
      return (
        <tr
          key={exp.id}
          className={`animate-slide-down border-l-4 ${
            exp.es_principal
              ? 'border-emerald-400/60 bg-green-50/60'
              : 'border-[rgba(27,58,87,0.10)]'
          }`}
          style={exp.es_principal ? {} : { background: '#fafcfd' }}
        >
          {/* Connector */}
          <td className="w-10 py-3 px-2 relative">
            <div className="relative min-h-[56px]">

              {/* Línea vertical */}
              <div
                className={`absolute left-3 w-px bg-[rgba(0,0,0,0.08)] ${
                  isLast
                    ? 'top-0 h-1/2'
                    : 'top-0 bottom-0'
                }`}
              />

              {/* Línea horizontal */}
              <div className="absolute left-3 top-1/2 w-3 h-px bg-[rgba(0,0,0,0.08)]" />

              {/* Icono */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                <Icon name="description" size={16} />
              </div>

            </div>
          </td>
          {/* N° + Principal badge */}
          <td className="py-3 pl-2 pr-3">
            <p className="font-mono text-xs font-bold text-[#242C4F]">{exp.id}</p>
            {exp.es_principal && (
              <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 w-fit bg-green-100 text-green-700 border border-green-200/60">
                Principal · PJN
              </span>
            )}
          </td>
          {/* Carátula */}
          <td className="py-3 px-3 max-w-xs">
            <p className="text-sm font-semibold text-[#242C4F] line-clamp-2">{exp.caratula}</p>
            {exp.numero_causa && (
              <p className="font-mono text-[10px] text-[#758A93] mt-0.5">{exp.numero_causa}</p>
            )}
          </td>
          {/* Área */}
          <td className="py-3 px-3"><AreaBadge area={exp.area} /></td>
          {/* Tipo */}
          <td className="py-3 px-3">
            <span className="text-xs text-[#758A93]">{TIPO_LABEL[exp.tipo] ?? exp.tipo}</span>
          </td>
          {/* Letrado */}
          <td className="py-3 px-3">
            <span className="text-xs text-[#242C4F]">{nombreAbogado(exp.abogado_id)}</span>
          </td>
          {/* Estado */}
          <td className="py-3 px-3"><EstadoBadge code={exp.estado} label={exp.estado} /></td>
          {/* Recepción */}
          <td className="py-3 px-3 whitespace-nowrap">
            <span className="text-xs text-[#758A93]">{formatFecha(exp.fecha_recepcion)}</span>
          </td>
          {/* Menú */}
          <td className="py-3 px-3 text-center">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#E3E4E9] text-[#758A93] transition-colors cursor-pointer"
              onClick={e => abrirMenu(e, exp.id)}
            >
              <Icon name="more_vert" size={18} />
            </button>
            {menuAbierto === exp.id && renderMenuExpediente(exp)}
          </td>
        </tr>
      )
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">

      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-headline font-extrabold text-3xl text-[#242C4F]">Actuaciones del Área</h1>
          <p className="text-sm text-[#758A93] mt-1">
            {filtros.area
              ? `Área ${AREA_LABEL[filtros.area as Area]} — ${expedientesFiltrados.length} expediente${expedientesFiltrados.length !== 1 ? 's' : ''}.`
              : `Todas las áreas — ${expedientesFiltrados.length} expediente${expedientesFiltrados.length !== 1 ? 's' : ''}.`
            }
          </p>
        </div>
      </div>

      {/* TOOLBAR — sin card, directo sobre el fondo crema */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center h-[30px] px-2 rounded-badge text-[10px] font-bold tracking-wide bg-neutral text-white">
          {expedientesFiltrados.length} elemento{expedientesFiltrados.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={expandAll} className="flex items-center gap-1 text-[10px] font-bold text-[#242C4F] hover:opacity-80 transition-opacity">
            <Icon name="unfold_more" size={14} />
            Expandir todo
          </button>
          <span className="text-[rgba(0,0,0,0.35)] text-xs">·</span>
          <button onClick={collapseAll} className="flex items-center gap-1 text-[10px] font-bold text-[#758A93] hover:text-[#242C4F] transition-colors">
            <Icon name="unfold_less" size={14} />
            Colapsar
          </button>
          <span className="text-[rgba(0,0,0,0.35)] text-xs">·</span>
          <button
            onClick={() => setFiltros(p => ({ ...p, soloUrgentes: !p.soloUrgentes }))}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
              filtros.soloUrgentes
                ? 'text-[#C3292F]'
                : 'text-[#758A93] hover:text-[#242C4F]'
            }`}
          >
            <Icon name="warning" size={14} />
            {filtros.soloUrgentes ? 'Solo urgentes' : 'Urgentes'}
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS — reemplaza las filas de <thead> */}
      <div className="flex items-center flex-wrap gap-2">
        <input type="text" placeholder="Causa / N°…" value={filtros.buscar} onChange={e => setFiltro('buscar', e.target.value)} className={filterInputCls} />
        <input type="text" placeholder="Carátula…" value={filtros.buscar} onChange={e => setFiltro('buscar', e.target.value)} className={filterInputCls} />
        <FiltroSelect value={filtros.area} onChange={e => setFiltro('area', e.target.value)} ariaLabel="Área">
          <option value="">Área: Todas</option>
          <option value="CIVIL">Civil</option>
          <option value="LABORAL">Laboral</option>
          <option value="PENAL">Penal</option>
        </FiltroSelect>
        <FiltroSelect value={filtros.tipo} onChange={e => setFiltro('tipo', e.target.value as TipoGestion | '')} ariaLabel="Tipo de Gestión">
          <option value="">Tipo: Todos</option>
          {tiposUnicos.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
        </FiltroSelect>
        <FiltroSelect value={filtros.letrado_id} onChange={e => setFiltro('letrado_id', e.target.value)} ariaLabel="Letrado">
          <option value="">Letrado: Todos</option>
          {letradosUnicos.map(u => <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>)}
        </FiltroSelect>
        <FiltroSelect value={filtros.linea} onChange={e => setFiltro('linea', e.target.value)} ariaLabel="Línea">
          <option value="">Línea: Todas</option>
          {LINEAS_FERROVIARIAS.map(l => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </FiltroSelect>
        <FiltroSelect value={filtros.estado} onChange={e => setFiltro('estado', e.target.value)} ariaLabel="Estado">
          <option value="">Estado: Todos</option>
          {estadosUnicos.map(est => <option key={est} value={est}>{est}</option>)}
        </FiltroSelect>
        <span className="text-[#404040] text-xs whitespace-nowrap ml-1">Recepción:</span>
        <label className="relative h-[45px] px-4 rounded-[4px] bg-teal text-white text-xs flex items-center gap-2 cursor-pointer overflow-hidden flex-shrink-0">
          <Icon name="calendar" size={16} />
          {filtros.fechaDesde ? formatFecha(filtros.fechaDesde) : 'Día/Mes/Año'}
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={e => setFiltro('fechaDesde', e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <button
          onClick={limpiarFiltros}
          className="w-[74px] h-[32px] rounded-[4px] bg-teal text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Limpiar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <tbody className="divide-y divide-outline-variant/20">
            {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#758A93] text-sm">
                    <Icon name="inbox" className="block mb-3" size={40} />
                    Sin resultados para los filtros aplicados.
                  </td>
                </tr>
              )}
              {items.map(item => {
                if (item.kind === 'causa') {
                  const { numeroCausa, expedientes: exps } = item
                  const principal = exps.find(e => e.es_principal) ?? exps[0]
                  const isExpanded = expandedCausas.has(numeroCausa)
                  const areasBadges = [...new Set(exps.map(e => e.area))] as Area[]
                  const abogadoIds = [...new Set(exps.map(e => e.abogado_id).filter(Boolean) as string[])]

                  return (
                    <Fragment key={numeroCausa}>
                      {/* Fila causa */}
                      <tr
                        className="bg-[#E3E4E9] border-l-4 border-[rgba(27,58,87,0.30)] hover:border-[rgba(27,58,87,0.60)] cursor-pointer transition-colors"
                        onClick={() => toggleCausa(numeroCausa)}
                      >
                        {/* Expand icon */}
                        <td className="w-10 py-3 px-2 text-center">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                            isExpanded ? 'bg-[#256386] text-white' : 'bg-[#E4EDF2] text-[#242C4F]'
                          }`}>
                            <Icon name="chevron_right" size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </td>
                        {/* N° Causa */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Icon name="folder" size={14} className="text-[#242C4F]" />
                            <span className="font-mono text-xs font-bold text-[#242C4F]">{numeroCausa}</span>
                          </div>
                          <p className="text-[10px] text-[#758A93] mt-0.5">{exps.length} expediente{exps.length !== 1 ? 's' : ''} vinculado{exps.length !== 1 ? 's' : ''}</p>
                        </td>
                        {/* Carátula */}
                        <td className="py-3 px-3 text-sm text-[#758A93]">—</td>
                        {/* Área */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {areasBadges.map(a => <AreaBadge key={a} area={a} />)}
                          </div>
                        </td>
                        {/* Tipo */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[rgba(27,58,87,0.10)] text-[#242C4F]">
                            <Icon name="link" size={11} />
                            Causa judicial
                          </span>
                        </td>
                        {/* Letrado */}
                        <td className="py-3 px-3">
                          {abogadoIds.length === 0 ? (
                            <span className="text-xs text-[#758A93]">—</span>
                          ) : abogadoIds.length === 1 ? (
                            <span className="text-xs text-[#242C4F]">{nombreAbogado(abogadoIds[0])}</span>
                          ) : (
                            <span className="text-xs text-[#242C4F]">{nombreAbogado(abogadoIds[0])} <span className="text-[#758A93]">+{abogadoIds.length - 1}</span></span>
                          )}
                        </td>
                        {/* Estado */}
                        <td className="py-3 px-3">
                          <EstadoBadge code={principal.estado} label={principal.estado} />
                        </td>
                        {/* Recepción */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-xs text-[#758A93]">{formatFecha(principal.fecha_recepcion)}</span>
                        </td>
                        {/* Ver todo */}
                        <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            className="text-[11px] font-bold text-[#242C4F] hover:underline whitespace-nowrap"
                            onClick={() => navigate(RUTAS.CAUSA(numeroCausa))}
                          >
                            Ver todo
                          </button>
                        </td>
                      </tr>
                      {/* Child rows */}
                      {isExpanded && renderFilasChild(exps)}
                    </Fragment>
                  )
                }

                // Fila suelto
                const { exp } = item
                return (
                  <tr
                    key={exp.id}
                    className="transition-colors"
                  >
                    <td className="w-10 py-3 px-2 text-center">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto bg-[#E3E4E9]">
                        <Icon name="description" size={18} />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-mono text-xs font-bold text-[#242C4F]">{exp.id}</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-[#758A93]">
                        <Icon name="folder_off" size={11} />
                        Sin causa
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-sm text-[#242C4F] line-clamp-2">{exp.caratula}</p>
                    </td>
                    <td className="py-3 px-3"><AreaBadge area={exp.area} /></td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-[#758A93]">{TIPO_LABEL[exp.tipo] ?? exp.tipo}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-[#242C4F]">{nombreAbogado(exp.abogado_id)}</span>
                    </td>
                    <td className="py-3 px-3"><EstadoBadge code={exp.estado} label={exp.estado} /></td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-xs text-[#758A93]">{formatFecha(exp.fecha_recepcion)}</span>
                    </td>
                    <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto hover:bg-[#E3E4E9] text-[#758A93] transition-colors cursor-pointer"
                        onClick={e => abrirMenu(e, exp.id)}
                      >
                        <Icon name="more_vert" size={18} />
                      </button>
                      {menuAbierto === exp.id && renderMenuExpediente(exp)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

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
                className="w-full text-left px-3 py-2 text-sm font-mono text-[#242C4F] hover:bg-[#E3E4E9] transition-colors"
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
        titulo="Reasignar Expediente"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalReasignar(null); setNuevoAbogadoId('') }}>Cancelar</Button>
            <Button variant="primary" onClick={confirmarReasignar} disabled={!nuevoAbogadoId}>Confirmar</Button>
          </>
        }
      >
        <FormField label="Nuevo Letrado" required>
          <select className="field-input" value={nuevoAbogadoId} onChange={e => setNuevoAbogadoId(e.target.value)}>
            <option value="">Seleccioná…</option>
            {abogadosPosibles.map(u => (
              <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
            ))}
          </select>
        </FormField>
      </Modal>
    </div>
  )
}
