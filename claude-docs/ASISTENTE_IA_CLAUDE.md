# Asistente IA — Boga

> Rama original: `feat/asistente-ia-chat` (desde `develop`). Renombrado de "Saúl" a "Boga" y
> extendido con un botón flotante global en `feat/agente-boga`, con historial de conversaciones
> persistido en `localStorage` y con adjuntar archivos (PDF/Word) en `feat/boga-historial-chat`.

## Qué es

El asistente de IA del sistema, llamado **Boga**, tiene dos superficies de chat que comparten el
mismo componente (`src/components/boga/BogaChat.tsx`), más un acceso rápido:

1. **Módulo "Chat con Boga"** (`/boga`, `src/pages/Boga/Boga.page.tsx`): página dedicada estilo
   ventana de chat de Claude/ChatGPT — panel lateral con el historial de conversaciones (título +
   fecha, click para retomar una, botón "Nueva conversación", borrar) y el chat activo a la
   derecha. Contexto general del sistema (resumen de todas las actuaciones + secciones de
   navegación). Historial con `scope: 'global'`.
2. **Tab "Boga" en `DetalleExpediente`** (`src/pages/DetalleExpediente/tabs/AsistenteTab.tsx`):
   chat con contexto de la actuación abierta, para que el abogado pregunte cosas como carátula,
   estado o historial sin salir del expediente. Tiene un historial simple (dropdown propio, sin
   sidebar completo) con las conversaciones de **esa** actuación — `scope: exp.id`, no se mezclan
   entre actuaciones.
3. **Botón flotante global** (`src/components/boga/BogaFab.tsx`, montado en `AppLayout.tsx`):
   visible en cualquier pantalla que **no** sea el detalle de una actuación ni el módulo `/boga`
   (ahí ya hay una entrada dedicada). **No abre un chat propio: navega a `/boga`.** Antes desplegaba
   un popover con su propio `BogaChat` efímero; se reemplazó porque duplicaba el contexto y las
   preguntas sugeridas de `Boga.page.tsx` y perdía la conversación al cerrarse, mientras que `/boga`
   ya la persiste.

Corre contra **Groq** (modelo `openai/gpt-oss-120b`) a través de una función serverless de
Vercel — la API key nunca se expone al frontend.

## Arquitectura

