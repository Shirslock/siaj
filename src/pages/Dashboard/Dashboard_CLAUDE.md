# src/pages/Dashboard/ — Dashboard analytics (estilo Power BI)

`Dashboard.page.tsx` es un panel de métricas con **2 vistas mutuamente excluyentes** según el rol
del usuario activo: `<PanelGerencia>` (REFERENTE + COORDINADOR combinados) y `<PanelLetrado>`
(fallback). Se apoya en `recharts` para los gráficos y calcula todo en tiempo real desde el
store (sin backend).

---

## Detección de rol

```ts
const esReferente   = usuarioActivo?.rolSistema === 'REFERENTE'
const esCoordinador = usuarioActivo?.rolSistema === 'COORDINADOR'
// esReferente || esCoordinador → <PanelGerencia>
// LETRADO = fallback: !esReferente && !esCoordinador → <PanelLetrado>
//   → cubre ABOGADO y asistentes (RolSistema no tiene 'ASISTENTE')
```

`ADMINISTRATIVO` no llega al dashboard (no tiene el ítem en el sidebar; inicio en `/mesa`).

---

## Fuentes de datos

```ts
const expedientes = useExpedientesStore(s => s.expedientes)
const tareasMap   = useExpedientesStore(s => s.tareasMap)
const { usuarioActivo } = useUIStore()
```

Todo se deriva con `useMemo`. Las alertas de vencimiento usan
`getAlertaExpediente(expId, tareasMap, exp.timeline)` de `src/utils/alertas.ts`
(considera tareas del `tareasMap`, replies y actividades con `fecha_vencimiento`).

`estaActiva(e)` = `estado` no está en `['ARCHIVADO','ARCHIVADA','Finalizado','Archivado','CERRADO']`.

`clasificarVencimiento(exp, tareasMap)` → `'vencido' | 'porVencer7' | 'porVencer30' | 'sinAlerta'`
(alimenta los KPIs y el `<Semaforo>`).

---

## Vistas por rol

### PanelGerencia (REFERENTE + COORDINADOR)
Vista única para ambos roles — no branchea internamente por sub-rol (los datos de la fila 1 de
KPIs son fijos/mock, no filtrados por `usuarioActivo`). Estructura de arriba a abajo:
1. Fila de 6 KPIs (`Causas activas`, `Causas urgentes`, `Huérfanas sin asignar`, `Sin impulsorio +60d`,
   `Causas vinculadas`, `Monto expuesto`).
2. Fila de 6 KPIs por área (urgentes y sin impulsorio ×3 áreas).
3. `Ingresadas vs. cerradas` — `BarChart` agrupado, últimos 6 meses.
4. **`Funnel de estados`** — `<FunnelChart>` SVG custom (ver abajo), no usa `recharts`.
5. `Distribución por sub-estado y área` — `BarChart` apilado.
6. `<GaugeUrgencia>` + `<TablaComplejidad>` (grid 2 col).
7. `<HeatMapLugares>` — top lugares de hechos.
8. `Estacionalidad` — `LineChart`, últimos 24 meses.
9. `Concentración por organismo requirente` — top 8.
10. `Causas ganadas/perdidas por juzgado`.

Cada widget que acepta click llama `setPanelActivo({ titulo, expedientes })` para abrir el panel
lateral derecho con el listado filtrado correspondiente.

### PanelLetrado (fallback — ABOGADO/asistentes)
- `misExpedientes = expedientes.filter(e => e.abogado_id === usuarioActivo.id)`.
- KPIs personales, donut **"Mis actuaciones por sub-estado"** (`dataEstadosLetrado`) + panel
  **"Tareas hoy"** (`tareasHoy`: tareas del `tareasMap` de mis expedientes con
  `fechaVencimiento === HOY` o `fecha_aviso === HOY`).
- Lista **"Vencimientos próximos"** (`vencimientosLetrado`): mis expedientes con alerta ≠ ninguna,
  vencido primero. Cada ítem navega a `RUTAS.EXPEDIENTE(id)`.
- Tabla "Mis actuaciones".

---

## `FunnelChart` — funnel de estados custom (SVG)

Reemplaza el `BarChart` horizontal anterior. Vive como función dentro de `Dashboard.page.tsx`,
junto a `PanelGerencia`.

```ts
const FUNNEL_ESTADOS = [
  { label: 'Asignado',       value: 87, color: '#2a78d6' },
  { label: 'En análisis',    value: 62, color: '#1baf7a' },
  { label: 'Traba de litis', value: 41, color: '#7F77DD' },
  { label: 'Prueba',         value: 28, color: '#eda100' },
  { label: 'Sentencia',      value: 14, color: '#e34948' },
  { label: 'Cerrado',        value: 9,  color: '#888780' },
]

<FunnelChart onSelect={(label) => setPanelActivo({ titulo: `Funnel — ${label}`, expedientes })} />
```

- SVG puro (`viewBox` fijo `720×220`, `width="100%"`), sin `recharts` — no usa `ResponsiveContainer`.
- Bloques (`<rect>`) de altura proporcional al `value` (entre `minH=32` y `maxH=160`), centrados
  verticalmente en `midY`, con conectores trapezoidales (`<polygon>`) entre bloques consecutivos
  usando el color del bloque anterior con `opacity={0.35}`.
- Cada bloque dispara `onSelect(label)` al click (`<g onClick=...>`).
- Si se agregan/quitan estados a `FUNNEL_ESTADOS`, el layout se recalcula solo (`totalW`, `startX`,
  `step` dependen de `data.length`).

---

## Componentes internos (mismo archivo)

| Componente | Rol |
|-----------|-----|
| `KpiCard` | Tarjeta KPI con `badge`/`badgeColor` opcionales (`red`/`amber`/`green`/`blue`) |
| `WidgetCard` | Contenedor de widget con `titulo`/`sub` y `onClick` opcional (abre panel lateral) |
| `Semaforo` | Barra apilada de 4 franjas (vencidos/‹7d/‹30d/sin alerta) + leyenda |
| `DonutArea` | Pie (recharts) por área con leyenda; colores `COLOR_AREA` |
| `BarLetrados` | Barra horizontal top 6 letrados; nombre vía `getUsuarioById().apellido` |
| `FunnelChart` | Funnel SVG custom estilo Power BI (bloques decrecientes + conectores trapezoidales) |
| `HeaderPowerBI` | Header con badge "Power BI" + botón "Exportar" (visual, sin acción) |
| `VencimientoItem` | Fila clickeable de la lista de vencimientos del letrado |

Constantes: `COLOR_AREA` (CIVIL `#2a78d6`, LABORAL `#1baf7a`, PENAL `#7F77DD`),
`COLORES_ESTADOS` (paleta de 6 para donuts de sub-estado), `HOY` (fecha ISO a nivel de módulo).

---

## Reglas / notas

- `recharts` se importa inline; todo es self-contained (sin config externa).
- El botón "Exportar" es decorativo — no hay export implementado todavía.
- Para probar la vista LETRADO hay que cambiar el usuario activo (por defecto es LOPEZ UR_018, referente) a un abogado con actuaciones asignadas, p.ej. CASANO UR_004.
- Si se agregan estados terminales nuevos, sumarlos a `ESTADOS_CERRADOS` para que no cuenten como "activas".
