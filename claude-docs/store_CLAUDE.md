# src/store/ — Estado global (Zustand)

## Principio
Un store por dominio. Estado en memoria.
Solo sessionStorage para ID del usuario activo.

## Stores disponibles

| Store | Qué maneja | Hook |
|-------|-----------|------|
| `expedientes.store.ts` | Expedientes, queue, tareas, filtros | `useExpedientesStore()` |
| `ui.store.ts` | Usuario activo, sidebar, sessionStorage, búsqueda global | `useUIStore()` |
| `configuracion.store.ts` | Catálogos editables del sistema + usuarios | `useConfiguracionStore()` |
| `agenda.store.ts` | Eventos custom del usuario en la agenda | `useAgendaStore()` |
| `tareas.store.ts` | Tareas Kanban del módulo Tareas + solicitudes internas + licencias | `useTareasStore()` / `useSolicitudesStore()` / `useLicenciasStore()` |

---

## Acciones — expedientes.store.ts

```ts
// Expedientes
setExpedienteActivo(id)
actualizarCampoMesa(id, campo, valor)
actualizarCampoAbogado(id, campo, valor)
actualizarEstado(id, estado)
asignarAbogado(expedienteId, abogadoId)

// Timeline / actividades genéricas
agregarActividad(expedienteId, actividad)
agregarSubitem(expId, actividadIndex, subitem)
agregarReply(expId, actividadIdx, replyData)    // replyData: Omit<Reply, 'id' | 'created_at'>
editarActividad(expId, actividadIdx, cambios, usuarioId)   // cambios: Partial<Pick<Actividad, 'titulo'|'descripcion'|'fecha'|'doc_gde'|'fecha_vencimiento'|'fecha_aviso'>>; agrega entrada a log
eliminarActividad(expId, actividadIdx, usuarioId)          // soft-delete: setea eliminado: true + entrada en log; no-op sobre RECEPCION

// Tareas estructuradas (por estado procesal)
inicializarTareas(expId, estadoCodigo, tareas)
actualizarTarea(expId, estadoCodigo, tareaId, cambios)
actualizarChecklist(expId, actividadIndex, checklist)

// Vínculos e intervinientes
vincularExpediente(expId, vinculo)
desvincularExpediente(expId, vinculoId)
agregarInterviniente(expId, interviniente)
editarInterviniente(expId, intId, cambios)      // Partial<Interviniente>
eliminarInterviniente(expId, intervinienteId)

// Documentos
agregarDocumento(expId, doc)                    // doc: Documento (con id obligatorio)
eliminarDocumento(expedienteId, docId)          // por id string, no por índice
reordenarDocumentos(expId, ordenNuevo)          // ordenNuevo: string[] (array de ids)

// Registros penales
agregarRegistroPenal(expId, registro)
actualizarRegistroPenal(expId, registroId, cambios)
eliminarRegistroPenal(expId, registroId)

// Filtros
setFiltros(filtros)
```

**Log de auditoría (`editarActividad`/`eliminarActividad`):** ambas actualizan `expedientes` y
`expedienteActivo` en paralelo vía los helpers `applyToArr`/`applyToActivo` (mismo patrón que
`agregarReply`), agregando una `LogAuditoria` a `act.log`. `eliminarActividad` no borra la entrada
del array — marca `eliminado: true` para preservar el historial; TimelineTab filtra el feed con
`!a.eliminado`.

## Acciones — ui.store.ts

```ts
setUsuarioActivo(id)   // persiste en sessionStorage
toggleSidebar()
setBusquedaGlobal(q)   // buscador global del Topbar (persistente entre páginas)
// Toasts: NO usar showToast — usar toast.* de react-toastify directamente
```

**Buscador global (`busquedaGlobal`/`setBusquedaGlobal`):** alimenta el input de búsqueda del
`Topbar`, visible en todas las páginas. Si el usuario escribe estando fuera de `/actuaciones`,
el Topbar navega a `/actuaciones?q=<texto>`; `BandejaAbogado.page.tsx` lee `busquedaGlobal` (o
el query param `q` al montar) y lo vuelca al filtro `buscar`, que matchea `id`, `caratula`,
`numero_causa`, `numero_ee_gde` y el label de `tipo`.

## Acciones — configuracion.store.ts

```ts
agregarItem(tabla: string, item: CatalogoItem)
editarItem(tabla: string, id: string, cambios: Partial<CatalogoItem>)
desactivarItem(tabla: string, id: string)   // setea activo: false, no elimina
```

`tabla` es la clave del store (ej: `'lineas'`, `'juzgados'`, `'tiposHechoPenal'`).

---

## Toasts — react-toastify

```ts
import { toast } from 'react-toastify'

toast.success('Expediente registrado.')
toast.error('Error al procesar.')
toast.warn('Cambios pendientes.')
toast.info('Procesando...')
```

**NO existe showToast** en el store — fue reemplazado por react-toastify.

---

## Patrón para agregar una acción

```ts
// 1. Interfaz
nuevaAccion: (param: string) => void

// 2. Implementación — siempre inmutable
nuevaAccion: (param) => set(s => ({
  expedientes: s.expedientes.map(e =>
    e.id === param ? { ...e, campo: valor } : e
  )
}))
```

## tareasMap — estructura

Key: `${expedienteId}__${estadoCodigo}`
Ejemplo: `'C-0001/2023__EN_PRUEBA'` (el `estadoCodigo` es el código del catálogo, no el label)

