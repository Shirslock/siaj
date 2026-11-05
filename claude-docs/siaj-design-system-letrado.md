# SIAJ — Guía de estilos y componentes (rol LETRADO)

> Complemento de `siaj-design-system.md` (rol MESA_SACO). **Todo lo que ya está ahí (tokens, tipografía, botones base, chips de área, layout, tabla, tabs del detalle, stepper, acordeón) aplica igual.** Este documento solo agrega lo propio del letrado: bandeja agrupada por causa, acciones de la actuación, **modales/formularios**, **actividades procesales (hitos)**, **actividades genéricas** y el dashboard Principal.
> Relevado en `siajtest.trenesargentinos.gob.ar` con un usuario letrado, viewport de escritorio (~1568 px). Tailwind v4; las clases son las del DOM.
> No se guardó ningún dato: todos los formularios se abrieron y se cancelaron.

---

## 0. Diferencias generales respecto a MESA_SACO

| Tema | MESA_SACO | LETRADO |
|---|---|---|
| Menú lateral | Principal, Bandeja SACO, Configuración | **Principal, Actuaciones** (título del sidebar: "SIAJ" con logo) |
| Bandeja | "Bandeja SACO", filas planas | "Actuaciones", **agrupadas por N° de causa** |
| Acciones de fila | solo "Visualizar" | "Visualizar", "Desagrupar", "Agrupar a causa" (según la fila) |
| Header del detalle | solo chips + tabs | + botón **Marcar urgente** + botón circular **+** (menú de acciones) |
| Tarjeta "Datos" | solo lectura | link **Editar** (edición inline) |
| Línea de tiempo | solo lectura | **Nueva Actividad**, filtros Procesales/Genéricas, **Editar hito**, **Comentar** |
| Intervinientes / Documentos | solo lectura | **Agregar interviniente** / **Subir documento** |
| Previsión | tab visible | tab visible, contenido "Previsión — Próximamente" |

Las acciones visibles dependen de si la actuación está **asignada al usuario**: en una actuación ajena el letrado solo ve el botón **+** con "Nueva Actuación" (sin "Cambiar estado", sin "Marcar urgente", sin Editar).

---

## 1. Dashboard "Principal"

```html
<main class="p-4 flex-1 overflow-auto">
  <div class="p-6 flex flex-col gap-4">
    <h1 class="text-xl font-semibold text-gray-800">Principal</h1>
    <p class="text-sm text-gray-500">Hola, {Nombre}. Gestionando 161 actuaciones activas.</p>

    <!-- KPIs -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <button class="flex flex-col items-center justify-center gap-2 rounded-lg border p-4 aspect-square transition-shadow hover:shadow-md text-center bg-white border-gray-200 text-gray-800">
        <span class="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100"> <!-- ícono --> </span>
        <span class="text-2xl font-semibold leading-none">65</span>
        <span class="text-xs leading-tight text-gray-500">Causas judiciales activas</span>
      </button>
      <!-- variante ACTIVA (card seleccionada, ej. "Actuaciones parte actora") -->
      <button class="… bg-[#0B2545] border-[#0B2545] text-white">
        <span class="… w-9 h-9 rounded-full bg-white/15"></span>
        <span class="text-2xl font-semibold leading-none">0</span>
        <span class="text-xs leading-tight text-white/90">Actuaciones parte actora</span>
      </button>
    </div>
    …
  </div>
</main>
```

**KPIs (5)**: Causas judiciales activas (ícono azul `bg-blue-100`), Documentos activos (verde), Nuevas asignadas (azul), Actuaciones parte actora (**navy `#0B2545` cuando está activa**), Urgentes (rojo `bg-red-100`). Cada KPI es un botón que filtra la bandeja.

