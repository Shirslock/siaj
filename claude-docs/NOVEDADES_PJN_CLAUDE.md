# Novedades PJN — sincronización con el Portal PJN

> Rama: `feat/asistente-ia-chat` (desde `develop`). Rediseño a **Nivel 1** aplicado en
> `feat/novedades-pjn-nivel1`.

## Qué es

Módulo que revisa los movimientos que detectaría la sincronización con el Portal PJN sobre
las actuaciones que tienen `numero_causa` real cargado. **Nivel 1** (diseño actual): SIAJ
**no clasifica ni interpreta** ningún movimiento — lo muestra tal cual viene del PJN (fecha,
oficina, tipo crudo, detalle, foja, link a documento), agrupado por **corrida de detección**
(`corrida_id`). El letrado revisa cada movimiento **individualmente** y decide **Aplicar**
(crea una actividad en el timeline de la actuación, reutilizando `agregarActividad` del store
existente) o **Descartar** (queda registrado como descartado, sin tocar el expediente). El
agrupamiento por corrida es solo visual — no cambia el flujo de aplicar/descartar, que sigue
siendo por movimiento.

Dos vías para generar novedades, que comparten el mismo modelo de datos y store:
- **Automática** (`origen: 'automatica'` / sin campo, default): corridas del scraper por
  favoritos del usuario — ver el resto de esta sección.
- **Manual / on-demand** (`origen: 'manual'`): el letrado dispara una consulta puntual para
  una actuación puntual desde el botón "Consultar Novedad PJN" — ver "Consulta manual"
  más abajo.

En el mock actual esto es **100% simulado** — no hay scraper ni integración real con PJN,
solo datos hardcodeados en `pjnNovedades.mock.ts` para poder construir y probar el flujo.
Los datos de la primera corrida de C-0100/2026 (`RUN_C0100_20250619`) están tomados casi
literal de un historial real de expediente (pedido de alegatos → autos para alegar → dos
cédulas notificadas el mismo día).

**Nota histórica:** hasta antes de este rediseño, el mock preclasificaba cada movimiento en
4 categorías (`TipoCambioPJN`: `nuevo_movimiento`/`cambio_estado`/`nueva_resolucion`/
`cedula_notificada`) — eso quedó descartado por ser más "Nivel 2" de lo que definió negocio
para esta etapa. `TipoCambioPJN` ya no existe en el código.

## Arquitectura

```
src/types/index.ts          NovedadPJN (incl. origen?, intervinientes_pjn?), EstadoNovedadPJN, Actividad.origen_pjn
                             ActuacionPjnSinCargar, EstadoAlertaActuacionPjn — ver "Causa en PJN sin cargar" abajo
                             IntervinientePjnCrudo — ver "Intervinientes desde una novedad" abajo
src/data/pjnNovedades.mock.ts   mock de 25 movimientos + simularConsultaManualPjn (consulta on-demand)
                                 + ACTUACIONES_PJN_SIN_CARGAR_MOCK (3 alertas de causa fantasma)
src/store/pjn.store.ts          usePjnStore — aplicarNovedad / descartarNovedad / consultarNovedadIndividual
                                 + actuacionesSinCargar / descartarAlerta / resolverAlerta
                                 + aplicarNovedades / descartarNovedades (batch) — ver "Selección masiva" abajo
                                 + consultasManualesPorUsuario / consultasRestantesHoy / MAX_CONSULTAS_DIARIAS — ver "Límite de consultas manuales" abajo
src/utils/pjnVisibilidad.ts     filtrarNovedadesPorRol — visibilidad por rol, compartida
                                 filtrarAlertasActuacionesPorRol — visibilidad de alertas, ver abajo (regla provisoria)
src/utils/pjnVencimiento.ts     esNovedadVencida / diasDesdeDeteccion — flag de vencimiento derivado, ver abajo
src/components/pjn/NovedadPjnCard.tsx   card reutilizable (bandeja central + banner + modal manual)
src/components/pjn/ConsultarNovedadPjnModal.tsx   modal de consulta manual (ver "Consulta manual" abajo)
src/components/expedientes/AgregarIntervinienteModal.tsx   modal de alta de interviniente, extraído de
                                 IntervinientesTab.tsx para reusarlo desde una novedad — ver abajo
src/pages/NovedadesPJN/NovedadesPJN.page.tsx   bandeja central (/novedades-pjn) — novedades + alertas
```

