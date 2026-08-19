# SIAJ — Registro de cambios: Matriz SACO, Solicitudes, Querella y Lanzamientos

> **Cómo usar este archivo:** registro vivo de las decisiones y cambios implementados en el
> prototipo a partir de la documentación de Matriz SACO (Excel + Word compartidos por
> Subgerencia/Sistemas) y de las HU-25/HU-26 de Solicitudes. Cada vez que se implemente un
> cambio relacionado con estos temas, **Claude Code debe agregar una entrada nueva** en la
> sección correspondiente, siguiendo el mismo formato: qué se pidió → qué se decidió → qué se
> tocó en el código → cómo verificarlo. No reescribir entradas viejas — solo agregar al final
> de cada sección o marcar `[SUPERADO POR: ...]` si un cambio posterior lo reemplaza.

---

## 1. Nueva Querella (Carta SAE → Querella)

**Origen:** pedido de replicar el flujo "Iniciar Juicio" para el área Penal, con nombre
"Iniciar Querella", habilitado solo para `CARTA_SUCESO`.

### Implementado
- Botón **"Nueva Querella"** en el menú `+` del header de `DetalleExpediente`, condición de
  visibilidad: `exp.tipo === 'CARTA_SUCESO' && !exp.es_querella_iniciada`.
- Modal con: carátula (obligatoria), fuero → juzgado en cascada (`FUEROS_PENAL` +
  `getJuzgadosPorFuero`), fiscalía, N° causa/IPP, letrado asignado, observaciones.
- Al confirmar (`confirmarNuevaQuerella`):
  - Crea un expediente **nuevo** de `tipo: 'QUERELLA'`, área PENAL, estado `Asignado` — usa la
    acción nueva `agregarExpediente` del store (no existía antes; se agregó para este flujo).
  - Calcula una **causa común**: `formQuerella.numero_causa.trim() || exp.numero_causa?.trim()
    || exp.id` (el `id` de la Carta es el sentinela de último recurso).
  - La Querella queda `es_principal: true`; la Carta SAE se parchea con
    `es_querella_iniciada: true`, `id_querella_derivada`, `numero_causa: causaComun`,
    `es_principal: false` — así la Querella pasa a ser la **cabecera del grupo-causa** en la
    Bandeja (regla: `exps.find(e => e.es_principal) ?? exps[0]`).
  - `vinculos: []` en la Querella nueva — **los vínculos los crea el abogado manualmente**
    desde la tab Vinculados, el sistema no vincula automáticamente.
  - Se agrega un movimiento impulsorio al timeline de la Carta SAE y se navega a la Querella.
- Badge "Ver Querella →" en el header de la Carta SAE una vez iniciada la Querella.

### Tipos/store agregados
- `Expediente.es_querella_iniciada?: boolean`
- `Expediente.id_querella_derivada?: string`
- `agregarExpediente(exp: Expediente)` en `expedientes.store.ts`

### Cómo verificar
Con una Carta SAE (`CARTA_SUCESO`) sin querella iniciada → botón `+` → "Nueva Querella" →
completar modal → confirmar → navega a la nueva Querella → volver a la Carta → badge
"Ver Querella →" visible → en Bandeja, ambas quedan agrupadas bajo la misma causa con la
Querella como cabecera.

---

## 2. Sistema de Solicitudes — unificación timeline ↔ módulo Solicitudes

**Origen:** HU-25 (Crear Solicitud desde una Actuación) y HU-26 (Gestión de Solicitudes).

### Problema detectado
Existían **dos modelos desconectados** con el mismo nombre "solicitud":
- Lo creado desde el timeline (`TimelineTab` → solapa "Nueva Solicitud") llamaba a
  `useTareasStore().agregarTarea` → creaba una `TareaKanban`.
- El módulo Solicitudes del Sidebar (`tareas.page.tsx`) lee y responde `Solicitud` desde
  `useSolicitudesStore` (mock `SOLICITUDES_MOCK`).
- Resultado: una solicitud creada desde el timeline **no aparecía** en el módulo Solicitudes
  ni tenía flujo de respuesta.

### Implementado
- `guardarSolicitud()` (TimelineTab y TimelinePenal) ahora llama a
  `useSolicitudesStore().agregarSolicitud` — ya NO usa `useTareasStore`.
