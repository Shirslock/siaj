# src/pages/Home/ — Principal (Etapa 1 + alcance por rol)

`Home.page.tsx` es la página "Principal" (ruta y archivo siguen llamándose `/home`/`Home.page.tsx`,
solo cambió el texto de cara al usuario). Es el landing de `ABOGADO`; COORDINADOR y REFERENTE
(Gerente) **también** pueden entrar (tienen `'home'` en `ROL_ACCESOS[...].nav`, ver
`data/usuarios.ts`), pero su landing sigue siendo `/dashboard` — Principal **no reemplaza** el
Dashboard, conviven como dos ítems del Sidebar. `"/"` resuelve el destino por rol en `App.tsx`
(`<RaizPorRol>`), sin cambios.

**Alcance (`scope: 'MIAS' | 'AREA' | 'TODO'`, ver `homeShared.tsx`):** todos los cálculos de
`useHomeData(scope)` cuelgan de un único set base que varía según el scope, en vez de estar
hardcodeados a `abogado_id === usuarioActivo.id`:
- `ABOGADO` → sin toggle, scope fijo `'MIAS'` (comportamiento original, cero cambios).
- `COORDINADOR` → toggle "Mías" / "Mi área", default `'AREA'`.
- `REFERENTE` (Gerente) → toggle "Mías" / "Todo", default `'TODO'`.

El toggle vive en `Home.page.tsx` (mismo patrón visual que los tabs de `<WidgetVencimientos>`) y
solo se renderiza para COORDINADOR/REFERENTE. Cada deep-link a la Bandeja agrega, además de su
filtro propio, el filtro de alcance (`?letrado=` para MIAS, `?area=` para AREA — vacío si el
coordinador tiene más de un área, con el pool ya acotado a sus áreas del lado de la Bandeja — nada
para TODO). Ver `BandejaAbogado.page.tsx` (`filtroInicial`) para cómo se hidrata.

Es **Etapa 1**: no toca Agenda, Solicitudes (`/tareas`), Novedades PJN ni el Asistente IA. Todos
los widgets son de solo lectura y navegan a `/actuaciones` (`BandejaAbogado.page.tsx`) con query
params — no hay listas nuevas ni edición desde acá.

---

## Layout

Diseño en 3 zonas (rediseño sobre maqueta del cliente — `docs/principal.jpeg`):

1. **Fila de 5 KPIs** a lo ancho (`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4`):
   Causas judiciales activas, Documentos activos, Nuevas asignadas, Actuaciones parte actora,
   Urgentes.
2. **Izquierda del cuerpo**: `<WidgetVencimientos>` — el protagonista de la pantalla, con tabs
   y agrupación Vencidas/Próximas.
3. **Derecha del cuerpo** (`340px` fijo): `<WidgetAudiencias>` arriba (lo más accionable),
   después `<WidgetCard>` "Por rol" + `<WidgetCard>` "Por estado procesal" (ambos con
   `<BarrasDistribucion>`) y abajo `<WidgetCerradas>`.

El cuerpo es `grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]` — en pantallas menores a `xl`
las dos columnas se apilan. Todo el cálculo vive en `homeShared.tsx` (`useHomeData()`); la página
solo arma el JSX y define los destinos de navegación.

**No hay** KPI de total de actuaciones: el total ya está en el saludo del encabezado
("Gestionando N actuaciones activas"), y `causasActivasCount + documentosActivosCount` da
exactamente `misActivos.length`.

---

## Fila de KPIs (`<KpiCard>`)

| KPI | Definición | Destino del click |
|-----|-----------|-------------------|
| **Causas judiciales activas** | `misActivos` cuyo `tipo` **no** está en `TIPOS_DOCUMENTALES`. | `?clase=causa` |
| **Documentos activos** | `misActivos` cuyo `tipo` **sí** está en `TIPOS_DOCUMENTALES`. | `?clase=documento` |
| **Nuevas asignadas** | `misActivos.filter(e => e.estado === 'ASIGNADO').length`. | `?estado=ASIGNADO` |
| **Actuaciones parte actora** | `intervencion.actora` — `misActivos` con `campos_mesa['mesa_tipo_intervencion'] === 'Actora'`. Es el mismo número que la barra "Actora" de "Por rol" (incluye causas y documentos). | `?parte=Actora` |
| **Urgentes** | `misActivos.filter(e => e.es_urgente).length`. | `?urgente=1` |

Formato de tarjeta **vertical y casi cuadrado** (a pedido del cliente): ícono arriba (caja de
56px), número grande (`38px`) y label debajo, con `min-h-[172px]`. El label **no** se trunca
(`leading-snug`, puede ocupar dos líneas): con 5 columnas y labels largos como "Causas
judiciales activas" un `truncate` los cortaba.

### Causa vs. documento — la clasificación es por TIPO, no por n° de causa

