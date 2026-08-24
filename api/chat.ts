import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { groq } from '@ai-sdk/groq'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Toggle simple por variable de entorno.
  // Chris la cambia desde el dashboard de Vercel
  // (Settings → Environment Variables) y hace redeploy para aplicar.
  if (process.env.AGENT_ENABLED === 'false') {
    return new Response(
      JSON.stringify({
        error: 'agent_disabled',
        message: 'El asistente está desactivado temporalmente.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!process.env.GROQ_API_KEY) {
    return new Response(
      JSON.stringify({
        error: 'agent_disabled',
        message: 'El asistente no está configurado todavía.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { messages, expedienteContext }: { messages: UIMessage[]; expedienteContext?: string } =
      await req.json()

    const systemPrompt = `Sos el asistente de IA del sistema SIAJ (Sistema Integral de Asuntos Jurídicos) de SOFSA / Trenes Argentinos. Ayudás a abogados a consultar información sobre la actuación judicial que tienen abierta.

Contexto de la actuación actual:
${expedienteContext ?? '(sin contexto disponible)'}

Respondé en español rioplatense, de forma clara y profesional. Si te preguntan algo que no está en el contexto provisto, aclará que no tenés esa información cargada en el sistema.`

    const result = streamText({
      model: groq('openai/gpt-oss-120b'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('[api/chat] error en el stream:', error)
        return 'Ocurrió un error al consultar al asistente.'
      },
    })
  } catch (error) {
    console.error('[api/chat] error inesperado:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: 'Ocurrió un error al consultar al asistente.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
