import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { formatFecha } from '../../utils/format'
import { RUTAS } from '../../utils/routing'
import type { Expediente } from '../../types'

export default function BandejaAbogadoPage() {
  const { expedientes } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const navigate = useNavigate()

  const misBandeja = useMemo(() =>
    expedientes.filter(e => e.abogado_id === usuarioActivo?.id),
    [expedientes, usuarioActivo])

  const { porCausa, sinCausa } = useMemo(() => {
    const causas = new Map<string, Expediente[]>()
    const sin: Expediente[] = []
    for (const exp of misBandeja) {
      const nc = exp.numero_causa
      if (!nc || nc === 'SS') {
        sin.push(exp)
      } else {
        if (!causas.has(nc)) causas.set(nc, [])
        causas.get(nc)!.push(exp)
      }
    }
    return { porCausa: causas, sinCausa: sin }
  }, [misBandeja])

  if (misBandeja.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant">inbox</span>
          <p className="mt-4 text-on-surface-variant text-sm">No tenés expedientes asignados.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">
      <p className="text-on-surface-variant text-sm">
        {misBandeja.length} expediente{misBandeja.length !== 1 ? 's' : ''} asignado{misBandeja.length !== 1 ? 's' : ''}
      </p>

      {Array.from(porCausa.entries()).map(([numeroCausa, exps]) => (
        <div key={numeroCausa} className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          <button
            onClick={() => navigate(RUTAS.CAUSA(numeroCausa))}
            className="w-full flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">folder_open</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">N° Causa</p>
                <p className="font-mono font-semibold text-on-surface text-sm">{numeroCausa}</p>
              </div>
              <span className="ml-2 text-xs bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
                {exps.length} exp.
              </span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
          </button>
          <ExpedientesInlineTable expedientes={exps} onNavigate={navigate} />
        </div>
      ))}

      {sinCausa.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-outline-variant/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">description</span>
            <p className="text-sm font-medium text-on-surface-variant">Sin causa judicial</p>
          </div>
          <ExpedientesInlineTable expedientes={sinCausa} onNavigate={navigate} />
        </div>
      )}
    </div>
  )
}

function ExpedientesInlineTable({
  expedientes,
  onNavigate,
}: {
  expedientes: Expediente[]
  onNavigate: (path: string) => void
}) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-outline-variant/30">
        {expedientes.map(exp => (
          <tr
            key={exp.id}
            onClick={() => onNavigate(RUTAS.EXPEDIENTE(exp.id))}
            className="cursor-pointer hover:bg-surface-container-low transition-colors"
          >
            <td className="py-3 px-5 font-mono text-xs font-semibold text-primary w-36 whitespace-nowrap">{exp.id}</td>
            <td className="py-3 px-2"><AreaBadge area={exp.area} /></td>
            <td className="py-3 px-3 text-on-surface max-w-xs truncate">{exp.caratula}</td>
            <td className="py-3 px-3 whitespace-nowrap"><EstadoBadge code={exp.estado} label={exp.estado} /></td>
            <td className="py-3 px-3 text-xs text-on-surface-variant whitespace-nowrap">{formatFecha(exp.fecha_recepcion)}</td>
            <td className="py-3 px-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
