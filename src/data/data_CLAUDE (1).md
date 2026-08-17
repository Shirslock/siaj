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
| `solicitudesPenales.ts` | Config de sub-formularios por tipo de `abg_tipo_solicitud` (OFICIO Penal) | MATRIZ SACO |
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

**Recurso de Queja** ya no es un nodo lineal — `REF.siguiente` va directo a
`EJECUCION_SENTENCIA`. Es un checklist paralelo (`TAREAS_RECURSO_QUEJA`, exportado desde este
mismo archivo), activable con `toggleQuejaEnTramite` del store cuando `estadoProcesal` es
`REF` o `EJECUCION_SENTENCIA`.

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
ejemplo previas. `EXPEDIENTES_MOCK` tiene 4 actuaciones base, pensadas para recorrer los flujos
MATRIZ SACO manualmente. Se exporta también como `EXPEDIENTES_ABOGADO` (alias de compatibilidad).
El store carga `expedientes: EXPEDIENTES_MOCK`. `QUEUE_MESA` está vacío (`[]`).

| # | ID | Tipo | Área | Estado (código) | Letrado | Causa / rol |
|---|----|------|------|-----------------|---------|-------------|
| 01 | C-0100/2026 | DEMANDA_CIVIL | CIVIL | ASIGNADO | CASANO UR_004 | sin `numero_causa` — recorrer manualmente |
| 02 | L-0100/2026 | DEMANDA_LABORAL | LABORAL | ASIGNADO | PIRES UR_012 | sin `numero_causa` — recorrer manualmente |
| 03 | C-0043/2026 | LANZAMIENTO | CIVIL | JUICIO_INICIADO | CASANO UR_004 | sin `numero_causa` — probar botón "Iniciar Juicio" → crea `LANZAMIENTO_JUDICIALIZADO` nuevo |
| 04 | P-0100/2026 | OFICIO (variante_penal) | PENAL | EN ANÁLISIS | DESIDERI UR_019 | `numero_causa: 'IPP-2026-00845'` — probar `abg_tipo_solicitud` (10 tipos + sub-formularios en modal): trae "Citaciones a Testimonial" completo y "Solicitud de Averiguación de Paradero..." sin completar (badge) |

Las 3 primeras tienen `numero_causa: null` y por lo tanto **`es_principal: false`** (regla:
nunca `es_principal: true` sin número de causa real — ver Sección 7 de `CLAUDE.md`). P-0100/2026
sí tiene causa real pero también `es_principal: false` (no forma parte de ningún grupo-causa de
ejemplo, no tiene vínculos).

**Regla clave — `estado`/`estadoProcesal` usan el CÓDIGO del catálogo, no el label:**
- Tipos con flujo (`getEstadosProcesales` los mapea): usar el `codigo` exacto (`EN_PRUEBA`, `TRABA_LITIS`, `ACUERDO_EXTRAJUDICIAL`, etc.), NO el label con tildes.
- Área PENAL (cualquier tipo): el detalle usa `getEtapasPenales` → códigos `ASIGNADO`/`EN_ANALISIS`/`ACEPTADO`/`RECHAZADO`/`INSTRUCCION`/`JUICIO`/`EJECUCION_PENAL`/`ARCHIVO`.
- Tipos sin catálogo de flujo (OFICIO, CARTA_DOC, MEDIACION, SECLO): usan los labels libres de `ESTADOS_POR_TIPO` (`'EN ANÁLISIS'`, `'RESPONDIDO'`, etc.).
- Cada MOVIMIENTO del timeline lleva `estadoExpediente` = el código destino de esa transición.

**`TAREAS_MAP_INICIAL`** ahora es `{}` (vacío) — el store lo carga como `tareasMap` inicial, y
`TimelineTab` lo completa de forma lazy con `inicializarTareas(expId, estadoCodigo, tareas)` a
medida que se navega por los estados. `ASIGNADO` no tiene tareas en ningún ciclo (`tareas: []`).

