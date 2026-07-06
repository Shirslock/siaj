# src/store/ — Estado global (Zustand)

## Principio
Un store por dominio. Estado en memoria.
Solo sessionStorage para ID del usuario activo.

## Stores disponibles

| Store | Qué maneja | Hook |
|-------|-----------|------|
| `expedientes.store.ts` | Expedientes, queue, tareas, filtros | `useExpedientesStore()` |
| `ui.store.ts` | Usuario activo, sidebar, sessionStorage | `useUIStore()` |
| `configuracion.store.ts` | Catálogos editables del sistema + usuarios | `useConfiguracionStore()` |
| `agenda.store.ts` | Eventos custom del usuario en la agenda | `useAgendaStore()` |
| `tareas.store.ts` | Tareas Kanban del módulo Tareas + solicitudes internas | `useTareasStore()` |

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

## Acciones — ui.store.ts

```ts
setUsuarioActivo(id)   // persiste en sessionStorage
toggleSidebar()
// Toasts: NO usar showToast — usar toast.* de react-toastify directamente
```

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

### Crear una solicitud interna desde el timeline

```ts
const { agregarTarea } = useTareasStore()

agregarTarea({
  titulo, descripcion,
  expediente_id:       exp.id,
  expediente_caratula: exp.caratula,
  expediente_area:     exp.area,
  asignado_a:          '',           // id usuario interno (o vacío)
  creado_por:          usuarioActivo?.id ?? '',
  fecha_limite:        null,
  prioridad:           'media',
  estado:              'pendiente',
  mostrar_en_agenda:   false,
  area_destinataria:   'RRHH',       // si es área externa
  persona_contacto_id: 'PA_001',     // si es área externa
  persona_contacto:    'GARCIA, María José',
  etiquetas:           [],
  created_at:          new Date().toISOString(),
})
```

---

## Nota sobre Documento

`Documento` tiene campo `id: string` obligatorio desde feat/ux-refinements.
`eliminarDocumento` recibe `docId: string`, no índice numérico.
Los documentos del mock tienen IDs del tipo `DOC_C023_001`.
Al subir un archivo nuevo: `id: \`DOC_${Date.now()}\``.
