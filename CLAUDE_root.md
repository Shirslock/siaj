# CLAUDE.md — SIAJ Frontend
# Sistema Integral de Asuntos Jurídicos — SOFSA / Trenes Argentinos
# Rama activa: feat/ux-refinements

> Fuente de verdad para Claude Code. Leer completo antes de escribir código.
> Cada subcarpeta tiene su propio CLAUDE.md con documentación específica.

---

## 1. Stack

| Herramienta | Versión | Rol |
|-------------|---------|-----|
| React | 18 | UI |
| TypeScript | 5 | Lenguaje |
| Vite | 5 | Build / dev server |
| Tailwind CSS | 4 (via @tailwindcss/vite) | Estilos — tokens en src/index.css @theme |
| Zustand | 5 | Estado global |
| React Router | v7 | Routing |
| Headless UI | @headlessui/react | Modales y componentes accesibles |
| Heroicons | @heroicons/react/24/outline | Íconos — via Icon.tsx wrapper |
| React Toastify | react-toastify | Toasts/notificaciones |

**Sin** tailwind.config.ts — la config vive en `src/index.css` con `@theme { }`.
**Sin** postcss.config.js — Tailwind v4 usa el plugin de Vite directamente.

---

## 2. Levantar el proyecto

```bash
npm install
npm run dev        # http://localhost:5173
npx tsc --noEmit   # verificar tipos antes de commitear
npm run build      # build de producción
```

**Deploy GH Pages:** usar `./deploy.sh` (buildea con VITE_BASE_PATH=/siaj/ y commitea en raíz)
**Deploy Vercel:** push directo — Vercel buildea sin VITE_BASE_PATH y usa base '/'

---

## 3. Mapa de archivos

| Archivo / Carpeta | Responsabilidad |
|-------------------|----------------|
| `src/types/index.ts` | TODOS los tipos del dominio. Fuente de verdad de contratos. |
| `src/data/catalogos.ts` | TIPOS_GESTION, JUZGADOS, LINEAS y todos los catálogos de dropdowns. |
| `src/data/formularios.ts` | Campos por subtipo (etapa mesa + etapa abogado). |
| `src/data/usuarios.ts` | 31 usuarios reales UR_001–UR_032, roles y asignaciones. |
| `src/data/expedientes.mock.ts` | Datos de ejemplo: queue de mesa, expedientes, detalle. |
| `src/data/estadosProcesales.ts` | Estados y tareas por tipo de gestión. 12 ciclos definidos (ver Sección 13). |
| `src/store/expedientes.store.ts` | Estado de expedientes + acciones + tareasMap. |
| `src/store/ui.store.ts` | Usuario activo, sidebar, sessionStorage. |
| `src/components/ui/Icon.tsx` | Wrapper de íconos. Mapea nombres → Heroicons. SIEMPRE usar <Icon name="..."> |
| `src/components/ui/Button.tsx` | 4 variantes: primary, secondary, ghost, danger. |
| `src/components/ui/Modal.tsx` | Modal Headless UI. Props: open, onClose, titulo, size, footer. |
| `src/components/ui/Badge.tsx` | EstadoBadge, AreaBadge, RolBadge. |
| `src/components/ui/FormField.tsx` | Wrapper label + hint + error para inputs. |
| `src/components/layout/` | AppLayout, Sidebar, Topbar, UserSwitcher. |
| `src/components/expedientes/` | TablaExpedientes, FilaExpediente, FormularioDinamico. |
| `src/pages/*/` | Una carpeta por página. NombrePagina.page.tsx + hooks locales. |
| `src/utils/format.ts` | formatFecha, formatMonto, numerador. |
| `src/utils/routing.ts` | Constantes RUTAS + helper de accesos por rol. |
| `src/utils/alertas.ts` | `getAlertaExpediente(expId, tareasMap, timeline?)` — calcula alerta "Por vencer" de tareas y replies. |
| `src/utils/exportTimeline.ts` | Exportar timeline a Excel (xlsx) y PDF (jsPDF + autoTable). Ver Sección 14. |
| `src/utils/iniciarJuicio.ts` | `MAPA_INICIAR_JUICIO` y `getTipoDocumentoNuevo(tipo)` — mapea tipo origen → tipo documento nuevo. |
| `src/index.css` | @theme con tokens de color, fuentes, clases .field-input/.field-label. |
| `vercel.json` | Rewrites para SPA en Vercel. |
| `deploy.sh` | Script de deploy para GH Pages. |

