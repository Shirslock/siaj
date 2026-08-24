# Novedades PJN — sincronización con el Portal PJN

> Rama: `feat/asistente-ia-chat` (desde `develop`).

## Qué es

Módulo que revisa las novedades que detectaría la sincronización con el Portal PJN
(nuevos despachos, cambios de estado, resoluciones, cédulas notificadas) sobre las
actuaciones que tienen `numero_causa` real cargado. El letrado revisa cada novedad y decide
**Aplicar** (crea una actividad en el timeline de la actuación, reutilizando
`agregarActividad` del store existente) o **Descartar** (queda registrada como descartada,
sin tocar el expediente).

En el mock actual esto es **100% simulado** — no hay scraper ni integración real con PJN,
solo datos hardcodeados en `pjnNovedades.mock.ts` para poder construir y probar el flujo.

## Arquitectura

```
src/types/index.ts          NovedadPJN, TipoCambioPJN, EstadoNovedadPJN, Actividad.origen_pjn
src/data/pjnNovedades.mock.ts   mock de 10 novedades (ver "Datos del mock" abajo)
src/store/pjn.store.ts          usePjnStore — aplicarNovedad / descartarNovedad
src/utils/pjnVisibilidad.ts     filtrarNovedadesPorRol — visibilidad por rol, compartida
src/components/pjn/NovedadPjnCard.tsx   card reutilizable (bandeja central + banner)
src/pages/NovedadesPJN/NovedadesPJN.page.tsx   bandeja central (/novedades-pjn)
```

Puntos de acceso a las novedades:
- **Bandeja central** (`/novedades-pjn`) — todas las novedades visibles para el usuario, con
  filtro Pendientes/Todas.
- **Banner en `DetalleExpediente.page.tsx`** — si la actuación abierta tiene novedades
  pendientes, aparece arriba del contenido (visible en cualquier tab) con un toggle
  "Revisar/Ocultar" que despliega las cards inline (`mostrarActuacion={false}`).
- **Badge "PJN" en `BandejaAbogado.page.tsx`** — junto a los badges de Urgente/Por vencer, si
  la fila tiene novedades pendientes.
- **Sidebar** — entrada "Novedades PJN" con badge de contador de pendientes (número junto al
  label expandido, burbuja sobre el ícono cuando el sidebar está colapsado).
- **Campana del Topbar** — ver "Integración con notificaciones" abajo.

## `aplicarNovedad` — cómo despacha por tipo

`usePjnStore.aplicarNovedad(id, usuarioId, textoFinal?)` no crea un tipo de actividad
especial: todo cae en `tipo: 'MOVIMIENTO'` con `origen_pjn: true` para trazabilidad,
reutilizando `useExpedientesStore().agregarActividad`.

- `nuevo_movimiento` / `nueva_resolucion` / `cedula_notificada` → actividad con el texto
  editado (o `valor_sugerido`, o `descripcion` como fallback).
- `cambio_estado` → **no** cambia el estado del expediente automáticamente. Crea una
  actividad informativa con una nota explícita pidiendo revisar y actualizar manualmente
  desde el modal "Cambiar estado" — decisión deliberada para no forzar una transición de
  estado sin confirmación explícita del letrado en su propio flujo.

`textoFinal` permite que el letrado edite el texto sugerido en el `<textarea>` de
`NovedadPjnCard` antes de confirmar.

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

4 actuaciones abiertas con `numero_causa` real en `expedientes.mock.ts`, elegidas para cruzar
área/letrado/rol y poder probar `filtrarNovedadesPorRol` de punta a punta
(`P-0102/2026` también tiene `numero_causa` pero está `ARCHIVO`, se excluyó por no tener
sentido trackear novedades sobre una causa cerrada):

| Actuación | Área | numero_causa | Letrado | Novedades |
|---|---|---|---|---|
| P-0100/2026 | PENAL | IPP-2026-00845 | UR_019 (Desideri) | PJN_001–PJN_003 |
| P-0101/2026 | PENAL | 88.441/2026 | UR_019 (Desideri) | PJN_004–PJN_006 |
| C-0100/2026 | CIVIL | 61.204/2026 | UR_004 (Casano) | PJN_007–PJN_008 |
| L-0100/2026 | LABORAL | 48.771/2026 | UR_012 (Pires) | PJN_009–PJN_010 |

C-0100 y L-0100 también se expandieron con `campos_mesa`/`campos_abogado` completos (juzgado,
fuero, monto, tipo de juicio, siniestro, etc.) y 2-3 actividades de timeline además de la
recepción (contestación de demanda, notificación/audiencia) — quedaron con contexto real para
que el Asistente IA (tab Saúl) tenga algo sustancioso que responder, no solo el alta.

Mezcla de estados en el mock: la mayoría queda `pendiente`, pero `PJN_002` (P-0100) está
`aplicada` y `PJN_005` (P-0101) está `descartada` — para que la bandeja central no arranque
con todo en un único estado.

Escenarios de rol para probar:
- **Casano** (ABOGADO, CIVIL) → ve solo las de C-0100.
- **Pires** (ABOGADO, LABORAL) → ve solo las de L-0100.
- **Pisano** (COORDINADOR, áreas CIVIL+LABORAL) → ve C-0100 y L-0100, no las PENAL.
- **Desideri** (ABOGADO, PENAL) → ve solo P-0100/P-0101, sin cambios.
- **REFERENTE** (López/Tentori/Struzka) → ve las 4 actuaciones.

## Pendiente / próximas etapas

- Sin integración real con el Portal PJN — todo el flujo de detección es mock.
- Sin persistencia — las novedades y su estado (aplicada/descartada) viven solo en memoria
  del store (`usePjnStore`), se pierden al recargar.
