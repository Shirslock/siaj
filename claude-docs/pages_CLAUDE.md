# src/pages/ — Páginas de la aplicación

## Estructura de cada página

```
src/pages/NombrePagina/
  NombrePagina.page.tsx    ← componente principal
  useNombrePagina.ts       ← hook con lógica compleja (si aplica)
  tabs/                    ← si la página tiene tabs
    DatosTab.tsx
    TimelineTab.tsx
    ...
```

---

## Páginas implementadas

| Carpeta | Ruta | Roles | Estado |
|---------|------|-------|--------|
| `Dashboard/` | /dashboard | REFERENTE, COORDINADOR, ABOGADO | ✓ 3 vistas por rol (Power BI) — ver `Dashboard/Dashboard_CLAUDE.md` |
| `MesaSaco/` | /mesa | ADMINISTRATIVO | ✓ filtros embebidos |
| `AltaExpediente/` | /mesa/alta | ADMINISTRATIVO | ✓ modal confirmación |
| `Actuaciones/` | /actuaciones | ABOGADO, COORDINADOR, REFERENTE | ✓ router por rol |
| `BandejaAbogado/` | /bandeja/abogado (alias→/actuaciones) | ABOGADO, COORDINADOR, REFERENTE | ✓ filtros Urgentes + Por vencer, sincronizada con el buscador global del Topbar (`?q=`) |
| `BandejaArea/` | /bandeja/area (alias→/actuaciones) | COORDINADOR, REFERENTE | ✓ filtros embebidos |
| `DetalleExpediente/` | /expediente/:id | ABOGADO, COORDINADOR, REFERENTE | ✓ 6 tabs |
| `CausaDetalle/` | /causa/* | ABOGADO, COORDINADOR, REFERENTE | ✓ 4 tabs |
| `Configuracion/` | /configuracion | REFERENTE únicamente | ✓ panel admin con 28 tablas |
| `Actividades/` | /expediente/:id/actividades | ABOGADO, COORDINADOR, REFERENTE | carpeta vacía |
| `Agenda/` | /agenda | ABOGADO, COORDINADOR, REFERENTE | ✓ calendario mensual/semanal/día, filtros por rol, audiencias mock, eventos custom |

---

## Tabs de DetalleExpediente

| Tab | Archivo | Estado |
|-----|---------|--------|
| Datos | DatosTab.tsx | ✓ edición completa |
| Timeline | TimelineTab.tsx | ✓ tareas + actividades + feed colapsable |
| Intervinientes | IntervinientesTab.tsx | ✓ CRUD completo — agregar, editar (modal reutilizable), eliminar; columna Letrado |
| Documentos | DocumentosTab.tsx | ✓ carga + drag-and-drop con @dnd-kit para reordenar |
| Previsión | PrevisionTab.tsx | ✓ mock SIGEJ |
| Vinculados | VinculosTab.tsx | ✓ modal vincular |

---

## Configuracion/ — Panel de Administrador

Solo accesible para `rolSistema === 'REFERENTE'`. Redirect a `/actuaciones` para otros roles.

Archivos:
- `Configuracion.page.tsx` — layout dos columnas (sidebar grupos + contenido)
- `tablas.config.ts` — definición de 5 grupos y 28 tablas
- `CatalogoPanel.tsx` — CRUD genérico (tipos: simple / extended / tipoGestion)
- `UsuariosPanel.tsx` — tabla de usuarios con modal edición (FIFO + líneas ferroviarias)

Grupos del sidebar:
1. Configuración Base (4 tablas — 3 solo lectura)
2. Gestión Jurídica (9 tablas)
3. Organismos Judiciales (5 tablas)
4. Catálogo de Hechos y Sanciones (6 tablas)
5. Personal e Intervinientes (3 tablas)

---

## DetalleExpediente — Cambio de estado (Civil/Laboral)

Modal "Cambiar estado" con lógica de flujo procesal:

- **Desde ASIGNADO**: muestra solo el nombre del próximo estado (sin select). Siempre habilitado.
- **Desde cualquier otro estado**: select con `<optgroup label="Avanzar">` (solo el estado inmediato siguiente) y `<optgroup label="Retroceder">` (todos los anteriores).
- **Avance bloqueado** si `tareasEstadoActual.length > 0 && some(t => t.estado === 'en_curso')` → aviso rojo + options disabled + botón Confirmar disabled.
- **Retroceso siempre habilitado** → aviso amarillo informativo.
- `tieneTareasPendientes` se calcula una sola vez antes del JSX, no inline.

## Agenda/ — Lógica de negocio

Archivo principal: `Agenda.page.tsx`. Hook de datos: `useAgendaEvents.ts`.
Mock de audiencias: `src/data/audiencias.mock.ts`.

Vistas: `'mes' | 'semana' | 'dia'`.

**Filtros por rol:**
- `REFERENTE`: ve todo (todos los abogados y áreas)
- `COORDINADOR`: ve su área
- `ABOGADO`: ve solo sus propios eventos

Tipos de eventos en el feed: `'AUDIENCIA' | 'TAREA' | 'ACTIVIDAD' | 'SISTEMA'` (campo `tipo` de `AgendaEvent`).
Eventos custom del usuario: via `useAgendaStore()` (`agregarEvento`, `eliminarEvento`).

---

## TimelineTab — Arquitectura del feed

El feed colapsable usa `gruposFeed` (useMemo sobre `sorted`):

```ts
gruposFeed = {
  grupos: Array<{ sistema: Actividad | null, tareasHist: Tarea[], actividades: Actividad[] }>,
  entradaRecepcion: Actividad | null,
}
```

- La entrada `RECEPCION` se extrae del sorted y se renderiza **siempre fija al final** del feed, fuera de los bloques colapsables.
- Cada grupo `sistema` agrupa las actividades entre ese cambio de estado y el siguiente, **por posición en sorted** (no por fecha) — evita bugs con actividades de misma fecha.
- El período actual (`{ sistema: null }`) contiene actividades más recientes que el último cambio de estado.
- `getTareasHistoricas` reconoce tanto "Cambio de estado:" como "Retroceso de estado:" (regex `(?:Cambio|Retroceso)`). Si el estado anterior es ASIGNADO, retorna `[]`.

Orden de renderizado en tab "Todo":
1. **TareasBlock** del estado actual (arriba)
2. **Feed colapsable** por estado (abajo)
3. **Entrada RECEPCION** fija al final

### Edición / eliminación de actividades (con log de auditoría)

- Solo visible si `esLetrado` (usuario activo === `exp.abogado_id`) y la actividad no es
  `RECEPCION` ni un movimiento de sistema (`esMovimientoSistema(a)`: `tipo === 'MOVIMIENTO'` +
  `estadoExpediente` + título "Cambio de estado…"/"Retroceso de estado…"). **No filtrar por
  `tipo !== 'MOVIMIENTO'` a secas** — el modal "Nueva actividad" usa `MOVIMIENTO` como tipo por
  defecto (`BLANK_ACT.tipo`), así que esa condición ocultaba el menú de cualquier actividad
  genérica creada sin cambiar el tipo.
- El menú ⋮ **no** es un dropdown CSS `group-hover` posicionado `absolute` — el contenedor del
  feed tiene `overflow-hidden` (`rounded-2xl overflow-hidden`) y lo recorta. Es un menú controlado
  por estado (`menuActividad`), con `position: fixed` calculado desde
  `e.currentTarget.getBoundingClientRect()` en el click, renderizado una sola vez fuera del
  contenedor recortado (junto a los modales) y cerrado con un listener de `click` en `document`
  (mismo patrón que `menuExport`).
- `editarActividad`/`eliminarActividad` (store) actualizan `Actividad.log` — se muestra con
  `<LogAuditoriaList log={a.log ?? []}>` (mismo archivo) debajo de `<ReplyList>`.
- La eliminación es soft-delete (`Actividad.eliminado`, no `activo` — ver nota en `types_CLAUDE.md`);
  el feed (`sorted`) filtra con `!a.eliminado`.

## Modal "Nueva Actividad" — tabs

**Civil/Laboral (TimelineTab):** 2 tabs — `'generica'` y `'solicitud'`
**Penal (TimelinePenal):** 3 tabs — `'procesales'`, `'genericas'` y `'solicitud'`

El tab **Nueva Solicitud** usa el componente compartido `<SolicitudForm>` (`src/components/SolicitudForm.tsx`).
- El `expediente_id` se toma automáticamente del expediente abierto — no hay campo para elegirlo.
- Las solicitudes se guardan en `useTareasStore()` via `agregarTarea()`.
- Selector de asignación en dos pasos: primero el grupo (Civil/Laboral/Penal/RRHH/Comercial/Seguros), luego la persona.
- Grupos internos (Civil/Laboral/Penal) muestran abogados y coordinadores de `USUARIOS`.
- Grupos externos (RRHH/Comercial/Seguros) muestran personas de `PERSONAS_POR_AREA` del store.

```ts
import { SolicitudForm, BLANK_SOLICITUD } from '../../../components/SolicitudForm'
// GrupoAsig: 'CIVIL' | 'LABORAL' | 'PENAL' | 'RRHH' | 'COMERCIAL' | 'SEGUROS' | ''
```

---

## Sistema de Replies (comentarios anidados)

- Botón "Comentar" visible **solo para el letrado asignado** (`usuarioActivo.id === exp.abogado_id`)
- Al hacer click → modal con: texto (obligatorio), fecha, doc GDE opcional, fecha vencimiento y fecha aviso opcionales
- Los replies se almacenan en `act.replies?: Reply[]` vía `agregarReply(expId, actividadIdx, replyData)` en el store
- `actividadIdx` es la posición en `exp.timeline` (usar `exp.timeline.indexOf(act)`)
- Se renderizan con `<ReplyList>` debajo de cada actividad, con línea azul lateral (`border-l-2 border-[#C4DFE8]`)
- Aplica tanto en el período actual como en los bloques colapsables de períodos anteriores
- Exportación: `actividadesToFilas()` emite filas de tipo `'Comentario'` con título `-> NOMBRE_AUTOR` por cada reply

---

## Filtros embebidos — patrón estándar

Todas las tablas con filtros usan thead de 2 filas:

```tsx
<thead>
  {/* Fila 1: labels */}
  <tr className="border-b border-[rgba(0,0,0,0.08)] bg-[#f9f9f9]">
    <th className="px-3 py-2.5 text-left text-[10px] font-black
      uppercase tracking-widest text-[#4a6a84]">
      Columna
    </th>
  </tr>
  {/* Fila 2: inputs */}
  <tr className="border-b-2 border-[rgba(0,0,0,0.10)] bg-[#f5f5f5]">
    <th className="px-2 py-1.5">
      <input className="w-full px-2 py-1.5 text-xs border
        border-[rgba(0,0,0,0.15)] rounded-md bg-white
        text-[#1b3a57] placeholder-[#a0b0bc]
        focus:outline-none focus:border-[#1b3a57]"
        placeholder="..." />
    </th>
  </tr>
</thead>
```

---

## Reglas

1. El componente de página lee del store — no recibe props de datos
2. Navegación: `useNavigate()` + constantes `RUTAS` de `utils/routing.ts`
3. Lógica compleja → extraer a hook local en la misma carpeta
4. Tabs de DetalleExpediente reciben `exp: Expediente` como prop
5. Toda página muestra spinner/mensaje si los datos son null

## Patrón mínimo

```tsx
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { useNavigate } from 'react-router-dom'
import { RUTAS } from '../../utils/routing'
import { toast } from 'react-toastify'

export default function MiPaginaPage() {
  const navigate = useNavigate()
  const { usuarioActivo } = useUIStore()
  const { expedientes } = useExpedientesStore()

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* contenido */}
    </div>
  )
}
```
