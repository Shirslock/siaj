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
| `gerente` | REFERENTE | Todo: dashboard, todas las áreas. Solo lectura en bandeja — no puede reasignar. | /dashboard |
| `abogado_coordinador` | COORDINADOR | Su área + bandeja + puede reasignar desde bandeja y botón + del detalle | /actuaciones |
| `abogado` / `abogada` | ABOGADO | Bandeja propia + su área | /actuaciones |
| `asistente_jurídico` | ABOGADO | Igual que abogado (diferencia pendiente de definición con cliente) | /actuaciones |
| `adm_mesa` | ADMINISTRATIVO | Mesa SIAJ solamente. Solo lectura en todos los tabs del detalle. Sin botón Editar ni botón +. | /mesa |

**Multi-rol:** UR_032 BUÑIRIGO tiene `roles: ['adm_mesa', 'asistente_jurídico']`.
El sidebar muestra la unión de nav items de todos sus roles.
Ver `src/data/CLAUDE.md` para detalles.

**Reasignar:** solo `rolBD === 'abogado_coordinador'` o `rolBD === 'gerente'`. Desde la bandeja o desde el botón + del detalle. Usar helper `puedeReasignar(usuario)`.

**Desagrupar:** cualquier rol con acceso a la actuación (Abogado, Asistente, Coordinador).

**Botón + del detalle — opciones por rol:**
- Abogado / Asistente: Cambiar estado — Desagrupar — Nueva Actuación (solo Penal)
- Coordinador: Cambiar estado — Desagrupar — Nueva Actuación (solo Penal) — Reasignar
- Mesa SACO / Gerente: no ven el botón +

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
- **Numeración:** C-0001/2026 (Civil), L-0001/2026 (Laboral), P-0001/2026 (Penal). Incremental por área, reinicia en 0001 cada año.
- **Asignación Civil/Laboral:** FIFO secuencial por área (ver `usuarios.ts → fifoOrder`).
- **Asignación Penal:** por línea ferroviaria (ver `ASIGNACION_PENAL` en `usuarios.ts`).
- **Asistentes Jurídicos:** solo pueden asignarse en Oficio Civil/Laboral, Oficio Penal, Carta Documento y BLG. Para esos tipos la asignación es manual (sin FIFO).
- **Edición de campos:** abogados y asistentes editan TODOS los campos de la actuación, incluidos los completados por Mesa SACO.
- **sessionStorage:** único uso de storage permitido — solo para usuario activo.
- **Sin backend, sin AI, sin integración automática PJN/SIGEJ** (fuera de scope v1).
- **Orden en AltaExpediente:** Canal → Área → Tipo (en ese orden).
- **Estado inicial:** todas las actuaciones arrancan en "ASIGNADO" al crearse.
- **Terminología UI:** el término visible al usuario es siempre **"Actuación/es"** — nunca "Expediente/s". Los nombres de variables, tipos y rutas internas siguen usando `expediente` (no cambiar).
- **`es_urgente`:** flag opcional en `Expediente`. Toggle en el header del detalle; filtro "Urgentes" en BandejaAbogado lo usa directamente.
- **Badge "Por vencer":** se muestra en fila de BandejaAbogado y en el header del detalle cuando alguna tarea O reply del expediente tiene `fecha_aviso <= hoy` y no está cumplida/no_procedente. Lógica en `src/utils/alertas.ts`.
- **`esArchivado`:** flag opcional en `EstadoProcesal`. Marca estados terminales (DEVUELTO_SECTOR_REQUIRENTE, FINALIZADO). El modal de cambio de estado los excluye del optgroup "Retroceder".
- **Cambio de estado Civil/Laboral:** avance secuencial (solo al siguiente estado). Retroceso permitido a CUALQUIER estado anterior, no solo al inmediatamente previo.
- **Cambio de estado Penal:** navegación libre entre etapas. Sin bloqueo por hitos. RECHAZADO es rama alternativa desde ACEPTADO.
- **Tipo de Intervención afecta tareas:** Actora y Demandada tienen conjuntos de tareas distintos para el mismo tipo de gestión y estado procesal.
- **Iniciar Juicio:** botón visible SOLO cuando `estadoProcesal === 'JUICIO_INICIADO'` y el tipo está en `TIPOS_CON_JUICIO`. Ver Sección 13.
- **Timer Iniciar Juicio:** 3 meses calendario desde la fecha de creación del documento nuevo. Alerta a los 75 días (2,5 meses). El timer se resetea con cada movimiento impulsorio registrado.
- **Movimiento impulsorio:** checkbox en modal de Nueva Actividad Genérica. Solo visible en documentos generados por Iniciar Juicio (Demanda parte actora y Lanzamiento judicializado).
- **Nueva Actuación Penal:** Abogado Penalista, Asistente Jurídico Penal y Coordinador pueden crear actuaciones Penales sin pasar por Mesa SACO. Área pre-seleccionada en Penal (no editable). Letrado selección manual. Mesa SACO recibe notificación en campana al crearse.
- **Reasignación:** al reasignar, el letrado nuevo recibe notificación de asignación y el anterior recibe notificación de desasignación.

