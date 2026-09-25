# Delta de cambio — Finalización del antecedente en el flujo "Iniciar Juicio"

> **Propósito de este documento.** Insumo autocontenido para redactar el Delta de cambio formal
> (Claude web) y las Historias de Usuario asociadas. Describe qué había antes, qué se cambia, qué
> se decidió y por qué, y qué queda fuera de alcance.
>
> - **Módulo:** Detalle de actuación — flujo "Iniciar Juicio" (Civil / Laboral) + Timeline
> - **Sistema:** SIAJ — Sistema Integral de Asuntos Jurídicos (SOFSE)
> - **Branch de implementación:** `feat/finalizacion-antecedente`
> - **Fecha de definición:** 2026-09-24
> - **Estado:** implementado y compilando en la rama. Sin merge a `develop` ni a `main`, y
>   **sin prueba funcional en navegador** (ver §9).
> - **Trazabilidad:** `d16c8c5` (matriz de estados), `51787d7` (actuación derivada + cascada +
>   validación), `1562c01` (timer de impulsorio), `ec4c459` (chore ajeno: `.gitignore`).

---

## 1. Situación anterior (antes de este cambio)

Cuando una actuación administrativa pasaba por **"Iniciar Juicio"**, el sistema tenía dos
comportamientos distintos según el tipo de origen:

| Tipo origen | Qué hacía `confirmarIniciarJuicio()` |
|---|---|
| `LANZAMIENTO` | Creaba una actuación **nueva** (`LANZAMIENTO_JUDICIALIZADO`) y dejaba la original como antecedente |
| Los otros 6 (`COBRO_CANON`, `RECLAMO_CONTRAT`, `RECUPERO`, `EJECUCION_GAR`, `CONSIGNACION`, `DESAFUERO`) | **Parcheaba el mismo expediente**: antecedente y juicio eran la misma fila |

Sobre eso, dos problemas encadenados:

1. **El antecedente nunca finalizaba.** `confirmarIniciarJuicio()` no modificaba `estado` ni
   `estadoProcesal` del antecedente en ninguna de las dos ramas — solo le ponía el flag
   `es_juicio_iniciado`. Al cerrarse el principal en PJN, el antecedente quedaba colgado en
   "Juicio iniciado" (clasificado ACTIVO) para siempre. La matriz de estados
   `docs/Nuevos_Finalizados.xlsx` tampoco preveía un estado terminal para esos 7 tipos.
2. **No había forma de saber si el antecedente quedaba incompleto.** Se podía cerrar el juicio
   con tareas del antecedente sin resolver, sin ninguna señal.

> **Nota sobre el origen del problema.** No fue un error de implementación: el equipo de
> desarrollo construyó exactamente lo que se había especificado. La spec original nunca definió
> el estado final del antecedente.

---

## 2. Necesidad

Que el antecedente tenga un cierre real y trazable, y que el letrado sepa —sin quedar
bloqueado— si lo está cerrando con trabajo pendiente.

---

## 3. Cambio solicitado

1. **Iniciar Juicio siempre crea una actuación nueva**, para los 7 tipos. El antecedente queda
   como actuación separada.
2. **Estado final del antecedente**, alcanzado en cascada al finalizar la actuación derivada.
3. **Advertencia de tareas pendientes** del antecedente, al finalizar la derivada y al archivar
   el antecedente.
4. **El timer de impulsorio corre en la actuación derivada**, y toda actividad nueva ahí lo
   resetea automáticamente.

---

## 4. Decisiones tomadas (y alternativas descartadas)

