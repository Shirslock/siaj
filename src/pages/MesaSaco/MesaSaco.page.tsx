import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { AreaBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TIPOS_GESTION, LINEAS_FERROVIARIAS } from '../../data/catalogos'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { formatFecha } from '../../utils/format'
import type { Area, Usuario } from '../../types'

const AREA_CELDA: Record<Area, string> = {
  CIVIL:   'bg-primary-container/60 text-on-primary-container',
  LABORAL: 'bg-secondary-container text-on-secondary-fixed',
  PENAL:   'bg-tertiary-container text-on-tertiary-fixed',
}

const inputCls =
  'w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm ' +
  'text-on-surface placeholder:text-on-surface-variant/50 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40'

const labelCls =
  'block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5'

const FILTROS_INIT = {
  buscar: '', tipo: '', area: '', causa: '',
  gde: '', abogado_id: '', fechaDesde: '', fechaHasta: '',
}

export default function MesaSacoPage() {
  const navigate = useNavigate()
  const { expedientes } = useExpedientesStore()
  const [filtros, setFiltros] = useState(FILTROS_INIT)

  function setFiltro(key: keyof typeof filtros, value: string) {
    setFiltros(f => ({ ...f, [key]: value }))
  }

  const tiposUnicos = useMemo(
    () => [...new Set(expedientes.map(e => e.tipo))].sort(),
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

  const expedientesFiltrados = useMemo(() => {
    return expedientes.filter(e => {
      const searchLower = filtros.buscar.toLowerCase()
      if (
        filtros.buscar &&
        !e.caratula.toLowerCase().includes(searchLower) &&
        !e.id.toLowerCase().includes(searchLower) &&
        !(e.numero_causa ?? '').toLowerCase().includes(searchLower)
      )
        return false
      if (filtros.tipo && e.tipo !== filtros.tipo) return false
      if (filtros.area && e.area !== filtros.area) return false
      if (
        filtros.causa &&
        !(e.numero_causa ?? '').toLowerCase().includes(filtros.causa.toLowerCase())
      )
        return false
      if (
        filtros.gde &&
        !(e.numero_ee_gde ?? '').toLowerCase().includes(filtros.gde.toLowerCase())
      )
        return false
      if (filtros.abogado_id && e.abogado_id !== filtros.abogado_id) return false
      if (filtros.fechaDesde && e.fecha_recepcion < filtros.fechaDesde) return false
      if (filtros.fechaHasta && e.fecha_recepcion > filtros.fechaHasta) return false
      return true
    })
  }, [expedientes, filtros])

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide font-medium text-on-surface-variant mb-1">
            SIAJ › Mesa SIAJ
          </p>
          <h1 className="font-headline font-bold text-2xl text-on-surface leading-tight">
            Bandeja Mesa SIAJ
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Consulta de expedientes asignados — vista de solo lectura.
          </p>
        </div>
        <Button
          variant="primary"
          icon="create_new_folder"
          onClick={() => navigate('/mesa/alta')}
        >
          Nuevo Expediente
        </Button>
      </div>

      {/* ── Barra de filtros ── */}
      <div className="bg-surface-container-lowest shadow-sm rounded-xl border border-outline-variant/30 p-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* 1. Buscar */}
          <div className="flex-1 min-w-[200px]">
            <label className={labelCls}>Buscar</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                search
              </span>
              <input
                className={`${inputCls} pl-8`}
                placeholder="Carátula, N° causa, N° interno..."
                value={filtros.buscar}
                onChange={e => setFiltro('buscar', e.target.value)}
              />
            </div>
          </div>

          {/* 2. Tipo de gestión */}
          <div className="min-w-[160px]">
            <label className={labelCls}>Tipo de gestión</label>
            <select
              className={inputCls}
              value={filtros.tipo}
              onChange={e => setFiltro('tipo', e.target.value)}
            >
              <option value="">Todos</option>
              {tiposUnicos.map(t => (
                <option key={t} value={t}>
                  {TIPOS_GESTION.find(tg => tg.code === t)?.label ?? t}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Área */}
          <div className="min-w-[130px]">
            <label className={labelCls}>Área</label>
            <select
              className={inputCls}
              value={filtros.area}
              onChange={e => setFiltro('area', e.target.value)}
            >
              <option value="">Todas</option>
              <option value="CIVIL">Civil</option>
              <option value="LABORAL">Laboral</option>
              <option value="PENAL">Penal</option>
            </select>
          </div>

          {/* 4. N° Causa */}
          <div className="min-w-[160px]">
            <label className={labelCls}>N° Causa</label>
            <input
              className={`${inputCls} font-mono`}
              placeholder="N° Causa..."
              value={filtros.causa}
              onChange={e => setFiltro('causa', e.target.value)}
            />
          </div>

          {/* 5. Referencia GDE */}
          <div className="min-w-[180px]">
            <label className={labelCls}>Referencia GDE</label>
            <input
              className={`${inputCls} font-mono`}
              placeholder="EX-2026-..."
              value={filtros.gde}
              onChange={e => setFiltro('gde', e.target.value)}
            />
          </div>

          {/* 6. Letrado */}
          <div className="min-w-[160px]">
            <label className={labelCls}>Letrado</label>
            <select
              className={inputCls}
              value={filtros.abogado_id}
              onChange={e => setFiltro('abogado_id', e.target.value)}
            >
              <option value="">Todos</option>
              {abogadosUnicos.map(u => (
                <option key={u.id} value={u.id}>
                  {getNombreCompleto(u)}
                </option>
              ))}
            </select>
          </div>

          {/* 7. Recepción desde */}
          <div className="min-w-[130px]">
            <label className={labelCls}>Recepción desde</label>
            <input
              type="date"
              className={inputCls}
              value={filtros.fechaDesde}
              onChange={e => setFiltro('fechaDesde', e.target.value)}
            />
          </div>

          {/* 8. Recepción hasta */}
          <div className="min-w-[130px]">
            <label className={labelCls}>Recepción hasta</label>
            <input
              type="date"
              className={inputCls}
              value={filtros.fechaHasta}
              onChange={e => setFiltro('fechaHasta', e.target.value)}
            />
          </div>

          {/* Limpiar */}
          <div>
            <label className="invisible block text-[10px] mb-1.5">_</label>
            <button
              onClick={() => setFiltros(FILTROS_INIT)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-outline-variant text-xs font-bold text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              Limpiar
            </button>
          </div>

        </div>
      </div>

      {/* ── Tabla de expedientes ── */}
      <div className="bg-surface-container-lowest shadow-sm rounded-xl border border-outline-variant/30 overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              assignment
            </span>
            <span className="font-semibold text-on-surface text-sm">Expedientes Asignados</span>
          </div>
          <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant px-3 py-1 rounded-full border border-outline-variant/80">
            {expedientesFiltrados.length} expedientes
          </span>
        </div>

        <table className="w-full border-collapse">
          <thead className="bg-surface-container-low border-b-2 border-outline-variant/40">
            <tr>
              {[
                'N° Interno', 'N° Causa', 'Área', 'Carátula',
                'Tipo de Gestión', 'Referencia GDE', 'Letrado', 'Línea', 'Recepción', '',
              ].map(col => (
                <th
                  key={col}
                  className="text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-4 py-3.5 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {expedientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                  No hay expedientes que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              expedientesFiltrados.map(e => {
                const letrado = e.abogado_id ? getUsuarioById(e.abogado_id) : undefined
                const linea = e.linea
                  ? LINEAS_FERROVIARIAS.find(l => l.id === e.linea)
                  : undefined

                return (
                  <tr
                    key={e.id}
                    className="cursor-pointer hover:bg-surface-container-low transition-colors"
                    onClick={() => navigate('/expediente/' + e.id)}
                  >
                    {/* N° Interno */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-on-surface">{e.id}</span>
                      <span className={`block text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 w-fit ${AREA_CELDA[e.area]}`}>
                        {e.area}
                      </span>
                    </td>

                    {/* N° Causa */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        {e.numero_causa || '—'}
                      </span>
                    </td>

                    {/* Área */}
                    <td className="px-4 py-3">
                      <AreaBadge area={e.area} />
                    </td>

                    {/* Carátula */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-sm font-semibold text-on-surface line-clamp-2 leading-snug">
                        {e.caratula}
                      </p>
                    </td>

                    {/* Tipo de Gestión */}
                    <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                      {TIPOS_GESTION.find(t => t.code === e.tipo)?.label || e.tipo}
                    </td>

                    {/* Referencia GDE */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        {e.numero_ee_gde || '—'}
                      </span>
                    </td>

                    {/* Letrado */}
                    <td className="px-4 py-3 text-xs text-on-surface whitespace-nowrap">
                      {letrado ? getNombreCompleto(letrado) : '—'}
                    </td>

                    {/* Línea */}
                    <td className="px-4 py-3">
                      {linea ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                          {linea.label.replace('Línea ', '')}
                        </span>
                      ) : (
                        <span className="text-outline-variant text-[10px]">—</span>
                      )}
                    </td>

                    {/* Recepción */}
                    <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                      {formatFecha(e.fecha_recepcion)}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <button
                        className="p-1.5 hover:bg-surface-container rounded-lg transition-colors"
                        onClick={ev => { ev.stopPropagation(); navigate('/expediente/' + e.id) }}
                        aria-label="Ver detalle"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant hover:text-primary text-[18px]">
                          visibility
                        </span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Footer decorativo */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-outline-variant/30">
          <span className="text-xs text-on-surface-variant">Página 1 de 1</span>
          <span className="text-[10px] font-bold bg-primary text-on-primary px-3 py-1 rounded-full">
            1
          </span>
        </div>

      </div>
    </div>
  )
}
