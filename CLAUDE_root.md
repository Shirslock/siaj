# CLAUDE.md — SIAJ Frontend
# Sistema Integral de Asuntos Jurídicos — SOFSA / Trenes Argentinos
# Rama activa: feat/asistente-ia-chat (desde develop)

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
| @dnd-kit/core + sortable + utilities | — | Drag-and-drop (DocumentosTab) |
| Recharts | recharts | Gráficos del Dashboard (donut por área, barras por letrado/sub-estado) |
| Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/groq`) | `ai@7` | Chat del Asistente IA (`AsistenteTab.tsx`) — ver `claude-docs/ASISTENTE_IA_CLAUDE.md` |

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
| `src/data/usuarios.ts` | 32 usuarios reales UR_001–UR_032, roles y asignaciones. |
| `src/data/expedientes.mock.ts` | Datos de ejemplo: queue de mesa, expedientes, detalle. |
| `src/data/estadosProcesales.ts` | Estados y tareas por tipo de gestión. 13 ciclos definidos (ver Sección 13). |
| `src/data/causalesFinalizacion.ts` | Catálogo de causales de finalización por `grupoCausal`, usado en el modal "Finalizar actuación" de los 4 ciclos de Demanda Civil/Laboral. |
| `src/store/expedientes.store.ts` | Estado de expedientes + acciones + tareasMap. |
| `src/store/ui.store.ts` | Usuario activo, sidebar, sessionStorage, búsqueda global (`busquedaGlobal`). |
| `src/store/configuracion.store.ts` | Estado del panel de administración — catálogos editables + usuarios. |
| `src/store/pjn.store.ts` | Novedades detectadas por la sincronización con el Portal PJN — aplicar/descartar. También `actuacionesSinCargar` — alertas de causas que el PJN expone sin actuación cargada en SIAJ — descartar/resolver. Ver `claude-docs/NOVEDADES_PJN_CLAUDE.md`. |
| `src/store/notificaciones.store.ts` | Notificaciones reales del Topbar (ASIGNACION/REASIGNACION/ALERTA_VENCIMIENTO). La campana también mezcla novedades PJN pendientes como entradas virtuales — no persisten en este store. |
| `src/components/ui/Icon.tsx` | Wrapper de íconos. Mapea nombres → Heroicons. SIEMPRE usar <Icon name="..."> |
| `src/components/ui/Button.tsx` | 4 variantes: primary, secondary, ghost, danger. |
| `src/components/ui/Modal.tsx` | Modal Headless UI. Props: open, onClose, titulo, size, footer. |
| `src/components/ui/Badge.tsx` | EstadoBadge, AreaBadge, RolBadge. |
| `src/components/ui/FormField.tsx` | Wrapper label + hint + error para inputs. |
| `src/components/layout/` | AppLayout, Sidebar, Topbar (con buscador global persistente — ver Sección 19), UserSwitcher. |
| `src/components/expedientes/` | TablaExpedientes, FilaExpediente, FormularioDinamico. |
| `src/pages/*/` | Una carpeta por página. NombrePagina.page.tsx + hooks locales. |
| `src/pages/Configuracion/` | Panel de administrador — solo REFERENTE. Ver Sección 17. |
| `src/utils/format.ts` | formatFecha, formatMonto, numerador. |
| `src/utils/routing.ts` | Constantes RUTAS + helper de accesos por rol. |
| `src/utils/alertas.ts` | `getAlertaExpediente(expId, tareasMap, timeline?)` — calcula alerta "Por vencer" de tareas y replies. |
| `src/utils/exportTimeline.ts` | Exportar timeline a Excel (xlsx) y PDF (jsPDF + autoTable). Ver Sección 14. |
| `src/utils/iniciarJuicio.ts` | `MAPA_INICIAR_JUICIO` y `getTipoDocumentoNuevo(tipo)` — mapea tipo origen → tipo documento nuevo. |
| `src/utils/pjnVisibilidad.ts` | `filtrarNovedadesPorRol(novedades, expedientes, usuario)` — visibilidad de novedades PJN por rol, compartida entre bandeja central, Sidebar, BandejaAbogado y Topbar. También `filtrarAlertasActuacionesPorRol(alertas, usuario)` — visibilidad de las alertas de "causa PJN sin cargar", regla provisoria (ver Sección 15). |
| `src/utils/pjnVencimiento.ts` | `esNovedadVencida(novedad, hoy?)` / `diasDesdeDeteccion(novedad, hoy?)` — flag derivado: una novedad pendiente "vence" a los 7 días sin aplicar/descartar. No toca `EstadoNovedadPJN` (sigue siendo `pendiente`/`aplicada`/`descartada`); solo cambia el filtro por defecto de la bandeja de Novedades PJN. |
| `src/utils/numeroCausa.ts` | `formatNumeroCausaPjn(exp)` — antepone la sigla de fuero PJN al `numero_causa` mostrado (ej. "CIV 61.204/2026"). Solo para display: no toca el `numero_causa` crudo, que sigue siendo la clave de agrupamiento/comparación. |
| `src/utils/busquedaGlobal.ts` | `buscarGlobal(query, expedientes, usuarios)` — índice cross-entidad del buscador del Topbar (Actuaciones/Intervinientes/Documentos/Usuarios). Ver Sección 19. |
| `src/hooks/useDebounce.ts` | Hook genérico `useDebounce<T>(value, delayMs)`. Usado por el buscador del Topbar (300ms). |
| `src/index.css` | @theme con tokens de color, fuentes, clases .field-input/.field-label. |
| `vercel.json` | Rewrites para SPA en Vercel. |
| `api/chat.ts` | Función serverless (edge) — proxy a Groq para el Asistente IA. Fuera de `src/`, no la builda Vite. Ver `claude-docs/ASISTENTE_IA_CLAUDE.md`. |
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
| `gerente` | REFERENTE | Todo: dashboard, todas las áreas, panel configuración. | /dashboard |
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
- **Cambio de estado Civil/Laboral:** avance secuencial (al siguiente estado según `siguiente`, o a las opciones ramificadas si el estado actual bifurca — ver `getRamificaciones` en Sección 13). Retroceso permitido a CUALQUIER estado anterior, no solo al inmediatamente previo. Retroceso exige motivo obligatorio (asterisco rojo, botón Confirmar deshabilitado sin texto) — a diferencia del avance, donde el motivo es opcional.
- **"Finalizado" siempre disponible:** solo para `DEMANDA_CIVIL`, `DEMANDA_LABORAL`, `DEMANDA_CIVIL_ACTORA`, `DEMANDA_LABORAL_ACTORA` (`TIPOS_FINALIZACION_LIBRE` en `DetalleExpediente.page.tsx`). El optgroup "Avanzar" del modal Cambiar Estado siempre agrega la opción "Finalizado" al final, sin importar el estado actual. Al elegirla se abre un segundo modal ("Finalizar actuación") pidiendo la **causal de finalización** — ver `causalesFinalizacion.ts` y campo `grupoCausal` de `EstadoProcesal` (Sección 13). El resultado se guarda en `Expediente.causal_finalizacion` (bloqueado, solo lectura en DatosTab) y queda registrado en el timeline.
- **Recurso de Queja — ELIMINADO:** el sistema de trámite paralelo (flag `queja_en_tramite`, checklist `TAREAS_RECURSO_QUEJA`, acción `toggleQuejaEnTramite`, bloque visual en REF/EJECUCION_SENTENCIA) fue dado de baja por completo — decisión de negocio. Ya no existe en el código. `REF.siguiente` sigue apuntando directo a `EJECUCION_SENTENCIA`, sin ningún trámite asociado.
- **Cambio de estado Penal:** navegación libre entre etapas. Sin bloqueo por hitos. RECHAZADO es rama alternativa desde ACEPTADO.
- **Tipo de Intervención afecta tareas:** Actora y Demandada tienen conjuntos de tareas distintos para el mismo tipo de gestión y estado procesal.
- **Iniciar Juicio:** botón visible SOLO cuando `estadoProcesal === 'JUICIO_INICIADO'` y el tipo está en `TIPOS_CON_JUICIO`. Ver Sección 13. Para la mayoría de los tipos **parchea el expediente actual** (no crea uno nuevo); **LANZAMIENTO es la excepción** — crea un expediente `LANZAMIENTO_JUDICIALIZADO` nuevo, mismo patrón que "Nueva Querella" (ver Sección 13).
- **Timer Iniciar Juicio:** 3 meses calendario desde la fecha de creación del documento nuevo. Alerta a los 75 días (2,5 meses). El timer se resetea con cada movimiento impulsorio registrado.
- **Movimiento impulsorio:** checkbox en modal de Nueva Actividad Genérica. Solo visible en documentos generados por Iniciar Juicio (Demanda parte actora y Lanzamiento judicializado).
- **`es_principal` nunca sin `numero_causa`:** el badge "Principal · PJN" exige un número de causa REAL — nunca puede quedar `true` si `numero_causa` es `null`/vacío. En los flujos que crean un expediente nuevo agrupado a una causa (`confirmarNuevaQuerella`, `confirmarIniciarJuicio` rama Lanzamiento) se calcula `tieneCausaReal = !!(campo del modal || exp.numero_causa)`, **sin contar el fallback a `exp.id`** (ese fallback es solo un sentinela de agrupación cuando no hay causa real todavía, no una causa verdadera) — y ese booleano es el que se asigna a `es_principal`, no `true` hardcodeado.
- **Nueva Actuación Penal:** Abogado Penalista, Asistente Jurídico Penal y Coordinador pueden crear actuaciones Penales sin pasar por Mesa SACO. Área pre-seleccionada en Penal (no editable). Letrado selección manual. Mesa SACO recibe notificación en campana al crearse. **Único punto de acceso: botón "+ Nueva Actuación" del header de `BandejaAbogado.page.tsx`** (gate `esAbogadoPenal(usuarioActivo)`). El menú `+` de `DetalleExpediente.page.tsx` tenía una opción duplicada ("Nueva Actuación") que navegaba a la misma ruta genérica sin precompletar nada del expediente abierto — se eliminó por ser redundante.
- **Iniciar Querella:** opción del menú `+` en `DetalleExpediente.page.tsx`, visible cuando `exp.tipo === 'CARTA_SUCESO' && !exp.es_querella_iniciada`. Se llamaba "Nueva Querella" en el label del menú, título de modal y en el título de la actividad que queda registrada en la Carta SAE de origen — renombrado a "Iniciar Querella" / "Querella iniciada" para UI; identificadores internos (`confirmarNuevaQuerella`, `formQuerella`, `BLANK_QUERELLA`) no se tocaron.
- **Orden dentro de un grupo-causa (Bandeja):** el expediente con `es_principal: true` siempre se renderiza primero al expandir el grupo; el resto conserva su orden relativo (sort estable). Aplicado en `BandejaAbogado.page.tsx` (map de `exps` antes de `renderExpRow`), `BandejaArea.page.tsx` (`renderFilasChild`) y `TablaExpedientes.tsx` (tabla de expedientes de `CausaDetalle.page.tsx`). `construirItems()`/`causaMap` NO se tocan — el sort va justo antes del render, no en el agrupamiento.
- **Tabs Activos/Archivados de BandejaAbogado:** `ESTADOS_CERRADO` decide qué cae en "Archivados". Incluye `'ARCHIVO'` (código real del ciclo Penal) además de `'ARCHIVADO'`/`'ARCHIVADA'`/`'CERRADO'`/`'CUMPLIDO'`/`'COMPLETADA'` — sin `'ARCHIVO'` en la lista, ningún expediente Penal archivado aparecía nunca en "Archivados" (bug preexistente, corregido).
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
- Tipo `RECURSO_INCIDENTE` ("Interposición de Recurso"): una opción más del select de Tipo, sin lógica adicional — no toca `estadoProcesal`. Aplica a cualquier estado de los 4 ciclos de Demanda Civil/Laboral.
- Tipo `DILIGENCIAMIENTO` ("Diligenciamiento"): confirmado por negocio para registrar el envío de cédulas hasta contar con un módulo de diligenciamientos separado (MATRIZ SACO sección 2.5). Igual patrón que `RECURSO_INCIDENTE` — opción más del select en `TimelineTab.tsx` (`TIPOS` + `iconMap: 'forward'`), sin lógica adicional. **Solo en `TimelineTab.tsx`** (Civil/Laboral) — `TimelinePenal.tsx` tiene su propia lista `TIPOS` más corta que tampoco incluye `RECURSO_INCIDENTE`, no se tocó.

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

**Generador de Escritos (Presentación):**
- Botón "Generar Escrito" en el modal Nueva Actividad, visible cuando `formAct.tipo === 'PRESENTACION'`
- **Civil/Laboral** (`TimelineTab.tsx`): habilitado, abre `GenerarEscritoModal` (wizard de 4 pasos — Grupo → Título → Datos → Vista previa) con catálogo de 29 plantillas (MT-01 a MT-29, `src/data/escritos.ts`). Genera y descarga un `.docx` real (`src/utils/escritoDocx.ts`, librería `docx`) y registra la actividad con `escrito_id`/`escrito_estado: 'GENERADO'`.
- **Penal** (`TimelinePenal.tsx`): botón visible pero deshabilitado (tooltip "Catálogo de escritos Penal — próximamente") — no hay catálogo penal todavía.
- Circuito de aprobación externa: la actividad queda `GENERADO` (badge ámbar "Pendiente de aprobación externa") hasta que el letrado adjunta el documento aprobado vía el mismo flujo de Reply (`agregarReply`) con `doc_gde` cargado — ahí pasa automáticamente a `escrito_estado: 'APROBADO_CARGADO'` (badge verde "Aprobado y cargado"). No hay backend ni AI en esta etapa (ver `claude-docs/spec_generador_escritos.md`).
- Firmante/Matrícula: `src/data/matriculas.ts`, un solo select con sugerencia por `getMatriculaSugerida(usuarioActivo.id, exp.area)`.

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
| Dashboard/ | /dashboard | REFERENTE, COORDINADOR, ABOGADO | Analytics estilo Power BI, 3 vistas por rol (recharts) — ver Sección 18 |
| MesaSaco/ | /mesa | ADMINISTRATIVO | Filtros embebidos en thead |
| AltaExpediente/ | /mesa/alta | ADMINISTRATIVO | Canal→Área→Tipo + modal confirmación |
| Actuaciones/ | /actuaciones | ABOGADO, COORDINADOR, REFERENTE | Router por rol — ver Sección 6 |
| BandejaAbogado/ | /bandeja/abogado (alias) | ABOGADO, COORDINADOR, REFERENTE | Agrupación por causa; filtros Urgentes + Por vencer; tabs Activos/Archivados |
| BandejaArea/ | /bandeja/area (alias) | COORDINADOR, REFERENTE | Árbol causa↔expedientes; filtro por área preseleccionado |
| DetalleExpediente/ | /expediente/:id | ABOGADO, COORDINADOR, REFERENTE | 7 tabs — ver Sección 10a |
| CausaDetalle/ | /causa/* | ABOGADO, COORDINADOR, REFERENTE | 4 tabs, ruta tolera barras |
| Configuracion/ | /configuracion | REFERENTE únicamente | Panel admin — ver Sección 17 |
| Agenda/ | /agenda | ABOGADO, COORDINADOR, REFERENTE | Pendiente |
| NovedadesPJN/ | /novedades-pjn | ABOGADO, COORDINADOR, REFERENTE | Bandeja de novedades del Portal PJN — ver `claude-docs/NOVEDADES_PJN_CLAUDE.md` |

### 10a. Tabs de DetalleExpediente

| Tab | Archivo | Estado |
|-----|---------|--------|
| Datos | DatosTab.tsx | ✓ edición completa |
| Timeline | TimelineTab.tsx | ✓ tareas + actividades + feed colapsable |
| Intervinientes | IntervinientesTab.tsx | ✓ CRUD completo (agregar, editar, eliminar) |
| Documentos | DocumentosTab.tsx | ✓ carga + drag-and-drop reordenamiento |
| Previsión | PrevisionTab.tsx | ✓ mock SIGEJ |
| Vinculados | VinculosTab.tsx | ✓ modal vincular |
| Saúl (Asistente IA) | AsistenteTab.tsx | ✓ chat con contexto de la actuación — ver `claude-docs/ASISTENTE_IA_CLAUDE.md` |

Además, si hay novedades PJN pendientes para la actuación abierta, `DetalleExpediente.page.tsx`
muestra un banner arriba del contenido (cualquier tab) con acceso a revisarlas inline.

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

### Los 4 ciclos MATRIZ SACO — Demanda Civil/Laboral (Actora/Demandada)
| Tipo | Estados |
|------|---------|
| DEMANDA_CIVIL (parte demandada) | ASIGNADO → INICIO → TRABA_LITIS → EN_PRUEBA → ALEGATO → SENTENCIA_1_FAV \| SENTENCIA_1_DESFAV → APELACION → SENTENCIA_2_FAV \| SENTENCIA_2_DESFAV → REF → EJECUCION_SENTENCIA → FINALIZADO |
| DEMANDA_LABORAL (parte demandada) | Ídem estructura, ciclo propio (ya NO alias de DEMANDA_CIVIL) con tareas de fuero laboral |
| DEMANDA_CIVIL_ACTORA / DEMANDA_LABORAL_ACTORA | Ídem estructura con tareas de parte actora. Único detalle de nomenclatura heredado: usan el código `PRUEBA` (no `EN_PRUEBA`) para el nodo de prueba |

**Cada nodo de los 4 ciclos MATRIZ SACO tiene `grupoCausal`** (`EstadoProcesal.grupoCausal`), usado por el modal "Finalizar actuación" para resolver el catálogo de causales (`causalesFinalizacion.ts`):
- `INICIO`, `TRABA_LITIS`, `EN_PRUEBA`/`PRUEBA`, `ALEGATO` → `PRE_SENTENCIA_1`
- `SENTENCIA_1_FAV`, `SENTENCIA_1_DESFAV` → `SENTENCIA_1`
- `APELACION`, `SENTENCIA_2_FAV`, `SENTENCIA_2_DESFAV`, `REF` → `INSTANCIA_RECURSIVA`
- `EJECUCION_SENTENCIA` → `EJECUCION_SENTENCIA` (incluye la tarea final "Registrar causal de finalización")

**Recurso de Queja fue dado de baja por completo** (no solo como nodo de la cadena) — decisión de negocio. `REF.siguiente` apunta directo a `EJECUCION_SENTENCIA`, sin ningún trámite paralelo asociado.

### LANZAMIENTO_JUDICIALIZADO — reconstrucción MATRIZ SACO (split Operativo/Comercial)
Ciclo propio de 11 estados, con split por `campos_mesa.mesa_tipo_lanzamiento` ('Operativo' | 'Comercial') y bifurcación por vulnerabilidad en `CONSTATACION_JUDICIAL`:

Circuito completo (Operativo, con personas vulnerables):
```
ASIGNADO → INICIO → CONSTATACION_JUDICIAL
  → TRASLADO_DEFENSOR_OFICIAL → TRABA_LITIS → SENTENCIA_LANZAMIENTO
  → APELACION_LANZ → SENTENCIA_CAMARA → REF_LANZ → SENTENCIA_FIRME
  → MANDAMIENTO_LIBRADO → LANZAMIENTO_EFECTIVIZADO → TERMINADO (esArchivado, label "Finalizado")
```

Circuito Comercial (salto directo, ignora Constatación Judicial y toda instancia recursiva):
```
INICIO → SENTENCIA_LANZAMIENTO → MANDAMIENTO_LIBRADO → LANZAMIENTO_EFECTIVIZADO → TERMINADO
```
Resuelto por `getSiguienteLanzamiento(codigoActual, tipoLanzamiento)` + `SALTOS_LANZAMIENTO_COMERCIAL` en `DetalleExpediente.page.tsx`, con prioridad **salto Comercial > ramificación genérica > siguiente lineal** en el cálculo de "Avanzar" del modal (y en el preselect de `openAccion('estado')`). Los estados que el circuito Comercial salta (`CONSTATACION_JUDICIAL`, `TRASLADO_DEFENSOR_OFICIAL`, `TRABA_LITIS`, `APELACION_LANZ`, `SENTENCIA_CAMARA`, `REF_LANZ`, `SENTENCIA_FIRME`) quedan disponibles solo por excepción vía Retroceder/Avanzar manual (motivo obligatorio).

Bifurcación desde `CONSTATACION_JUDICIAL` (vía `RAMIFICACIONES_POR_CODIGO`, igual mecanismo que ALEGATO/APELACION):
```
CONSTATACION_JUDICIAL → SENTENCIA_LANZAMIENTO ('Sentencia de Lanzamiento (sin vulnerables — directo)')
                       | TRASLADO_DEFENSOR_OFICIAL ('Traslado a Defensor Oficial (con vulnerables)')
```

Terminal propio: `TERMINADO` (no `FINALIZADO` como los 4 ciclos de Demanda — mismo label "Finalizado"
en la UI). `grupoCausal: 'LANZAMIENTO'` en **todos** los nodos, con catálogo propio en
`causalesFinalizacion.ts` (`CAUSALES_FINALIZACION.LANZAMIENTO` = Desistimiento / Acuerdo de entrega /
Otro — no comparte causales con Demanda Civil/Laboral). `TIPOS_FINALIZACION_LIBRE` incluye
`LANZAMIENTO_JUDICIALIZADO`; el código del terminal por tipo se resuelve con
`getCodigoFinalizado(tipo)` / `CODIGO_FINALIZADO_POR_TIPO` (reemplazó los literales `'FINALIZADO'`
hardcodeados del prompt anterior — necesario porque este ciclo usa `'TERMINADO'`).

### Ramificación genérica en el modal de cambio de estado — `getRamificaciones`
`DetalleExpediente.page.tsx` resuelve las opciones del optgroup "Avanzar" con
`getRamificaciones(codigoEstadoActual, tipoExpediente): string[]`, que reemplazó al viejo
`Record<TipoExpediente, string[]>` (`ESTADOS_DESDE_EN_ANALISIS`) — ya no alcanza porque la
ramificación de `ALEGATO`/`APELACION` depende del **código de estado**, no del tipo, y ese
código es igual en los 4 ciclos de Demanda:

```ts
// Genérico por código — igual para cualquier tipo que llegue a ese estado
RAMIFICACIONES_POR_CODIGO: {
  ALEGATO:                ['SENTENCIA_1_FAV', 'SENTENCIA_1_DESFAV'],
  APELACION:               ['SENTENCIA_2_FAV', 'SENTENCIA_2_DESFAV'],
  CONSTATACION_JUDICIAL:   ['SENTENCIA_LANZAMIENTO', 'TRASLADO_DEFENSOR_OFICIAL'],
}

// EN_ANALISIS es la excepción — su ramificación SÍ depende del tipo (ciclo A vs ciclo B)
getRamificaciones('EN_ANALISIS', tipo)  // → según TIPOS_EN_ANALISIS_CICLO_A / _CICLO_B
getRamificaciones('ALEGATO', tipo)      // → RAMIFICACIONES_POR_CODIGO['ALEGATO'], cualquier tipo
```

Si un estado no ramifica, `getRamificaciones` devuelve `[]` y el modal cae al fallback lineal
(`siguienteEstadoProcesal`, derivado de `EstadoProcesal.siguiente`).

Labels de las opciones ramificadas: `'Sentencia 1° Instancia — Favorable/Desfavorable'`,
`'Sentencia 2° Instancia — Favorable/Desfavorable'` (los 4 ciclos MATRIZ SACO de Demanda);
`'Sentencia de Lanzamiento (sin vulnerables — directo)'` / `'Traslado a Defensor Oficial (con
vulnerables)'` para `CONSTATACION_JUDICIAL` en LANZAMIENTO_JUDICIALIZADO.

### Tipos con bifurcación desde EN_ANALISIS (Ciclo A — con acuerdo extrajudicial)
Estados: `ASIGNADO → EN_ANALISIS` → (bifurcación) → `ACUERDO_EXTRAJUDICIAL` | `JUICIO_INICIADO` | `DEVUELTO_SECTOR_REQUIRENTE`

Tipos: COBRO_CANON, RECLAMO_CONTRAT, RECUPERO, EJECUCION_GAR, LANZAMIENTO

### Tipos con bifurcación desde EN_ANALISIS (Ciclo B — sin acuerdo extrajudicial)
Estados: `ASIGNADO → EN_ANALISIS` → (bifurcación) → `JUICIO_INICIADO` | `DEVUELTO_SECTOR_REQUIRENTE`

Tipos: CONSIGNACION, DESAFUERO

### "Finalizado" siempre disponible
`TIPOS_FINALIZACION_LIBRE` = `DEMANDA_CIVIL`, `DEMANDA_LABORAL`, `DEMANDA_CIVIL_ACTORA`,
`DEMANDA_LABORAL_ACTORA`, `LANZAMIENTO_JUDICIALIZADO`. El optgroup "Avanzar" siempre agrega
"Finalizado" al final (sin duplicar si ya viniera incluido en la ramificación — no pasa con
los códigos actuales). Al elegirlo, `confirmarEstado()` intercepta antes de mutar estado y
abre el modal "Finalizar actuación" (`modalCausal`) en vez de avanzar directo; ese modal
resuelve el catálogo de causales con `getCausalesPorEstado(grupoCausal del estado ORIGEN)` y,
si no hay catálogo para ese grupo, cae a un textarea libre. Al confirmar: guarda
`causal_finalizacion` en el expediente, avanza `estadoProcesal` al código terminal del tipo
(`getCodigoFinalizado(tipo)` — `'FINALIZADO'` para los 4 de Demanda, `'TERMINADO'` para
LANZAMIENTO_JUDICIALIZADO) y registra la actividad con la causal en la descripción.

### Bifurcación en el modal de cambio de estado
- `EN_ANALISIS` tiene `siguiente: undefined` — no es flujo lineal
- Cuando `getRamificaciones(codigoActual, tipo).length > 0` el optgroup "Avanzar" muestra las opciones ramificadas en vez del único siguiente lineal

### Flujo "Iniciar Juicio"
1. Avanzar a `JUICIO_INICIADO` → toast informativo
2. Botón "Iniciar Juicio" en menú + se activa
3. `getTipoDocumentoNuevo(tipo)` devuelve el tipo del documento a crear:
   - COBRO_CANON / RECLAMO_CONTRAT / RECUPERO / EJECUCION_GAR → `DEMANDA_CIVIL_ACTORA`
   - LANZAMIENTO → `LANZAMIENTO_JUDICIALIZADO`
   - CONSIGNACION / DESAFUERO → `DEMANDA_LABORAL_ACTORA`
4. El documento nuevo activa timer de 3 meses. Ver Sección 7 — Timer Iniciar Juicio.
5. **Comportamiento según tipo origen, en `confirmarIniciarJuicio()`:**
   - COBRO_CANON / RECLAMO_CONTRAT / RECUPERO / EJECUCION_GAR / CONSIGNACION / DESAFUERO:
     **parchea el expediente actual** — `campos_mesa.mesa_*`, `es_juicio_iniciado`,
     `fecha_inicio_juicio`. No crea nada nuevo. `exp.tipo` no cambia.
   - **LANZAMIENTO (única excepción):** crea un expediente **nuevo**
     (`id: C-LJ###### / L-LJ######` según área) con `tipo: 'LANZAMIENTO_JUDICIALIZADO'`,
     `estado`/`estadoProcesal: 'ASIGNADO'`, mismo patrón que `confirmarNuevaQuerella`
     (`agregarExpediente` + patch del origen con `es_juicio_iniciado`, `es_principal: false`,
     `numero_causa`). Requiere el campo `mesa_tipo_lanzamiento` (Operativo/Comercial, ver
     arriba) — el modal bloquea "Confirmar Inicio" sin ese campo si el tipo origen es
     LANZAMIENTO. `es_principal` del expediente nuevo usa `tieneCausaReal` (Sección 7), no
     `true` hardcodeado. Navega automáticamente al expediente nuevo tras confirmar.
   - Campos `mesa_ubicacion`/`mesa_linea` (existían en `formJuicio` pero no se volcaban a
     `campos_mesa`) están mapeados en ambos caminos desde esta reconstrucción.

### Ciclos Penales
- `getEtapasPenales(tipo)` (`src/data/etapasPenales.ts`) **ignora el parámetro `tipo`** y devuelve siempre el mismo ciclo (`ETAPAS_QUERELLA`) para **todos** los tipos del área PENAL — QUERELLA, DEFENSA_PENAL y CARTA_SUCESO (Carta SAE) incluidos. No hay un ciclo separado por tipo pese al nombre de la función.
- Camino lineal: ASIGNADO(0) → EN_ANALISIS(1) → ACEPTADO(2) → INSTRUCCION(3) → JUICIO(4) → EJECUCION_PENAL(5) → ARCHIVO(6).
- Rama alternativa: RECHAZADO (`numero: -1`, desde ACEPTADO) — excluida del stepper visual (`ProcesalStepperPenal` filtra `numero >= 1`).
- **DESARCHIVADO** (`numero: -2`, sub-estado transitorio, también excluido del stepper): solo alcanzable desde ARCHIVO ("Desarchivar actuación" en el select de Cambiar Estado), y desde ahí la única salida es volver a ARCHIVO ("Volver a Archivo"). Mientras está en DESARCHIVADO solo se admite cargar **una** actividad genérica (cualquier `TipoActividad`) antes de poder volver a archivar — restricción implementada en `TimelinePenal.tsx` reutilizando `gruposHistorial.actividadesActuales` (lo registrado desde el último `MOVIMIENTO` de cambio de estado). El ciclo Archivo ↔ Desarchivado se puede repetir sin límite. Badge ámbar dedicado en `Badge.tsx` (`ESTADO_CONFIG.DESARCHIVADO`).
- Navegación libre entre etapas — sin bloqueo por hitos.
- **`ESTADOS_POR_TIPO`** (`expedientes.mock.ts`) es un catálogo de estados **separado y no relacionado** con `getEtapasPenales` — pensado para tipos que caen al fallback del select de Cambiar Estado (Civil/Laboral sin ciclo propio en `estadosProcesales.ts`, p. ej. `OFICIO`, `MEDIACION`, `SECLO`). Para cualquier tipo de área PENAL esa entrada es **inalcanzable** en la UI real: `DetalleExpediente.page.tsx` chequea `exp.area === 'PENAL'` antes que `esFlujoProcesal`, así que un expediente Penal jamás llega al fallback que lee `ESTADOS_POR_TIPO`. La entrada `CARTA_SUCESO` ya se eliminó de ese catálogo (tenía valores ficticios como `'CARGADA'` que no correspondían a ningún código real). **Quedan pendientes de la misma limpieza** `ESTADOS_POR_TIPO.QUERELLA` y `ESTADOS_POR_TIPO.DEFENSA_PENAL` — mismo patrón de entrada muerta, detectado pero no eliminado todavía (sin mock actual que dependa de esos valores).

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
- Visibilidad de la alerta "actuación en PJN sin cargar en SIAJ" (`filtrarAlertasActuacionesPorRol`, `src/utils/pjnVisibilidad.ts`) — a quién le llega (¿letrado dueño del favorito PJN? ¿coordinador? ¿mesa/administrativo? ¿referente? podría ser más de uno). Pendiente de reunión de negocio 2026-09-01. Default actual (conservador, sin inferencia de área posible porque la causa no está en SIAJ): REFERENTE y COORDINADOR ven todas, ABOGADO no ve ninguna.

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

---

## 17. Panel de Administrador — Configuración del Sistema

Ruta: `/configuracion` — solo accesible para `rolSistema === 'REFERENTE'`.
Cualquier otro rol es redirigido a `/actuaciones`.

### Archivos

| Archivo | Responsabilidad |
|---------|----------------|
| `src/pages/Configuracion/Configuracion.page.tsx` | Layout dos columnas: sidebar de grupos + contenido |
| `src/pages/Configuracion/tablas.config.ts` | Definición de 5 grupos y 28 tablas editables |
| `src/pages/Configuracion/CatalogoPanel.tsx` | CRUD genérico para tipos simple/extended/tipoGestion |
| `src/pages/Configuracion/UsuariosPanel.tsx` | Tabla y edición de usuarios del sistema |
| `src/store/configuracion.store.ts` | Estado Zustand con catálogos + acciones agregarItem/editarItem/desactivarItem |

### Tipos de tabla

| Tipo | Columnas | Notas |
|------|----------|-------|
| `simple` | ID / Valor / Estado / Acciones | Modal nuevo (código + valor) o editar (solo valor) |
| `extended` | Nombre / Tipo / Provincia / Localidad / Estado / Acciones | Para juzgados, tribunales, fiscalías, UFIs, comisarías |
| `tipoGestion` | Código / Label / Áreas / Canal / Estado | Solo lectura visual (sin edición inline por complejidad) |
| `usuario` | Nombre / Rol / Área/s / Estado / Acciones | `UsuariosPanel` — lógica especial con FIFO y líneas ferroviarias |

### Tablas solo lectura

Las siguientes tablas son informativas (no se editan desde el panel):
- Área Jurídica (CIVIL / LABORAL / PENAL)
- Canal de Ingreso (EE_GDE / MEMO_GDE / OTROS)
- Tipo de Intervención

### Campo `activo` en CatalogoItem

`CatalogoItem` tiene `activo?: boolean` opcional. `undefined` equivale a activo.
El botón 🚫 desactivar setea `activo: false` — no elimina el ítem.

### Sanción con campo "Días"

Cuando `tabla.especial === 'sancion'` y el nombre del ítem contiene "suspens" (case-insensitive),
el modal de nuevo/editar muestra un campo extra "Días" numérico.

---

## 18. Dashboard analytics (estilo Power BI)

`src/pages/Dashboard/Dashboard.page.tsx` renderiza una de **3 vistas según `usuarioActivo.rolSistema`**.
Detalle completo en `src/pages/Dashboard/Dashboard_CLAUDE.md`.

- **REFERENTE:** KPIs globales (activas, Civil, Laboral, Monto expuesto) + donut por área + barras por letrado + semáforo global + tabla "Próximos vencimientos".
- **COORDINADOR:** todo filtrado a `usuarioActivo.areas[0]` + barras "Estado procesal del área" + tabla "Sin movimiento (+30 días)".
- **LETRADO** (fallback: no REFERENTE ni COORDINADOR): KPIs personales + donut de sub-estados + "Tareas hoy" + lista de vencimientos + tabla "Mis actuaciones".

**Gráficos con `recharts`** (import inline, self-contained). Todo se calcula en tiempo real desde
`useExpedientesStore` (expedientes + tareasMap) con `useMemo`; las alertas usan
`getAlertaExpediente()` de `utils/alertas.ts`. El botón "Exportar" del header es visual (sin acción).

**Nota de tipos:** `RolSistema` no incluye `'ASISTENTE'` — los asistentes caen en la vista LETRADO
por ser el fallback (`!esReferente && !esCoordinador`).

## 19. Buscador global (Topbar)

`Topbar.tsx` incluye un input de búsqueda persistente entre todas las páginas, respaldado por
`busquedaGlobal`/`setBusquedaGlobal` en `ui.store.ts`. Busca en tiempo real (debounce 300ms,
`hooks/useDebounce.ts`) sobre **4 entidades** vía `utils/busquedaGlobal.ts` (`buscarGlobal()`):
Actuaciones, Intervinientes, Documentos y Usuarios — no solo Actuaciones como antes.

- `buscarGlobal(query, expedientes, usuarios)` devuelve un `Record<TipoResultado, ResultadoBusqueda[]>`
  (`TipoResultado = 'actuacion' | 'interviniente' | 'documento' | 'usuario'`). Matchea:
  - Actuaciones: `id`, `caratula`, `numero_causa`, `campos_mesa.numero_ee_gde`, `tipo`.
  - Intervinientes: `nombre`, `numero_documento` (recorre `exp.intervinientes` de todos los expedientes).
  - Documentos: `nombre`, `tipo` (recorre `exp.documentos` de todos los expedientes).
  - Usuarios: `apellido + nombre`, `cuil` — solo activos (`activo ?? true`).
- El input ya **no redirige** al tipear. En su lugar despliega un dropdown flotante
  (`dropdownAbierto`, se abre cuando el query debounceado no está vacío) agrupado por entidad,
  con `AreaBadge`/`RolBadge` reusados de `components/ui/Badge.tsx`. Cierra con click afuera o ESC.
- Cada grupo muestra hasta 5 resultados. Si hay más:
  - **Actuaciones** → botón "Ver todos..." navega a `/actuaciones?q=<texto>` (comportamiento
    legado reutilizado, `BandejaAbogado.page.tsx` sigue leyendo `busquedaGlobal`/`q` como filtro
    en vivo — ambos conviven si el usuario está parado en `/actuaciones`).
  - **Intervinientes / Documentos / Usuarios** → botón "Ver todos... (N)" expande la lista
    **inline dentro del mismo dropdown** (no hay página central para esas 3 entidades).
- Click en un resultado de Actuación/Interviniente/Documento navega a
  `/expediente/:id?tab=<tab>` (`datos`/`intervinientes`/`docs` respectivamente) y limpia el buscador.
  `DetalleExpediente.page.tsx` lee `?tab=` con `useSearchParams` al montar (`tabInicial`, valida
  contra las 6 keys reales de `Tab`, fallback a `'datos'` si falta o es inválido) — no rompe la
  apertura normal sin query param.
- Usuarios es **informativo**: el ítem no es clickeable (no navega).
- El botón × limpia `busquedaGlobal` y cierra el dropdown, sin afectar el resto de los filtros
  de la bandeja.
