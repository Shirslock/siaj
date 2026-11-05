# SIAJ — Guía de estilos y componentes (relevada con rol MESA_SACO)

> Relevado desde `siajtest.trenesargentinos.gob.ar` en las pantallas: **Bandeja SACO**, **Nuevo Ingreso de Actuación**, **Detalle de Actuación** (tabs Datos, Línea de tiempo, Documentos, Vinculados).
> Pendiente: relevar con el rol **Letrado** (ver sección 13).

## 0. Cómo usar este documento (para Claude Code)

- La app está hecha con **Tailwind CSS v4** (los colores computados salen en `oklch`, que equivalen a la paleta por defecto de Tailwind). Todo lo de abajo está dado como **clases Tailwind exactas**, tal como están en el DOM. Si el prototipo usa Tailwind, copiar las clases tal cual.
- Si el prototipo NO usa Tailwind, usar la tabla de tokens (sección 1) con los hex equivalentes.
- Fuente: **no hay fuente custom**. Es el stack por defecto de Tailwind: `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`. Mono (solo N° de causa en vinculados): `ui-monospace, SFMono-Regular, ...` (`font-mono`).
- Iconos: SVG tipo outline/solid de 16–20 px (parecen Heroicons). Íconos usados: menú hamburguesa, campana, perfil, llama (urgente), triángulo de alerta (por vencer), X (limpiar filtros), tres puntos verticales (acciones), ojo (visualizar), carpeta emoji 📁 (dropzone), check (stepper), descarga, candado, archivo PDF rojo.
- Idioma de la UI: español rioplatense ("Seleccioná…", "Completá los datos…", "Arrastrá el PDF aquí o hacé clic para seleccionar").

---

## 1. Tokens

### Colores de marca / layout (valores arbitrarios, no de la paleta Tailwind)
| Uso | Valor | Clase |
|---|---|---|
| Header superior | `#0B2545` | `bg-[#0B2545]` |
| Fondo general de la app | `#F4F6F8` | `bg-[#F4F6F8]` |
| Sidebar (fondo) | `#E5E5E5` | `bg-[#E5E5E5]` |
| Sidebar (texto) | `#1b3a57` | `text-[#1b3a57]` |
| Chip área CIVIL | `#1E3A5F` | `style="background-color:#1E3A5F"` |
| Chip área PENAL | `#78350F` | `style="background-color:#78350F"` |
| Chip área LABORAL | **no relevado** (no había filas laborales en la vista) | — |

> Los colores de área se aplican con `style` inline (vienen de la base de datos). Sugerencia: guardar `color` en el catálogo de áreas.

### Paleta Tailwind usada (hex equivalentes)
| Token | Hex | Dónde se usa |
|---|---|---|
| `blue-50` | `#EFF6FF` | chip "Causa", chip contador, fondo de ítem activo |
| `blue-100` | `#DBEAFE` | chip "ACTUAL", anillo del paso actual, contador de tab activo |
| `blue-200` | `#BFDBFE` | borde chip causa, borde ítem activo |
| `blue-300` | `#93C5FD` | línea del stepper |
| `blue-500` | `#3B82F6` | barra de progreso |
| `blue-600` | `#2563EB` | tab activo, paso actual, toggle activo, íconos |
| `blue-700` | `#1D4ED8` | botón primario, links N° interno, focus de texto activo |
| `blue-800` | `#1E40AF` | hover botón primario |
| `gray-50` | `#F9FAFB` | thead, hover filas, dropzone |
| `gray-100` | `#F3F4F6` | fila de filtros, chips neutros, disabled |
| `gray-200` | `#E5E7EB` | bordes de cards, divisores |
| `gray-300` | `#D1D5DB` | bordes de inputs/botones secundarios |
| `gray-400` | `#9CA3AF` | placeholders, textos terciarios ("Sin causa") |
| `gray-500` | `#6B7280` | labels de tabla/tab inactivo, subtítulos |
| `gray-600` | `#4B5563` | texto de botones secundarios |
| `gray-700` | `#374151` | labels de formulario, títulos de sección |
| `gray-800` | `#1F2937` | H1, valores de datos |
| `gray-900` | `#111827` | texto de celdas |
| `red-100` / `red-700` | `#FEE2E2` / `#B91C1C` | chip Urgente, chip PDF |
| `red-500` / `red-600` | `#EF4444` / `#DC2626` | badge de campana / texto URGENTE en tabla |
| `amber-700` | `#B45309` | texto "POR VENCER" en tabla |
| `green-50/100/200` | `#F0FDF4` / `#DCFCE7` / `#BBF7D0` | banner "Ya podés pasar de Estado", chip Cumplido |
| `green-500` / `green-700` | `#22C55E` / `#15803D` | paso completado / texto verde |

