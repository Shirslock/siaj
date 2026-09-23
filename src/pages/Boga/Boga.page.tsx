import { useMemo, useState } from 'react'
import type { UIMessage } from 'ai'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useBogaHistorialStore, aMensajesGuardados, aUIMessages } from '../../store/bogaHistorial.store'
import { BogaChat } from '../../components/boga/BogaChat'
import Icon from '../../components/ui/Icon'

// Módulo "Chat con Boga": historial de conversaciones a la izquierda (estilo
// ventana de chat de Claude/ChatGPT) + el chat activo a la derecha.
const SCOPE = 'global'

const PREGUNTAS_SUGERIDAS = [
  '¿Cómo doy de alta un expediente nuevo?',
  '¿Dónde veo las novedades del PJN?',
  '¿Cómo busco una actuación por número de causa?',
  '¿Qué son las áreas del sistema?',
]

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function BogaPage() {
  const expedientes = useExpedientesStore(s => s.expedientes)
  const conversacionesGuardadas = useBogaHistorialStore(s => s.conversaciones)
  const crearConversacion = useBogaHistorialStore(s => s.crearConversacion)
  const actualizarMensajes = useBogaHistorialStore(s => s.actualizarMensajes)
  const eliminarConversacion = useBogaHistorialStore(s => s.eliminarConversacion)

  const [conversacionActivaId, setConversacionActivaId] = useState<string | null>(null)

  const conversaciones = useMemo(
    () => conversacionesGuardadas
      .filter(c => c.scope === SCOPE)
      .sort((a, b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion)),
    [conversacionesGuardadas]
  )

  const conversacionActiva = conversaciones.find(c => c.id === conversacionActivaId) ?? null

  const contexto = useMemo(() => {
    const resumenActuaciones = expedientes.map(e => ({
      id: e.id,
      area: e.area,
      tipo: e.tipo,
      caratula: e.caratula,
      estado: e.estadoProcesal ?? e.estado,
      letrado_id: e.abogado_id,
      numero_causa: e.numero_causa,
    }))

    return JSON.stringify({
      modo: 'asistente_general_del_sistema',
      secciones_del_sistema: [
        { nombre: 'Principal', ruta: '/home' },
        { nombre: 'Panel de Control', ruta: '/dashboard' },
        { nombre: 'Mesa SACO', ruta: '/mesa' },
        { nombre: 'Actuaciones', ruta: '/actuaciones' },
        { nombre: 'Agenda', ruta: '/agenda' },
        { nombre: 'Novedades judiciales', ruta: '/novedades-judiciales' },
        { nombre: 'Configuración del Sistema', ruta: '/configuracion' },
      ],
      actuaciones_del_sistema: resumenActuaciones,
    })
  }, [expedientes])

  function nuevaConversacion() {
    setConversacionActivaId(null)
  }

  function handleEliminar(id: string) {
    eliminarConversacion(id)
    if (conversacionActivaId === id) setConversacionActivaId(null)
  }

  function handleMensajesChange(mensajes: UIMessage[]) {
    let id = conversacionActivaId
    if (!id) {
      id = crearConversacion(SCOPE).id
      setConversacionActivaId(id)
    }
    actualizarMensajes(id, aMensajesGuardados(mensajes))
  }

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex gap-4 flex-1 min-h-0">
        <aside className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[rgba(0,0,0,0.08)] flex-shrink-0">
            <button
              type="button"
              onClick={nuevaConversacion}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1b3a57] text-white text-sm font-medium hover:bg-[#234a6e] transition-colors"
            >
              <Icon name="add" size={16} className="text-white" />
              Nueva conversación
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversaciones.length === 0 && (
              <p className="text-xs text-[#7a9ab4] text-center px-3 py-6">
                Todavía no tenés conversaciones guardadas con Boga.
              </p>
            )}
            {conversaciones.map(c => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                  c.id === conversacionActivaId ? 'bg-[#e6f1fb]' : 'hover:bg-[#f5f5f5]'
                }`}
                onClick={() => setConversacionActivaId(c.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1b3a57] truncate">{c.titulo}</p>
                  <p className="text-[10px] text-[#7a9ab4]">{formatFechaHora(c.fechaActualizacion)}</p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleEliminar(c.id) }}
                  title="Borrar conversación"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgba(0,0,0,0.06)] transition-opacity flex-shrink-0"
                >
                  <Icon name="delete" size={14} className="text-[#b91c1c]" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <BogaChat
            key={conversacionActivaId ?? 'nueva'}
            titulo="Boga — Asistente del sistema"
            saludoInicial="¡Hola! Soy Boga. Puedo ayudarte a moverte por SIAJ, encontrar actuaciones o responder dudas generales del sistema. ¿En qué te puedo ayudar?"
            contexto={contexto}
            preguntasSugeridas={PREGUNTAS_SUGERIDAS}
            incluirChiste={false}
            mensajesIniciales={conversacionActiva ? aUIMessages(conversacionActiva.mensajes) : undefined}
            onMensajesChange={handleMensajesChange}
          />
        </div>
      </div>
    </div>
  )
}
