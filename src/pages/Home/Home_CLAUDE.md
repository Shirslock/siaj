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

Diseño en 3 zonas (rediseño sobre maqueta del cliente — `docs/principal.jpeg`):

1. **Fila de 4 KPIs** a lo ancho (`grid grid-cols-2 xl:grid-cols-4 gap-4`): Causas activas,
   Actuaciones activas, Nuevas asignadas, Urgentes.
2. **Izquierda del cuerpo**: `<WidgetVencimientos>` — el protagonista de la pantalla, con tabs,
   buscador y agrupación Vencidas/Próximas.
3. **Derecha del cuerpo** (`340px` fijo): `<WidgetCard>` "Por rol" + `<WidgetCard>` "Por tipo de
   gestión" (ambos con `<BarrasDistribucion>`) y abajo `<WidgetCerradas>`.

El cuerpo es `grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]` — en pantallas menores a `xl`
las dos columnas se apilan. Todo el cálculo vive en `homeShared.tsx` (`useHomeData()`); la página
solo arma el JSX y define los destinos de navegación.

**No hay** gráfico de sub-estado: el donut `WidgetPorSubEstado` del diseño anterior se eliminó
(no está en la maqueta). El deep-link `?estado=<code>` sigue existiendo en la Bandeja, pero desde
esta pantalla solo se usa `?estado=ASIGNADO` (KPI "Nuevas asignadas").

---

## Fila de KPIs (`<KpiCard>`)

| KPI | Definición | Destino del click |
|-----|-----------|-------------------|
| **Causas activas** | `numero_causa` **distintos** entre `misActivos`, excluyendo `null`/vacío/`'SS'` — no cuenta actuaciones sueltas (mismo criterio de agrupación que `construirItems` en `BandejaAbogado.page.tsx`). Por eso es ≤ "Actuaciones activas". | `/actuaciones` |
| **Actuaciones activas** | `misActivos.length`. | `/actuaciones` |
| **Nuevas asignadas** | `misActivos.filter(e => e.estado === 'ASIGNADO').length`. | `?estado=ASIGNADO` |
| **Urgentes** | `misActivos.filter(e => e.es_urgente).length`. | `?urgente=1` |

Tonos de la cajita del ícono: `TONOS_KPI` (`azul` / `teal` / `rojo`) — clases **literales**, no
armadas dinámicamente (Tailwind v4 no resuelve `text-[${var}]`). Los colores de las barras sí van
por `style` inline porque dependen de los datos.

---

## `<WidgetVencimientos>` — el bloque principal

- `construirVencimientos()` recorre `misActivos` con `getAlertaExpediente`/`getAlertaTimer`
  (`utils/alertas.ts`) y arma un `ItemVencimiento[]` ordenado **vencido primero** y, dentro de
  cada grupo, el más antiguo primero.
- **Tabs** (estado local, `TABS_VENC`): `Todas` | `Vencidas` | `Por vencer` — filtran qué grupos
  se muestran, no re-consultan nada.
- **Buscador** (estado local): filtra por carátula, `exp.id` y nombre de la tarea/plazo. Los
  contadores de cada grupo reflejan la búsqueda activa.
- **Grupos**: `<GrupoVencimientos>` "Vencidas (N)" (tono rojo, ícono `error`) y "Próximas (N)"
  (tono ámbar, ícono `schedule`). Un grupo vacío no se renderiza.
- **Filas** (`<FilaVencimiento>`): carátula + `id · tarea` a la izquierda, fecha con ícono
  `calendar` al medio, badge `VENCIDO`/`POR VENCER` a la derecha. Cada fila navega a
  `RUTAS.EXPEDIENTE(id)` — es el único punto de la pantalla que va al detalle de una actuación
  y no a la Bandeja.
- Link al pie: "Ver todas las actuaciones con alerta →" → `?alerta=1` (ese filtro **no**
  distingue vencido de por-vencer, muestra ambos).

A diferencia del diseño anterior, la lista **no** está truncada a 8 ítems: se muestran todos los
que haya, y el filtrado queda en manos de los tabs y el buscador.

---

## `<BarrasDistribucion>` — reemplaza a los donuts