### Tipografía
| Elemento | Clases | Computado |
|---|---|---|
| H1 de página | `text-2xl font-semibold text-gray-800` | 24px / 600 / lh 32px |
| Subtítulo de página | `text-sm text-gray-500 mt-1` | 14px / 400 |
| H2 de sección de formulario | `text-lg font-semibold text-gray-700 border-b pb-2` | 18px / 600 (borde inferior 1px gris-700) |
| H2 de card en detalle | `text-base font-semibold text-gray-700` | 16px / 600 |
| Label de formulario | `block text-sm font-medium text-gray-700 mb-1` | 14px / 500 |
| Label de dato (detalle) | `text-xs font-medium text-gray-500 uppercase tracking-wide` (`<dt>`) | 12px / 500 / ls 0.3px |
| Valor de dato (detalle) | `mt-0.5 text-sm text-gray-800 break-words` (`<dd>`) | 14px |
| Texto de tabla | `text-sm text-gray-900` | 14px |
| Header de tabla | `text-xs font-medium text-gray-500 uppercase tracking-wider` | 12px / 500 |
| Texto de ayuda | `text-sm text-gray-500` / `text-xs text-gray-400 mt-1` | |

### Radios, sombras, espaciado
- Botones / inputs / selects: `rounded-md` (6px).
- Cards de formulario y detalle: `rounded-lg` (8px), `border border-gray-200`, **sin sombra**.
- Card de tabla (bandeja): `rounded-xl` (12px) + `shadow-md` + `border border-black border-opacity-20`.
- Chips de área/estado rectangulares: `rounded` (4px). Chips "píldora": `rounded-full`.
- Header: `shadow-md`. Sidebar: `shadow-xl`. Menú contextual: `shadow-lg`.
- Padding de contenido: `main` = `p-4 flex-1 overflow-auto`. Contenedor de formulario: `max-w-4xl mx-auto p-6 space-y-8`.

---

## 2. Layout general

```html
<div class="flex h-screen overflow-hidden bg-[#F4F6F8]">
  <!-- Sidebar off-canvas -->
  <aside class="bg-[#E5E5E5] text-[#1b3a57] w-64 h-full transition-transform duration-300 overflow-y-auto overflow-x-hidden py-6 fixed top-0 left-0 z-50 shadow-xl -translate-x-full">
    <nav class="flex flex-col gap-3 px-4">
      <a class="flex items-center gap-3 transition-colors text-sm text-[#1b3a57] hover:text-blue-700">Principal</a>
      <a class="flex items-center gap-3 transition-colors text-sm text-blue-700 font-semibold">Bandeja SACO</a>   <!-- activo -->
      <a class="flex items-center gap-3 transition-colors text-sm text-[#1b3a57] hover:text-blue-700">Configuración</a>
    </nav>
  </aside>

  <div class="flex-1 flex flex-col min-w-0">
    <header class="bg-[#0B2545] text-white p-4 flex items-center justify-between shadow-md max-h-12 sticky top-0 z-10">
      <div class="flex items-center"> <!-- botón hamburguesa + logo "TRENES ARGENTINOS OPERACIONES" (imagen, invertida a blanco) --> </div>
      <div class="flex items-center gap-3">
        <button class="relative p-1 hover:opacity-75 transition-opacity">
          <img class="w-6 h-6 brightness-0 invert" /> <!-- campana -->
          <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">1</span>
        </button>
        <div class="relative flex items-center cursor-pointer">
          <span class="px-2 text-white">Hola, {nombre apellido}</span>
          <img /> <!-- avatar circular -->
        </div>
      </div>
    </header>
    <main class="p-4 flex-1 overflow-auto"> … </main>
  </div>
</div>
```

