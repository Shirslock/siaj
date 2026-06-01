# src/utils/ — Utilidades

Funciones puras sin efectos secundarios ni dependencias del store.

## format.ts

```ts
import { formatFecha, formatMonto, numerador, formatNombreUsuario }
  from '../utils/format'
```

| Función | Entrada | Salida | Ejemplo |
|---------|---------|--------|---------|
| `formatFecha(fecha)` | ISO o DD/MM/YYYY | DD/MM/YYYY | `'2026-01-15'` → `'15/01/2026'` |
| `formatMonto(valor)` | number \| string | `$ X,XX` (es-AR) | `1500` → `'$ 1.500,00'` |
| `numerador(area, n, anio?)` | area + número | ID de expediente | `('CIVIL', 23)` → `'C-0023/2026'` |
| `formatNombreUsuario(ap, nom)` | apellido, nombre | `'APELLIDO, Nombre'` | — |

`formatFecha` tolera fechas ya en formato DD/MM/YYYY (las devuelve sin cambio).

## routing.ts

Constantes de rutas y helpers de navegación. Importar siempre desde aquí,
nunca escribir strings de ruta hardcodeados en componentes.

```ts
import { RUTAS } from '../utils/routing'

navigate(RUTAS.DASHBOARD)
navigate(RUTAS.EXPEDIENTE('C-0023/2026'))
navigate(RUTAS.CAUSA('12345/2026'))
```

| Constante | Valor |
|-----------|-------|
| `RUTAS.DASHBOARD` | `/dashboard` |
| `RUTAS.MESA` | `/mesa` |
| `RUTAS.MESA_ALTA` | `/mesa/alta` |
| `RUTAS.BANDEJA_ABOGADO` | `/bandeja/abogado` |
| `RUTAS.BANDEJA_AREA` | `/bandeja/area` |
| `RUTAS.EXPEDIENTE(id)` | `/expediente/:id` |
| `RUTAS.ACTIVIDADES(id)` | `/expediente/:id/actividades` |
| `RUTAS.CAUSA(numeroCausa)` | `/causa/:numeroCausa` |
| `RUTAS.AGENDA` | `/agenda` |

## exportTimeline.ts

Genera un PDF del historial del expediente usando jsPDF.
Usado en el botón "Exportar PDF" del TimelineTab.

```ts
import { exportTimeline } from '../utils/exportTimeline'
exportTimeline(exp, registrosPenales)
```

No tiene dependencias del store — recibe los datos como parámetros.
El encabezado del PDF incluye "SIAJ — Sistema Inteligente de Asuntos Jurídicos".