Puntos de acceso a las novedades:
- **Bandeja central** (`/novedades-pjn`) — todas las novedades visibles para el usuario,
  agrupadas por `expediente_id + corrida_id` (varias actuaciones conviven ahí), con filtro
  Pendientes/Vencidas/Todas (ver "Vencimiento" abajo). Cada grupo muestra un header "N
  movimientos detectados el {fecha_deteccion}" antes de sus cards, ordenado por `row_index`
  ascendente; los grupos se ordenan por `fecha_deteccion` descendente. Arriba de los grupos,
  un bloque aparte lista las alertas de "causa en PJN sin cargar" (ver esa sección abajo).
  Toggle "Modo selección" para aplicar/descartar en masa — ver "Selección masiva" abajo.
- **Banner en `DetalleExpediente.page.tsx`** — si la actuación abierta tiene novedades
  pendientes, aparece arriba del contenido (visible en cualquier tab) con un toggle
  "Revisar/Ocultar" que despliega las cards inline (`mostrarActuacion={false}`), agrupadas
  por `corrida_id` (una sola actuación, no hace falta `expediente_id` en la key). Sigue
  contando pendientes vencidas igual que las no vencidas — para el letrado sigue siendo una
  acción pendiente.
- **Badge "PJN" en `BandejaAbogado.page.tsx`** — junto a los badges de Urgente/Por vencer, si
  la fila tiene novedades pendientes (vencidas incluidas).
- **Sidebar** — entrada "Novedades PJN" con badge de contador (número junto al label
  expandido, burbuja sobre el ícono cuando el sidebar está colapsado). El contador suma
  novedades pendientes **más** alertas de "causa sin cargar" pendientes, ambas filtradas por
  rol.
- **Campana del Topbar** — ver "Integración con notificaciones" abajo.

## `aplicarNovedad` — una sola rama, sin clasificación

`usePjnStore.aplicarNovedad(id, usuarioId, textoFinal?)` no crea un tipo de actividad
especial ni bifurca por tipo (no hay `switch`, `TipoCambioPJN` ya no existe): siempre crea
una actividad `tipo: 'MOVIMIENTO'` con `origen_pjn: true` para trazabilidad, reutilizando
`useExpedientesStore().agregarActividad`:

- `titulo` = `novedad.tipo` — el texto crudo del PJN tal cual (ej. "ESCRITO AGREGADO",
  "FIRMA DESPACHO"), sin traducir ni mapear.
- `descripcion` = el texto editado por el letrado (`textoFinal`, o `novedad.detalle` como
  fallback) + una línea de metadata cruda al pie (`Oficina: X · Fs. Y · PJN`, omitiendo las
  partes ausentes) + si `tiene_documento && documento_url`, una línea adicional
  `Documento (PJN): https://scw.pjn.gov.ar<documento_url>` — el link queda preservado en el
  historial de la actuación aunque el letrado cierre la novedad.
- **No** llama a `agregarDocumento` ni crea nada en la tab Documentos — `documento_url` es
  un link externo al Portal PJN, no un archivo alojado en SIAJ; crear un registro en
  Documentos sería un documento fantasma sin contenido real. Si más adelante se quiere
  "traer el archivo real a Documentos", eso requiere que alguien lo baje del PJN y lo suba
  manualmente, o una integración de backend que no existe todavía — fuera de alcance del
  mock actual.

`textoFinal` permite que el letrado edite el texto sugerido (seedeado con `novedad.detalle`)
en el `<textarea>` de `NovedadPjnCard` antes de confirmar.

`PJN_BASE_URL = 'https://scw.pjn.gov.ar'` es una constante placeholder (mismo valor en
`pjn.store.ts` y `NovedadPjnCard.tsx`) — reemplazar por el dominio real del PJN cuando se
defina. `documento_url` en el mock ya viene con el patrón real del scraper
(`/scw/viewer.seam?id=...&tipoDoc=...`).

