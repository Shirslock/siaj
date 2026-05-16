# CLAUDE.md — src/data

> Catálogos, formularios, usuarios y datos mock.
> Leer antes de modificar cualquier archivo en esta carpeta.

## Archivos

| Archivo | Contenido |
|---------|-----------|
| `catalogos.ts` | TIPOS_GESTION, JUZGADOS, TRIBUNALES, FISCALIAS, UFIS, COMISARIAS, LINEAS_FERROVIARIAS |
| `formularios.ts` | CAMPOS_COMUNES_MESA + campos por subtipo de gestión |
| `usuarios.ts` | 32 usuarios con IDs UR_001–UR_032, roles, asignaciones y helpers |
| `expedientes.mock.ts` | Queue de mesa + expedientes de ejemplo + detalle |

## Usuarios multi-rol

El sistema soporta usuarios con más de un rol.
Actualmente el único caso es:

| ID | Usuario | Roles |
|----|---------|-------|
| UR_032 | BUÑIRIGO, Rosana | adm_mesa + asistente_jurídico |
| UR_030 | ROLDAN, Pedro Adrian | sin rol asignado (pendiente) |

Reglas:
- `rolBD` = rol primario (determina la ruta de inicio)
- `roles[]` = todos los roles (determina los ítems del sidebar)
- El sidebar muestra la UNIÓN de los ítems de nav de todos los roles
- Para verificar si un usuario tiene un rol específico:
  ```ts
  import { tieneRol } from './usuarios'
  tieneRol(usuario, 'adm_mesa')  // → true/false
  ```
- Para verificar si puede reasignar:
  ```ts
  import { puedeReasignar } from './usuarios'
  puedeReasignar(usuario)  // → true solo si rolBD === 'abogado_coordinador'
  ```
