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

Que **cualquier campo de tipo money** admita **N pares moneda+monto**: un botón "Agregar monto"
para sumar filas y un botón para quitar cada fila (mínimo 1 fila siempre visible). Mostrar todos
los pares donde hoy se muestra el monto (detalle, Alta, Panel Gerencia). No sumar entre sí montos
de monedas distintas.

## 4. Decisiones tomadas (y alternativas descartadas)

| Tema | Decisión | Alternativas descartadas |
|---|---|---|
| Alcance | **Los 15 campos `money` existentes** (la misma tabla de `feat/tipo-moneda-montos`) pasan de `type:'money'` + campo hermano `<id>_moneda` a un único campo `type:'money_multi'` | Extender solo el monto principal (`mesa_monto`, el único que hoy llega a un KPI) — el usuario pidió explícitamente que aplique a los 15 |
| Modelo de datos | El valor del campo pasa a ser un **array** `{ moneda: Moneda; monto: number }[]` en vez de un escalar + campo hermano | Mantener el campo hermano `<id>_moneda` y convertirlo también en array paralelo — dos arrays sincronizados por índice es más frágil que un array de pares |
| Compatibilidad con datos viejos | Un valor guardado en el formato anterior (escalar en `campos[id]` + moneda en `campos[<id>_moneda]`) se **lee como una lista de 1 par**, vía `normalizarMontos()` — no se migra el mock/los datos guardados salvo un caso de ejemplo (ver §7) | Migración masiva de datos al abrir la app (no hay backend, no aplica) |
| Suma en KPIs | Se agrupa **por moneda** (`sumarMontosPorMoneda()`) y se muestra un total por cada moneda presente, nunca se mezclan | Convertir todo a una sola moneda con tipo de cambio (tema explícitamente fuera de alcance desde `feat/tipo-moneda-montos`) |
| Modal "Iniciar Juicio" | Se extiende al mismo patrón repetible (no es un campo `formularios.ts`, es un formulario ad-hoc) para no dejar `mesa_monto` con dos formas de carga distintas | Dejarlo con un solo par y envolver en array de 1 al guardar — se descartó porque el usuario pidió que "cualquier campo money" admita N pares, y `mesa_monto` es uno de los 15 |
| Previsión (`PrevisionTab`) | Sigue siendo ilustrativa ("a relevar con el negocio"); al ser `money_multi` ahora, proyecta **solo el primer par cargado** del campo base | Proyectar los N pares en paralelo — la pestaña ya está marcada como pendiente de definición de negocio, no se le agrega complejidad extra sin ese insumo |

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
   botón "Agregar monto" suma una fila nueva (ARS por defecto); cada fila con más de una tiene un
   botón para quitarla, pero nunca se puede llegar a 0 filas.
2. **Datos viejos.** Una actuación cargada antes de este cambio (escalar + campo hermano
   `<id>_moneda`, o directamente sin moneda) se sigue viendo igual: una sola fila con ese valor y
   esa moneda (o ARS si no tenía moneda guardada).
3. **Consulta (solapa Datos).** Se listan todos los pares cargados, cada uno con su símbolo de
   moneda (`$` / `US$` / `€`).
4. **Panel Gerencia.** El KPI "Monto expuesto" muestra un total por cada moneda presente en los
   `mesa_monto` de las actuaciones (ej. `$4.9M · US$3K`), sin convertir ni mezclar.
5. **Previsión.** Si el campo base tiene varios pares, se usa el primero para el cálculo
   ilustrativo existente (sin cambios en la lógica de actualización en sí).

## 7. Detalle técnico del delta