---

## 4. Design system — Paleta de colores

Tokens definidos en `src/index.css @theme`. Usar hex directo en componentes.

| Token | Hex | Uso |
|-------|-----|-----|
| navy | `#1b3a57` | Texto principal, botones primary, topbar, sidebar texto |
| navy-light | `#2a5278` | Hover de navy |
| navy-dim | `#152d45` | Active de navy |
| accent | `#C4DFE8` | Badges Civil, paginación, acentos |
| accent-dark | `#4a9ab5` | Bordes accent |
| sidebar-bg | `#E5E5E5` | Fondo del sidebar |
| surface | `#f5f5f5` | Fondo general de la app |
| surface-white | `#ffffff` | Cards, modales, inputs |
| text-secondary | `#4a6a84` | Labels, texto secundario |
| text-muted | `#7a9ab4` | Placeholders, hints |
| border | `rgba(0,0,0,0.12)` | Bordes suaves |
| border-strong | `rgba(0,0,0,0.20)` | Bordes de énfasis |
| success | `#15803d` | Estados positivos |
| warning | `#d97706` | Estados de alerta |
| error | `#b91c1c` | Estados de error |

**Fuentes:** `Public Sans` (headlines/títulos) · `Inter` (body/datos)

---

## 5. Íconos — regla de uso

**SIEMPRE** usar el componente `<Icon>`, nunca spans ni SVG directo.

```tsx
import Icon from '../ui/Icon'

<Icon name="folder" size={20} className="text-[#1b3a57]" />
<Icon name="close" size={16} className="text-[#4a6a84]" />
```

Si un ícono muestra `[nombre]` en corchetes → falta en el ICON_MAP de Icon.tsx.
Agregar el import de Heroicons y la entrada en ICON_MAP. Ver `src/components/ui/CLAUDE.md`.

---

## 6. Roles del sistema

| Rol en BD | Rol sistema | Permisos | Ruta inicio |
|-----------|-------------|----------|-------------|
| `gerente` | REFERENTE | Todo: dashboard, todas las áreas | /dashboard |
| `abogado_coordinador` | COORDINADOR | Su área + bandeja + puede reasignar | /actuaciones |
| `abogado` / `abogada` | ABOGADO | Bandeja propia + su área | /actuaciones |
| `asistente_jurídico` | ABOGADO | Igual que abogado (diferencia pendiente) | /actuaciones |
| `adm_mesa` | ADMINISTRATIVO | Mesa SIAJ solamente | /mesa |

**Multi-rol:** UR_032 BUÑIRIGO tiene `roles: ['adm_mesa', 'asistente_jurídico']`.
El sidebar muestra la unión de nav items de todos sus roles.
Ver `src/data/CLAUDE.md` para detalles.

**Reasignar:** solo `rolBD === 'abogado_coordinador'`. Usar helper `puedeReasignar(usuario)`.

**Página Actuaciones (`/actuaciones`):** punto de entrada unificado que enruta por rol:
- REFERENTE → `BandejaAreaPage` directamente
- COORDINADOR → tabs "Mis Actuaciones" / "Del Área" (`ActuacionesCoordinador`)
- ABOGADO → `BandejaAbogadoPage` directamente
- ADMINISTRATIVO → no ve el ítem en sidebar
Las rutas `/bandeja/abogado` y `/bandeja/area` siguen activas como aliases con `<Navigate>`.

---

