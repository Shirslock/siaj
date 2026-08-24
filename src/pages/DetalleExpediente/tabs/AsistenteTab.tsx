import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useExpedientesStore } from '../../../store/expedientes.store'
import Icon from '../../../components/ui/Icon'
import saulAvatar from '../../../assets/saul-avatar.jpg'
import type { Expediente } from '../../../types'

interface Props { exp: Expediente }

const PAUSA_CHISTE_1_MS = 1200
const PAUSA_CHISTE_2_MS = 600
const CHISTE_1 = 'Eso no lo sé, por favor preguntale a Nicolás 😅'
const CHISTE_2 = 'Mentira, ahí te doy la respuesta:'

export function AsistenteTab({ exp }: Props) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const expedientes = useExpedientesStore(s => s.expedientes)

  // Chiste solo en la primera pregunta real de esta sesión de chat (se
  // resetea al salir/volver a entrar a la tab, ya que vive en useState).
  const [esPrimeraPregunta, setEsPrimeraPregunta] = useState(true)
  const [chisteEnCurso, setChisteEnCurso] = useState<{ pregunta: string; fase: 1 | 2 } | null>(null)

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

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: [
      {
        id: 'saludo-inicial',
        role: 'assistant',
        parts: [{
          type: 'text',
          text: `¡Hola! Soy Saúl, el asistente de esta actuación (${exp.id}). ¿En qué te puedo ayudar?`,
        }],
      },
    ] as UIMessage[],
  })

  const agentDisabled = error?.message?.includes('agent_disabled') ?? false
  const isLoading = status === 'submitted' || status === 'streaming'
  const chisteActivo = chisteEnCurso !== null

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, chisteEnCurso])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const texto = input.trim()
    if (!texto || isLoading || chisteActivo) return
    setInput('')

    if (esPrimeraPregunta) {
      setEsPrimeraPregunta(false)
      setChisteEnCurso({ pregunta: texto, fase: 1 })
      await new Promise(r => setTimeout(r, PAUSA_CHISTE_1_MS))
      setChisteEnCurso({ pregunta: texto, fase: 2 })
      await new Promise(r => setTimeout(r, PAUSA_CHISTE_2_MS))
      setChisteEnCurso(null)
    }

    sendMessage({ text: texto }, { body: { expedienteContext: contexto } })
  }

  return (
    <div className="h-[600px] flex flex-col rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.08)] bg-[#f5f5f5] flex items-center gap-2 flex-shrink-0">
        <img
          src={saulAvatar}
          alt="Saúl"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[rgba(0,0,0,0.08)]"
        />
        <span className="text-[13px] font-semibold text-[#1b3a57]">
          Saúl — {exp.id}
        </span>
      </div>

      {agentDisabled ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="p-6 text-center">
            <Icon name="info" size={24} className="text-[#7a9ab4] mx-auto mb-2" />
            <p className="text-sm text-[#4a6a84]">
              El asistente IA está desactivado temporalmente.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <img
                    src={saulAvatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#1b3a57] text-white'
                      : 'bg-[#f0f4f7] text-[#1b3a57]'
                  }`}
                >
                  {m.parts.map((part, i) =>
                    part.type === 'text' ? <span key={i}>{part.text}</span> : null
                  )}
                </div>
              </div>
            ))}

            {chisteEnCurso && (
              <>
                <div className="flex items-end gap-2 justify-end">
                  <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap bg-[#1b3a57] text-white">
                    {chisteEnCurso.pregunta}
                  </div>
                </div>
                <div className="flex items-end gap-2 justify-start">
                  <img src={saulAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap bg-[#f0f4f7] text-[#1b3a57]">
                    {CHISTE_1}
                  </div>
                </div>
                {chisteEnCurso.fase === 2 && (
                  <div className="flex items-end gap-2 justify-start">
                    <img src={saulAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap bg-[#f0f4f7] text-[#1b3a57]">
                      {CHISTE_2}
                    </div>
                  </div>
                )}
              </>
            )}

            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <img
                  src={saulAvatar}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
                <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-[#f0f4f7] text-[#7a9ab4]">
                  Escribiendo…
                </div>
              </div>
            )}
            {error && !agentDisabled && (
              <div className="flex justify-center">
                <p className="text-xs text-[#b91c1c] text-center">
                  Ocurrió un error al consultar al asistente. Probá de nuevo.
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t border-[rgba(0,0,0,0.08)] flex-shrink-0"
          >
            <input
              type="text"
              className="field-input flex-1 text-sm"
              placeholder="Escribí tu consulta…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading || chisteActivo}
            />
            <button
              type="submit"
              disabled={isLoading || chisteActivo || !input.trim()}
              className="p-2 rounded-lg bg-[#1b3a57] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#234a6e] transition-colors flex-shrink-0"
              title="Enviar"
            >
              <Icon name="send" size={16} className="text-white" />
            </button>
          </form>
        </>
      )}
    </div>
  )
}
