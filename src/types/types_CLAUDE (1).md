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
| `TipoActividad` | Tipos de actividades del letrado en el timeline — incluye `RECURSO_INCIDENTE` ("Interposición de Recurso") y `DILIGENCIAMIENTO` ("Diligenciamiento" — envío de cédulas) |
| `EstadoActividad` | PENDIENTE \| EN_CURSO \| COMPLETADA \| VENCIDA |
| `EstadoTarea` | 'sin_estado' \| 'en_curso' \| 'cumplido' \| 'no_procedente' |
| `UrgenciaTarea` | 'rojo' \| 'ambar' \| 'verde' \| 'gris' |
| `Tarea` | Tarea estructurada de un estado procesal — incluye `fecha_aviso` y `fechaVencimiento` para alertas |
| `EstadoProcesal` | Estado con su lista de tareas y siguiente estado — `grupoCausal?` opcional (`PRE_SENTENCIA_1`/`SENTENCIA_1`/`INSTANCIA_RECURSIVA`/`EJECUCION_SENTENCIA`/`LANZAMIENTO`) usado por el catálogo de causales de finalización |
| `CatalogoItem` | `{ id, label, activo? }` — base para todos los catálogos. `activo` es opcional; `undefined` equivale a activo |
| `CatalogoItemExtended` | CatalogoItem + tipo? + provincia? + localidad? |
| `TipoGestionItem` | CatalogoItem + areas + canal + canales |
| `Usuario` | Usuario con rolBD, roles[], rolSistema, áreas, fifoOrder, lineasPenal + `email?`, `matriculas?` (CABA/PROVINCIA/FEDERAL), `activo?` |
| `Licencia` | Licencia de un usuario (motivo, fechas, reemplazante) — definida en `store/tareas.store.ts` |
| `MotivoLicencia` | 'vacaciones' \| 'medica' \| 'examen' \| 'otro' — definido en `store/tareas.store.ts` |
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

## Campos destacados de Usuario

- `email?: string` — mail del usuario (editable desde UsuariosPanel).
- `matriculas?: Partial<Record<'CABA' | 'PROVINCIA' | 'FEDERAL', string>>` — matrículas por jurisdicción.
- `activo?: boolean` — estado alta/baja; se gestiona con el switch Activo/Inactivo en UsuariosPanel.

## Campos destacados de Expediente

- `es_urgente?: boolean` — marcado manualmente desde el detalle; usado por filtro "Urgentes" en BandejaAbogado
- `es_principal?: boolean` — badge verde "Principal · PJN" en la fila de bandeja; también determina la cabecera del grupo-causa en BandejaAbogado (`exps.find(e => e.es_principal) ?? exps[0]`). **Regla:** nunca puede ser `true` si `numero_causa` es `null`/vacío — un expediente sin causa real jamás es "Principal · PJN", ni siquiera con el `id` propio usado como sentinela de agrupación (`confirmarNuevaQuerella`, `confirmarIniciarJuicio` calculan un `tieneCausaReal` explícito para esto, no hardcodean `true`).
- `es_juicio_iniciado?: boolean` / `fecha_inicio_juicio?` / `fecha_ultimo_impulsorio?` — flujo "Iniciar Juicio" (Civil/Laboral)
- `es_querella_iniciada?: boolean` — marca una Carta SAE (`tipo: 'CARTA_SUCESO'`) cuya Querella ya fue creada; oculta la acción "Nueva Querella" y muestra el badge "Ver Querella →" en el header
- `id_querella_derivada?: string` — id del expediente QUERELLA generado desde esa Carta SAE (destino del badge "Ver Querella →")
- `causal_finalizacion?: string` — causal elegida al finalizar (modal "Finalizar actuación"). Bloqueado/solo-lectura en DatosTab; se autocompleta, nunca se edita a mano.
- `queja_en_tramite?: boolean` — flag del Recurso de Queja como trámite paralelo (desde REF/EJECUCION_SENTENCIA en los 4 ciclos MATRIZ SACO). Toggle con `toggleQuejaEnTramite` del store.

## Campos destacados de EstadoProcesal

- `esArchivado?: boolean` — marca estados terminales no progresivos (DEVUELTO_SECTOR_REQUIRENTE, FINALIZADO). El modal de cambio de estado los excluye del optgroup "Retroceder".
- `grupoCausal?: 'PRE_SENTENCIA_1' | 'SENTENCIA_1' | 'INSTANCIA_RECURSIVA' | 'EJECUCION_SENTENCIA'` — solo en los 4 ciclos MATRIZ SACO (Demanda Civil/Laboral Actora/Demandada). Alimenta `getCausalesPorEstado()` de `causalesFinalizacion.ts`.

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
