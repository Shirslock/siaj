# Deltas 3 — Etapa 2 · Estado de implementación en el prototipo

> Contexto para próximas sesiones. Fuente: `docs/SIAJ_Deltas _Mejoras_Etapa2 (1).docx`
> (documento "Deltas 3", 14 deltas) + `docs/SIAJ_Estados_Tareas_v2.xlsx` (catálogo de tareas).
> Rama: `feat/deltas3-etapa2-pendientes` (desde `develop`, 2026-11-03).
> Pendiente: reeditar el .docx para que quede más prolijo; después se suman mejoras nuevas.

## Resumen

Al 2026-11-03 los 14 deltas del documento están implementados en el prototipo.
Antes de esta rama ya estaban completos 6, 11 y 12, y parcialmente 2B y 4A/4C. El resto se
implementó en esta rama.

| # | Delta | Estado | Dónde |
|---|---|---|---|
| 1 | Tipo de Intervención obligatorio + "Actuación de Oficio" (Penal) | ✅ esta rama | `catalogos.ts` (`TIPOS_INTERVENCION_PENAL`, TI_005), `tablas.config.ts`, `formularios.ts` (`required`), `useAltaForm.ts` (validate), `AltaExpediente.page.tsx` |
| 2 | Edición de Datos: intervención obligatoria / sin "Tipo de Solicitud" / Tipo de lanzamiento bloqueado | ✅ | `DatosTab.tsx` (`save()` bloquea sin intervención). 2B y 2C ya estaban; se limpió el mock P-0100 que seguía con `abg_tipo_solicitud` |
| 3 | DESARCHIVADO en C/L y Penal + causal obligatoria | ✅ esta rama (C/L) | Penal ya existía. C/L: `estadosProcesales.ts` (`ESTADO_DESARCHIVADO`), `DetalleExpediente.page.tsx`, `TimelineTab.tsx` |
| 4 | Timeline C/L: editar/eliminar, desarchivado, 2 actividades, sin Queja | ✅ | Desarchivado C/L en esta rama; el resto ya estaba |
| 5 | Lanzamiento Judicializado: 11 estados + bifurcación por vulnerabilidad | ✅ esta rama | Se eliminó `TRASLADO_DEFENSOR_OFICIAL` |
| 6 | Timeline Penal: reply/editar/eliminar, 10 solicitudes, badge | ✅ | Faltaba 6B: Diligenciamiento e Interposición de Recurso en `TimelinePenal.tsx` (agregado en esta rama) |
| 7 | Iniciar Querella bloqueado sin intervención | ✅ esta rama | `DetalleExpediente.page.tsx` (`querellaBloqueada`) |
| 8 | Tareas y estados C/L | ✅ esta rama | `estadosProcesales.ts`, generado desde el Excel |
| 9 | Catálogos nuevos (tipo de juicio / tipo de hecho) | ✅ esta rama | `catalogos.ts`, `configuracion.store.ts`, `formularios.ts` (`catalogo`) |
| 10 | Agrupador de causa del Oficio Penal | ✅ esta rama | `utils/numeroCausa.ts`, `expedientes.store.ts` (`renombrarAgrupador`), `DatosTab.tsx` |
| 11 | Configuración: matrículas Tomo/Folio + switch activo | ✅ (previo) | commit `ebe0648` |
| 12 | Montos múltiples | ✅ (previo) | `feat/montos-multiples` — ver `docs/DELTA_Montos_Multiples.md` |
| 13 | Finalización del antecedente en "Iniciar Juicio" | ✅ esta rama | `DetalleExpediente.page.tsx`, `estadosProcesales.ts`, `alertas.ts`, `homeShared.tsx`, `BandejaAbogado.page.tsx` |
| 14 | Eliminar "Pedido de Causa Penal" | ✅ esta rama | `catalogos.ts` (`activo: false`), `useAltaForm.ts`, mock C-0524 eliminado |

---

## Detalle por delta (lo que hay que saber para tocarlo de nuevo)

