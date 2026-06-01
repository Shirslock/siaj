import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { TIPOS_GESTION } from '../../data/catalogos'

import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
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

const filterInputCls =
  'w-full px-2 py-1.5 text-xs border border-[rgba(0,0,0,0.15)] rounded-md bg-white ' +
  'text-[#1b3a57] placeholder-[#a0b0bc] focus:outline-none focus:border-[#1b3a57]'

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BandejaAbogadoPage() {
  const navigate = useNavigate()
  const { expedientes, actualizarExpediente } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  const [filtros, setFiltros] = useState({ buscar: '', area: '', tipo: '', estado: '', fechaDesde: '', fechaHasta: '', soloUrgentes: false })
  const [menuAbierto,    setMenuAbierto]    = useState<string | null>(null)
  const [menuPos,        setMenuPos]        = useState({ top: 0, right: 0 })
  const [modalAgrupar,   setModalAgrupar]   = useState<string | null>(null)
  const [inputCausa,     setInputCausa]     = useState('')
  const [expandedCausas, setExpandedCausas] = useState<Set<string>>(new Set())

  // Close menu on outside click
  useEffect(() => {
    if (!menuAbierto) return
    const h = () => setMenuAbierto(null)
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [menuAbierto])

  // ── Computed ──────────────────────────────────────────────────────────────────

  const verTodos =
    usuarioActivo?.rolSistema === 'COORDINADOR' ||
    usuarioActivo?.rolSistema === 'REFERENTE'

  const misBandeja = useMemo(() =>
    expedientes.filter(e => verTodos || e.abogado_id === usuarioActivo?.id),
    [expedientes, usuarioActivo, verTodos]
  )

  const expedientesFiltrados = useMemo(() => {
    return misBandeja.filter(e => {
      if (e.estado === 'CUMPLIDO' || e.estado === 'ARCHIVADO' || e.estado === 'ARCHIVADA') return false
      if (filtros.area && e.area !== filtros.area) return false
      if (filtros.tipo && e.tipo !== filtros.tipo) return false
      if (filtros.estado && e.estado !== filtros.estado) return false
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
  }, [misBandeja, filtros])

  const items = useMemo(() => construirItems(expedientesFiltrados), [expedientesFiltrados])

  const tiposUnicos = useMemo(() =>
    [...new Set(misBandeja.map(e => e.tipo))]
      .map(code => ({ code, label: TIPO_LABEL[code] ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [misBandeja]
  )
  const estadosUnicos = useMemo(() =>
    [...new Set(misBandeja.map(e => e.estado))].sort(),
    [misBandeja]
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
    expedientesFiltrados.filter(e => e.estado !== 'ARCHIVADO' && e.estado !== 'ARCHIVADA').length,
    [expedientesFiltrados]
  )

  // ── Actions ───────────────────────────────────────────────────────────────────

  function setFiltro(key: string, val: string) {
    setFiltros(prev => ({ ...prev, [key]: val }))
  }

  function limpiarFiltros() {
    setFiltros({ buscar: '', area: '', tipo: '', estado: '', fechaDesde: '', fechaHasta: '', soloUrgentes: false })
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

  function confirmarAgrupar() {
    if (!inputCausa.trim() || !modalAgrupar) return
    actualizarExpediente(modalAgrupar, { numero_causa: inputCausa.trim() })
    toast.success('Expediente agrupado a la causa correctamente.')
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
            onClick={() => {
              actualizarExpediente(exp.id, { numero_causa: null })
              toast.info('Expediente desagrupado correctamente.')
              setMenuAbierto(null)
            }}
          >
            <Icon name="link_off" size={16} />
            Desagrupar
          </button>
        )}
      </div>
    )
  }

  // Shared expediente row (used in both causa child rows and sueltos)
  function renderExpRow(exp: Expediente, idx: number, arr: Expediente[]) {
    const isLast = idx === arr.length - 1
    const tieneCausa =
      exp.numero_causa &&
      exp.numero_causa.trim() !== '' &&
      exp.numero_causa.toUpperCase() !== 'SS SOFSE'
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
            ) : (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#f0f7f8] text-[#4a6a84]">
                  <Icon name="description" size={18} />
                </div>
              </div>
            )}
          </td>
          {/* N° + Principal badge */}
          <td className="py-3 pl-2 pr-3">
            <p className="font-mono text-xs font-bold text-[#1b3a57]">{exp.id}</p>
            {exp.es_principal && (
              <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 w-fit bg-green-100 text-green-700 border border-green-200/60">
                Principal · PJN
              </span>
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

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">

      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57]">Mi Bandeja</h1>
          <p className="text-sm text-[#4a6a84] mt-1">
            Hola, {usuarioActivo?.nombre ?? ''}. Tenés{' '}
            <span className="font-semibold text-[#1b3a57]">{activosCount}</span>{' '}
            expediente{activosCount !== 1 ? 's' : ''} activo{activosCount !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      {/* TABLA */}
      {misBandeja.length === 0 ? (
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
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  filtros.soloUrgentes
                    ? 'text-[#b91c1c]'
                    : 'text-[#4a6a84] hover:text-[#1b3a57]'
                }`}
              >
                <Icon name="warning" size={14} />
                {filtros.soloUrgentes ? 'Solo urgentes' : 'Urgentes'}
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
                  <th className="w-28 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">Estado</th>
                  <th className="w-24 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">Recepción</th>
                  <th className="w-16 px-3 py-2.5" />
                </tr>

                {/* Fila 2: inputs de filtro */}
                <tr className="border-b-2 border-[rgba(0,0,0,0.10)] bg-[#f5f5f5]">
                  {/* icono — sin filtro */}
                  <th className="px-2 py-1.5" />
                  {/* N° Causa / Exp — buscar */}
                  <th className="px-2 py-1.5">
                    <input type="text" placeholder="Causa / N°…" value={filtros.buscar} onChange={e => setFiltro('buscar', e.target.value)} className={filterInputCls} />
                  </th>
                  {/* Carátula — buscar (compartido) */}
                  <th className="px-2 py-1.5">
                    <input type="text" placeholder="Carátula…" value={filtros.buscar} onChange={e => setFiltro('buscar', e.target.value)} className={filterInputCls} />
                  </th>
                  {/* Área */}
                  <th className="px-2 py-1.5">
                    <select value={filtros.area} onChange={e => setFiltro('area', e.target.value)} className={filterInputCls}>
                      <option value="">Todas</option>
                      <option value="CIVIL">Civil</option>
                      <option value="LABORAL">Laboral</option>
                      <option value="PENAL">Penal</option>
                    </select>
                  </th>
                  {/* Tipo */}
                  <th className="px-2 py-1.5">
                    <select value={filtros.tipo} onChange={e => setFiltro('tipo', e.target.value as TipoGestion | '')} className={filterInputCls}>
                      <option value="">Todos</option>
                      {tiposUnicos.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </th>
                  {/* Estado */}
                  <th className="px-2 py-1.5">
                    <select value={filtros.estado} onChange={e => setFiltro('estado', e.target.value)} className={filterInputCls}>
                      <option value="">Todos</option>
                      {estadosUnicos.map(est => <option key={est} value={est}>{est}</option>)}
                    </select>
                  </th>
                  {/* Recepción desde / hasta */}
                  <th className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={filtros.fechaDesde}
                        onChange={e => setFiltro('fechaDesde', e.target.value)}
                        className={filterInputCls}
                      />

                      <input
                        type="date"
                        value={filtros.fechaHasta}
                        onChange={e => setFiltro('fechaHasta', e.target.value)}
                        className={filterInputCls}
                      />
                    </div>
                  </th>
                  {/* Acciones — sin filtro */}
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#4a6a84] text-sm">
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
                      <>
                        <tr
                          key={numeroCausa}
                          className="bg-[#f0f0f0] border-l-4 border-[rgba(27,58,87,0.40)] hover:border-[#1b3a57] cursor-pointer transition-colors"
                          onClick={() => setExpandedCausas(prev => {
                            const next = new Set(prev)
                            next.has(numeroCausa) ? next.delete(numeroCausa) : next.add(numeroCausa)
                            return next
                          })}
                        >
                          {/* Icon */}
                          <td className="w-10 py-3 px-2 text-center">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                isExpanded
                                  ? 'bg-[#1b3a57] text-white'
                                  : 'bg-[#C4DFE8] text-[#1b3a57]'
                              }`}
                            >
                              <Icon name="chevron_right" size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </td>
                          {/* N° Causa */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <Icon name="folder" size={14} className="text-[#1b3a57]" />
                              <span className="font-mono text-xs font-bold text-[#1b3a57]">{numeroCausa}</span>
                            </div>
                            <p className="text-[10px] text-[#4a6a84] mt-0.5">
                              {exps.length} exp. vinculado{exps.length !== 1 ? 's' : ''}
                            </p>
                          </td>
                          {/* Carátula principal */}
                          <td className="py-3 px-3 max-w-[280px]">
                            <p className="text-sm text-[#1b3a57] line-clamp-2">{principal.caratula}</p>
                          </td>
                          {/* Área */}
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {areasBadges.map(a => <AreaBadge key={a} area={a} />)}
                            </div>
                          </td>
                          {/* Tipo */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[rgba(27,58,87,0.10)] text-[#1b3a57]">
                              <Icon name="link" size={11} />
                              Causa judicial
                            </span>
                          </td>
                          {/* Estado */}
                          <td className="py-3 px-3">
                            <EstadoBadge code={principal.estado} label={principal.estado} />
                          </td>
                          {/* Recepción */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-xs text-[#4a6a84]">{formatFecha(principal.fecha_recepcion)}</span>
                          </td>
                          {/* Ver Todo */}
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
                        </>
                        )
                    }
                  return renderExpRow(item.exp, 0, [item.exp])
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
    </div>
  )
}
