import { useMemo, useState } from 'react'
import type { UIMessage } from 'ai'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { useBogaHistorialStore, aMensajesGuardados, aUIMessages } from '../../../store/bogaHistorial.store'
import { BogaChat } from '../../../components/boga/BogaChat'
import Icon from '../../../components/ui/Icon'
import type { Expediente } from '../../../types'

interface Props { exp: Expediente }

const PREGUNTAS_SUGERIDAS = [
  '¿Cuál es el estado actual de esta actuación?',
  'Resumime el historial de esta actuación',
  '¿Cuáles son los próximos pasos a seguir?',
  '¿Hay novedades del PJN pendientes de revisión?',
]

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function AsistenteTab({ exp }: Props) {
  const expedientes = useExpedientesStore(s => s.expedientes)
  const conversacionesGuardadas = useBogaHistorialStore(s => s.conversaciones)
  const crearConversacion = useBogaHistorialStore(s => s.crearConversacion)
  const actualizarMensajes = useBogaHistorialStore(s => s.actualizarMensajes)
  const eliminarConversacion = useBogaHistorialStore(s => s.eliminarConversacion)

  const [conversacionActivaId, setConversacionActivaId] = useState<string | null>(null)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  // Las conversaciones de una actuación quedan ligadas a su exp.id — no se mezclan entre actuaciones.
  const conversaciones = useMemo(
    () => conversacionesGuardadas
      .filter(c => c.scope === exp.id)
      .sort((a, b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion)),
    [conversacionesGuardadas, exp.id]
  )

  const conversacionActiva = conversaciones.find(c => c.id === conversacionActivaId) ?? null

  const contexto = useMemo(() => {
    const resumenTodasLasActuaciones = expedientes
      .filter(e => e.id !== exp.id)
      .map(e => ({
        id: e.id,
        area: e.area,
        tipo: e.tipo,
        caratula: e.caratula,
        estado: e.estadoProcesal ?? e.estado,
        letrado_id: e.abogado_id,
        numero_causa: e.numero_causa,
      }))

    return JSON.stringify({
      actuacion_actual: {
        id: exp.id,
        area: exp.area,
        tipo: exp.tipo,
        caratula: exp.caratula,
        estado: exp.estadoProcesal ?? exp.estado,
        abogado_id: exp.abogado_id,
        campos_mesa: exp.campos_mesa,
        campos_abogado: exp.campos_abogado,
        timeline_resumen: exp.timeline
          .slice(0, 15)
          .map(a => ({ tipo: a.tipo, titulo: a.titulo, fecha: a.fecha })),
      },
      otras_actuaciones_del_sistema: resumenTodasLasActuaciones,
    })
  }, [exp, expedientes])

  function nuevaConversacion() {
    setConversacionActivaId(null)
    setMostrarHistorial(false)
  }

  function abrirConversacion(id: string) {
    setConversacionActivaId(id)
    setMostrarHistorial(false)
  }

  function handleEliminar(id: string) {
    eliminarConversacion(id)
    if (conversacionActivaId === id) setConversacionActivaId(null)
  }

  function handleMensajesChange(mensajes: UIMessage[]) {
    let id = conversacionActivaId
    if (!id) {
      id = crearConversacion(exp.id).id
      setConversacionActivaId(id)
    }
    actualizarMensajes(id, aMensajesGuardados(mensajes))
  }

  return (
    <div className="h-[600px] flex flex-col gap-2">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMostrarHistorial(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Icon name="history" size={14} />
            Historial{conversaciones.length > 0 ? ` (${conversaciones.length})` : ''}
          </button>

          {mostrarHistorial && (
            <div className="absolute left-0 mt-1 w-72 max-h-80 overflow-y-auto bg-white rounded-lg shadow-card-lg border border-gray-200 z-10">
              {conversaciones.length === 0 ? (
                <p className="text-xs text-gray-400 text-center px-3 py-4">
                  Todavía no hay conversaciones guardadas de esta actuación.
                </p>
              ) : (
                conversaciones.map(c => (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-1 px-3 py-2 cursor-pointer transition-colors ${
                      c.id === conversacionActivaId ? 'bg-blue-50' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => abrirConversacion(c.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{c.titulo}</p>
                      <p className="text-[10px] text-gray-400">{formatFechaHora(c.fechaActualizacion)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleEliminar(c.id) }}
                      title="Borrar conversación"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-opacity flex-shrink-0"
                    >
                      <Icon name="delete" size={13} className="text-red-700" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={nuevaConversacion}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <Icon name="add" size={14} />
          Nueva conversación
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <BogaChat
          key={conversacionActivaId ?? 'nueva'}
          titulo={`Boga — ${exp.id}`}
          saludoInicial={`¡Hola! Soy Boga, el asistente de esta actuación (${exp.id}). ¿En qué te puedo ayudar?`}
          contexto={contexto}
          preguntasSugeridas={PREGUNTAS_SUGERIDAS}
          mensajesIniciales={conversacionActiva ? aUIMessages(conversacionActiva.mensajes) : undefined}
          onMensajesChange={handleMensajesChange}
        />
      </div>
    </div>
  )
}
