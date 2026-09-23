# Delta de cambio — Montos múltiples (N pares moneda+monto) por campo

> **Propósito de este documento.** Insumo autocontenido para redactar el Delta de cambio formal
> (Claude web) y las Historias de Usuario asociadas. Describe qué había antes, qué se cambia, qué
> se decidió y por qué, y qué queda fuera de alcance. Extiende y reemplaza en parte a
> [`DELTA_Tipo_Moneda_Montos.md`](./DELTA_Tipo_Moneda_Montos.md) (ver §4).
>
> - **Módulo:** Datos Maestros de la actuación (formularios Mesa / Letrado) + Alta de actuación +
>   Panel Gerencia (Dashboard) + Previsión
> - **Sistema:** SIAJ — Sistema Integral de Asuntos Jurídicos (SOFSE)
> - **Branch de implementación:** `feat/montos-multiples`
> - **Fecha de definición:** 2026-09-22
> - **Estado:** implementado en `develop` (compila; pendiente de prueba funcional en la app y de
>   revisión del usuario — no se pudo probar en navegador en este entorno, ver §9)

---

## 1. Situación anterior (antes de este cambio)

Cada campo de dinero (`type: 'money'` + su campo hermano `<id>_moneda`, agregados en
`feat/tipo-moneda-montos`) permitía cargar **un único par moneda + monto** por actuación. Si una
causa tenía, por ejemplo, un reclamo principal en pesos y un rubro adicional en dólares, no había
forma de representarlo: solo entraba un valor.

## 2. Necesidad

El área legal pidió poder cargar **varios importes, cada uno con su propia moneda**, dentro del
mismo campo de monto (ej. "Monto reclamado" de una demanda con un rubro en ARS y otro en USD),
sin mezclar las monedas entre sí en ningún total.

## 3. Cambio solicitado

Que **cualquier campo de tipo money** admita **N pares moneda+monto**, con dos ajustes que el
usuario confirmó después de la primera entrega (ver §4 y §6):

1. **Máximo una fila por moneda** — no se puede repetir moneda dentro del mismo campo; el
   selector de cada fila no ofrece las monedas que ya usan otras filas, y "Agregar monto"
   desaparece cuando ya hay una fila por cada moneda disponible.
2. **Fila vacía → se descarta al guardar**, en vez de persistir como `$0`.

Un botón "Agregar monto" suma filas y un botón quita cada una (mínimo 1 fila siempre visible).
Se muestran todos los pares donde hoy se muestra el monto (detalle, Alta, Panel Gerencia). No se
suman entre sí montos de monedas distintas.

Más adelante, ya con la unicidad implementada, el usuario pidió además que **las monedas dejen de
estar hardcodeadas** y pasen a ser un catálogo editable desde Configuración → Tablas, igual que
los demás catálogos del sistema (ver §4 "Catálogo de monedas editable").

## 4. Decisiones tomadas (y alternativas descartadas)

