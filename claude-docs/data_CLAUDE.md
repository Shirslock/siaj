# src/data/ — Catálogos y datos mock

## Archivos

| Archivo | Contenido | Fuente |
|---------|-----------|--------|
| `catalogos.ts` | Todos los catálogos con IDs oficiales | Tablas Codificadoras Excel |
| `formularios.ts` | Campos por tipo (mesa + abogado) | FORMULARIOS.md |
| `usuarios.ts` | 32 usuarios reales con roles y asignaciones | Roles.xlsx |
| `expedientes.mock.ts` | Datos de ejemplo para el prototipo — ver mocks disponibles abajo | Creado manualmente |
| `estadosProcesales.ts` | Estados y tareas por tipo de gestión — 13 ciclos | Diseño funcional / MATRIZ SACO |
| `causalesFinalizacion.ts` | Catálogo de causales de finalización por `grupoCausal` | MATRIZ SACO |
| `solicitudesPenales.ts` | Config de sub-formularios por los 10 tipos de Solicitud Penal (integrados en el modal "Nueva Actividad" de `TimelinePenal.tsx`, no en Datos Maestros) | MATRIZ SACO |
| `audiencias.mock.ts` | Audiencias de ejemplo para el módulo Agenda | Creado manualmente |

---

## IDs oficiales — no inventar nuevos

| Prefijo | Catálogo |
|---------|----------|
| `TPG_` | Tipos de gestión (TPG_001 a TPG_022) |
| `LIN_` | Líneas ferroviarias (LIN_001 a LIN_009) |
| `JUZ_` | Juzgados |
| `THP_` | Tipos de hecho penal (THP_001 a THP_020) |
| `JUI_` | Tipos de juicio (JUI_001 a JUI_010) |
| `UR_` | Usuarios (UR_001 a UR_032) |
| `DOC_` | Documentos en mock (DOC_C023_001, etc.) |

---

## Asignación de letrados

**Civil/Laboral → FIFO:**
```ts
import { getAbogadosFifo } from './usuarios'
const abogados = getAbogadosFifo('CIVIL')
```

**Penal → por línea ferroviaria:**
```ts
import { ASIGNACION_PENAL } from './usuarios'
const abogadoId = ASIGNACION_PENAL['LIN_004']  // → 'UR_019' (DESIDERI)
```

| Línea | Abogado titular | ID |
|-------|----------------|----|
| LIN_001 Roca | DESIDERI, Gustavo | UR_019 |
| LIN_002 San Martín | BIONDI, Walter | UR_023 |
| LIN_003 Sarmiento | PRINOTTI, Maximiliano | UR_024 |
| LIN_004 Mitre | DESIDERI, Gustavo | UR_019 |
| LIN_005 Belgrano Sur | BIONDI, Walter | UR_023 |
| LIN_006 Regionales | PRINOTTI, Maximiliano | UR_024 |
| LIN_007 Larga Distancia | DESIDERI, Gustavo | UR_019 |
| LIN_008 Central | BIONDI, Walter | UR_023 |
| LIN_009 Tren de la Costa | DESIDERI, Gustavo | UR_019 |

---

## Campos comunes de Mesa (CAMPOS_COMUNES_MESA)

Estos 5 campos aparecen en TODOS los tipos al dar de alta:
1. `mesa_oficio_judicial` — N° OJ (text)
2. `mesa_tipo_intervencion` — select dinámico por área
3. `mesa_fecha_requerimiento` — date
4. `mesa_datos_contacto` — text full
5. `mesa_comentarios` — textarea full

**NO van aquí:** Carátula ni N° Causa.

---

## Estados procesales (estadosProcesales.ts)

Los 4 ciclos MATRIZ SACO — `ESTADOS_DEMANDA_CIVIL`, `ESTADOS_DEMANDA_LABORAL` (ciclo propio,
ya NO alias del civil), `ESTADOS_DEMANDA_CIVIL_ACTORA`, `ESTADOS_DEMANDA_LABORAL_ACTORA` —
comparten la misma estructura de códigos:

ASIGNADO → INICIO → TRABA_LITIS → EN_PRUEBA (`PRUEBA` en las variantes `_ACTORA`) → ALEGATO
→ SENTENCIA_1_FAV | SENTENCIA_1_DESFAV → APELACION → SENTENCIA_2_FAV | SENTENCIA_2_DESFAV
→ REF → EJECUCION_SENTENCIA → FINALIZADO (`esArchivado: true`)