```ts
const key = `${exp.id}__${estadoCodigo}`
const tareas = tareasMap[key] ?? estadoProcesal?.tareas ?? []
```

**Campos de alerta en `Tarea`:**
- `fecha_aviso?: string` — fecha ISO desde la cual mostrar el badge "Por vencer"; se configura con el date picker en TimelineTab (no hardcodeado en mock)
- `fechaVencimiento?: string` — fecha límite real de la tarea (se muestra en el tooltip)
- La alerta activa se calcula con `getAlertaExpediente(expId, tareasMap, exp.timeline)` de `src/utils/alertas.ts`
- El tercer parámetro `timeline` es opcional; si se pasa, también considera replies con `fecha_aviso <= hoy` y `fecha_vencimiento >= hoy`
- Usada en BandejaAbogado (fila + filtro) y en DetalleExpediente (badge en header)

**`tareasMap` inicial:** el store lo carga desde `TAREAS_MAP_INICIAL` (exportado de `expedientes.mock.ts`) — 3 entradas pre-populadas (`C-0001/2023__EN_PRUEBA`, `L-0002/2022__TRABA_LITIS`, `C-0009/2024__ACUERDO_EXTRAJUDICIAL`). Al abrir otros estados en TimelineTab se completan con `inicializarTareas(expId, estadoCodigo, tareas)`.

## Acciones — agenda.store.ts

```ts
agregarEvento(ev: Omit<EventoCustom, 'id'>)   // genera id CUSTOM_${Date.now()}_${random}
eliminarEvento(id: string)
```

Tipos exportados: `TipoEventoCustom` ('reunion' | 'recordatorio' | 'vencimiento' | 'otro'), `EventoCustom`, `COLOR_EVENTO`.

## Acciones — tareas.store.ts

```ts
agregarTarea(t: Omit<TareaKanban, 'id'>)      // genera id TK_${Date.now()}
editarTarea(id: string, cambios: Partial<TareaKanban>)
moverTarea(id: string, estado: EstadoTareaKanban)
eliminarTarea(id: string)
```

Tipos exportados: `TareaKanban`, `PrioridadTarea`, `EstadoTareaKanban`, `AreaDestinataria`, `PersonaArea`, `PERSONAS_POR_AREA`.

`PERSONAS_POR_AREA` — 6 personas de áreas externas (RRHH ×2, COMERCIAL ×2, SEGUROS ×2), IDs `PA_001`–`PA_006`.

## Acciones — useSolicitudesStore (en tareas.store.ts)

```ts
agregarSolicitud(s: Omit<Solicitud, 'id'>)   // genera id SOL_${Date.now()}
responderSolicitud(id: string, respuesta: RespuestaSolicitud)
editarSolicitud(id: string, cambios: Partial<Solicitud>)
```

Tipos exportados: `Solicitud`, `RespuestaSolicitud`, `TipoSolicitud` ('interna' | 'externa'),
`EstadoSolicitud` ('pendiente' | 'respondida'). Mock inicial: `SOLICITUDES_MOCK` (`SOL_001`–`SOL_005`).

**Modelo unificado (timeline ↔ módulo Solicitudes):** una "Nueva Solicitud" creada desde el timeline
(`guardarSolicitud`/`guardarSolicitudPenal`) usa **`agregarSolicitud`** (no `agregarTarea`), así aparece
en el módulo Solicitudes (`/tareas`) y puede responderse. `asignado_a` es `string[]` (internos `UR_` y/o
externos `PA_`); `tipo` = 'externa' si hay `area_destinataria`, si no 'interna'.

**`responderSolicitud` impacta en el expediente de origen** (vía `useExpedientesStore.getState()`,
sin import circular):
1. Marca la solicitud `estado: 'respondida'` + guarda `respuesta`.
2. `agregarActividad` en `sol.expediente_id` → actividad `tipo: 'NOTA_RESPUESTA'`, `id: SOLR_...`,
   `es_solicitud: true`, `solicitud_id: sol.id` (badge **RESPUESTA** en el feed).
3. Si `respuesta.adjunto_nombre` → `agregarDocumento` en el mismo expediente (`id: DOC_SOL_...`).

## Acciones — useLicenciasStore (en tareas.store.ts)

```ts
agregarLicencia(l: Omit<Licencia, 'id'>)   // genera id LIC_${Date.now()}
eliminarLicencia(id: string)
```

Tipos exportados: `Licencia`, `MotivoLicencia` ('vacaciones' | 'medica' | 'examen' | 'otro').
Mock inicial: `LICENCIAS_MOCK` (6 licencias, `LIC_001`–`LIC_006`).

Helpers (mismo archivo):
- `getReemplazanteActivo(licencias, usuarioId): Licencia | null` — licencia vigente hoy del usuario.
- `esReemplazanteActivo(licencias, reemplazanteId, titularId): boolean` — si un usuario reemplaza hoy a otro.

`Licencia`: `{ id, usuario_id, motivo, motivo_detalle?, fecha_inicio, fecha_fin, reemplazante_id, created_at }`.
`motivo_detalle` es obligatorio cuando `motivo === 'otro'`.

---

## Nota sobre Documento

`Documento` tiene campo `id: string` obligatorio desde feat/ux-refinements.
`eliminarDocumento` recibe `docId: string`, no índice numérico.
Los documentos del mock tienen IDs del tipo `DOC_C023_001`.
Al subir un archivo nuevo: `id: \`DOC_${Date.now()}\``.