### Delta 1 / 2A — Tipo de Intervención
- **Cambia la regla de negocio** "único campo obligatorio al alta = N° EE/Memo GDE". Ahora son
  dos: **N° EE/Memo GDE + Tipo de Intervención**.
- En el Alta, `validate()` agrega el error `mesa_tipo_intervencion`, muestra un toast y un texto
  rojo bajo "Datos de Recepción".
- En la edición de Datos, `save()` no guarda si el campo está vacío (toast) y el label muestra `*`.
- Penal: Denunciante · **Actuación de Oficio** · Sin Intervención (`TI_005`). Civil/Laboral no cambia.
- No se tocó Principal → "Por rol": "Actuación de Oficio" no tiene barra propia.

### Delta 3 / 4B — DESARCHIVADO en Civil/Laboral
- **Sub-estado transitorio común**, fuera de los ciclos: `ESTADO_DESARCHIVADO` en
  `estadosProcesales.ts`. `getEstadoProcesal(tipo, 'DESARCHIVADO')` lo devuelve para cualquier tipo.
- Se entra desde cualquier estado terminal: `esArchivado` del ciclo (FINALIZADO, TERMINADO,
  DEVUELTO_SECTOR_REQUIRENTE) o, en tipos sin ciclo, `ARCHIVADO/ARCHIVADA/CERRADO/CUMPLIDO/COMPLETADA/FINALIZADO`.
- El modal Cambiar estado tiene una rama propia (`esTerminalCL` / `enDesarchivadoCL`):
  - En un terminal, la opción es "Desarchivar actuación". Los tipos sin ciclo conservan además su lista de estados.
  - En DESARCHIVADO, la única opción es "Volver a archivo (<estado previo>)".
- El estado terminal se guarda en `Expediente.estado_previo_desarchivo` y se limpia al volver.
- Se admite **una** actividad genérica: el botón "Nueva Actividad" se deshabilita cuando ya hay
  actividades en el período actual del feed. Mismo criterio que Penal.
- Hay un banner ámbar en el timeline. El stepper sigue marcando el estado terminal previo.
- Los dos movimientos quedan como movimiento de sistema: "Cambio de estado: X → Desarchivado" y
  "Cambio de estado: Desarchivado → X".

### Delta 5 — Lanzamiento Judicializado (11 estados)
- INICIO → CONSTATACIÓN JUDICIAL → [TRABA DE LITIS] → SENTENCIA DE LANZAMIENTO → APELACIÓN →
  SENTENCIA DE CÁMARA → REF → SENTENCIA FIRME → MANDAMIENTO LIBRADO → LANZAMIENTO EFECTIVIZADO → TERMINADO.
- **Se eliminó `TRASLADO_DEFENSOR_OFICIAL`**, el estado extra que no estaba en el documento. El
  traslado a Defensor Oficial pasó a ser una **tarea** de Constatación Judicial (así lo trae el Excel).
- Bifurcación (`RAMIFICACIONES_POR_CODIGO.CONSTATACION_JUDICIAL = ['SENTENCIA_LANZAMIENTO', 'TRABA_LITIS']`):
  en el select se ven "Sin personas vulnerables → Sentencia de Lanzamiento" y "Con personas
  vulnerables → Traba de Litis" (`LABEL_RAMA`).
- El label del estado ahora es solo "Sentencia de Lanzamiento" (antes decía "(sin vulnerables — directo)").
- El circuito Comercial (`SALTOS_LANZAMIENTO_COMERCIAL`) no se tocó. **El documento no lo menciona**:
  conviene confirmar con negocio si sigue vigente.

### Delta 7 — Iniciar Querella
- Si `mesa_tipo_intervencion` está vacío o es "Sin Intervención", la opción del menú `+` aparece
  deshabilitada con una leyenda, y `confirmarNuevaQuerella()` también lo bloquea.