Cada nodo tiene `grupoCausal` (`PRE_SENTENCIA_1` / `SENTENCIA_1` / `INSTANCIA_RECURSIVA` /
`EJECUCION_SENTENCIA`) que el modal "Finalizar actuación" usa para resolver el catálogo de
causales vía `getCausalesPorEstado()` de `causalesFinalizacion.ts`. `EJECUCION_SENTENCIA`
incluye como última tarea "Registrar causal de finalización".

**Recurso de Queja fue eliminado por completo** (no solo como nodo lineal) — decisión de
negocio. `REF.siguiente` va directo a `EJECUCION_SENTENCIA`, sin trámite paralelo asociado.
Ya no existe `TAREAS_RECURSO_QUEJA` en este archivo.

La ramificación `ALEGATO`/`APELACION` (Sentencia Favorable/Desfavorable, decisión del letrado)
y la de `EN_ANALISIS` (ciclo A/B) se resuelven en `DetalleExpediente.page.tsx` con
`getRamificaciones(codigoEstado, tipo)` — ver `pages_CLAUDE.md` / `CLAUDE.md` Sección 13.

El estado ASIGNADO no tiene tareas — avanza desde Acciones → Cambiar estado.
Los demás estados tienen tareas que deben completarse para avanzar.

```ts
import { getEstadosProcesales, getEstadoProcesal } from './estadosProcesales'
import { getCausalesPorEstado } from './causalesFinalizacion'
const estados = getEstadosProcesales('DEMANDA_CIVIL')
const estado = getEstadoProcesal('DEMANDA_CIVIL', 'INICIO')
const causales = getCausalesPorEstado(estado?.grupoCausal)
```

**LANZAMIENTO_JUDICIALIZADO** también fue reconstruido MATRIZ SACO (11 estados, terminal propio
`TERMINADO` en vez de `FINALIZADO`, `grupoCausal: 'LANZAMIENTO'` con catálogo propio en
`causalesFinalizacion.ts`), con dos particularidades que no tienen los 4 ciclos de Demanda:

- **Split Operativo/Comercial** por `campos_mesa.mesa_tipo_lanzamiento` — el circuito Comercial
  salta directo `INICIO → SENTENCIA_LANZAMIENTO → MANDAMIENTO_LIBRADO →
  LANZAMIENTO_EFECTIVIZADO → TERMINADO` (`getSiguienteLanzamiento()` en
  `DetalleExpediente.page.tsx`, prioridad sobre la ramificación genérica).
- **Bifurcación por vulnerabilidad** desde `CONSTATACION_JUDICIAL` → `SENTENCIA_LANZAMIENTO`
  (sin vulnerables) | `TRASLADO_DEFENSOR_OFICIAL` (con vulnerables) — mismo mecanismo
  `getRamificaciones()`/`RAMIFICACIONES_POR_CODIGO` que ALEGATO/APELACION.

Ver Sección 13 de `CLAUDE.md` para el detalle completo de la cadena.

---

## Usuarios multi-rol

| ID | Usuario | Roles |
|----|---------|-------|
| UR_032 | BUÑIRIGO, Rosana | adm_mesa + asistente_jurídico |
| UR_030 | ROLDAN, Pedro Adrian | sin rol asignado (pendiente) |

Helpers disponibles:
```ts
import { tieneRol, puedeReasignar } from './usuarios'
tieneRol(usuario, 'adm_mesa')        // → boolean
puedeReasignar(usuario)              // → true solo si abogado_coordinador
```

---

## Mocks disponibles (expedientes.mock.ts)

**Reseteado a partir de `feat/matriz-saco-demandas`:** se eliminaron todas las actuaciones de
ejemplo previas (las 13 con escenarios de vencimientos/agrupación/vínculos descriptas más abajo
en el historial de este doc — ⚠️ **ya no existen en el código**, quedan solo como referencia si
hace falta reconstruir algún escenario). `EXPEDIENTES_MOCK` tiene 6 actuaciones base — las 4
originales de MATRIZ SACO más dos agregadas para poder probar el flujo Penal completo (Carta SAE
→ Iniciar Querella, y el ciclo Archivo ↔ Desarchivado). Se exporta también como
`EXPEDIENTES_ABOGADO` (alias de compatibilidad). El store carga `expedientes: EXPEDIENTES_MOCK`.
`QUEUE_MESA` está vacío (`[]`).