**Paneles**: `bg-white border border-gray-200 rounded-lg p-4`, título `text-sm font-semibold text-gray-800`, subtítulo `text-xs text-gray-400 mb-3`.
- **Vencimientos y tareas** (ancho 2/3): toggle segmentado `inline-flex rounded-md border border-gray-300 overflow-hidden shrink-0` con botones `px-3 py-1 text-xs font-medium transition-colors` (activo `bg-blue-700 text-white`; inactivo `border-l border-gray-300 bg-white text-gray-600 hover:bg-gray-50`) → Todas / Vencidas / Por vencer. Grupos: **Vencidas (n)** en rojo con ícono triángulo, **Próximas (n)** en ámbar con ícono reloj (`text-red-600` / `text-amber-700`, `text-xs font-semibold`); vacío: "Sin actuaciones en este grupo." en gris. Link al pie `text-xs text-blue-700 hover:underline mt-3` → "Ver todas las actuaciones con alerta →".
- **Próximas audiencias** (columna derecha): "0 audiencias agendadas." / "Sin audiencias agendadas."
- **Por rol** y **Por estado procesal**: lista de barras horizontales: etiqueta (truncada con `…`) · pista gris `bg-gray-100 rounded-full` con relleno `bg-blue-600/700` proporcional · contador a la derecha. Valores vacíos = barra sin relleno, contador `0`.
- **Actuaciones cerradas**: tarjeta con número grande `2` + etiqueta.

---

## 2. Bandeja "Actuaciones" (agrupada)

Misma estructura que la bandeja SACO (card `rounded-xl shadow-md`, thead `bg-gray-50`, fila de filtros `bg-gray-100`) con estas diferencias:

**Barra superior**
- Botones: **+ Nueva Actuación** (primario `px-4 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800`) · toggle **Activos / Archivados** · **Colapsar todo** · **Urgentes** · **Por vencer** · **Limpiar filtros** (los 4 últimos: `inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50`).
- Filtros activos se muestran como chips removibles debajo del título: contenedor `flex flex-wrap gap-2`, cada chip tipo `Estado: En análisis ×` (texto pequeño, fondo azul claro, botón × con `hover:text-blue-900`).
- Subtítulo: "Gestionando 161 actuaciones activas" / "Gestionando 5 actuaciones activas".

**Columnas**: N° Causa / Interno · Carátula · Área · Tipo de gestión · Letrado · Estado · Recepción · (acciones). *(sin "Referencia GDE" ni "Línea" a diferencia de SACO)*. Filtros: texto (N° causa/interno, carátula), select (Área, Tipo, Letrado, Estado), rango de fechas (Recepción). Mismas clases de filtro que en SACO.

**Fila de grupo (causa)**
```html
<tr class="hover:bg-gray-50 transition-colors bg-gray-50">
  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left">
    <div class="flex items-start gap-1.5">
      <button class="mt-0.5 w-6 h-6 flex items-center justify-center rounded-full bg-blue-900 text-white hover:bg-blue-800 shrink-0"><!-- chevron colapsar --></button>
      <!-- ícono carpeta azul oscuro -->
      <div>
        <span class="font-medium text-gray-800">FSM 37422/2026</span>
        <div class="text-xs text-gray-400">1 actuación agrupada</div>
      </div>
    </div>
  </td>
  … Carátula · Área (chip) ·
  <td> <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">🔗 Causa judicial</span> </td>
  … Letrado · Estado · Recepción ·
  <td> <button class="text-sm text-blue-700 …">Ver todo</button> </td>
</tr>
```
**Fila hija (actuación dentro de la causa)** — `tr.hover:bg-gray-50 transition-colors` (fondo blanco), con indent y:
```html
<span class="flex items-center gap-1.5 whitespace-nowrap">
  <!-- ícono documento gris -->
  <span class="font-medium text-blue-700">P-0913/2026</span>
  <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white">Principal</span>
</span>
```
- El chip **Principal** marca la actuación principal de la causa.
- Filas **sin causa** (planas, sin grupo): ícono de documento + N° interno azul y debajo `text-xs text-gray-400 italic` "Sin causa".
- Tipo de gestión, Letrado y Estado: texto plano (no chips). Paginación idéntica a SACO ("Mostrando 1 – 5 de 5", selector 25, botones `<` `1` `>` con la página activa en `bg-blue-600 text-white`).

**Menú de acciones de fila (⋮)**: mismo contenedor que en SACO (`fixed z-50 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1`), ítems con ícono 16px:
- **Visualizar** (ojo azul) — siempre
- **Desagrupar** (tijera/ícono naranja) — en filas hijas de un grupo
- **Agrupar a causa** (link verde) — en actuaciones sin causa

---

## 3. Detalle de la actuación (acciones del letrado)

