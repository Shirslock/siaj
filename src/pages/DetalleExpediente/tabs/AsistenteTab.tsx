import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import Icon from '../../../components/ui/Icon'
import saulAvatar from '../../../assets/saul-avatar.jpg'
import type { Expediente } from '../../../types'

interface Props { exp: Expediente }

export function AsistenteTab({ exp }: Props) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const contexto = useMemo(() => JSON.stringify({
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
  }), [exp])

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const agentDisabled = error?.message?.includes('agent_disabled') ?? false
  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const texto = input.trim()
    if (!texto || isLoading) return
    sendMessage({ text: texto }, { body: { expedienteContext: contexto } })
    setInput('')
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
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-[#7a9ab4] text-center max-w-xs">
                  Preguntá lo que necesites sobre esta actuación: carátula, estado, historial, próximos pasos.
                </p>
              </div>
            )}
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
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
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