- El mock P-0101 (Carta SAE) ahora tiene `mesa_tipo_intervencion: 'Denunciante'` para que la demo siga funcionando.

### Delta 8 — Tareas y estados C/L (desde el Excel)
- **Fuente única: `docs/SIAJ_Estados_Tareas_v2.xlsx`.** Los ciclos se **regeneraron completos**,
  no se aplicaron cambios incrementales: los 4 de Demanda (hojas 1–4) y Lanzamiento Judicializado (hoja 6).
  Lanzamientos (hoja 5) se cargó a mano.
- Script de regeneración: lo usé desde el scratchpad de la sesión, no está en el repo. Lógica:
  1. Volcar el xlsx: hojas → filas `Estado | Tarea`.
  2. Mapear cada nombre de estado al código: `PRUEBA` → `EN_PRUEBA` en las demandadas y `PRUEBA` en
     las actoras; `APELACIÓN` → `APELACION_LANZ` en LJ; etc.
  3. **Descartar los títulos de sección** numerados en mayúsculas ("4. ETAPA PROBATORIA",
     "6. SENTENCIA 1° INSTANCIA- FAVORABLE"…): 9 en la hoja 1 y 6 en la hoja 2.
  4. Limpieza mínima: se quita la numeración heredada ("4.1 ", "4..4 ") y el guion colgante final.
  Si el Excel cambia, se puede rehacer el script con estas reglas.
- Cantidad de tareas: Demanda Civil demandada 101 · Laboral demandada 99 · Civil actora 136 ·
  Laboral actora 131 · Lanzamiento Judicializado 46.
- **Flujo de las Demandas corregido según el documento:** SENTENCIA_1_FAV y SENTENCIA_1_DESFAV → APELACION;
  SENTENCIA_2_FAV y SENTENCIA_2_DESFAV → REF; REF → EJECUCION_SENTENCIA. Antes las ramas favorables
  saltaban directo a EJECUCION_SENTENCIA.
- **ASIGNADO → EN ANÁLISIS (7 tipos A/B):** las tareas de análisis pasaron de ASIGNADO a EN_ANALISIS.
  ASIGNADO queda sin tareas, como en el resto de los ciclos.
- **Devuelto al Sector Requirente:** 4 tareas en los 7 tipos. Hay un único `DEVUELTO_SECTOR`;
  se eliminaron `DEVUELTO_SECTOR_A/B`.
- Lanzamientos (ciclo A) tiene su propio Acuerdo Extrajudicial (8 tareas, según el Excel). Los otros
  tipos A siguen con el compartido de 13 tareas.
- **Para revisar con negocio** (se cargaron tal cual vienen en el Excel):
  - Filas que parecen sub-títulos y no tareas: "Ofrecimiento de prueba:", "Prueba informativa",
    "Prueba pericial", "SI se deniega:", "Otra prueba".
  - El Excel no cubre Cobro de Cánones, Reclamo a Contratistas, Recuperos, Ejecución de Pólizas,
    Consignaciones ni Desafueros. Esos tipos conservan sus tareas; solo cambiaron el paso de
    ASIGNADO a EN ANÁLISIS y las 4 tareas de Devuelto.

### Delta 9 — Catálogos
- Tipo de Juicio (Configuración): +4 valores (JUI_011–014). El select del formulario de Demanda
  Laboral ya los tenía.
- Tipo de Hecho Demanda Civil y Demanda Laboral (Configuración): +5 valores cada uno
  (`TIPOS_HECHO_DEMANDA_DELTA9`).
- **Nuevo mecanismo:** `CampoFormulario.catalogo` (clave de `configuracion.store`). Si el campo lo
  tiene, las opciones del select salen del catálogo (solo activos, y se conserva el valor ya cargado)
  vía `opcionesDeCampo()` en `FormularioDinamico.tsx`, usado también en DatosTab.
  Hoy solo lo usa `abg_tipo_hecho` de DEMANDA_CIVIL y DEMANDA_LABORAL.
  - Por eso Demanda Civil pasó de texto libre a select.
  - Demanda Laboral ahora muestra los 10 valores del catálogo, porque los 5 viejos (Despido, etc.)
    estaban en Configuración aunque el form solo ofrecía los 5 nuevos.