| Tema | Decisión | Alternativas descartadas |
|---|---|---|
| Alcance | **Los 15 campos `money` existentes** (la misma tabla de `feat/tipo-moneda-montos`) pasan de `type:'money'` + campo hermano `<id>_moneda` a un único campo `type:'money_multi'` | Extender solo el monto principal (`mesa_monto`, el único que hoy llega a un KPI) — el usuario pidió explícitamente que aplique a los 15 |
| Modelo de datos | El valor del campo pasa a ser un **array** `{ moneda: Moneda; monto: number }[]` en vez de un escalar + campo hermano | Mantener el campo hermano `<id>_moneda` y convertirlo también en array paralelo — dos arrays sincronizados por índice es más frágil que un array de pares |
| Compatibilidad con datos viejos | Un valor guardado en el formato anterior (escalar en `campos[id]` + moneda en `campos[<id>_moneda]`) se **lee como una lista de 1 par**, vía `normalizarMontos()` — no se migra el mock/los datos guardados salvo un caso de ejemplo (ver §7) | Migración masiva de datos al abrir la app (no hay backend, no aplica) |
| Suma en KPIs | Se agrupa **por moneda** (`sumarMontosPorMoneda()`) y se muestra un total por cada moneda presente, nunca se mezclan | Convertir todo a una sola moneda con tipo de cambio (tema explícitamente fuera de alcance desde `feat/tipo-moneda-montos`) |
| Modal "Iniciar Juicio" | Se extiende al mismo patrón repetible (no es un campo `formularios.ts`, es un formulario ad-hoc) para no dejar `mesa_monto` con dos formas de carga distintas | Dejarlo con un solo par y envolver en array de 1 al guardar — se descartó porque el usuario pidió que "cualquier campo money" admita N pares, y `mesa_monto` es uno de los 15 |
| Previsión (`PrevisionTab`) | Sigue siendo ilustrativa ("a relevar con el negocio"); al ser `money_multi` ahora, proyecta **solo el primer par cargado** del campo base | Proyectar los N pares en paralelo — la pestaña ya está marcada como pendiente de definición de negocio, no se le agrega complejidad extra sin ese insumo |
| Unicidad de moneda | **Máximo una fila por moneda**, validada por **sigla** (no por posición ni por label) — el selector de cada fila excluye las monedas que usan las otras filas del mismo campo; sin merge automático si el usuario intenta duplicar | Permitir filas repetidas y sumarlas al mostrar/calcular — el usuario lo descartó explícitamente: "no hagas merge automático de filas" |
| Concepto por fila | **Descartado** — no se agrega un campo "concepto" a cada fila (ej. "gastos médicos", "honorarios") | El usuario lo planteó como posible mejora y lo bajó explícitamente: "queda descartada la idea... no va" |
| Fila vacía | **Se descarta al guardar** en los tres puntos de entrada (Alta, edición del detalle, modal Iniciar Juicio) — antes el modal ya lo hacía pero Alta/Detalle guardaban `0` | Dejarlo como estaba (inconsistente entre pantallas) — el usuario lo marcó como bug a unificar |
| Catálogo de monedas | **Editable desde Configuración → Tablas → Monedas**, mismo patrón que los demás catálogos (`id`/`label`/`activo`, soft-delete). `Moneda` pasa de union literal a `string`; los helpers de `format.ts` reciben el catálogo como parámetro en vez de tenerlo hardcodeado | Resolver el símbolo/validación en cada componente en vez de en `format.ts` — el usuario lo descartó explícitamente: "desparrama la lógica y es justo lo que queremos evitar" |
| Moneda desactivada | Sigue en el array (`activo:false`), se excluye de los selectores para filas **nuevas**, pero `formatMonto`/`simboloMoneda` la siguen resolviendo para no romper el render de montos **ya cargados** — nunca se borra, mismo criterio que `desactivarItem` en el resto de los catálogos del repo | Borrar la moneda del catálogo — ningún catálogo del repo soporta borrado hoy, y hacerlo acá rompería el render de montos históricos |
| Moneda local (Previsión) | Sigla fija `'ARS'` en código (`MONEDA_LOCAL`), no la primera del catálogo por posición | Que dependa del orden del catálogo — reordenar monedas en Configuración no debe cambiar qué moneda es "la local" para el índice de inflación |

## 5. Alcance funcional

### 5.1 Campos alcanzados

Los mismos 15 campos de la tabla 5.1 de `DELTA_Tipo_Moneda_Montos.md` (Carta Documento,
Mediaciones ×2, SECLO, Cobro de Cánones ×2, Reclamo a Contratistas, Recuperos, Consignaciones,
Ejecución de Pólizas, Defensa Civil, Demanda Civil ×2, Demanda Laboral ×2), más el campo ad-hoc
"Monto de la Demanda" del modal "Iniciar Juicio" (que escribe en `mesa_monto`, uno de los 15).

### 5.2 Fuera de alcance

- **Circuito penal:** igual que en el cambio anterior, los montos de Solicitudes/sub-actividades
  penales siguen sin campo de moneda ni de N pares.
- **Conversión de monedas / tipo de cambio:** sigue sin implementarse; los totales por KPI se
  agrupan por moneda, nunca se convierten ni se mezclan.
- **Previsión con N pares:** la solapa Previsión solo proyecta el primer par del campo base (ver
  decisión en §4); proyectar cada par por separado queda para cuando el negocio defina la lógica
  real de esa pestaña.

## 6. Comportamiento esperado

1. **Carga (Alta y edición).** Cada campo money muestra al menos una fila `[moneda] [monto]`. El
   botón "Agregar monto" suma una fila con la primera moneda activa que todavía no está en uso;
   cada fila con más de una tiene un botón para quitarla, pero nunca se puede llegar a 0 filas.
   El selector de moneda de cada fila **no ofrece** las monedas que ya usan otras filas del mismo
   campo. El botón "Agregar monto" **desaparece** cuando ya hay una fila por cada moneda activa
   del catálogo.
2. **Fila vacía.** Si el usuario agrega una fila y la deja sin importe, se descarta sola al
   guardar — no queda persistida como `$0`. Esto es igual en Alta, en la edición del detalle y en
   el modal "Iniciar Juicio".
3. **Datos viejos.** Una actuación cargada antes de este cambio (escalar + campo hermano
   `<id>_moneda`, o directamente sin moneda) se sigue viendo igual: una sola fila con ese valor y
   esa moneda (o la moneda local si no tenía moneda guardada). Si por algún dato corrupto
   aparecieran dos filas de la misma moneda, se descarta la repetida (queda la primera) sin romper
   la pantalla.
