# src/data/ — Catálogos y datos mock

## Archivos

| Archivo | Contenido | Fuente |
|---------|-----------|--------|
| `catalogos.ts` | Todos los catálogos con IDs oficiales | Tablas Codificadoras Excel |
| `formularios.ts` | Campos por tipo (mesa + abogado) | FORMULARIOS.md |
| `usuarios.ts` | 31 usuarios reales con roles y asignaciones | Roles.xlsx |
| `expedientes.mock.ts` | Datos de ejemplo para el prototipo — ver mocks disponibles abajo | Creado manualmente |
| `estadosProcesales.ts` | Estados y tareas por tipo de gestión | Diseño funcional |

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

| ID | Tipo | Estado procesal | Notas |
|----|------|-----------------|-------|
| C-0023/2026 | DEMANDA_CIVIL | EN_PRUEBA | Mock principal — timeline completo, cambios de estado, actividades |
| C-0025/2026 | COBRO_CANON | ASIGNADO | Para probar ciclos A (bifurcación EN_ANALISIS); abogado UR_004 |
| C-0026/2026 | DEMANDA_CIVIL | EN_PRUEBA | `es_juicio_iniciado: true`, `fecha_ultimo_impulsorio: '2026-03-25'` (timer activo); tarea con `fecha_aviso` para badge "Por vencer"; `tareasMap` pre-populado |
| P-0012/2026 | QUERELLA | — | Mock penal con TimelinePenal |
| C-0020/2025 | DEMANDA_CIVIL | CERRADO | Mock expediente cerrado |

**`tareasMap` inicial en el store:** pre-populado para `C-0026/2026__EN_PRUEBA` con 3 tareas demo (una en_curso con `fecha_aviso`, una cumplida, una sin_estado).

---

## Reglas de formularios

- IDs campo mesa: prefijo `mesa_`
- IDs campo abogado: prefijo `abg_`
- OFICIO en área PENAL → usar `form.variante_penal`
- Campos con `dependsOn`: ocultos por defecto
