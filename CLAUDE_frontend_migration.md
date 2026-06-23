# CLAUDE.md — SIAJ Frontend Migration
# Sistema Integral de Asuntos Jurídicos — SOFSA / Trenes Argentinos
# Metodología: Spec Driven Development — Migración de mocks a API real

> Fuente de verdad para Claude Code en el repo `siaj` (frontend).
> Leer este archivo Y el CLAUDE_root.md antes de escribir cualquier código.
> Este archivo se actualiza después de cada spec completada y confirmada.

---

## 1. Contexto de la migración

El frontend React fue construido con datos mock en Zustand. El backend (`siaj-api`)
está completo con todos los endpoints. El objetivo de estas specs es reemplazar
los mocks del store por llamadas reales a la API, manteniendo la interfaz de cada
acción intacta — los componentes no deben modificarse salvo excepciones puntuales.

**Backend corriendo en:** `http://localhost:3001`
**Frontend corriendo en:** `http://localhost:5173`
**Variable de entorno:** `VITE_API_URL=http://localhost:3001` en `.env.local`

---

## 2. Patrón de migración — regla de oro

```typescript
// ANTES — mutación en memoria (mock)
actualizarEstado: (id, estado) => set(s => {
  const fn = (e: Expediente) => ({ ...e, estado })
  return { expedientes: applyToArr(s.expedientes, id, fn), ... }
})

// DESPUÉS — llamada a API + actualización optimista
actualizarEstado: async (id, estado) => {
  // 1. Actualización optimista inmediata (UI responde al instante)
  set(s => {
    const fn = (e: Expediente) => ({ ...e, estadoProcesal: estado })
    return {
      expedientes: applyToArr(s.expedientes, id, fn),
      expedienteActivo: applyToActivo(s.expedienteActivo, id, fn),
    }
  })
  // 2. Persistencia en backend
  const [serie, anio] = id.split('/')
  await api.patch(`/api/expedientes/${serie}/${anio}/estado`, { estadoProcesal: estado })
}
```

**Siempre usar actualización optimista** — la UI no debe esperar la respuesta del backend
para reflejar el cambio. Si el backend falla, mostrar un toast de error.

---

## 3. Archivos de API creados (no modificar sin razón)

| Archivo | Responsabilidad |
|---------|----------------|
| `src/api/client.ts` | `apiFetch` + objeto `api` (get/post/patch/delete) + gestión de token JWT |
| `src/api/auth.ts` | `login()`, `getMe()` |
| `src/api/expedientes.ts` | `getExpedientes()`, `getExpediente()`, `crearExpediente()`, `getQueue()` |

---

## 4. Estado actual del store — qué está migrado y qué no

### `src/store/ui.store.ts`
- ✅ `loginAsync(email, password)` — llama al backend, guarda token en sessionStorage
- ✅ `logout()` — limpia token y usuario
- ✅ `usuarioActivo` — se hidrata desde `getMe()` al recargar la app

### `src/store/expedientes.store.ts`
- ✅ `cargarExpedientes(filtros?)` — GET /api/expedientes
- ✅ `cargarQueue()` — GET /api/expedientes/queue
- ✅ `setExpedienteActivo(id)` — GET /api/expedientes/:serie/:anio (con todas las relaciones)
- ❌ `actualizarExpediente` — todavía mock
- ❌ `actualizarCampoMesa` — todavía mock
- ❌ `actualizarCampoAbogado` — todavía mock
- ❌ `actualizarEstado` — todavía mock
- ❌ `asignarAbogado` — todavía mock
- ❌ `agregarActividad` — todavía mock
- ❌ `agregarSubitem` — todavía mock
- ❌ `agregarReply` — todavía mock
- ❌ `inicializarTareas` — todavía mock
- ❌ `actualizarTarea` — todavía mock
- ❌ `actualizarChecklist` — todavía mock
- ❌ `agregarInterviniente` — todavía mock
- ❌ `eliminarInterviniente` — todavía mock
- ❌ `editarInterviniente` — todavía mock
- ❌ `agregarDocumento` — todavía mock
- ❌ `eliminarDocumento` — todavía mock
- ❌ `reordenarDocumentos` — todavía mock
- ❌ `vincularExpediente` — todavía mock
- ❌ `desvincularExpediente` — todavía mock
- ❌ `agregarRegistroPenal` — todavía mock
- ❌ `actualizarRegistroPenal` — todavía mock
- ❌ `eliminarRegistroPenal` — todavía mock

### `src/store/configuracion.store.ts`
- ❌ Todo todavía mock — se migra en SPEC-FE-07

---

## 5. Mapa acción del store → endpoint backend

