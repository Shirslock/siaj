# src/types/ — Tipos de dominio

## Responsabilidad
Todos los contratos de datos del sistema SIAJ.
**Una sola fuente de verdad:** `index.ts`.

## Regla fundamental
Antes de crear una interfaz nueva → buscar si ya existe aquí.
Si existe y le faltan campos → extenderla, no duplicarla.

## Qué hay en index.ts

| Tipo | Descripción |
|------|-------------|
| `Area` | 'CIVIL' \| 'LABORAL' \| 'PENAL' |
| `Canal` | 'EE_GDE' \| 'MEMO_GDE' \| 'OTROS' |
| `RolSistema` | 'REFERENTE' \| 'COORDINADOR' \| 'ABOGADO' \| 'ADMINISTRATIVO' |
| `RolBD` | Roles tal como vienen del Excel (abogado, gerente, etc.) |
| `TipoGestion` | Los 20 tipos de gestión del sistema |
| `TipoActividad` | Tipos de actividades del letrado |
| `EstadoActividad` | PENDIENTE \| EN_CURSO \| COMPLETADA \| VENCIDA |
| `CatalogoItem` | { id, label } — base para todos los catálogos |
| `TipoGestionItem` | CatalogoItem + areas + canal + canales |
| `Usuario` | Datos del usuario con rol y áreas asignadas |
| `Expediente` | Entidad principal del sistema |
| `Actividad` | Actividad del letrado en el timeline |
| `ChecklistItem` | Ítem de checklist dentro de una actividad |
| `SubActividad` | Seguimiento dentro de una actividad |
| `Interviniente` | Parte del expediente (actor, demandado, etc.) |
| `Documento` | Archivo adjunto en el repositorio |
| `VinculoExpediente` | Relación entre expedientes |
| `CampoFormulario` | Definición de un campo dinámico del formulario |
| `FormularioSubtipo` | Campos mesa + abogado por tipo de gestión |
| `ItemQueue` | Entrada en la cola de Mesa SIAJ |
| `FiltrosExpediente` | Estado de filtros de las bandejas |
| `AccesosRol` | Permisos y ruta de inicio por rol |
| `AgendaEvent` | Evento generado desde una actividad con vencimiento |

## Cómo agregar un tipo nuevo

```ts
// Al final de index.ts, antes de los tipos de formulario
export interface MiNuevoTipo {
  id: string
  // ...
}
```

## Lo que NO va aquí
- Tipos locales de un componente → declarar inline o en el mismo archivo
- Tipos de configuración de Vite/Tailwind → en sus archivos respectivos