- **Asignación obligatoria**: se eliminó la opción "Sin asignar" del selector de 2 pasos
  (Interno/Externo SIAJ → Área → Usuario). El botón "Crear solicitud" queda bloqueado sin
  destinatario.
- La actividad que se agrega al timeline al crear la solicitud queda marcada
  `es_solicitud: true` → **de solo lectura**: sin botón Comentar, sin menú ⋮ (editar/eliminar).
  Badge visual "SOLICITUD" (violeta) en el feed.
- **Respuesta impacta en el timeline**: `responderSolicitud(id, respuesta)` en
  `tareas.store.ts`, además de marcar la solicitud como `respondida`, ahora:
  - Agrega una actividad tipo `NOTA_RESPUESTA` (también `es_solicitud: true`, solo lectura)
    en el timeline del expediente de origen (`sol.expediente_id`), con el comentario de la
    respuesta y el nombre del adjunto si lo hay. Badge visual "RESPUESTA" (verde).
  - Si la respuesta tiene adjunto → se agrega también a `Documento[]` del expediente (usa
    `expedientes.store.getState().agregarDocumento`, evitando dependencia circular entre
    stores vía `getState()`).

### Tipos/store agregados
- `Actividad.es_solicitud?: boolean`
- `Actividad.solicitud_id?: string` (referencia cruzada, pendiente de completar en todos los
  puntos de creación)

### Cómo verificar
Crear solicitud desde el timeline de una actuación asignándola a un letrado o área externa →
aparece en el timeline como entrada de solo lectura (badge SOLICITUD) y en el módulo
Solicitudes (vista "Recibidas" del destinatario). El destinatario adjunta respuesta desde el
módulo → la respuesta aparece en el timeline de la actuación original (badge RESPUESTA) y el
adjunto queda en la tab Documentos.

---

## 3. MATRIZ SACO — Demanda Civil / Laboral (4 ciclos: Actora + Demandada)

**Origen:** documento "Resumen de cambios — MATRIZ SACO UNIFICADA y TAREAS POR DOCUMENTO"
(10-11/08/2026), sección 2.1 Reglas Transversales + flujograma de validación (Demanda
Civil/Laboral).

### Reglas transversales implementadas (aplican a los 4 ciclos: `DEMANDA_CIVIL`,
`DEMANDA_LABORAL`, `DEMANDA_CIVIL_ACTORA`, `DEMANDA_LABORAL_ACTORA`)

1. **Causal de finalización** — campo obligatorio al finalizar, con lista condicionada al
   grupo de estado de origen. 4 grupos (`grupoCausal` en `EstadoProcesal`):
   - `PRE_SENTENCIA_1` (Inicio/Traba de Litis/Prueba/Alegato): Caducidad de instancia,
     Desistimiento, Allanamiento, Transacción o acuerdo extrajudicial, Incompetencia con
     archivo, Otra.
   - `SENTENCIA_1`: Sin apelar (firme por consentimiento) / Apelada (desistimiento del
     recurso).
   - `INSTANCIA_RECURSIVA` (Apelación/Sentencia 2°/REF): Sentencia firme favorable,
     Sentencia firme desfavorable, Otra.
   - `EJECUCION_SENTENCIA`: Cumplimiento total, Incobrabilidad, Otra.
   - Catálogo: `CAUSALES_FINALIZACION` (por archivo `causalesFinalizacion.ts` o en
     `estadosProcesales.ts`, confirmar ubicación final), helper `getCausalesPorEstado`.
   - Campo `Expediente.causal_finalizacion?: string` — **bloqueado** en Datos Maestros, se
     autocompleta al elegir la causal en el modal de Finalizar. El expediente puede seguir
     teniendo tareas pendientes en estado Finalizado hasta cerrarse del todo.

2. **Recurso/Incidente transversal** — no cambia el estado del expediente. Se implementó como
   **actividad genérica nueva**: tipo `RECURSO_INCIDENTE` agregado al union `TipoActividad`,
   disponible como opción en el modal "Nueva Actividad" de cualquier estado.

