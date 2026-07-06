# src/data/ — Catálogos y datos mock

## Archivos

| Archivo | Contenido | Fuente |
|---------|-----------|--------|
| `catalogos.ts` | Todos los catálogos con IDs oficiales | Tablas Codificadoras Excel |
| `formularios.ts` | Campos por tipo (mesa + abogado) | FORMULARIOS.md |
| `usuarios.ts` | 32 usuarios reales con roles y asignaciones | Roles.xlsx |
| `expedientes.mock.ts` | Datos de ejemplo para el prototipo — ver mocks disponibles abajo | Creado manualmente |
| `estadosProcesales.ts` | Estados y tareas por tipo de gestión | Diseño funcional |
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

DEMANDA_CIVIL tiene el ciclo completo:
ASIGNADO → INICIO → TRABA_LITIS → EN_PRUEBA → ALEGATOS → SENTENCIA → CERRADO

El estado ASIGNADO no tiene tareas — avanza desde Acciones → Cambiar estado.
Los demás estados tienen tareas que deben completarse para avanzar.

```ts
import { getEstadosProcesales, getEstadoProcesal } from './estadosProcesales'
const estados = getEstadosProcesales('DEMANDA_CIVIL')
const estado = getEstadoProcesal('DEMANDA_CIVIL', 'INICIO')
```

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

`EXPEDIENTES_MOCK` — 10 actuaciones basadas en el flujo real del prototipo. Se exporta también como
`EXPEDIENTES_ABOGADO` (alias de compatibilidad). El store carga `expedientes: EXPEDIENTES_MOCK`.

**Regla clave — `estado`/`estadoProcesal` usan el CÓDIGO del catálogo, no el label:**
- Tipos con flujo (`getEstadosProcesales` los mapea): usar el `codigo` exacto (`EN_PRUEBA`, `TRABA_LITIS`, `ACUERDO_EXTRAJUDICIAL`, etc.), NO el label con tildes.
- Área PENAL (cualquier tipo): el detalle usa `getEtapasPenales` → códigos `ASIGNADO`/`EN_ANALISIS`/`ACEPTADO`/`RECHAZADO`/`INSTRUCCION`/`JUICIO`/`EJECUCION_PENAL`/`ARCHIVO`.
- Tipos sin catálogo de flujo (OFICIO, CARTA_DOC, MEDIACION, SECLO): usan los labels libres de `ESTADOS_POR_TIPO` (`'EN ANÁLISIS'`, `'RESPONDIDO'`, etc.).
- Cada MOVIMIENTO del timeline lleva `estadoExpediente` = el código destino de esa transición.

| # | ID | Tipo | Área | Estado (código) | Letrado | Causa / rol |
|---|----|------|------|-----------------|---------|-------------|
| 01 | C-0001/2023 | DEMANDA_CIVIL | CIVIL | EN_PRUEBA | CASANO UR_004 | **45.201/2023 · Principal** · `es_juicio_iniciado`, vínculo→P-0001 |
| 02 | C-0004/2023 | OFICIO | CIVIL | EN ANÁLISIS | CASANO UR_004 | 45.201/2023 · secundario |
| 03 | C-0007/2024 | OFICIO | CIVIL | RESPONDIDO | CASANO UR_004 | 45.201/2023 · secundario |
| 04 | L-0002/2022 | DEMANDA_LABORAL | LABORAL | TRABA_LITIS | PIRES UR_012 | **78.910/2022 · Principal** · tarea vencida |
| 05 | L-0005/2022 | OFICIO | LABORAL | EN ANÁLISIS | PIRES UR_012 | 78.910/2022 · secundario |
| 06 | C-0009/2024 | COBRO_CANON | CIVIL | ACUERDO_EXTRAJUDICIAL | FERRARI UR_007 | suelta (ciclo A) |
| 07 | L-0008/2023 | DEMANDA_LABORAL | LABORAL | SENTENCIA | MOLINELLI UR_010 | suelta · `es_principal` (juicio, badge PJN) |
| 08 | P-0001/2024 | QUERELLA | PENAL | INSTRUCCION | DESIDERI UR_019 | suelta · vínculo→C-0001 (mismo siniestro) |
| 09 | P-0002/2023 | DEFENSA_PENAL | PENAL | ACEPTADO | BIONDI UR_023 | suelta |
| 10 | P-0003/2024 | QUERELLA | PENAL | EN_ANALISIS | PRINOTTI UR_024 | suelta · tarea vencida |

**Agrupación por causa:** los expedientes con el mismo `numero_causa` se agrupan en bandeja (`BandejaAbogado`/`BandejaArea`); el que tiene `es_principal: true` muestra el badge verde "Principal · PJN". Grupo 1 = causa `45.201/2023` (3 exp, principal C-0001, CASANO). Grupo 2 = causa `78.910/2022` (2 exp, principal L-0002, PIRES). Las 5 sueltas tienen `numero_causa` único o `null`.

**Vínculos entre áreas:** C-0001/2023 (civil) ↔ P-0001/2024 (penal) — mismo siniestro, bidireccional (aparece en el tab "Vinculados").

**Letrados:** IDs reales de `usuarios.ts` (CASANO UR_004, PIRES UR_012, FERRARI UR_007, MOLINELLI UR_010 civil/laboral; DESIDERI UR_019, BIONDI UR_023, PRINOTTI UR_024 penal por línea). El usuario por defecto del store es LOPEZ UR_018 (referente) — para ver "Mis actuaciones" de letrado, cambiar a CASANO UR_004.

**Semáforo de vencimientos resultante** (fechas relativas con `addDays`): 2 vencidos (L-0002, P-0003), 2 por-vencer <7d (C-0004, P-0001), 2 por-vencer <30d (C-0001, L-0005), 4 sin alerta.

**`TAREAS_MAP_INICIAL`** (exportado del mock, cargado por el store como `tareasMap`): tareas del sub-estado activo de las 3 actuaciones con flujo civil/laboral/ciclo-A:
- `C-0001/2023__EN_PRUEBA` — incluye una tarea con `fecha_aviso: addDays(0)` (aviso hoy) → alimenta el panel "Tareas hoy" del dashboard de CASANO.
- `L-0002/2022__TRABA_LITIS` — tarea vencida (`fechaVencimiento: addDays(-5)`).
- `C-0009/2024__ACUERDO_EXTRAJUDICIAL` — 2 cumplidas + 1 en curso.

Helper `tarea(id, nombre, over?)` en el mock completa el shape de `Tarea` con defaults.

**Documentos en el mock:** todos los documentos tienen campo `id` obligatorio (`DOC_..._001`). Actualmente las 10 actuaciones tienen `documentos: []`.

**Exports de infraestructura conservados** (no son actuaciones de ejemplo): `QUEUE_MESA`, `CARTA_SUCESO_QUEUE`, `CAUSAS_PENALES`, `ESTADOS_POR_TIPO`.

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
- `abg_tipo_solicitud` — multiselect con 6 opciones:
  Solicitud de información / Solicitud de filmaciones / Solicitud de intervención /
  Citaciones / Solicitud de asistencia a MARC / Otros
- `abg_num_siniestro` — "Accidente Ferroviario (N° Siniestro)", type text, mono

## Reglas de formularios

- IDs campo mesa: prefijo `mesa_`
- IDs campo abogado: prefijo `abg_`
- OFICIO en área PENAL → usar `form.variante_penal`
- Campos con `dependsOn`: ocultos por defecto
