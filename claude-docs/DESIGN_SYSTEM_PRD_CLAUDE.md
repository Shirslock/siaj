# Alineación visual con el PRD — plan y estado

> Rama: `feat/design-system-prd` (desde `develop`, 2026-11-05).
> Fuente de verdad: `claude-docs/siaj-design-system.md` (rol MESA_SACO) y `siaj-design-system-letrado.md`
> (rol LETRADO), relevados de `siajtest.trenesargentinos.gob.ar`. Tailwind v4 en ambos; son clases del DOM.
> Decisiones de Cristian: **réplica completa** (no solo colores), **reestilizar también** las pantallas que el PRD
> no tiene (Boga, Novedades judiciales, Agenda, Licencias, Dashboard, Configuración, selector de usuario demo),
> **entrega por etapas** con revisión entre una y otra.

## Qué cambió en la base (Etapa 1)
- **Colores**: codemod único (script en el scratchpad de la sesión, no está en el repo) que reemplazó ~2.150 colores
  arbitrarios (`text-[#1b3a57]`, `bg-[#e8e8e8]`, `border-[rgba(0,0,0,.08)]`…) por la paleta Tailwind del PRD.
  Mapeo: navy texto → `gray-800`, navy fondo/borde → `blue-700`, `#4a6a84` → `gray-500`, `#7a9ab4` → `gray-400`,
  grises claros → `gray-50/100/200`, rojos/ámbar/verdes → su escala Tailwind. Si aparece un hex nuevo, mapear a mano.
  Los colores de gráficos (recharts, props `fill=`) no se tocaron.
- **Radios y pesos**: `rounded-xl/2xl` → `rounded-lg`; `font-black/extrabold/bold` → `font-semibold`;
  `tracking-widest` → `tracking-wide`. El PRD usa `rounded-md` (controles), `rounded-lg` (cards), `rounded-xl` (tabla
  y modal) y `font-medium/semibold`.
- **`src/index.css`**: sin Google Fonts (stack del sistema, como el PRD). Tokens de marca: `--color-header-bg #0B2545`,
  `--color-surface #F4F6F8`, `--color-sidebar-bg #E5E5E5`, `--color-area-civil #1E3A5F`, `--color-area-penal #78350F`.
  `--color-area-laboral #115E59` es **provisorio**: el PRD no relevó el color de LABORAL.
  `.field-input` / `.field-label` pasaron a las clases del PRD; `.shadow-card` ahora es borde gris-200 sin sombra.
- **UI base**: `Button` (primario `blue-700`, secundario borde `gray-300`, `rounded-md`), `Badge` (Área = chip rectangular
  con fondo de marca; Estado = chip neutro `gray-100`, igual para todos), `Modal` (patrón del PRD, ahora con `subtitulo`),
  `FormField`.
- **Layout** (`AppLayout`, `Topbar`, `Sidebar`, `ui.store`): contenedor `h-screen`, header navy sticky de 48px con
  hamburguesa + "TRENES ARGENTINOS OPERACIONES" + buscador global (se mantiene) + campana + "Hola, Nombre Apellido";
  sidebar off-canvas (`sidebarOpen`, cerrado por defecto) con "SIAJ" y el selector de usuario de la demo al pie.
  El `<main>` hace scroll propio (`#app-main`). Se quitó el título del header: cada página debe llevar su `h1`.
- **Bandeja Mesa SACO** (`MesaSaco.page.tsx`, reescrita) y **Actuaciones** (`BandejaAbogado.page.tsx`): barra de acciones
  del PRD (primario + toggle Activos/Archivados + chips), tabla en card `rounded-xl shadow-md`, fila de filtros,
  filas de grupo por causa con chevron `blue-900` y chips del PRD. Mesa SACO ganó columna Estado, orden por columna,
  menú ⋮ "Visualizar" y paginación (10/25/50/100) como en el PRD.
  `BandejaArea.page.tsx` no está ruteada (alias a `/actuaciones`): no se tocó.

## Etapas
1. ✅ Base + layout + Bandejas (Mesa SACO y Actuaciones).
2. ⏳ Alta de actuación (formulario progresivo, dropzone, secciones) y Detalle: header sticky con chips, tabs con
   contadores, cards de Datos, Línea de tiempo (stepper, acordeón de etapas, filtros, tarjetas de hito y genéricas),
   Documentos, Vinculados, Intervinientes, y los modales del Letrado (Cambiar estado, Agrupar, Nueva actividad,
   Editar hito, Comentar).