**Badge "PJN" en el timeline**: la actividad creada por `aplicarNovedad` se distingue
visualmente en el historial de la actuación — `act.origen_pjn === true` renderiza un badge
`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e6f1fb]
text-[#185fa5]` con ícono `refresh` (mismo celeste que usa `NovedadPjnCard.tsx` para el
ícono de la novedad, y mismo ícono que el Sidebar/header de la bandeja/spinner del modal
manual — asociación visual consistente en todo el módulo; **no** reutiliza el celeste de
"Sistema", `bg-[#C4DFE8] text-[#1b3a57]`, son conceptos distintos). Mismo patrón que los
badges "SOLICITUD"/"RESPUESTA" ya existentes, junto al título de la actividad:
- **Civil/Laboral**: `TimelineTab.tsx`, junto a los badges de solicitud/respuesta.
- **Penal**: `TimelinePenal.tsx`, dentro de `kind === 'generica'` (las actividades PJN,
  `tipo: 'MOVIMIENTO'` con título crudo del PJN, no matchean `kind === 'sistema'` porque esa
  rama exige título que empiece con "Cambio de estado"/"Retroceso de estado").

No se tocó el ícono circular (el dot a la izquierda de cada actividad) — con el badge de
texto alcanza, para no over-diseñar.

## Visibilidad por rol (`filtrarNovedadesPorRol`)

Centralizada en `src/utils/pjnVisibilidad.ts`, usada por la bandeja central, el Sidebar
(contador), el badge de `BandejaAbogado` y la campana del Topbar — evita reimplementar la
regla en cada lugar:

- **REFERENTE**: ve todas.
- **COORDINADOR**: ve las de expedientes cuya `area` esté en `usuario.areas`.
- **ABOGADO**: ve solo las de expedientes con `abogado_id === usuario.id`.
- **ADMINISTRATIVO**: no accede al módulo (Mesa SACO no gestiona novedades procesales) — no
  está en `ROL_ACCESOS.ADMINISTRATIVO.nav`.

## Causa en PJN sin cargar en SIAJ (`ActuacionPjnSinCargar`)

Caso que `NovedadPJN` no puede representar: `NovedadPJN.expediente_id` es obligatorio y
`filtrarNovedadesPorRol` descarta silenciosamente cualquier novedad cuyo `expediente_id` no
matchee un expediente existente (`pjnVisibilidad.ts`) — no hay forma de decir "el PJN tiene
una causa que en SIAJ todavía no existe" con ese modelo. Por eso `ActuacionPjnSinCargar`
(`src/types/index.ts`) es una **entidad separada**, no una variante de `NovedadPJN`:

```ts
export type EstadoAlertaActuacionPjn = 'pendiente' | 'descartada' | 'resuelta'

export interface ActuacionPjnSinCargar {
  id: string
  numero_causa: string       // tal cual lo expone PJN, con sigla de fuero si se puede resolver
  caratula_pjn?: string
  fuero?: string
  juzgado?: string
  fecha_deteccion: string
  favorito_de?: string       // id de usuario dueño del favorito en PJN, si se conoce
  estado: EstadoAlertaActuacionPjn
  descartada_por?: string
  fecha_resolucion?: string
  expediente_vinculado_id?: string  // declarado sin usar, ver nota abajo
}
```

**Decisión de negocio: cargar la actuación que generó la alerta es 100% desacoplado del
flujo normal de Alta de Expediente.** No hay auto-consulta al PJN, no hay linking a un
expediente, no hay botón "Dar de alta" precargado — Mesa carga el expediente por el flujo
de siempre, sin relación con la alerta. Esto es intencional, **no** un pendiente de
conectar. La alerta se cierra a mano con una de dos acciones simétricas:
- **Descartar** (`descartarAlerta`) — no correspondía / falso positivo.
- **Marcar como resuelta** (`resolverAlerta`) — confirma que alguien ya vio la alerta y
  cargó la actuación en algún lado, sin vincular ningún expediente puntual. Misma firma que
  `descartarAlerta` (`id`, `usuarioId`); no pide ni guarda ningún `expediente_id`.

`expediente_vinculado_id` queda declarado en el tipo sin usar — nada lo popula hoy — por si
algún día se decide conectar un flujo real de linking; no es código muerto por descuido, es
a propósito.