Barras horizontales en HTML/CSS puro (sin `recharts`, que quedó solo en el Dashboard). Recibe
`FilaBarra[]` (`{ label, valor, color, onClick? }`) y dibuja el largo **proporcional al mayor
valor de la serie** (`valor / max`), con un mínimo del 6% para que un valor chico se vea, y un
punto de 5px cuando el valor es 0.

| Card | Filas | Destino del click |
|------|-------|-------------------|
| **Por rol** ("Distribución de causas activas.") | Actora, Demandada, Sin intervención (por `campos_mesa['mesa_tipo_intervencion']`; vacío cuenta como Sin Intervención) y Penal (por `e.area === 'PENAL'`). Orden fijo, incluye los ceros. | `?parte=Actora` / `?parte=Demandada` / `?parte=Sin%20Intervenci%C3%B3n` / `?area=PENAL` |
| **Por tipo de gestión** ("Distribución de actuaciones activas.") | Una fila por cada `tipo` presente en `misActivos` (no todo el catálogo), ordenadas por cantidad desc. Usa `TIPO_LABEL` (exportado desde `BandejaAbogado.page.tsx`, no duplicado). | `?tipo=<code>` |

**`<WidgetCerradas>`**: bloque aparte al pie de la columna derecha —
`misExpedientes` **completo** (no `misActivos`) filtrado por `ESTADOS_CERRADO`. → `?tab=archivados`.

**Nota sobre `actora/demandada`:** el campo correcto es `campos_mesa['mesa_tipo_intervencion']`
(`CAMPOS_COMUNES_MESA` en `formularios.ts`, aplica a todos los expedientes), **no** `exp.tipo` —
no existe ni hace falta un `TipoGestion` con sufijo `_ACTORA` (los `DEMANDA_CIVIL_ACTORA`/
`DEMANDA_LABORAL_ACTORA` de `estadosProcesales.ts`/`iniciarJuicio.ts` son claves internas del
mapa de estados procesales, no valores reales de `exp.tipo`). Valores según área (`DatosTab.tsx`):
Civil/Laboral → `Actora | Demandada | Sin Intervención`; Penal → `Denunciante | Actuación de
Oficio | Sin Intervención`.

---

## `useHomeData()` — todo el cálculo en un solo hook

Devuelve `usuarioActivo`, `navigate`, `misExpedientes`, `misActivos`, `vencimientos`,
`causasActivasCount`, `asignadoCount`, `intervencion` (`{ actora, demandada, sinIntervencion,
penal }`), `porVencerCount`, `urgentesCount`, `tiposActivos` (`{ code, count, label }[]`,
ordenado por `count` desc) y `cerradasCount`.

`porVencerCount` hoy no lo consume la página (el diseño nuevo muestra ese dato como el contador
del grupo "Próximas (N)"), pero se sigue exportando por ser barato y útil.

---

## Reglas / notas

- **Vacío = "Sin Intervención" en los dos lados.** `useHomeData` cuenta como Sin Intervención
  tanto el valor literal como el campo vacío/ausente; el filtro `parte` de
  `BandejaAbogado.page.tsx` hace la misma normalización
  (`String(...) || 'Sin Intervención'`). Si se cambia un lado hay que cambiar el otro, o el
  contador de la Principal y el resultado del deep-link se contradicen (pasaba con
  `C-0043/2026`, que no tiene `mesa_tipo_intervencion` cargado: el contador decía 2 y la Bandeja
  mostraba 1).
- Para probar la pantalla hay que cambiar el usuario activo a un ABOGADO con volumen de datos —
  CASANO (`UR_004`) tiene carga de prueba específica en `expedientes.mock.ts` (15 actuaciones
  activas: 4 vencidas, 3 por vencer, 4 en ASIGNADO, mezcla de Actora/Demandada/Sin Intervención,
  3 urgentes y varios sub-estados). El usuario activo por defecto es LOPEZ (`UR_018`, REFERENTE),
  que redirige a `/dashboard` — si se entra a `/home` sin cambiar de usuario **no** se ve esta
  pantalla, y eso es lo esperado.
- `BandejaAbogado.page.tsx` hidrata `filtroInicial`/`tabEstado` desde estos mismos query params
  (`estado`, `fechaDesde`, `alerta`, `parte`, `area`, `tipo`, `urgente`, `tab`) — son deep-links
  invisibles en la tabla, no agregan UI de filtro nueva ahí.
- La maqueta de referencia del rediseño está en `docs/principal.jpeg`.
