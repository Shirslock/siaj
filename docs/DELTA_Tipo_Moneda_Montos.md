# Delta de cambio — Tipo de moneda en los montos de actuaciones

> **Propósito de este documento.** Insumo autocontenido para redactar el Delta de cambio formal
> (Claude web) y las Historias de Usuario asociadas. Describe qué había antes, qué se cambia, qué
> se decidió y por qué, y qué queda fuera de alcance.
>
> - **Módulo:** Datos Maestros de la actuación (formularios Mesa / Letrado) + Dashboard + Previsión
> - **Sistema:** SIAJ — Sistema Integral de Asuntos Jurídicos (SOFSE)
> - **Branch de implementación:** `feat/tipo-moneda-montos`
> - **Fecha de definición:** 2026-09-07
> - **Estado:** implementado en la branch `feat/tipo-moneda-montos` (compila; pendiente de prueba
>   funcional y revisión del usuario)

---

## 1. Situación actual (antes del cambio)

Los formularios de las actuaciones tienen campos de dinero (`type: 'money'`, definidos en
`src/data/formularios.ts`) que guardan **únicamente un número**. No existe ningún campo que indique
la unidad monetaria de ese número.

Consecuencias:

- Un monto de `5.400.000` puede ser pesos o dólares y el sistema no lo distingue: el dato queda
  ambiguo para quien lo lee después (letrado, coordinador, referente, reportes).
- La visualización refuerza el error: `formatMonto()` (`src/utils/format.ts`) antepone siempre `$`,
  así que un importe en dólares se muestra igual que uno en pesos.
- El KPI "Monto expuesto" del Dashboard suma todos los `mesa_monto` sin distinción, con lo cual una
  actuación en dólares distorsiona el total.
- La solapa Previsión actualiza el monto base por índice de inflación — lógica válida solo para
  pesos — sin verificar la moneda.

## 2. Necesidad

El área legal litiga casos con montos expresados en dólares (además de pesos). El usuario necesita
poder **especificar en qué moneda está cada importe** en el momento de cargarlo, para que el dato
sea inequívoco y para que los totales y proyecciones no mezclen monedas.

## 3. Cambio solicitado

Agregar, junto a cada campo de dinero de las actuaciones, un campo nuevo **"Tipo de moneda"**:
un desplegable con tres opciones: **ARS — Pesos argentinos**, **USD — Dólares** y
**EUR — Euros**.

## 4. Decisiones tomadas (y alternativas descartadas)

| Tema | Decisión | Alternativas descartadas |
|---|---|---|
| Cardinalidad | **Un selector por cada campo de monto** | Uno por etapa (Mesa/Letrado) o uno por actuación — no permitirían, p. ej., un reclamo en USD con un acuerdo en ARS |
| Control de UI | **Campo `select` separado**, inmediatamente después del monto | Selector integrado dentro del input de monto (obligaba a modificar el componente de dinero) |
| Monedas habilitadas | **ARS, USD y EUR** | Solo ARS y USD (EUR se agregó a pedido del usuario) |
| Etiqueta de las opciones | **Código ISO + nombre**: "ARS — Pesos argentinos" / "USD — Dólares" / "EUR — Euros" | Solo el nombre ("Pesos argentinos"); solo el código ("ARS") |
| Formato del importe | Se mantiene `$` para pesos y se agregan `US$` para dólares y `€` para euros | Prefijar con el código ISO (`ARS 5.400.000,00`) — cambiaba la visualización de todos los montos existentes |
| Valor por defecto | **Pesos argentinos** preseleccionado, campo **opcional** (no bloquea el guardado) | Sin default y obligatorio — dejaba incompletas las actuaciones ya cargadas |
| Datos existentes | **Sin migración de datos**: la ausencia de valor se interpreta como ARS | Backfill masivo del dato |
| Alcance | **Solo los formularios de actuación** (Civil / Laboral / Comercial) | Incluir también los montos del circuito penal |
| Dashboard | El KPI "Monto expuesto" **suma solo montos en ARS** y lo aclara en el label | Un KPI por moneda; convertir con cotización (abre el tema tipo de cambio, no resuelto) |
| Previsión | La actualización por índice **se aplica solo si la moneda es ARS**: en moneda extranjera se muestra el monto base con un aviso | Aplicar el índice igual (produciría un pronóstico falso) |

**Tema abierto, deliberadamente fuera de este cambio:** no se incorpora tipo de cambio ni
conversión entre monedas. Si el negocio necesita totales consolidados en una sola moneda, hay que definir
antes de dónde sale la cotización (fija, cargada a mano, o servicio externo).

