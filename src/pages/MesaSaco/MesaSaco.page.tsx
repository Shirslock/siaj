import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { AreaBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TIPOS_GESTION, LINEAS_FERROVIARIAS } from '../../data/catalogos'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { formatFecha } from '../../utils/format'
import type { Usuario } from '../../types'
import Icon from '../../components/ui/Icon'

const filterInputCls =
  'h-[45px] px-[16px] text-xs border border-line rounded-[4px] bg-paper ' +
  'text-[#242C4F] placeholder-[#a0b0bc] focus:outline-none focus:border-teal'

const FILTROS_INIT = {
  buscar: '', tipo: '', area: '', causa: '',
  gde: '', abogado_id: '', linea: '', fechaDesde: '', fechaHasta: '',
}

// Select con punto 10px a la izquierda y chevron 12px a la derecha — mismo
// patrón para los 4 desplegables de la barra de filtros (Área, Tipo de
// Gestión, Letrado, Línea).
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
      if (filtros.linea && e.linea !== filtros.linea) return false
      if (filtros.fechaDesde && e.fecha_recepcion < filtros.fechaDesde) return false
      if (filtros.fechaHasta && e.fecha_recepcion > filtros.fechaHasta) return false
      return true
    })
  }, [expedientes, filtros])

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">

      {/* ── Header — sin breadcrumb ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-[#242C4F] leading-tight">
            Bandeja Mesa SACO
          </h1>
          <p className="text-[#758A93] text-sm mt-1">
            Consulta de expedientes asignados — vista de solo lectura.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="inline-flex items-center h-[30px] px-2 rounded-badge text-[10px] font-bold tracking-wide bg-neutral text-white">
            {expedientesFiltrados.length} expedientes
          </span>
          <Button
            variant="primary"
            icon="create_new_folder"
            onClick={() => navigate('/mesa/alta')}
          >
            Nueva Actuación
          </Button>
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div className="flex items-center flex-wrap gap-2">
        <input
          type="text"
          placeholder="N° Interno…"
          value={filtros.buscar}
          onChange={e => setFiltro('buscar', e.target.value)}
          className={filterInputCls}
        />
        <input
          type="text"
          placeholder="N° Causa…"
          value={filtros.causa}
          onChange={e => setFiltro('causa', e.target.value)}
          className={filterInputCls}
        />
        <input
          type="text"
          placeholder="Carátula…"
          value={filtros.buscar}
          onChange={e => setFiltro('buscar', e.target.value)}
          className={filterInputCls}
        />
        <input
          type="text"
          placeholder="Referencia GDE…"
          value={filtros.gde}
          onChange={e => setFiltro('gde', e.target.value)}
          className={`${filterInputCls} font-mono`}
        />
        <FiltroSelect value={filtros.area} onChange={e => setFiltro('area', e.target.value)} ariaLabel="Área">
          <option value="">Área: Todas</option>
          <option value="CIVIL">Civil</option>
          <option value="LABORAL">Laboral</option>
          <option value="PENAL">Penal</option>
        </FiltroSelect>
        <FiltroSelect value={filtros.tipo} onChange={e => setFiltro('tipo', e.target.value)} ariaLabel="Tipo de Gestión">
          <option value="">Tipo: Todos</option>
          {tiposUnicos.map(t => (
            <option key={t} value={t}>{TIPOS_GESTION.find(tg => tg.code === t)?.label ?? t}</option>
          ))}
        </FiltroSelect>
        <FiltroSelect value={filtros.abogado_id} onChange={e => setFiltro('abogado_id', e.target.value)} ariaLabel="Letrado">
          <option value="">Letrado: Todos</option>
          {abogadosUnicos.map(u => (
            <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
          ))}
        </FiltroSelect>
        <FiltroSelect value={filtros.linea} onChange={e => setFiltro('linea', e.target.value)} ariaLabel="Línea">
          <option value="">Línea: Todas</option>
          {LINEAS_FERROVIARIAS.map(l => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
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
          onClick={() => setFiltros(FILTROS_INIT)}
          className="w-[74px] h-[32px] rounded-[4px] bg-teal text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Limpiar
        </button>
      </div>

      {/* ── Tabla — directa sobre el fondo crema ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
            {expedientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-[#758A93] text-sm">
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
                    className="cursor-pointer hover:bg-[#E3E4E9] transition-colors bg-white"
                    onClick={() => navigate('/expediente/' + e.id)}
                  >
                    {/* N° Interno */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-[#242C4F]">{e.id}</span>
                    </td>

                    {/* N° Causa */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-[#758A93]">
                        {e.numero_causa || '—'}
                      </span>
                    </td>

                    {/* Área */}
                    <td className="px-4 py-3">
                      <AreaBadge area={e.area} />
                    </td>

                    {/* Carátula */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-sm font-semibold text-[#242C4F] line-clamp-2 leading-snug">
                        {e.caratula}
                      </p>
                    </td>

                    {/* Tipo de Gestión */}
                    <td className="px-4 py-3 text-xs text-[#758A93] whitespace-nowrap">
                      {TIPOS_GESTION.find(t => t.code === e.tipo)?.label || e.tipo}
                    </td>

                    {/* Referencia GDE */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-[#758A93]">
                        {e.numero_ee_gde || '—'}
                      </span>
                    </td>

                    {/* Letrado */}
                    <td className="px-4 py-3 text-xs text-[#242C4F] whitespace-nowrap">
                      {letrado ? getNombreCompleto(letrado) : '—'}
                    </td>

                    {/* Línea */}
                    <td className="px-4 py-3">
                      {linea ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E3E4E9] text-[#758A93]">
                          {linea.label.replace('Línea ', '')}
                        </span>
                      ) : (
                        <span className="text-[rgba(0,0,0,0.35)] text-[10px]">—</span>
                      )}
                    </td>

                    {/* Recepción */}
                    <td className="px-4 py-3 text-xs text-[#758A93] whitespace-nowrap">
                      {formatFecha(e.fecha_recepcion)}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <button
                        className="p-1.5 hover:bg-[#E3E4E9] rounded-lg transition-colors"
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

      {/* ── Paginación ── */}
      <div className="flex justify-between items-center px-1 py-2">
        <span className="text-xs text-[#758A93]">Página 1 de 1</span>
        <button className="w-[74px] h-[32px] rounded-[4px] bg-teal text-white text-xs font-bold">
          1
        </button>
      </div>

    </div>
  )
}