## 7. Reglas de negocio — inamovibles

- **Único campo obligatorio al alta:** N° EE/Memo GDE. Todos los demás opcionales.
- **SS = "Sin Siniestro"** en el campo N° Causa.
- **Numeración:** C-0001/2026 (Civil), L-0001/2026 (Laboral), P-0001/2026 (Penal).
- **Asignación Civil/Laboral:** FIFO secuencial por área (ver `usuarios.ts → fifoOrder`).
- **Asignación Penal:** por línea ferroviaria (ver `ASIGNACION_PENAL` en `usuarios.ts`).
- **Edición de campos:** abogados y asistentes editan TODOS los campos del expediente.
- **sessionStorage:** único uso de storage permitido — solo para usuario activo.
- **Sin backend, sin AI, sin integración automática PJN/SIGEJ** (fuera de scope v1).
- **Orden en AltaExpediente:** Canal → Área → Tipo (en ese orden).
- **Estado inicial:** todos los expedientes arrancan en "ASIGNADO" al crearse.
- **Terminología UI:** el término visible al usuario es siempre **"Actuación/es"** — nunca "Expediente/s". Los nombres de variables, tipos y rutas internas siguen usando `expediente` (no cambiar).
- **`es_urgente`:** flag opcional en `Expediente`. Toggle en el header del detalle; filtro "Urgentes" en BandejaAbogado lo usa directamente.
- **Badge "Por vencer":** se muestra en fila de BandejaAbogado y en el header del detalle cuando alguna tarea O reply del expediente tiene `fecha_aviso <= hoy` y no está cumplida/no_procedente. Lógica en `src/utils/alertas.ts` — función `getAlertaExpediente(expId, tareasMap, exp.timeline)`.
- **`esArchivado`:** flag opcional en `EstadoProcesal`. Marca estados terminales no progresivos (DEVUELTO_SECTOR_REQUIRENTE, FINALIZADO). El modal de cambio de estado los excluye del optgroup "Retroceder".
- **Iniciar Juicio:** botón visible SOLO cuando `estadoProcesal === 'JUICIO_INICIADO'` y el tipo está en `TIPOS_CON_JUICIO`. Ver Sección 13.

---

## 8. Módulo de actividades (Timeline)

El timeline del expediente tiene DOS capas:

**Capa 1 — Tareas estructuradas por estado procesal:**
- Definidas en `src/data/estadosProcesales.ts`
- Cada estado tiene tareas obligatorias con 3 estados: en_curso / cumplido / no_procedente
- El botón "Avanzar →" se habilita cuando todas las tareas están cumplido o no_procedente
- El estado ASIGNADO no tiene tareas — avanza desde Acciones → Cambiar estado
- Las tareas viven en `tareasMap` del expedientes.store

**Capa 2 — Actividades genéricas:**
- Libres, no bloquean el avance de estado
- Se agregan con "+ Nueva actividad genérica"
- Viven en `exp.timeline[]`

**Feed del timeline (TimelineTab):**
- Se renderiza desde `gruposFeed` (useMemo), NO desde `feedFiltrado`
- `gruposFeed` agrupa entradas de sistema (Cambio/Retroceso de estado) con sus actividades del período
- Entrada de RECEPCION se renderiza por separado al final, fuera de los grupos
- `feedFiltrado` se usa solo para export y contadores de tabs
- Al expandir un grupo → panel inline de tareas históricas (NO reutiliza ActividadFeedItem)
- Header del snapshot muestra el estado ORIGEN extraído del título: `TAREAS DEL ESTADO: {ESTADO}`

**Sistema de Replies:**
- Cada actividad puede tener `replies?: Reply[]` — comentarios del letrado asignado
- Botón "Comentar" visible solo para `usuarioActivo.id === exp.abogado_id`
- Acción en store: `agregarReply(expId, actividadIdx, replyData)` — `actividadIdx` es `exp.timeline.indexOf(act)`
- Reply soporta: texto, fecha, doc_gde, fecha_vencimiento y fecha_aviso opcionales
- `actividadesToFilas()` emite filas de tipo `'Comentario'` por cada reply en la exportación

