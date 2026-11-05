import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { AreaBadge } from '../../components/ui/Badge'
import { TIPOS_GESTION, LINEAS_FERROVIARIAS } from '../../data/catalogos'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { formatFecha } from '../../utils/format'
import { formatNumeroCausaPjn } from '../../utils/numeroCausa'
import { getAlertaExpediente, getAlertaTimer } from '../../utils/alertas'
import { ESTADOS_CERRADO } from '../Home/homeShared'
import type { Expediente, Usuario } from '../../types'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'
import { exportarMesaSacoExcel } from '../../utils/exportBandeja'

// Bandeja SACO — réplica del PRD (siaj-design-system.md §3, §5, §6, §9, §10).

const filterInputCls =
  'w-full text-sm py-1 px-2 rounded-md border border-gray-300 bg-white ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300'

const thCls =
  'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 text-left ' +
  'cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap'

const FILTROS_INIT = {
  interno: '', causa: '', area: '', caratula: '', tipo: '', estado: '',
  gde: '', abogado_id: '', fechaDesde: '', fechaHasta: '',
}

type ColKey = 'id' | 'causa' | 'area' | 'caratula' | 'tipo' | 'estado' | 'gde' | 'letrado' | 'linea' | 'recepcion'

const COLUMNAS: { key: ColKey; label: string }[] = [
  { key: 'id',        label: 'N° Interno' },
  { key: 'causa',     label: 'N° Causa' },
  { key: 'area',      label: 'Área' },
  { key: 'caratula',  label: 'Carátula' },
  { key: 'tipo',      label: 'Tipo de Gestión' },
  { key: 'estado',    label: 'Estado' },
  { key: 'gde',       label: 'Referencia GDE' },
  { key: 'letrado',   label: 'Letrado' },
  { key: 'linea',     label: 'Línea' },
  { key: 'recepcion', label: 'Recepción' },
]

const tipoLabel = (code: string) => TIPOS_GESTION.find(t => t.code === code)?.label ?? code