3. ⏳ Principal (KPIs cuadrados, paneles, barras) y el resto: Boga, Novedades judiciales, Agenda, Licencias,
   Dashboard, Configuración.

## Pendientes / a confirmar
- Color del chip de área LABORAL (el PRD no lo muestra).
- El PRD no tiene: buscador global, Boga, Novedades judiciales, Agenda, Licencias, selector de usuario. Se conservaron
  y se les aplica el mismo estilo.
- Paginación solo en Mesa SACO; la bandeja agrupada de Actuaciones muestra "Mostrando 1–N de N" sin paginar.
- El prototipo no persiste nada: la paginación/filtros son del lado del cliente.

## Verificado contra el PRD real (2026-11-05)
Se abrió `https://siajtest.trenesargentinos.gob.ar/actuaciones/mesa-saco` con Claude in Chrome y se leyó el HTML.
- Fila de título: `flex items-start justify-between flex-wrap gap-3`; izquierda `h1 text-2xl font-semibold` + `p text-sm text-gray-500 mt-0.5`
  ("Gestionando N actuaciones activas"); derecha `flex flex-wrap items-center justify-end gap-2` con **+ Nueva Actuación**,
  Activos / Archivados (botones pegados), Urgentes (llama), Por vencer (triángulo) y Limpiar filtros (×).
  El PRD **no** tiene "Exportar Excel" ni "Expandir todo": son del prototipo (Delta 18) y van al final de la barra.
- Estructura de página: `main.p-4` > `div.p-6.space-y-4`. Ya replicado (`AppLayout` y las dos bandejas).
- Header: `bg-[#0B2545] p-4 max-h-12`, logo = imagen `logoTrenes.svg` (`w-44 h-6`, invertida a blanco). El avatar (`profile.svg`, 30px) ya se replicó como SVG inline (`PerfilIcon` en `Topbar.tsx`), aproximado a partir de la captura porque el archivo no se pudo leer.
  El prototipo usa un wordmark de texto y las iniciales; para igualarlo haría falta copiar el SVG del logo (pendiente de OK).
- El resto de las páginas (p-6/p-8 propios) llevan ahora 16px extra por el `main.p-4`: se normaliza en las etapas 2 y 3.

## Etapa 2a — Detalle (2026-11-05)
Relevado en el PRD como Penal (actuación `/actuaciones/699`, Carta SAE Suceso; se la pasó a *Procede* y se registró el hito
3.1 ¿Hay delito? = Sí / Cumplido para ver cómo queda). Hecho en el prototipo:
- **Detalle** (`DetalleExpediente.page.tsx`): `max-w-4xl mx-auto p-6`, header sticky con migas, h1 con el N°, chips
  (área, estado con su **nombre** y no el código, causa, urgente, vencido/por vencer), botón "Marcar urgente" y "+" con menú
  (`w-52`), tabs con contador (activo azul). Las pestañas propias del prototipo (Novedades judiciales, Boga) se conservan.
  Helper nuevo `utils/estadoLabel.ts` (`labelEstado`): también se usa en las bandejas.
- **Datos** (`DatosTab.tsx`): dos cards como el PRD ("Datos de la Actuación" y "Detalle — {tipo}"), grilla de 3 columnas,
  `dt` en mayúsculas gris, link "Editar" azul en el header de la card; la lógica de edición no cambió.
- **Pendiente de esta etapa:** Línea de tiempo, Documentos, Intervinientes, Vinculados, modales del Letrado y Alta.

### Lo que hay que tener en cuenta para la Línea de tiempo (diferencias de modelo)
- El PRD agrupa en **acordeón por etapa** (una por estado, la más reciente arriba; la actual con `bg-blue-50`, punto azul y chip
  ACTUAL; adentro "Ingresó desde X · por USUARIO" y los eventos). El prototipo muestra un **feed plano**; las actividades ya
  traen `estadoExpediente`, así que agrupar es viable.
- Stepper del PRD: círculo `w-9 h-9`; completado verde con ✓, actual azul con `ring-4 ring-blue-100`, pendiente gris;
  conector `h-0.5`. El prototipo Penal tiene además el paso "Rechazado" (rojo), que el PRD no muestra.