- **Store**: `usePjnStore().actuacionesSinCargar` (mock: `ACTUACIONES_PJN_SIN_CARGAR_MOCK`,
  3 causas fantasma en `pjnNovedades.mock.ts`). Acciones `descartarAlerta(id, usuarioId)` y
  `resolverAlerta(id, usuarioId)`.
- **UI**: bloque "Actuaciones en PJN sin cargar en SIAJ (N)" en
  `NovedadesPJN.page.tsx`, separado de los grupos de novedades normales — una card simple por
  alerta (número de causa, carátula si hay, juzgado/fuero, fecha de detección) con dos
  acciones, Descartar y Marcar como resuelta. El conteo se suma al badge del Sidebar junto a
  las novedades pendientes (solo cuenta `estado === 'pendiente'`, así que tanto descartar
  como resolver la sacan del contador).
- **Visibilidad — `filtrarAlertasActuacionesPorRol(alertas, usuario)`**
  (`src/utils/pjnVisibilidad.ts`): **regla provisoria**, con un `// TODO: confirmar regla de
  visibilidad` bien visible en el código. No se puede inferir área/letrado dueño de una causa
  que no está en SIAJ, así que hoy es conservadora: REFERENTE y COORDINADOR ven todas,
  ABOGADO no ve ninguna. **Pendiente de definición de negocio** (reunión 2026-09-01) —
  cuando salga la regla real, tocar solo el body de esa función. Ver también Sección 15 de
  `CLAUDE_root.md`.

## Vencimiento de novedades pendientes (7 días)

Definición de negocio: las novedades **nunca se borran**. Pasados 7 días sin que el letrado
las aplique o descarte, se consideran "vencidas" — salen de la vista Pendientes por defecto
de la bandeja central, pero siguen 100% disponibles y accionables (Aplicar/Descartar siguen
funcionando igual).

Implementado como **flag derivado**, no como un cuarto valor de `EstadoNovedadPJN` — a
propósito, para no tener que tocar cada `estado === 'pendiente'` existente ni arriesgar el
flujo de aplicar/descartar:

```ts
// src/utils/pjnVencimiento.ts
const DIAS_VENCIMIENTO_NOVEDAD_PJN = 7
export function esNovedadVencida(novedad: NovedadPJN, hoy = new Date()): boolean
export function diasDesdeDeteccion(novedad: NovedadPJN, hoy = new Date()): number
```

`esNovedadVencida` solo puede dar `true` si `estado === 'pendiente'` (una novedad ya
aplicada o descartada nunca "vence"); compara `fecha_deteccion` contra `hoy` truncando a
medianoche local, sin depender de ninguna lib de fechas (el repo no tiene `date-fns` ni
similar instalada).

- **`NovedadesPJN.page.tsx`**: el filtro pasó de Pendientes/Todas a **tres** tabs —
  Pendientes (`pendiente && !vencida`), Vencidas (`pendiente && vencida`, nuevo), Todas (sin
  filtrar, sin cambios). `NovedadPjnCard` muestra un badge "Vencida hace N días" cuando
  corresponde.
- Banner de `DetalleExpediente.page.tsx` y badge "PJN" de `BandejaAbogado.page.tsx`: **no se
  tocaron** — ya filtran por `estado === 'pendiente'`, que sigue incluyendo las vencidas (el
  único cambio de comportamiento es el filtro por defecto de la bandeja central).

## Selección masiva — aplicar/descartar en lote

Selección **libre en toda la bandeja** — cruza expedientes y corridas, no se limita al
filtro o grupo que se esté viendo. En modo masivo **no hay edición de texto por ítem**: se
aplica `novedad.detalle` tal cual, mismo fallback que ya usa `aplicarNovedad` cuando no le
pasás `textoFinal`.

- **Store**: `aplicarNovedades(ids, usuarioId)` / `descartarNovedades(ids, usuarioId)`
  (`pjn.store.ts`) — batch actions que reusan `aplicarNovedad`/`descartarNovedad` por id
  internamente (no duplican la lógica de creación de actividad ni de metadata), filtrando a
  los ids que sigan `estado === 'pendiente'` en el momento de ejecutar (por si algo cambió
  entre que se tildó y se confirmó — otra pestaña, otro usuario del mock, etc.).