## 5. Alcance funcional

### 5.1 Tipos de actuación alcanzados — 15 campos en 12 tipos

| # | Tipo de actuación | Etapa | Campo de monto | Campo de moneda nuevo |
|---|---|---|---|---|
| 1 | Carta Documento | Letrado | Monto reclamado | Tipo de moneda |
| 2 | Mediaciones | Letrado | Monto del Acuerdo | Tipo de moneda |
| 3 | Mediaciones | Letrado | Monto reclamado | Tipo de moneda |
| 4 | SECLO | Letrado | Monto reclamado | Tipo de moneda |
| 5 | Cobro de Cánones | Letrado | Monto informado | Tipo de moneda |
| 6 | Cobro de Cánones | Letrado | Monto actualizado | Tipo de moneda |
| 7 | Reclamo a Contratistas | Letrado | Monto a reclamar | Tipo de moneda |
| 8 | Recuperos | Letrado | Monto a reclamar | Tipo de moneda |
| 9 | Consignaciones | Letrado | Monto a consignar | Tipo de moneda |
| 10 | Ejecución de Pólizas | Letrado | Monto/s a ejecutar | Tipo de moneda |
| 11 | Defensa Civil | Mesa | Monto Reclamado | Tipo de moneda |
| 12 | Demanda Civil | Mesa | Monto de la demanda | Tipo de moneda |
| 13 | Demanda Civil | Letrado | Monto del Acuerdo | Tipo de moneda |
| 14 | Demanda Laboral | Mesa | Monto de la demanda | Tipo de moneda |
| 15 | Demanda Laboral | Letrado | Monto del Acuerdo | Tipo de moneda |

Tipos **sin** campos de dinero, no afectados: Oficios (incluida la variante penal), Beneficio de
Litigar sin Gastos, Lanzamientos, Lanzamiento Judicializado, Desafueros, Querellas, Defensa Penal,
Carta Suceso (SAE), Pedido de Causa Penal, Otras presentaciones / gestiones.

### 5.2 Fuera de alcance

- **Circuito penal:** el campo "Montos" de las Solicitudes Penales (Notificación Conciliación,
  Notificación Reparación Integral, Notificación Probation) y el campo "Monto" de las
  sub-actividades penales de acuerdo (Conciliación, Reparación Integral y Probation, en Instrucción
  y en Juicio) siguen **sin** tipo de moneda.
- **Escritos judiciales:** ninguna de las 29 plantillas del catálogo Civil/Laboral tiene variables
  de dinero, por lo que el módulo de Escritos no se ve afectado. Si en el futuro un escrito debe
  insertar el monto de la demanda, hay que crear la variable correspondiente en el modelo de
  plantillas.
- **Conversión de monedas / tipo de cambio:** no se implementa.

## 6. Comportamiento esperado

1. **Carga.** Al completar cualquier campo de monto listado en 5.1, el usuario ve inmediatamente
   debajo/al lado un desplegable "Tipo de moneda" con "ARS — Pesos argentinos" preseleccionado y
   "USD — Dólares" / "EUR — Euros" como alternativas. Puede dejarlo como está: el campo no es
   obligatorio.
2. **Alta manual de juicio.** El modal "Iniciar Juicio", que carga "Monto de la Demanda", también
   ofrece el selector de moneda, y el valor elegido queda guardado en la actuación.
3. **Consulta.** En la solapa Datos, cada importe se muestra con el símbolo que corresponde a su
   moneda (`$` para pesos, `US$` para dólares, `€` para euros).
4. **Actuaciones anteriores al cambio.** Se siguen viendo exactamente como antes (en pesos) y no
   requieren ninguna acción del usuario.
5. **Dashboard.** El KPI "Monto expuesto" contabiliza solo los montos en pesos (la moneda
   extranjera queda fuera), y el label indica que es un total en ARS.
6. **Previsión.** Si el monto base de la actuación está en moneda extranjera, la solapa muestra el
   monto sin actualización por índice, con la leyenda de que la actualización por índice solo
   aplica a montos en pesos.

## 7. Detalle técnico del delta