4. **Consulta (solapa Datos).** Se listan todos los pares cargados, cada uno con el símbolo que
   tenga configurado su moneda.
5. **Panel Gerencia.** El KPI "Monto expuesto" muestra un total por cada moneda presente en los
   `mesa_monto` de las actuaciones (ej. `$4.9M · US$3K`), sin convertir ni mezclar.
6. **Previsión.** Si el campo base tiene varios pares, se usa el primero para el cálculo
   ilustrativo existente (sin cambios en la lógica de actualización en sí).
7. **Catálogo de monedas (Configuración → Tablas → Monedas).** El referente puede dar de alta una
   moneda nueva (sigla, nombre, símbolo) sin tocar código, y esa moneda aparece de inmediato como
   opción en todos los campos money_multi de la app. Puede desactivar una moneda — deja de
   ofrecerse para filas nuevas, pero los montos que ya la usan se siguen viendo y formateando
   igual. No hay forma de borrar una moneda (igual que el resto de los catálogos del sistema).

## 7. Detalle técnico del delta

| Archivo | Cambio |
|---|---|
| `src/types/index.ts` | Nuevo valor `'money_multi'` en `TipoCampo` (se conserva `'money'` por compatibilidad, ya sin uso en `formularios.ts`); nuevo `MonedaItem extends CatalogoItem` (agrega `simbolo`) |
| `src/data/formularios.ts` | Los 15 campos `{id, type:'money'}` + `{id}_moneda` (`type:'select'`) se colapsan en un único `{id, type:'money_multi'}` |
| `src/data/catalogos.ts` | Nuevo `MONEDAS_INICIAL: MonedaItem[]` — dato semilla ARS/USD/EUR (activos), único lugar con las siglas "de fábrica" |
| `src/store/configuracion.store.ts` | Nuevo slice `monedas: MonedaItem[]`, sembrado desde `MONEDAS_INICIAL`; se edita con las acciones genéricas `agregarItem`/`editarItem` que ya usa cualquier catálogo |
| `src/pages/Configuracion/tablas.config.ts` | Nuevo `tipo: 'moneda'` en `TipoTablaConfig`; nueva tabla "Monedas" (`storeKey: 'monedas'`) en el grupo "Configuración Base" |
| `src/pages/Configuracion/CatalogoPanel.tsx` | Nuevo componente `VistaMoneda` (mismo patrón que `VistaSimple`, con el campo Símbolo agregado y `id` = sigla en vez de código interno) |
| `src/utils/format.ts` | Ya no tiene ninguna moneda hardcodeada. `Moneda` pasa de union literal (`'ARS'\|'USD'\|'EUR'`) a `string`. Todos los helpers de moneda reciben el catálogo (`MonedaItem[]`) como parámetro: `formatMonto`, `simboloMoneda`, `normalizarMoneda`, `normalizarMontos(valorCampo, monedaLegacy, catalogo)`, `opcionesMoneda(catalogo)`, `opcionesMonedaDisponibles(pares, indexActual, catalogo)` (excluye monedas ya usadas por otras filas), `proximaMonedaLibre(pares, catalogo)`. Sin dependencia del catálogo: `sumarMontosPorMoneda`, `limpiarMontos` (descarta filas con `monto === 0` al guardar), `abreviarMonto` |
| `src/components/expedientes/FormularioDinamico.tsx` | Rama `campo.type === 'money_multi'`: filas repetibles moneda+monto, lee `monedas` de `useConfiguracionStore()`, botón "Agregar monto" condicionado a que quede alguna moneda libre (motor de Alta) |
| `src/pages/DetalleExpediente/tabs/DatosTab.tsx` | `valorDisplay` muestra todos los pares; `renderCampoInput` agrega la misma UI repetible; `save()` filtra filas vacías (`limpiarMontos`) de todos los campos `money_multi` antes de persistir |
| `src/pages/DetalleExpediente/DetalleExpediente.page.tsx` | El modal "Iniciar Juicio" pasa de `monto` + `monto_moneda` (string) a `montos: ParMoneda[]` con la misma UI repetible (unicidad + "Agregar monto" condicional); al confirmar, escribe `mesa_monto` como array filtrando filas vacías |
| `src/pages/Dashboard/Dashboard.page.tsx` | El KPI "Monto expuesto" (antes "Monto expuesto (ARS)") agrupa `mesa_monto` de todas las actuaciones por moneda con `sumarMontosPorMoneda` y muestra un total abreviado por cada una, usando `simboloMoneda`/`abreviarMonto` del catálogo leído de `useConfiguracionStore()` |
| `src/pages/DetalleExpediente/tabs/PrevisionTab.tsx` | Lee `monto_reclamado` / `monto_acuerdo` con `normalizarMontos` (pasando el catálogo) y usa el primer par como monto base |
| `src/data/expedientes.mock.ts` | `mesa_monto` de `C-0100/2026` migrado a `[{moneda:'ARS', monto:4850000}, {moneda:'USD', monto:3200}]` como demo del campo repetible; `L-0100/2026` se dejó con el escalar viejo (`2100000`, sin campo hermano) a propósito, para probar la compatibilidad hacia atrás |