Header sticky igual que SACO (sección 8.1 del otro doc) **más**, alineado a la derecha:
```html
<div class="flex items-center gap-2">
  <button class="px-3 py-1.5 text-sm rounded-md border inline-flex items-center gap-1 border-gray-300 text-gray-600 hover:bg-gray-50">🔥 Marcar urgente</button>
  <div class="relative">
    <button class="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800">+</button>
    <div class="absolute right-0 z-40 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg py-1">
      <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><svg class="w-4 h-4"/>Cambiar estado</button>
      <button …>Desagrupar | Agrupar a causa</button>
      <button …>+ Nueva Actuación</button>
    </div>
  </div>
</div>
```
- El botón "Marcar urgente" es de **un clic** (alterna urgente); no se probó para no modificar datos. Al estar urgente se ve el chip rojo "Urgente" (sección 7.4 del otro doc).
- Menú **+** (en actuación propia): **Cambiar estado** · **Agrupar a causa** (si no tiene causa) / **Desagrupar** (si está agrupada) · **Nueva Actuación** (abre el mismo formulario de alta que en SACO, ver `siaj-design-system.md` sección 4).
- Sin chip "Urgente" y sin causa: el header muestra solo chips de área + estado (+ "Causa …" si tiene).
- Subtítulo bajo el N°: carátula (si hay) y tipo de gestión en `text-xs text-gray-500 mt-0.5`.

### Tarjeta "Datos de la Actuación" — modo edición inline
- En el header de la card (`flex items-center justify-between border-b pb-2`): link **Editar** `inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800` (ícono lápiz).
- Al editar, ese link se reemplaza por:
  - **Cancelar**: `px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50`
  - **Guardar**: `px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60`
- Campos editables: N° EE/Memo (input), Intervención (select "— Sin especificar —"), Oficio judicial (input), Comentarios (textarea, ancho completo). **Solo lectura**: Fecha recepción, Canal, Tipo de gestión.
- Inputs: `w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500` (textarea con `px-3 py-2`). Labels = `<dt>` ya descripto (`text-xs font-medium text-gray-500 uppercase tracking-wide mb-1`).
- La card "Detalle — {tipo}" también tiene campos propios por tipo (ej. *Carta SAE Suceso*: Documental, N° Suceso, Jurisdicción, Tipo de hecho, Fecha del hecho, Lugar del hecho, Línea ferroviaria, Fuero, Juzgado, Tribunal, Secretaría, Fiscalía…; *Oficio Penal*: N° Causa, N° IPP, N° Sumario, Carátula, Fuero, Juzgado, Tribunal, Secretaría, Fiscalía…; *BLG*: N° de causa, Carátula, Fuero, Juzgado, Tribunal, Secretaría, Actuación principal vinculada, Fecha recepción, Plazo para contestar).

---

## 4. Patrón de MODAL (común a todos los formularios del letrado)

```html
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
  <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
    <!-- header -->
    <div class="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
      <div>
        <h2 class="text-base font-semibold text-gray-800">Título</h2>
        <p class="text-sm text-gray-400 mt-0.5">Subtítulo / contexto</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
    </div>
    <!-- body -->
    <div class="overflow-y-auto px-6 py-4 space-y-4"> … campos … </div>
    <!-- footer -->
    <div class="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
      <button class="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
      <button class="px-4 py-2 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed">Confirmar</button>
    </div>
  </div>
</div>
```
- Anchos: `max-w-sm` (Cambiar estado) · `max-w-md` (Agrupar a causa, Agregar comentario) · `max-w-lg` (Agregar interviniente, Nueva Actividad, Editar hito).
- Botón de confirmación **deshabilitado** hasta que los obligatorios estén completos (`disabled:opacity-40`).
- Clases de controles dentro de modales (hay pequeñas variantes de padding):
  - Label: `block text-xs font-medium text-gray-600 mb-0.5` (en el modal de comentario además `uppercase tracking-wide`; en Interviniente `text-gray-700 mb-1`). Asterisco obligatorio: `<span class="text-red-500">*</span>`; "(opcional)" en `text-gray-400 font-normal`.
  - Input/select/date: `w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500` (en Interviniente: `py-2 … focus:ring-1`; en Editar hito inputs `py-2`).
  - Textarea: igual + `resize-none` (`rows=2` o `3`).
  - Grillas internas: `grid grid-cols-2 gap-3`.
  - Adjuntar archivo: `flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50 transition-colors` con ícono 📎/clip y `<input type="file" class="hidden">`.