- **`NovedadPjnCard.tsx`**: props opcionales `selMode?`, `selected?`, `onToggleSelect?`.
  Cuando `selMode && pendiente` renderiza un checkbox; el flujo individual existente
  (`<textarea>` + Aplicar/Descartar por ítem) sigue funcionando igual y convive con la
  selección — no se tocó nada de esa lógica. La instancia de esta card dentro de
  `ConsultarNovedadPjnModal.tsx` (resultados de consulta manual) **no** tiene selección —
  fuera de alcance de esta iteración.
- **`NovedadesPJN.page.tsx`**: toggle "Modo selección" en la barra de filtros; al activarlo
  aparece el checkbox en las cards `pendiente` (respetando el filtro Pendientes/Vencidas/
  Todas actual, pero el `Set<string>` de seleccionados no se limpia al cambiar de filtro).
  Con `seleccionados.size > 0` aparece una barra de acción "N seleccionadas" con "Aplicar
  seleccionadas" / "Descartar seleccionadas" / "Cancelar selección".
  - **Aplicar seleccionadas**: abre un modal de confirmación con la cantidad de novedades y
    de expedientes distintos que va a impactar, más la advertencia de que se aplica el texto
    tal cual (sin edición individual). Al confirmar llama a `aplicarNovedades`, limpia la
    selección y muestra un toast resumen.
  - **Descartar seleccionadas**: mismo patrón con `descartarNovedades`, confirmación más
    liviana (sin la advertencia de texto, no aplica).

## Límite de consultas manuales diarias

Decisión de negocio: **3 consultas manuales exitosas por letrado por día**
(`MAX_CONSULTAS_DIARIAS`, `pjn.store.ts`), sumando **todas** las causas que consulte — el
límite es por usuario, no por causa. Solo cuentan los intentos **exitosos** (con o sin
novedades encontradas); un error de credenciales no consume cupo y se puede reintentar
libremente.

- **Store**: `consultasManualesPorUsuario: Record<usuarioId, { fecha: string; cantidad:
  number }>` — un contador por usuario que se resetea solo (si la `fecha` guardada no es
  hoy, cuenta como 0 usadas; no hay job de reseteo, es lazy). `consultasRestantesHoy(usuarioId)`
  devuelve `MAX_CONSULTAS_DIARIAS - usadasHoy`.
- **`consultarNovedadIndividual(expediente, credenciales, usuarioId)`** ahora recibe
  `usuarioId` (mismo patrón que `aplicarNovedad`/`descartarNovedad`/`descartarAlerta`):
  - Si no queda cupo, rechaza de entrada (`throw`) **sin llamar** a
    `simularConsultaManualPjn` — no gasta la simulación de latencia por nada.
  - Si `simularConsultaManualPjn` resuelve (éxito, incluso `novedades: []`), incrementa el
    contador del usuario/hoy.
  - Si rechaza (credenciales inválidas), **no** incrementa — se puede reintentar sin costo.
- **`ConsultarNovedadPjnModal.tsx`**: ahora importa `useUIStore` para leer
  `usuarioActivo.id` (antes no lo necesitaba). En la etapa `form` muestra "Te quedan X de 3
  consultas hoy."; si `X <= 0`, en vez del formulario de usuario/contraseña muestra
  directamente el mensaje de límite alcanzado + botón Cerrar — no hace falta que el letrado
  escriba credenciales para enterarse de que no le quedan intentos (el guard del store
  también está, por las dudas, pero la UI ya evita el intento antes).

## Intervinientes desde una novedad (`IntervinientePjnCrudo`)

El JSON real del PJN también trae datos de intervinientes (partes notificadas, etc.) en
las novedades que las involucran — ej. una `CEDULA ELECTRONICA PARTE`. Mismo criterio que
ya usa `documento_url` (no crea un documento fantasma en la tab Documentos): el PJN
**sugiere** datos, **no auto-carga** — el letrado los revisa/completa contra los catálogos
de SIAJ y confirma con el botón "Agregar" del modal de siempre antes de que se guarde como
`Interviniente` real.

