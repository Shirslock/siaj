# SIAJ — Bitácora de migración visual (Tandas 1-5)

> Rama: `chore/migracion-paleta-tanda1`. Este doc registra qué se hizo, qué
> quedó a mitad de camino, y qué decisiones de diseño están pendientes de
> confirmación — para retomar sin tener que releer todo el historial de chat.

---

## Estado general

- **Fuente de verdad de tokens**: `src/index.css` (`@theme` — ya integrado,
  Tailwind v4 genera `bg-navy`, `text-teal`, `border-line`, `rounded-badge`,
  etc. automáticamente). **`docs/siaj-theme.css` es el espejo/entregable**
  para diseño — no lo importa la app, ante cualquier diferencia gana
  `index.css`.
- **Espejo JS para recharts**: `src/styles/chartTokens.ts` (`CHART_COLORS`)
  — recharts recibe colores como props (`fill`/`stroke`), no como clases, no
  puede leer variables CSS. Valores duplicados a propósito; si se cambia un
  color en `index.css` hay que cambiarlo también ahí (sin chequeo
  automático).
- **Regla dura repetida en cada tanda**: no tocar `font-size`, clases
  `text-xs/sm/base/lg/xl/2xl/3xl` (ni `text-[Npx]` arbitrario), ni `py-*`
  existentes de forma que cambien el ritmo vertical de filas/tablas ya
  medido en Tanda 1. Donde una spec pedía una altura exacta que un `py-`
  existente no daba, se resolvió con `h-[Npx]` explícito + centrado flex,
  no editando el `py-` (a veces se removió el `py-` porque dejarlo inerte al
  lado de un `h-` explícito era redundante — ver nota en Tanda 2).

---

## Tanda 1 — Diagnóstico + paleta base
Completa. Ver commit `059c7f8` en `chore/migracion-paleta-tanda1`
(`docs/siaj-theme.css`, `docs/siaj-styleguide.html`, colores base
migrados en toda la UI).

## Tanda 2 — Identidad visual (Sidebar/Topbar/badges/filtros)
Completa, sin commitear hasta este punto (se commitea junto con esto).

- **Sidebar.tsx**: navy, texto/íconos blancos, ítem activo teal, hover
  navy-hover, divisor cream, 280/170px vía `var(--spacing-sidebar*)`, ítem
  40px, avatar 48px teal único (se eliminó el color por-rol).
- **Topbar.tsx**: teal, 90px, padding 32px, logo "Trenes Argentinos" en
  texto agregado a la derecha (no hay asset de logo en el repo).
- **AppLayout.tsx**: offsets `pt-`/`ml-` sincronizados con los mismos
  tokens de spacing del Sidebar/Topbar.
- **Badge.tsx**: `EstadoBadge` colapsado a un solo fondo `bg-neutral`
  (`#9AA6B2`) + texto blanco siempre, con un "dot" de color como único
  diferenciador por estado. `AreaBadge` usa `bg-area-civil/penal/laboral`.
  `RolBadge` Abogado/Administrativo usan `bg-neutral-dark`/`bg-navy-active`
  — **decisión nuestra, no del Figma** (documentado en comentario del
  archivo).
- **BandejaAbogado/BandejaArea**: barra de filtros (inputs blancos/borde
  `line`, selects teal/blanco), toggle Activos/Archivados 80×34 invertido.
  Fix de bug preexistente: `ESTADOS_CERRADO` no incluía `'ARCHIVO'` (código
  real del ciclo Penal) — sin esto ningún expediente Penal archivado
  aparecía nunca en el tab "Archivados".

### Pendiente de diseño (consulta abierta, 5 puntos — no bloquea código)
1. Frame de 1920 vs. pantalla real (mencionado por el usuario, no detallado
   en el chat — confirmar con diseño qué implica exactamente).
2. Dos rojos distintos en uso (mencionado por el usuario, no detallado —
   confirmar cuáles y si conviene unificar).