| Acción Zustand | Método | Endpoint |
|----------------|--------|----------|
| `cargarExpedientes(filtros?)` | GET | `/api/expedientes?...` |
| `cargarQueue()` | GET | `/api/expedientes/queue` |
| `setExpedienteActivo(id)` | GET | `/api/expedientes/:serie/:anio` |
| `crearExpediente(body)` | POST | `/api/expedientes` |
| `actualizarExpediente(id, patch)` | PATCH | `/api/expedientes/:serie/:anio` |
| `actualizarCampoMesa(id, campo, valor)` | PATCH | `/api/expedientes/:serie/:anio/campos-mesa` |
| `actualizarCampoAbogado(id, campo, valor)` | PATCH | `/api/expedientes/:serie/:anio/campos-abogado` |
| `actualizarEstado(id, estado)` | PATCH | `/api/expedientes/:serie/:anio/estado` |
| `asignarAbogado(expId, abogadoId)` | PATCH | `/api/expedientes/:serie/:anio/asignar` |
| `agregarActividad(expId, actividad)` | POST | `/api/expedientes/:serie/:anio/actividades` |
| `agregarSubitem(expId, actId, subitem)` | POST | `/api/expedientes/:serie/:anio/actividades/:actId/subitems` |
| `agregarReply(expId, actIdx, reply)` | POST | `/api/expedientes/:serie/:anio/actividades/:actId/replies` |
| `actualizarChecklist(expId, actIdx, checklist)` | PATCH | `/api/expedientes/:serie/:anio/actividades/:actId/checklist` |
| `inicializarTareas(expId, estado, tareas)` | POST | `/api/expedientes/:serie/:anio/tareas/:estadoCodigo` |
| `actualizarTarea(expId, estado, tareaId, cambios)` | PATCH | `/api/expedientes/:serie/:anio/tareas/:estadoCodigo/:tareaId` |
| `agregarInterviniente(expId, int)` | POST | `/api/expedientes/:serie/:anio/intervinientes` |
| `editarInterviniente(expId, intId, cambios)` | PATCH | `/api/expedientes/:serie/:anio/intervinientes/:intId` |
| `eliminarInterviniente(expId, intId)` | DELETE | `/api/expedientes/:serie/:anio/intervinientes/:intId` |
| `agregarDocumento(expId, doc)` | POST | `/api/expedientes/:serie/:anio/documentos` |
| `eliminarDocumento(expId, docId)` | DELETE | `/api/expedientes/:serie/:anio/documentos/:docId` |
| `reordenarDocumentos(expId, orden)` | PATCH | `/api/expedientes/:serie/:anio/documentos/reordenar` |
| `vincularExpediente(expId, vinculo)` | POST | `/api/expedientes/:serie/:anio/vinculos` |
| `desvincularExpediente(expId, vinculoId)` | DELETE | `/api/expedientes/:serie/:anio/vinculos/:vinculoId` |
| `agregarRegistroPenal(expId, reg)` | POST | `/api/expedientes/:serie/:anio/registros-penales` |
| `actualizarRegistroPenal(expId, regId, cambios)` | PATCH | `/api/expedientes/:serie/:anio/registros-penales/:regId` |
| `eliminarRegistroPenal(expId, regId)` | DELETE | `/api/expedientes/:serie/:anio/registros-penales/:regId` |

**Nota crítica sobre IDs:** los expedientes tienen IDs del tipo `C-0001/2026`.
Para construir la URL siempre hacer:
```typescript
const [serie, anio] = id.split('/')
// → /api/expedientes/C-0001/2026
```

---

## 6. Convenciones de manejo de errores

```typescript
// En cada acción async del store que modifica datos:
try {
  // actualización optimista primero
  set(s => ({ ... }))
  // luego persistencia
  await api.patch(...)
} catch (error) {
  // revertir el estado optimista si es necesario
  // mostrar toast de error
  toast.error('No se pudo guardar el cambio. Intentá nuevamente.')
  // re-lanzar si el componente necesita saber del error
}
```

---

## 7. Mocks que se pueden eliminar después de cada spec

Una vez migrada una acción, si los mocks ya no son necesarios para ninguna otra
parte de la app, se pueden eliminar de `src/data/expedientes.mock.ts`.

**No eliminar todavía** — esperar hasta que todas las specs de migración estén completas
y verificadas. Hacerlo spec por spec genera conflictos innecesarios.

---

## 8. Specs — estado de implementación

> Claude Code actualiza esta sección después de completar cada spec.
> Estados: ⬜ pendiente | 🔄 en progreso | ✅ completado

### SPEC-FE-01 — Infraestructura de API y autenticación ✅
- ✅ `src/api/client.ts` — cliente HTTP con token JWT
- ✅ `src/api/auth.ts` — login + getMe
- ✅ `src/store/ui.store.ts` — loginAsync + logout
- ✅ `src/pages/Login/Login.page.tsx` — página de login
- ✅ `src/App.tsx` — guard de autenticación + rehidratación
- ✅ Logout en Topbar
- ✅ UserSwitcher mock eliminado

### SPEC-FE-02 — Bandejas con datos reales ✅
- ✅ `src/api/expedientes.ts` — getExpedientes, getExpediente, crearExpediente, getQueue
- ✅ `src/store/expedientes.store.ts` — cargarExpedientes, cargarQueue, setExpedienteActivo
- ✅ MesaSaco.page — carga todos los expedientes (no solo queue)
- ✅ BandejaAbogado.page — carga expedientes propios
- ✅ BandejaArea.page — carga expedientes del área