- El sidebar está **oculto por defecto** (`-translate-x-full`) y se abre con el botón hamburguesa; el ítem activo va en `text-blue-700 font-semibold`.
- Items de menú observados (rol MESA_SACO): Principal, Bandeja SACO, Configuración. (El menú cambiará con el rol Letrado.)
- La vista relevada fue en viewport angosto (~675 px). Los grids usan `grid-cols-1 md:grid-cols-2` (formulario) y `grid-cols-2 md:grid-cols-3` (detalle).

---

## 3. Botones

| Tipo | Clases |
|---|---|
| **Primario** ("+ Nueva Actuación") | `px-4 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800` |
| **Primario de formulario** ("Revisar y enviar") | `px-5 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed` |
| **Secundario** ("Cancelar") | `px-5 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50` |
| **Toggle segmentado – activo** ("Activos") | `px-4 py-1.5 text-sm font-medium border transition-colors bg-blue-700 text-white border-blue-700 rounded-l-md` |
| **Toggle segmentado – inactivo** ("Archivados") | `px-4 py-1.5 text-sm font-medium border transition-colors bg-white text-gray-600 border-gray-300 hover:bg-gray-50 rounded-r-md -ml-px` |
| **Filtro chip-botón** ("Urgentes", "Por vencer", "Limpiar filtros") | `inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors border-gray-300 text-gray-600 hover:bg-gray-50` (+ ícono 14–16px a la izquierda) |
| **Ícono de acciones** (⋮ en fila) | `p-1 rounded hover:bg-gray-100 text-gray-500` con svg `w-5 h-5` |
| **Descarga (ícono)** | `text-gray-400 hover:text-blue-600 transition-colors` |
| **Exportar** | `flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50 transition-colors whitespace-nowrap disabled:opacity-50` |

Notas:
- "Por vencer" está **deshabilitado** con tooltip/aria: "disponible cuando se carguen los plazos".
- Barra de acciones de la bandeja: botón primario + toggle Activos/Archivados + filtros-botón, con `flex-wrap` y gap pequeño.

---

## 4. Formularios

### 4.1 Estructura de página
```html
<div class="max-w-4xl mx-auto p-6 space-y-8">
  <div>
    <h1 class="text-2xl font-semibold text-gray-800">Nuevo Ingreso de Actuación</h1>
    <p class="text-sm text-gray-500 mt-1">Completá los datos según el canal y tipo de gestión.</p>
  </div>

  <section class="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
    <h2 class="text-lg font-semibold text-gray-700 border-b pb-2">Origen y Tipo de Gestión</h2>
    <!-- campos -->
  </section>

  <!-- … más <section> … -->

  <div class="flex justify-end gap-3 pb-8">
    <button class="px-5 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
    <button class="px-5 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">Revisar y enviar</button>
  </div>
</div>
```

### 4.2 Campos (label + control)
```html
<div>
  <label class="block text-sm font-medium text-gray-700 mb-1">Canal de ingreso *</label>
  <select class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">…</select>
</div>
```
- **Input texto / date / number**: mismas clases que el select: `w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500` (alto computado ≈ 38px).
- **Select deshabilitado** (dependiente): agrega `bg-white … disabled:bg-gray-100 disabled:cursor-not-allowed` (se ve gris `#F3F4F6`).
- **Textarea**: mismas clases, `rows="3"`.
- **Obligatorio**: asterisco `*` al final del texto del label (sin color especial).
- **Placeholder**: texto gris por defecto del navegador (`EE-2026-...`). Selects arrancan con "Seleccioná..." y los dependientes con "Seleccioná canal y área primero", "— Seleccionar —", "— Sin secretarías —".
- **Grids**: campos en `grid grid-cols-1 md:grid-cols-2 gap-4`.
- **Sugerencia FIFO** (texto sobre el select de letrado): `text-xs text-blue-700 font-medium` → "Sugerido por FIFO: GONZALEZ, ARACELI".
- El select de letrado **no ocupa todo el ancho** (ancho parcial, ~75 %).