3. ~~**Recurso de Queja no suspende** — flag paralelo con checklist propio~~ —
   **ELIMINADO COMPLETO** (ver sección 6). Decisión confirmada en reunión con área de negocio:
   se dio de baja el sistema entero (flag `queja_en_tramite`, checklist `TAREAS_RECURSO_QUEJA`,
   acción `toggleQuejaEnTramite`, bloque visual condicional). `REF.siguiente` sigue apuntando
   directo a `EJECUCION_SENTENCIA` como quedó descripto abajo, pero ya no hay trámite paralelo
   asociado a ese tramo.

4. **Retroceso a etapa anterior — motivo obligatorio** — antes el campo Motivo del modal
   "Cambiar estado" era siempre opcional. Ahora, cuando la opción seleccionada pertenece al
   optgroup "Retroceder", el campo pasa a obligatorio (asterisco rojo, botón Confirmar
   bloqueado sin texto). Carácter excepcional reforzado en el banner de aviso.

5. **Finalizado alcanzable desde cualquier estado** — se agrega SIEMPRE como opción al final
   del optgroup "Avanzar", para los 4 tipos de Demanda (constante
   `TIPOS_FINALIZACION_LIBRE` / `esTipoConFinalizacionLibre`), sin importar cuál sea el
   siguiente estado calculado. Al seleccionarlo, se abre un modal secundario pidiendo la
   causal (según `grupoCausal` del estado de origen) antes de confirmar el avance.
   - Generalizado con `getCodigoFinalizado(tipo)` / `CODIGO_FINALIZADO_POR_TIPO` porque
     Lanzamientos Judicializados usa `TERMINADO` en vez de `FINALIZADO` como código real
     (mismo label "Finalizado" al usuario) — ver sección 4.

### Fix — bifurcación real en Alegato y Apelación

**Problema detectado:** el flujograma oficial muestra que desde **Alegato** el letrado elige
entre Sentencia 1° Favorable o Desfavorable (no es automático), y lo mismo desde
**Apelación** con Sentencia 2°. El código inicial tenía `ALEGATO.siguiente = 'SENTENCIA_1_FAV'`
y `APELACION.siguiente = 'SENTENCIA_2_FAV'` — forzaba el camino favorable sin dar opción.

**Fix aplicado:** se generalizó el mecanismo `ESTADOS_DESDE_EN_ANALISIS` (antes hardcodeado
por `Record<TipoExpediente, string[]>`, solo para el estado `EN_ANALISIS` de los ciclos
A/B) a un mapa genérico **por código de estado origen**, válido para cualquier tipo:

```ts
RAMIFICACIONES_POR_CODIGO: Record<string, string[]> = {
  EN_ANALISIS: [...],       // casos especiales por tipo, ver getRamificaciones()
  ALEGATO: ['SENTENCIA_1_FAV', 'SENTENCIA_1_DESFAV'],
  APELACION: ['SENTENCIA_2_FAV', 'SENTENCIA_2_DESFAV'],
  CONSTATACION_JUDICIAL: [...],  // ver sección 4, Lanzamientos
}
```

Función `getRamificaciones(codigoEstado, tipoExpediente)` centraliza el cálculo, con casos
especiales para `EN_ANALISIS` (que sí depende del tipo: ciclo A tiene 3 salidas con Acuerdo
Extrajudicial, ciclo B —Consignación/Desafuero— tiene 2 sin Acuerdo Extrajudicial).

Labels actualizados a formato consistente: "Sentencia 1° Instancia — Favorable/Desfavorable",
"Sentencia 2° Instancia — Favorable/Desfavorable".

### Nuevos tipos de juicio y hecho — Laboral (segundo batch, 11/08)
- `mesa_juicio` (Tipo de Juicio) de `DEMANDA_LABORAL` — 4 nuevos: Indemnización por
  fallecimiento, Reinstalación laboral, Medida cautelar, Indemnización art. 212.
- `abg_tipo_hecho` de `DEMANDA_LABORAL` — 5 nuevos: Doble Indemnización, Inexistencia de
  vínculo laboral, Desafuero, Consignación laboral, Empleado Ferrobaires.

### Cómo verificar
- Expediente `DEMANDA_CIVIL` en `ALEGATO` → modal Cambiar Estado → Avanzar muestra 3
  opciones (Fav / Desfav / Finalizado).
