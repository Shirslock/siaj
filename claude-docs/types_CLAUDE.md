# src/types/ — Tipos de dominio

## Responsabilidad
Todos los contratos de datos del sistema SIAJ.
Una sola fuente de verdad: `index.ts`.

## Regla fundamental
Antes de crear una interfaz nueva → buscar si ya existe aquí.
Si existe y le faltan campos → extenderla, no duplicarla.

## Tipos disponibles

| Tipo | Descripción |
|------|-------------|
| `Area` | 'CIVIL' \| 'LABORAL' \| 'PENAL' |
| `Canal` | 'EE_GDE' \| 'MEMO_GDE' \| 'OTROS' |
| `RolSistema` | 'REFERENTE' \| 'COORDINADOR' \| 'ABOGADO' \| 'ADMINISTRATIVO' |
| `RolBD` | Roles del Excel: abogado, abogada, abogado_coordinador, asistente_jurídico, gerente, adm_mesa |
| `TipoGestion` | 20 tipos de gestión del sistema |
| `TipoActividad` | Tipos de actividades del letrado en el timeline |
| `EstadoActividad` | PENDIENTE \| EN_CURSO \| COMPLETADA \| VENCIDA |
| `EstadoTarea` | 'sin_estado' \| 'en_curso' \| 'cumplido' \| 'no_procedente' |
| `UrgenciaTarea` | 'rojo' \| 'ambar' \| 'verde' \| 'gris' |
| `Tarea` | Tarea estructurada de un estado procesal — incluye `fecha_aviso` y `fechaVencimiento` para alertas |
| `EstadoProcesal` | Estado con su lista de tareas y siguiente estado |
| `CatalogoItem` | `{ id, label, activo? }` — base para todos los catálogos. `activo` es opcional; `undefined` equivale a activo |
| `CatalogoItemExtended` | CatalogoItem + tipo? + provincia? + localidad? |
| `TipoGestionItem` | CatalogoItem + areas + canal + canales |
| `Usuario` | Usuario con rolBD, roles[], rolSistema, áreas, fifoOrder, lineasPenal |
| `Expediente` | Entidad principal — incluye estadoProcesal |
| `Actividad` | Actividad genérica del letrado en el timeline — incluye `replies?: Reply[]`, `log?: LogAuditoria[]`, `eliminado?: boolean` |
| `Reply` | Comentario anidado en una actividad — autor, texto, fecha, doc_gde, fecha_vencimiento, fecha_aviso |
| `TipoLogAuditoria` | 'EDICION' \| 'ELIMINACION' |
| `LogAuditoria` | Entrada de auditoría de una actividad — `usuario_id`, `timestamp` ISO, `descripcion`, snapshots `campo_antes`/`campo_despues` (JSON.stringify) |
| `ChecklistItem` | Ítem de checklist dentro de una actividad |
| `SubActividad` | Seguimiento dentro de una actividad |
| `Interviniente` | Parte del expediente |
| `Documento` | Archivo adjunto — tiene campo `id: string` obligatorio |
| `VinculoExpediente` | Relación entre expedientes |
| `CampoFormulario` | Definición de un campo dinámico |
| `FormularioSubtipo` | Campos mesa + abogado por tipo de gestión |
| `ItemQueue` | Entrada en la cola de Mesa SIAJ |
| `FiltrosExpediente` | Estado de filtros de las bandejas |
| `AccesosRol` | Permisos y ruta de inicio por rol |

## Campos destacados de Expediente

- `es_urgente?: boolean` — marcado manualmente desde el detalle; usado por filtro "Urgentes" en BandejaAbogado
- `es_principal?: boolean` — badge verde "Principal · PJN" en la fila de bandeja

## Campos destacados de EstadoProcesal

- `esArchivado?: boolean` — marca estados terminales no progresivos (DEVUELTO_SECTOR_REQUIRENTE, FINALIZADO). El modal de cambio de estado los excluye del optgroup "Retroceder".

## Campos destacados de Actividad

- `replies?: Reply[]` — comentarios anidados agregados por el letrado asignado
- `log?: LogAuditoria[]` — historial de ediciones/eliminaciones de la actividad (ver `editarActividad`/`eliminarActividad` en el store)
- `eliminado?: boolean` — soft-delete de la actividad. **No confundir con `activo`**: `activo` ya se usaba antes para marcar el movimiento de sistema "vigente" (ver `CausaDetalle.page.tsx`); reutilizarlo para soft-delete ocultaba actividades nuevas (`activo: false` por defecto en `agregarNuevaActividad`). El feed de TimelineTab filtra con `!a.eliminado`, no con `a.activo`.
- `tareasSnapshot?: Tarea[]` — snapshot de tareas al momento del cambio de estado
- `es_movimiento_impulsorio?: boolean` — marca el movimiento como impulsorio procesal
- `tipo?: 'AUDIENCIA' | 'TAREA' | 'ACTIVIDAD' | 'SISTEMA'` — clasificación para el módulo Agenda (`AgendaEvent`)

## Campos destacados de Documento

- `id: string` — **obligatorio** desde feat/ux-refinements. Requerido para DnD y operaciones CRUD.
- Los documentos del mock usan IDs `DOC_{expedienteShort}_{seq}` (ej: `DOC_C023_001`).
- Al crear desde upload: `id: \`DOC_${Date.now()}\``

## Cómo agregar un tipo nuevo

```ts
// Al final de index.ts, antes de los tipos de formulario
export interface MiNuevoTipo {
  id: string
  // ...
}
```

## Lo que NO va aquí
- Tipos locales de un componente → declarar inline en el mismo archivo
- Tipos de Vite/Tailwind → en sus archivos respectivos
