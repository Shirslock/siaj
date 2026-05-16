# CLAUDE.md — src/types

> Tipos del dominio. Fuente de verdad de contratos para toda la aplicación.
> Leer antes de agregar o modificar cualquier tipo.

## Tipos principales

| Tipo | Descripción |
|------|-------------|
| `Area` | `'CIVIL' \| 'LABORAL' \| 'PENAL'` |
| `RolBD` | Roles tal como vienen de la base de datos |
| `RolSistema` | Rol derivado usado para permisos en la aplicación |
| `TipoGestion` | Subtipo del expediente (DEMANDA_CIVIL, OFICIO, etc.) |
| `Usuario` | Datos del usuario. Campo `rolBD` = rol primario. Campo `roles: RolBD[]` = todos los roles (multi-rol). `rolSistema` se deriva del `rolBD` primario. |
| `Expediente` | Entidad central del sistema. Ver campos en `index.ts`. |
| `Actividad` | Movimiento o acción registrada en el timeline de un expediente. |
| `CampoFormulario` | Definición de un campo dinámico del formulario de alta. |
| `AccesosRol` | Permisos de navegación y acciones por rol del sistema. |

## Notas

- No agregar campos a `Expediente` sin actualizar `expedientes.mock.ts`
- `RolBD` y `RolSistema` son distintos: `RolBD` es el rol real en BD, `RolSistema` es la categoría funcional usada por la UI
- Para usuarios multi-rol ver `src/data/CLAUDE.md`