### 4.3 Secciones del formulario (en orden) y campos
1. **Origen y Tipo de Gestión** — Canal de ingreso * (EE GDE / Memo GDE / Otros), N° Expediente Electrónico (GDE) * (el label cambia según canal: "N° EE / Memo" por defecto), Área jurídica * (CIVIL / LABORAL / PENAL), Tipo de gestión * (dependiente de canal + área).
2. **Datos de Recepción** — Oficio judicial (input), Tipo de intervención * (select: Actora, Demandada…), Comentarios (textarea).
3. **Detalle — {Tipo de gestión}** (sección dinámica según el tipo; ej. *Demanda*): N° Causa, Fuero (select), Juzgado / Tribunal / Secretaría (selects en cascada, deshabilitados hasta elegir el anterior), Carátula, Abogado de la Contraria, Parte Actora, Parte Demandada, Coactores, Codemandado, Fecha Inicio (date), Tipo de Juicio (select), Monto Demanda ($) (input numérico). Los campos cambian por tipo (en el detalle de *Cobro de Cánones* aparecen Permisionario, Referencia contrato / N° PPU, Área requirente, Fecha del requerimiento, etc.).
4. **Asignación de Letrado** — texto de sugerencia FIFO + select "Abogado / Asistente jurídico" (opciones `APELLIDO, NOMBRE — Abogado|Asistente`).
5. **Documento GDE \*** — dropzone de PDF (obligatorio para derivar).

### 4.4 Dropzone de archivos
```html
<p class="text-sm text-gray-500">Adjuntá el PDF del Expediente Electrónico (GDE). Es obligatorio para poder derivar.</p>
<div class="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors py-10 px-4 border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50">
  <span class="text-3xl mb-2">📁</span>
  <p>Arrastrá el PDF aquí o <span class="font-medium text-blue-700">hacé clic para seleccionar</span></p>
  <p class="text-xs text-gray-400 mt-1">Solo PDF · Máx. 20 MB</p>
</div>
```

### 4.5 Comportamiento a replicar
- Formulario **progresivo**: tras elegir canal + área, aparece el Tipo de gestión; al elegir tipo aparecen las secciones 2–5.
- El botón "Revisar y enviar" está **deshabilitado** (`opacity-50`) hasta completar obligatorios + PDF; abre una pantalla de revisión (no relevada).
- "Cancelar" vuelve a la bandeja.

---

## 5. Filtros de tabla (fila de filtros bajo el header)

Fila `bg-gray-100` debajo del `thead`, cada celda `px-4 py-2`:
```html
<input type="text" placeholder="Buscar..." class="w-full text-sm py-1 px-2 rounded-md border border-gray-300 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
<select class="w-full text-sm py-1 px-2 rounded-md border border-gray-300 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><option>Todos</option>…</select>
<input type="date" class="(mismas clases)">   <!-- Recepción: dos date (desde / hasta) -->
```
- Filtros: N° Interno (texto), N° Causa (texto), Área (select), Carátula (texto), Tipo de Gestión (select), Estado (select), Referencia GDE (texto), Letrado (select), Línea (sin filtro), Recepción (rango date).
- Las columnas con orden tienen ícono ⇅ y `cursor-pointer select-none hover:bg-gray-100`.

---

## 6. Tabla (Bandeja)

