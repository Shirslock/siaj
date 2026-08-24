import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { usePjnStore } from '../../store/pjn.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { RUTAS } from '../../utils/routing'
import { formatFecha } from '../../utils/format'
import { Button } from '../ui/Button'
import Icon from '../ui/Icon'
import type { NovedadPJN, TipoCambioPJN } from '../../types'

interface Props {
  novedad: NovedadPJN
  mostrarActuacion?: boolean
}

const ICON_POR_TIPO: Record<TipoCambioPJN, string> = {
  nuevo_movimiento:  'article',
  cambio_estado:     'trending_up',
  nueva_resolucion:  'gavel',
  cedula_notificada: 'notifications_none',
}

const LABEL_POR_TIPO: Record<TipoCambioPJN, string> = {
  nuevo_movimiento:  'Nuevo movimiento',
  cambio_estado:     'Cambio de estado',
  nueva_resolucion:  'Nueva resolución',
  cedula_notificada: 'Cédula notificada',
}

export function NovedadPjnCard({ novedad, mostrarActuacion = false }: Props) {
  const navigate = useNavigate()
  const { usuarioActivo } = useUIStore()
  const { aplicarNovedad, descartarNovedad } = usePjnStore()
  const exp = useExpedientesStore(s => s.expedientes.find(e => e.id === novedad.expediente_id))
  const [texto, setTexto] = useState(novedad.valor_sugerido ?? novedad.descripcion)

  const pendiente = novedad.estado === 'pendiente'

  function handleAplicar() {
    if (!usuarioActivo) return
    aplicarNovedad(novedad.id, usuarioActivo.id, texto)
    toast.success('Novedad aplicada — se agregó al timeline de la actuación.')
  }

  function handleDescartar() {
    if (!usuarioActivo) return
    descartarNovedad(novedad.id, usuarioActivo.id)
    toast.info('Novedad descartada.')
  }

  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#e6f1fb] flex items-center justify-center flex-shrink-0">
            <Icon name={ICON_POR_TIPO[novedad.tipo_cambio]} size={16} className="text-[#185fa5]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#185fa5]">
              {LABEL_POR_TIPO[novedad.tipo_cambio]}
            </p>
            <p className="text-sm font-semibold text-[#1b3a57]">{novedad.titulo}</p>
            {mostrarActuacion && exp && (
              <button
                onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id))}
                className="text-xs font-mono text-[#4a6a84] hover:text-[#1b3a57] hover:underline mt-0.5"
              >
                {exp.id} — {exp.caratula}
              </button>
            )}
          </div>
        </div>

        {!pendiente && (
          <span className={`flex-shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
            novedad.estado === 'aplicada'
              ? 'bg-green-100 text-green-700 border border-green-200/60'
              : 'bg-[#e5e5e5] text-[#4a6a84] border border-[rgba(0,0,0,0.08)]'
          }`}>
            {novedad.estado === 'aplicada' ? 'Aplicada' : 'Descartada'}
          </span>
        )}
      </div>

      <p className="text-sm text-[#4a6a84] mb-2">{novedad.descripcion}</p>
      <p className="text-[11px] text-[#7a9ab4] mb-3">Detectada el {formatFecha(novedad.fecha_deteccion)}</p>

      {pendiente ? (
        <>
          {novedad.valor_sugerido && (
            <textarea
              className="field-input w-full text-sm resize-y mb-3"
              rows={2}
              value={texto}
              onChange={e => setTexto(e.target.value)}
            />
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={handleDescartar}>
              Descartar
            </Button>
            <Button variant="primary" size="sm" onClick={handleAplicar}>
              Aplicar
            </Button>
          </div>
        </>
      ) : (
        <p className="text-[11px] text-[#7a9ab4]">
          {novedad.estado === 'aplicada' ? 'Aplicada' : 'Descartada'} el {formatFecha(novedad.fecha_aplicacion!)}
        </p>
      )}
    </div>
  )
}
