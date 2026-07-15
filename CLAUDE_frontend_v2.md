# CLAUDE_migration.md — SIAJ Frontend
# Sistema Integral de Asuntos Jurídicos — SOFSA / Trenes Argentinos
# Metodología: Spec Driven Development — Migración + Módulo IA

> Fuente de verdad para Claude Code en el repo `siaj` (frontend).
> Leer este archivo Y el CLAUDE_root.md antes de escribir cualquier código.

---

## 1. Estado de la migración

La migración de mocks a API real está **completa**. Todas las acciones del store
llaman al backend real en `http://localhost:3001`.

**Backend:** `http://localhost:3001`
**Frontend:** `http://localhost:5173`
**Variable de entorno:** `VITE_API_URL=http://localhost:3001` en `.env.local`

---

## 2. Archivos de API — todos creados

| Archivo | Estado | Responsabilidad |
|---------|--------|----------------|
| `src/api/client.ts` | ✅ | apiFetch + JWT token |
| `src/api/auth.ts` | ✅ | login, getMe |
| `src/api/expedientes.ts` | ✅ | CRUD completo expedientes + relaciones |
| `src/api/catalogos.ts` | ✅ | getCatalogo, agregarItem, editarItem |
| `src/api/notificaciones.ts` | ✅ | getNotificaciones, marcarLeida, marcarTodas |
| `src/api/ai.ts` | ⬜ | SPEC-FE-11 — consultar, buscar, similares |

---

## 3. Estado del store

### `src/store/ui.store.ts` ✅
- `loginAsync`, `logout`, rehidratación con `getMe()`

### `src/store/expedientes.store.ts` ✅
Todas las acciones migradas al backend real:
- `cargarExpedientes`, `cargarQueue`, `setExpedienteActivo`, `altaExpediente`
- `actualizarExpediente`, `actualizarCampoMesa`, `actualizarCampoAbogado`
- `actualizarEstado`, `asignarAbogado`
- `agregarActividad`, `agregarReply`, `actualizarChecklist`, `agregarSubitem`
- `inicializarTareas`, `actualizarTarea`
- `agregarInterviniente`, `editarInterviniente`, `eliminarInterviniente`
- `agregarDocumento`, `eliminarDocumento`, `reordenarDocumentos`
- `vincularExpediente`, `desvincularExpediente`
- `agregarRegistroPenal`, `actualizarRegistroPenal`, `eliminarRegistroPenal`

### `src/store/configuracion.store.ts` ✅
- `cargarCatalogos()` — carga los 23 tipos en paralelo
- `cargarUsuarios()` — lista de 32 usuarios
- `agregarItem`, `editarItem`, `desactivarItem` → backend real

### `src/store/notificaciones.store.ts` ✅
- `cargarNotificaciones`, `marcarComoLeida`, `marcarTodasComoLeidas`

### `src/store/ai.store.ts` ⬜ SPEC-FE-11
- `consultarIA`, `buscarSemantico`, `obtenerSimilares`

---

## 4. Fixes aplicados durante la migración

Documentados para referencia futura:

- **IDs con `/`:** siempre `id.split('/')` para construir URLs → `C-0001/2026` → `/C-0001/2026`
- **Arrays undefined:** todos los accesos a arrays del expediente usan `?? []`
- **tareasMap rehydration:** `setExpedienteActivo` carga tareas del estado procesal actual
- **tarea_id canónico:** el PATCH de tareas usa `tarea_id` (DC_EP_01) no el UUID de fila
- **estadoProcesal en header:** el badge usa `exp.estadoProcesal` con label humanizado
- **carátula en formulario:** incluida en `draftTop` y en el `save()`
- **puedeReasignar:** incluye `gerente` además de `abogado_coordinador`
- **Mesa SACO:** usa `cargarExpedientes()` (todos) no `cargarQueue()` (solo sin asignar)
- **ADMINISTRATIVO:** puede ver detalle de cualquier expediente (fix en backend)

---

## 5. Patrón de actualización optimista

```typescript
// SIEMPRE aplicar en acciones que modifican datos:
accionAsync: async (id, datos) => {
  // 1. Actualización optimista — UI responde al instante
  set(s => ({ expedienteActivo: { ...s.expedienteActivo, ...datos } }))
  // 2. Persistencia en backend
  await api.patch(`/api/...`, datos)
  // 3. Si falla el backend → mostrar toast de error
}
```

---

## 6. Mapa acción → endpoint (referencia)

| Acción | Endpoint |
|--------|----------|
| `cargarExpedientes` | GET /api/expedientes |
| `setExpedienteActivo` | GET /api/expedientes/:s/:a |
| `altaExpediente` | POST /api/expedientes |
| `actualizarExpediente` | PATCH /api/expedientes/:s/:a |
| `actualizarEstado` | PATCH /api/expedientes/:s/:a/estado |
| `asignarAbogado` | PATCH /api/expedientes/:s/:a/asignar |
| `agregarActividad` | POST /api/expedientes/:s/:a/actividades |
| `agregarReply` | POST /api/expedientes/:s/:a/actividades/:id/replies |
| `inicializarTareas` | POST /api/expedientes/:s/:a/tareas/:estado |
| `actualizarTarea` | PATCH /api/expedientes/:s/:a/tareas/:estado/:tareaId |
| `agregarInterviniente` | POST /api/expedientes/:s/:a/intervinientes |
| `agregarDocumento` | POST /api/expedientes/:s/:a/documentos |
| `vincularExpediente` | POST /api/expedientes/:s/:a/vinculos |
| `consultarIA` | POST /api/ai/consultar |
| `buscarSemantico` | POST /api/ai/buscar |
| `obtenerSimilares` | GET /api/ai/similares/:s/:a |

