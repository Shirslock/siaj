import { useEffect, useRef, useState } from 'react'
import type { Expediente } from '../../../types'
import { useAIStore } from '../../../store/ai.store'
import Icon from '../../../components/ui/Icon'

interface Props {
  exp: Expediente
}

export function AsistenteTab({ exp }: Props) {
  const { mensajes, cargando, limpiarChat, consultarIA } = useAIStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sinDocumentos = (exp.documentos ?? []).length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, cargando])

  function ajustarAltura() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
  }

  function enviar() {
    const texto = input.trim()
    if (!texto || cargando) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    consultarIA(exp.id, texto)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '480px' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#242C4F] flex items-center justify-center flex-shrink-0">
            <Icon name="psychology" size={20} className="text-white" />
          </div>
          <div>
            <p className="font-headline font-bold text-[#1b3a57] text-sm leading-tight">Saúl Goodman</p>
            <p className="text-xs text-[#4a6a84]">Tu asistente jurídico inteligente</p>
          </div>
        </div>
        {mensajes.length > 0 && (
          <button
            onClick={limpiarChat}
            title="Limpiar chat"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#f0f0f0] hover:text-red-500 transition-colors"
          >
            <Icon name="delete" size={18} />
          </button>
        )}
      </div>

      {/* Aviso sin documentos */}
      {sinDocumentos && (
        <div className="mx-5 mt-4 flex items-start gap-2.5 px-4 py-3 bg-[#fef3c7] border border-[#fde68a] rounded-xl">
          <Icon name="attach_file" size={16} className="text-[#d97706] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#92400e]">
            Esta actuación no tiene documentos adjuntos.
            Subí al menos un PDF para poder usar el asistente.
          </p>
        </div>
      )}

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Estado vacío */}
        {mensajes.length === 0 && !cargando && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
            <div className="w-14 h-14 rounded-full bg-[#f0f4f8] flex items-center justify-center">
              <Icon name="psychology" size={28} className="text-[#7dbad2]" />
            </div>
            <div>
              <p className="font-headline font-bold text-[#1b3a57] text-base mb-1">Saúl Goodman</p>
              <p className="text-sm text-[#4a6a84] mb-3">
                Podés hacerme preguntas sobre los documentos<br />adjuntos a esta actuación. Por ejemplo:
              </p>
              <div className="flex flex-col gap-1.5 items-center">
                {[
                  '¿Cuál es el monto reclamado?',
                  '¿Qué dice la pericia médica?',
                  '¿Cuáles son los plazos vencidos?',
                ].map(ej => (
                  <button
                    key={ej}
                    onClick={() => { setInput(ej); textareaRef.current?.focus() }}
                    className="text-xs text-[#1b3a57] bg-[#f0f4f8] hover:bg-[#e0eaf0] px-3 py-1.5 rounded-full transition-colors"
                  >
                    "{ej}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mensajes */}
        {mensajes.map(msg => (
          <div key={msg.id} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%]">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.rol === 'usuario'
                    ? 'bg-[#242C4F] text-white rounded-br-sm'
                    : msg.estado === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
                      : 'bg-[#f0f4f8] text-[#1b3a57] rounded-bl-sm'
                }`}
              >
                {msg.estado === 'enviando'
                  ? <TypingDots />
                  : <span style={{ whiteSpace: 'pre-wrap' }}>{msg.contenido}</span>
                }
              </div>
              {msg.rol === 'asistente' && msg.fuentes && msg.fuentes.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-1">
                  {msg.fuentes.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[10px] text-[#4a6a84] bg-[#e8f0f5] px-2 py-0.5 rounded-full">
                      <Icon name="description" size={11} />
                      {f.documento} — pág. {f.pagina}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {cargando && (
          <div className="flex justify-start">
            <div className="bg-[#f0f4f8] rounded-2xl rounded-bl-sm px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer / input */}
      <div className="px-5 py-4 border-t border-[rgba(0,0,0,0.08)]">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => { setInput(e.target.value); ajustarAltura() }}
            onKeyDown={onKeyDown}
            disabled={cargando}
            placeholder="Escribí tu consulta sobre los documentos..."
            className="flex-1 resize-none rounded-xl border border-[rgba(0,0,0,0.15)] px-3.5 py-2.5 text-sm text-[#1b3a57] placeholder-[#9a9a9a] focus:outline-none focus:border-[#7dbad2] focus:ring-1 focus:ring-[#7dbad2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
            style={{ minHeight: '42px', maxHeight: '96px', overflowY: 'auto' }}
          />
          <button
            onClick={enviar}
            disabled={!input.trim() || cargando}
            className="w-10 h-10 flex-shrink-0 rounded-xl bg-[#242C4F] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-opacity"
            title="Enviar (Enter)"
          >
            <Icon name="arrow_upward" size={18} />
          </button>
        </div>
        <p className="text-[10px] text-[#b0b0b0] mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-4">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
        />
      ))}
    </span>
  )
}
