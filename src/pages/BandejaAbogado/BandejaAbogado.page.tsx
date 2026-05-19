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

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BandejaAbogadoPage() {
  const navigate = useNavigate()
  const { expedientes, actualizarExpediente } = useExpedientesStore()
  const { usuarioActivo, showToast } = useUIStore()

  const [filtros, setFiltros] = useState({ buscar: '', area: '', tipo: '', estado: '' })
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

  function abrirMenu(e: React.MouseEvent<HTMLButtonElement>, expId: string) {
    e.stopPropagation()
    if (menuAbierto === expId) { setMenuAbierto(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setMenuAbierto(expId)
  }

  function confirmarAgrupar() {
    if (!inputCausa.trim() || !modalAgrupar) return
    actualizarExpediente(modalAgrupar, { numero_causa: inputCausa.trim() })
    showToast('Expediente agrupado a la causa correctamente.', 'success')
    setModalAgrupar(null)
    setInputCausa('')
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  function renderMenu(exp: Expediente) {
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
            onClick={() => {
              actualizarExpediente(exp.id, { numero_causa: null })
              showToast('Expediente desagrupado correctamente.', 'info')
              setMenuAbierto(null)
            }}
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">link_off</span>
            Desagrupar
          </button>
        )}
      </div>
    )
  }

  // Shared expediente row (used in both causa child rows and sueltos)
  function renderExpRow(exp: Expediente, isSuelto = false) {
    return (
      <tr
        key={exp.id}
        className={`cursor-pointer hover:bg-surface-container-low transition-colors ${isSuelto ? '' : 'animate-slide-down'} border-l-4 ${
          exp.es_principal ? 'border-emerald-400/60' : isSuelto ? 'border-transparent' : 'border-primary/10'
        }`}
        style={exp.es_principal && !isSuelto ? { background: 'linear-gradient(to right, rgba(16,185,129,0.03), transparent)' } : {}}
        onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id))}
      >
        {/* Icon */}
        <td className="w-10 py-3 px-2 text-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto bg-surface-container">
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
              description
            </span>
          </div>
        </td>
        {/* N° */}
        <td className="py-3 px-3">
          <p className="font-mono text-xs font-bold text-primary">{exp.id}</p>
          {exp.es_principal && (
            <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 w-fit bg-green-100 text-green-700 border border-green-200/60">
              Principal · PJN
            </span>
          )}
          {isSuelto && (
            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-on-surface-variant">
              <span className="material-symbols-outlined text-[11px]">folder_off</span>
              Sin causa
            </span>
          )}
        </td>
        {/* Carátula */}
        <td className="py-3 px-3 max-w-[280px]">
          <p className="text-sm text-on-surface line-clamp-2">{exp.caratula}</p>
        </td>
        {/* Área */}
        <td className="py-3 px-3"><AreaBadge area={exp.area} /></td>
        {/* Tipo */}
        <td className="py-3 px-3">
          <span className="text-xs text-on-surface-variant">{TIPO_LABEL[exp.tipo] ?? exp.tipo}</span>
        </td>
        {/* Estado */}
        <td className="py-3 px-3"><EstadoBadge code={exp.estado} label={exp.estado} /></td>
        {/* Recepción */}
        <td className="py-3 px-3 whitespace-nowrap">
          <span className="text-xs text-on-surface-variant">{formatFecha(exp.fecha_recepcion)}</span>
        </td>
        {/* Menú */}
        <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto hover:bg-surface-container text-on-surface-variant transition-colors"
            onClick={e => abrirMenu(e, exp.id)}
          >
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
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
          <h1 className="font-headline font-extrabold text-3xl text-on-surface">Mi Bandeja</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Hola, {usuarioActivo?.nombre ?? ''}. Tenés{' '}
            <span className="font-semibold text-on-surface">{activosCount}</span>{' '}
            expediente{activosCount !== 1 ? 's' : ''} activo{activosCount !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-surface-container-lowest shadow-sm rounded-xl px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>
            <input
              className="field-input pl-9"
              placeholder="Buscar carátula, número, causa…"
              value={filtros.buscar}
              onChange={e => setFiltro('buscar', e.target.value)}
            />
          </div>
          <select className="field-input min-w-[120px] w-auto" value={filtros.area} onChange={e => setFiltro('area', e.target.value)}>
            <option value="">Área: Todas</option>
            <option value="CIVIL">Civil</option>
            <option value="LABORAL">Laboral</option>
            <option value="PENAL">Penal</option>
          </select>
          <select className="field-input min-w-[160px] w-auto" value={filtros.tipo} onChange={e => setFiltro('tipo', e.target.value as TipoGestion | '')}>
            <option value="">Tipo: Todos</option>
            {tiposUnicos.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
          <select className="field-input min-w-[160px] w-auto" value={filtros.estado} onChange={e => setFiltro('estado', e.target.value)}>
            <option value="">Estado: Todos</option>
            {estadosUnicos.map(est => <option key={est} value={est}>{est}</option>)}
          </select>
          {(filtros.buscar || filtros.area || filtros.tipo || filtros.estado) && (
            <button
              className="ml-auto flex items-center gap-1 text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setFiltros({ buscar: '', area: '', tipo: '', estado: '' })}
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* TABLA */}
      {misBandeja.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant">inbox</span>
          <p className="mt-4 text-on-surface-variant text-sm">No tenés expedientes asignados.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest shadow-sm rounded-xl border border-outline-variant/30">
          <div className="flex items-center px-5 py-3 border-b border-outline-variant/30">
            <span className="text-xs text-on-surface-variant font-medium">
              {expedientesFiltrados.length} elemento{expedientesFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="w-10 py-3 px-3" />
                  <th className="w-40 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">N° Expediente</th>
                  <th className="py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Carátula</th>
                  <th className="w-24 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Área</th>
                  <th className="w-36 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo</th>
                  <th className="w-28 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Estado</th>
                  <th className="w-24 py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recepción</th>
                  <th className="w-16 py-3 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-[40px] block mb-3 text-outline-variant">search_off</span>
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
                          className="bg-surface-container-low border-l-4 border-primary/40 hover:border-primary cursor-pointer transition-colors"
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
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-primary-container text-primary'
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                              >
                                chevron_right
                              </span>
                            </div>
                          </td>
                          {/* N° Causa */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-primary">{numeroCausa}</span>
                            </div>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                              {exps.length} exp. vinculado{exps.length !== 1 ? 's' : ''}
                            </p>
                          </td>
                          {/* Carátula principal */}
                          <td className="py-3 px-3 max-w-[280px]">
                            <p className="text-sm text-on-surface line-clamp-2">{principal.caratula}</p>
                          </td>
                          {/* Área */}
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {areasBadges.map(a => <AreaBadge key={a} area={a} />)}
                            </div>
                          </td>
                          {/* Tipo */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                              <span className="material-symbols-outlined text-[11px]">link</span>
                              Causa judicial
                            </span>
                          </td>
                          {/* Estado */}
                          <td className="py-3 px-3">
                            <EstadoBadge code={principal.estado} label={principal.estado} />
                          </td>
                          {/* Recepción */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-xs text-on-surface-variant">{formatFecha(principal.fecha_recepcion)}</span>
                          </td>
                          {/* Flecha */}
                          <td className="py-3 px-3 text-center">
                            <span 
                            className="material-symbols-outlined text-[18px] text-on-surface-variant"
                            onClick={e => { e.stopPropagation(); navigate(RUTAS.CAUSA(numeroCausa)) }}
                            >
                              chevron_right
                            </span>
                          </td>
                        </tr>
                       {isExpanded &&
                          exps.map(exp => renderExpRow(exp, false))
                        }
                        </>
                        )
                    }
                  return renderExpRow(item.exp, true)
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
    </div>
  )
}