**Export timeline:**
- `actividadesToFilas()` en `exportTimeline.ts` construye filas para Excel/PDF
- `tareasDetalle` usa `\n` como separador; PDF aplica `didParseCell` para forzar multilínea
- Caracteres Unicode (→, ✓, etc.) se sanitizan con `sanitizarParaPDF()` antes de jsPDF (Helvetica es latin-1)
- `estadoExpediente` en filas de cambio/retroceso muestra el estado ORIGEN (antes de la flecha)

---

## 9. Convenciones de código

- Componentes: `PascalCase.tsx`
- Stores: `kebab-case.store.ts`
- Páginas: `NombrePagina.page.tsx` dentro de `src/pages/NombrePagina/`
- Datos mock: `kebab-case.mock.ts`
- Utils: `kebab-case.ts`
- Todo el texto visible al usuario: en español
- No crear carpetas nuevas sin documentarlas en este archivo
- Filtros de tabla: embebidos en el thead (2 filas: labels + inputs)
- Toasts: usar `toast.success/error/warn/info()` de react-toastify directamente

---

## 10. Páginas implementadas

| Carpeta | Ruta | Roles | Notas |
|---------|------|-------|-------|
| Dashboard/ | /dashboard | REFERENTE, COORDINADOR | Métricas + recientes |
| MesaSaco/ | /mesa | ADMINISTRATIVO | Filtros embebidos en thead |
| AltaExpediente/ | /mesa/alta | ADMINISTRATIVO | Canal→Área→Tipo + modal confirmación |
| Actuaciones/ | /actuaciones | ABOGADO, COORDINADOR, REFERENTE | Router por rol — ver Sección 6 |
| BandejaAbogado/ | /bandeja/abogado (alias) | ABOGADO, COORDINADOR, REFERENTE | Agrupación por causa; filtros Urgentes + Por vencer |
| BandejaArea/ | /bandeja/area (alias) | COORDINADOR, REFERENTE | Árbol causa↔expedientes |
| DetalleExpediente/ | /expediente/:id | ABOGADO, COORDINADOR, REFERENTE | 6 tabs |
| CausaDetalle/ | /causa/* | ABOGADO, COORDINADOR, REFERENTE | 4 tabs, ruta tolera barras |
| Agenda/ | /agenda | ABOGADO, COORDINADOR, REFERENTE | Pendiente |

---

## 11. Compatibilidad con equipo de desarrollo

Los devs usan JavaScript (no TypeScript) y Redux (no Zustand).
Lo que pueden reutilizar directamente del prototipo:
- Componentes UI (Headless UI + Heroicons — stack idéntico)
- Estilos Tailwind (clases idénticas en JS y TS)
- Lógica de negocio de cada página
- Estructura de formularios dinámicos
- Módulo de actividades/timeline completo

Lo que deben adaptar:
- Quitar anotaciones de tipos TypeScript (cambio sintáctico, no lógico)
- Reemplazar Zustand por Redux (misma lógica, distinta API de store)

---

## 13. Ciclos procesales por tipo de gestión

### Tipos con flujo secuencial
| Tipo | Array en estadosProcesales.ts | Estados |
|------|-------------------------------|---------|
| DEMANDA_CIVIL / DEMANDA_LABORAL | ESTADOS_DEMANDA_CIVIL | ASIGNADO → INICIO → TRABA_LITIS → EN_PRUEBA → ALEGATOS → SENTENCIA → CERRADO |
| DEMANDA_CIVIL_ACTORA | ESTADOS_DEMANDA_CIVIL_ACTORA | ASIGNADO → INICIO → TRABA_LITIS → PRUEBA → ALEGATO → SENTENCIA_1_FAV/DESFAV → ... → FINALIZADO |
| DEMANDA_LABORAL_ACTORA | ESTADOS_DEMANDA_LABORAL_ACTORA | Ídem con tareas laborales |
| LANZAMIENTO_JUDICIALIZADO | ESTADOS_LANZAMIENTO_JUDICIALIZADO | ASIGNADO → INICIO → SENTENCIA_LANZAMIENTO → ... → FINALIZADO |

### Tipos con bifurcación desde EN_ANALISIS (Ciclo A)
Estados: `ASIGNADO → EN_ANALISIS` → (bifurcación) → `ACUERDO_EXTRAJUDICIAL` | `JUICIO_INICIADO` | `DEVUELTO_SECTOR_REQUIRENTE`

| Tipo | Array |
|------|-------|
| COBRO_CANON | ESTADOS_COBRO_CANON |
| RECLAMO_CONTRAT | ESTADOS_RECLAMO_CONTRAT |
| RECUPERO | ESTADOS_RECUPERO |
| EJECUCION_GAR | ESTADOS_EJECUCION_GAR |
| LANZAMIENTO | ESTADOS_LANZAMIENTO |

### Tipos con bifurcación desde EN_ANALISIS (Ciclo B — sin acuerdo extrajudicial)
Estados: `ASIGNADO → EN_ANALISIS` → (bifurcación) → `JUICIO_INICIADO` | `DEVUELTO_SECTOR_REQUIRENTE`

| Tipo | Array |
|------|-------|
| CONSIGNACION | ESTADOS_CONSIGNACION |
| DESAFUERO | ESTADOS_DESAFUERO |

### Bifurcación en el modal de cambio de estado
- `ESTADOS_DESDE_EN_ANALISIS` en `DetalleExpediente.page.tsx` define los destinos por tipo
- Cuando `estadoProcesal === 'EN_ANALISIS'` el optgroup "Avanzar" muestra las opciones ramificadas
- `EN_ANALISIS` tiene `siguiente: undefined` — no es flujo lineal

### Flujo "Iniciar Juicio"
1. Avanzar a `JUICIO_INICIADO` → toast informativo aparece
2. Botón "Iniciar Juicio" en menú + se activa
3. `getTipoDocumentoNuevo(tipo)` devuelve el tipo del documento judicial a crear:
   - COBRO_CANON / RECLAMO_CONTRAT / RECUPERO / EJECUCION_GAR → `DEMANDA_CIVIL_ACTORA`
   - LANZAMIENTO → `LANZAMIENTO_JUDICIALIZADO`
   - CONSIGNACION / DESAFUERO → `DEMANDA_LABORAL_ACTORA`

---

## 14. Exportación de timeline

Funciones en `src/utils/exportTimeline.ts`:

- `actividadesToFilas(actividades, expId, area)` — convierte actividades a filas exportables. Para cambios/retrocesos de estado, `estadoExpediente` muestra el estado ORIGEN.
- `tareasToFilas(tareas, estadoProcesal, expId, area)` — convierte tareas a filas.
- `exportarExcel(filas, nombre, incluirExpediente)` — genera .xlsx con wrapText en columna tareas.
- `exportarPDF(filas, nombre, titulo, subtitulo, incluirExpediente)` — genera .pdf landscape con autoTable. Aplica `sanitizarParaPDF()` sobre título, descripción y tareas (Helvetica no soporta Unicode).

**Columna "Tareas realizadas":** `\n` entre tareas; `didParseCell` splitea el string en array para que autoTable renderice cada tarea en su propia línea.

---

## 15. Checklist antes de entregar

- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run build` sin errores
- [ ] Sin corchetes [nombre] visibles — todos los íconos mapeados en Icon.tsx
- [ ] Sin tokens v3 rotos (bg-surface, text-on-surface, etc.)
- [ ] Sin texto en inglés visible al usuario
- [ ] Reglas de negocio de la Sección 7 respetadas
- [ ] Datos mock coherentes con el dominio SIAJ
- [ ] Sin `console.log` temporales de debugging
