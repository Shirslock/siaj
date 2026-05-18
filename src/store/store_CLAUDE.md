# src/store/ — Estado global (Zustand)

## Principio
Un store por dominio. El estado vive en memoria.
No usar localStorage. Solo sessionStorage para el ID del usuario activo.

## Stores disponibles

| Store | Qué maneja | Hook |
|-------|-----------|------|
| `expedientes.store.ts` | Cola mesa, expedientes, filtros, expediente activo | `useExpedientesStore()` |
| `actividades.store.ts` | Notificaciones del módulo de actividades | `useActividadesStore()` |
| `agenda.store.ts` | Eventos con vencimiento | `useAgendaStore()` |
| `ui.store.ts` | Usuario activo, sidebar, toasts | `useUIStore()` |

---

## Acciones disponibles en expedientes.store.ts

```ts
setExpedienteActivo(id)               // carga el expediente en vista
actualizarCampoMesa(id, campo, valor)  // editar campo de mesa
actualizarCampoAbogado(id, campo, valor)
actualizarEstado(id, estado)
asignarAbogado(expedienteId, abogadoId)
agregarActividad(expedienteId, actividad)
agregarSubitem(expId, actividadIndex, subitem)
actualizarChecklist(expId, actividadIndex, checklist)
vincularExpediente(expId, vinculo)
desvincularExpediente(expId, vinculoId)
agregarInterviniente(expId, interviniente)
eliminarInterviniente(expId, intervinienteId)
setFiltros(filtros)
```

## Acciones disponibles en ui.store.ts

```ts
setUsuarioActivo(id)   // persiste en sessionStorage
toggleSidebar()
showToast(mensaje, tipo)   // tipo: 'success' | 'error' | 'warn' | 'info'
removeToast(id)
```

---

## Patrón para agregar una acción nueva

```ts
// 1. Agregar la firma en la interfaz
nuevaAccion: (param: string) => void

// 2. Implementar en el create()
nuevaAccion: (param) => set(s => ({
  expedientes: s.expedientes.map(e =>
    e.id === param ? { ...e, campo: nuevoValor } : e
  )
})),
```

---

## Regla de inmutabilidad
Nunca mutar el estado directamente.
Siempre retornar objetos nuevos con spread:
```ts
// ✓ Correcto
set(s => ({ items: [...s.items, nuevoItem] }))

// ✗ Incorrecto
s.items.push(nuevoItem)
```