- Mismo expediente en `APELACION` → Avanzar muestra Sentencia 2° Fav/Desfav + Finalizado.
- Seleccionar Finalizado desde cualquier estado → modal de causal con lista según
  `grupoCausal` del estado de origen → confirmar → `causal_finalizacion` visible y bloqueado
  en Datos.
- Intentar retroceder sin motivo → botón Confirmar bloqueado.
- Expediente en `REF` o `EJECUCION_SENTENCIA` → bloque "Recurso de Queja (trámite paralelo)"
  visible con checklist propio, no bloquea el avance normal.
- Regresión: `COBRO_CANON`/`RECLAMO_CONTRAT`/etc. en `EN_ANALISIS` siguen mostrando sus 3
  opciones de siempre (Acuerdo Extrajudicial/Juicio Iniciado/Devuelto); `CONSIGNACION`/
  `DESAFUERO` en `EN_ANALISIS` muestran solo 2 (sin Acuerdo Extrajudicial).

---

## 4. Lanzamientos Judicializados — reconstrucción completa (Operativo/Comercial)

**Origen:** documento MATRIZ SACO sección 2.2 (ciclo corregido, 6→11 estados) + 2.5 (split
Comercial/Operativo) + flujogramas 4.2 y 4.3.

### Campo nuevo: Tipo de lanzamiento
- `mesa_tipo_lanzamiento` (select: Operativo/Comercial) agregado a
  `formularios.ts → LANZAMIENTO_JUDICIALIZADO.mesa`, después de `mesa_juicio`.
- Se completa **una única vez**, en el momento de ejecutar **Iniciar Juicio** desde un
  expediente `LANZAMIENTO` (no después) — es el campo obligatorio del modal, bloquea el botón
  Confirmar si está vacío.
- Queda **bloqueado** en Datos Maestros una vez definido (`disabled`, fondo gris) —
  determina todo el circuito de estados, no se puede cambiar a mitad de camino.

### Ciclo reconstruido — 11 estados (antes: 6)
```
ASIGNADO → INICIO → CONSTATACION_JUDICIAL
                            │
              (bifurcación por vulnerabilidad,
               decisión del letrado al avanzar
               desde este estado — NO es un campo
               previo, es la elección del destino
               en el modal Cambiar Estado)
                            │
        ┌───────────────────┴───────────────────┐
   sin vulnerables                        con vulnerables
        │                                        │
SENTENCIA_LANZAMIENTO              TRASLADO_DEFENSOR_OFICIAL
        │                                        │
        │                                TRABA_LITIS
        │                                        │
        │                          SENTENCIA_LANZAMIENTO
        │
   APELACION_LANZ → SENTENCIA_CAMARA → REF_LANZ
        │
   SENTENCIA_FIRME → MANDAMIENTO_LIBRADO
        │
   LANZAMIENTO_EFECTIVIZADO → TERMINADO (esArchivado: true, label "Finalizado")
```

- Todos los estados usan `grupoCausal: 'LANZAMIENTO'`.
- Catálogo propio de causales: `CAUSALES_FINALIZACION_LANZAMIENTO` = Desistimiento, Acuerdo
  de entrega, Otro (aplica tanto a Operativo como a Comercial).
- `EstadoProcesal.grupoCausal` union type ampliado con `'LANZAMIENTO'`.

### Bifurcación por vulnerabilidad
- Agregada a `RAMIFICACIONES_POR_CODIGO.CONSTATACION_JUDICIAL` (reutiliza el mecanismo
  genérico de la sección 3, sin código nuevo):
  ```
  CONSTATACION_JUDICIAL: ['SENTENCIA_LANZAMIENTO', 'TRASLADO_DEFENSOR_OFICIAL']
  ```
- Labels: "Sentencia de Lanzamiento (sin vulnerables — directo)" /
  "Traslado a Defensor Oficial (con vulnerables)".
- Checklist de `CONSTATACION_JUDICIAL` incluye la tarea "Verificar presencia de personas
  vulnerables (menores/embarazadas/discapacidad)" — pero la decisión formal del camino a
  seguir se toma al cambiar de estado, no marcando esa tarea.

