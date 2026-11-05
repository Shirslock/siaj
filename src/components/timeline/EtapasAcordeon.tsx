import { useState } from 'react'
import type { ReactNode } from 'react'
import Icon from '../ui/Icon'
import { formatFecha } from '../../utils/format'

export interface EtapaTL {
  key: string
  label: string
  actual: boolean
  /** Fecha de ingreso a la etapa (ISO). */
  fecha: string
  /** "Ingresó desde X · por USUARIO" (etapa actual). */
  ingreso?: { label: string; por?: string }
  /** "Salió hacia Y · por USUARIO" (etapas pasadas). */
  salida?: { label: string; por?: string }
  /** Eventos de la etapa ya renderizados; vacío → "Sin eventos en este estado." */
  eventos: ReactNode[]
  /** Contenido extra antes de los eventos (ej. tareas del estado). */
  extra?: ReactNode
  vacio?: string
}

interface Props {
  etapas: EtapaTL[]
  /** Mensaje cuando no hay ninguna etapa que mostrar. */
  vacio?: string
}

function LineaTransicion({ tipo, label, por }: { tipo: 'ingreso' | 'salida'; label: string; por?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
      <Icon name="swap_horiz" size={14} className="text-blue-500 flex-shrink-0" />
      <span>
        {tipo === 'ingreso' ? 'Ingresó desde' : 'Salió hacia'}{' '}
        <span className="font-semibold text-gray-700">{label}</span>
        {por && (
          <>
            {' '}· por <span className="font-semibold text-gray-700">{por}</span>
          </>
        )}
      </span>
    </div>
  )
}

// Acordeón de etapas del PRD (siaj-design-system.md §8.4 c): una etapa por estado, la más
// reciente arriba. La actual va abierta, resaltada en azul y con el chip ACTUAL.
export function EtapasAcordeon({ etapas, vacio = 'Sin actividad registrada.' }: Props) {
  const [abiertas, setAbiertas] = useState<Set<string>>(
    () => new Set(etapas.filter(e => e.actual).map(e => e.key))
  )

  const toggle = (key: string) =>
    setAbiertas(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  if (etapas.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-8">{vacio}</p>
  }

  return (
    <div className="space-y-2">
      {etapas.map(et => {
        const abierta = abiertas.has(et.key)
        return (
          <div
            key={et.key}
            className={`border rounded-lg overflow-hidden ${et.actual ? 'border-blue-200' : 'border-gray-200 bg-white'}`}
          >
            <button
              type="button"
              onClick={() => toggle(et.key)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors ${
                et.actual ? 'bg-blue-50 hover:bg-blue-100/60' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <span className={`flex-shrink-0 w-2 h-2 rounded-full ${et.actual ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={`text-sm ${et.actual ? 'font-semibold text-blue-700' : 'font-medium text-gray-700'}`}>
                {et.label}
              </span>
              {et.actual && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  ACTUAL
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto mr-2 whitespace-nowrap">{formatFecha(et.fecha)}</span>
              <Icon name={abierta ? 'expand_less' : 'expand_more'} size={16} className="text-gray-400 flex-shrink-0" />
            </button>

            {abierta && (
              <div>
                {et.ingreso && <LineaTransicion tipo="ingreso" label={et.ingreso.label} por={et.ingreso.por} />}
                {et.salida && <LineaTransicion tipo="salida" label={et.salida.label} por={et.salida.por} />}
                {et.extra}
                {et.eventos.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-4">{et.vacio ?? 'Sin eventos en este estado.'}</p>
                ) : (
                  <ul className="px-4 divide-y divide-gray-100">
                    {et.eventos.map((ev, i) => <li key={i}>{ev}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