| Archivo | Cambio |
|---|---|
| `src/data/formularios.ts` | +15 campos `type:'select'`, id `<id_del_monto>_moneda`, label "Tipo de moneda", opciones `ARS` — Pesos argentinos / `USD` — Dólares / `EUR` — Euros, ubicados inmediatamente después de cada campo `money` |
| `src/utils/format.ts` | Mapa `SIMBOLO_MONEDA` (`$` / `US$` / `€`) del que derivan el tipo `Moneda` y los helpers `formatMonto(valor, moneda = 'ARS')`, `normalizarMoneda(val)` y `aplicaIndiceInflacion(moneda)` |
| `src/pages/DetalleExpediente/tabs/DatosTab.tsx` | Resuelve la moneda del campo leyendo `<id>_moneda` del mismo registro y la pasa a `formatMonto` |
| `src/pages/DetalleExpediente/DetalleExpediente.page.tsx` | Estado `monto_moneda` en el form de Iniciar Juicio, select en el formulario y mapeo a `mesa_monto_moneda` |
| `src/pages/Dashboard/Dashboard.page.tsx` | El KPI "Monto expuesto" suma solo los montos con moneda ARS (condición por ARS, no por cada moneda extranjera); label aclarado |
| `src/pages/DetalleExpediente/tabs/PrevisionTab.tsx` | El cálculo corre solo si la moneda es ARS; en cualquier otra no se calcula monto actualizado, pronóstico ni tabla de índices, y se muestra aviso |
| `src/types/index.ts` | **Sin cambios** — se reusa el tipo de campo `select` existente |
| `src/data/expedientes.mock.ts` | **Sin cambios** — no hay backfill; la ausencia de valor se lee como ARS |

Convenciones: id = id del monto + `_moneda`; valores almacenados `'ARS'` / `'USD'` / `'EUR'`
(ISO 4217); labels visibles "ARS — Pesos argentinos" / "USD — Dólares" / "EUR — Euros".

**Extensibilidad:** las reglas de negocio preguntan por `ARS`, no por cada moneda extranjera, y el
tipo `Moneda` deriva del mapa de símbolos, así que sumar una moneda nueva es agregar su entrada en
`SIMBOLO_MONEDA` y la opción en el select.

## 8. Riesgos y consideraciones

- **Default ARS con campo opcional:** un monto en dólares cargado sin tocar el selector queda
  registrado como pesos. Mitigación posible a futuro: volverlo obligatorio (cambio menor).
- **Totales del Dashboard:** al excluir la moneda extranjera, el "Monto expuesto" deja de representar el total
  de la cartera. Es una decisión consciente para no sumar unidades distintas; queda pendiente
  definir con Negocio si se quieren KPIs adicionales por moneda.
- **Ids repetidos entre formularios:** `abg_monto_reclamado` (Mediaciones y SECLO) y `monto_acuerdo`
  (Mediaciones, Demanda Civil y Demanda Laboral) existen en más de un formulario; el campo de
  moneda hereda esa duplicación. No genera conflicto porque cada formulario es independiente.
- **Reportes externos (Power BI / SIGEJ):** cualquier consumo externo de los montos debería incluir
  el campo de moneda para no repetir la ambigüedad aguas abajo.

## 9. Criterios de aceptación

1. En cada uno de los 15 campos de la tabla 5.1 aparece un desplegable "Tipo de moneda" con las
   opciones "ARS — Pesos argentinos", "USD — Dólares" y "EUR — Euros", con ARS preseleccionado.
2. El valor elegido se guarda y se vuelve a mostrar correctamente al reabrir la actuación.
3. En la solapa Datos, un monto en pesos se muestra con `$`, uno en dólares con `US$` y uno en
   euros con `€`.
4. Una actuación cargada antes del cambio se sigue mostrando en pesos y no produce errores.
5. El KPI "Monto expuesto" del Dashboard no incluye actuaciones con monto en dólares, y su label lo
   indica.
6. En una actuación con monto en moneda extranjera (USD o EUR), la solapa Previsión no muestra
   monto actualizado ni pronóstico, y explica por qué.
7. El proyecto compila sin errores (`npm run build`).

## 10. Documentación actualizada por este cambio

- `claude-docs/data_CLAUDE.md` — sección nueva "formularios.ts — Tipo de moneda en los campos
  `money`" (convención, tabla de campos, impactos) + regla en "Reglas de formularios".
- `CLAUDE_root.md` y `claude-docs/CLAUDE_root.md` — mapa de archivos (`formularios.ts`,
  `format.ts`), KPI del Dashboard y fila de la solapa Previsión.
- `claude-docs/Dashboard_CLAUDE.md` y `src/pages/Dashboard/Dashboard_CLAUDE.md` — alcance del KPI
  "Monto expuesto".
- `claude-docs/pages_CLAUDE.md` — solapa Previsión.
- `SKILL.md` — receta "Agregar un campo al formulario de Alta": los campos `money` llevan su
  selector de moneda.