---

## 5. Formularios (modales) — detalle campo por campo

### 5.1 Cambiar estado (`max-w-sm`)
- Header: "Cambiar estado" · "Actuación: **P-0913/2026**" (`text-sm text-gray-500 mt-0.5`) · "Estado actual: **Asignado**" (`text-xs text-gray-400 mt-1`). Header con `px-6 pt-6 pb-4 border-b border-gray-100`.
- Select de estado destino (`w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500`) con placeholder "— Seleccioná un estado —". Las opciones **dependen del tipo de gestión y del estado actual** (ej. Oficio Penal desde *Asignado*: En análisis · Pedido de información / filmaciones / notificación · Información recibida / filmaciones / notificación recibida · Respondido · Finalizado).
- **Motivo (opcional)**: textarea `rows=2`, `w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800 resize-none`, placeholder "Anotá el motivo de cambio...".
- Nota al pie (centrada): `text-center text-xs text-gray-400 italic mt-1` → "Esta acción quedará registrada en la línea de tiempo."
- Botones: **Cancelar** / **Confirmar** (deshabilitado hasta elegir estado).

### 5.2 Agrupar a causa (`max-w-md`, `p-6`)
- Título "Agrupar a causa" · "Actuación: **P-0011/2026**".
- Label "N° de causa judicial" + input con ícono lupa: `<div class="relative">` + svg `absolute left-2.5 top-2.5 w-4 h-4 text-gray-400` + `input` `w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300`, placeholder "Ej: 12345/2024". Busca causas existentes (autocompletado/lista bajo el input, no relevado).
- Footer `flex justify-end gap-2 mt-6`: **Cancelar** / **Agrupar** (deshabilitado hasta elegir causa).

### 5.3 Agregar interviniente (`max-w-lg`, `max-h-[90vh] overflow-y-auto`)
- Header: `flex items-center justify-between px-5 py-4 border-b border-gray-100`, título `font-semibold text-gray-800`, botón ✕.
- Body: `px-5 py-4 space-y-3`. Campos:
  1. **Nombre completo \*** (ancho completo) — ph "Apellido, Nombre".
  2. Fila 2 col: **Rol procesal** (select: Seleccionar… / ACTOR / DEMANDADO / PERITO / TERCERO) · **Representado por** (ph "Letrado patrocinante").
  3. Fila 2 col: **Tipo documento** (select: — / CUIL / CUIT / DNI / PASAPORTE) · **N° documento** (ph "23456789").
  4. Fila 2 col: **Email** (ph "correo@dominio.com") · **Teléfono** (ph "011 1234-5678").
  5. **Domicilio** (ph "Calle, número, ciudad").
  6. **Observaciones** (textarea `rows=2`, ph "Notas adicionales").
- Footer: **Cancelar** / **Agregar** (`bg-blue-700`).
- Estado vacío de la pestaña: card con título "Intervinientes", botón arriba a la derecha **👤+ Agregar interviniente** (`bg-blue-700 text-white text-xs rounded-md px-2.5 py-1.5`), texto "Sin intervinientes registrados." centrado en gris y botón outline **+ Agregar el primero** (`border border-gray-300 text-xs rounded-md`, texto azul).

### 5.4 Subir documento (tab Documentos)
- Botón en el header de la card: `flex items-center gap-1 text-xs bg-blue-700 text-white rounded-md px-2.5 py-1.5 hover:bg-blue-800 transition-colors disabled:opacity-50` con ícono de subida; abre el selector de archivos del sistema (`input[type=file]` oculto; no hay modal intermedio).
- Tabla: igual a SACO + **handle de arrastre** a la izquierda de cada fila (`py-2.5 pr-2 select-none cursor-grab`, ícono ☰ gris) para **reordenar** documentos.

### 5.5 Nueva Actividad (`max-w-lg`) — dos pestañas
Abre desde el botón **+ Nueva Actividad** (`bg-blue-700 text-white rounded-md`, `text-xs`, ícono +) en la card "Ciclo de Vida — Actividades". Header: "Nueva Actividad" · "Actuación: **P-0011/2026**" · ✕.