```ts
// src/types/index.ts — campo opcional de NovedadPJN
intervinientes_pjn?: IntervinientePjnCrudo[]

export interface IntervinientePjnCrudo {
  nombre: string
  rol?: string              // texto crudo del PJN (ej. "DEMANDADO") — NO es id de catálogo
  tipo_documento?: string   // texto crudo (ej. "DNI") — NO es id de catálogo
  numero_documento?: string
  domicilio?: string
  representado_por?: string
}
```

- **`AgregarIntervinienteModal.tsx`** (`src/components/expedientes/`): el modal de alta de
  interviniente, extraído de `IntervinientesTab.tsx` para poder abrirse también desde una
  card de novedad en la bandeja central (`/novedades-pjn`), fuera del contexto de esa tab.
  Props `expedienteId`, `open`, `onClose`, y `valoresIniciales?:
  Partial<Omit<Interviniente, 'id'>>` para pre-cargar — reusa
  `useExpedientesStore().agregarInterviniente` tal cual. La edición sigue viviendo inline en
  `IntervinientesTab.tsx` (no se extrajo, solo el alta).
- **Matching de catálogo**: `NovedadPjnCard.tsx` tiene un helper local (`matchCatalogId`)
  que compara `rol`/`tipo_documento` crudos (case-insensitive) contra el `label` de
  `ROLES_INTERVINIENTE`/`TIPOS_DOC_INTERVINIENTE` (`src/data/catalogos.ts`) para
  preseleccionar el catálogo correcto en los `<select>` del modal. Si no hay match, el
  campo queda afuera de `valoresIniciales` y el modal cae al default de siempre (primera
  opción de cada catálogo) — el letrado lo corrige a mano. `nombre`, `numero_documento`,
  `domicilio`→`contacto_domicilio` y `representado_por` se pre-cargan tal cual, sin
  matching (son texto libre).
- **`NovedadPjnCard.tsx`**: cuando `novedad.intervinientes_pjn?.length`, muestra una
  sub-lista compacta (nombre + rol/documento crudo tal cual vino del PJN) con un botón
  "Agregar a Intervinientes" por persona que abre `AgregarIntervinienteModal` con
  `expedienteId={novedad.expediente_id}` y los valores de esa persona pre-cargados.
- **Mock**: 3 ejemplos en `intervinientes_pjn`, en `CEDULA ELECTRONICA PARTE` (el tipo de
  novedad que notifica a una parte puntual) — `PJN_001` y `PJN_019` con `rol`/
  `tipo_documento` que matchean 1 a 1 contra los catálogos (demuestra la pre-selección
  automática), `PJN_002` con `rol: 'LETRADO APODERADO'` que **no** matchea ningún label de
  `ROLES_INTERVINIENTE` (demuestra el fallback a default cuando el PJN no usa los mismos
  términos que el catálogo SIAJ).
- **Fuera de alcance de esta iteración**: no toca `aplicarNovedad` ni el store de
  `pjn.store.ts` (100% aditivo a nivel UI, no cambia el flujo de aplicar/descartar), y no
  aplica a `ActuacionPjnSinCargar` (la alerta de causa sin cargar) — ahí no hay expediente
  real todavía al que agregarle intervinientes.

## Integración con notificaciones (Topbar)

El panel de la campana (`Topbar.tsx`) **ya tenía datos reales** antes de este módulo
(`notificaciones.store.ts`, con tipos `ASIGNACION`/`REASIGNACION`/`ALERTA_VENCIMIENTO`) — no
estaba decorativo. Las novedades PJN pendientes se suman como entradas **virtuales**,
calculadas en cada render con `filtrarNovedadesPorRol` y mapeadas a la forma de
`Notificacion` (tipo `NOVEDAD_PJN`, id `PJN_NTF_<novedad.id>`), sin escribirse en
`notificaciones.store`. Por eso:
- Su botón "descartar" en el panel llama a `usePjnStore().descartarNovedad(...)`, no a
  `notificaciones.store.descartar(...)`.
- Clickear una notificación PJN navega a la actuación pero no llama a `marcarLeida` (no
  aplica — no vive en ese store); se considera "resuelta" cuando se aplica o descarta desde
  el módulo, momento en el que deja de listarse por no estar `pendiente`.