### SPEC-FE-03 — Alta de actuación ✅
- ✅ `src/api/expedientes.ts` — `crearExpediente(body)` ya existía, confirmado
- ✅ `src/store/expedientes.store.ts` — acción `altaExpediente(body)` conectada al backend
- ✅ `AltaExpediente.page.tsx` — al confirmar el alta llama al backend, redirige al detalle real
- ✅ Verificado: crear actuación desde la UI aparece en la DB y en la bandeja

### SPEC-FE-04 — Detalle: DatosTab y edición de campos ✅
- ✅ `actualizarExpediente` → PATCH /api/expedientes/:serie/:anio
- ✅ `actualizarCampoMesa` → PATCH /api/expedientes/:serie/:anio/campos-mesa
- ✅ `actualizarCampoAbogado` → PATCH /api/expedientes/:serie/:anio/campos-abogado
- ✅ `actualizarEstado` → PATCH /api/expedientes/:serie/:anio/estado
- ✅ `asignarAbogado` → PATCH /api/expedientes/:serie/:anio/asignar
- ✅ Verificado: editar campos en DatosTab persiste en DB

### SPEC-FE-05 — Timeline y actividades ✅
- ✅ `agregarActividad` → POST /api/expedientes/:serie/:anio/actividades
- ✅ `agregarReply` → POST actividades/:actId/replies
- ✅ `actualizarChecklist` → PATCH actividades/:actId/checklist
- ✅ `agregarSubitem` → POST actividades/:actId/subitems
- ✅ Verificado: nueva actividad aparece en el timeline real

### SPEC-FE-06 — Tareas, intervinientes, documentos, vínculos ⬜
- ⬜ `inicializarTareas` → POST tareas/:estadoCodigo
- ⬜ `actualizarTarea` → PATCH tareas/:estadoCodigo/:tareaId
- ⬜ `agregarInterviniente` → POST intervinientes
- ⬜ `editarInterviniente` → PATCH intervinientes/:intId
- ⬜ `eliminarInterviniente` → DELETE intervinientes/:intId
- ⬜ `agregarDocumento` → POST documentos
- ⬜ `eliminarDocumento` → DELETE documentos/:docId
- ⬜ `reordenarDocumentos` → PATCH documentos/reordenar
- ⬜ `vincularExpediente` → POST vinculos
- ⬜ `desvincularExpediente` → DELETE vinculos/:vinculoId

### SPEC-FE-07 — Registros penales y notificaciones ⬜
- ⬜ `agregarRegistroPenal` → POST registros-penales
- ⬜ `actualizarRegistroPenal` → PATCH registros-penales/:regId
- ⬜ `eliminarRegistroPenal` → DELETE registros-penales/:regId
- ⬜ Campana de notificaciones → GET /api/notificaciones
- ⬜ Marcar leída → PATCH /api/notificaciones/:id/leida
- ⬜ Marcar todas → PATCH /api/notificaciones/marcar-todas

### SPEC-FE-08 — Panel de configuración ⬜
- ⬜ `src/store/configuracion.store.ts` — catálogos desde GET /api/catalogos/:tipo
- ⬜ Edición de catálogos → POST/PATCH /api/catalogos/:tipo
- ⬜ Lista de usuarios → GET /api/usuarios

### SPEC-FE-09 — Limpieza final de mocks ⬜
- ⬜ Eliminar imports de `expedientes.mock.ts` del store
- ⬜ Eliminar o archivar `src/data/expedientes.mock.ts`
- ⬜ `npx tsc --noEmit` sin errores
- ⬜ `npm run build` sin errores ni warnings

---

## 9. Checklist antes de considerar una spec completada

- [ ] `npx tsc --noEmit` sin errores
- [ ] La acción migrada persiste correctamente en PostgreSQL (verificar con Prisma Studio o curl)
- [ ] La UI responde de forma optimista (sin esperar al backend)
- [ ] Los errores del backend muestran toast en español
- [ ] Sin `console.log` temporales
- [ ] Sección 8 actualizada con ✅
- [ ] No commitear hasta que Chris lo indique explícitamente

---

## 10. Notas técnicas importantes

- **IDs con `/`:** siempre splitear `id.split('/')` para construir la URL del endpoint
- **Token JWT:** se guarda en `sessionStorage` con key `'siaj_token'` — el cliente lo adjunta automáticamente
- **Optimistic update:** actualizar el estado local ANTES de llamar al backend
- **Rehidratación:** al recargar la app, si hay token en sessionStorage → llamar `getMe()` para restaurar `usuarioActivo`
- **Mocks en paralelo:** mientras una acción no esté migrada, sigue funcionando con datos locales — no rompe nada
- **`applyToArr` y `applyToActivo`:** mantener estos helpers — se siguen usando en las acciones migradas para la actualización optimista
