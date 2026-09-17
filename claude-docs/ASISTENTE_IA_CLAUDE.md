# Asistente IA — Boga

> Rama original: `feat/asistente-ia-chat` (desde `develop`). Renombrado de "Saúl" a "Boga" y
> extendido con un botón flotante global en `feat/agente-boga`.

## Qué es

El asistente de IA del sistema, llamado **Boga**, tiene dos puntos de entrada que comparten el
mismo componente de chat (`src/components/boga/BogaChat.tsx`):

1. **Tab "Boga" en `DetalleExpediente`** (`src/pages/DetalleExpediente/tabs/AsistenteTab.tsx`):
   chat con contexto de la actuación abierta, para que el abogado pregunte cosas como carátula,
   estado o historial sin salir del expediente.
2. **Botón flotante global** (`src/components/boga/BogaFab.tsx`, montado en `AppLayout.tsx`):
   visible en cualquier pantalla que **no** sea el detalle de una actuación (ahí ya está la tab
   dedicada), con contexto general del sistema (resumen de todas las actuaciones + secciones de
   navegación) para ayudar a moverse por SIAJ sin necesitar una actuación abierta.

Corre contra **Groq** (modelo `openai/gpt-oss-120b`) a través de una función serverless de
Vercel — la API key nunca se expone al frontend.

## Arquitectura

```
AsistenteTab.tsx ──┐
                    ├─► BogaChat.tsx (useChat de @ai-sdk/react)
BogaFab.tsx ───────┘        │  POST /api/chat  { messages, expedienteContext }
                             ▼
                     api/chat.ts  (Vercel Edge Function)
                             │  streamText({ model: groq(...), system, messages })
                             ▼
                     Groq API (openai/gpt-oss-120b)
```

- **`api/chat.ts`** vive en la raíz del repo, fuera de `src/` — Vercel lo detecta solo como
  Serverless/Edge Function aunque el resto del proyecto sea Vite (no Next.js). `export const
  config = { runtime: 'edge' }`. No está incluido en `tsconfig.app.json` ni `tsconfig.node.json`
  (`npx tsc -b` no lo tipa); se verificó manualmente con `npx tsc --noEmit --types node
  api/chat.ts` y Vercel lo type-checkea en su propio build al deployar.
- **`GROQ_API_KEY`** solo existe como variable de entorno server-side en Vercel (o en
  `.env.local` para levantar `vercel dev` en local). Si falta, o si `AGENT_ENABLED === 'false'`,
  el endpoint devuelve `503` con `{ error: 'agent_disabled', message }` — el frontend lo muestra
  como estado vacío ("El asistente IA está desactivado temporalmente"), sin pantalla blanca ni
  error genérico.
- **`BogaChat.tsx`** es el componente de chat compartido (mensajes, chiste inicial opcional,
  preguntas sugeridas, input) — recibe `titulo`, `saludoInicial`, `contexto` (JSON string) y
  `preguntasSugeridas` como props, y arma el `body` de cada mensaje vía
  `sendMessage(msg, { body: { expedienteContext: contexto } })`. Sin UI de terceros — chat
  armado a mano con Tailwind, igual que el resto de SIAJ (ver decisión abajo).
  - `AsistenteTab.tsx` arma el contexto con la actuación actual (id, área, tipo, carátula,
    estado, abogado, campos_mesa/abogado, últimos 15 ítems del timeline) + un resumen de las
    demás actuaciones. Chiste inicial activo (`incluirChiste` por defecto `true`).
  - `BogaFab.tsx` arma un contexto general (`modo: 'asistente_general_del_sistema'`, secciones
    de navegación, resumen de todas las actuaciones). Chiste inicial desactivado
    (`incluirChiste={false}`), porque es una interacción de ayuda general, no ligada a una
    actuación puntual.
- El avatar (`src/assets/boga-avatar.jpg`) se importa vía Vite (no queda en `public/`), igual
  que el resto de los assets del proyecto — así tiene hash de caché automático.

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

## Probar en local

`npm run dev` (solo Vite) no sirve `/api/*` — hace falta `vercel dev` para levantar la función
serverless real. Setup completo (env vars, `vercel link`, cómo apagar el agente) en
`docs/ASISTENTE_IA.md`.

`vercel.json` tiene un rewrite explícito para `/api/(.*)` antes del catch-all del SPA
(`/(.*) → /index.html`) — sin eso el catch-all podría interceptar `/api/chat` antes de llegar
a la función.

## Pendiente / próximas etapas

- Sin persistencia de conversación — el historial del chat vive solo en el estado de React de
  cada instancia de `BogaChat` (se pierde al cambiar de tab/cerrar el flotante o refrescar).
