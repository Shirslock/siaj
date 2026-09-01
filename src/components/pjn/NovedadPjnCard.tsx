import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { usePjnStore } from '../../store/pjn.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { RUTAS } from '../../utils/routing'
import { formatFecha } from '../../utils/format'
import { esNovedadVencida, diasDesdeDeteccion } from '../../utils/pjnVencimiento'
import { Button } from '../ui/Button'
import Icon from '../ui/Icon'
import type { NovedadPJN } from '../../types'

interface Props {
  novedad: NovedadPJN
  mostrarActuacion?: boolean
}

// placeholder — reemplazar por el dominio real del PJN cuando se defina
const PJN_BASE_URL = 'https://scw.pjn.gov.ar'

export function NovedadPjnCard({ novedad, mostrarActuacion = false }: Props) {
  const navigate = useNavigate()
  const { usuarioActivo } = useUIStore()
  const { aplicarNovedad, descartarNovedad } = usePjnStore()
  const exp = useExpedientesStore(s => s.expedientes.find(e => e.id === novedad.expediente_id))
  const [texto, setTexto] = useState(novedad.detalle)

  const pendiente = novedad.estado === 'pendiente'
  const vencida = esNovedadVencida(novedad)

  const metadata = [
    novedad.oficina ? `Oficina: ${novedad.oficina}` : null,
    novedad.foja ? `Fs. ${novedad.foja}` : null,
  ].filter(Boolean).join(' · ')

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
            <Icon name="description" size={16} className="text-[#185fa5]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#185fa5]">
              {novedad.tipo}
            </p>
            <p className="text-sm font-semibold text-[#1b3a57]">{novedad.detalle}</p>
            {metadata && (
              <p className="text-xs text-[#7a9ab4] mt-0.5">{metadata}</p>
            )}
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
        {vencida && (
          <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#fdecea] text-[#b91c1c] border border-[#f5c2c0]">
            Vencida hace {diasDesdeDeteccion(novedad)} días
          </span>
        )}
      </div>

      <p className="text-[11px] text-[#7a9ab4] mb-2">
        Movimiento del {formatFecha(novedad.fecha_movimiento)} · detectado el {formatFecha(novedad.fecha_deteccion)}
      </p>

      {novedad.tiene_documento && novedad.documento_url && (
        <a
          href={`${PJN_BASE_URL}${novedad.documento_url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#185fa5] hover:underline mb-3"
        >
          <Icon name="open_in_new" size={13} />
          Descargar del PJN
        </a>
      )}

      {pendiente ? (
        <>
          <textarea
            className="field-input w-full text-sm resize-y mb-3"
            rows={2}
            value={texto}
            onChange={e => setTexto(e.target.value)}
          />
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