export default function MesaSacoPage() {
  const navigate = useNavigate()
  const { expedientes, tareasMap } = useExpedientesStore()
  const [filtros, setFiltros] = useState(FILTROS_INIT)
  const [tab, setTab] = useState<'activos' | 'archivados'>('activos')
  const [soloUrgentes, setSoloUrgentes] = useState(false)
  const [orden, setOrden] = useState<{ key: ColKey; dir: 'asc' | 'desc' }>({ key: 'recepcion', dir: 'desc' })
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(25)
  const [menu, setMenu] = useState<{ id: string; top: number; right: number } | null>(null)

  function setFiltro(key: keyof typeof filtros, value: string) {
    setFiltros(f => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    if (!menu) return
    const cerrar = () => setMenu(null)
    document.addEventListener('click', cerrar)
    return () => document.removeEventListener('click', cerrar)
  }, [menu])

  const tiposUnicos = useMemo(
    () => [...new Set(expedientes.map(e => e.tipo))].sort(),
    [expedientes],
  )
  const estadosUnicos = useMemo(
    () => [...new Set(expedientes.map(e => e.estado))].sort(),
    [expedientes],
  )
  const abogadosUnicos = useMemo(
    () =>
      [...new Set(expedientes.filter(e => e.abogado_id).map(e => e.abogado_id!))]
        .map(id => getUsuarioById(id))
        .filter((u): u is Usuario => u !== undefined)
        .sort((a, b) => a.apellido.localeCompare(b.apellido)),
    [expedientes],
  )

  const esCerrado = (e: Expediente) => ESTADOS_CERRADO.includes(e.estado)
  const activosCount = useMemo(() => expedientes.filter(e => !ESTADOS_CERRADO.includes(e.estado)).length, [expedientes])
  const tieneAlerta = (e: Expediente) =>
    getAlertaExpediente(e.id, tareasMap, e.timeline).activa || getAlertaTimer(e).activa

  const expedientesFiltrados = useMemo(() => {
    return expedientes.filter(e => {
      if (tab === 'activos' && esCerrado(e)) return false
      if (tab === 'archivados' && !esCerrado(e)) return false
      if (soloUrgentes && !e.es_urgente) return false
      if (filtros.interno && !e.id.toLowerCase().includes(filtros.interno.toLowerCase())) return false
      if (filtros.caratula && !e.caratula.toLowerCase().includes(filtros.caratula.toLowerCase())) return false
      if (filtros.tipo && e.tipo !== filtros.tipo) return false
      if (filtros.area && e.area !== filtros.area) return false
      if (filtros.estado && e.estado !== filtros.estado) return false
      if (filtros.causa && !(e.numero_causa ?? '').toLowerCase().includes(filtros.causa.toLowerCase())) return false
      if (filtros.gde && !(e.numero_ee_gde ?? '').toLowerCase().includes(filtros.gde.toLowerCase())) return false
      if (filtros.abogado_id && e.abogado_id !== filtros.abogado_id) return false
      if (filtros.fechaDesde && e.fecha_recepcion < filtros.fechaDesde) return false
      if (filtros.fechaHasta && e.fecha_recepcion > filtros.fechaHasta) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expedientes, filtros, tab, soloUrgentes])

  const valorOrden = (e: Expediente, key: ColKey): string => {
    switch (key) {
      case 'id':        return e.id
      case 'causa':     return e.numero_causa ?? ''
      case 'area':      return e.area
      case 'caratula':  return e.caratula
      case 'tipo':      return tipoLabel(e.tipo)
      case 'estado':    return e.estado
      case 'gde':       return e.numero_ee_gde ?? ''
      case 'letrado': {
        const u = e.abogado_id ? getUsuarioById(e.abogado_id) : undefined
        return u ? getNombreCompleto(u) : ''
      }
      case 'linea':     return e.linea ?? ''
      case 'recepcion': return e.fecha_recepcion
    }
  }

  const ordenados = useMemo(() => {
    const f = orden.dir === 'asc' ? 1 : -1
    return [...expedientesFiltrados].sort((a, b) =>
      valorOrden(a, orden.key).localeCompare(valorOrden(b, orden.key), 'es', { numeric: true }) * f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expedientesFiltrados, orden])

  const total = ordenados.length
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const desde = total === 0 ? 0 : (paginaActual - 1) * porPagina + 1
  const hasta = Math.min(total, paginaActual * porPagina)
  const visibles = ordenados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina)

  // Páginas a mostrar: 1 · 2 · … · n (con la actual y sus vecinas)
  const paginasMostradas = useMemo(() => {
    const set = new Set<number>([1, 2, totalPaginas, paginaActual - 1, paginaActual, paginaActual + 1])
    return [...set].filter(p => p >= 1 && p <= totalPaginas).sort((a, b) => a - b)
  }, [totalPaginas, paginaActual])

  function ordenarPor(key: ColKey) {
    setOrden(o => (o.key === key ? { key, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INIT)
    setSoloUrgentes(false)
    setPagina(1)
  }

  function exportar() {
    const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    exportarMesaSacoExcel(
      ordenados,
      id => (id ? LINEAS_FERROVIARIAS.find(l => l.id === id)?.label ?? '' : ''),
      `Bandeja_MesaSACO_${hoy}`,
    )
    toast.success('Excel exportado.')
  }

  function abrirMenu(ev: React.MouseEvent<HTMLButtonElement>, id: string) {
    ev.stopPropagation()
    if (menu?.id === id) { setMenu(null); return }
    const rect = ev.currentTarget.getBoundingClientRect()
    setMenu({ id, top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

  return (
    <div className="p-6 space-y-4">

      {/* Título + acciones (PRD: título a la izquierda, acciones a la derecha) */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Bandeja SACO</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestionando {activosCount} actuacion{activosCount !== 1 ? 'es' : ''} activa{activosCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => navigate('/mesa/alta')}
            className="px-4 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800"
          >
            + Nueva Actuación
          </button>
          {(['activos', 'archivados'] as const).map(val => (
            <button
              key={val}
              onClick={() => { setTab(val); setPagina(1) }}
              className={`px-4 py-1.5 text-sm font-medium border transition-colors ${
                val === 'activos' ? 'rounded-l-md' : 'rounded-r-md -ml-px'
              } ${
                tab === val
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {val === 'activos' ? 'Activos' : 'Archivados'}
            </button>
          ))}
          <button
            onClick={() => { setSoloUrgentes(v => !v); setPagina(1) }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors ${
              soloUrgentes ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon name="fire" size={14} />
            Urgentes
          </button>
          <button
            disabled
            title="Disponible cuando se carguen los plazos"
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors border-gray-300 text-gray-600 opacity-50 cursor-not-allowed`}
          >
            <Icon name="warning" size={14} />
            Por vencer
          </button>
          <button onClick={limpiarFiltros} className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors border-gray-300 text-gray-600 hover:bg-gray-50`}>
            <Icon name="close" size={14} />
            Limpiar filtros
          </button>
          <button
            onClick={exportar}
            disabled={total === 0}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Icon name="download" size={14} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-black/20 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {COLUMNAS.map(c => (
                  <th key={c.key} className={thCls} onClick={() => ordenarPor(c.key)}>
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      <Icon
                        name="unfold_more"
                        size={12}
                        className={orden.key === c.key ? 'text-gray-700' : 'text-gray-300'}
                      />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 border-b border-gray-200" />
              </tr>

              {/* Fila de filtros */}
              <tr className="bg-gray-100">
                <th className="px-4 py-2">
                  <input type="text" placeholder="Buscar..." value={filtros.interno}
                    onChange={e => { setFiltro('interno', e.target.value); setPagina(1) }} className={filterInputCls} />
                </th>
                <th className="px-4 py-2">
                  <input type="text" placeholder="Buscar..." value={filtros.causa}
                    onChange={e => { setFiltro('causa', e.target.value); setPagina(1) }} className={filterInputCls} />
                </th>
                <th className="px-4 py-2">
                  <select value={filtros.area} onChange={e => { setFiltro('area', e.target.value); setPagina(1) }} className={filterInputCls}>
                    <option value="">Todos</option>
                    <option value="CIVIL">Civil</option>
                    <option value="LABORAL">Laboral</option>
                    <option value="PENAL">Penal</option>
                  </select>
                </th>
                <th className="px-4 py-2">
                  <input type="text" placeholder="Buscar..." value={filtros.caratula}
                    onChange={e => { setFiltro('caratula', e.target.value); setPagina(1) }} className={filterInputCls} />
                </th>
                <th className="px-4 py-2">
                  <select value={filtros.tipo} onChange={e => { setFiltro('tipo', e.target.value); setPagina(1) }} className={filterInputCls}>
                    <option value="">Todos</option>
                    {tiposUnicos.map(t => <option key={t} value={t}>{tipoLabel(t)}</option>)}
                  </select>
                </th>
                <th className="px-4 py-2">
                  <select value={filtros.estado} onChange={e => { setFiltro('estado', e.target.value); setPagina(1) }} className={filterInputCls}>
                    <option value="">Todos</option>
                    {estadosUnicos.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </th>
                <th className="px-4 py-2">
                  <input type="text" placeholder="Buscar..." value={filtros.gde}
                    onChange={e => { setFiltro('gde', e.target.value); setPagina(1) }} className={`${filterInputCls} font-mono`} />
                </th>
                <th className="px-4 py-2">
                  <select value={filtros.abogado_id} onChange={e => { setFiltro('abogado_id', e.target.value); setPagina(1) }} className={filterInputCls}>
                    <option value="">Todos</option>
                    {abogadosUnicos.map(u => <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>)}
                  </select>
                </th>
                <th className="px-4 py-2" />
                <th className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <input type="date" value={filtros.fechaDesde}
                      onChange={e => { setFiltro('fechaDesde', e.target.value); setPagina(1) }} className={filterInputCls} />
                    <input type="date" value={filtros.fechaHasta}
                      onChange={e => { setFiltro('fechaHasta', e.target.value); setPagina(1) }} className={filterInputCls} />
                  </div>
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {visibles.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNAS.length + 1} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No hay actuaciones que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                visibles.map(e => {
                  const letrado = e.abogado_id ? getUsuarioById(e.abogado_id) : undefined
                  const linea = e.linea ? LINEAS_FERROVIARIAS.find(l => l.id === e.linea) : undefined
                  const sinCausa = !e.numero_causa || e.numero_causa.toUpperCase() === 'SS'
                  const alerta = tieneAlerta(e)

                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate('/expediente/' + e.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">
                        <span className="font-medium text-blue-700 whitespace-nowrap">{e.id}</span>
                        {sinCausa && <span className="block text-xs text-gray-400 italic">Sin causa</span>}
                        {e.es_urgente && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
                            <Icon name="warning" size={12} className="shrink-0" />
                            URGENTE
                          </span>
                        )}
                        {alerta && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                            <Icon name="schedule" size={12} className="shrink-0" />
                            POR VENCER
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">
                        {sinCausa ? <span className="text-gray-400">—</span> : formatNumeroCausaPjn(e)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-left">
                        <AreaBadge area={e.area} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-left max-w-[240px]">
                        <p className="truncate" title={e.caratula}>{e.caratula || <span className="text-gray-400">—</span>}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">{tipoLabel(e.tipo)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">{e.estado}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">
                        {e.numero_ee_gde || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">
                        {letrado ? getNombreCompleto(letrado) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">
                        {linea ? linea.label.replace('Línea ', '') : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">{formatFecha(e.fecha_recepcion)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="p-1 rounded hover:bg-gray-100 text-gray-500"
                          onClick={ev => abrirMenu(ev, e.id)}
                          aria-label="Acciones"
                        >
                          <Icon name="more_vert" size={20} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación (PRD §10) */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
          <span>
            Mostrando {desde}–{hasta} de <span className="font-semibold">{total}</span>
          </span>
          <div className="flex items-center gap-3">
            <select
              value={porPagina}
              onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1) }}
              className={`${filterInputCls} !w-auto`}
              aria-label="Filas por página"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => setPagina(paginaActual - 1)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {paginasMostradas.map((p, i) => (
                <span key={p} className="flex items-center gap-1">
                  {i > 0 && p - paginasMostradas[i - 1] > 1 && <span className="px-1 text-gray-400">…</span>}
                  <button
                    type="button"
                    onClick={() => setPagina(p)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      p === paginaActual
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menú contextual de fila (PRD §9) */}
      {menu && (
        <div
          style={{ position: 'fixed', top: menu.top, right: menu.right }}
          className="z-50 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1"
          onClick={ev => ev.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => { navigate('/expediente/' + menu.id); setMenu(null) }}
          >
            <Icon name="visibility" size={16} className="text-blue-600 flex-shrink-0" />
            Visualizar
          </button>
        </div>
      )}
    </div>
  )
}