```
AsistenteTab.tsx ──┐
                    ├─► BogaChat.tsx (useChat de @ai-sdk/react)
Boga.page.tsx ─────┘        │  POST /api/chat  { messages, expedienteContext }
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
  - `Boga.page.tsx` arma un contexto general (`modo: 'asistente_general_del_sistema'`, secciones
    de navegación, resumen de todas las actuaciones). Chiste inicial desactivado
    (`incluirChiste={false}`), porque es una interacción de ayuda general, no ligada a una
    actuación puntual.
- El avatar (`src/assets/boga-avatar.jpg`) se importa vía Vite (no queda en `public/`), igual
  que el resto de los assets del proyecto — así tiene hash de caché automático.

## Historial de conversaciones

Persistido 100% **client-side**, sin backend ni base de datos — `src/store/bogaHistorial.store.ts`
es un store de Zustand que lee/escribe `localStorage` a mano (mismo patrón manual que
`src/store/ui.store.ts` con `sessionStorage`, pero acá con `localStorage` para que sobreviva
entre sesiones/cierres del navegador, no solo dentro de una pestaña).

- **Limitación conocida y aceptada:** el historial **no se sincroniza entre dispositivos ni
  navegadores** — vive únicamente en el `localStorage` del navegador donde se generó.
- Cada `BogaConversacion` tiene `id`, `scope` (`'global'` para el módulo `/boga`, o `exp.id` para
  una actuación), `titulo` (se autogenera con la primera pregunta del usuario, truncada a 48
  caracteres), `fechaCreacion`, `fechaActualizacion` y `mensajes` (formato propio
  `{ id, role, text }`, no el `UIMessage` completo del SDK — se convierte con
  `aMensajesGuardados`/`aUIMessages`).
- `BogaChat.tsx` no sabe nada de `localStorage` ni de Zustand: recibe `mensajesIniciales` (para
  retomar una conversación guardada) y `onMensajesChange` (para avisar cambios hacia arriba). Cada
  consumidor (`Boga.page.tsx`, `AsistenteTab.tsx`) es quien lee/escribe el store y **remonta**
  `BogaChat` con una `key` distinta por conversación (`key={conversacionActivaId ?? 'nueva'}`),
  porque `useChat` solo toma sus mensajes iniciales una vez, al montar.
- El chiste inicial y las preguntas sugeridas solo aparecen en una conversación nueva/vacía —
  `BogaChat` calcula `retomaConversacion = mensajesIniciales.length > 0` y arranca
  `esPrimeraPregunta` en `false` cuando la hay.
- No se persiste una conversación que todavía es solo el saludo inicial (evita ensuciar el
  historial con conversaciones vacías que el usuario abrió pero no usó) — recién se crea la
  entrada en el store cuando llega el primer mensaje real.
- La tab "Boga" de la actuación usa una lista/dropdown simple (sin sidebar) porque no hace falta
  más para el volumen de conversaciones por actuación; el módulo `/boga` sí tiene el panel lateral
  completo, al ser el punto de entrada equivalente a la ventana de chat de Claude/ChatGPT.

## Adjuntar archivos (PDF/Word)

Los tres puntos de entrada (comparten `BogaChat.tsx`) permiten adjuntar un PDF o Word (.docx) a
una consulta puntual, para que Boga responda preguntas sobre su contenido (ej. "resumime este
escrito").

- **100% client-side, sin backend:** el archivo nunca se sube a ningún lado. La extracción de
  texto corre en el navegador con `pdfjs-dist` (PDF) y `mammoth` (.docx) — helper centralizado en
  `src/utils/extraerTextoArchivo.ts`.
- **`.doc` legado NO soportado** — solo PDF y `.docx`. `mammoth.extractRawText` no maneja bien el
  formato binario `.doc` viejo; se descartó por no ser bloqueante (decisión confirmada con Cristian).
- **Sin persistencia:** el texto extraído se manda a `/api/chat` para esa consulta puntual (campo
  `documentoAdjunto: { nombre, texto }` en el body, junto a `expedienteContext`) pero **no** se
  guarda en `localStorage` — al reabrir una conversación guardada más adelante, solo quedan los
  mensajes de texto (pregunta + respuesta), igual que hoy. Es a propósito, para no comerse el
  espacio limitado de `localStorage` con contenido de documentos.
- **Límite de tamaño:** 8MB (`TAMANO_MAXIMO_ARCHIVO_BYTES` en `extraerTextoArchivo.ts`). Si se
  supera, o si la extracción falla (PDF escaneado sin texto, archivo corrupto, extensión no
  soportada), se lanza `ErrorExtraccionArchivo` con un mensaje apto para mostrar al usuario
  directo — nunca rompe el chat.
- **UI en `BogaChat.tsx`:** botón de clip (`Icon name="attach_file"`, ya existía en `ICON_MAP`)
  al lado del input. Al seleccionar un archivo se extrae el texto de inmediato (no recién al
  enviar) mostrando "Leyendo archivo…" y deshabilitando el envío mientras tanto; si sale bien
  queda un chip con el nombre del archivo y una X para quitarlo antes de enviar. El estado del
  archivo adjunto (`archivoAdjunto`/`leyendoArchivo`/`errorArchivo`) es local a `BogaChat`, se
  resetea después de cada envío y no se expone a los consumidores (`AsistenteTab.tsx`,
  `BogaFab.tsx`, `Boga.page.tsx`).
- **`api/chat.ts`** arma una sección extra en el `systemPrompt` cuando llega `documentoAdjunto`,
  aclarando que es "de esta consulta puntual" (no persistente) para que el modelo no asuma que va
  a seguir disponible en próximos mensajes de la misma conversación.
- **`pdfjs-dist`:** el worker se referencia con el patrón estándar de Vite
  (`import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'` +
  `GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl`) — Vite lo emite como asset propio con hash,
  sin tocar `public/`.

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
"@ai-sdk/groq": "^4.0.30",
"pdfjs-dist": "^6.3.289",
"mammoth": "^1.12.3"
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
| `smart_toy` | `SparklesIcon` (también usado como ícono del nav "Chat con Boga" en el Sidebar) |
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

- El historial no se sincroniza entre dispositivos/navegadores (limitación conocida y aceptada,
  ver sección "Historial de conversaciones" arriba) — para eso haría falta backend propio, que
  hoy el proyecto no tiene.
