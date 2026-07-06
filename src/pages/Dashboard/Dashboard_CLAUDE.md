# src/pages/Dashboard/ — Dashboard analytics (estilo Power BI)

`Dashboard.page.tsx` es un panel de métricas con **3 vistas mutuamente excluyentes** según el rol
del usuario activo. Se apoya en `recharts` para los gráficos y calcula todo en tiempo real desde el
store (sin backend).

---

## Detección de rol

```ts
const esReferente   = usuarioActivo?.rolSistema === 'REFERENTE'
const esCoordinador = usuarioActivo?.rolSistema === 'COORDINADOR'
// LETRADO = fallback: !esReferente && !esCoordinador
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

### REFERENTE
- 4 KPIs: Actuaciones activas · Civil · Laboral · **Monto expuesto** (`Σ campos_mesa.mesa_monto`, en millones).
- Grid 2 col: `<DonutArea>` (distribución por área) + `<BarLetrados>` (top 6 por letrado).
- `<Semaforo>` global.
- Tabla **"Próximos vencimientos"** (`criticas`): ordenadas vencido → por_vencer → resto, luego urgentes primero; top 5.

### COORDINADOR
- Filtra a `areaCoord = usuarioActivo.areas[0]` → `expArea`.
- 4 KPIs del área: total · vencidas · por vencer <7d · sin alerta.
- `<BarLetrados>` del área + barras **"Estado procesal del área"** (`dataEstadosArea`, distribución de `estadoProcesal`).
- `<Semaforo>` del área.
- Tabla **"Sin movimiento (+30 días)"** (`sinMovimiento`): `fecha_ultimo_impulsorio` — o `fecha_recepcion` si no hay — anterior a hace 30 días.

### LETRADO
- `misExpedientes = expedientes.filter(e => e.abogado_id === usuarioActivo.id)`.
- 4 KPIs personales (mismos que coordinador pero sobre `misExpedientes`).
- Grid 2 col: donut **"Mis actuaciones por sub-estado"** (`dataEstadosLetrado`) + panel **"Tareas hoy"** (`tareasHoy`: tareas del `tareasMap` de mis expedientes con `fechaVencimiento === HOY` o `fecha_aviso === HOY`).
- Lista **"Vencimientos próximos"** (`vencimientosLetrado`): mis expedientes con alerta ≠ ninguna, vencido primero. Cada ítem navega a `RUTAS.EXPEDIENTE(id)`.
- Tabla "Mis actuaciones".

---

## Componentes internos (mismo archivo)

| Componente | Rol |
|-----------|-----|
| `KpiCard` | Tarjeta KPI con `badge`/`badgeColor` opcionales (`red`/`amber`/`green`/`blue`) |
| `Semaforo` | Barra apilada de 4 franjas (vencidos/‹7d/‹30d/sin alerta) + leyenda |
| `DonutArea` | Pie (recharts) por área con leyenda; colores `COLOR_AREA` |
| `BarLetrados` | Barra horizontal top 6 letrados; nombre vía `getUsuarioById().apellido` |
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
