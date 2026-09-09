# src/pages/Home/ — Principal (Home de ABOGADO, Etapa 1)

`Home.page.tsx` es la página de inicio **exclusiva de `rolSistema === 'ABOGADO'`** (mostrada como
"Principal" en Sidebar/Topbar; ruta y archivo siguen llamándose `/home`/`Home.page.tsx`, solo
cambió el texto de cara al usuario). Ningún otro rol pasa por acá — REFERENTE/COORDINADOR siguen
yendo a `/dashboard` (`<PanelGerencia>`, ver `Dashboard_CLAUDE.md`), y `"/"` resuelve el destino
por rol en `App.tsx` (`<RaizPorRol>`).

Es **Etapa 1**: no toca Agenda, Solicitudes (`/tareas`), Novedades PJN ni el Asistente IA. Todos
los widgets son de solo lectura y navegan a `/actuaciones` (`BandejaAbogado.page.tsx`) con query
params — no hay listas nuevas ni edición desde acá.

---

## Layout

Columna izquierda angosta (`w-56`) de tags/contadores clickeables + columna derecha (`flex-1`)
con el detalle:

- **Izquierda**: tags apiladas (`space-y-2.5`), con los grupos de a 2 por fila (`grid
  grid-cols-2 gap-2`) acomodados según el orden de abajo. `<SeparadorTags>` (línea horizontal)
  entre grupos.
- **Derecha**: `<WidgetVencimientos>` arriba (ancho completo), y abajo los 2 donuts en fila
  (`grid grid-cols-2 gap-6`): `<WidgetPorSubEstado>` y `<WidgetTipoIntervencion>`.

Todo el cálculo vive en `homeShared.tsx` (`useHomeData()`) — la página solo arma el JSX.

---

## Tags de la columna izquierda (orden real)

| Tag | Definición | Destino del click (`/actuaciones?...`) |
|-----|-----------|------------------------------------------|
| **Tareas por vencer** | `vencimientos.filter(i => i.estado === 'por_vencer').length` — solo por-vencer, **no** incluye vencidas (el detalle vencido/por-vencer ya está en `<WidgetVencimientos>`). Primer tag de toda la columna, con separador propio debajo. | `?alerta=1` |
| Total de Causas Activas | `numero_causa` **distintos** entre `misActivos`, excluyendo `null`/vacío/`'SS'` — no cuenta actuaciones sueltas (mismo criterio de agrupación que `construirItems` en `BandejaAbogado.page.tsx`). | `/actuaciones` (sin filtro adicional) |
| Total de actuaciones activas | `misActivos.length`. | `/actuaciones` |
| Nuevas actuaciones (Asignado) | `misActivos.filter(e => e.estado === 'ASIGNADO').length`. | `?estado=ASIGNADO` |
| Actora / Demandada / Sin Intervención / Penal | 4 tags por `campos_mesa['mesa_tipo_intervencion']` (Actora/Demandada/Sin Intervención — vacío cuenta como Sin Intervención) + Penal por `e.area === 'PENAL'` (sin desglosar Denunciante/Oficio acá, eso está en `<WidgetTipoIntervencion>`). De a 2 por fila. | `?parte=Actora` / `?parte=Demandada` / `?parte=Sin%20Intervenci%C3%B3n` / `?area=PENAL` |
| Urgentes | `misActivos.filter(e => e.es_urgente).length`. | `?urgente=1` |
| Por tipo de gestión (grupo) | Una tag por cada `tipo` (`TipoGestion`) presente en `misActivos` — no todo el catálogo, solo lo que el letrado tiene. Usa `TIPO_LABEL` (exportado desde `BandejaAbogado.page.tsx`, no duplicado). De a 2 por fila, con mini-header propio. | `?tipo=<code>` |
| Actuaciones cerradas | Sobre `misExpedientes` **completo** (no `misActivos`): `filter(e => ESTADOS_CERRADO.includes(e.estado)).length`. | `?tab=archivados` |

**Nota sobre `actora/demandada`:** el campo correcto es `campos_mesa['mesa_tipo_intervencion']`
(`CAMPOS_COMUNES_MESA` en `formularios.ts`, aplica a todos los expedientes), **no** `exp.tipo` —
no existe ni hace falta un `TipoGestion` con sufijo `_ACTORA` (los `DEMANDA_CIVIL_ACTORA`/
`DEMANDA_LABORAL_ACTORA` de `estadosProcesales.ts`/`iniciarJuicio.ts` son claves internas del
mapa de estados procesales, no valores reales de `exp.tipo`). Valores según área (`DatosTab.tsx`):
Civil/Laboral → `Actora | Demandada | Sin Intervención`; Penal → `Denunciante | Actuación de
Oficio | Sin Intervención`.

---

## Columna derecha — widgets compartidos (`homeShared.tsx`)

- **`WidgetVencimientos`** — fusiona vencimientos y tareas en una sola lista (antes eran
  conceptos separados en `PanelLetrado`). `construirVencimientos()` recorre `misActivos` con
  `getAlertaExpediente`/`getAlertaTimer` (`utils/alertas.ts`) y arma un `ItemVencimiento[]`
  ordenado **vencido primero**, y dentro de cada grupo el más antiguo primero. Muestra hasta 8
  ítems; cada uno navega a `RUTAS.EXPEDIENTE(id)`. Link "Ver todas..." → `?alerta=1`.
- **`WidgetPorSubEstado`** — donut de `misActivos` agrupados por `estadoProcesal ?? estado`; click
  en sector/leyenda → `?estado=<code>`.
- **`WidgetTipoIntervencion`** — donut de `misActivos` agrupados genéricamente por
  `mesa_tipo_intervencion` (agrupa por el valor tal cual aparece, cubre Civil/Laboral y Penal sin
  branchear por área); click → `?parte=<valor>`.

## `useHomeData()` — todo el cálculo en un solo hook

Devuelve `usuarioActivo`, `navigate`, `misExpedientes`, `misActivos`, `vencimientos`,
`causasActivasCount`, `asignadoCount`, `intervencion` (`{ actora, demandada, sinIntervencion,
penal }`), `porVencerCount`, `urgentesCount`, `tiposActivos` (`{ code, count, label }[]`,
ordenado por `count` desc) y `cerradasCount`. `ESTADOS_CERRADO` y `COLORES_DONUT` también se
exportan desde `homeShared.tsx` si algún widget nuevo los necesita.

---

## Reglas / notas

- Para probar el Home hay que cambiar el usuario activo a un ABOGADO con volumen de datos —
  CASANO (`UR_004`) tiene carga de prueba específica en `expedientes.mock.ts` (15 actuaciones
  activas: nuevas, vencidas, por vencer, mezcla de Actora/Demandada/Sin Intervención, urgentes y
  varios sub-estados).
- `BandejaAbogado.page.tsx` hidrata `filtroInicial`/`tabEstado` desde estos mismos query params
  (`estado`, `fechaDesde`, `alerta`, `parte`, `area`, `tipo`, `urgente`, `tab`) — son deep-links
  invisibles en la tabla, no agregan UI de filtro nueva ahí.
- Layout consolidado tras un experimento de comparación de 3 variantes (`/home`, `/home2`,
  `/home3`) — el equipo eligió este; `/home2`/`/home3` fueron borrados, no quedó código muerto.
