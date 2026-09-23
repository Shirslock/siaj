import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Icon from '../ui/Icon'
import bogaAvatar from '../../assets/boga-avatar.jpg'
import { extraerTextoArchivo, ErrorExtraccionArchivo } from '../../utils/extraerTextoArchivo'

interface Props {
  titulo: string
  saludoInicial: string
  contexto: string
  preguntasSugeridas: string[]
  /** Chiste de "preguntale a Nicolás" en la primera pregunta. Por defecto activo (comportamiento histórico del asistente por actuación). */
  incluirChiste?: boolean
  /** Mensajes de una conversación guardada a retomar. Si no se pasa (o viene vacío), arranca de cero con el saludo inicial. */
  mensajesIniciales?: UIMessage[]
  /** Se dispara cada vez que cambian los mensajes, para que el padre los persista (historial). */
  onMensajesChange?: (mensajes: UIMessage[]) => void
}

const PAUSA_CHISTE_1_MS = 1200
const PAUSA_CHISTE_2_MS = 600
const CHISTE_1 = 'Eso no lo sé, por favor preguntale a Nicolás 😅'
const CHISTE_2 = 'Mentira, ahí te doy la respuesta:'

// Estilos manuales para las respuestas en Markdown del asistente — sin plugin
// de @tailwindcss/typography (no estaba instalado), aplicados directo con las
// clases y colores que ya usa el resto de SIAJ.
const MARKDOWN_COMPONENTS: Components = {
  p:          ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  h1:         ({ children }) => <h1 className="text-[15px] font-bold text-[#1b3a57] mt-2 mb-1">{children}</h1>,
  h2:         ({ children }) => <h2 className="text-[14px] font-bold text-[#1b3a57] mt-2 mb-1">{children}</h2>,
  h3:         ({ children }) => <h3 className="text-[13px] font-semibold text-[#1b3a57] mt-2 mb-1">{children}</h3>,
  strong:     ({ children }) => <strong className="font-semibold text-[#1b3a57]">{children}</strong>,
  em:         ({ children }) => <em className="italic">{children}</em>,
  ul:         ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
  li:         ({ children }) => <li>{children}</li>,
  a:          ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-[#185fa5] underline">{children}</a>,
  code:       ({ children }) => <code className="bg-[#e8e8e8] rounded px-1 py-0.5 text-[12px] font-mono">{children}</code>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-[#B5D4F4] pl-2 italic text-[#4a6a84]">{children}</blockquote>,
  table:      ({ children }) => (
    <div className="overflow-x-auto mb-2">
      <table className="text-[12px] border-collapse">{children}</table>
    </div>
  ),
  th:         ({ children }) => <th className="bg-[#f5f5f5] border border-[rgba(0,0,0,0.12)] px-2 py-1 text-left font-semibold text-[#1b3a57]">{children}</th>,
  td:         ({ children }) => <td className="border border-[rgba(0,0,0,0.12)] px-2 py-1">{children}</td>,
}

export function BogaChat({ titulo, saludoInicial, contexto, preguntasSugeridas, incluirChiste = true, mensajesIniciales, onMensajesChange }: Props) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Documento adjunto: solo vale para la consulta que se está por enviar — el texto
  // extraído se manda al modelo pero nunca se persiste junto con el historial de la
  // conversación (ver src/store/bogaHistorial.store.ts).
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string; texto: string } | null>(null)
  const [leyendoArchivo, setLeyendoArchivo] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)

  const retomaConversacion = (mensajesIniciales?.length ?? 0) > 0

  // Chiste y preguntas sugeridas solo en una conversación nueva/vacía. Al
  // retomar una conversación guardada ya hay una pregunta real hecha.
  const [esPrimeraPregunta, setEsPrimeraPregunta] = useState(!retomaConversacion)
  const [chisteEnCurso, setChisteEnCurso] = useState<{ pregunta: string; fase: 1 | 2 } | null>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: retomaConversacion
      ? mensajesIniciales!
      : ([
          {
            id: 'saludo-inicial',
            role: 'assistant',
            parts: [{ type: 'text', text: saludoInicial }],
          },
        ] as UIMessage[]),
  })

  const agentDisabled = error?.message?.includes('agent_disabled') ?? false
  const isLoading = status === 'submitted' || status === 'streaming'
  const chisteActivo = chisteEnCurso !== null

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, chisteEnCurso])

  // Notifica al padre para persistir el historial, salvo cuando todavía es
  // solo el saludo inicial de una conversación nueva (no vale la pena guardarla).
  // Se guarda en un ref porque el padre no memoiza este callback — si estuviera
  // en las dependencias del efecto, cada re-render del padre (incluido el que
  // dispara la propia persistencia) volvería a disparar el efecto en loop.
  const onMensajesChangeRef = useRef(onMensajesChange)
  onMensajesChangeRef.current = onMensajesChange

  useEffect(() => {
    const esSoloSaludo = messages.length === 1 && messages[0].id === 'saludo-inicial'
    if (esSoloSaludo) return
    onMensajesChangeRef.current?.(messages)
  }, [messages])

  async function enviarPregunta(texto: string) {
    if (!texto || isLoading || chisteActivo || leyendoArchivo) return
    setInput('')

    if (incluirChiste && esPrimeraPregunta) {
      setEsPrimeraPregunta(false)
      setChisteEnCurso({ pregunta: texto, fase: 1 })
      await new Promise(r => setTimeout(r, PAUSA_CHISTE_1_MS))
      setChisteEnCurso({ pregunta: texto, fase: 2 })
      await new Promise(r => setTimeout(r, PAUSA_CHISTE_2_MS))
      setChisteEnCurso(null)
    } else if (esPrimeraPregunta) {
      setEsPrimeraPregunta(false)
    }

    sendMessage(
      { text: texto },
      { body: { expedienteContext: contexto, documentoAdjunto: archivoAdjunto ?? undefined } }
    )
    setArchivoAdjunto(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await enviarPregunta(input.trim())
  }

  async function handleSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return

    setErrorArchivo(null)
    setArchivoAdjunto(null)
    setLeyendoArchivo(true)
    try {
      const texto = await extraerTextoArchivo(archivo)
      setArchivoAdjunto({ nombre: archivo.name, texto })
    } catch (err) {
      const mensaje = err instanceof ErrorExtraccionArchivo
        ? err.message
        : 'No pude leer el archivo. ¿Podés pegar el texto directo en el chat?'
      setErrorArchivo(mensaje)
    } finally {
      setLeyendoArchivo(false)
    }
  }

  function quitarArchivoAdjunto() {
    setArchivoAdjunto(null)
    setErrorArchivo(null)
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.08)] bg-[#f5f5f5] flex items-center gap-2 flex-shrink-0">
        <img
          src={bogaAvatar}
          alt="Boga"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[rgba(0,0,0,0.08)]"
        />
        <span className="text-[13px] font-semibold text-[#1b3a57]">
          {titulo}
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
                    src={bogaAvatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-[#1b3a57] text-white whitespace-pre-wrap'
                      : 'bg-[#f0f4f7] text-[#1b3a57]'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                      {m.parts.filter(p => p.type === 'text').map(p => p.text).join('')}
                    </ReactMarkdown>
                  ) : (
                    m.parts.map((part, i) =>
                      part.type === 'text' ? <span key={i}>{part.text}</span> : null
                    )
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
                  <img src={bogaAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap bg-[#f0f4f7] text-[#1b3a57]">
                    {CHISTE_1}
                  </div>
                </div>
                {chisteEnCurso.fase === 2 && (
                  <div className="flex items-end gap-2 justify-start">
                    <img src={bogaAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
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
                  src={bogaAvatar}
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

          {esPrimeraPregunta && !chisteActivo && preguntasSugeridas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2 border-t border-[rgba(0,0,0,0.08)] flex-shrink-0">
              {preguntasSugeridas.map(pregunta => (
                <button
                  key={pregunta}
                  type="button"
                  onClick={() => enviarPregunta(pregunta)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full border border-[#B5D4F4] bg-[#e6f1fb] text-[11px] text-[#185fa5] hover:bg-[#d6e9fa] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {pregunta}
                </button>
              ))}
            </div>
          )}

          {(archivoAdjunto || leyendoArchivo || errorArchivo) && (
            <div className="px-3 pt-2 flex-shrink-0">
              {leyendoArchivo && (
                <div className="flex items-center gap-1.5 text-xs text-[#7a9ab4]">
                  <Icon name="refresh" size={13} className="animate-spin" />
                  Leyendo archivo…
                </div>
              )}
              {archivoAdjunto && !leyendoArchivo && (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-[#B5D4F4] bg-[#e6f1fb] text-[11px] text-[#185fa5] max-w-full">
                  <Icon name="attach_file" size={13} className="flex-shrink-0" />
                  <span className="truncate">{archivoAdjunto.nombre}</span>
                  <button
                    type="button"
                    onClick={quitarArchivoAdjunto}
                    title="Quitar archivo"
                    className="flex-shrink-0 hover:text-[#b91c1c]"
                  >
                    <Icon name="close" size={13} />
                  </button>
                </div>
              )}
              {errorArchivo && (
                <p className="text-xs text-[#b91c1c] mt-1">{errorArchivo}</p>
              )}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`flex items-center gap-2 px-3 py-3 flex-shrink-0 ${esPrimeraPregunta && !chisteActivo && preguntasSugeridas.length > 0 ? '' : 'border-t border-[rgba(0,0,0,0.08)]'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleSeleccionarArchivo}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || chisteActivo || leyendoArchivo}
              title="Adjuntar archivo (PDF o Word)"
              className="p-2 rounded-lg border border-[rgba(0,0,0,0.08)] text-[#1b3a57] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f5f5] transition-colors flex-shrink-0"
            >
              <Icon name="attach_file" size={16} />
            </button>
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
              disabled={isLoading || chisteActivo || leyendoArchivo || !input.trim()}
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