```html
<div class="bg-white border border-black border-opacity-20 rounded-xl shadow-md overflow-hidden mt-4">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 text-left cursor-pointer select-none hover:bg-gray-100 transition-colors">N° Interno</th> …
        </tr>
        <tr class="bg-gray-100"> <th class="px-4 py-2"> …filtros… </th> … </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white"> <!-- clases del tbody inferidas; el table sí lleva divide-y divide-gray-200 -->
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left"> … </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Columnas (orden)**: N° Interno · N° Causa · Área · Carátula · Tipo de Gestión · Estado · Referencia GDE · Letrado · Línea · Recepción · (acciones).

**Contenido de celdas**
- **N° Interno**: `<span class="font-medium text-blue-700 whitespace-nowrap">C-1968/2026</span>`. Formato `C-####/AAAA` (civil/laboral) y `P-####/AAAA` (penal). Debajo, opcionalmente:
  - "Sin causa" → `<span class="text-xs text-gray-400 italic">Sin causa</span>` (cuando no hay N° de causa).
  - **URGENTE** → `<span class="flex items-center gap-1 text-[10px] font-semibold text-red-600">` + ícono llama `w-3 h-3 shrink-0` + `URGENTE`.
  - **POR VENCER** → igual pero `text-amber-700` + ícono de triángulo.
- **N° Causa / Carátula / Referencia GDE / Letrado**: texto plano; vacío = `—` en gris (`text-gray-400`). La carátula se trunca con `…`.
- **Estado y Tipo de Gestión**: **texto plano** en la bandeja (NO chip). Los estados como chip aparecen recién en el detalle (sección 7).
- **Línea** (ej. MITRE): texto plano, `—` si no aplica.
- **Recepción**: `dd/mm/aaaa`.
- **Acciones**: botón ⋮ → menú contextual (sección 9).
- **Paginación** al pie (ver sección 10).
- Paginado del servidor: "Mostrando X–Y de **3660**", selector de filas (10/25/50/100, default 25), botones Anterior · 1 · 2 · … · 147 · Siguiente.

---

## 7. Chips / badges

### 7.1 Área (CIVIL / PENAL / LABORAL) — rectangular, fondo sólido
- **En tabla**: `px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap` + `style="background-color:<color del área>"` (CIVIL `#1E3A5F`, PENAL `#78350F`).
- **En header del detalle**: igual pero `px-2.5`.

### 7.2 Estado actual de la actuación (header del detalle) — neutro
`px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700` → "Juicio iniciado".
> Todos los estados se ven con este mismo estilo neutro; no hay color por estado en lo relevado (hay 52 estados posibles, ver sección 12).

### 7.3 N° de causa (header del detalle)
`px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200` → "Causa CAF 066987/2025".

### 7.4 Urgente
`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700` + ícono llama → "Urgente".

### 7.5 Etapa actual en timeline
`text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide` → "ACTUAL".

### 7.6 Tarea cumplida
`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 bg-green-100 text-green-700` → "Cumplido".

### 7.7 Contador de progreso ("2 de 2 completadas")
`text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full whitespace-nowrap`.

### 7.8 Contadores de tabs / toggles (número chiquito)
- Tab: `px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500` (en tab activo se pinta azul claro: `bg-blue-100 text-blue-700`).
- Toggle: `text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500`.

### 7.9 Tipo de gestión en tarjetas vinculadas
`text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full` → "Demanda".

### 7.10 Relación (ANTECEDENTE)
`text-xs border border-gray-300 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide font-medium`.

### 7.11 Tipo de archivo (PDF)
`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-red-100 text-red-700`.

### 7.12 Badge de notificaciones (campana)
`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center`.

### Resumen rápido de chips
| Chip | Fondo | Texto | Borde | Forma |
|---|---|---|---|---|
| Área | color de DB | blanco | — | `rounded` |
| Estado | `gray-100` | `gray-700` | — | `rounded` |
| Causa | `blue-50` | `blue-700` | `blue-200` | `rounded` |
| Urgente | `red-100` | `red-700` | — | `rounded` |
| Actual | `blue-100` | `blue-600` | — | `rounded-full` |
| Cumplido | `green-100` | `green-700` | — | `rounded-full` |
| Progreso | `blue-50` | `blue-700` | `blue-100` | `rounded-full` |
| Antecedente | transparente | `gray-500` | `gray-300` | `rounded-full` |
| PDF | `red-100` | `red-700` | — | `rounded` |