### Split Comercial — saltos condicionales
Para `mesa_tipo_lanzamiento === 'Comercial'`, el camino calculado en el modal salta:
`INICIO → SENTENCIA_LANZAMIENTO → MANDAMIENTO_LIBRADO → LANZAMIENTO_EFECTIVIZADO →
TERMINADO`. Implementado con `SALTOS_LANZAMIENTO_COMERCIAL` +
`getSiguienteLanzamiento(codigoActual, tipoLanzamiento)`, con prioridad:
`siguienteComercial > codigosRamificados > siguienteEstadoProcesal` (aplicada tanto en el
cálculo de opciones del modal como en el preselect de `openAccion('estado')`).

Los estados salteados (`CONSTATACION_JUDICIAL`, `TRASLADO_DEFENSOR_OFICIAL`, `TRABA_LITIS`,
`APELACION_LANZ`, `SENTENCIA_CAMARA`, `REF_LANZ`, `SENTENCIA_FIRME`) **no se eliminan del
catálogo** — siguen accesibles solo por excepción vía retroceso/avance manual con motivo
obligatorio (Regla transversal 4 de la sección 3).

### Fix — Iniciar Juicio crea expediente nuevo (antes solo parcheaba)
**Problema detectado:** `confirmarIniciarJuicio()` nunca creaba expediente nuevo para ningún
tipo de `MAPA_INICIAR_JUICIO` — parcheaba `campos_mesa` del mismo expediente. Esto era
inconsistente con "Nueva Querella" (sección 1), que sí crea un expediente derivado, y no
permitía mostrar al cliente un expediente `LANZAMIENTO_JUDICIALIZADO` real y navegable.

**Fix aplicado:** rama especial en `confirmarIniciarJuicio()` — **solo quando
`MAPA_INICIAR_JUICIO[exp.tipo] === 'LANZAMIENTO_JUDICIALIZADO'`**, crea expediente nuevo
(mismo patrón que `confirmarNuevaQuerella`: `agregarExpediente`, causa común calculada,
`es_principal: true` en el nuevo, `es_principal: false` en el origen, timeline inicial con
RECEPCION, movimiento impulsorio en el expediente origen, navegación automática). El resto de
los tipos de `MAPA_INICIAR_JUICIO` (`COBRO_CANON`, `RECLAMO_CONTRAT`, `RECUPERO`,
`EJECUCION_GAR`, `CONSIGNACION`, `DESAFUERO`) **no se tocaron** — siguen parcheando el mismo
expediente como antes.

**Fix de mapeo faltante (detectado en el mismo paso):** `formJuicio` ya tenía los campos
`ubicacion` y `linea` desde antes, pero `confirmarIniciarJuicio()` no los volcaba a
`campos_mesa.mesa_ubicacion` / `campos_mesa.mesa_linea`. Corregido.

### Mock de demo
`C-0043/2026` — expediente `LANZAMIENTO` en estado `JUICIO_INICIADO`, listo para probar el
flujo completo de Iniciar Juicio → selección Operativo/Comercial → creación del
`LANZAMIENTO_JUDICIALIZADO` derivado.

### Cómo verificar
- Desde `C-0043/2026` (o cualquier `LANZAMIENTO` en `JUICIO_INICIADO`) → botón `+` →
  "Iniciar Juicio" → modal exige "Tipo de lanzamiento *" → sin seleccionar, Confirmar
  bloqueado.
- Elegir "Operativo" → Confirmar → toast con el id del nuevo expediente → navega
  automáticamente → nuevo expediente tipo `LANZAMIENTO_JUDICIALIZADO`, estado `ASIGNADO`,
  `campos_mesa.mesa_tipo_lanzamiento: 'Operativo'`, `mesa_ubicacion`/`mesa_linea` presentes.
- Avanzar del nuevo expediente: `INICIO → CONSTATACION_JUDICIAL` → modal muestra las 3
  opciones (sin vulnerables / con vulnerables / Finalizado).
- Repetir el flujo eligiendo "Comercial" → desde `INICIO`, Avanzar muestra **solo**
  "Sentencia de Lanzamiento" (sin Constatación Judicial ni bifurcación); desde ahí, solo
  "Mandamiento Librado" (salta Apelación/Cámara/REF/Firme).
- Tab Datos del nuevo expediente → campo "Tipo de lanzamiento" aparece bloqueado (gris,
  disabled).
- Volver al `LANZAMIENTO` origen → `es_juicio_iniciado: true`, timeline con movimiento
  impulsorio "Juicio iniciado — Lanzamiento judicializado".

