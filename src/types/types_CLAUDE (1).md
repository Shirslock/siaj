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
| `CatalogoItem` | { id, label } — base para todos los catálogos |
| `TipoGestionItem` | CatalogoItem + areas + canal + canales |
| `Usuario` | Usuario con rolBD, roles[], rolSistema, áreas, fifoOrder, lineasPenal |
| `Expediente` | Entidad principal — incluye estadoProcesal |
| `Actividad` | Actividad genérica del letrado en el timeline |
| `ChecklistItem` | Ítem de checklist dentro de una actividad |
| `SubActividad` | Seguimiento dentro de una actividad |
| `Interviniente` | Parte del expediente |
| `Documento` | Archivo adjunto |
| `VinculoExpediente` | Relación entre expedientes |
| `CampoFormulario` | Definición de un campo dinámico |
| `FormularioSubtipo` | Campos mesa + abogado por tipo de gestión |
| `ItemQueue` | Entrada en la cola de Mesa SIAJ |
| `FiltrosExpediente` | Estado de filtros de las bandejas |
| `AccesosRol` | Permisos y ruta de inicio por rol |

## Campos destacados de Expediente

- `es_urgente?: boolean` — marcado manualmente desde el detalle; usado por filtro "Urgentes" en BandejaAbogado
- `es_principal?: boolean` — badge verde "Principal · PJN" en la fila de bandeja

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