| # | ID | Tipo | Área | Estado (código) | Letrado | Causa / rol |
|---|----|------|------|-----------------|---------|-------------|
| 01 | C-0100/2026 | DEMANDA_CIVIL | CIVIL | ASIGNADO → EN TRAMITACIÓN | CASANO UR_004 | `numero_causa: '61.204/2026'` — campos_mesa/abogado completos + timeline con Contestación y Notificación, para probar Novedades PJN y el Asistente IA con contexto real |
| 02 | L-0100/2026 | DEMANDA_LABORAL | LABORAL | ASIGNADO → EN TRAMITACIÓN | PIRES UR_012 | `numero_causa: '48.771/2026'` — campos_mesa/abogado completos + timeline con Contestación y Audiencia, mismo propósito que C-0100/2026 |
| 03 | C-0043/2026 | LANZAMIENTO | CIVIL | JUICIO_INICIADO | CASANO UR_004 | sin `numero_causa` — probar botón "Iniciar Juicio" → crea `LANZAMIENTO_JUDICIALIZADO` nuevo |
| 04 | P-0100/2026 | OFICIO (variante_penal) | PENAL | EN ANÁLISIS | DESIDERI UR_019 | `numero_causa: 'IPP-2026-00845'` — probar los 10 tipos de Solicitud Penal desde "+ Nueva Actividad" en Timeline (ya no en Datos Maestros): sub-formulario inline, badge "Sin completar" mientras falten campos |
| 05 | P-0101/2026 | CARTA_SUCESO | PENAL | EN_ANALISIS | DESIDERI UR_019 | `numero_causa: '88.441/2026'` — probar el flujo "Iniciar Querella" del menú `+` (`exp.tipo === 'CARTA_SUCESO' && !exp.es_querella_iniciada`) |
| 06 | P-0102/2026 | QUERELLA | PENAL | ARCHIVO | DESIDERI UR_019 | `numero_causa: '52.100/2025'`, `es_principal: true` — probar el ciclo Archivo ↔ Desarchivado (ver Sección 13 de `CLAUDE.md`) |

Solo C-0043/2026 tiene `numero_causa: null` y por lo tanto **`es_principal: false`** (regla:
nunca `es_principal: true` sin número de causa real — ver Sección 7 de `CLAUDE.md`). C-0100/2026,
L-0100/2026, P-0100/2026 y P-0101/2026 sí tienen causa real pero también `es_principal: false`
(ninguna forma parte de un grupo-causa de ejemplo — cada una tiene una causa propia sin otra
actuación agrupada). P-0102/2026 es la única con `es_principal: true`: representa el caso de una
causa con una sola actuación (coherente con la regla, no forma grupo con nada).

**Regla clave — `estado`/`estadoProcesal` usan el CÓDIGO del catálogo, no el label:**
- Tipos con flujo (`getEstadosProcesales` los mapea): usar el `codigo` exacto (`EN_PRUEBA`, `TRABA_LITIS`, `ACUERDO_EXTRAJUDICIAL`, etc.), NO el label con tildes.
- Área PENAL (cualquier tipo): el detalle usa `getEtapasPenales(tipo)` — que **ignora `tipo`** y devuelve siempre el mismo ciclo para QUERELLA/DEFENSA_PENAL/CARTA_SUCESO → códigos `ASIGNADO`/`EN_ANALISIS`/`ACEPTADO`/`RECHAZADO`/`INSTRUCCION`/`JUICIO`/`EJECUCION_PENAL`/`ARCHIVO`/`DESARCHIVADO`. `DESARCHIVADO` es sub-estado transitorio (solo alcanzable desde `ARCHIVO`, única salida `ARCHIVO`) — ver Sección 13 de `CLAUDE.md`.
- Tipos sin catálogo de flujo (OFICIO en área Civil/Laboral, CARTA_DOC, MEDIACION, SECLO): usan los labels libres de `ESTADOS_POR_TIPO` (`'EN ANÁLISIS'`, `'RESPONDIDO'`, etc.). **`ESTADOS_POR_TIPO` NO aplica a tipos de área PENAL** — cualquier entrada ahí para QUERELLA/DEFENSA_PENAL/CARTA_SUCESO es inalcanzable en la UI real (el fallback que la lee nunca se ejecuta para `exp.area === 'PENAL'`). La entrada `CARTA_SUCESO` ya se eliminó del catálogo por tener valores ficticios (`'CARGADA'`) sin correspondencia real; `QUERELLA` y `DEFENSA_PENAL` quedan con el mismo problema, detectado pero no eliminado todavía.
- Cada MOVIMIENTO del timeline lleva `estadoExpediente` = el código destino de esa transición.