### Delta 10 — Agrupador de causa del Oficio Penal
- Regla `calcularAgrupadorOficioPenal()`: N° de Causa > N° de IPP > N° de Sumario.
  El resultado es el valor de `numero_causa`.
- En DatosTab, al guardar, el agrupador solo se recalcula si **cambió alguno de los 3 campos**.
  Así un agrupamiento manual ("Agrupar a causa") no se pisa al editar otros datos.
- Si cambia y había agrupador previo, `renombrarAgrupador(anterior, nuevo)` re-agrupa **todas** las
  actuaciones que tenían el valor anterior. Funciona en los dos sentidos: si se vacía la Causa,
  vuelve a IPP/Sumario.
- IPP y Sumario son mutuamente excluyentes en la edición: con uno cargado, el otro queda deshabilitado.
- Demo: P-0100 tiene solo IPP. Al cargar "N° de Causa" en Datos, el agrupador pasa de IPP a la causa.
- El Alta del prototipo no persiste la actuación (`submit()` solo navega), así que la regla se ve en la edición.

### Delta 13 — "Iniciar Juicio" crea siempre una actuación derivada
- **Cambia la regla anterior** "parchea el expediente actual salvo LANZAMIENTO". Ahora los 7 tipos
  crean una actuación nueva:
  - COBRO_CANON, RECLAMO_CONTRAT, RECUPERO, EJECUCION_GAR → `DEMANDA_CIVIL_ACTORA`
  - CONSIGNACION, DESAFUERO → `DEMANDA_LABORAL_ACTORA`
  - LANZAMIENTO → `LANZAMIENTO_JUDICIALIZADO`
- Id de la derivada: `C|L-DA######` para las demandas, `C-LJ######` para el lanzamiento.
- La derivada:
  - Arranca en ASIGNADO con el set completo de `campos_mesa` del modal.
  - Lleva `antecedente_id`, `es_juicio_iniciado` y `fecha_inicio_juicio = hoy`; el timer de impulsorio corre acá.
  - Tiene un vínculo `ANTECEDENTE` hacia el origen y usa `es_principal = tieneCausaReal`.
  - Al confirmar se navega a ella.
- El antecedente:
  - Queda con `es_juicio_iniciado`, `es_principal: false`, la causa común e `id_juicio_derivado`.
  - Tiene un vínculo `JUDICIALIZADO` y una actividad que deja registro.
  - `getAlertaTimer` ignora a cualquier actuación con `id_juicio_derivado`.
  - Ya no ofrece de nuevo "Iniciar Juicio".
- En el header se agregaron los botones "Ver juicio X →" (en el antecedente) y "Antecedente X →" (en la derivada).
- **Tipos nuevos en el catálogo:** `DEMANDA_CIVIL_ACTORA` y `DEMANDA_LABORAL_ACTORA` (TPG_024/025,
  `soloDesdeJuicio: true`). Antes no existían en `TIPOS_GESTION` ni en `TipoGestion`.
  Usan el formulario de la demanda de su fuero (`ALIAS_FORMULARIO` en `formularios.ts`).
- **El Alta filtra `soloDesdeJuicio`**: ni Lanzamiento Judicializado ni las demandas de parte actora
  se pueden dar de alta a mano. Antes LJ aparecía en el alta.
- **Estado final del antecedente:** `FINALIZADO_ANTECEDENTE` (esArchivado, sin tareas), agregado a
  los 7 ciclos A/B (`TIPOS_ANTECEDENTE`). Solo se llega en cascada.
- **Cascada** (`confirmarCausal`): al finalizar la derivada, el antecedente pasa a FINALIZADO con el
  movimiento "Cambio de estado: X → Finalizado" y la descripción "Finalizado en cascada… Causal: …".
  - Guarda `causal_finalizacion`.
  - Si el antecedente ya estaba archivado (Devuelto o Finalizado), no se lo toca.
