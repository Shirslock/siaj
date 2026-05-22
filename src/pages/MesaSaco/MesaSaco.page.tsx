import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { AreaBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TIPOS_GESTION, LINEAS_FERROVIARIAS } from '../../data/catalogos'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { formatFecha } from '../../utils/format'
import type { Area, Usuario } from '../../types'
import Icon from '../../components/ui/Icon'

const AREA_CELDA: Record<Area, string> = {
  CIVIL:   'bg-[rgba(196,223,232,0.60)] text-[#1b3a57]',
  LABORAL: 'bg-[#dbeafe] text-[#1b3a57]',
  PENAL:   'bg-[#e8e8e8] text-[#1b3a57]',
}

const filterInputCls =
  'w-full px-2 py-1.5 text-xs border border-[rgba(0,0,0,0.15)] rounded-md bg-white ' +
  'text-[#1b3a57] placeholder-[#a0b0bc] focus:outline-none focus:border-[#1b3a57]'

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
          <p className="text-[10px] uppercase tracking-wide font-medium text-[#4a6a84] mb-1">
            SIAJ › Mesa SACO
          </p>
          <h1 className="font-headline font-bold text-2xl text-[#1b3a57] leading-tight">
            Bandeja Mesa SACO
          </h1>
          <p className="text-[#4a6a84] text-sm mt-1">
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

      {/* ── Tabla de expedientes ── */}
      <div className="bg-white shadow-sm rounded-xl border border-[rgba(0,0,0,0.08)] overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2">
            <Icon name="assignment" size={20} className="text-[#1b3a57]" />
            <span className="font-semibold text-[#1b3a57] text-sm">Expedientes Asignados</span>
          </div>
          <span className="text-[10px] font-bold bg-[#e8e8e8] text-[#4a6a84] px-3 py-1 rounded-full border border-[rgba(0,0,0,0.12)]/80">
            {expedientesFiltrados.length} expedientes
          </span>
        </div>

        {/* Toolbar limpiar */}
        <div className="flex justify-end px-4 py-2 border-b border-[rgba(0,0,0,0.05)]">
          <button
            onClick={() => setFiltros(FILTROS_INIT)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#4a6a84] hover:text-[#1b3a57] transition-colors"
          >
            <Icon name="filter_alt_off" size={14} />
            Limpiar filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              {/* Fila 1: labels */}
              <tr className="border-b border-[rgba(0,0,0,0.08)] bg-[#f9f9f9]">
                {['N° Interno','N° Causa','Área','Carátula','Tipo de Gestión','Referencia GDE','Letrado','Línea','Recepción',''].map(col => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>

              {/* Fila 2: inputs de filtro */}
              <tr className="border-b-2 border-[rgba(0,0,0,0.10)] bg-[#f5f5f5]">
                {/* N° Interno — buscar (id/causa/caratula) */}
                <th className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="C-0023…"
                    value={filtros.buscar}
                    onChange={e => setFiltro('buscar', e.target.value)}
                    className={filterInputCls}
                  />
                </th>
                {/* N° Causa */}
                <th className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="Causa…"
                    value={filtros.causa}
                    onChange={e => setFiltro('causa', e.target.value)}
                    className={filterInputCls}
                  />
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
                {/* Carátula — comparte filtros.buscar */}
                <th className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="Carátula…"
                    value={filtros.buscar}
                    onChange={e => setFiltro('buscar', e.target.value)}
                    className={filterInputCls}
                  />
                </th>
                {/* Tipo de Gestión */}
                <th className="px-2 py-1.5">
                  <select value={filtros.tipo} onChange={e => setFiltro('tipo', e.target.value)} className={filterInputCls}>
                    <option value="">Todos</option>
                    {tiposUnicos.map(t => (
                      <option key={t} value={t}>{TIPOS_GESTION.find(tg => tg.code === t)?.label ?? t}</option>
                    ))}
                  </select>
                </th>
                {/* Referencia GDE */}
                <th className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="EX-2026-…"
                    value={filtros.gde}
                    onChange={e => setFiltro('gde', e.target.value)}
                    className={`${filterInputCls} font-mono`}
                  />
                </th>
                {/* Letrado */}
                <th className="px-2 py-1.5">
                  <select value={filtros.abogado_id} onChange={e => setFiltro('abogado_id', e.target.value)} className={filterInputCls}>
                    <option value="">Todos</option>
                    {abogadosUnicos.map(u => (
                      <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
                    ))}
                  </select>
                </th>
                {/* Línea — sin filtro */}
                <th className="px-2 py-1.5" />
                {/* Recepción desde */}
                <th className="px-2 py-1.5">
                  <input
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={e => setFiltro('fechaDesde', e.target.value)}
                    className={filterInputCls}
                  />
                </th>
                {/* Acciones */}
                <th className="px-2 py-1.5" />
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
              {expedientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[#4a6a84] text-sm">
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
                      className="cursor-pointer hover:bg-[#f0f0f0] transition-colors"
                      onClick={() => navigate('/expediente/' + e.id)}
                    >
                      {/* N° Interno */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-[#1b3a57]">{e.id}</span>
                        <span className={`block text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 w-fit ${AREA_CELDA[e.area]}`}>
                          {e.area}
                        </span>
                      </td>

                      {/* N° Causa */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-[#4a6a84]">
                          {e.numero_causa || '—'}
                        </span>
                      </td>

                      {/* Área */}
                      <td className="px-4 py-3">
                        <AreaBadge area={e.area} />
                      </td>

                      {/* Carátula */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-sm font-semibold text-[#1b3a57] line-clamp-2 leading-snug">
                          {e.caratula}
                        </p>
                      </td>

                      {/* Tipo de Gestión */}
                      <td className="px-4 py-3 text-xs text-[#4a6a84] whitespace-nowrap">
                        {TIPOS_GESTION.find(t => t.code === e.tipo)?.label || e.tipo}
                      </td>

                      {/* Referencia GDE */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-[#4a6a84]">
                          {e.numero_ee_gde || '—'}
                        </span>
                      </td>

                      {/* Letrado */}
                      <td className="px-4 py-3 text-xs text-[#1b3a57] whitespace-nowrap">
                        {letrado ? getNombreCompleto(letrado) : '—'}
                      </td>

                      {/* Línea */}
                      <td className="px-4 py-3">
                        {linea ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e8e8e8] text-[#4a6a84]">
                            {linea.label.replace('Línea ', '')}
                          </span>
                        ) : (
                          <span className="text-[rgba(0,0,0,0.35)] text-[10px]">—</span>
                        )}
                      </td>

                      {/* Recepción */}
                      <td className="px-4 py-3 text-xs text-[#4a6a84] whitespace-nowrap">
                        {formatFecha(e.fecha_recepcion)}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-right">
                        <button
                          className="p-1.5 hover:bg-[#e8e8e8] rounded-lg transition-colors"
                          onClick={ev => { ev.stopPropagation(); navigate('/expediente/' + e.id) }}
                          aria-label="Ver detalle"
                        >
                          <Icon name="visibility" size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer decorativo */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-[rgba(0,0,0,0.08)]">
          <span className="text-xs text-[#4a6a84]">Página 1 de 1</span>
          <span className="text-[10px] font-bold bg-[#1b3a57] text-white px-3 py-1 rounded-full">
            1
          </span>
        </div>

      </div>
    </div>
  )
}