| Decisión | Por qué | Alternativa descartada |
|---|---|---|
| Iniciar Juicio **siempre** crea actuación nueva | Es lo que ocurre en la realidad: al judicializar nace una demanda parte actora (civil o laboral) o un lanzamiento judicializado. El parcheo del mismo expediente era una simplificación del prototipo | Dejar los 6 tipos parcheando el mismo expediente — se descartó porque sin antecedente separado la validación de tareas no tiene sobre qué aplicarse |
| El antecedente finaliza **en cascada automática** | Un solo click del letrado. El antecedente no tiene vida propia después de judicializado: su cierre es consecuencia del cierre del juicio | (a) Finalización manual con la demanda bloqueada hasta cerrarlo — agregaba un paso sin aportar decisión; (b) tratar "Juicio iniciado" como archivado — cerraría el antecedente al **iniciar** el juicio, no al terminarlo, perdiendo el período en que el antecedente sigue siendo consultable |
| La validación de tareas **advierte pero no bloquea** | Pedido explícito del usuario: el letrado tiene que poder cerrar igual | Bloqueo duro — se descartó por trabar al letrado ante tareas que pueden haber perdido sentido |
| Se validan **solo las tareas del estado actual** | Es el criterio que ya usa el resto del sistema para avanzar de estado | Validar todas las tareas de todos los estados recorridos — demasiado estricto para un cierre |
| `no_procedente` cuenta como **resuelta** | Criterio ya establecido en la UI existente: *"Completá o marcá como 'No procedente' todas las tareas del estado actual"* | Contarla como pendiente — contradecía el texto que el sistema ya le muestra al letrado |
| El timer de impulsorio **pasa a la derivada** y es automático | Regla de negocio: cualquier actividad de una demanda parte actora funciona como impulsoria. El antecedente ya no impulsa nada | Mantener el checkbox manual — quedaba sin sentido si toda actividad impulsa |
| El **Lanzamiento judicializado** va igual que las demandas | Decisión del usuario: una sola regla para las tres actuaciones derivadas | Checkbox manual solo para lanzamientos, o lanzamientos sin timer |
| Solo **"Nueva actividad"** resetea el timer | Una solicitud es un pedido interno, no un acto procesal que impulse la causa | Incluir solicitudes y actividades de sistema (cambios de estado, finalización) |

---

## 5. Alcance funcional

### 5.1 Tipos alcanzados

Los 7 tipos de antecedente de `MAPA_INICIAR_JUICIO`, y las 3 actuaciones derivadas:

| Antecedente | Deriva en |
|---|---|
| Cobro de cánones, Reclamo a contratistas, Recuperos, Ejecución de pólizas de caución | `DEMANDA_CIVIL_ACTORA` |
| Consignaciones, Desafueros | `DEMANDA_LABORAL_ACTORA` |
| Lanzamientos | `LANZAMIENTO_JUDICIALIZADO` |

### 5.2 Fuera de alcance

- **Flujo penal** ("Iniciar Querella" desde una Carta SAE): no se tocó.
- **Vínculos y UI del antecedente en la derivada**: se agregó el campo `antecedente_id`, pero no
  se creó `VinculoExpediente` ni pantalla que muestre el antecedente desde la derivada.
- **Migración de datos**: las derivadas creadas antes de `1562c01` no tienen el flag del timer.
  Es mock en memoria, no se migró nada.
- **Solicitudes y actividades de sistema** como movimiento impulsorio (ver §4).

---

## 6. Comportamiento esperado

### 6.1 Iniciar Juicio

1. El letrado abre una actuación en estado "Juicio iniciado" y usa **+ → Iniciar Juicio**.
2. Se crea una actuación nueva del tipo que corresponde, en estado `ASIGNADO`, con el set
   completo de `campos_mesa` del formulario, `antecedente_id` apuntando al origen, y el timer de
   impulsorio arrancando ese día.
3. El antecedente queda con `es_juicio_iniciado`, la causa común y `es_principal: false` —
   la derivada pasa a ser la principal de la causa si hay número de causa real.
4. Se navega a la actuación nueva.

### 6.2 Finalizar la actuación derivada

1. El letrado finaliza la derivada y elige la causal.
2. **Si el antecedente tiene tareas pendientes en su estado actual**, aparece el modal
   *"Tareas pendientes"* listándolas, con **Volver** / **Continuar igual**.
3. Al confirmar, la derivada queda finalizada y el antecedente pasa a **`FINALIZADO`**
   (archivado), con una actividad en su timeline que deja constancia de la cascada y la causal.