`TIPOS_DOCUMENTALES` / `esTipoDocumental()` viven en `src/data/catalogos.ts`, al lado de
`TIPOS_GESTION`: **Oficios, Carta Documento, Pedido de Causa Penal, Carta Suceso (SAE) y Otras
presentaciones** son documentos; el resto (Demandas, Lanzamientos, Querellas, Defensas,
Mediaciones, SECLO, Cobro de cánones, Recuperos, Ejecución de pólizas…) son causas.

Se descartó clasificar por "tiene o no `numero_causa`": un **oficio judicial normalmente
referencia el n° de causa ajeno** (el formulario de `OFICIO` tiene el campo `mesa_num_causa`), así
que el letrado que solo lleva oficios habría seguido viendo "Documentos 0". El pedido del cliente
fue justamente ese: hay letrados que llevan solo documentos y con un único total su pantalla
quedaba vacía o distorsionada.

Si se agrega un `TipoGestion` nuevo al catálogo, hay que decidir de qué lado cae — si no se toca
`TIPOS_DOCUMENTALES`, cuenta como causa por defecto.

Tonos: `TONOS_KPI` (`azul` / `teal` / `rojo` cambian solo la cajita del ícono sobre tarjeta
blanca; `destacado` pinta la tarjeta entera con degradé navy y texto blanco — lo usa
**Actuaciones parte actora**, a pedido del cliente, para que se distinga del resto) — clases **literales**, no
armadas dinámicamente (Tailwind v4 no resuelve `text-[${var}]`). Los colores de las barras sí van
por `style` inline porque dependen de los datos.

---

## `<WidgetVencimientos>` — el bloque principal

- `construirVencimientos()` recorre `misActivos` con `getAlertaExpediente`/`getAlertaTimer`
  (`utils/alertas.ts`) y arma un `ItemVencimiento[]` ordenado **vencido primero** y, dentro de
  cada grupo, el más antiguo primero.
- **Tabs** (estado local, `TABS_VENC`): `Todas` | `Vencidas` | `Por vencer` — filtran qué grupos
  se muestran, no re-consultan nada. El mensaje de vacío (`mensajeVacio`) cambia según el tab
  activo. La maqueta original traía además un buscador acá; se sacó por redundante con la
  búsqueda global del Topbar y con los propios tabs.
- **Grupos**: `<GrupoVencimientos>` "Vencidas (N)" (tono rojo, ícono `error`) y "Próximas (N)"
  (tono ámbar, ícono `schedule`). Un grupo vacío no se renderiza.
- **Filas** (`<FilaVencimiento>`): carátula + `id · tarea` a la izquierda, fecha con ícono
  `calendar` al medio, badge `VENCIDO`/`POR VENCER` a la derecha. Cada fila navega a
  `RUTAS.EXPEDIENTE(id)` — es el único punto de la pantalla que va al detalle de una actuación
  y no a la Bandeja.
- Link al pie: "Ver todas las actuaciones con alerta →" → `?alerta=1` (ese filtro **no**
  distingue vencido de por-vencer, muestra ambos).

A diferencia del diseño anterior, la lista **no** está truncada a 8 ítems: se muestran todos los
que haya, y el filtrado queda en manos de los tabs.

---

## `<BarrasDistribucion>` — reemplaza a los donuts

Barras horizontales en HTML/CSS puro (sin `recharts`, que quedó solo en el Dashboard). Recibe
`FilaBarra[]` (`{ label, valor, color, onClick? }`) y dibuja el largo **proporcional al mayor
valor de la serie** (`valor / max`), con un mínimo del 6% para que un valor chico se vea, y un
punto de 5px cuando el valor es 0.

| Card | Filas | Destino del click |
|------|-------|-------------------|
| **Por rol** ("Distribución de causas activas.") | Actora, Demandada, Denunciante y Sin intervención — las **cuatro** salen del mismo campo `campos_mesa['mesa_tipo_intervencion']` (vacío cuenta como Sin Intervención). Orden fijo, incluye los ceros. | `?parte=Actora` / `?parte=Demandada` / `?parte=Denunciante` / `?parte=Sin%20Intervenci%C3%B3n` |
| **Por estado procesal** ("Distribución de actuaciones activas.") | Una fila por cada estado presente en `misActivos` — agrupa por `estadoProcesal ?? estado` y ordena por cantidad desc. El label legible ("Traba de Litis", "En Prueba"…) sale de `getEstadoProcesal(e.tipo, code)?.label` (`estadosProcesales.ts`), porque el ciclo de estados depende del tipo; si no lo encuentra, cae al código crudo. | `?estado=<code>` |

**Ojo con "Denunciante":** es un valor del ciclo **Penal** (`DatosTab.tsx` ofrece
`Denunciante | Actuación de Oficio | Sin Intervención` cuando `area === 'PENAL'`), así que solo
se puebla para letrados con actuaciones penales — para un letrado de Civil/Laboral queda en 0 y
está bien. **`Actuación de Oficio` quedó deliberadamente fuera** de la distribución (decisión del
cliente): una actuación penal cargada con ese valor no se cuenta en ninguna de las 4 filas, así
que "Por rol" puede no sumar el total de activas.

