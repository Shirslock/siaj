# src/store/ — Estado global (Zustand)

## Principio
Un store por dominio. Estado en memoria.
Solo sessionStorage para ID del usuario activo.

## Stores disponibles

| Store | Qué maneja | Hook |
|-------|-----------|------|
| `expedientes.store.ts` | Expedientes, queue, tareas, filtros | `useExpedientesStore()` |
| `ui.store.ts` | Usuario activo, sidebar, sessionStorage | `useUIStore()` |

> actividades.store.ts y agenda.store.ts no existen aún — pendientes para sprint de agenda.

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

// Tareas estructuradas (por estado procesal)
inicializarTareas(expId, estadoCodigo, tareas)
actualizarTarea(expId, estadoCodigo, tareaId, cambios)
actualizarChecklist(expId, actividadIndex, checklist)

// Vínculos e intervinientes
vincularExpediente(expId, vinculo)
desvincularExpediente(expId, vinculoId)
agregarInterviniente(expId, interviniente)
eliminarInterviniente(expId, intervinienteId)

// Filtros
setFiltros(filtros)
```

## Acciones — ui.store.ts

```ts
setUsuarioActivo(id)   // persiste en sessionStorage
toggleSidebar()
// Toasts: NO usar showToast — usar toast.* de react-toastify directamente
```

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
Ejemplo: `'C-0023/2026__ASIGNADO'`

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

**`tareasMap` inicial:** arranca vacío `{}`. Las tareas se inicializan con `inicializarTareas(expId, estadoCodigo, tareas)` al abrir un estado en TimelineTab.
