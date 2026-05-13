import { useNavigate } from 'react-router-dom'
import type { Expediente } from '../../types'
import { AreaBadge, EstadoBadge } from '../ui/Badge'
import { formatFecha } from '../../utils/format'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { RUTAS } from '../../utils/routing'

interface Props {
  expedientes: Expediente[]
  compact?: boolean
}

export function TablaExpedientes({ expedientes, compact = false }: Props) {
  const navigate = useNavigate()

  if (expedientes.length === 0) {
    return (
      <div className="py-12 text-center text-on-surface-variant text-sm">
        No hay expedientes para mostrar.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-outline-variant/50">
            <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Número</th>
            <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Área</th>
            {!compact && <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Tipo</th>}
            <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Carátula</th>
            <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Estado</th>
            {!compact && <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Letrado/a</th>}
            <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Recepción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {expedientes.map(exp => {
            const abogado = exp.abogado_id ? getUsuarioById(exp.abogado_id) : undefined
            return (
              <tr
                key={exp.id}
                onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id))}
                className="cursor-pointer hover:bg-surface-container-low transition-colors"
              >
                <td className="py-3 px-4 font-mono text-xs font-semibold text-primary whitespace-nowrap">{exp.id}</td>
                <td className="py-3 px-4"><AreaBadge area={exp.area} /></td>
                {!compact && <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{exp.tipo.replace(/_/g, ' ')}</td>}
                <td className="py-3 px-4 text-on-surface max-w-xs truncate">{exp.caratula}</td>
                <td className="py-3 px-4 whitespace-nowrap"><EstadoBadge code={exp.estado} label={exp.estado} /></td>
                {!compact && <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{abogado ? getNombreCompleto(abogado) : '—'}</td>}
                <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{formatFecha(exp.fecha_recepcion)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