- Filtros del PRD en Penal: Todo · Sistema (n) · Procesales (n) · Genéricas (n) + Exportar + "Nueva Actividad" (azul).
- Hito registrado: círculo violeta con ✓, "3.1 — ¿Hay delito?", chips etapa (gris) · Cumplido (verde) · Sí (verde) · responsable,
  fecha y link "Editar". Nueva Actividad > Procesales lista los hitos de la etapa; al elegir uno: Resultado Sí/No, Resolución
  (dropzone), Fecha, Organismo Judicial, Estado (En curso / Cumplido / No proc.), Fecha vencimiento; botones Volver / Registrar.

## Etapa 2b — Línea de tiempo en acordeón por etapa (2026-11-05, rama `feat/timeline-prd`)
- **Componentes compartidos** (`src/components/timeline/`): `StepperPRD` (completado verde ✓, actual azul con anillo, pendiente gris,
  "rechazado" rojo; conector `h-0.5`) y `EtapasAcordeon` (una etapa por estado, la más reciente arriba; la actual abierta, `bg-blue-50`,
  punto azul y chip ACTUAL; adentro "Ingresó desde X · por USUARIO" o "Salió hacia Y · por USUARIO", los eventos o "Sin eventos en este estado.").
- **Penal** (`TimelinePenal.tsx`): el feed plano pasó a acordeón. Un evento pertenece a la etapa a la que ingresó la transición de estado
  anterior a él (`historialCompleto` viene en orden descendente). Lo anterior a la primera transición desde "Asignado" va a la etapa más
  antigua mostrada. Filtros Todo / Sistema / Procesales / Genéricas con contador, Exportar (Excel/PDF) y Nueva Actividad. Los hitos se ven
  como en el PRD (círculo violeta con ✓, chips etapa · estado · resultado, link Editar). El paso "Rechazado" se conserva en rojo.
  El cambio de estado ahora guarda `creado_por` (antes Penal no registraba quién).
- **Civil/Laboral** (`TimelineTab.tsx`): mismo acordeón. Las tareas ahora viven **dentro** de cada etapa (`TareasEtapa`: barra de progreso,
  lista, banner "Ya podés pasar de Estado"); en las etapas pasadas son el snapshot de solo lectura. Se eliminaron `ActividadFeedItem`,
  `TareasBlock` y `TareaFeedItem`. El panel lateral de la tarea (`TareaDetailPanel`) sigue a la derecha. Chip "N de M completadas".
- `labelEstado()` ahora resuelve también los estados penales (`etapasPenales`).
- **Diferencias que quedan**: Carta SAE tiene 6 etapas en el PRD y 7 en el prototipo (incluye Rechazado); el ciclo de estados por tipo
  es dato de negocio, no se tocó.

## Etapa 2c — Documentos, Intervinientes, Vinculados, modales y Alta (rama `feat/modales-docs-alta-prd`)
- **Documentos / Intervinientes / Vinculados**: una card `bg-white border border-gray-200 rounded-lg p-5` con título, contador y botón azul
  `text-xs rounded-md` arriba a la derecha. Documentos: columnas Archivo · Tipo · Tamaño · Subido, chip PDF rojo, handle de arrastre.
  Intervinientes: estado vacío "Sin intervinientes registrados." + "+ Agregar el primero". Vinculados: tarjetas con N° azul, chips de área,
  tipo de gestión y relación.
- **Modales**: `Modal` acepta `subtitulo` (ReactNode). "Actuación: ID" en Cambiar estado (con "Estado actual"), Agrupar a causa, Nueva Actividad,
  Comentar y Editar; solapas con subrayado azul. El formulario del hito sigue el PRD: Resultado Sí / No, Estado En curso · Cumplido · No proc.
  (seleccionado en azul), etiquetas `text-xs font-medium`. Se quitó la línea "Etapa: … — Seleccioná la actividad" y el borde de color de las tarjetas de hito.
- **Alta** (`AltaExpediente.page.tsx`): `max-w-4xl`, título "Nuevo Ingreso de Actuación", secciones sin círculo numerado con `h2 text-lg … border-b`,
  Canal y Área como listas desplegables ("Seleccioná..."), dropzone del PRD ("Solo PDF · Máx. 20 MB"), botones "Cancelar" / "Revisar y enviar".
- Pendiente de etapas anteriores: Principal (KPIs cuadrados, paneles, barras) y Boga, Novedades judiciales, Agenda, Licencias, Dashboard, Configuración.
