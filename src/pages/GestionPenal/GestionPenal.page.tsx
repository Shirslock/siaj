import { useState } from 'react'
import { EstadoBadge } from '../../components/ui/Badge'
import { formatFecha } from '../../utils/format'
import { CARTA_SUCESO_QUEUE, CAUSAS_PENALES } from '../../data/expedientes.mock'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { LINEAS_FERROVIARIAS } from '../../data/catalogos'

interface CartaSuceso {
  id: string
  ee: string
  linea: string
  tipo_hecho: string
  fecha_hecho: string
  lugar: string
  estado: string
}

interface CausaPenal {
  id: string
  linea: string
  tipo_hecho: string
  juzgado: string
  numero_causa: string
  estado: string
  fecha_inicio: string
  abogado_id: string
}

const cartaSucesos = CARTA_SUCESO_QUEUE as unknown as CartaSuceso[]
const causasPenales = CAUSAS_PENALES as unknown as CausaPenal[]

function getLinea(id: string): string {
  return LINEAS_FERROVIARIAS.find(l => l.id === id)?.label ?? id
}

type Tab = 'causas' | 'cartas'

export default function GestionPenalPage() {
  const [tab, setTab] = useState<Tab>('causas')

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">
      <div className="flex gap-1 bg-surface-container p-1 rounded-xl w-fit">
        {([['causas', 'Causas Penales'], ['cartas', 'Cartas Suceso']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-surface-container-lowest shadow-sm text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'causas' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/50">
                {['ID', 'Línea', 'Tipo de Hecho', 'N° Causa / IPP', 'Estado', 'Inicio', 'Letrado/a'].map(col => (
                  <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {causasPenales.map(c => {
                const abogado = getUsuarioById(c.abogado_id)
                return (
                  <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-primary whitespace-nowrap">{c.id}</td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{getLinea(c.linea)}</td>
                    <td className="py-3 px-4 text-xs text-on-surface">{c.tipo_hecho}</td>
                    <td className="py-3 px-4 font-mono text-xs text-on-surface whitespace-nowrap">{c.numero_causa}</td>
                    <td className="py-3 px-4 whitespace-nowrap"><EstadoBadge code={c.estado} label={c.estado} /></td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{formatFecha(c.fecha_inicio)}</td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">
                      {abogado ? getNombreCompleto(abogado) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'cartas' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/50">
                {['EE / N°', 'Línea', 'Tipo de Hecho', 'Fecha Hecho', 'Lugar', 'Estado'].map(col => (
                  <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {cartaSucesos.map(c => (
                <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-on-surface">{c.ee}</td>
                  <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{getLinea(c.linea)}</td>
                  <td className="py-3 px-4 text-xs text-on-surface">{c.tipo_hecho}</td>
                  <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{formatFecha(c.fecha_hecho)}</td>
                  <td className="py-3 px-4 text-xs text-on-surface">{c.lugar}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <EstadoBadge code={c.estado} label={c.estado.replace(/_/g, ' ')} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