## Datos del mock

25 movimientos crudos sobre 3 actuaciones con `numero_causa` real, agrupados en 4 corridas
(`corrida_id`):

| Actuación | Área | Letrado | Corrida | Movimientos |
|---|---|---|---|---|
| C-0100/2026 | CIVIL | UR_004 (Casano) | `RUN_C0100_20250619` (detectada 19/06/2025 — vieja a propósito) | PJN_001–PJN_005 |
| C-0100/2026 | CIVIL | UR_004 (Casano) | `RUN_C0100_20260718` (detectada 28/08/2026, "ruidosa" — 10 movimientos, un solo hito sustantivo) | PJN_006–PJN_015 |
| L-0100/2026 | LABORAL | UR_012 (Pires) | `RUN_L0100_20260821` (detectada 01/09/2026 — hoy, ilustrativa) | PJN_016–PJN_020 |
| P-0100/2026 | PENAL | UR_019 (Desideri) | `RUN_P0100_20260823` (detectada 30/08/2026, ilustrativa) | PJN_021–PJN_025 |

La primera corrida de C-0100 (`RUN_C0100_20250619`) reproduce casi literal una secuencia real
de expediente: pedido de alegatos (fs. 253, `ESCRITO AGREGADO` con `documento_url`) → autos
para alegar (fs. 254, `FIRMA DESPACHO`) → dos cédulas notificadas el mismo día a las 09:58
(`CEDULA ELECTRONICA PARTE`). La segunda corrida (`RUN_C0100_20260718`) es intencionalmente
ruidosa: mucho movimiento de estado interno (`MOVIMIENTO` EN DESPACHO/EN LETRA, `EVENTO`,
`CAMBIO DE ESTADO DE EXPEDIENTE`, `PASE`/`RECEPCION PASE`, `DEO`) y un solo `FIRMA DESPACHO`
sustantivo (traslado de un recurso de inconstitucionalidad) — pensada para mostrar en demo
por qué un futuro Nivel 2 (clasificación/priorización automática) va a importar.

**Nota sobre fechas y vencimiento:** los `corrida_id` conservan sus nombres originales
(`..._20250619`, `..._20260718`, etc.) aunque ya no coincidan con la `fecha_deteccion` real de
tres de las cuatro corridas — son solo identificadores. Solo `RUN_C0100_20250619`
(`PJN_001`/`PJN_002`, 2 movimientos) quedó con fecha vieja real (2025-06-19) a propósito, como
único ejemplo de novedad **vencida** (7+ días sin resolver). Las otras tres corridas se
reacomodaron a fechas recientes (28/08 al 01/09/2026, con `RUN_L0100_20260821` cayendo
literalmente hoy) para que la bandeja también muestre casos "del día", no todo viejo.

Mezcla de estados en el mock: la mayoría queda `pendiente`, pero dentro de
`RUN_C0100_20250619` — `PJN_003` (EN LETRA) está `descartada` y `PJN_004`/`PJN_005` (autos
para alegar / pedido de alegatos) están `aplicada` — para que la bandeja central no arranque
con todo en un único estado, y para que esa corrida vieja quede con solo 2 pendientes
(`PJN_001`/`PJN_002`, las 2 cédulas) — las que efectivamente vencieron.

Escenarios de rol para probar:
- **Casano** (ABOGADO, CIVIL) → ve solo las 2 corridas de C-0100.
- **Pires** (ABOGADO, LABORAL) → ve solo la corrida de L-0100.
- **Desideri** (ABOGADO, PENAL) → ve solo la corrida de P-0100.
- **Pisano** (COORDINADOR, áreas CIVIL+LABORAL) → ve C-0100 y L-0100, no la de PENAL.
- **REFERENTE** (López/Tentori/Struzka) → ve las 4 corridas, de las 3 actuaciones.

## Consulta manual on-demand (`origen: 'manual'`)