**`TAREAS_MAP_INICIAL`** ahora es `{}` (vacío) — el store lo carga como `tareasMap` inicial, y
`TimelineTab` lo completa de forma lazy con `inicializarTareas(expId, estadoCodigo, tareas)` a
medida que se navega por los estados. `ASIGNADO` no tiene tareas en ningún ciclo (`tareas: []`).
Ya no hay tareas pre-populadas de ejemplo (antes: `C-0001/2023__EN_PRUEBA`,
`L-0002/2022__TRABA_LITIS`, `C-0009/2024__ACUERDO_EXTRAJUDICIAL` — perdidas con el reseteo).

Helper `tarea(id, nombre, over?)` — **removido** del mock junto con `TAREAS_MAP_INICIAL`
poblado (unused-locals); si se vuelve a necesitar poblar tareas de ejemplo, reintroducirlo.

**Documentos en el mock:** todos los documentos tienen campo `id` obligatorio (`DOC_..._001`). Las 4 actuaciones actuales tienen `documentos: []`.

**Exports de infraestructura conservados** (no son actuaciones de ejemplo, no se tocaron):
`CARTA_SUCESO_QUEUE`, `CAUSAS_PENALES` — mocks del módulo Penal fuera de alcance de la
reconstrucción MATRIZ SACO. `ESTADOS_POR_TIPO` ya no tiene entrada `CARTA_SUCESO` (ver nota sobre
código/label más arriba) — sigue vigente para los tipos no-Penal sin catálogo de flujo propio.

**Ejemplo Iniciar Querella (antes "Nueva Querella"):** el expediente `P-0019/2024` (Carta Suceso)
que documentaba este flujo en la v1 del mock ya no existe — pero desde esta rama hay un
reemplazo funcional: **`P-0101/2026`** (fila 05 de la tabla de arriba), listo para disparar
"Iniciar Querella" desde el menú `+` de `DetalleExpediente`. El mecanismo (`confirmarNuevaQuerella`,
ver `pages_CLAUDE.md`) no se tocó — solo se renombró el texto de UI ("Nueva Querella" →
"Iniciar Querella"), los identificadores internos quedan igual.

**Escenarios perdidos con el reseteo (referencia histórica, reconstruir si se necesitan):** las
13 actuaciones previas cubrían agrupación por causa (2 grupos con badge "Principal · PJN"),
vínculos cross-área (C-0001 civil ↔ P-0001 penal, mismo siniestro), semáforo de vencimientos
(2 vencidas, 4 por-vencer), par LANZAMIENTO administrativo→judicializado (`tipo_relacion:
'ANTECEDENTE'`) y el ejemplo de Nueva Querella (`P-0019/2024`). Nada de esto tiene reemplazo
todavía en las 4 actuaciones MATRIZ SACO — quien necesite probar esos escenarios (dashboard,
bandeja agrupada, vínculos) tiene que agregar mocks a mano.

---

## formularios.ts — Oficio Penal (variante_penal)

La sección `variante_penal` del OFICIO en área PENAL tiene:

**Mesa:**
- `mesa_num_causa`, `mesa_num_sumario`, `mesa_num_ipp` — números de causa
- `mesa_caratula`, `mesa_juzgado`, `mesa_fiscalia`, `mesa_comisaria`, `mesa_tribunal`
- `mesa_linea` — línea ferroviaria
- `mesa_fecha_recep_of` — fecha recepción de oficio
- **Sin** `caracter_oficio` (ese campo es exclusivo de Civil/Laboral)

**Abogado:**
- `abg_datos_contacto`, `abg_fecha_hecho`, `abg_lugar_hecho`
- `abg_damnificado`, `abg_imputado`
- `abg_tipo_hecho` — multiselect con 7 opciones penales
- `abg_num_siniestro` — "Accidente Ferroviario (N° Siniestro)", type text, mono
- **`abg_tipo_solicitud` ya NO existe** — ver sección siguiente, se migró de Datos Maestros al
  modal "Nueva Actividad" de `TimelinePenal.tsx`.

### Solicitud Penal — 10 tipos, integrados en "Nueva Actividad" (`solicitudesPenales.ts`)

Los 10 tipos de Solicitud Penal ya no viven en Datos Maestros (`abg_tipo_solicitud` fue
eliminado del formulario, y `ModalSolicitudPenal.tsx` ya no existe). Ahora son 10 valores más
del union `TipoActividad`, elegibles como opción suelta en el select de Tipo del modal
"Nueva Actividad" de `TimelinePenal.tsx` (sin optgroup separador):