Pestañas del modal (`flex -mb-px`):
- Activa: `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors border-blue-600 text-blue-700`
- Inactiva: `… border-transparent text-gray-500 hover:text-gray-700`

**a) Actividades Procesales** — lista de actividades procesales **disponibles para la etapa actual** (los hitos del flujo). Si no hay: `text-sm text-gray-400 text-center py-6` → "Sin actividades disponibles para esta etapa." (Con la actuación en *En análisis* siempre estaba vacío; la lista con ítems no se pudo relevar sin cambiar el estado. Al elegir una se abre el formulario de hito, ver 5.7.)

**b) Actividades Genéricas** — formulario libre (cuerpo `overflow-y-auto flex-1 px-6 py-4` con scroll):
| Campo | Control | Obligatorio | Detalle |
|---|---|---|---|
| Tipo de actividad | select | Sí | — Seleccioná — · Movimiento · Recepcion · Contestacion · Presentacion · Audiencia · Pericia · Traslado · Notificacion · Nota-Respuesta · Otro |
| Título | input texto | Sí | ph "Ej: Presentación escrito de contestación" |
| Fecha | input date | Sí | precargada con la fecha de hoy |
| Descripción | textarea `rows=3` | Sí | ph "Descripción de la actividad..." |
| N° GDE | input texto | No | ph "Opcional" |
| Fecha vencimiento | input date | No | ancho parcial (~45 %) |
| Adjunto | dropzone | No | "📎 Adjuntar archivo (PDF, DOC, imagen — máx. 10 MB)" |
- El formulario **no cambia** según el tipo elegido (probado con Audiencia).
- Footer: **Cancelar** / **Agregar** (`px-4 py-2 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40`).

### 5.6 Agregar comentario (`max-w-md`)
Se abre con el link **💬 Comentar** que está debajo de cada actividad genérica (`ml-7 pb-2` > `button.flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors`).
- Header `px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between` — "Agregar comentario" · ✕.
- Campos (labels **uppercase**): **COMENTARIO \*** (textarea `rows=3`, ph "Escribí tu comentario...") · **FECHA** (date, hoy) · **DOCUMENTO GDE (opcional)** (input, ph "EX-2026-...") · **FECHA DE VENCIMIENTO (opcional)** (date) · **ADJUNTO PDF (opcional)** (botón `flex items-center gap-2 px-3 py-2 w-full border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors`, "📎 Adjuntar PDF").
- Footer: **Cancelar** / **Guardar**.

### 5.7 Editar hito (actividad procesal) — `max-w-lg`
Se abre con el link **Editar** de cada actividad procesal en la línea de tiempo (`text-xs text-blue-600 hover:underline flex-shrink-0 mt-0.5 px-1`).
- Header: **"Editar hito"** · subtítulo con el nombre del hito (`3.1 — ¿Hay delito?`) · ✕.
- Body `overflow-y-auto px-6 py-4 space-y-4`:
  1. **Resultado** — toggle de 2 botones en `flex gap-2 mt-1`:
     - seleccionado: `flex-1 py-2 rounded text-xs font-medium border transition-colors bg-blue-600 text-white border-blue-600`
     - no seleccionado: `flex-1 py-2 rounded text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-300 hover:border-blue-300`
     - opciones: **Sí** / **No**.
  2. **Resolución — Subir archivo** — dropzone `flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50` → "📎 Arrastrá el archivo o hacé click · PDF máx 25MB".
  3. **Fecha** (date, ancho completo).
  4. **Organismo Judicial** (input texto, ancho completo).
  5. Grilla 2 col: **Estado** (select: En curso / Cumplido / No proc.) · **Fecha** (date, precargada con la fecha del estado).
  6. **Fecha vencimiento** (date, ancho ~50 %).
  - Inputs de este modal: `w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`; el select de Estado usa `px-3 py-1.5 text-gray-800`.
- Footer: **Cancelar** / **Guardar cambios** (`bg-blue-700`).
- Los campos del formulario son los mismos para todos los hitos relevados (3.1, 3.3, 4.1); el **título cambia** y el toggle Sí/No aplica a hitos de tipo pregunta ("¿Hay delito?", "¿Hay actuación de oficio?"). Para hitos que no son pregunta (ej. "4.1 — Formula Denuncia") el toggle puede no corresponder (no verificado).