---

## 7. Módulo IA — arquitectura frontend

### `src/api/ai.ts` (a crear en SPEC-FE-11)
```typescript
export async function consultarIA(expedienteId: string, pregunta: string)
  : Promise<{ data: { respuesta: string, fuentes: Fuente[], tokens: number } }>

export async function buscarSemantico(pregunta: string, filtros?: FiltrosAI)
  : Promise<{ data: { resultados: ResultadoBusqueda[] } }>

export async function obtenerSimilares(expedienteId: string)
  : Promise<{ data: { similares: ExpedienteSimilar[] } }>
```

### Panel de IA en DetalleExpediente
Nueva tab "Asistente IA" en `DetalleExpediente.page.tsx`:
- Input de pregunta con botón enviar
- Respuesta de Gemini con citas de página y documento
- Indicador "Analizando documentos..." mientras procesa
- Historial de preguntas de la sesión (no persiste)
- Solo visible si el expediente tiene documentos indexados

### Panel de búsqueda global
Nueva página o modal accesible desde la bandeja:
- Input de búsqueda semántica
- Resultados con fragmento del documento, expediente y página
- Filtros por área, tipo, fecha

### Panel de casos similares
Sección en DetalleExpediente:
- Lista de expedientes similares con % de similitud
- Link directo al expediente similar

---

## 8. Specs — estado de implementación

> Estados: ⬜ pendiente | 🔄 en progreso | ✅ completado

### SPEC-FE-01 — Infraestructura API y autenticación ✅
### SPEC-FE-02 — Bandejas con datos reales ✅
### SPEC-FE-03 — Alta de actuación ✅
### SPEC-FE-04 — DatosTab y edición de campos ✅
### SPEC-FE-05 — Timeline y actividades ✅
### SPEC-FE-06 — Tareas, intervinientes, documentos, vínculos ✅
### SPEC-FE-07 — Registros penales y notificaciones ✅
### SPEC-FE-08 — Panel de configuración ✅
### SPEC-FE-09 — Limpieza final de mocks ✅

### SPEC-FE-14 — Merge main + módulo Solicitudes ✅
- ✅ editarActividad + eliminarActividad con backend real
- ✅ LogAuditoriaList conectado al endpoint real
- ✅ Generador de Escritos en TimelineTab
- ✅ Tab Nueva Solicitud con SolicitudForm
- ✅ FormularioDinamico: fuero_select, juzgado_filtered, secretaria_juzgado
- ✅ Módulo Solicitudes: /solicitudes + Sidebar
- ✅ AppLayout: Panel de Control + full-width configuración
- ✅ Icon.tsx: sets unificados
- ✅ Tipos: EscritoTemplate, DatosEscrito, Matricula, LogAuditoria
- ✅ npm run build sin errores

### SPEC-FE-10 — Upload real de PDF ⬜
- ⬜ Modificar `DocumentosTab.tsx` para enviar archivo real (multipart/form-data)
- ⬜ `src/api/expedientes.ts` — `subirDocumento(expId, file)` con FormData
- ⬜ Mostrar progreso de subida (porcentaje o spinner)
- ⬜ Mostrar estado "Indexando..." después de subir (mientras el backend procesa)
- ⬜ Verificado: PDF sube a Supabase + aparece en la lista con URL real

### SPEC-FE-11 — Panel de IA en DetalleExpediente ⬜
- ⬜ `src/api/ai.ts` — consultarIA, buscarSemantico, obtenerSimilares
- ⬜ `src/store/ai.store.ts` — estado del chat, historial de sesión, loading
- ⬜ Nueva tab "Asistente" en DetalleExpediente (solo si hay docs indexados)
- ⬜ Componente ChatIA: input + respuesta + fuentes citadas
- ⬜ Indicador de procesamiento "Analizando documentos..."
- ⬜ Verificado: pregunta sobre contenido del PDF → respuesta con cita de página

### SPEC-FE-12 — Búsqueda semántica global ⬜
- ⬜ Nuevo botón/icono de búsqueda en Topbar o Sidebar
- ⬜ Modal de búsqueda semántica con input + resultados
- ⬜ Cada resultado muestra: fragmento, expediente, documento, página
- ⬜ Click en resultado navega al expediente

### SPEC-FE-13 — Casos similares ⬜
- ⬜ Sección "Casos similares" en DetalleExpediente (tab Vinculados o nueva sección)
- ⬜ Lista con % similitud + carátula + área + tipo
- ⬜ Solo visible si el expediente tiene documentos indexados

---

## 9. Checklist antes de considerar una spec completada

- [ ] `npx tsc --noEmit` sin errores
- [ ] La acción persiste correctamente en PostgreSQL
- [ ] UI responde optimistamente (sin esperar backend)
- [ ] Errores del backend muestran toast en español
- [ ] Sin `console.log` temporales
- [ ] Sección 8 actualizada con ✅
- [ ] No commitear hasta que Chris lo indique

---

## 10. Notas técnicas

- **IDs con `/`:** siempre `id.split('/')` para construir URLs
- **Token JWT:** `sessionStorage` key `'siaj_token'` — el cliente lo adjunta automáticamente
- **Optimistic update:** actualizar estado local ANTES de llamar al backend
- **tarea_id vs id:** las tareas del backend retornan `tarea_id` (canónico) y `id` (UUID de fila). El store mapea `tarea_id → id` al cargar
- **Upload multipart:** para subir PDFs usar `FormData`, NO `JSON.stringify`. El `api.post` actual no sirve — necesita un método `apiUpload` separado que no setee `Content-Type` (el browser lo hace automáticamente con el boundary)
