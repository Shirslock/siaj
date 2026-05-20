import type { Expediente } from '../../../types'
import { formatMonto } from '../../../utils/format'

interface Props { exp: Expediente }

const HISTORICO_MOCK = [
  { periodo: 'Ene 2026', tasa: '0.0%',  acumulada: '0.0%',  monto: null },
  { periodo: 'Feb 2026', tasa: '7.2%',  acumulada: '7.2%',  monto: null },
  { periodo: 'Mar 2026', tasa: '5.8%',  acumulada: '13.4%', monto: null },
  { periodo: 'Abr 2026', tasa: '8.1%',  acumulada: '22.6%', monto: null },
  { periodo: 'May 2026', tasa: '6.3%',  acumulada: '30.4%', monto: null },
]

export function PrevisionTab({ exp }: Props) {
  const montoBase = Number(exp.campos_mesa['monto_reclamado'] ?? exp.campos_abogado['monto_acuerdo'] ?? 0)
  const montoActualizado = montoBase * 1.38
  const pronostico = montoActualizado * 0.65

  function MetricCard({ titulo, valor, subtitulo, highlight }: { titulo: string; valor: string; subtitulo?: string; highlight?: boolean }) {
    return (
      <div className={`rounded-2xl shadow-card p-5 ${highlight ? 'bg-[#C4DFE8]' : 'bg-white'}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${highlight ? 'text-[#1b3a57]' : 'text-[#4a6a84]'}`}>
          {titulo}
        </p>
        <p className={`text-2xl font-headline font-bold ${highlight ? 'text-[#1b3a57]' : 'text-[#1b3a57]'}`}>
          {valor}
        </p>
        {subtitulo && (
          <p className={`text-xs mt-1 ${highlight ? 'text-[#1b3a57]' : 'text-[#4a6a84]'}`}>{subtitulo}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 mb-1">
        <span className="material-symbols-outlined text-[18px] text-amber-600 flex-shrink-0 mt-0.5">construction</span>
        <div>
          <p className="text-xs font-bold text-amber-800">Pestaña a relevar con el negocio</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Los cálculos, tasas y métricas mostrados son ejemplos ilustrativos. La lógica definitiva deberá confirmarse con el área requirente antes de implementar.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          titulo="Monto Demanda"
          valor={montoBase ? formatMonto(montoBase) : '—'}
          subtitulo="Monto reclamado al inicio"
        />
        <MetricCard
          titulo="Monto Actualizado"
          valor={montoBase ? formatMonto(montoActualizado) : '—'}
          subtitulo="× 1,38 — tasa interna SOFSA"
        />
        <MetricCard
          titulo="Pronóstico"
          valor={montoBase ? formatMonto(pronostico) : '—'}
          subtitulo="Estimación 65% del monto actualizado"
          highlight
        />
      </div>

      {montoBase > 0 && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.12)]">
            <p className="text-sm font-semibold text-[#1b3a57]">Evolución estimada</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.10)]">
                {['Período', 'Tasa mensual', 'Acumulada', 'Monto estimado'].map(col => (
                  <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-[#4a6a84]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {HISTORICO_MOCK.map((row, i) => {
                const factor = 1 + parseFloat(row.acumulada) / 100
                const montoRow = montoBase * factor
                return (
                  <tr key={i} className="hover:bg-[#f0f0f0] transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-[#1b3a57]">{row.periodo}</td>
                    <td className="py-3 px-4 text-xs text-[#4a6a84]">{row.tasa}</td>
                    <td className="py-3 px-4 text-xs text-[#4a6a84]">{row.acumulada}</td>
                    <td className="py-3 px-4 text-xs font-mono text-[#1b3a57]">{formatMonto(montoRow)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-[#4a6a84] text-center">
        Integración SIGEJ pendiente — Datos calculados en base a tasa de actualización interna SOFSA.
        Los valores son estimativos y no tienen carácter oficial.
      </p>
    </div>
  )
}