---

## 8. Pantalla de detalle de actuación

### 8.1 Header sticky
```html
<div class="sticky top-0 z-10 bg-gray-50/95 backdrop-blur -mx-6 px-6 pt-2 pb-3 border-b border-gray-200">
  <nav class="flex items-center gap-1 text-xs text-gray-500 mb-2">Actuaciones › <b>Actuación</b></nav>
  <div>
    <div class="flex items-center gap-2 flex-wrap">
      <h1 class="text-2xl font-semibold text-gray-800">C-1965/2026</h1>
      <!-- chips: área, estado, causa, urgente (sección 7) -->
    </div>
    <p class="text-xs text-gray-500 mt-0.5">Cobro de Cánones</p>  <!-- tipo de gestión -->
  </div>
  <!-- Tabs -->
  <div class="flex gap-1 mt-3 -mb-3"> … </div>
</div>
```

### 8.2 Tabs
- Activo: `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors border-blue-600 text-blue-700`
- Inactivo: `… border-transparent text-gray-500 hover:text-gray-700`
- Tabs observados: **Datos · Línea de tiempo (6) · Intervinientes (0) · Documentos (1) · Previsión · Vinculados (2)**. Cada uno puede llevar contador (7.8). En pantalla angosta los tabs se desbordan con scroll horizontal.

### 8.3 Cards de datos (tab Datos)
```html
<section class="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
  <h2 class="text-base font-semibold text-gray-700 border-b pb-2">Datos de la Actuación</h2>
  <dl class="grid grid-cols-2 md:grid-cols-3 gap-4">
    <div>
      <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">N° EE / Memo</dt>
      <dd class="mt-0.5 text-sm text-gray-800 break-words">EE-2025-…</dd>
    </div>
  </dl>
</section>
```
- Valor vacío = `—`.
- Cards: "Datos de la Actuación" (N° EE/Memo, Fecha recepción, Canal, Tipo de gestión, Intervención, Oficio judicial) y "Detalle — {Tipo de gestión}" (campos específicos del tipo).

### 8.4 Tab Línea de tiempo

**a) Stepper de estados (card)**
```html
<div class="bg-white border border-gray-200 rounded-lg p-5">
  <div class="flex items-start overflow-x-auto pb-2">
    <div class="flex flex-col items-center shrink-0">
      <!-- completado --> <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-green-500 text-white">✓</div>
      <!-- actual -->     <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-blue-600 text-white ring-4 ring-blue-100">3</div>
      <p class="text-[11px] mt-2 text-center w-16 leading-tight text-gray-500">En análisis</p>
    </div>
    <div class="flex-1 h-0.5 mt-[18px] min-w-4 bg-blue-300"></div>  <!-- conector -->
    …
  </div>
</div>
```
- Etiqueta del paso actual en azul/seminegrita (se ve más oscura); pasos completados con check.

**b) Card "Ciclo de Vida — Actividades"**
- Título `Ciclo de Vida — Actividades` + chip de progreso (7.7).
- Toggle segmentado de filtro: contenedor `flex border border-gray-200 rounded-lg overflow-hidden`; botón activo `px-3 py-1.5 text-xs flex items-center gap-1.5 border-r border-gray-200 last:border-r-0 transition-colors bg-blue-600 text-white`; inactivo `… bg-white text-gray-600 hover:bg-gray-50`; opciones: Todo · Sistema (n) · Actividades (n) · Tareas (n). Al lado, botón **Exportar** (descarga).
- Buscador: `<div class="relative mb-4">` + ícono lupa a la izquierda + `input` `w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent` ("Buscar actividad...").

