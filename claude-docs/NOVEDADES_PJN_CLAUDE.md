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
src/types/index.ts          NovedadPJN (incl. origen?), EstadoNovedadPJN, Actividad.origen_pjn
src/data/pjnNovedades.mock.ts   mock de 25 movimientos + simularConsultaManualPjn (consulta on-demand)
src/store/pjn.store.ts          usePjnStore — aplicarNovedad / descartarNovedad / consultarNovedadIndividual
src/utils/pjnVisibilidad.ts     filtrarNovedadesPorRol — visibilidad por rol, compartida
src/components/pjn/NovedadPjnCard.tsx   card reutilizable (bandeja central + banner + modal manual)
src/components/pjn/ConsultarNovedadPjnModal.tsx   modal de consulta manual (ver "Consulta manual" abajo)
src/pages/NovedadesPJN/NovedadesPJN.page.tsx   bandeja central (/novedades-pjn)
```

Puntos de acceso a las novedades:
- **Bandeja central** (`/novedades-pjn`) — todas las novedades visibles para el usuario,
  agrupadas por `expediente_id + corrida_id` (varias actuaciones conviven ahí), con filtro
  Pendientes/Todas. Cada grupo muestra un header "N movimientos detectados el
  {fecha_deteccion}" antes de sus cards, ordenado por `row_index` ascendente; los grupos se
  ordenan por `fecha_deteccion` descendente.
- **Banner en `DetalleExpediente.page.tsx`** — si la actuación abierta tiene novedades
  pendientes, aparece arriba del contenido (visible en cualquier tab) con un toggle
  "Revisar/Ocultar" que despliega las cards inline (`mostrarActuacion={false}`), agrupadas
  por `corrida_id` (una sola actuación, no hace falta `expediente_id` en la key).
- **Badge "PJN" en `BandejaAbogado.page.tsx`** — junto a los badges de Urgente/Por vencer, si
  la fila tiene novedades pendientes.
- **Sidebar** — entrada "Novedades PJN" con badge de contador de pendientes (número junto al
  label expandido, burbuja sobre el ícono cuando el sidebar está colapsado).
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

## Visibilidad por rol (`filtrarNovedadesPorRol`)

Centralizada en `src/utils/pjnVisibilidad.ts`, usada por la bandeja central, el Sidebar
(contador), el badge de `BandejaAbogado` y la campana del Topbar — evita reimplementar la
regla en cada lugar:

- **REFERENTE**: ve todas.
- **COORDINADOR**: ve las de expedientes cuya `area` esté en `usuario.areas`.
- **ABOGADO**: ve solo las de expedientes con `abogado_id === usuario.id`.
- **ADMINISTRATIVO**: no accede al módulo (Mesa SACO no gestiona novedades procesales) — no
  está en `ROL_ACCESOS.ADMINISTRATIVO.nav`.

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
| C-0100/2026 | CIVIL | UR_004 (Casano) | `RUN_C0100_20250619` (detectada 19/06/2025) | PJN_001–PJN_005 |
| C-0100/2026 | CIVIL | UR_004 (Casano) | `RUN_C0100_20260718` (detectada 18/07/2026, "ruidosa" — 10 movimientos, un solo hito sustantivo) | PJN_006–PJN_015 |
| L-0100/2026 | LABORAL | UR_012 (Pires) | `RUN_L0100_20260821` (ilustrativa) | PJN_016–PJN_020 |
| P-0100/2026 | PENAL | UR_019 (Desideri) | `RUN_P0100_20260823` (ilustrativa) | PJN_021–PJN_025 |

La primera corrida de C-0100 (`RUN_C0100_20250619`) reproduce casi literal una secuencia real
de expediente: pedido de alegatos (fs. 253, `ESCRITO AGREGADO` con `documento_url`) → autos
para alegar (fs. 254, `FIRMA DESPACHO`) → dos cédulas notificadas el mismo día a las 09:58
(`CEDULA ELECTRONICA PARTE`). La segunda corrida (`RUN_C0100_20260718`) es intencionalmente
ruidosa: mucho movimiento de estado interno (`MOVIMIENTO` EN DESPACHO/EN LETRA, `EVENTO`,
`CAMBIO DE ESTADO DE EXPEDIENTE`, `PASE`/`RECEPCION PASE`, `DEO`) y un solo `FIRMA DESPACHO`
sustantivo (traslado de un recurso de inconstitucionalidad) — pensada para mostrar en demo
por qué un futuro Nivel 2 (clasificación/priorización automática) va a importar.

Mezcla de estados en el mock: la mayoría queda `pendiente`, pero `PJN_003` (EN LETRA) está
`descartada` y `PJN_004` (autos para alegar) está `aplicada` — para que la bandeja central no
arranque con todo en un único estado.

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
- **`usePjnStore.consultarNovedadIndividual(expediente, credenciales)`**: llama al mock,
  agrega las novedades resultantes a `novedades` en el state (mismo array que alimenta la
  bandeja central, el banner y los badges — por eso una consulta manual exitosa se refleja
  ahí también sin lógica extra) y devuelve el `corridaId`. No captura errores — los propaga
  para que el modal los maneje.
- **`ConsultarNovedadPjnModal.tsx`**: 4 estados internos (`form` → `cargando` → `resultados`
  | `error`). En `resultados` filtra `usePjnStore().novedades` por el `corridaId` devuelto y
  renderiza una `NovedadPjnCard` por cada una (mismo componente, `mostrarActuacion={false}`)
  — Aplicar/Descartar funciona igual que en el resto del módulo. Usuario y contraseña viven
  solo en `useState` local del modal y se descartan al cerrar o reintentar; nunca se
  persisten (ni state global ni localStorage).
- **Fuera de alcance** (igual que el resto del módulo): integración real con el Portal PJN,
  persistencia de novedades o credenciales, clasificación automática (Nivel 2).

## Pendiente / próximas etapas

- Sin integración real con el Portal PJN — todo el flujo de detección es mock.
- Sin persistencia — las novedades y su estado (aplicada/descartada) viven solo en memoria
  del store (`usePjnStore`), se pierden al recargar.
- **Nivel 2** (fuera de alcance de esta etapa, decisión de negocio pendiente): clasificar
  automáticamente los movimientos crudos (equivalente al viejo `TipoCambioPJN`), priorizar
  los sustantivos sobre el ruido de estado interno (`EN DESPACHO`/`EN LETRA`/`EVENTO`/`PASE`),
  y eventualmente sugerir acciones por tipo (como hacía `aplicarNovedad` antes del rediseño).
  El caso `RUN_C0100_20260718` del mock quedó armado a propósito para argumentar esto en demo.