## 8. Riesgos y consideraciones

- **`PrevisionTab` con N pares:** al proyectar solo el primer par, si el usuario carga el monto
  extranjero primero y el de pesos después, la previsión (que solo aplica a ARS) puede mostrar el
  aviso de "no aplica" aunque exista un par en pesos más abajo en la lista. Es una limitación
  conocida de una pestaña ya marcada como ilustrativa; no se resuelve hasta que el negocio defina
  la lógica real de Previsión.
- **Reportes externos (Power BI / SIGEJ):** cualquier consumo externo de `campos_mesa`/`campos_abogado`
  que hoy lea el escalar viejo de estos 15 campos debe actualizarse para leer el array de pares.
- **Pérdida de chequeo de tipos en compilación.** `Moneda` pasa de union literal a `string` porque
  el catálogo es editable en runtime — TypeScript ya no avisa en compilación si en algún lado se
  escribe una sigla inexistente a mano. Se compensa con validación en runtime
  (`normalizarMoneda`/`opcionesMonedaDisponibles` contra el catálogo) y con que `formatMonto`/
  `simboloMoneda` nunca rompan ni "traguen" el importe ante una sigla desconocida: muestran la
  sigla tal cual en vez de fallar.
- **Renombrar una moneda no rompe datos** porque la unicidad y el guardado se validan por `id`
  (sigla), nunca por `label` — cambiar "Dólares" por "Dólares estadounidenses" en Configuración no
  afecta ningún monto ya cargado con `moneda: 'USD'`.
- **Borrar (no solo desactivar) una moneda no está soportado**, igual que ningún otro catálogo del
  repo. Si en algún momento se necesita "borrado real", hay que definir primero qué pasa con los
  montos ya cargados en esa moneda (bloquear el borrado si hay usos, o mostrarlos con una moneda
  "desconocida") — no es una decisión que corresponda tomar en este cambio.
- **Catálogo vacío o sin monedas activas** (si alguien desactiva las 3 iniciales sin cargar una
  nueva): `opcionesMoneda` devuelve `[]`, el botón "Agregar monto" desaparece en todos los campos
  y no se puede cargar ningún monto nuevo hasta reactivar o crear una moneda. No se agregó una
  validación que impida desactivar la última moneda activa — queda como riesgo operativo a
  criterio de quien administra Configuración, no como bug.

## 9. Verificación

- `npx tsc -b` y `npx vite build`: **OK**, sin errores.
- `npm run lint`: no se pudo correr — `eslint` no está instalado como dependencia en este entorno
  (`"eslint" no se reconoce como un comando`), problema preexistente y ajeno a este cambio.
- **Prueba en navegador:** no se pudo verificar de forma interactiva en este entorno (no hay
  `chromium-cli` ni `playwright` instalado localmente, y la instalación del browser de Playwright
  quedó fuera del alcance de esta verificación). Queda pendiente que el usuario confirme visualmente
  el flujo de "Agregar monto" / quitar fila en Alta, Datos e Iniciar Juicio, y el KPI del Panel
  Gerencia, antes de dar el cambio por probado.

## 10. Documentación actualizada por este cambio

- `claude-docs/data_CLAUDE.md` — sección "formularios.ts — Campos money_multi" reescrita: unicidad
  por moneda, fila vacía descartada, catálogo editable, `Moneda` como `string`. **Hecho.**
- `CLAUDE_root.md` / `claude-docs/CLAUDE_root.md` — mapa de archivos y la fila de `format.ts`
  actualizada con los helpers nuevos. **Hecho.**
- `claude-docs/Dashboard_CLAUDE.md` / `src/pages/Dashboard/Dashboard_CLAUDE.md` — KPI "Monto
  expuesto" multi-moneda. **Hecho** (en la primera entrega de este delta).
- `claude-docs/pages_CLAUDE.md` — sección "Configuracion/" actualizada: 29 tablas, tipo `'moneda'`,
  y descripción de la tabla "Monedas" nueva. **Hecho.**
- `SKILL.md` — receta "Agregar un campo al formulario de Alta": `money_multi` y mención del
  catálogo editable. **Hecho.**