---

## 5. OFICIO Penal — 10 tipos de Solicitud con sub-formulario en modal

> **⚠️ SUPERADO por la sección 6** — esta implementación (campo `abg_tipo_solicitud` en Datos
> Maestros + `ModalSolicitudPenal.tsx`) fue migrada por completo al modal "Nueva Actividad" de
> `TimelinePenal.tsx`. El campo, el componente y el guardado en `abg_solicitudes_detalle`
> descriptos abajo **ya no existen** en el código — se dejan documentados como referencia
> histórica del diseño original. Ver sección 6 para la arquitectura vigente.

**Origen:** MATRIZ SACO sección 2.5 — reemplazo de las 6 opciones libres de `abg_tipo_solicitud`
por 10 tipos con campos propios cada uno.

### Implementado
- `abg_tipo_solicitud` (OFICIO → `variante_penal.abogado`) pasa de 6 opciones libres a las 10 de
  `TIPOS_SOLICITUD_PENAL` (`src/data/solicitudesPenales.ts`, archivo nuevo).
- Cada tipo tiene su propia config en `CONFIG_SOLICITUDES_PENALES[tipo]` — campos tipados
  (`text`/`textarea`/`date`/`time`/`money`/`select`), algunos con `permiteArchivo` (adjuntar vía
  `agregarDocumento`). "Solicitud de Averiguación de Paradero" es el único con
  `camposCondicionales` (el select "Tipo de Requerimiento" determina qué campos extra aparecen).
- Nuevo componente `ModalSolicitudPenal` (`src/components/expedientes/ModalSolicitudPenal.tsx`)
  renderiza esos campos y guarda en `campos_abogado.abg_solicitudes_detalle[tipo] = { campos,
  archivos }` vía `actualizarCampoAbogado` — guardado inmediato al click en "Guardar" del modal,
  independiente del draft/modo-edición de `DatosTab`.
- `DatosTab.tsx`: debajo de la fila `abg_tipo_solicitud` se lista cada tipo elegido con botón
  "Ver" + badge "· Sin completar" hasta que tenga datos. Elegir un tipo nuevo en el multiselect
  (sin entrada previa en `abg_solicitudes_detalle`) abre el modal automáticamente.
- Fix de paso, no relacionado a Solicitudes pero descubierto en el camino: el botón "Agregar
  otro" del multiselect apilable **no hacía nada** — `commit()` filtraba strings vacíos de forma
  incondicional, así que el slot vacío recién agregado se autodescartaba antes de llegar al
  draft. Afectaba a todos los `multiselect` del sistema (`abg_tipo_hecho` también). Corregido en
  `DatosTab.tsx` (el botón ahora escribe directo con `setDraft`, sin pasar por `commit`).
- `valorDisplay` (modo lectura de `multiselect`) dejó de mostrar chips/pills azules — ahora es
  texto plano (`.join(', ')`), consistente con el resto de campos de solo lectura.

### Tipos/store agregados
- `campos_abogado.abg_solicitudes_detalle?: Record<string, { campos: Record<string,string>,
  archivos: Record<string,string[]> }>` — no tiene interfaz propia en `types/index.ts` (vive
  dentro del `Record<string, unknown>` genérico de `campos_abogado`).
- Sin acciones nuevas en el store — reutiliza `actualizarCampoAbogado` y `agregarDocumento`.

### Cómo verificar
Expediente `P-0100/2026` (OFICIO, área PENAL) → tab Datos → campo "Tipo de solicitud" muestra
los 10 tipos nuevos → trae "Citaciones a Testimonial" completo (sin badge) y "Solicitud de
Averiguación de Paradero..." sin completar (badge "· Sin completar") → botón "Ver" abre el modal
con los datos correspondientes. En modo edición, elegir un tipo nuevo en el multiselect abre el
modal solo; "Agregar otro" suma un slot vacío correctamente.

---

## 6. Migración Solicitudes Penal a TimelinePenal + baja Recurso de Queja + paridad Comentar/Editar/Eliminar