Helper `tarea(id, nombre, over?)` — **removido** del mock junto con `TAREAS_MAP_INICIAL`
poblado (unused-locals); si se vuelve a necesitar poblar tareas de ejemplo, reintroducirlo.

**Documentos en el mock:** todos los documentos tienen campo `id` obligatorio (`DOC_..._001`). Las 3 actuaciones actuales tienen `documentos: []`.

**Exports de infraestructura conservados** (no son actuaciones de ejemplo, no se tocaron):
`CARTA_SUCESO_QUEUE`, `CAUSAS_PENALES`, `ESTADOS_POR_TIPO` — mocks del módulo Penal y catálogo
de estados libres, fuera de alcance de la reconstrucción MATRIZ SACO.

**Ejemplo Nueva Querella:** el expediente `P-0019/2024` (Carta Suceso) que documentaba el flujo
"Nueva Querella" del menú `+` de DetalleExpediente **ya no existe** en el mock — se eliminó junto
con el resto de actuaciones de ejemplo. El mecanismo (`confirmarNuevaQuerella`, ver
`pages_CLAUDE.md`) no se tocó, solo falta un expediente `CARTA_SUCESO` de ejemplo para volver a
probarlo manualmente.

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
- `abg_tipo_solicitud` — multiselect con **10 opciones** (`TIPOS_SOLICITUD_PENAL` en
  `solicitudesPenales.ts`, reemplazó las 6 opciones anteriores):
  Solicitud de Información / Solicitud de Filmaciones Estáticas / Solicitud de Filmaciones
  Dinámicas / Notificación Conciliación / Notificación Reparación Integral / Notificación
  Suspensión de Juicio a Prueba (Probation) / Solicitud de Intervención / Citaciones a
  Testimonial / Citaciones a Indagatoria / Solicitud de Averiguación de Paradero (Búsqueda de
  Personas)
- `abg_num_siniestro` — "Accidente Ferroviario (N° Siniestro)", type text, mono
- `abg_solicitudes_detalle` — **no es un campo de `FORMULARIOS`**, se guarda directo en
  `campos_abogado` (tipado `Record<string, unknown>`, sin interfaz propia en `types/index.ts`).
  Ver sección siguiente.

### Sub-formularios de `abg_tipo_solicitud` (`solicitudesPenales.ts` + `ModalSolicitudPenal.tsx`)

Cada uno de los 10 tipos tiene su propio set de campos (`CONFIG_SOLICITUDES_PENALES[tipo]`),
completado en un modal aparte en vez de inline en `DatosTab`:

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

- **Solicitud de Averiguación de Paradero** es el único con `camposCondicionales`: el select
  "Tipo de Requerimiento" (`Colaboración` / `Información`) determina qué campos extra aparecen
  (`pase_areas` vs `memo_ggo` + `respuesta_area`).
- El detalle completado vive en `campos_abogado.abg_solicitudes_detalle: Record<string, {
  campos: Record<string,string>, archivos: Record<string,string[]> }>` — key = el string exacto
  del tipo (mismo valor que aparece en el array de `abg_tipo_solicitud`).
- `ModalSolicitudPenal` (`src/components/expedientes/ModalSolicitudPenal.tsx`) lee/escribe ese
  bloque vía `actualizarCampoAbogado(expId, 'abg_solicitudes_detalle', {...actual, [tipo]:
  {campos, archivos}})` — guarda inmediato al hacer click en "Guardar" del modal, independiente
  del modo edición del resto de `DatosTab`.
- Archivos adjuntos usan `agregarDocumento()` del store igual que el resto del sistema — quedan
  en la tab Documentos de la actuación, no hay repositorio separado por solicitud.
- Integración en `DatosTab.tsx`: debajo de la fila `abg_tipo_solicitud` se lista cada tipo
  seleccionado con badge "· Sin completar" (si `abg_solicitudes_detalle[tipo]` no tiene campos)
  y botón "Ver" que abre el modal. Al elegir un tipo **nuevo** en el multiselect (sin entrada
  previa en `abg_solicitudes_detalle`) el modal se abre automáticamente.

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