---

## 8. Módulo de actividades (Timeline)

El timeline del expediente tiene DOS capas:

**Capa 1 — Tareas estructuradas por estado procesal (Civil/Laboral):**
- Definidas en `src/data/estadosProcesales.ts`
- Cada estado tiene tareas con 3 estados posibles: en_curso / cumplido / no_procedente
- Todas las tareas arrancan en **en_curso** al inicializarse. No existe estado vacío.
- Cuando todas las tareas están en cumplido o no_procedente → leyenda verde "Ya podés pasar de Estado". El cambio de estado se ejecuta siempre desde el menú +. **No existe botón "Avanzar →".**
- El estado ASIGNADO no tiene tareas — avanza desde Acciones → Cambiar estado
- Las tareas viven en `tareasMap` del expedientes.store
- Al avanzar de estado: se guarda snapshot inmutable de las tareas del estado anterior. Las tareas del nuevo estado se inicializan todas en en_curso.

**Capa 2 — Actividades genéricas:**
- Libres, no bloquean el avance de estado
- Se agregan desde el modal Nueva Actividad → solapa Actividades Genéricas
- Viven en `exp.timeline[]`
- Soportan replies: texto + PDF adjunto opcional

**Penal — Hitos procesales:**
- No hay tareas obligatorias. El abogado registra hitos cuando ocurren en la causa.
- Hitos opcionales, no secuenciales. Solo aparecen los no registrados aún en el estado actual.
- Tipos: SI/NO, HAY ACUERDO / NO HAY ACUERDO, LIBRE.
- Estado inicial de todo hito: en_curso (automático).
- Algunos hitos tienen consecuencias al quedar firmes: Finaliza causa o Avanza de estado. El sistema muestra aviso antes de guardar.
- Feed Penal tiene tabs: Todo | Sistema | Procesales | Genéricas

**Feed del timeline (TimelineTab):**
- Se renderiza desde `gruposFeed` (useMemo) — agrupa entradas de sistema con sus actividades del período
- Entrada de RECEPCION se renderiza por separado al final, fuera de los grupos
- `feedFiltrado` se usa solo para export y contadores de tabs
- Al expandir un grupo → panel inline de tareas históricas (solo lectura)

**Sistema de Replies:**
- Cada actividad puede tener `replies?: Reply[]`
- Botón "Comentar" visible solo para `usuarioActivo.id === exp.abogado_id`
- Acción en store: `agregarReply(expId, actividadIdx, replyData)`
- Reply soporta: texto, fecha, doc_gde, fecha_vencimiento y fecha_aviso opcionales

**Export timeline:**
- `actividadesToFilas()` en `exportTimeline.ts` construye filas para Excel/PDF
- Caracteres Unicode se sanitizan con `sanitizarParaPDF()` antes de jsPDF
- `estadoExpediente` en filas de cambio/retroceso muestra el estado ORIGEN

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
| BandejaAbogado/ | /bandeja/abogado (alias) | ABOGADO, COORDINADOR, REFERENTE | Agrupación por causa; filtros Urgentes + Por vencer; tabs Activos/Archivados |
| BandejaArea/ | /bandeja/area (alias) | COORDINADOR, REFERENTE | Árbol causa↔expedientes; filtro por área preseleccionado |
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
| Tipo | Estados |
|------|---------|
| DEMANDA_CIVIL / DEMANDA_LABORAL (parte demandada) | ASIGNADO → INICIO → TRABA_LITIS → PRUEBA → ALEGATO → SENTENCIA_1_FAV / SENTENCIA_1_DESFAV → APELACION → SENTENCIA_2_FAV / SENTENCIA_2_DESFAV → REF → RECURSO_QUEJA → EJECUCION_SENTENCIA → FINALIZADO |
| DEMANDA_CIVIL_ACTORA / DEMANDA_LABORAL_ACTORA | Ídem con tareas de parte actora |
| LANZAMIENTO_JUDICIALIZADO | ASIGNADO → INICIO → SENTENCIA_LANZAMIENTO → SENTENCIA_2_FAV / SENTENCIA_2_DESFAV → REF → FINALIZADO |