Problema de negocio que resuelve: el flujo automático depende de que la actuación esté en
los favoritos del usuario scraper del PJN. La consulta manual le permite al letrado, desde
una actuación puntual, pedir "consultá el PJN ahora" ingresando su propio usuario/contraseña
del Portal PJN (que en el diseño real se le pasaría a "la empresa del script" junto con el
número de causa; en este prototipo es **100% simulado en frontend**, no hay llamada real a
nada externo).

- **Puntos de entrada**: menú "+" de `DetalleExpediente.page.tsx` y menú "⋮" de una fila en
  `BandejaAbogado.page.tsx`, ambos con `show: !!exp.numero_causa` (sin causa cargada, no
  aparece el ítem). Los dos abren `ConsultarNovedadPjnModal`.
- **`simularConsultaManualPjn(expediente, credenciales)`** (`pjnNovedades.mock.ts`): simula
  ~1.2s de latencia y devuelve `{ corridaId, novedades }`. Tres desenlaces:
  - Éxito con 1-3 novedades nuevas (`corrida_id: RUN_MANUAL_<expediente.id>_<timestamp>`,
    `origen: 'manual'`, `estado: 'pendiente'`) — ocurre la mayoría de las veces para que la
    demo luzca bien.
  - Éxito vacío (`novedades: []`).
  - Error (`Promise` rechazada) si `credenciales.contrasena` (trim + lowercase) es `'error'`
    — sentinel para poder mostrar el caso de falla en demo a pedido.
- **`usePjnStore.consultarNovedadIndividual(expediente, credenciales, usuarioId)`**: primero
  chequea el cupo diario (ver "Límite de consultas manuales diarias" abajo), luego llama al
  mock, agrega las novedades resultantes a `novedades` en el state (mismo array que alimenta
  la bandeja central, el banner y los badges — por eso una consulta manual exitosa se refleja
  ahí también sin lógica extra) y devuelve el `corridaId`. Los errores (sin cupo o
  credenciales inválidas) no se capturan acá — se propagan para que el modal los maneje.
- **`ConsultarNovedadPjnModal.tsx`**: 4 estados internos (`form` → `cargando` → `resultados`
  | `error`). En `resultados` filtra `usePjnStore().novedades` por el `corridaId` devuelto y
  renderiza una `NovedadPjnCard` por cada una (mismo componente, `mostrarActuacion={false}`,
  sin selección — ver "Selección masiva" arriba) — Aplicar/Descartar funciona igual que en el
  resto del módulo. Usuario y contraseña viven solo en `useState` local del modal y se
  descartan al cerrar o reintentar; nunca se persisten (ni state global ni localStorage).
- **Fuera de alcance** (igual que el resto del módulo): integración real con el Portal PJN,
  persistencia de novedades o credenciales, clasificación automática (Nivel 2).

## Pendiente / próximas etapas

- Sin integración real con el Portal PJN — todo el flujo de detección es mock (novedades y
  alertas de "causa sin cargar" por igual).
- Sin persistencia — las novedades, las alertas, sus estados (aplicada/descartada/resuelta)
  y el contador de consultas manuales diarias viven solo en memoria del store
  (`usePjnStore`), se pierden al recargar (el cupo diario "se resetea gratis" al recargar,
  en el mock — no es un problema real hasta que haya backend).
- **Visibilidad de la alerta "causa en PJN sin cargar"** (`filtrarAlertasActuacionesPorRol`):
  pendiente de definición de negocio (reunión 2026-09-01) sobre a quién le llega — ver
  detalle en la sección de arriba.
- **NO** hay flujo de alta de expediente conectado a la alerta, y no es un pendiente:
  decisión de negocio explícita (ver "Causa en PJN sin cargar en SIAJ" arriba). Mesa carga
  el expediente por el Alta de Expediente normal, sin relación con la alerta.
- **Nivel 2** (fuera de alcance de esta etapa, decisión de negocio pendiente): clasificar
  automáticamente los movimientos crudos (equivalente al viejo `TipoCambioPJN`), priorizar
  los sustantivos sobre el ruido de estado interno (`EN DESPACHO`/`EN LETRA`/`EVENTO`/`PASE`),
  y eventualmente sugerir acciones por tipo (como hacía `aplicarNovedad` antes del rediseño).
  El caso `RUN_C0100_20260718` del mock quedó armado a propósito para argumentar esto en demo.
