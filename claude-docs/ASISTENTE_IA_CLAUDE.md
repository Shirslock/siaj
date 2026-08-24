# Asistente IA — DetalleExpediente

> Rama: `feat/asistente-ia-chat` (desde `develop`). Etapa 3 del feature.

## Qué es

Tab "Asistente IA" en `DetalleExpediente` (`src/pages/DetalleExpediente/tabs/AsistenteTab.tsx`):
chat con contexto de la actuación abierta, para que el abogado pregunte cosas como carátula,
estado o historial sin salir del expediente. Corre contra **Groq** (modelo
`llama-3.3-70b-versatile`) a través de una función serverless de Vercel — la API key nunca
se expone al frontend.

## Arquitectura

```
AsistenteTab.tsx (useChat de @ai-sdk/react)
        │  POST /api/chat  { messages, expedienteContext }
        ▼
api/chat.ts  (Vercel Edge Function)
        │  streamText({ model: groq(...), system, messages })
        ▼
Groq API (llama-3.3-70b-versatile)
```

- **`api/chat.ts`** vive en la raíz del repo, fuera de `src/` — Vercel lo detecta solo como
  Serverless/Edge Function aunque el resto del proyecto sea Vite (no Next.js). `export const
  config = { runtime: 'edge' }`. No está incluido en `tsconfig.app.json` ni `tsconfig.node.json`
  (`npx tsc -b` no lo tipa); se verificó manualmente con `npx tsc --noEmit --types node
  api/chat.ts` y Vercel lo type-checkea en su propio build al deployar.
- **`GROQ_API_KEY`** solo existe como variable de entorno server-side en Vercel. Si falta, o si
  `AGENT_ENABLED === 'false'`, el endpoint devuelve `503` con `{ error: 'agent_disabled',
  message }` — el frontend lo muestra como estado vacío ("El asistente IA está desactivado
  temporalmente"), sin pantalla blanca ni error genérico.
- **`AsistenteTab.tsx`** arma `expedienteContext` (JSON con id, área, tipo, carátula, estado,
  abogado, campos_mesa/abogado y los últimos 15 ítems del timeline) y lo manda en el `body` de
  cada mensaje vía `sendMessage(msg, { body: { expedienteContext } })`. Sin UI de terceros —
  chat armado a mano con Tailwind, igual que el resto de SIAJ (ver decisión abajo).

## Decisión: sin assistant-ui

El prompt original sugería `@assistant-ui/react` + `@assistant-ui/react-ai-sdk`. Al verificar
contra la doc oficial (paso previo obligatorio antes de instalar), esa librería está en
transición v5→v7 con superficie inestable (paquete v7 documentado como `@assistant-ui/ai-sdk`,
URL de doc 404 al momento de implementar). Se optó por **no sumarla**: el chat se construyó
directo con `useChat` de `@ai-sdk/react` y componentes propios, consistente con que el resto de
SIAJ no usa librerías de UI de terceros (todo es Tailwind + componentes propios en
`components/ui/`).

## Dependencias agregadas

```json
"ai": "^7.0.77",
"@ai-sdk/react": "^4.0.80",
"@ai-sdk/groq": "^4.0.30"
```

APIs relevantes de `ai@7` (verificadas contra los `.d.ts`, distinto de ejemplos desactualizados
en la doc pública):
- `convertToModelMessages(messages)` es **async** — requiere `await` (cambio vs. versiones
  previas del SDK).
- `streamText(...).toUIMessageStreamResponse()` — no `toTextStreamResponse()` (ese existe pero
  es para streams de solo texto, no para el formato `UIMessage` con `.parts` que usa `useChat`).
- `useChat` vive en `@ai-sdk/react` (no `ai/react`). Los mensajes tienen `.parts` (array de
  `{type: 'text', text}` etc.), no `.content` como en versiones viejas del SDK.
- El transport (`DefaultChatTransport`) propaga errores HTTP no-2xx como `Error` cuyo `.message`
  es el **texto crudo** de la respuesta — por eso `AsistenteTab` chequea
  `error.message?.includes('agent_disabled')` contra el JSON que devuelve `api/chat.ts`.

## Íconos nuevos (`Icon.tsx`)

| name | Heroicon |
|------|----------|
| `smart_toy` | `SparklesIcon` |
| `send` | `PaperAirplaneIcon` |

## Variables de entorno (Vercel — no en el repo)

| Variable | Uso |
|----------|-----|
| `GROQ_API_KEY` | Key de console.groq.com. Sin ella, el endpoint responde `agent_disabled`. |
| `AGENT_ENABLED` | Toggle manual (`'false'` apaga el asistente sin tocar código). Requiere redeploy al cambiarla. |

## Pendiente / próximas etapas

- No hay `vercel dev` documentado en el flujo local — `npm run dev` (solo Vite) no sirve `/api`,
  así que en local el chat cae en error genérico (no crashea, pero no responde). Probar el
  endpoint real requiere `vercel dev` o el deploy en Vercel con las env vars cargadas.
- Sin persistencia de conversación — el historial del chat vive solo en el estado de React del
  tab (se pierde al cambiar de tab o refrescar).