**c) Acordeón de etapas** (una por estado, la más reciente arriba)
- Contenedor: `border rounded-lg overflow-hidden` + (`border-blue-200` si es la actual / `border-gray-200 bg-white` si no).
- Cabecera: `w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors` + (`bg-blue-50 hover:bg-blue-100/60` actual / `bg-white hover:bg-gray-50`).
- Punto de estado: `flex-shrink-0 w-2 h-2 rounded-full bg-blue-600` (actual) / gris para pasadas.
- Título en `font-medium/semibold`; chip "ACTUAL" (7.5); fecha `text-xs text-gray-400 ml-auto mr-2 whitespace-nowrap`; chevron.
- Cuerpo expandido: línea "Ingresó desde **estado** · por **USUARIO**" con ícono de flechas, **barra de progreso** y lista de tareas:
  - Barra: pista `flex-1 bg-gray-100 rounded-full h-1.5`, relleno `bg-blue-500 h-1.5 rounded-full transition-all duration-300`; a la izquierda `2/2`, a la derecha `100%`.
  - Tarea: círculo verde con check + `01. Registrar tipo de acción judicial y observaciones` + chip "Cumplido" + chevron.
  - Banner de éxito: `mt-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2` → "✓ Ya podés pasar de Estado".

### 8.5 Tab Documentos
- Card `bg-white border border-gray-200 rounded-lg p-5` con título "Documentos (1)" (el contador en `text-gray-400 text-sm font-normal`).
- Tabla simple: `table.w-full.text-sm`; `th` = `pb-2 pr-3` (texto uppercase gris semibold); `td` = `py-2.5 pr-3`; columnas: ARCHIVO · TIPO · TAMAÑO · SUBIDO · (descarga).
- Archivo: ícono PDF rojo `w-5 h-5 text-red-500` + nombre + candado (confidencial) en gris; chip PDF (7.11); tamaño `47.6 KB`; fecha `dd/mm/aaaa hh:mm` en gris claro; botón descarga (sección 3).

### 8.6 Tab Vinculados
- Card con título "Actuaciones vinculadas (2)" (`text-sm font-semibold text-gray-700` + contador `ml-2 text-xs font-normal text-gray-400`).
- Cada vinculada: `border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors`, con:
  - fila 1: N° interno (`font-medium text-blue-700`, link) + chip área + chip tipo gestión (7.9) + chip relación (7.10);
  - fila 2: carátula `text-sm font-medium text-gray-800 truncate`;
  - fila 3: `text-xs text-gray-400`; el N° de causa en `font-mono`, separado por `·` del letrado.
  - Espaciado vertical entre tarjetas: `space-y-3` aprox.

---

## 9. Menú contextual (acciones de fila)
```html
<div class="fixed z-50 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1">
  <!-- clases del ítem inferidas (solo se verificaron el contenedor y el ícono) -->
  <button class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
    <svg class="w-4 h-4 text-blue-600 flex-shrink-0" /> <!-- ojo -->
    Visualizar
  </button>
</div>
```
- Se posiciona con `position: fixed` cerca del botón ⋮ y se cierra al hacer clic afuera.
- Con rol MESA_SACO la única acción visible es **Visualizar** (otros roles pueden tener más; relevar con Letrado).

---

## 10. Paginación
- Texto izquierdo: "Mostrando 1–25 de 3660" (con el total en negrita).
- Selector de filas por página (`10 / 25 / 50 / 100`), mismas clases que los selects de filtro.
- Botones: Anterior · 1 · 2 · … · 147 · Siguiente (botones `type="button"`). **Estilos exactos no relevados**: usar como base el botón secundario (sección 3) y resaltar la página activa con `bg-blue-700 text-white`.

---