| Archivo | Cambio |
|---|---|
| `src/types/index.ts` | Nuevo valor `'money_multi'` en `TipoCampo` (se conserva `'money'` por compatibilidad de tipo, ya sin uso en `formularios.ts`) |
| `src/data/formularios.ts` | Los 15 campos `{id, type:'money'}` + `{id}_moneda` (`type:'select'`) se colapsan en un único `{id, type:'money_multi'}` |
| `src/utils/format.ts` | Nuevos: `ParMoneda` (`{moneda, monto}`), `normalizarMontos(valorCampo, monedaLegacy?)` (array nuevo o escalar+hermano legacy → `ParMoneda[]`), `sumarMontosPorMoneda(pares)` (suma agrupada por moneda), `OPCIONES_MONEDA` (única fuente del combo ARS/USD/EUR, reemplaza las 15+ copias hardcodeadas que había en `formularios.ts` y en el modal de Iniciar Juicio) |
| `src/components/expedientes/FormularioDinamico.tsx` | Nueva rama `campo.type === 'money_multi'`: filas repetibles moneda+monto con "Agregar monto" / quitar fila (motor de Alta) |
| `src/pages/DetalleExpediente/tabs/DatosTab.tsx` | `valorDisplay` muestra todos los pares; `renderCampoInput` agrega la misma UI repetible que `FormularioDinamico` para el modo edición del detalle |
| `src/pages/DetalleExpediente/DetalleExpediente.page.tsx` | El modal "Iniciar Juicio" pasa de `monto` + `monto_moneda` (string) a `montos: ParMoneda[]` con la misma UI repetible; al confirmar, escribe `mesa_monto` como array (filtrando filas vacías) |
| `src/pages/Dashboard/Dashboard.page.tsx` | El KPI "Monto expuesto" (antes "Monto expuesto (ARS)") ahora agrupa `mesa_monto` de todas las actuaciones por moneda con `sumarMontosPorMoneda` y muestra un total abreviado por cada una |
| `src/pages/DetalleExpediente/tabs/PrevisionTab.tsx` | Lee `monto_reclamado` / `monto_acuerdo` con `normalizarMontos` y usa el primer par como monto base (antes leía el escalar + su campo hermano) |
| `src/data/expedientes.mock.ts` | `mesa_monto` de `C-0100/2026` migrado a `[{moneda:'ARS', monto:4850000}, {moneda:'USD', monto:3200}]` como demo del campo repetible; `L-0100/2026` se dejó con el escalar viejo (`2100000`, sin campo hermano) a propósito, para probar la compatibilidad hacia atrás |

## 8. Riesgos y consideraciones

- **Filas vacías al guardar.** En el modal "Iniciar Juicio" y en `FormularioDinamico`, una fila con
  el monto vacío no rompe nada porque se filtra (`monto.trim() !== ''`) o se guarda como `0` según
  el flujo; no hay validación que impida guardar un campo `money_multi` completamente vacío más
  allá de la marca `required` visual existente.
- **`PrevisionTab` con N pares:** al proyectar solo el primer par, si el usuario carga el monto
  extranjero primero y el de pesos después, la previsión (que solo aplica a ARS) puede mostrar el
  aviso de "no aplica" aunque exista un par en pesos más abajo en la lista. Es una limitación
  conocida de una pestaña ya marcada como ilustrativa; no se resuelve hasta que el negocio defina
  la lógica real de Previsión.
- **Reportes externos (Power BI / SIGEJ):** cualquier consumo externo de `campos_mesa`/`campos_abogado`
  que hoy lea el escalar viejo de estos 15 campos debe actualizarse para leer el array de pares.

## 9. Verificación

- `npx tsc -b` y `npx vite build`: **OK**, sin errores.
- `npm run lint`: no se pudo correr — `eslint` no está instalado como dependencia en este entorno
  (`"eslint" no se reconoce como un comando`), problema preexistente y ajeno a este cambio.
- **Prueba en navegador:** no se pudo verificar de forma interactiva en este entorno (no hay
  `chromium-cli` ni `playwright` instalado localmente, y la instalación del browser de Playwright
  quedó fuera del alcance de esta verificación). Queda pendiente que el usuario confirme visualmente
  el flujo de "Agregar monto" / quitar fila en Alta, Datos e Iniciar Juicio, y el KPI del Panel
  Gerencia, antes de dar el cambio por probado.

## 10. Documentación a actualizar por este cambio

- `claude-docs/data_CLAUDE.md` — actualizar la sección "formularios.ts — Tipo de moneda en los
  campos `money`" para reflejar `money_multi` y el array de pares.
- `CLAUDE_root.md` / `claude-docs/CLAUDE_root.md` — actualizar mapa de archivos y KPI del Dashboard.
- `claude-docs/Dashboard_CLAUDE.md` / `src/pages/Dashboard/Dashboard_CLAUDE.md` — KPI "Monto
  expuesto" ahora es multi-moneda.
- `SKILL.md` — receta "Agregar un campo al formulario de Alta": mencionar `money_multi` como el
  tipo a usar para montos (en vez de `money` + selector de moneda separado).