- **Advertencia blanda "Tareas pendientes"** (modal Volver / Continuar igual, nunca bloquea):
  - Al finalizar la derivada, si el antecedente tiene tareas sin resolver en su estado actual.
  - Al llevar un tipo antecedente a un estado archivado: desde EN_ANALISIS o desde JUICIO_INICIADO
    (nueva rama `JUICIO_INICIADO → DEVUELTO_SECTOR_REQUIRENTE`). En ese caso no aplica el bloqueo duro por tareas.
- **Clasificación Activos/Archivados:** `ESTADOS_CERRADO` (Bandeja y Principal) ahora incluye
  FINALIZADO, TERMINADO y DEVUELTO_SECTOR_REQUIRENTE. Antes una demanda finalizada contaba como activa.

### Delta 14 — "Pedido de Causa Penal"
- `TIPOS_GESTION` → `activo: false`. No se ofrece en el alta (el filtro es `t.activo !== false`) y en
  Configuración → Tipos de Gestión aparece con el badge "Inactivo".
- Se mantienen el tipo, el formulario y las etiquetas para el histórico.
- Se eliminó el mock C-0524/2026 (decisión de Cristian).
- Antes había una sugerencia de pasarlo al módulo de solicitudes; quedó superada por esta baja.

---

## Verificación realizada (2026-11-03)
- `npx tsc --noEmit -p tsconfig.app.json` y `npm run build` sin errores. El repo no tiene config de ESLint.
- Probado en el navegador (vite dev):
  - C-0043 → Iniciar Juicio (Operativo): crea C-LJ######.
  - Bifurcación en Constatación con los labels nuevos.
  - Finalizar la derivada: aparece el modal "Tareas pendientes" del antecedente y, con Continuar igual,
    el antecedente queda FINALIZADO con la actividad de cascada.
  - Desarchivar el antecedente: una actividad; después el botón queda deshabilitado; Volver a archivo → FINALIZADO.
  - P-0100: el timeline muestra las 2 solicitudes ("Sin completar" en 1). Con N° de Causa cargado,
    el agrupador pasa de IPP a 45201/2026 y Sumario queda bloqueado.
  - Alta: no aparecen Pedido de Causa Penal ni los derivados; Penal ofrece "Actuación de Oficio".

## Cambios posteriores a los deltas (misma rama)
- **2026-11-03 — Acuerdo Extrajudicial → Finalizado.** Antes, Acuerdo Extrajudicial no tenía salida: solo se
  podía retroceder. Cristian definió que pasa a Finalizado. `siguiente: 'FINALIZADO'` en el acuerdo compartido
  y en el de Lanzamientos (los 5 tipos del ciclo A).
  - Si quedan tareas sin resolver, aplica la advertencia blanda de "Tareas pendientes", porque Finalizado es
    un estado archivado de un tipo antecedente.
  - "Reactivar gestión" sigue siendo un retroceso a En Análisis, con motivo obligatorio.

- **2026-11-03 — Mediaciones y SECLO con ciclo propio y bifurcación.** Los estados salen de
  `docs/Estados_PRD.xlsx`, que lista los estados de producción por tipo con su clasificación ACTIVO/ARCHIVADO.
  - Antes no tenían ciclo: se elegía libremente un estado de `ESTADOS_POR_TIPO`.
  - Ciclo nuevo: `ASIGNADO → EN_ANALISIS → [SOLICITUD_INFORMACION] → CUMPLIDO_ACUERDO | CUMPLIDO_SIN_ACUERDO`.
    Los dos últimos son finales (esArchivado), cuentan como archivados y se pueden desarchivar.
  - Bifurcación en `getRamificaciones` (`TIPOS_CICLO_ACUERDO`):
    - Desde En Análisis: Solicitud de Información, Cumplido (acuerdo) o Cumplido (no acuerdo).
    - Desde Solicitud de Información: solo el resultado.
  - Sin tareas, porque el Excel de tareas no las define.
  - Mocks para probar: C-0526/2026 (Mediación en En Análisis) y L-0527/2026 (SECLO en Solicitud de Información).
  - **Supuestos a confirmar:**
    - El estado "Archivado" que figura en PRD para estos tipos no se incluyó.
    - "Solicitud de información" se tomó como opcional.
    - El campo "Resultado" del formulario de Mediación (Pendiente/Acuerdo/Fracasó…) quedó redundante con el estado.