---

## 6. Línea de tiempo del letrado (hitos y actividades)

### 6.1 Barra de la card "Ciclo de Vida — Actividades"
Título + (derecha) toggle de filtro + **Exportar** + **Nueva Actividad**:
- Toggle: contenedor `flex border border-gray-200 rounded-lg overflow-hidden`; botones `px-3 py-1.5 text-xs flex items-center gap-1.5 border-r border-gray-200 last:border-r-0 transition-colors` (activo `bg-blue-600 text-white`, inactivo `bg-white text-gray-600 hover:bg-gray-50`) con contador `text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500`.
- Opciones en el letrado: **Todo · Sistema (n) · Procesales (n) · Genéricas (n)** (en MESA_SACO eran Todo · Sistema · Actividades · Tareas).
- Los filtros **resaltan/filtran los eventos**, pero las etapas (acordeones) siguen visibles.
- Exportar: `flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50 transition-colors whitespace-nowrap disabled:opacity-50`.
- Buscador "Buscar actividad..." como en MESA_SACO.

### 6.2 Stepper
- **Actuación pendiente de inicio** (estado Asignado): todos los pasos grises `w-9 h-9 rounded-full … bg-gray-100 text-gray-400 border border-gray-200`, etiquetas `text-[11px] mt-2 text-center w-16 leading-tight text-gray-300`, y encima:
  - `<div class="py-4 text-center">` con `<p class="text-sm font-semibold text-gray-700">Actuación pendiente de inicio.</p>` + `<p class="text-xs text-gray-400 mt-1">Usá Acciones → Cambiar estado para comenzar.</p>`.
- Paso actual `bg-blue-600 text-white ring-4 ring-blue-100`, completado `bg-green-500 text-white` con check, conector `flex-1 h-0.5 mt-[18px] min-w-4 bg-blue-300` (gris para los pendientes).
- El **flujo de estados depende del tipo de gestión** (ej. Oficio Penal: En análisis → Pedido de información… → Información recibida… → Respondido → Finalizado; Carta SAE Suceso: En análisis → Procede → Formula denuncia → Archivo → Se descarta por no corresponder → Archivo de causa; BLG: En análisis → Escrito presentado).

### 6.3 Acordeón de etapa (idéntico a SACO) + contenido
Dentro del cuerpo de cada etapa (`<ul>` de `<li>`):
- Línea de transición: ícono flechas azul + "Ingresó desde **X** · por **USUARIO**" / "Salió hacia **Y** · por **USUARIO**" (`text-xs text-gray-500`, estados en negrita).
- Si no hay eventos: `text-center` "Sin eventos en este estado." en `text-xs text-gray-400`.
- Cada evento es una fila: `flex items-start gap-2.5 py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded transition-colors`.

**Evento de sistema** ("Actuación recibida y asignada"):
- Contenedor `border border-gray-200 rounded-lg p-4`; ícono `flex-shrink-0 w-5 h-5 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mt-0.5` (flechas gris); título `text-sm text-gray-800 font-medium leading-snug`; detalle `text-xs text-gray-500` ("Carta SAE Suceso asignada a: **PRINOTTI, MAXIMILIANO**"); fecha a la derecha `text-xs text-gray-400`.

**Evento procesal (hito)** — ej. "3.1 — ¿Hay delito?":
```html
<div class="flex items-start gap-2.5 py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
  <!-- ícono circular violeta con check -->
  <div class="min-w-0 flex-1">
    <p class="text-sm text-gray-800 font-medium leading-snug">3.1 — ¿Hay delito?</p>
    <div class="flex items-center gap-2 flex-wrap">
      <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">Procede</span>      <!-- etapa -->
      <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">En curso</span>   <!-- estado hito -->
      <span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Sí</span>     <!-- resultado -->
      <span class="text-xs text-gray-400">MAXIMILIANO</span>                                                  <!-- responsable -->
    </div>
  </div>
  <span class="text-xs text-gray-400 whitespace-nowrap">11/09/2026, 02:48 p. m.</span>
  <button class="text-xs text-blue-600 hover:underline flex-shrink-0 mt-0.5 px-1">Editar</button>
</div>
```
- **Estado del hito** (chips `px-1.5 py-0.5 rounded text-[10px] font-semibold`): **En curso** `bg-amber-100 text-amber-700` · **Cumplido** verde (`bg-green-100 text-green-700`, inferido por el color) · **No proc.** (no visto, sugerido gris).
- **Resultado Sí** `bg-green-100 text-green-700`; **No** no se vio (sugerido `bg-red-100 text-red-700`).
- Numeración del hito: `N.M — Texto` (ej. 2.1 Procede / No Procede, 3.1 ¿Hay delito?, 3.2 ¿Hay denuncia previa?, 3.3 ¿Hay actuación de oficio?, 4.1 Formula Denuncia): el primer número = etapa.
- Orden: más reciente arriba dentro de la etapa.