3. **4 contrastes WCAG AA que fallan**, todos "de fábrica" (vienen del
   Figma/manual de marca, ningún color se tocó):
   | Combinación | Uso | Ratio |
   |---|---|---|
   | `#FDC84A` + blanco | "Por vencer"/"En curso"/"Media" (bandeja) | **1.55:1** |
   | `#9AA6B2` + blanco | `EstadoBadge` (`bg-neutral`) | **2.48:1** |
   | `#758A93` + blanco | `RolBadge` Abogado/a (`bg-neutral-dark`) | **3.61:1** |
   | `#7A73D1` + blanco | `AreaBadge` Laboral (`bg-area-laboral`) | **4.04:1** |
4. **Pérdida funcional de `EstadoBadge`** (no es solo el número de
   contraste): antes cada estado procesal tenía su propio color de fondo
   (pastel distinto por familia). Con el fondo único `#9AA6B2`, todos los
   estados se ven idénticos a simple vista — el único diferenciador es un
   punto de 6px. En la bandeja principal, donde un coordinador escanea
   ~200 actuaciones, esto elimina la lectura de estado "de un vistazo".
   Documentado en comentario extenso arriba de `EstadoBadge` en `Badge.tsx`.
5. Los 2 colores de `RolBadge` (Abogado/Administrativo) que inventamos
   reusando tokens existentes — confirmar si diseño prefiere otra cosa.

## Tanda 3 — Dashboard (recharts)
Completa, sin commitear hasta este punto.

- `src/styles/chartTokens.ts` creado (`CHART_COLORS`).
- `Dashboard.page.tsx`: `COLOR_AREA`, los 4 `fill` de `<Bar>`, el mapeo
  `'blue'` del stat-tile, y la única clase Tailwind real (`bg-[#2a78d6]` →
  `bg-area-civil`) migrados a `CHART_COLORS`.
- **`FUNNEL_ESTADOS` (líneas ~389-391) — NO tocado a propósito**: es un
  embudo de *etapas procesales* (Asignado→En análisis→Traba de litis→
  Prueba→Sentencia→Cerrado), no de áreas. Coincide que reutiliza los mismos
  3 hex viejos de `COLOR_AREA`, pero ponerle civil/laboral/penal ahí sería
  semánticamente incorrecto (perdería el verde intermedio del embudo sin
  reemplazo). **Falta decidir qué token (si alguno) corresponde.**
- **`COLORES_SUBESTADO`** (rampa de 4 azules, `#85B7EB #2a78d6 #144d7d
  #0b3d66`) — mismo problema: codifica 4 sub-etapas procesales
  (`SUBESTADOS_KEYS`) en un `BarChart` apilado de "Distribución por
  sub-estado y área", no existe en el Figma. **Tampoco tocado.**

## Tanda 5A — Convergencia estructural de Bandeja (EN CURSO — quedó a mitad)

Archivos: `MesaSaco.page.tsx` (completo), `BandejaAbogado.page.tsx`
(completo), `BandejaArea.page.tsx` (completo). Los 3 aplicando el mismo
patrón:

- Eliminadas las 2 filas de `<thead>` (labels uppercase + `<select>`
  nativos dentro de `<th>`). Reemplazadas por **una barra de filtros fuera
  de la tabla** (`<div className="flex ... gap-2">`), altura 45px:
  - Inputs de texto: blanco, borde `border-line` (#BCC0C9), radius 4px.
  - Selects (Área/Tipo/Letrado/Línea + Estado donde ya existía): nuevo
    componente local `FiltroSelect` (dot 10px izquierda + chevron 12px
    derecha vía `appearance-none` + iconos absolutos), fondo teal, texto
    blanco. **Está duplicado en los 3 archivos** (no se extrajo a un
    componente compartido — decisión deliberada para no arriesgar romper
    los 3 archivos con una refactorización de componente en el mismo paso;
    candidato a compartir en una tanda de limpieza aparte).
  - "Recepción:" — label suelto `#404040` + botón teal con ícono de
    calendario. Implementado como `<label>` que envuelve un
    `<input type="date">` invisible (`opacity-0` sobre el botón) — el click
    en el botón abre el date-picker nativo. Muestra "Día/Mes/Año" sin
    seleccionar, o la fecha formateada una vez elegida.
  - **Filtro "Línea" es nuevo** — no existía en ninguno de los 3 archivos
    antes de esta tanda. Se agregó de punta a punta: estado, lógica de
    filtrado (`e.linea`) y el `<FiltroSelect>` poblado desde
    `LINEAS_FERROVIARIAS`.
- Sacada la card contenedora (`bg-white shadow-sm rounded-xl border`) de
  las 3 páginas — la tabla queda directa sobre el fondo crema. Cada fila
  de MesaSaco ahora lleva `bg-white` propio (antes lo heredaba de la card).
- Chip de cantidad → `bg-neutral` + texto blanco (mismo patrón que
  `EstadoBadge`) en las 3 páginas.
- **Solo en MesaSaco**: breadcrumb (`SIAJ › Mesa SACO`) eliminado, badge de
  área duplicado bajo el N° Interno eliminado (queda solo el de la columna
  Área), "Limpiar filtros" + paginación → botones 74×32 teal radius 4.
- `npx tsc --noEmit` **pasó limpio** en el estado final de todo lo anterior.
  `npm run build` **no se pudo confirmar en esta última pasada** — el
  clasificador de seguridad de la sesión estaba saturado y bloqueó los
  reintentos de `Bash`, no es un error de código. Cada paso intermedio
  anterior (Tanda 2, Tanda 3, y BandejaAbogado ya reestructurado dentro de
  esta misma Tanda 5A) sí había buildeado sin warnings. **Antes de seguir,
  correr `npm run build` una vez para confirmar el estado combinado final.**

### Decisiones tomadas sin pedir confirmación explícita (revisar)
- **BandejaAbogado/BandejaArea conservan su filtro "Estado"** aunque el
  punto 1 de la consigna solo listaba 4 selects (Área/Tipo/Letrado/Línea).
  Sacarlo habría sido una regresión funcional no pedida — se mantuvo,
  estilado igual que los demás selects.
- **`fechaHasta` (rango de fechas) se quedó sin lugar visible** en las 3
  páginas: el nuevo patrón "Recepción:" es un solo botón/fecha, no un
  rango. El estado y la lógica de filtrado de `fechaHasta` siguen
  intactos (nunca se tocaron), simplemente no hay ningún control en la UI
  que lo alcance. Si se necesita el rango completo, hace falta decidir
  cómo exponerlo (¿dos botones? ¿un popover con dos inputs?).
- **BandejaAbogado conserva su toolbar propio** (Expandir todo / Colapsar /
  Urgentes / Alertas) fuera de la card removida, como fila plana sobre el
  fondo crema — no estaba pedido explícitamente pero quitarlo habría sido
  una pérdida de funcionalidad no solicitada.
- El `<thead>` de las 3 tablas desapareció por completo — ya no hay ninguna
  fila de labels de columna (`N° Causa`, `Carátula`, `Área`, etc.) en
  ningún lado. Es lo que pedía la consigna literalmente, pero es una
  pérdida de contexto visual real que vale la pena confirmar con quien
  vaya a usar la bandeja todos los días.

### Qué falta para cerrar Tanda 5A
1. Reconfirmar `npm run build` limpio (bloqueado por saturación de sesión,
   no por error conocido).
2. Confirmar o corregir las 3 decisiones "sin pedir confirmación" de
   arriba (Estado, fechaHasta, toolbar de BandejaAbogado).
3. Evaluar extraer `FiltroSelect` a un componente compartido
   (`src/components/ui/`) — hoy vive duplicado idéntico en los 3 archivos.
4. Confirmar si el logo de Topbar (Tanda 2, texto "TRENES/ARGENTINOS") va
   a seguir siendo texto o si va a llegar un asset real.

---

## Cómo seguir

Todo lo de arriba está en un solo commit sobre
`chore/migracion-paleta-tanda1` (push incluido). Para continuar: retomar
por "Qué falta para cerrar Tanda 5A", en orden.