- **2026-11-03 — Defensa Civil con ciclo propio y bifurcación.** Estados de `Estados_PRD.xlsx` + decisión
  de Cristian para lo que PRD dejaba abierto. Antes no tenía ciclo: lista libre de `ESTADOS_POR_TIPO`.
  - Ciclo nuevo:
    `ASIGNADO → EN_ANALISIS → ASUME_REPRESENTACION → FINALIZADO | NO_ASUME_REPRESENTACION`
    (No asume representación es final).
  - Bifurcación desde En Análisis en `getRamificaciones`.
  - "Asume representación" pasa a Finalizado. PRD tenía la duda "¿dispara vinculación a juicio?";
    Cristian definió que no, que es un estado simple.
  - Sin tareas.
  - Mock para probar: C-0528/2026 (En Análisis).
- **`Estados_PRD.xlsx` como referencia:** está en `docs/` y es la fuente para las bifurcaciones que faltan.
  Ojo: refleja producción *antes* de los Deltas 3 (todavía tiene Recurso de Queja y el Lanzamiento
  Judicializado viejo de 6 estados), así que no pisa lo definido en los deltas.

## Cambios del 2026-11-05 (misma rama, sin commit)
- **Notificación de campana a Mesa SACO al "Iniciar Juicio".** `confirmarIniciarJuicio()` crea una notificación
  `INICIO_JUICIO` para **cada usuario con `rolBD === 'adm_mesa'`** (5 en `usuarios.ts`). Apunta a la derivada.
  `Topbar.tsx` la muestra con badge violeta "Juicio iniciado". También se corrigió el id de
  `agregarNotificacion` (`NTF_<ts>_<rand>`): al notificar a varios en el mismo ms salían keys duplicadas.
- **Adjuntos múltiples** (sin tocar el Alta). `utils/validarAdjuntos.ts` + `components/ui/AdjuntosInput.tsx`.
  Aplica en: Nueva actividad (C/L), panel de Tarea, solapa Documentos, y campos con archivo de las Solicitudes
  Penales. `Actividad.adjuntos` / `Tarea.adjuntos` (`AdjuntoRef {nombre,size}`); `adjunto_nombre` queda como legado y
  `adjuntosDeActividad()` unifica ambos al mostrar.
  - **Bloqueo de video**: suelto (extensión o MIME `video/*`) y dentro de `.zip`, incluso anidados (3 niveles).
    Se lee el directorio central del ZIP a mano y los anidados se descomprimen con `DecompressionStream`. Un zip
    ilegible, con contraseña o ZIP64 **se rechaza** (no se puede verificar). Solo se mira la extensión de las
    entradas: no se inspeccionan los bytes (un video renombrado a .pdf pasaría).
  - También múltiples: los campos `upload` de los **hitos penales** (`CampoUpload` en `TimelinePenal.tsx`; antes era
    un recuadro decorativo sin input; el valor guardado es la lista de nombres separada por `\n`) y la respuesta de
    solicitudes en `/tareas` (`RespuestaSolicitud.adjuntos`; cada adjunto va también a Documentos del expediente).
  - Quedan con un solo archivo, a propósito: el Alta y el adjunto del chat de Boga (lee el texto de un documento).
