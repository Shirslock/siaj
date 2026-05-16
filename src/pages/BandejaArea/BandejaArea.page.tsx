import { Fragment, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { TIPOS_GESTION } from '../../data/catalogos'
import { USUARIOS, getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { FormField } from '../../components/ui/FormField'
import { formatFecha } from '../../utils/format'
import { RUTAS } from '../../utils/routing'
import type { Area, Expediente, TipoGestion } from '../../types'

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

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BandejaAreaPage() {
  const navigate = useNavigate()
  const { expedientes, actualizarExpediente, asignarAbogado } = useExpedientesStore()
  const { usuarioActivo, showToast } = useUIStore()

  const [tab, setTab]       = useState<'activos' | 'urgentes'>('activos')
  const [filtros, setFiltros] = useState({
    buscar: '', area: '', tipo: '', estado: '',
    fechaDesde: '', fechaHasta: '', conAlerta: false, letrado_id: '',
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

  const urgentesCount = useMemo(() =>
    expedientes.filter(e =>
      e.tiene_alerta &&
      e.estado !== 'CUMPLIDO' && e.estado !== 'ARCHIVADO' && e.estado !== 'ARCHIVADA'
    ).length,
    [expedientes]
  )

  const expedientesFiltrados = useMemo(() => {
    return expedientes.filter(e => {
      if (tab === 'activos' && (e.estado === 'CUMPLIDO' || e.estado === 'ARCHIVADO' || e.estado === 'ARCHIVADA')) return false
      if (tab === 'urgentes' && !e.tiene_alerta) return false
      if (filtros.conAlerta && !e.tiene_alerta) return false
      if (filtros.area && e.area !== filtros.area) return false
      if (filtros.letrado_id && e.abogado_id !== filtros.letrado_id) return false
      if (filtros.tipo && e.tipo !== filtros.tipo) return false
      if (filtros.estado && e.estado !== filtros.estado) return false
      if (filtros.fechaDesde && e.fecha_recepcion < filtros.fechaDesde) return false
      if (filtros.fechaHasta && e.fecha_recepcion > filtros.fechaHasta) return false
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
  }, [expedientes, filtros, tab])

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

  const filtrosActivos = useMemo(() => {
    const chips: { label: string; key: string }[] = []
    if (filtros.area)       chips.push({ label: `Área: ${AREA_LABEL[filtros.area as Area]}`, key: 'area' })
    if (filtros.tipo)       chips.push({ label: `Tipo: ${TIPO_LABEL[filtros.tipo] ?? filtros.tipo}`, key: 'tipo' })
    if (filtros.estado)     chips.push({ label: `Estado: ${filtros.estado}`, key: 'estado' })
    if (filtros.letrado_id) chips.push({ label: `Letrado: ${nombreAbogado(filtros.letrado_id)}`, key: 'letrado_id' })
    if (filtros.fechaDesde) chips.push({ label: `Desde: ${formatFecha(filtros.fechaDesde)}`, key: 'fechaDesde' })
    if (filtros.fechaHasta) chips.push({ label: `Hasta: ${formatFecha(filtros.fechaHasta)}`, key: 'fechaHasta' })
    if (filtros.conAlerta)  chips.push({ label: 'Con alerta', key: 'conAlerta' })
    return chips
  }, [filtros])

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

  const puedeReasignar =
    usuarioActivo?.rolSistema === 'COORDINADOR' ||
    usuarioActivo?.rolSistema === 'REFERENTE'

  // ── Actions ───────────────────────────────────────────────────────────────────

  function setFiltro(key: string, val: string | boolean) {
    setFiltros(prev => ({ ...prev, [key]: val }))
  }
  function limpiarFiltros() {
    setFiltros({ buscar: '', area: '', tipo: '', estado: '', fechaDesde: '', fechaHasta: '', conAlerta: false, letrado_id: '' })
  }
  function quitarFiltro(key: string) {
    setFiltros(prev => ({ ...prev, [key]: key === 'conAlerta' ? false : '' }))
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
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setMenuAbierto(expId)
  }

  function desagrupar(expId: string) {
    actualizarExpediente(expId, { numero_causa: null })
    showToast('Expediente desagrupado correctamente.', 'info')
    setMenuAbierto(null)
  }

  function confirmarAgrupar() {
    if (!inputCausa.trim() || !modalAgrupar) return
    actualizarExpediente(modalAgrupar, { numero_causa: inputCausa.trim() })
    showToast('Expediente agrupado a la causa correctamente.', 'success')
    setModalAgrupar(null)
    setInputCausa('')
  }

  function confirmarReasignar() {
    if (!nuevoAbogadoId || !modalReasignar) return
    asignarAbogado(modalReasignar, nuevoAbogadoId)
    showToast('Letrado reasignado correctamente.', 'success')
    setModalReasignar(null)
    setNuevoAbogadoId('')
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  function renderMenuExpediente(exp: Expediente) {
    const sinCausa = !exp.numero_causa || exp.numero_causa.toUpperCase() === 'SS'
    return (
      <div
        style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 50 }}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-card-lg py-1 min-w-[160px]"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-surface-container transition-colors"
          onClick={() => { navigate(RUTAS.EXPEDIENTE(exp.id)); setMenuAbierto(null) }}
        >
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">open_in_new</span>
          Visualizar
        </button>
        {sinCausa ? (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-surface-container transition-colors"
            onClick={() => { setModalAgrupar(exp.id); setMenuAbierto(null) }}
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">folder_open</span>
            Agrupar a causa
          </button>
        ) : (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-surface-container transition-colors"
            onClick={() => desagrupar(exp.id)}
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">link_off</span>
            Desagrupar
          </button>
        )}
        {puedeReasignar && (
          <>
            <hr className="border-outline-variant/50 my-1" />
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-surface-container transition-colors"
              onClick={() => { setModalReasignar(exp.id); setMenuAbierto(null) }}
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">forward</span>
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
              : 'border-primary/10'
          }`}
          style={exp.es_principal ? {} : { background: '#fafcfd' }}
        >
          {/* Connector */}
          <td className="w-10 py-3 text-center relative">
            <div className="relative inline-flex flex-col items-center">
              <div className={`absolute left-[calc(50%-0.5px)] w-px bg-outline-variant ${isLast ? 'top-0 h-[calc(50%+4px)]' : '-top-3 bottom-0'}`} />
              <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-3 h-px bg-outline-variant" />
              <span
                className={`material-symbols-outlined text-[15px] relative z-10 ${exp.tiene_alerta ? 'text-error' : 'text-on-surface-variant'}`}
                style={{ fontVariationSettings: exp.tiene_alerta ? "'FILL' 1" : "'FILL' 0" }}
              >
                {exp.tiene_alerta ? 'warning' : 'description'}
              </span>
            </div>
          </td>
          {/* N° + Principal badge */}
          <td className="py-3 pl-2 pr-3">
            <p className="font-mono text-xs font-bold text-primary">{exp.id}</p>
            {exp.es_principal && (
              <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 w-fit bg-green-100 text-green-700 border border-green-200/60">
                Principal · PJN
              </span>
            )}
          </td>
          {/* Carátula */}
          <td className="py-3 px-3 max-w-xs">
            <p className="text-sm font-semibold text-on-surface line-clamp-2">{exp.caratula}</p>
            {exp.numero_causa && (
              <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">{exp.numero_causa}</p>
            )}
            {exp.tiene_alerta && exp.alerta_msg && (
              <p className="text-[10px] text-error mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                {exp.alerta_msg}
              </p>
            )}
          </td>
          {/* Área */}
          <td className="py-3 px-3"><AreaBadge area={exp.area} /></td>
          {/* Tipo */}
          <td className="py-3 px-3">
            <span className="text-xs text-on-surface-variant">{TIPO_LABEL[exp.tipo] ?? exp.tipo}</span>
          </td>
          {/* Letrado */}
          <td className="py-3 px-3">
            <span className="text-xs text-on-surface">{nombreAbogado(exp.abogado_id)}</span>
          </td>
          {/* Estado */}
          <td className="py-3 px-3"><EstadoBadge code={exp.estado} label={exp.estado} /></td>
          {/* Recepción */}
          <td className="py-3 px-3 whitespace-nowrap">
            <span className="text-xs text-on-surface-variant">{formatFecha(exp.fecha_recepcion)}</span>
          </td>
          {/* Menú */}
          <td className="py-3 px-3 text-center">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors"
              onClick={e => abrirMenu(e, exp.id)}
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
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
          <h1 className="font-headline font-extrabold text-3xl text-on-surface">Bandeja Área</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {filtros.area
              ? `Área ${AREA_LABEL[filtros.area as Area]} — ${expedientesFiltrados.length} expediente${expedientesFiltrados.length !== 1 ? 's' : ''}.`
              : `Todas las áreas — ${expedientesFiltrados.length} expediente${expedientesFiltrados.length !== 1 ? 's' : ''}.`
            }
          </p>
        </div>
        {/* Tabs */}
        <div className="flex rounded-lg bg-surface-container p-1 gap-0.5 self-start">
          <button
            onClick={() => setTab('activos')}
            className={`px-4 py-2 rounded-md text-sm transition-all ${
              tab === 'activos'
                ? 'bg-surface-container-lowest shadow-sm font-bold text-primary'
                : 'font-medium text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setTab('urgentes')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-all ${
              tab === 'urgentes'
                ? 'bg-surface-container-lowest shadow-sm font-bold text-primary'
                : 'font-medium text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Urgentes
            {urgentesCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === 'urgentes' ? 'bg-error text-white' : 'bg-error/20 text-error'
              }`}>{urgentesCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-surface-container-lowest shadow-sm rounded-xl px-5 py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>
            <input
              className="field-input pl-9"
              placeholder="Buscar carátula, número, causa…"
              value={filtros.buscar}
              onChange={e => setFiltro('buscar', e.target.value)}
            />
          </div>
          {/* Área */}
          <select className="field-input min-w-[120px] w-auto" value={filtros.area} onChange={e => setFiltro('area', e.target.value)}>
            <option value="">Área: Todas</option>
            <option value="CIVIL">Civil</option>
            <option value="LABORAL">Laboral</option>
            <option value="PENAL">Penal</option>
          </select>
          {/* Tipo */}
          <select className="field-input min-w-[160px] w-auto" value={filtros.tipo} onChange={e => setFiltro('tipo', e.target.value as TipoGestion | '')}>
            <option value="">Tipo: Todos</option>
            {tiposUnicos.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
          {/* Estado */}
          <select className="field-input min-w-[160px] w-auto" value={filtros.estado} onChange={e => setFiltro('estado', e.target.value)}>
            <option value="">Estado: Todos</option>
            {estadosUnicos.map(est => <option key={est} value={est}>{est}</option>)}
          </select>
          {/* Fechas */}
          <input type="date" className="field-input w-auto" value={filtros.fechaDesde} onChange={e => setFiltro('fechaDesde', e.target.value)} />
          <span className="text-on-surface-variant text-sm">—</span>
          <input type="date" className="field-input w-auto" value={filtros.fechaHasta} onChange={e => setFiltro('fechaHasta', e.target.value)} />
          {/* Con alerta */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filtros.conAlerta}
              onChange={e => setFiltro('conAlerta', e.target.checked)}
              className="rounded accent-primary"
            />
            <span className="material-symbols-outlined text-[16px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <span className="text-sm text-on-surface-variant">Con alerta</span>
          </label>
          {/* Letrado (solo coordinador/referente) */}
          {puedeReasignar && (
            <select className="field-input min-w-[180px] w-auto" value={filtros.letrado_id} onChange={e => setFiltro('letrado_id', e.target.value)}>
              <option value="">Letrado: Todos</option>
              {letradosUnicos.map(u => <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>)}
            </select>
          )}
          {/* Limpiar */}
          <button
            className="ml-auto flex items-center gap-1 text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={limpiarFiltros}
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Limpiar
          </button>
        </div>

        {/* Chips de filtros activos */}
        {filtrosActivos.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/30">
            {filtrosActivos.map(chip => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold"
              >
                {chip.label}
                <button onClick={() => quitarFiltro(chip.key)} className="hover:opacity-70 transition-opacity">
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* TABLA */}
      <div className="bg-surface-container-lowest shadow-sm rounded-xl border border-outline-variant/30">
        {/* Sub-header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/30">
          <span className="text-xs text-on-surface-variant font-medium">
            {expedientesFiltrados.length} elemento{expedientesFiltrados.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={expandAll} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-[14px]">unfold_more</span>
              Expandir todo
            </button>
            <span className="text-outline-variant text-xs">·</span>
            <button onClick={collapseAll} className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[14px]">unfold_less</span>
              Colapsar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="w-10 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant" />
                <th className="w-44 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">N° Causa / Exp.</th>
                <th className="py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Carátula</th>
                <th className="w-24 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Área</th>
                <th className="w-36 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo</th>
                <th className="w-36 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Letrado</th>
                <th className="w-28 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Estado</th>
                <th className="w-24 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recepción</th>
                <th className="w-16 py-3 px-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-[40px] block mb-3 text-outline-variant">inbox</span>
                    Sin resultados para los filtros aplicados.
                  </td>
                </tr>
              )}
              {items.map(item => {
                if (item.kind === 'causa') {
                  const { numeroCausa, expedientes: exps } = item
                  const principal = exps.find(e => e.es_principal) ?? exps[0]
                  const hasAlerta = exps.some(e => e.tiene_alerta)
                  const isExpanded = expandedCausas.has(numeroCausa)
                  const areasBadges = [...new Set(exps.map(e => e.area))] as Area[]
                  const abogadoIds = [...new Set(exps.map(e => e.abogado_id).filter(Boolean) as string[])]

                  return (
                    <Fragment key={numeroCausa}>
                      {/* Fila causa */}
                      <tr
                        className="bg-surface-container-low border-l-4 border-primary/30 hover:border-primary/60 cursor-pointer transition-colors"
                        onClick={() => toggleCausa(numeroCausa)}
                      >
                        {/* Expand icon */}
                        <td className="w-10 py-3 px-2 text-center">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                            isExpanded ? 'bg-primary text-on-primary' : 'bg-primary-container text-primary'
                          }`}>
                            <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                              chevron_right
                            </span>
                          </div>
                        </td>
                        {/* N° Causa */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {hasAlerta && (
                              <span className="material-symbols-outlined text-[14px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                            )}
                            <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
                            <span className="font-mono text-xs font-bold text-primary">{numeroCausa}</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{exps.length} expediente{exps.length !== 1 ? 's' : ''} vinculado{exps.length !== 1 ? 's' : ''}</p>
                        </td>
                        {/* Carátula */}
                        <td className="py-3 px-3 text-sm text-on-surface-variant">—</td>
                        {/* Área */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {areasBadges.map(a => <AreaBadge key={a} area={a} />)}
                          </div>
                          {hasAlerta && (
                            <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                              {exps.find(e => e.tiene_alerta)?.alerta_msg}
                            </p>
                          )}
                        </td>
                        {/* Tipo */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[11px]">link</span>
                            Causa judicial
                          </span>
                        </td>
                        {/* Letrado */}
                        <td className="py-3 px-3">
                          {abogadoIds.length === 0 ? (
                            <span className="text-xs text-on-surface-variant">—</span>
                          ) : abogadoIds.length === 1 ? (
                            <span className="text-xs text-on-surface">{nombreAbogado(abogadoIds[0])}</span>
                          ) : (
                            <span className="text-xs text-on-surface">{nombreAbogado(abogadoIds[0])} <span className="text-on-surface-variant">+{abogadoIds.length - 1}</span></span>
                          )}
                        </td>
                        {/* Estado */}
                        <td className="py-3 px-3">
                          <EstadoBadge code={principal.estado} label={principal.estado} />
                        </td>
                        {/* Recepción */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-xs text-on-surface-variant">{formatFecha(principal.fecha_recepcion)}</span>
                        </td>
                        {/* Ver todo */}
                        <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            className="text-[11px] font-bold text-primary hover:underline whitespace-nowrap"
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
                    className="cursor-pointer hover:bg-surface-container-low transition-colors"
                    onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id))}
                  >
                    <td className="w-10 py-3 px-2 text-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${
                        exp.tiene_alerta ? 'bg-error-container' : 'bg-surface-container'
                      }`}>
                        <span
                          className={`material-symbols-outlined text-[18px] ${exp.tiene_alerta ? 'text-error' : 'text-on-surface-variant'}`}
                          style={{ fontVariationSettings: exp.tiene_alerta ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          {exp.tiene_alerta ? 'warning' : 'description'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-mono text-xs font-bold text-primary">{exp.id}</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-on-surface-variant">
                        <span className="material-symbols-outlined text-[11px]">folder_off</span>
                        Sin causa
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-sm text-on-surface line-clamp-2">{exp.caratula}</p>
                      {exp.tiene_alerta && exp.alerta_msg && (
                        <p className="text-[10px] text-error mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                          {exp.alerta_msg}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3"><AreaBadge area={exp.area} /></td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-on-surface-variant">{TIPO_LABEL[exp.tipo] ?? exp.tipo}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-on-surface">{nombreAbogado(exp.abogado_id)}</span>
                    </td>
                    <td className="py-3 px-3"><EstadoBadge code={exp.estado} label={exp.estado} /></td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-xs text-on-surface-variant">{formatFecha(exp.fecha_recepcion)}</span>
                    </td>
                    <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto hover:bg-surface-container text-on-surface-variant transition-colors"
                        onClick={e => abrirMenu(e, exp.id)}
                      >
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                      {menuAbierto === exp.id && renderMenuExpediente(exp)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
          <div className="mt-1 border border-outline-variant rounded-lg bg-surface-container-lowest shadow-sm max-h-32 overflow-y-auto">
            {causasExistentes.map(nc => (
              <button
                key={nc}
                className="w-full text-left px-3 py-2 text-sm font-mono text-primary hover:bg-surface-container transition-colors"
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