`SOLICITUD_INFORMACION` / `SOLICITUD_FILMACIONES_ESTATICAS` / `SOLICITUD_FILMACIONES_DINAMICAS`
/ `NOTIFICACION_CONCILIACION` / `NOTIFICACION_REPARACION_INTEGRAL` / `NOTIFICACION_PROBATION` /
`SOLICITUD_INTERVENCION` / `CITACION_TESTIMONIAL` / `CITACION_INDAGATORIA` /
`SOLICITUD_AVERIGUACION_PARADERO`

Cada uno tiene su propio set de campos (`CONFIG_SOLICITUDES_PENALES[label]`, keyed por label —
sin cambios respecto al diseño original), renderizado como sub-formulario **inline** dentro del
modal, debajo de título/descripción/fecha/doc_gde:

```ts
export interface CampoSolicitudPenal {
  id: string
  label: string
  tipo: 'text' | 'textarea' | 'date' | 'time' | 'money' | 'select'
  options?: string[]
  permiteArchivo?: boolean   // agrega botón "Adjuntar archivo" → agregarDocumento()
  full?: boolean
}
```

- `TIPO_ACTIVIDAD_SOLICITUD_PENAL: Record<string,string>` mapea código de `TipoActividad` →
  label (para resolver la config) y `getConfigPorTipoActividad(tipoActividad)` hace el lookup
  directo.
- **Solicitud de Averiguación de Paradero** es el único con `camposCondicionales`: el select
  "Tipo de Requerimiento" (`Colaboración` / `Información`) determina qué campos extra aparecen
  (`pase_areas` vs `memo_ggo` + `respuesta_area`).
- El detalle completado vive en la propia `Actividad`: `solicitud_penal_campos?:
  Record<string,string>` y `solicitud_penal_archivos?: Record<string,string[]>` (interfaz
  `Actividad` en `types/index.ts`) — ya no en `campos_abogado.abg_solicitudes_detalle`.
- Guardado vía `agregarActividad`/`editarActividad` del store (mismas acciones que cualquier
  actividad genérica) — no hay acción dedicada.
- Archivos adjuntos usan `agregarDocumento()` del store igual que el resto del sistema — quedan
  en la tab Documentos de la actuación, no hay repositorio separado por solicitud.
- **Repetible:** no hay restricción de unicidad — se puede crear el mismo tipo de solicitud
  varias veces como actividades distintas.
- **Editable:** el botón "Editar" del feed (visible para cualquier actividad genérica, no solo
  estas 10) recarga `solicitud_penal_campos`/`archivos` en el formulario y guarda con
  `editarActividad` en vez de crear una nueva.
- **Completar después:** badge "Sin completar" en el feed mientras
  `!solicitudEstaCompleta(tipo, campos)` — helper que compara contra el total de campos de la
  config (fijos + condicionales aplicables), tratando todos como obligatorios (no hay flag
  `obligatorio?` por campo todavía).

## formularios.ts — DEMANDA_LABORAL (MATRIZ SACO)

- `mesa_juicio` ("Tipo de Juicio"): agregadas 4 opciones — `INDEMNIZACIÓN POR FALLECIMIENTO`,
  `REINSTALACIÓN LABORAL`, `MEDIDA CAUTELAR`, `INDEMNIZACIÓN ART. 212`.
- `abg_tipo_hecho` ("Tipo de hecho"): **cambió de `type: 'text'` a `type: 'select'`** con 5
  opciones — `DOBLE INDEMNIZACIÓN`, `INEXISTENCIA DE VÍNCULO LABORAL`, `DESAFUERO`,
  `CONSIGNACIÓN LABORAL`, `EMPLEADO FERROBAIRES`. En DEMANDA_CIVIL sigue siendo texto libre.

## formularios.ts — LANZAMIENTO_JUDICIALIZADO.mesa (MATRIZ SACO)

- `mesa_tipo_lanzamiento` ("Tipo de lanzamiento"): campo nuevo, `type: 'select'`, opciones
  `['Operativo', 'Comercial']`, ubicado justo después de `mesa_juicio`. Determina el circuito de
  estados (split Operativo/Comercial, ver Sección 13 de `CLAUDE.md`). Se completa una única vez
  desde el modal "Iniciar Juicio" (campo obligatorio para ese tipo origen) y queda bloqueado en
  `DatosTab` apenas tiene valor (`disabled` + estilo gris, chequeado por `campo.id ===
  'mesa_tipo_lanzamiento'`, no por un flag genérico de formulario).

## Reglas de formularios

- IDs campo mesa: prefijo `mesa_`
- IDs campo abogado: prefijo `abg_`
- OFICIO en área PENAL → usar `form.variante_penal`
- Campos con `dependsOn`: ocultos por defecto