4. Si el antecedente ya estaba archivado (Devuelto al sector, o Finalizado), no se lo pisa.

### 6.3 Archivar el antecedente

Misma advertencia blanda al llevar el antecedente a un estado archivado (p. ej. "Devuelto al
sector requirente").

### 6.4 Timer de impulsorio

Corre en la actuación derivada. Toda actividad cargada desde **Nueva actividad** la marca como
movimiento impulsorio y resetea el plazo desde la fecha de esa actividad (se respeta la carga
retroactiva). Ya no hay checkbox: el letrado no decide si impulsa o no.

---

## 7. Detalle técnico del delta

| Archivo | Cambio |
|---|---|
| `docs/Nuevos_Finalizados.xlsx` | Fila **"Finalizado \| ARCHIVADO"** en los 7 tipos; renumerada la columna de índice (33→72) |
| `src/types/index.ts` | `antecedente_id?: string` en `Expediente` — vive en la derivada, es la única fuente del vínculo |
| `src/data/estadosProcesales.ts` | Constante `FINALIZADO_ANTECEDENTE` (`esArchivado: true`, sin tareas) agregada a los 7 arrays de estados |
| `src/utils/tareasPendientes.ts` | **Nuevo.** `esTareaPendiente()` (`sin_estado` / `en_curso`) y `getTareasPendientesEstadoActual()`; si el estado nunca se inicializó en `tareasMap`, usa las tareas por defecto del estado |
| `src/pages/DetalleExpediente/DetalleExpediente.page.tsx` | `confirmarIniciarJuicio()` generalizado; `finalizarAntecedente()` nuevo; `confirmarCausal()` y `confirmarEstado()` con la advertencia; modal "Tareas pendientes" |
| `src/pages/DetalleExpediente/tabs/TimelineTab.tsx` | Eliminado el checkbox de movimiento impulsorio (y su estado y su cartel); toda actividad nueva de una derivada impulsa |

---

## 8. Riesgos y consideraciones

- **El bloqueo duro por tareas se relajó para los destinos archivados de los 7 tipos.** El select
  de "Cambiar estado" impedía avanzar con tareas en curso; para que archivar el antecedente
  pudiera ser una advertencia blanda hubo que eximir esos destinos. El resto de los avances sigue
  bloqueando como antes.
- **`FINALIZADO` no es alcanzable a mano** en los 7 tipos: solo se llega por cascada. Si en algún
  momento se necesita cerrar un antecedente sin juicio, hay que habilitarlo explícitamente.
- **El vínculo es unidireccional.** La derivada conoce a su antecedente; el antecedente no conoce
  a su derivada. La cascada funciona porque se dispara desde la derivada.
- **Actuaciones mock preexistentes** de los 6 tipos que antes se parcheaban no tienen
  `antecedente_id`, así que no participan de la cascada.
- **El antecedente ya no resetea `fecha_ultimo_impulsorio`** al iniciar juicio — era parte del
  parcheo viejo y dejó de tener sentido al mudarse el timer.

---

## 9. Verificación

- `npx tsc --noEmit` y `npm run build` limpios.
- **Sin prueba funcional en navegador.** Queda pendiente verificar: el alta de la derivada para
  un tipo no-Lanzamiento, el modal de tareas pendientes en sus dos entradas, la cascada de
  finalización, y que el timer aparezca en la derivada y no en el antecedente.
- Sin tests automatizados: el proyecto no tiene suite para este flujo.

---

## 10. Documentación actualizada por este cambio

- `docs/Nuevos_Finalizados.xlsx` — matriz de estados con el estado terminal.
- `CLAUDE_root.md` y `claude-docs/CLAUDE_root.md` — flujo "Iniciar Juicio", timer de impulsorio y
  movimiento impulsorio.
- `claude-docs/pages_CLAUDE.md` — flujo de `confirmarIniciarJuicio`.
- `claude-docs/types_CLAUDE.md` — campo `antecedente_id`.