### Migración de las 10 Solicitudes Penal (de Datos Maestros a Nueva Actividad)
- Eliminado el campo `abg_tipo_solicitud` de `OFICIO.variante_penal.abogado`
  (`formularios.ts`) y todo su bloque en `DatosTab.tsx` (render del multiselect condicional,
  estado `modalSolTipo`, componente `SolicitudesPenalesDetalle`).
- Eliminado `src/components/expedientes/ModalSolicitudPenal.tsx` — el sub-formulario se integró
  inline en el modal "Nueva Actividad" de `TimelinePenal.tsx`.
- 10 nuevos valores en el union `TipoActividad` (`types/index.ts`): `SOLICITUD_INFORMACION`,
  `SOLICITUD_FILMACIONES_ESTATICAS`, `SOLICITUD_FILMACIONES_DINAMICAS`,
  `NOTIFICACION_CONCILIACION`, `NOTIFICACION_REPARACION_INTEGRAL`, `NOTIFICACION_PROBATION`,
  `SOLICITUD_INTERVENCION`, `CITACION_TESTIMONIAL`, `CITACION_INDAGATORIA`,
  `SOLICITUD_AVERIGUACION_PARADERO`. Aparecen como opciones sueltas en el select de Tipo del
  modal "Nueva Actividad" de `TimelinePenal.tsx`, mezcladas con el resto (sin optgroup
  separador).
- `Actividad` (`types/index.ts`) gana `solicitud_penal_campos?: Record<string,string>` y
  `solicitud_penal_archivos?: Record<string,string[]>`.
- `solicitudesPenales.ts`: `CONFIG_SOLICITUDES_PENALES` (keyed por label) se mantiene igual;
  se agrega `TIPO_ACTIVIDAD_SOLICITUD_PENAL: Record<string,string>` (código → label) y
  `getConfigPorTipoActividad(tipoActividad)`.
- Repetible: no hay restricción de unicidad — se puede crear el mismo tipo de solicitud varias
  veces como actividades distintas.
- Editable: botón "Editar" (ver más abajo, ampliado a toda actividad genérica) recarga
  `formAct` + `camposSolPenal`/`archivosSolPenal` y usa `editarActividad` del store en vez de
  `agregarActividad`. Se amplió el `Pick` de la firma de `editarActividad` en el store para
  incluir `solicitud_penal_campos` y `solicitud_penal_archivos`.
- Completar después: badge "Sin completar" en el feed cuando
  `!solicitudEstaCompleta(tipo, campos)` — helper en `solicitudesPenales.ts` que compara contra
  el total de campos de la config (fijos + condicionales aplicables según el campo disparador),
  tratando todos como obligatorios (no hay flag `obligatorio?` por campo todavía).

### Baja completa de Recurso de Queja
Decisión confirmada en reunión con área de negocio: se eliminó el sistema entero (no solo el
nodo lineal, ya dado de baja en la sección 3 original).
- `types/index.ts`: quitado `Expediente.queja_en_tramite?: boolean`.
- `estadosProcesales.ts`: quitado el array `TAREAS_RECURSO_QUEJA` y los comentarios que lo
  referenciaban.
- `expedientes.store.ts`: quitada la acción `toggleQuejaEnTramite` (firma + implementación) y
  el import de `TAREAS_RECURSO_QUEJA`.
- `TimelineTab.tsx`: quitado el componente `RecursoQuejaBlock` completo y su renderizado
  condicional (`estadoProcesal === 'REF' || 'EJECUCION_SENTENCIA'`).
- No confundir con `etapasPenales.ts` nodo `INS_5_14 "Recurso de Queja"` (sub-actividad lineal
  del ciclo Instrucción Penal) — es un concepto distinto, no tocado por esta baja.

### Paridad Comentar/Editar/Eliminar en TimelinePenal
`TimelinePenal.tsx` solo tenía "Editar" (y solo para las 10 solicitudes). Se portó el mismo
patrón que `TimelineTab.tsx`:
- "Comentar" (reutiliza `agregarReply` del store) + menú ⋮ con "Editar"/"Eliminar" (reutiliza
  `editarActividad`/`eliminarActividad`), visibles para `esLetrado && !act.es_solicitud`,
  excluyendo `RECEPCION` y movimientos de sistema (mismo criterio que Civil/Laboral).