## 11. Estados de interacción (resumen)
| Elemento | Hover | Focus | Disabled |
|---|---|---|---|
| Botón primario | `hover:bg-blue-800` | — | `opacity-50 cursor-not-allowed` |
| Botón secundario / filtro | `hover:bg-gray-50` | — | — |
| Fila de tabla | `hover:bg-gray-50` | — | — |
| Input/select de formulario | — | `focus:ring-2 focus:ring-blue-500` | `disabled:bg-gray-100 cursor-not-allowed` |
| Input/select de filtro | — | `focus-visible:ring-2 focus-visible:ring-blue-300` | — |
| Item de menú lateral | `hover:text-blue-700` | — | — |
| Dropzone | `hover:border-blue-400 hover:bg-blue-50` | — | — |
| Tab inactivo | `hover:text-gray-700` | — | — |

Transiciones: `transition-colors` en casi todo; sidebar `transition-transform duration-300`; barra de progreso `transition-all duration-300`.

---

## 12. Catálogos observados (para datos de prueba del prototipo)

- **Áreas**: CIVIL, LABORAL, PENAL.
- **Canal de ingreso**: EE GDE, Memo GDE, Otros.
- **Tipos de gestión** (21): BLG, Carta Documento, Carta SAE Suceso, Cobro de Cánones, Consignaciones, Defensa Civil, Defensa Penal, Demanda, Desafueros, Ejecución de Pólizas, Lanzamiento judicializado, Lanzamientos, Mediación, Oficio, Oficio Penal, Otros, Pedido de Causa Penal, Querella, Reclamo Contratistas, Recuperos, SECLO.
- **Estados** (52): Asignado, En análisis, Pedido de información, Pedido de información / filmaciones / notificación, Información recibida, Información recibida / filmaciones / notificación recibida, Solicitud de información, Escrito presentado, Acuerdo extrajudicial, Juicio iniciado, Asume representación, Inicio, Traba de litis, Prueba, Alegato, Sentencia 1° instancia favorable / desfavorable, Apelación, Sentencia 2° instancia favorable / desfavorable, Sentencia de lanzamiento, Sentencia 2° favorable / desfavorable, Recurso Extraordinario Federal, Recurso de Queja, Ejecución de sentencia, Aceptado, Instrucción, Juicio, Ejecución penal, Archivo, Procede, Formula denuncia, Elevación a juicio, Condena, Respondido, Finalizado, Terminado, Archivado, Devuelto al sector requirente, No asume representación, Cumplido (acuerdo), Cumplido (no acuerdo), Rechazado, Conciliación, Reparación integral, Suspensión de juicio a prueba, Sobreseimiento, Prescripción de acción penal, Absolución, Se descarta por no corresponder, Archivo de causa.
- **Líneas** (ferroviarias): ej. MITRE.
- **Letrados** (formato `APELLIDO, NOMBRE`): ej. BENITEZ, ADRIANA · DESIDERI, GUSTAVO · CASANO, FELIX · PRINOTTI, MAXIMILIANO · DANTIOCHIA, LUIS · Moreno, Ernesto.
- **Formato N° interno**: `C-1968/2026`, `P-0940/2026`. **Referencia GDE**: `EE-2025-104550222- -APN-SG#SOFSE`, `ME-2026-000000015- -APN-SACO#SOFSE`. **N° de causa**: `CAF 066987/2025`, `FSM 1234/2026`, `CIV 2233/2026`.
- Fechas `dd/mm/aaaa`.

---

## 13. Pendiente / no relevado (completar con el rol Letrado)
- Chip de área **LABORAL** (color) — no había filas laborales en la vista.
- Colores por estado (si existen en otras pantallas): en las vistas relevadas los estados son texto plano o chip gris neutro.
- Tabs **Intervinientes** y **Previsión** del detalle.
- Pantalla de **revisión previa al envío** ("Revisar y enviar") y mensajes de éxito/error (toasts).
- Menú de acciones de fila con más opciones, acciones de cambio de estado/tareas del Letrado, y el menú lateral del Letrado.
- Panel de **Avisos** (campana) y menú del perfil.
- Pantalla **Principal** y **Configuración**.
- Estados vacíos y de carga (solo se vio "Cargando línea de tiempo..." en `text-gray-400` centrado).
- Comportamiento responsive en desktop (lo relevado fue viewport ≈ 675 px de ancho).
