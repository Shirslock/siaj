# src/pages/ — Páginas de la aplicación

## Estructura de cada página

```
src/pages/NombrePagina/
  NombrePagina.page.tsx    ← componente principal
  useNombrePagina.ts       ← hook con lógica compleja (si aplica)
  tabs/                    ← si la página tiene tabs
    DatosTab.tsx
    TimelineTab.tsx
    ...
```

---

## Páginas implementadas

| Carpeta | Ruta | Roles | Estado |
|---------|------|-------|--------|
| `Dashboard/` | /dashboard | REFERENTE, COORDINADOR, ABOGADO | ✓ 3 vistas por rol (Power BI) — ver `Dashboard/Dashboard_CLAUDE.md` |
| `MesaSaco/` | /mesa | ADMINISTRATIVO | ✓ filtros embebidos |
| `AltaExpediente/` | /mesa/alta | ADMINISTRATIVO | ✓ modal confirmación |
| `Actuaciones/` | /actuaciones | ABOGADO, COORDINADOR, REFERENTE | ✓ router por rol |
| `BandejaAbogado/` | /bandeja/abogado (alias→/actuaciones) | ABOGADO, COORDINADOR, REFERENTE | ✓ filtros Urgentes + Por vencer, sincronizada con el buscador global del Topbar (`busquedaGlobal`/`?q=`) — solo Actuaciones, ver Sección 19 de `CLAUDE_root.md`; botón "Exportar Excel" (`src/utils/exportBandeja.ts`) — ver detalle abajo |
| `BandejaArea/` | /bandeja/area (alias→/actuaciones) | COORDINADOR, REFERENTE | ✓ filtros embebidos |
| `DetalleExpediente/` | /expediente/:id | ABOGADO, COORDINADOR, REFERENTE | ✓ 7 tabs, soporta abrir en tab específica vía `?tab=` (Topbar → resultado de Interviniente/Documento) |
| `CausaDetalle/` | /causa/* | ABOGADO, COORDINADOR, REFERENTE | ✓ 4 tabs |
| `Configuracion/` | /configuracion | REFERENTE únicamente | ✓ panel admin con 28 tablas |
| `Actividades/` | /expediente/:id/actividades | ABOGADO, COORDINADOR, REFERENTE | carpeta vacía |
| `Agenda/` | /agenda | ABOGADO, COORDINADOR, REFERENTE | ✓ calendario mensual/semanal (lun–vie), filtros por rol, audiencias mock; eventos custom solo se listan/eliminan (sin UI de alta) |
| `Licencias/` | /licencias | TODOS los roles | ✓ gestor de licencias — alta con motivo/reemplazante, licencias propias, actuaciones a cargo como reemplazante (`LicenciasPage.tsx`) |
| `NovedadesPJN/` | /novedades-pjn | ABOGADO, COORDINADOR, REFERENTE (no ADMINISTRATIVO) | ✓ bandeja central de novedades detectadas por la sincronización con el Portal PJN — ver `NOVEDADES_PJN_CLAUDE.md` |

---

## Tabs de DetalleExpediente

| Tab | Archivo | Estado |
|-----|---------|--------|
| Datos | DatosTab.tsx | ✓ edición completa |
| Timeline | TimelineTab.tsx | ✓ tareas + actividades + feed colapsable |
| Intervinientes | IntervinientesTab.tsx | ✓ CRUD completo — agregar (modal extraído a `AgregarIntervinienteModal.tsx`, reusado también desde una novedad PJN), editar (modal propio de la tab), eliminar; columna Letrado |
| Documentos | DocumentosTab.tsx | ✓ carga + drag-and-drop con @dnd-kit para reordenar |
| Previsión | PrevisionTab.tsx | ✓ mock SIGEJ |
| Vinculados | VinculosTab.tsx | ✓ modal vincular |
| Asistente IA | AsistenteTab.tsx | ✓ chat con contexto de la actuación — ver `ASISTENTE_IA_CLAUDE.md` |

---

## Configuracion/ — Panel de Administrador

Solo accesible para `rolSistema === 'REFERENTE'`. Redirect a `/actuaciones` para otros roles.

Archivos:
- `Configuracion.page.tsx` — layout dos columnas (sidebar grupos + contenido)
- `tablas.config.ts` — definición de 5 grupos y 28 tablas
- `CatalogoPanel.tsx` — CRUD genérico (tipos: simple / extended / tipoGestion)
- `UsuariosPanel.tsx` — tabla de usuarios con modal edición (FIFO + líneas ferroviarias)

Grupos del sidebar:
1. Configuración Base (4 tablas — 3 solo lectura)
2. Gestión Jurídica (9 tablas)
3. Organismos Judiciales (5 tablas)
4. Catálogo de Hechos y Sanciones (6 tablas)
5. Personal e Intervinientes (3 tablas)

---

## DatosTab — campos `multiselect` (slots apilables)

`renderCampoInput` (caso `campo.type === 'multiselect'`) renderiza un `<select>` por valor
elegido ("slot"), con botón "Agregar otro" para sumar un slot vacío y botón "✕" por slot para
quitarlo. Usado por `abg_tipo_hecho` (OFICIO Penal).

**Bug corregido — "Agregar otro" no hacía nada:** el helper `commit(newSlots)` filtra
`v !== ''` antes de escribir en el draft (limpieza necesaria al eliminar un slot o al elegir un
valor real). El botón "Agregar otro" llamaba `commit([...slots, ''])` — el `''` recién agregado
se descartaba dentro del propio `commit`, el draft quedaba idéntico y el botón parecía inerte.
Fix: "Agregar otro" ahora escribe directo con `setDraft(p => ({ ...p, [campo.id]: [...slots,
''] }))`, sin pasar por `commit`. La selección de un valor real (`onChange` del `<select>`) y el
botón "✕" siguen usando `commit` (ahí sí corresponde filtrar).

**Modo lectura (`valorDisplay`):** `multiselect` se muestra como texto plano
(`.join(', ')`) — **no** como chips/pills. Consistente con el resto de campos de solo lectura.

### Solicitud Penal — ya NO vive en Datos Maestros

`abg_tipo_solicitud` fue eliminado del formulario (`formularios.ts`) y `ModalSolicitudPenal.tsx`
ya no existe. Los 10 tipos de Solicitud Penal se migraron al modal "Nueva Actividad" de
`TimelinePenal.tsx` — ver sección "Modal Nueva Actividad — tabs" más abajo.

---

## DetalleExpediente — Cambio de estado (Civil/Laboral)

Modal "Cambiar estado" con lógica de flujo procesal:

- **Desde ASIGNADO**: muestra solo el nombre del próximo estado (sin select). Siempre habilitado.
- **Desde cualquier otro estado**: select con `<optgroup label="Avanzar">` y `<optgroup label="Retroceder">` (todos los anteriores no archivados).
  - "Avanzar" muestra las opciones **ramificadas** (`getRamificaciones(codigoActual, exp.tipo)`) cuando el estado actual bifurca — `EN_ANALISIS` (ciclo A/B, según tipo) o `ALEGATO`/`APELACION` (Sentencia Favorable/Desfavorable, igual en los 4 ciclos MATRIZ SACO sin importar el tipo) — o, si no ramifica, el único siguiente lineal (`siguienteEstadoProcesal`).
  - Para los 4 tipos de `TIPOS_FINALIZACION_LIBRE` (Demanda Civil/Laboral Actora/Demandada), "Avanzar" **siempre** agrega "Finalizado" al final, además de las opciones anteriores.
- **Avance bloqueado** si `tareasEstadoActual.length > 0 && some(t => t.estado === 'en_curso')` → aviso rojo + options disabled + botón Confirmar disabled. No aplica si el destino elegido es "Finalizado" (excepción administrativa).
- **Retroceso**: motivo **obligatorio** (asterisco rojo, placeholder distinto, botón Confirmar deshabilitado sin texto) — a diferencia del avance, donde el motivo es opcional. Aviso amarillo remarca el carácter excepcional de la operación.
- Elegir "Finalizado" no avanza directo: `confirmarEstado()` lo intercepta y abre un segundo modal, "Finalizar actuación" (`modalCausal`), que pide la **causal de finalización** — select con el catálogo de `getCausalesPorEstado(grupoCausal del estado ORIGEN)` (`causalesFinalizacion.ts`) o, si ese grupo no tiene catálogo, un textarea libre. Al confirmar: `causal_finalizacion` queda seteado en el expediente (campo bloqueado en DatosTab), el estado pasa a `FINALIZADO` y se registra la actividad con la causal en la descripción.
- `tieneTareasPendientes` se calcula una sola vez antes del JSX, no inline.

**Ramificación genérica — `getRamificaciones(codigoEstado, tipoExpediente)`** (en
`DetalleExpediente.page.tsx`, reemplazó al viejo `ESTADOS_DESDE_EN_ANALISIS: Record<Tipo, string[]>`):
- `EN_ANALISIS` es la única ramificación que depende del **tipo** de expediente (`TIPOS_EN_ANALISIS_CICLO_A` con `ACUERDO_EXTRAJUDICIAL`, `TIPOS_EN_ANALISIS_CICLO_B` sin él).
- Todo lo demás (`ALEGATO`, `APELACION`) sale de `RAMIFICACIONES_POR_CODIGO`, un `Record<string, string[]>` por **código de estado**, válido para cualquier tipo — necesario porque esos códigos son idénticos en los 4 ciclos de Demanda Civil/Laboral.
- Devuelve `[]` si el estado no ramifica (flujo lineal normal vía `.siguiente`).

**Recurso de Queja — ELIMINADO por completo.** Ya no existe `RecursoQuejaBlock` en
`TimelineTab.tsx`, ni el flag `queja_en_tramite`, ni el checklist `TAREAS_RECURSO_QUEJA`, ni la
acción `toggleQuejaEnTramite` — decisión de negocio. `REF` avanza directo a
`EJECUCION_SENTENCIA` sin ningún bloque paralelo asociado.

## DetalleExpediente — Acciones del menú `+` (Iniciar Juicio / Iniciar Querella)

Ambas acciones viven en el menú `+` del header y crean/transforman actuaciones. Se muestran
condicionalmente por `tipo` y estado:

- **Iniciar Juicio** (Civil/Laboral): `show` si `TIPOS_CON_JUICIO.has(exp.tipo)` y el estado es
  `JUICIO_INICIADO`. Para la mayoría de los tipos (COBRO_CANON, RECLAMO_CONTRAT, RECUPERO,
  EJECUCION_GAR, CONSIGNACION, DESAFUERO) **NO crea un expediente nuevo** — actualiza el actual
  (`es_juicio_iniciado`, `fecha_inicio_juicio`, `campos_mesa.mesa_*`, incluye `mesa_ubicacion`/
  `mesa_linea`). **LANZAMIENTO es la única excepción**: crea un expediente nuevo de
  `tipo: 'LANZAMIENTO_JUDICIALIZADO'` — ver "Flujo Iniciar Juicio → Lanzamiento" abajo.
- **Iniciar Querella** (Penal): `show` si `exp.tipo === 'CARTA_SUCESO' && !exp.es_querella_iniciada`.
  SÍ crea un expediente nuevo de `tipo: 'QUERELLA'`, análogo a "Iniciar Juicio → Lanzamiento" pero
  para el flujo penal. Se llamaba "Nueva Querella" (label del menú, título del modal, título de la
  actividad registrada en la Carta SAE de origen) — renombrado a "Iniciar Querella" / "Querella
  iniciada" en la UI; el identificador interno `confirmarNuevaQuerella` y el resto de variables
  (`formQuerella`, `BLANK_QUERELLA`) no cambiaron.
- **"Nueva Actuación"** (Penal, sin `show` propio en esta lista): existía también como opción
  duplicada de este menú — navegaba a la misma ruta genérica `RUTAS.NUEVA_ACTUACION_PENAL` sin
  precompletar nada del expediente abierto. Se eliminó del menú `+` de `DetalleExpediente` por
  redundante; sigue disponible solo desde el botón "+ Nueva Actuación" del header de
  `BandejaAbogado.page.tsx` (gate `esAbogadoPenal(usuarioActivo)`), que es el único punto de
  acceso ahora.

### Flujo Iniciar Querella (`confirmarNuevaQuerella`)

Modal con carátula (obligatoria), fuero→juzgado en cascada (`FUEROS_PENAL` + `getJuzgadosPorFuero`
de `data/juzgadosPJN`), fiscalía, N° causa/IPP, letrado (`USUARIOS` ABOGADO/COORDINADOR) y observaciones.

Al confirmar:
1. Calcula una **causa común** para agrupar ambas actuaciones:
   `formQuerella.numero_causa.trim() || exp.numero_causa?.trim() || exp.id` (el `id` de la Carta es
   el sentinela de último recurso cuando no hay N° de causa real).
2. Crea la Querella (`estado`/`estadoProcesal: 'INSTRUCCION'`, área PENAL) con `numero_causa: causaComun`
   y `vinculos: []` (los vínculos los carga el abogado desde la tab Vinculados — el sistema no los
   crea automáticamente). Se agrega al store con `agregarExpediente`.
3. Parchea la Carta SAE: `es_querella_iniciada: true`, `id_querella_derivada: idQuerella`,
   `numero_causa: causaComun`, `es_principal: false`.
4. Agrega un movimiento impulsorio al timeline de la Carta y navega a la nueva Querella.

**`es_principal` — nunca sin causa real:** `es_principal` de la Querella nueva **no es `true`
hardcodeado** — se calcula `tieneCausaReal = !!(formQuerella.numero_causa.trim() ||
exp.numero_causa?.trim())`, **sin contar el fallback a `exp.id`** (ese es solo el sentinela de
agrupación, no una causa real). Regla general: ninguna actuación con `numero_causa` nulo/vacío
puede tener `es_principal: true` (ver Sección 7 de `CLAUDE.md`).

**Resultado en Bandeja:** Carta y Querella quedan agrupadas bajo `causaComun`; si `tieneCausaReal`
la Querella es la cabecera del grupo (`es_principal: true`, ver regla en `data_CLAUDE.md` /
`es_principal` en `types_CLAUDE.md`). Al expandir el grupo, la actuación `es_principal: true`
siempre se renderiza primero (sort estable aplicado justo antes del render en
`BandejaAbogado.page.tsx`/`BandejaArea.page.tsx`/`TablaExpedientes.tsx` — ver Sección 7 de
`CLAUDE.md`), así que la Querella recién creada aparece arriba de la Carta SAE de origen.

### Flujo Iniciar Juicio → Lanzamiento (`confirmarIniciarJuicio`, rama LANZAMIENTO)

Mismo patrón que `confirmarNuevaQuerella`, pero desde el modal "Iniciar Juicio" y solo cuando
`MAPA_INICIAR_JUICIO[exp.tipo] === 'LANZAMIENTO_JUDICIALIZADO'` (o sea, `exp.tipo === 'LANZAMIENTO'`):

1. `causaComun = formJuicio.numero_causa.trim() || exp.numero_causa || exp.id` (mismo patrón sentinela).
2. Crea el expediente `LANZAMIENTO_JUDICIALIZADO` nuevo (`id: C-LJ###### / L-LJ######` según
   `exp.area`), `estado`/`estadoProcesal: 'ASIGNADO'`, `campos_mesa` con los mapeos de `formJuicio`
   (incluye `mesa_tipo_lanzamiento`, obligatorio — el modal bloquea "Confirmar Inicio" sin ese
   campo cuando el tipo origen es LANZAMIENTO). `es_principal` usa `tieneCausaReal`, mismo cálculo
   que en Nueva Querella.
3. Parchea el LANZAMIENTO origen: `es_juicio_iniciado: true`, `fecha_inicio_juicio`,
   `numero_causa: causaComun`, `es_principal: false`.
4. Agrega movimiento impulsorio al timeline del origen y navega al expediente nuevo.
5. El resto de `MAPA_INICIAR_JUICIO` (COBRO_CANON/RECLAMO_CONTRAT/RECUPERO/EJECUCION_GAR →
   DEMANDA_CIVIL_ACTORA; CONSIGNACION/DESAFUERO → DEMANDA_LABORAL_ACTORA) sigue el camino
   original de parchear el mismo expediente — no se tocó.

## Agenda/ — Lógica de negocio

Archivo principal: `Agenda.page.tsx`. Hook de datos: `useAgendaEvents.ts`.
Mock de audiencias: `src/data/audiencias.mock.ts`.

Vistas: `'mes' | 'semana'` (toggle). **No hay vista día ni listado.** La grilla muestra
solo **lunes a viernes** (sábado/domingo se eliminan del layout). Vista mes: máx 3 chips por
día + "+N más". Panel lateral fijo con el detalle del día seleccionado.

**Dos fuentes de eventos:**
- `AgendaEvent` (derivados del sistema) — se arman en `useAgendaEvents()` desde: tareas de
  `tareasMap`, actividades del `timeline` con `fecha_vencimiento`, `AUDIENCIAS_MOCK` y tareas
  Kanban (`useTareasStore`, con flag `mostrar_en_agenda`). Campo `tipo`:
  `'AUDIENCIA' | 'TAREA' | 'ACTIVIDAD' | 'SISTEMA'`. No tienen hora, se ubican solo por fecha.
- `EventoCustom` (manuales) — via `useAgendaStore()`. Tipos: `reunion | recordatorio |
  vencimiento | otro`. **No están vinculados a expedientes.**

**Filtros por rol** (en `useAgendaEvents.ts`):
- `REFERENTE`: ve todo (todos los abogados y áreas)
- `COORDINADOR`: ve su área (`usuarioActivo.areas`)
- `ABOGADO`: solo sus propios eventos + audiencias de su área

**Interacciones:** desde el detalle de un `AgendaEvent` se puede "Ver actuación"
(navega a `RUTAS.EXPEDIENTE`) y "Marcar cumplido" (`editarActividad`). Los `EventoCustom`
solo se pueden **eliminar** (`eliminarEvento`).

> ⚠️ **Alta de eventos custom no implementada:** el store expone `agregarEvento`, pero
> ningún componente lo invoca. Al hacer click en un día solo se selecciona; el `BLANK_EVENTO`
> preparado nunca se envía. No hay modal de alta, formulario inline ni drag & drop.

---

## TimelineTab — Arquitectura del feed

El feed colapsable usa `gruposFeed` (useMemo sobre `sorted`):

```ts
gruposFeed = {
  grupos: Array<{ sistema: Actividad | null, tareasHist: Tarea[], actividades: Actividad[] }>,
  entradaRecepcion: Actividad | null,
}
```

- La entrada `RECEPCION` se extrae del sorted y se renderiza **siempre fija al final** del feed, fuera de los bloques colapsables.
- Cada grupo `sistema` agrupa las actividades entre ese cambio de estado y el siguiente, **por posición en sorted** (no por fecha) — evita bugs con actividades de misma fecha.
- El período actual (`{ sistema: null }`) contiene actividades más recientes que el último cambio de estado.
- `getTareasHistoricas` reconoce tanto "Cambio de estado:" como "Retroceso de estado:" (regex `(?:Cambio|Retroceso)`). Si el estado anterior es ASIGNADO, retorna `[]`.

Orden de renderizado en tab "Todo":
1. **TareasBlock** del estado actual (arriba)
2. **Feed colapsable** por estado (abajo)
3. **Entrada RECEPCION** fija al final

### Edición / eliminación de actividades (con log de auditoría)

- Solo visible si `esLetrado` y la actividad no es `RECEPCION` ni un movimiento de sistema
  (`esMovimientoSistema(a)`: `tipo === 'MOVIMIENTO'` + `estadoExpediente` + título "Cambio de
  estado…"/"Retroceso de estado…"). **No filtrar por `tipo !== 'MOVIMIENTO'` a secas** — el
  modal "Nueva actividad" usa `MOVIMIENTO` como tipo por defecto (`BLANK_ACT.tipo`), así que esa
  condición ocultaba el menú de cualquier actividad genérica creada sin cambiar el tipo.
- **⚠️ `esLetrado` está hardcodeado en `true` (bandera demo temporal)** en `TimelineTab.tsx` y
  `TimelinePenal.tsx` — comentario en el código marca la regla real a restaurar:
  `usuarioActivo?.id === exp.abogado_id || usuarioActivo?.rolSistema === 'COORDINADOR'`
  (no incluye Referente). Revertir antes de producción — ver `CAMBIOS_MATRIZ_SACO.md` sección 6.
- **Portado a `TimelinePenal.tsx`:** este patrón (Comentar + menú ⋮ Editar/Eliminar,
  `historialCompleto` filtrando `act.eliminado`) solo existía en `TimelineTab.tsx` hasta que se
  portó también a Penal. `TimelinePenal.tsx` mantiene su propia copia local de `<ReplyList>` (no
  la importa de `TimelineTab.tsx` para evitar un import circular, ya que `TimelineTab` importa
  `TimelinePenal`). El botón "Editar" ahí es genérico (`abrirEdicionActividad`) — aplica a
  cualquier actividad, y solo precarga `solicitud_penal_campos`/`archivos` si
  `getConfigPorTipoActividad` devuelve algo para ese tipo.
- El menú ⋮ **no** es un dropdown CSS `group-hover` posicionado `absolute` — el contenedor del
  feed tiene `overflow-hidden` (`rounded-2xl overflow-hidden`) y lo recorta. Es un menú controlado
  por estado (`menuActividad`), con `position: fixed` calculado desde
  `e.currentTarget.getBoundingClientRect()` en el click, renderizado una sola vez fuera del
  contenedor recortado (junto a los modales) y cerrado con un listener de `click` en `document`
  (mismo patrón que `menuExport`).
- `editarActividad`/`eliminarActividad` (store) actualizan `Actividad.log` — se muestra con
  `<LogAuditoriaList log={a.log ?? []}>` (mismo archivo) debajo de `<ReplyList>`.
- La eliminación es soft-delete (`Actividad.eliminado`, no `activo` — ver nota en `types_CLAUDE.md`);
  el feed (`sorted`) filtra con `!a.eliminado`.

## Modal "Nueva Actividad" — tabs

**Civil/Laboral (TimelineTab):** 2 tabs — `'generica'` y `'solicitud'`
**Penal (TimelinePenal):** 3 tabs — `'procesales'`, `'genericas'` y `'solicitud'`

En el tab `'genericas'` de `TimelinePenal`, el select de Tipo incluye — como opciones sueltas,
sin optgroup — los 10 tipos de Solicitud Penal (`TIPO_ACTIVIDAD_SOLICITUD_PENAL`, ver
`data_CLAUDE.md`). Al elegir uno con config (`getConfigPorTipoActividad`), aparece un
sub-formulario inline debajo de fecha/doc_gde con los campos propios de ese tipo (fijos +
condicionales si corresponde). Repetible (sin restricción de unicidad), editable (botón
"Editar" del feed) y completable después (badge "Sin completar" mientras
`!solicitudEstaCompleta(tipo, campos)`).

El tab **Nueva Solicitud** usa el componente compartido `<SolicitudForm>` (`src/components/SolicitudForm.tsx`).
- El `expediente_id` se toma automáticamente del expediente abierto — no hay campo para elegirlo.
- Selector de asignación en dos pasos: primero el grupo (Civil/Laboral/Penal/RRHH/Comercial/Seguros), luego la persona.
- Grupos internos (Civil/Laboral/Penal) muestran abogados y coordinadores de `USUARIOS`.
- Grupos externos (RRHH/Comercial/Seguros) muestran personas de `PERSONAS_POR_AREA` del store.
- `form.asignado_a` es un **array multiselect** (checkboxes) — sirve tanto para internos (ids `UR_`) como para externos (ids `PA_`). `area_destinataria` se setea al elegir un grupo externo.
- **Destinatario obligatorio:** el `<option>` inicial es `disabled` ("Seleccionar destinatario...") y el botón "Crear solicitud" queda deshabilitado si no hay `asignado_a` ni `area_destinataria`.

### Modelo unificado de solicitudes (timeline ↔ módulo Solicitudes)

`guardarSolicitud`/`guardarSolicitudPenal` hacen **dos cosas** al confirmar:
1. `agregarSolicitud()` de `useSolicitudesStore()` → crea la `Solicitud` que aparece en el módulo
   Solicitudes (`/tareas`) y puede responderse ahí. (Ya **no** usa `useTareasStore().agregarTarea`.)
2. `agregarActividad()` → deja una entrada en el timeline del expediente con `tipo: 'OTRO'`,
   `id: SOL_...` y `es_solicitud: true` (icono `task`, badge violeta **SOLICITUD**).

Las entradas con `es_solicitud` son **read-only** en el feed: no muestran "Comentar" ni el menú ⋮.

**La respuesta impacta de vuelta en el timeline** (ver `responderSolicitud` en `store_CLAUDE.md`):
al responder desde el módulo Solicitudes se agrega una actividad `NOTA_RESPUESTA` (`es_solicitud: true`,
badge verde **RESPUESTA**, icono `edit_note`/`check`) en el expediente de origen, y si la respuesta
trae adjunto, se suma al repositorio de la tab Documentos.

```ts
import { SolicitudForm, BLANK_SOLICITUD } from '../../../components/SolicitudForm'
// GrupoAsig: 'CIVIL' | 'LABORAL' | 'PENAL' | 'RRHH' | 'COMERCIAL' | 'SEGUROS' | ''
```

---

## Sistema de Replies (comentarios anidados)

- Botón "Comentar" visible **solo si `esLetrado`** (regla real: letrado asignado o Coordinador —
  ver nota de la bandera demo más arriba). Aplica en **ambos** timelines (Civil/Laboral y Penal).
- Al hacer click → modal con: texto (obligatorio), fecha, doc GDE opcional, fecha vencimiento y fecha aviso opcionales
- Los replies se almacenan en `act.replies?: Reply[]` vía `agregarReply(expId, actividadIdx, replyData)` en el store
- `actividadIdx` es la posición en `exp.timeline` (usar `exp.timeline.indexOf(act)`, o el `timelineIdx` ya calculado en `TimelinePenal`)
- Se renderizan con `<ReplyList>` debajo de cada actividad, con línea azul lateral (`border-l-2 border-[#C4DFE8]`) — `TimelinePenal.tsx` tiene su propia copia local del componente (ver nota más arriba sobre el import circular)
- Aplica tanto en el período actual como en los bloques colapsables de períodos anteriores (TimelineTab); en TimelinePenal aplica sobre el feed único
- Exportación: `actividadesToFilas()` emite filas de tipo `'Comentario'` con título `-> NOMBRE_AUTOR` por cada reply

---

## Filtros embebidos — patrón estándar

Todas las tablas con filtros usan thead de 2 filas:

```tsx
<thead>
  {/* Fila 1: labels */}
  <tr className="border-b border-[rgba(0,0,0,0.08)] bg-[#f9f9f9]">
    <th className="px-3 py-2.5 text-left text-[10px] font-black
      uppercase tracking-widest text-[#4a6a84]">
      Columna
    </th>
  </tr>
  {/* Fila 2: inputs */}
  <tr className="border-b-2 border-[rgba(0,0,0,0.10)] bg-[#f5f5f5]">
    <th className="px-2 py-1.5">
      <input className="w-full px-2 py-1.5 text-xs border
        border-[rgba(0,0,0,0.15)] rounded-md bg-white
        text-[#1b3a57] placeholder-[#a0b0bc]
        focus:outline-none focus:border-[#1b3a57]"
        placeholder="..." />
    </th>
  </tr>
</thead>
```

---

## Exportar Excel — BandejaAbogado (`src/utils/exportBandeja.ts`)

Botón "Exportar Excel" en la barra de acciones de la tabla (junto a Expandir/Colapsar/
Urgentes/Alertas/Limpiar filtros), deshabilitado si `items.length === 0`. Descarga
`Bandeja_Actuaciones_YYYYMMDD.xlsx` con la bandeja tal como está filtrada en pantalla, pero
**completando cada causa presente en el resultado** con el resto de expedientes que
comparten `numero_causa` (los "antecedentes"), aunque esas actuaciones adicionales no hayan
pasado todos los filtros:

- Set base: `expedientesFiltrados` (respeta todos los filtros + `tabEstado` + `poolBase`).
- Por cada `numero_causa` distinto del set base, se completa el grupo trayendo el resto de
  expedientes de esa causa desde `poolBase` (ya acotado por rol), **filtrado solo por
  `filtros.letrado` y `filtros.area`** si están seteados — el resto de filtros (`tipo`,
  `estado`, fechas, búsqueda, `soloUrgentes`, `soloAlerta`, `tabEstado`) no restringen esta
  completación.
- Los "sueltos" (sin `numero_causa` o `=== 'SS'`) se exportan tal cual, sin completar nada.
- Cada fila indica en `Incluido por` si vino de `Filtro` (estaba en `expedientesFiltrados`) o
  `Agrupador de causa` (se sumó solo por compartir `numero_causa`).

`construirFilasBandejaExport(items, expedientesFiltrados, poolBase, {letrado, area})` arma las
filas; `exportarBandejaExcel(filas, nombreArchivo)` genera el `.xlsx` (mismo patrón visual que
`exportTimeline.ts`: `XLSX.utils.aoa_to_sheet`, headers en negrita, anchos con `!cols`). El
util define su propio tipo `ItemBandejaExport` (misma forma que el `ItemBandeja` privado del
page) para no acoplarse a un tipo interno del componente.

## Reglas

1. El componente de página lee del store — no recibe props de datos
2. Navegación: `useNavigate()` + constantes `RUTAS` de `utils/routing.ts`
3. Lógica compleja → extraer a hook local en la misma carpeta
4. Tabs de DetalleExpediente reciben `exp: Expediente` como prop
5. Toda página muestra spinner/mensaje si los datos son null

## Patrón mínimo

```tsx
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { useNavigate } from 'react-router-dom'
import { RUTAS } from '../../utils/routing'
import { toast } from 'react-toastify'

export default function MiPaginaPage() {
  const navigate = useNavigate()
  const { usuarioActivo } = useUIStore()
  const { expedientes } = useExpedientesStore()

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* contenido */}
    </div>
  )
}
```