- `abrirEdicionSolicitud` generalizada a `abrirEdicionActividad`: aplica a cualquier actividad
  genérica; solo carga `camposSolPenal`/`archivosSolPenal` si `getConfigPorTipoActividad`
  devuelve algo para ese tipo.
- Componente `ReplyList` duplicado localmente en `TimelinePenal.tsx` (no importado desde
  `TimelineTab.tsx` para evitar import circular, ya que `TimelineTab` importa `TimelinePenal`).
- `historialCompleto` ahora filtra `act.eliminado` (soft-delete) antes de armar las entradas.

### ⚠️ Bandera demo temporal — `esLetrado`
En **ambos** archivos (`TimelineTab.tsx` y `TimelinePenal.tsx`), `esLetrado` quedó hardcodeado
en `true` para destrabar pruebas con cualquier usuario. Comentario en el código marca la regla
real a restaurar después de la demo:
```
const esLetrado =
  usuarioActivo?.id === exp.abogado_id ||
  usuarioActivo?.rolSistema === 'COORDINADOR'
```
Regla de negocio (sesión HU Timeline Civil/Laboral): "Abogado, Asistente y Coordinador pueden
editar tareas y agregar actividades" — no incluye Referente. Asistente Jurídico hoy cae bajo
`rolSistema: 'ABOGADO'` (ver `types_CLAUDE.md`); confirmar si necesita distinguirse aparte.
**Recordatorio: revertir antes de producción.**

### Cómo verificar
Con cualquier usuario activo (demo flag), en un Oficio Penal:
- Tab Timeline → "+ Nueva Actividad" → select Tipo trae los 10 tipos de solicitud sueltos en el
  listado, sin encabezado.
- Elegir "Citaciones a Testimonial" → sub-formulario inline aparece debajo → completar 2 de 8
  campos → Guardar → badge "Sin completar" visible en el feed.
- Editar esa actividad (menú ⋮ o botón "Editar") → completar los 6 restantes → Guardar → badge
  desaparece.
- Botones "Comentar" y menú ⋮ (Editar/Eliminar) visibles en cualquier actividad genérica, no
  solo las de solicitud. Eliminar una → desaparece del feed (soft-delete, log de auditoría).
- Tab Datos de un Oficio Penal: el campo "Tipo de solicitud" ya no existe.
- Cualquier Demanda Civil/Laboral en `REF`/`EJECUCION_SENTENCIA`: ya no aparece el bloque
  "Recurso de Queja".

---

## Pendientes / temas abiertos (heredados del documento fuente)

| Tema | Estado |
|---|---|
| Honorarios | Sin ciclo de vida definido — no abordado en el prototipo todavía. |
| Querellas / Defensas Penales (ciclo de vida propio, más allá del flujo "Nueva Querella") | En pausa — mezclaba etapa procesal con resultado. Pendiente de definición de negocio. |
| Mediación Penal | Campos en borrador, preguntas pendientes de enviar al abogado de Penal. |
| Tipo de hecho — Defensas Penales / Querellas | Sin lista propia definida; propuesta de negocio: reciclar la lista de Carta Suceso. |
| Módulo de Previsión de Sentencias | Cuando se incorpore, va a requerir ajustar el ingreso a `EJECUCION_SENTENCIA` (nota ya presente en el checklist de ese estado). |
| Actividad "Diligenciamiento" | **Implementado** — agregado a `TipoActividad` (`types/index.ts`) y al select de Tipo en `TimelineTab.tsx` (Civil/Laboral), junto a "Interposición de Recurso". `TimelinePenal.tsx` no lo tiene porque tampoco tiene `RECURSO_INCIDENTE` (lista `TIPOS` propia, más corta) — evaluar si negocio lo quiere también ahí. |
| `Actividad.solicitud_id` | Campo agregado al tipo pero no completado en todos los puntos donde se crea una solicitud — pendiente de trazabilidad completa. |
| `esLetrado` hardcodeado en `true` | **Bandera demo temporal** en `TimelineTab.tsx` y `TimelinePenal.tsx` (ver sección 6) — revertir a la regla real (`abogado_id` match o `rolSistema === 'COORDINADOR'`) antes de producción. |
| `CampoSolicitudPenal.obligatorio?` | No existe todavía — `solicitudEstaCompleta` (sección 6) trata todos los campos de cada tipo de Solicitud Penal como obligatorios por igual. |