### Tipos con bifurcación desde EN_ANALISIS (Ciclo A — con acuerdo extrajudicial)
Estados: `ASIGNADO → EN_ANALISIS` → (bifurcación) → `ACUERDO_EXTRAJUDICIAL` | `JUICIO_INICIADO` | `DEVUELTO_SECTOR_REQUIRENTE`

Tipos: COBRO_CANON, RECLAMO_CONTRAT, RECUPERO, EJECUCION_GAR, LANZAMIENTO

### Tipos con bifurcación desde EN_ANALISIS (Ciclo B — sin acuerdo extrajudicial)
Estados: `ASIGNADO → EN_ANALISIS` → (bifurcación) → `JUICIO_INICIADO` | `DEVUELTO_SECTOR_REQUIRENTE`

Tipos: CONSIGNACION, DESAFUERO

### Bifurcación en el modal de cambio de estado
- `EN_ANALISIS` tiene `siguiente: undefined` — no es flujo lineal
- Cuando `estadoProcesal === 'EN_ANALISIS'` el optgroup "Avanzar" muestra las opciones ramificadas según tipo

### Flujo "Iniciar Juicio"
1. Avanzar a `JUICIO_INICIADO` → toast informativo
2. Botón "Iniciar Juicio" en menú + se activa
3. `getTipoDocumentoNuevo(tipo)` devuelve el tipo del documento a crear:
   - COBRO_CANON / RECLAMO_CONTRAT / RECUPERO / EJECUCION_GAR → `DEMANDA_CIVIL_ACTORA`
   - LANZAMIENTO → `LANZAMIENTO_JUDICIALIZADO`
   - CONSIGNACION / DESAFUERO → `DEMANDA_LABORAL_ACTORA`
4. El documento nuevo activa timer de 3 meses. Ver Sección 7 — Timer Iniciar Juicio.

### Ciclos Penales
- QUERELLA / DEFENSA_PENAL: ASIGNADO → EN_ANALISIS → ACEPTADO → INSTRUCCION → JUICIO → EJECUCION_PENAL → ARCHIVO. Rama alternativa: RECHAZADO (desde ACEPTADO).
- CARTA_SAE_SUCESO: ASIGNADO → EN_ANALISIS → PROCEDE → FORMULA_DENUNCIA → ARCHIVO
- Navegación libre entre etapas — sin bloqueo por hitos.

---

## 14. Exportación de timeline

Funciones en `src/utils/exportTimeline.ts`:

- `actividadesToFilas(actividades, expId, area)` — convierte actividades a filas exportables. Para cambios/retrocesos de estado, `estadoExpediente` muestra el estado ORIGEN.
- `tareasToFilas(tareas, estadoProcesal, expId, area)` — convierte tareas a filas.
- `exportarExcel(filas, nombre, incluirExpediente)` — genera .xlsx con wrapText en columna tareas.
- `exportarPDF(filas, nombre, titulo, subtitulo, incluirExpediente)` — genera .pdf landscape con autoTable. Aplica `sanitizarParaPDF()` sobre título, descripción y tareas (Helvetica no soporta Unicode).

**Columna "Tareas realizadas":** `\n` entre tareas; `didParseCell` splitea el string para multilínea en PDF.

**Timeline de causa:** exportación incluye columnas adicionales `N° Actuación` y `Área`. Nombre de archivo: `timeline_causa_{N°_causa}_{fecha}.xlsx/.pdf`.

---

## 15. Pendientes de definición (confirmar con cliente antes de implementar)

- Comportamiento exacto al vencer el plazo de 3 meses de Iniciar Juicio (¿cambia estado? ¿notificación adicional?).
- Criterio para seleccionar nuevo expediente principal al desagrupar cuando el principal es el desagrupado.
- Si los hitos Penales registrados en el feed tienen opción de Reply.
- Si las actividades genéricas Penales tienen fecha de vencimiento y fecha de aviso (como Civil/Laboral).
- Si el ícono "Por vencer" aplica a expedientes Penales.
- Si el tab "Procesales" en el timeline de causa se muestra siempre o solo cuando hay actuaciones penales.
- Si al hacer click en una entrada del feed de causa navega al detalle de la actuación de origen.
- Distinción exacta entre rol `asistente_jurídico` y `abogado` (actualmente idénticos en el sistema).

---

## 16. Checklist antes de entregar

- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run build` sin errores
- [ ] Sin corchetes [nombre] visibles — todos los íconos mapeados en Icon.tsx
- [ ] Sin tokens v3 rotos (bg-surface, text-on-surface, etc.)
- [ ] Sin texto en inglés visible al usuario
- [ ] Reglas de negocio de la Sección 7 respetadas
- [ ] Datos mock coherentes con el dominio SIAJ
- [ ] Sin `console.log` temporales de debugging