- **Vencimiento de actividad genérica.** Menú de la actividad: "Marcar vencimiento cumplido" → reutiliza
  `estado: 'COMPLETADA'` (el mismo que usa Agenda); `alertas.ts` ignora las COMPLETADAS. En Editar: botón
  "Quitar vencimiento" (borra vencimiento y aviso). La tarjeta ahora muestra el chip "Vence / Vence hoy / Venció /
  Vencimiento cumplido" (antes el vencimiento de una actividad no se veía en la tarjeta). El log de auditoría guarda
  `null` cuando se quita un campo (`JSON.stringify` descartaba los `undefined`).
  - Solo aplica a C/L: las genéricas Penal no tienen campo de vencimiento.
  - Ojo, bug previo no tocado: Agenda llama `editarActividad(..., Number(ev.actividad_id), ...)` y `actividad_id` es
    el id string de la actividad, no el índice → "Marcar cumplido" desde Agenda probablemente no hace nada.
- **Exportar bandejas a Excel.** La del Letrado ya existía (`exportarBandejaExcel`). **Mesa SACO no la tenía en
  ninguna rama**: se agregó `exportarMesaSacoExcel` + botón en `MesaSaco.page.tsx` (lista plana filtrada, 9 columnas).
  Documentado como **Delta 18** (Parte A) en el docx.
- **Documentación en el docx** (`docs/Deltas3_Etapa2/SIAJ_Deltas3_Etapa2.docx`): Delta 18 exportar bandejas (Parte A),
  **19** campana a Mesa SACO (Parte B), **20** adjuntos múltiples + video y **21** vencimiento (Parte C). Cada uno con
  placeholders "CAPTURA PENDIENTE" (21 en total en el documento). Se agregaron también al índice y a los textos de
  portada ("7 deltas nuevos, 15 a 21"). Sin Word para renderizarlo: validado por XML y mammoth.

## Documentos reeditados — `docs/Deltas3_Etapa2/` (2026-11-03)
- **`SIAJ_Deltas3_Etapa2.docx`** — reedición del documento de Deltas 3, con el mismo formato y estilo.
  - Organizado en 4 partes:
    - A: Alta y datos — deltas 1, 2, 10, 12, 14.
    - B: Ciclos de estados — 3, 5, 8, 13, 15, 16, 17.
    - C: Línea de tiempo — 4, 6, 7.
    - D: Catálogos — 9, 11.
    - Anexos.
  - Se mantiene la numeración original y se suman los **Deltas 15** (Acuerdo Extrajudicial → Finalizado),
    **16** (Mediaciones/SECLO) y **17** (Defensa Civil).
  - Cada delta tiene: recuadro de HU y estado de implementación, el detalle, y las capturas existentes o
    placeholders "📷 CAPTURA PENDIENTE" (14 en total) para lo que todavía no tiene captura.
  - Cómo se construyó: no hay Word ni LibreOffice en la máquina. Se tomó el paquete del .docx original, se
    reutilizaron sus bloques XML (banners, tablas, capturas, objetos Excel embebidos) y se generaron los bloques
    nuevos con los mismos estilos (Arial; colores 1a7a8a / 2c5f6e / 1b3a5c / d6eaf8 / fff9c4).
  - Verificado: XML bien formado, referencias consistentes y apertura con mammoth. **No se renderizó en Word.**
- **`SIAJ_Deltas3_Estados_y_Tareas.xlsx`** — para desarrollo, generado desde `estadosProcesales.ts`.
  Hojas: Índice · Cambios · Estados · Bifurcaciones · Tareas · Catálogos.
  - Si cambian los ciclos, hay que regenerarlo. El exportador y el armado con exceljs quedaron en el
    scratchpad de la sesión, no en el repo.

## Para confirmar con negocio
1. Circuito Comercial del Lanzamiento Judicializado (saltos directos): no figura en los deltas.
2. Filas del Excel que parecen sub-títulos (ver Delta 8).
3. Tareas de los 6 tipos A/B que el Excel no cubre.
4. Si "Actuación de Oficio" debe tener barra propia en Principal → "Por rol".