**Evento genérico** — ej. "Movimiento":
```html
<li>
  <div class="flex items-start gap-2.5 py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
    <!-- ícono circular violeta/lila con globo de comentario -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700">Movimiento</span> <!-- tipo de actividad -->
      </div>
      <p class="text-sm font-semibold text-gray-800">Título de la actividad</p>
      <p class="text-xs text-gray-500">Descripción…</p>
    </div>
    <span class="text-xs text-gray-400 whitespace-nowrap">11/09/2026</span>
  </div>
  <div class="ml-7 pb-2">
    <button class="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors">💬 Comentar</button>
  </div>
</li>
```
- El chip de tipo muestra el tipo elegido (Movimiento, Audiencia, Pericia, Traslado, Notificación, etc.); todos con el mismo estilo azul claro.
- Debajo pueden aparecer los comentarios agregados (no relevado, no había ninguno), y el vencimiento si se cargó.

---

## 7. Resumen de chips nuevos (letrado)

| Chip | Clases |
|---|---|
| Principal (actuación principal de causa) | `px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white` |
| Causa judicial (fila de grupo) | `inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap` + ícono link |
| Etapa del hito | `px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600` |
| Hito En curso | `px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700` |
| Hito Cumplido | `… bg-green-100 text-green-700` (inferido) |
| Resultado Sí | `inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700` |
| Tipo de actividad genérica | `inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700` |
| Filtro activo en bandeja | `Estado: X ×` (contenedor `flex flex-wrap gap-2`; botón × `hover:text-blue-900`) |

---

## 8. Flujo del letrado (para el prototipo)

1. **Principal** → KPIs → clic en un KPI filtra la bandeja.
2. **Actuaciones** (agrupadas por causa) → ⋮ → *Visualizar* / *Desagrupar* / *Agrupar a causa*.
3. **Detalle** (tabs Datos · Línea de tiempo · Intervinientes · Documentos · Previsión · Vinculados).
4. Acciones del header: **Marcar urgente**, **+ → Cambiar estado**, **Agrupar/Desagrupar**, **Nueva Actuación**.
5. En *Línea de tiempo*: **Nueva Actividad** → *Procesales* (hitos disponibles para la etapa) o *Genéricas* (formulario libre); luego **Editar** (hito) y **Comentar** (genérica).
6. En *Datos*: **Editar** inline → Guardar/Cancelar.
7. En *Intervinientes*: **Agregar interviniente**. En *Documentos*: **Subir documento** + reordenar por arrastre.

---

## 9. Pendiente / no relevado
- **Lista de Actividades Procesales disponibles** dentro de "Nueva Actividad → Procesales" (en las actuaciones consultadas la etapa *En análisis* no tenía ninguna; hace falta una actuación en etapa con hitos, ej. *Procede*).
- Formulario al **iniciar** un hito (probablemente igual al de "Editar hito") y color del chip **Cumplido/No proc.** exacto.
- Resultado **No** de un hito y hitos que no son pregunta.
- Comentarios ya cargados en una actividad genérica (cómo se listan).
- Tareas con checklist del tipo "Registrar tipo de acción judicial…" (vistas en SACO sobre actuaciones civiles en *Juicio iniciado*): no pude verlas con este usuario; ver `siaj-design-system.md` sección 8.4.
- Confirmación de **Marcar urgente**, pantalla de revisión de **Nueva Actuación**, panel de **Avisos** y menú de perfil.
- Tab **Vinculados** con botón de vincular (en SACO era solo lectura; en letrado no se probó).
- Responsive móvil del letrado.
