# Asistente IA — probar en local

El Asistente IA (tab "Saúl" en el detalle de una actuación) corre contra Groq a través de
una función serverless de Vercel (`api/chat.ts`).

## Pasos

Se necesitan **dos terminales**: una para el frontend (Vite, que sirve la app) y otra para
el backend del chat (`vercel dev`, que emula la función serverless). Vite proxea `/api/*`
hacia esa segunda terminal — así el frontend no depende de que `vercel dev` sirva la app.

1. `cp .env.local.example .env.local`
2. Completar `GROQ_API_KEY` en `.env.local` (conseguir la key en [console.groq.com](https://console.groq.com))
3. `npm install -g vercel` (si no está instalado)
4. `vercel link` (primera vez — vincula la carpeta local con el proyecto de Vercel)

**Terminal 1 — funciones serverless (solo el backend del chat):**
```
vercel dev --listen 3001
```

**Terminal 2 — frontend (Vite):**
```
npm run dev
```

5. Abrir la URL que muestra la **Terminal 2** (normalmente `http://localhost:5173`) — **no**
   el puerto 3001, ese es solo el backend.
6. Ir a cualquier actuación → tab "Saúl". Las llamadas del chat a `/api/chat` salen desde el
   navegador hacia el puerto de Vite, y el proxy configurado en `vite.config.ts`
   (`server.proxy['/api']`) las redirige por atrás al puerto 3001.

## Apagar el agente en local

Cambiar `AGENT_ENABLED=false` en `.env.local` y reiniciar la Terminal 1 (`vercel dev --listen
3001`). El endpoint responde `503 agent_disabled` y la tab muestra el estado "El asistente IA
está desactivado temporalmente" en vez de un error.

## Notas

- `.env.local` **no se commitea** (está en `.gitignore`) — cada quien pone su propia key ahí.
  `.env.local.example` sí se commitea, es la plantilla sin key real.
- Sin `GROQ_API_KEY` cargada, `api/chat.ts` también responde `agent_disabled` (no rompe, no
  hace falta apagar el agente a mano solo para poder levantar el proyecto sin key).
- Las variables `GROQ_API_KEY`/`AGENT_ENABLED` tienen que estar cargadas en el entorno
  **Development** del proyecto en Vercel (no solo Preview/Production) — `vercel dev` resuelve
  ese entorno. Si `vercel env pull .env.local` no las trae, revisar en el dashboard
  (Settings → Environment Variables) que también estén tildadas para Development.
- `vercel.json` tiene un rewrite explícito para `/api/(.*)` antes del catch-all del SPA —
  necesario para producción (deep-linking de rutas de React Router); en local, con este setup
  de dos terminales, ya no depende de `vercel dev` para servir el frontend, así que el catch-all
  del SPA no interfiere con nada.
- Ver `claude-docs/ASISTENTE_IA_CLAUDE.md` para la arquitectura completa del módulo (por qué
  no se usó assistant-ui, detalles de la API de `ai@7`, etc.).