---

## `<WidgetAudiencias>` — próximas audiencias

Las audiencias **no son una entidad propia**: se cargan como actividad genérica del timeline con
`tipo: 'AUDIENCIA'`. El widget las junta recorriendo `misActivos[].timeline`, no vía
`getAlertaExpediente` (ese helper devuelve **una sola** alerta por expediente, así que se perdería
la segunda audiencia de una misma actuación).

Reglas:
- **Fecha de la audiencia** = `fecha_vencimiento ?? fecha`. El mock modela la audiencia futura con
  `fecha` = alta de la actividad y `fecha_vencimiento` = día de la audiencia.
- **Solo las de hoy en adelante**, ordenadas de la más próxima a la más lejana. Una audiencia que
  ya pasó no sirve para organizar el día.
- Se saltean las `activo === false` y las `eliminado`.
- Cada fila navega a `RUTAS.EXPEDIENTE(id)` — al detalle de la actuación, como el listado de
  vencimientos. El widget no tiene deep-link a la Bandeja (no hay filtro por tipo de actividad).
- La cantidad se muestra en el subtítulo ("N audiencias agendadas.").

**Convención del mock, importante:** una audiencia futura se carga **sin `fecha_aviso`**. Así
aparece en este widget pero **no** genera alerta en `<WidgetVencimientos>` (`getAlertaExpediente`
marca `por_vencer` solo si hay `fecha_aviso <= hoy`). Una audiencia ya realizada se carga **solo
con `fecha`**, sin `fecha_vencimiento`: si tuviera `fecha_vencimiento` pasada, el expediente
aparecería como "Vencido" en el listado de vencimientos, que no es lo que se quiere.

---

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

Recibe `scope` (default `'MIAS'`) y devuelve `usuarioActivo`, `navigate`, `scope`, `misExpedientes`, `misActivos`, `vencimientos`,
`causasActivasCount`, `documentosActivosCount`, `asignadoCount`, `intervencion` (`{ actora,
demandada, denunciante, sinIntervencion }`), `porVencerCount`, `urgentesCount`, `estadosActivos`
(`{ code, count, label }[]`, ordenado por `count` desc), `audiencias` (`{ exp, titulo, fecha }[]`,
solo futuras y ordenadas asc) y `cerradasCount`.

`intervencion.actora` se consume **dos veces**: en el KPI "Actuaciones parte actora" y en la
barra "Actora" de "Por rol". Si se cambia el criterio de conteo, cambian los dos a la vez (a
propósito — deben coincidir).

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
  CASANO (`UR_004`) tiene carga de prueba específica en `expedientes.mock.ts`: **20 actuaciones
  activas** (15 causas + 5 documentos), 4 vencidas y 3 por vencer, 4 en ASIGNADO, 4 urgentes,
  9 estados procesales distintos, 4 audiencias próximas (+ 1 ya realizada que **no** debe
  aparecer) y 1 actuación cerrada. El usuario activo por defecto es LOPEZ (`UR_018`, REFERENTE),
  que **landea** en `/dashboard` (`<RaizPorRol>` no cambió) — para ver Principal como ABOGADO hay
  que cambiar de usuario y entrar a `/home` explícitamente; LOPEZ también puede entrar a `/home`
  desde el Sidebar y ver el scope `'TODO'` por default.
- **"Nuevas asignadas" no aplica a los documentales.** Cuenta `estado === 'ASIGNADO'`, y los tipos
  documentales usan `ESTADOS_GENERICOS` (INICIO / EN_TRAMITE / CERRADO), que no tiene ese estado.
  Un letrado que lleve solo oficios va a ver 0 ahí. Si molesta, la definición alternativa es
  "está en el primer estado de su ciclo" (`getEstadosProcesales(e.tipo)[0].codigo === e.estado`).
- **`estado` matchea contra los dos campos.** El select de la tabla de la Bandeja filtra por
  `e.estado`, pero "Por estado procesal" deep-linkea con `estadoProcesal`. El filtro acepta
  cualquiera de los dos (`e.estado === filtro || (e.estadoProcesal ?? e.estado) === filtro`) para
  que el número de la barra y el resultado de la Bandeja coincidan aunque un expediente tenga los
  dos campos distintos. Hoy el mock los mantiene iguales, pero el modelo lo permite.
- `BandejaAbogado.page.tsx` hidrata `filtroInicial`/`tabEstado` desde estos mismos query params
  (`estado`, `fechaDesde`, `alerta`, `parte`, `clase`, `area`, `tipo`, `urgente`, `tab`) — son
  deep-links invisibles en la tabla, no agregan UI de filtro nueva ahí.
- **Audiencias**: además del bloque propio, si la audiencia tiene `fecha_aviso` también aparece
  en `<WidgetVencimientos>` como cualquier otro plazo, con el detalle de la actividad
  (`C-0505/2026 · Audiencia testimonial`). Las dos vistas conviven a propósito.
- La maqueta de referencia del rediseño está en `docs/principal.jpeg`.
