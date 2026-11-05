import type { EstadoProcesal, UrgenciaTarea, Tarea } from '../types'

// ── Helper para crear tareas con campos por defecto (uso temprano) ──
function tt(id: string, nombre: string): Tarea {
  return { id, nombre, estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null }
}

// ── DEMANDA CIVIL — Parte Demandada (Delta 8) ─────────────
// Tareas: SIAJ_Estados_Tareas_v2.xlsx (hoja "Demanda Civil Parte Demandad").
// Estructura MATRIZ SACO: ASIGNADO → INICIO → TRABA_LITIS → EN_PRUEBA → ALEGATO
// → SENTENCIA_1_(FAV|DESFAV) → APELACION → SENTENCIA_2_(FAV|DESFAV) → REF
// → EJECUCION_SENTENCIA → FINALIZADO. Ambas ramas de cada sentencia convergen
// (1° instancia → APELACION, 2° instancia → REF).
export const ESTADOS_DEMANDA_CIVIL: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'INICIO', tareas: [] },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'TRABA_LITIS',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DC_INI_01', 'Análisis inicial de la demanda y notificación. Registrar operador a la fecha del hecho.'),
      tt('DC_INI_02', 'Verificar el proveído de traslado de demanda (Firmado Juez)'),
      tt('DC_INI_03', 'Interposición de revocatoria con apelación en subsidio. Verificación de cumplimiento ley 24.344 (SI corresponde)'),
      tt('DC_INI_04', 'Interposición nulidad de la notificación (SI corresponde)'),
      tt('DC_INI_05', 'Interposición de caducidad (SI corresponde)'),
      tt('DC_INI_06', 'Definición de plazo para contestar demanda'),
      tt('DC_INI_07', 'Generación de tarea: contestación de demanda (AGENDAR)'),
      tt('DC_INI_08', 'Redacción de defensa de fondo - BUSCAR ANTECEDENTES- VINCULACIONES CON OTROS EXPEDIENTES - ejecutivo - poner en conocimiento administración'),
      tt('DC_INI_09', 'Planteo de excepciones (SI corresponde)'),
      tt('DC_INI_10', 'Oposiciones'),
      tt('DC_INI_11', 'Planteo de prorrateo'),
      tt('DC_INI_12', 'Requerir citación de terceros - SI/no - Registrar'),
      tt('DC_INI_13', 'Ofrecimiento de prueba:'),
      tt('DC_INI_14', 'Documental'),
      tt('DC_INI_15', 'Testimonial - Propuestos por SOFSA - SI/NO'),
      tt('DC_INI_16', 'Pericial (médica, mecánica, contable, etc.)'),
      tt('DC_INI_17', 'Informativa (oficios)'),
      tt('DC_INI_18', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'EN_PRUEBA',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DC_TL_01', 'Control de traslados ordenados'),
      tt('DC_TL_02', 'Citación de terceros proveído por el juez'),
      tt('DC_TL_03', 'Competencia - Apelar resolución SI / NO'),
      tt('DC_TL_04', 'Competencia apelada - MEMORIAL'),
      tt('DC_TL_05', 'Seguimiento de resoluciones del juzgado'),
      tt('DC_TL_06', 'Citada en garantía presentada SI /No'),
      tt('DC_TL_07', 'SE FIJA FECHA PARA AUDIENCIA 360 - SE CIERRA ETAPA - CONTROLAR QUE TODO ESTE RESUELTO - OPONERSE SI CORRESPONDE'),
    ],
  },
  {
    codigo: 'EN_PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATO',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DC_PR_01', 'Prueba informativa'),
      tt('DC_PR_02', 'Redacción de oficios'),
      tt('DC_PR_03', 'Seguimiento de libramiento - Control de respuestas'),
      tt('DC_PR_04', 'Reiteración de oficios no contestados o contestados en forma incorrecta'),
      tt('DC_PR_05', 'Prueba pericial'),
      tt('DC_PR_06', 'Control de designación de perito'),
      tt('DC_PR_07', 'Aceptación de cargo'),
      tt('DC_PR_08', 'Fecha de pericicias - Pasar fecha a los consultores'),
      tt('DC_PR_09', 'Control de presentación de pericia - Impugnar SI/No'),
      tt('DC_PR_10', 'Impugnación de pericia'),
      tt('DC_PR_11', 'Traslado de la impugnación'),
      tt('DC_PR_12', 'Prueba testimonial'),
      tt('DC_PR_13', 'Control de audiencias - Fechas'),
      tt('DC_PR_14', 'Notificar a Recursos Humanos (SI SON NUESTROS)'),
      tt('DC_PR_15', 'Notificación de testigos'),
      tt('DC_PR_16', 'Preparación de interrogatorio'),
      tt('DC_PR_17', 'Prueba confesional - Cédula de citación a la parte actora?'),
      tt('DC_PR_18', 'Otra prueba'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DC_AL_01', 'Proveído de AUTOS PARA ALEGAR'),
      tt('DC_AL_02', 'Análisis de prueba producida'),
      tt('DC_AL_03', 'Redacción de alegato - impugnación de daños'),
      tt('DC_AL_04', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1° Instancia — Favorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      tt('DC_S1F_01', 'Control de dictado de sentencia'),
      tt('DC_S1F_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      tt('DC_S1F_03', 'Evaluación de montos - SE DEBERIA REGISTRAR - hay diferentes montos (ver como discriminar para informe)'),
      tt('DC_S1F_04', 'Control de efectos y plazos de los recursos de la contraria'),
      tt('DC_S1F_05', 'Evaluación de reclamos de peritos por costas'),
      tt('DC_S1F_06', 'Contestación de la expresión de agravios'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1° Instancia — Desfavorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      tt('DC_S1D_01', 'Control de dictado de sentencia'),
      tt('DC_S1D_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      tt('DC_S1D_03', 'Evaluación de responsabilidad'),
      tt('DC_S1D_04', 'Evaluación de montos - SE DEBERIA REGISTRAR'),
      tt('DC_S1D_05', 'Apelación de sentencia'),
      tt('DC_S1D_06', 'Control de concesión del recurso'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DC_AP_01', 'Notifiación de la Cámara para Expresar Agravios'),
      tt('DC_AP_02', 'Redacción de recurso'),
      tt('DC_AP_03', 'Registro de apelantes'),
      tt('DC_AP_04', 'Contestación de agravios (SI corresponde)'),
      tt('DC_AP_05', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA LA SENTENCIA DE PRIMERA INSTANCIA'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2° Instancia — Favorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DC_S2F_01', 'Control de dictado de sentencia'),
      tt('DC_S2F_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      tt('DC_S2F_03', 'Evaluación de montos - SE DEBERIA REGISTRAR'),
      tt('DC_S2F_04', 'SE PREVISIONA - PERITOS - ESPERAR INITMACIÓN'),
      tt('DC_S2F_05', 'Control de honorarios'),
      tt('DC_S2F_06', 'SUBIR AL SISTEMA LA SENTENCIA DE SEGUNDA INSTANCIA'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2° Instancia — Desfavorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DC_S2D_01', 'Control de dictado de sentencia'),
      tt('DC_S2D_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      tt('DC_S2D_03', 'Evaluación de responsabilidad'),
      tt('DC_S2D_04', 'Evaluación de montos - SE DEBERIA REGISTRAR'),
      tt('DC_S2D_05', 'Definir estrategia: Recurso Extraordinario Federal o derivación al módulo de previsiones'),
      tt('DC_S2D_06', 'SUBIR AL SISTEMA LA SENTENCIA DE SEGUNDA INSTANCIA'),
      tt('DC_S2D_07', 'Control de regulación de honorarios de la contraria - Apelar'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DC_REF_01', 'Análisis de procedencia'),
      tt('DC_REF_02', 'Redacción del recurso extraordinario'),
      tt('DC_REF_03', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
      tt('DC_REF_04', 'Control formal del recurso'),
      tt('DC_REF_05', 'Seguimiento de concesión o denegación'),
      tt('DC_REF_06', 'SI se deniega:'),
      tt('DC_REF_07', 'Registro y discriminación de montos para informes y previsiones presupuestarias'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    grupoCausal: 'EJECUCION_SENTENCIA',
    tareas: [
      tt('DC_ES_01', 'Liquidación'),
      tt('DC_ES_02', 'Presentación de liquidación'),
      tt('DC_ES_03', 'Control de traslado de liquidación'),
      tt('DC_ES_04', 'Contestación de impugnación SI corresponde'),
      tt('DC_ES_05', 'Pedido de aprobación de liquidación'),
      tt('DC_ES_06', 'Intimación de pago'),
      tt('DC_ES_07', 'Pedido de embargo SI corresponde'),
      tt('DC_ES_08', 'Seguimiento de embargo'),
      tt('DC_ES_09', 'Control de transferencia / depósito judicial'),
      tt('DC_ES_10', 'Pedido de libramiento de fondos'),
      tt('DC_ES_11', 'Registro de cobro efectivo'),
    ],
  },
  {
    codigo: 'FINALIZADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    tareas: [
      tt('DC_FIN_01', 'Verificar cumplimiento total'),
      tt('DC_FIN_02', 'Verificar cobro / imposibilidad de cobro'),
      tt('DC_FIN_03', 'Registrar resultado final'),
      tt('DC_FIN_04', 'Archivo judicial SI corresponde'),
      tt('DC_FIN_05', 'Archivo interno'),
      tt('DC_FIN_06', 'Registrar causal de finalización'),
    ],
  },
]

// ── DEMANDA LABORAL — Parte Demandada (Delta 8) ───────────
// Tareas: SIAJ_Estados_Tareas_v2.xlsx (hoja "Demanda Laboral Parte Demand").
// Misma estructura MATRIZ SACO que ESTADOS_DEMANDA_CIVIL.
export const ESTADOS_DEMANDA_LABORAL: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'INICIO', tareas: [] },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'TRABA_LITIS',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DL_INI_01', 'Análisis Inicial de la demanda y notificación.'),
      tt('DL_INI_02', 'Interposición de revocatoria con apelación en subsidio. Verificación de cumplimiento ley 24.344 (SI corresponde)'),
      tt('DL_INI_03', 'Informe previo artículo N°4 para medida cautelar'),
      tt('DL_INI_04', 'Seguimiento de medida cautelar - Apelar SI/NO - CONTESTAR AGRAVIOS'),
      tt('DL_INI_05', 'Interposición nulidad de la notificación (SI corresponde)'),
      tt('DL_INI_06', 'Interposición de caducidad (SI corresponde)'),
      tt('DL_INI_07', 'Definición de plazo para contestar demanda'),
      tt('DL_INI_08', 'Generación de tarea: contestación de demanda (AGENDAR)'),
      tt('DL_INI_09', 'Redacción de defensa de fondo - SOLICITAR INFORMACIÓN A RRHH - OTRAS AREAS/BUSCAR ANTECEDENTES- VINCULACIONES CON OTROS EXPEDIENTES'),
      tt('DL_INI_10', 'Planteo de excepciones (SI corresponde)'),
      tt('DL_INI_11', 'Oposiciones'),
      tt('DL_INI_12', 'Planteo de prorrateo'),
      tt('DL_INI_13', 'Requerir citación de terceros - SI/no - Registrar'),
      tt('DL_INI_14', 'Ofrecimiento de prueba:'),
      tt('DL_INI_15', 'Documental'),
      tt('DL_INI_16', 'Confesional'),
      tt('DL_INI_17', 'Testimonial - Propuestos por SOFSA - SI/NO'),
      tt('DL_INI_18', 'Pericial (caligrafica, médica, ingeniera, contable, etc.)'),
      tt('DL_INI_19', 'Informativa (oficios)'),
      tt('DL_INI_20', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'EN_PRUEBA',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DL_TL_01', 'Control de traslados ordenados'),
      tt('DL_TL_02', 'Citación de terceros proveído por el juez'),
      tt('DL_TL_03', 'Competencia - Apelar resolución y expresar agravios SI / NO'),
      tt('DL_TL_04', 'Seguimiento de resoluciones del juzgado'),
      tt('DL_TL_05', 'Citada en garantía presentada SI /No'),
      tt('DL_TL_06', 'SE FIJA FECHA PARA ART. 80 LO/ AUDIENCIA 360 - SE CIERRA ETAPA - CONTROLAR QUE TODO ESTE RESUELTO - OPONERSE SI CORRESPONDE'),
    ],
  },
  {
    codigo: 'EN_PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATO',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DL_PR_01', 'Redacción de oficios'),
      tt('DL_PR_02', 'Seguimiento de libramiento - Control de respuestas'),
      tt('DL_PR_03', 'Reiteración de oficios no contestados o contestados en forma incorrecta'),
      tt('DL_PR_04', 'Control de designación de perito'),
      tt('DL_PR_05', 'Aceptación de cargo'),
      tt('DL_PR_06', 'Fecha de pericicias - Pasar fecha a los consultores'),
      tt('DL_PR_07', 'Control de presentación de pericia - Impugnar SI/No'),
      tt('DL_PR_08', 'Impugnación de pericia'),
      tt('DL_PR_09', 'Contestar aclaraciones de peritos'),
      tt('DL_PR_10', 'Traslado de la impugnación'),
      tt('DL_PR_11', 'Control de audiencias - Fechas'),
      tt('DL_PR_12', 'Notificar a Recursos Humanos (SI SON NUESTROS)'),
      tt('DL_PR_13', 'Notificación de testigos'),
      tt('DL_PR_14', 'Preparación de interrogatorio'),
      tt('DL_PR_15', 'Prueba confesional'),
      tt('DL_PR_16', 'Otra prueba'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DL_AL_01', 'Proveído de AUTOS PARA ALEGAR'),
      tt('DL_AL_02', 'Análisis de prueba producida'),
      tt('DL_AL_03', 'Redacción de alegato - impugnación de daños'),
      tt('DL_AL_04', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1° Instancia — Favorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      tt('DL_S1F_01', 'Control de dictado de sentencia'),
      tt('DL_S1F_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      tt('DL_S1F_03', 'Evaluación de montos'),
      tt('DL_S1F_04', 'Control de efectos y plazos de los recursos de la contraria'),
      tt('DL_S1F_05', 'Evaluación de reclamos de peritos por costas'),
      tt('DL_S1F_06', 'Contestación de la expresión de agravios'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1° Instancia — Desfavorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      tt('DL_S1D_01', 'Control de dictado de sentencia'),
      tt('DL_S1D_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      tt('DL_S1D_03', 'Evaluación de responsabilidad'),
      tt('DL_S1D_04', 'Evaluación de montos - Hay diferentes montos - Seria necesario discriminarlos'),
      tt('DL_S1D_05', 'Apelación de sentencia y EXPRESIÓN DE AGRAVIOS'),
      tt('DL_S1D_06', 'Control de concesión del recurso'),
      tt('DL_S1D_07', 'Contestación de la expresión de agravios'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DL_AP_01', 'Registro de apelantes'),
      tt('DL_AP_02', 'Contestación de agravios (SI corresponde)'),
      tt('DL_AP_03', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA LA SENTENCIA DE PRIMERA INSTANCIA'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2° Instancia — Favorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DL_S2F_01', 'Control de dictado de sentencia'),
      tt('DL_S2F_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      tt('DL_S2F_03', 'Evaluación de montos - SE DEBERIA REGISTRAR'),
      tt('DL_S2F_04', 'SE PREVISIONA - PERITOS - ESPERAR INITMACIÓN'),
      tt('DL_S2F_05', 'Control de honorarios'),
      tt('DL_S2F_06', 'SUBIR AL SISTEMA LA SENTENCIA DE SEGUNDA INSTANCIA'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2° Instancia — Desfavorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DL_S2D_01', 'Control de dictado de sentencia'),
      tt('DL_S2D_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      tt('DL_S2D_03', 'Evaluación de responsabilidad'),
      tt('DL_S2D_04', 'Evaluación de montos - SE DEBERIA REGISTRAR'),
      tt('DL_S2D_05', 'Definir estrategia: Recurso Extraordinario Federal o derivación al módulo de previsiones'),
      tt('DL_S2D_06', 'SUBIR AL SISTEMA LA SENTENCIA DE SEGUNDA INSTANCIA'),
      tt('DL_S2D_07', 'Control de regulación de honorarios de la contraria - Apelar'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DL_REF_01', 'Análisis de procedencia'),
      tt('DL_REF_02', 'Redacción del recurso extraordinario'),
      tt('DL_REF_03', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
      tt('DL_REF_04', 'Control formal del recurso'),
      tt('DL_REF_05', 'Seguimiento de concesión o denegación'),
      tt('DL_REF_06', 'SI se deniega'),
      tt('DL_REF_07', 'Registro y discriminación de montos para informes y previsiones presupuestarias'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    grupoCausal: 'EJECUCION_SENTENCIA',
    tareas: [
      tt('DL_ES_01', 'Liquidación'),
      tt('DL_ES_02', 'Presentación de liquidación'),
      tt('DL_ES_03', 'Control de traslado de liquidación'),
      tt('DL_ES_04', 'Contestación de impugnación SI corresponde'),
      tt('DL_ES_05', 'Pedido de aprobación de liquidación'),
      tt('DL_ES_06', 'Intimación de pago'),
      tt('DL_ES_07', 'Pedido de embargo SI corresponde'),
      tt('DL_ES_08', 'Seguimiento de embargo'),
      tt('DL_ES_09', 'Control de transferencia / depósito judicial'),
      tt('DL_ES_10', 'Pedido de libramiento de fondos'),
      tt('DL_ES_11', 'Registro de cobro efectivo'),
    ],
  },
  {
    codigo: 'FINALIZADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    tareas: [
      tt('DL_FIN_01', 'Verificar cumplimiento total'),
      tt('DL_FIN_02', 'Verificar cobro / imposibilidad de cobro'),
      tt('DL_FIN_03', 'Registrar resultado final'),
      tt('DL_FIN_04', 'Archivo judicial SI corresponde'),
      tt('DL_FIN_05', 'Archivo interno'),
      tt('DL_FIN_06', 'Registrar causal de finalización'),
    ],
  },
]

// ── Estados genéricos para tipos sin definición específica ──
export const ESTADOS_GENERICOS: EstadoProcesal[] = [
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'EN_TRAMITE',
    tareas: [
      { id: 'GEN_01', nombre: 'Análisis del expediente',            estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'GEN_02', nombre: 'Preparar respuesta o acción',        estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'EN_TRAMITE',
    label: 'En Trámite',
    siguiente: 'CERRADO',
    tareas: [
      { id: 'GEN_03', nombre: 'Seguimiento procesal',               estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'CERRADO',
    label: 'Cerrado',
    siguiente: undefined,
    tareas: [
      { id: 'GEN_04', nombre: 'Cierre y archivo',                   estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
]

// ── Helper para crear tareas con campos por defecto ──────
function t(id: string, nombre: string): import('../types').Tarea {
  return { id, nombre, estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null }
}

// ── Estados compartidos entre ciclos A y B ───────────────
// Delta 8 (ASIGNADO → EN ANÁLISIS): las tareas de análisis que antes colgaban de
// ASIGNADO pasan a EN_ANALISIS. ASIGNADO queda sin tareas en los 7 tipos (igual
// que en el resto de los ciclos), y el avance desde EN_ANALISIS queda sujeto a
// completarlas como en cualquier otro estado.

const ACUERDO_EXTRAJUDICIAL_TAREAS: EstadoProcesal = {
  codigo: 'ACUERDO_EXTRAJUDICIAL',
  label: 'Acuerdo Extrajudicial',
  // Decisión de negocio (2026-11-03): el acuerdo extrajudicial termina en Finalizado.
  siguiente: 'FINALIZADO',
  tareas: [
    t('AEJ_01', 'Verificar monto actualizado de deuda'),
    t('AEJ_02', 'Analizar viabilidad del acuerdo'),
    t('AEJ_03', 'Solicitar conformidades internas (si corresponden)'),
    t('AEJ_04', 'Redacción de borrador de acuerdo'),
    t('AEJ_05', 'Solicitar cuenta bancaria y notificar a Administración'),
    t('AEJ_06', 'Revisión interna del acuerdo'),
    t('AEJ_07', 'Remisión para firma'),
    t('AEJ_08', 'Registrar acuerdo firmado'),
    t('AEJ_09', 'Registrar monto del acuerdo'),
    t('AEJ_10', 'Controlar cumplimiento del acuerdo'),
    t('AEJ_11', 'Informar a Administración el pago del acuerdo'),
    t('AEJ_12', 'Registrar incumplimiento (si ocurre)'),
    t('AEJ_13', 'Definir nueva estrategia: continuar / iniciar juicio / reactivar gestión'),
  ],
}

// Delta 8B — DEVUELTO AL SECTOR REQUIRENTE pasa de 1 tarea agrupada a 4 tareas
// separadas, en los 7 tipos con ciclo A/B (antes solo el ciclo B las tenía).
const DEVUELTO_SECTOR: EstadoProcesal = {
  codigo: 'DEVUELTO_SECTOR_REQUIRENTE',
  label: 'Devuelto al Sector Requirente',
  siguiente: undefined,
  esArchivado: true,
  tareas: [
    t('DSR_01', 'Registrar motivo de devolución'),
    t('DSR_02', 'Registrar fecha de devolución'),
    t('DSR_03', 'Registrar documentación o información requerida'),
    t('DSR_04', 'Registrar observaciones (si corresponde)'),
  ],
}

// Estado final de los ciclos A/B. Se llega por dos caminos:
//  · Delta 13 — en cascada, al finalizar la actuación derivada de "Iniciar
//    Juicio" (ver confirmarCausal en DetalleExpediente.page.tsx).
//  · Avanzando desde ACUERDO_EXTRAJUDICIAL (decisión de negocio 2026-11-03;
//    solo ciclo A, el ciclo B no tiene acuerdo). Sin tareas.
const FINALIZADO_ANTECEDENTE: EstadoProcesal = {
  codigo: 'FINALIZADO',
  label: 'Finalizado',
  siguiente: undefined,
  esArchivado: true,
  tareas: [],
}

/** Tipos con ciclo A/B que pueden ser antecedente de una actuación derivada
 * por "Iniciar Juicio" (Delta 13). */
export const TIPOS_ANTECEDENTE = new Set([
  'COBRO_CANON', 'RECLAMO_CONTRAT', 'RECUPERO', 'EJECUCION_GAR',
  'LANZAMIENTO', 'CONSIGNACION', 'DESAFUERO',
])

// ── CICLO A: Cobro de Cánones ─────────────────────────────
export const ESTADOS_COBRO_CANON: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'EN_ANALISIS', tareas: [] },
  {
    codigo: 'EN_ANALISIS',
    label: 'En Análisis',
    siguiente: undefined,
    tareas: [
      t('CC_01', 'Recepción del reclamo interno / Fecha de prescripción'),
      t('CC_02', 'Análisis de antecedentes contractuales'),
      t('CC_03', 'Verificar períodos adeudados'),
      t('CC_04', 'Verificar períodos prescriptos'),
      t('CC_05', 'Solicitar a Administración certificado de deuda actualizado'),
      t('CC_06', 'Verificar documentación respaldatoria'),
      t('CC_07', 'Solicitar antecedentes internos si faltan'),
      t('CC_08', 'Analizar viabilidad de cobro'),
      t('CC_09', 'Definir estrategia: Acuerdo extrajudicial / Devuelto al sector / Inicio de juicio'),
    ],
  },
  ACUERDO_EXTRAJUDICIAL_TAREAS,
  {
    codigo: 'JUICIO_INICIADO',
    label: 'Juicio Iniciado',
    siguiente: undefined,
    tareas: [
      t('CC_JI_01', 'Registrar tipo de acción judicial y observaciones'),
      t('CC_JI_02', 'Cambio de estado a: Demanda Civil — Parte Actora'),
    ],
  },
  DEVUELTO_SECTOR,
  FINALIZADO_ANTECEDENTE,
]

// ── CICLO A: Reclamo a Contratistas ──────────────────────
export const ESTADOS_RECLAMO_CONTRAT: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'EN_ANALISIS', tareas: [] },
  {
    codigo: 'EN_ANALISIS',
    label: 'En Análisis',
    siguiente: undefined,
    tareas: [
      t('RC_01', 'Recepción del reclamo interno / Fecha de prescripción'),
      t('RC_02', 'Análisis de antecedentes contractuales'),
      t('RC_03', 'Verificar contrato / orden de compra / adjudicación'),
      t('RC_04', 'Verificar incumplimiento denunciado'),
      t('RC_05', 'Verificar actas, informes o antecedentes técnicos'),
      t('RC_06', 'Solicitar antecedentes internos si faltan'),
      t('RC_07', 'Verificar garantías vigentes (si corresponde)'),
      t('RC_08', 'Analizar posibilidad de recupero / reclamo'),
      t('RC_09', 'Definir estrategia: Acuerdo extrajudicial / Devuelto al sector / Inicio de juicio'),
    ],
  },
  ACUERDO_EXTRAJUDICIAL_TAREAS,
  {
    codigo: 'JUICIO_INICIADO',
    label: 'Juicio Iniciado',
    siguiente: undefined,
    tareas: [
      t('RC_JI_01', 'Registrar tipo de acción judicial y observaciones'),
      t('RC_JI_02', 'Cambio de estado a: Demanda Civil — Parte Actora'),
    ],
  },
  DEVUELTO_SECTOR,
  FINALIZADO_ANTECEDENTE,
]

// ── CICLO A: Recuperos ────────────────────────────────────
export const ESTADOS_RECUPERO: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'EN_ANALISIS', tareas: [] },
  {
    codigo: 'EN_ANALISIS',
    label: 'En Análisis',
    siguiente: undefined,
    tareas: [
      t('REC_01', 'Recepción del reclamo interno / Fecha de prescripción'),
      t('REC_02', 'Análisis de antecedentes del siniestro'),
      t('REC_03', 'Identificar responsable/s involucrado/s'),
      t('REC_04', 'Verificar intervención de compañía aseguradora'),
      t('REC_05', 'Verificar actas, informes técnicos y antecedentes internos'),
      t('REC_06', 'Verificar presupuesto o valuación del daño'),
      t('REC_07', 'Solicitar antecedentes internos faltantes'),
      t('REC_08', 'Evaluar posibilidad de recupero'),
      t('REC_09', 'Definir estrategia: Acuerdo extrajudicial / Devuelto al sector / Juicio iniciado'),
    ],
  },
  ACUERDO_EXTRAJUDICIAL_TAREAS,
  {
    codigo: 'JUICIO_INICIADO',
    label: 'Juicio Iniciado',
    siguiente: undefined,
    tareas: [
      t('REC_JI_01', 'Registrar tipo de acción judicial y observaciones'),
      t('REC_JI_02', 'Cambio de estado a: Demanda Civil — Parte Actora'),
    ],
  },
  DEVUELTO_SECTOR,
  FINALIZADO_ANTECEDENTE,
]

// ── CICLO A: Ejecución de Garantías ──────────────────────
export const ESTADOS_EJECUCION_GAR: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'EN_ANALISIS', tareas: [] },
  {
    codigo: 'EN_ANALISIS',
    label: 'En Análisis',
    siguiente: undefined,
    tareas: [
      t('EG_01', 'Recepción del reclamo interno / Fecha de prescripción'),
      t('EG_02', 'Verificar documentación respaldatoria'),
      t('EG_03', 'Verificar la valuación del daño'),
      t('EG_04', 'Intimación a la contratista'),
      t('EG_05', 'Denuncia a la compañía de seguro'),
      t('EG_06', 'Verificar intervención de compañía aseguradora'),
      t('EG_07', 'Definir estrategia: Acuerdo extrajudicial / Devuelto al sector / Inicio de juicio'),
    ],
  },
  ACUERDO_EXTRAJUDICIAL_TAREAS,
  {
    codigo: 'JUICIO_INICIADO',
    label: 'Juicio Iniciado',
    siguiente: undefined,
    tareas: [
      t('EG_JI_01', 'Registrar tipo de acción judicial y observaciones'),
      t('EG_JI_02', 'Cambio de estado a: Demanda Civil — Parte Actora'),
    ],
  },
  DEVUELTO_SECTOR,
  FINALIZADO_ANTECEDENTE,
]

// ── CICLO A: Lanzamientos ─────────────────────────────────
// Tareas: SIAJ_Estados_Tareas_v2.xlsx (hoja "Lanzamientos") — Acuerdo
// Extrajudicial propio (8 tareas), no el compartido de los otros tipos A.
export const ESTADOS_LANZAMIENTO: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'EN_ANALISIS', tareas: [] },
  {
    codigo: 'EN_ANALISIS',
    label: 'En Análisis',
    siguiente: undefined,
    tareas: [
      t('LAN_01', 'Análisis de antecedentes del inmueble — jurisdicción'),
      t('LAN_02', 'Verificar fecha de notificación e intimación'),
      t('LAN_03', 'Identificar intrusos / permisionarios'),
      t('LAN_04', 'Verificar documentación respaldatoria'),
      t('LAN_05', 'Solicitar antecedentes internos faltantes'),
      t('LAN_06', 'Evaluar posibilidad de lanzamiento'),
      t('LAN_07', 'Definir estrategia: Acuerdo extrajudicial / Devuelto al sector requirente / Inicio de juicio'),
    ],
  },
  {
    codigo: 'ACUERDO_EXTRAJUDICIAL',
    label: 'Acuerdo Extrajudicial',
    siguiente: 'FINALIZADO',   // mismo criterio que el acuerdo compartido
    tareas: [
      t('LAN_AEJ_01', 'Analizar viabilidad del acuerdo'),
      t('LAN_AEJ_02', 'Redacción de borrador de acuerdo'),
      t('LAN_AEJ_03', 'Revisión interna del acuerdo'),
      t('LAN_AEJ_04', 'Remisión para firma'),
      t('LAN_AEJ_05', 'Registrar acuerdo firmado'),
      t('LAN_AEJ_06', 'Controlar cumplimiento del acuerdo'),
      t('LAN_AEJ_07', 'Registrar incumplimiento (si ocurre)'),
      t('LAN_AEJ_08', 'Definir nueva estrategia: continuar cumplimiento / iniciar juicio / reactivar gestión'),
    ],
  },
  {
    codigo: 'JUICIO_INICIADO',
    label: 'Juicio Iniciado',
    siguiente: undefined,
    tareas: [
      t('LAN_JI_01', 'Registrar tipo de acción judicial'),
      t('LAN_JI_02', 'Registrar observaciones (si corresponde)'),
      t('LAN_JI_03', 'Cambio de estado a: Lanzamiento Judicializado'),
    ],
  },
  DEVUELTO_SECTOR,
  FINALIZADO_ANTECEDENTE,
]

// ── CICLO B: Consignaciones ───────────────────────────────
export const ESTADOS_CONSIGNACION: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'EN_ANALISIS', tareas: [] },
  {
    codigo: 'EN_ANALISIS',
    label: 'En Análisis',
    siguiente: undefined,
    tareas: [
      t('CON_01', 'Pedido de antecedentes a RRHH'),
      t('CON_02', 'Control de monto y concepto'),
      t('CON_03', 'Evaluación de estrategia judicial'),
      t('CON_04', 'Definir estrategia: Devuelto al sector / Juicio iniciado'),
    ],
  },
  {
    codigo: 'JUICIO_INICIADO',
    label: 'Juicio Iniciado',
    siguiente: undefined,
    tareas: [
      t('CON_JI_01', 'Registrar tipo de acción judicial'),
      t('CON_JI_02', 'Registrar observaciones (si corresponde)'),
      t('CON_JI_03', 'Cambio de estado a: Demanda Laboral — Parte Actora'),
    ],
  },
  DEVUELTO_SECTOR,
  FINALIZADO_ANTECEDENTE,
]

// ── CICLO B: Desafueros ───────────────────────────────────
export const ESTADOS_DESAFUERO: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'EN_ANALISIS', tareas: [] },
  {
    codigo: 'EN_ANALISIS',
    label: 'En Análisis',
    siguiente: undefined,
    tareas: [
      t('DES_01', 'Pedido de antecedentes internos'),
      t('DES_02', 'Control de documentación respaldatoria'),
      t('DES_03', 'Evaluación de estrategia judicial'),
      t('DES_04', 'Evaluación de riesgo institucional'),
      t('DES_05', 'Definir estrategia: Devuelto al sector / Juicio iniciado'),
    ],
  },
  {
    codigo: 'JUICIO_INICIADO',
    label: 'Juicio Iniciado',
    siguiente: undefined,
    tareas: [
      t('DES_JI_01', 'Registrar tipo de acción judicial'),
      t('DES_JI_02', 'Registrar observaciones (si corresponde)'),
      t('DES_JI_03', 'Cambio de estado a: Demanda Laboral — Parte Actora'),
    ],
  },
  DEVUELTO_SECTOR,
  FINALIZADO_ANTECEDENTE,
]


// ── CICLO: Demanda Civil — Parte Actora (Delta 8) ────────
// Tareas: SIAJ_Estados_Tareas_v2.xlsx (hoja "Demanda Civil Parte Actora").
// Usa el código PRUEBA (no EN_PRUEBA) para el nodo de prueba.
export const ESTADOS_DEMANDA_CIVIL_ACTORA: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'INICIO', tareas: [] },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'TRABA_LITIS',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DCA_INI_01', 'Reunir documental respaldatoria'),
      t('DCA_INI_02', 'Identificar demandados, aseguradora y domicilios, SI corresponde'),
      t('DCA_INI_03', 'Controlar domicilios'),
      t('DCA_INI_04', 'Determinar monto reclamado'),
      t('DCA_INI_05', 'Definir competencia'),
      t('DCA_INI_06', 'INTERRUPCIÓN DE LA PRESCRIPCIÓN ?'),
      t('DCA_INI_07', 'Redacción de demanda o ampliación?'),
      t('DCA_INI_08', 'Ofrecimiento de prueba:'),
      t('DCA_INI_09', 'Documental'),
      t('DCA_INI_10', 'Testimonial'),
      t('DCA_INI_11', 'Pericial'),
      t('DCA_INI_12', 'Videofilmación'),
      t('DCA_INI_13', 'Informativa / oficios'),
      t('DCA_INI_14', 'Revisión final'),
      t('DCA_INI_15', 'Presentación en SISTEMA judicial SORTEO DE CAUSA - N° CAUSA JUDICIAL'),
      t('DCA_INI_16', 'SUBIR AL SISTEMA ESCRITO PRESENTADO'),
      t('DCA_INI_17', 'Carga de número de CAUSA JUDICIAL'),
      t('DCA_INI_18', 'Carga de juzgado / fuero / jurisdicción - Objeto'),
      t('DCA_INI_19', 'Vincular escrito de demanda presentado'),
      t('DCA_INI_20', 'Control de primer proveído'),
      t('DCA_INI_21', 'Control de proveído inicial'),
      t('DCA_INI_22', 'Acompañar documental faltante SI corresponde - GENERALMENTE EL VIDEO'),
      t('DCA_INI_23', 'Aclarar o ampliar lo que corresponde'),
      t('DCA_INI_24', 'Pago de Bono Profesional'),
      t('DCA_INI_25', 'Control de plazo - SIEMPRE 6 MESES DESDE EL ULTIMO IMPULSO/ 3 MESES EJECUTIVO'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'PRUEBA',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DCA_TL_01', 'Control de proveído que ordena traslado'),
      t('DCA_TL_02', 'Confección de cédulas'),
      t('DCA_TL_03', 'Control de domicilios de notificación'),
      t('DCA_TL_04', 'Cédula positiva - registrar fecha de notificación'),
      t('DCA_TL_05', 'Cédula negativa - registrar motivo'),
      t('DCA_TL_06', 'Solicitar oficio al RENAPER/CAMARA NACIONAL ELECTORAL'),
      t('DCA_TL_07', 'Reiterar cédula'),
      t('DCA_TL_08', 'Solicitar notificación bajo responsabilidad SI corresponde'),
      t('DCA_TL_09', 'Control de vencimiento del plazo para contestar'),
      t('DCA_TL_10', 'Demandado contesta demanda - SI / No'),
      t('DCA_TL_11', 'Citada en garantía se presenta - SI / No'),
      t('DCA_TL_12', 'Control de excepciones opuestas'),
      t('DCA_TL_13', 'Control de documental acompañada'),
      t('DCA_TL_14', 'Control de desconocimientos'),
      t('DCA_TL_15', 'Contestación de traslado SI corresponde'),
      t('DCA_TL_16', 'Pedido de rebeldía SI no contesta'),
      t('DCA_TL_17', 'Pedido de apertura a prueba'),
      t('DCA_TL_18', 'Carga en SISTEMA interno CONTESTACIÓN de demanda?'),
      t('DCA_TL_19', 'Control de fecha de audiencia 360'),
      t('DCA_TL_20', 'Evaluar posibilidad de acuerdo SEGURO'),
      t('DCA_TL_21', 'Preparar posición de SOFSA'),
      t('DCA_TL_22', 'Control de proveído de apertura a prueba'),
      t('DCA_TL_23', 'Carga de fecha de apertura a prueba'),
    ],
  },
  {
    codigo: 'PRUEBA',
    label: 'Prueba',
    siguiente: 'ALEGATO',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DCA_PR_01', 'Prueba informativa'),
      t('DCA_PR_02', 'Redacción de oficios'),
      t('DCA_PR_03', 'Presentación de oficios'),
      t('DCA_PR_04', 'Seguimiento de libramiento'),
      t('DCA_PR_05', 'Carga de fecha de libramiento'),
      t('DCA_PR_06', 'Control de respuestas'),
      t('DCA_PR_07', 'Reiteración de oficios no contestados'),
      t('DCA_PR_08', 'Acreditación de diligenciamiento en el SISTEMA judicial'),
      t('DCA_PR_09', 'Prueba pericial'),
      t('DCA_PR_10', 'Control de designación de perito'),
      t('DCA_PR_11', 'Control de aceptación de cargo'),
      t('DCA_PR_12', 'Propuesta / control de puntos de pericia'),
      t('DCA_PR_13', 'Pago de Anticipo SI corresponde'),
      t('DCA_PR_14', 'Carga de fecha de pericia SI corresponde'),
      t('DCA_PR_15', 'Coordinar con consultor técnico'),
      t('DCA_PR_16', 'Control de presentación de pericia'),
      t('DCA_PR_17', 'Impugnación de pericia SI corresponde'),
      t('DCA_PR_18', 'Pedido de explicaciones SI corresponde'),
      t('DCA_PR_19', 'Prueba testimonial'),
      t('DCA_PR_20', 'Control de audiencias testimoniales'),
      t('DCA_PR_21', 'Identificar testigos propuestos'),
      t('DCA_PR_22', 'Notificar testigos'),
      t('DCA_PR_23', 'Coordinar con áreas internas / Recursos Humanos'),
      t('DCA_PR_24', 'Preparar interrogatorio'),
      t('DCA_PR_25', 'Otra prueba'),
      t('DCA_PR_26', 'Reconocimiento de documental'),
      t('DCA_PR_27', 'Prueba en poder de terceros'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DCA_AL_01', 'Control de prueba pendiente'),
      t('DCA_AL_02', 'Solicitar clausura de período probatorio SI corresponde'),
      t('DCA_AL_03', 'Control de plazo para alegar'),
      t('DCA_AL_04', 'Carga de fecha de vencimiento'),
      t('DCA_AL_05', 'Análisis de prueba producida'),
      t('DCA_AL_06', 'Redacción de alegato'),
      t('DCA_AL_07', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1° Instancia — Favorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      t('DCA_S1F_01', 'Control de dictado de sentencia'),
      t('DCA_S1F_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      t('DCA_S1F_03', 'Evaluación de montos - SE DEBERIA REGISTRAR - hay diferentes montos (ver como discriminar para informe)'),
      t('DCA_S1F_04', 'Control de efectos y plazos de los recursos de la contraria'),
      t('DCA_S1F_05', 'Evalución de reclamos de peritos por costas'),
      t('DCA_S1F_06', 'Contestación de la expresión de agravios'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1° Instancia — Desfavorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      t('DCA_S1D_01', 'Control de dictado de sentencia'),
      t('DCA_S1D_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      t('DCA_S1D_03', 'Evaluación de responsabilidad'),
      t('DCA_S1D_04', 'Evaluación de montos - SE DEBERIA REGISTRAR'),
      t('DCA_S1D_05', 'Apelación de sentencia'),
      t('DCA_S1D_06', 'Control de concesión del recurso'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DCA_AP_01', 'Notifiación de la Cámara para Expresar Agravios'),
      t('DCA_AP_02', 'Redacción de recurso'),
      t('DCA_AP_03', 'Registro de apelantes'),
      t('DCA_AP_04', 'Contestación de agravios (SI corresponde)'),
      t('DCA_AP_05', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA LA SENTENCIA DE PRIMERA INSTANCIA'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2° Instancia — Favorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DCA_S2F_01', 'Control de dictado de sentencia'),
      t('DCA_S2F_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      t('DCA_S2F_03', 'Evaluación de montos - SE DEBERIA REGISTRAR'),
      t('DCA_S2F_04', 'SE PREVISIONA - PERITOS - ESPERAR INITMACIÓN'),
      t('DCA_S2F_05', 'Control de honorarios'),
      t('DCA_S2F_06', 'SUBIR AL SISTEMA LA SENTENCIA DE SEGUNDA INSTANCIA'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2° Instancia — Desfavorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DCA_S2D_01', 'Control de dictado de sentencia'),
      t('DCA_S2D_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      t('DCA_S2D_03', 'Evaluación de responsabilidad'),
      t('DCA_S2D_04', 'Evaluación de montos - SE DEBERIA REGISTRAR'),
      t('DCA_S2D_05', 'Definir estrategia: Recurso Extraordinario Federal o derivación al módulo de previsiones'),
      t('DCA_S2D_06', 'SUBIR AL SISTEMA LA SENTENCIA DE SEGUNDA INSTANCIA'),
      t('DCA_S2D_07', 'Control de honorarios'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DCA_REF_01', 'Análisis de procedencia'),
      t('DCA_REF_02', 'Redacción del recurso extraordinario'),
      t('DCA_REF_03', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
      t('DCA_REF_04', 'control formal del recurso'),
      t('DCA_REF_05', 'Seguimiento de concesión o denegación'),
      t('DCA_REF_06', 'SI se deniega:'),
      t('DCA_REF_07', 'Registro y discriminación de montos para informes y previsiones presupuestarias'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    grupoCausal: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DCA_ES_01', 'Liquidación'),
      t('DCA_ES_02', 'Presentación de liquidación'),
      t('DCA_ES_03', 'Control de traslado de liquidación'),
      t('DCA_ES_04', 'Contestación de impugnación SI corresponde'),
      t('DCA_ES_05', 'Pedido de aprobación de liquidación'),
      t('DCA_ES_06', 'Intimación de pago'),
      t('DCA_ES_07', 'Pedido de embargo SI corresponde'),
      t('DCA_ES_08', 'Seguimiento de embargo'),
      t('DCA_ES_09', 'Control de transferencia / depósito judicial'),
      t('DCA_ES_10', 'Pedido de libramiento de fondos'),
      t('DCA_ES_11', 'Registro de cobro efectivo'),
    ],
  },
  {
    codigo: 'FINALIZADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    tareas: [
      t('DCA_FIN_01', 'Verificar cumplimiento total'),
      t('DCA_FIN_02', 'Verificar cobro / imposibilidad de cobro'),
      t('DCA_FIN_03', 'Registrar resultado final'),
      t('DCA_FIN_04', 'Archivo judicial SI corresponde'),
      t('DCA_FIN_05', 'Archivo interno'),
      t('DCA_FIN_06', 'Registrar causal de finalización'),
    ],
  },
]

// ── CICLO: Demanda Laboral — Parte Actora (Delta 8) ──────
// Tareas: SIAJ_Estados_Tareas_v2.xlsx (hoja "Demanda Laboral Parte Actora").
// Usa el código PRUEBA (no EN_PRUEBA) para el nodo de prueba.
export const ESTADOS_DEMANDA_LABORAL_ACTORA: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'INICIO', tareas: [] },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'TRABA_LITIS',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DLA_INI_01', 'Reunir documental respaldatoria'),
      t('DLA_INI_02', 'Identificar demandados'),
      t('DLA_INI_03', 'Controlar domicilios'),
      t('DLA_INI_04', 'Determinar monto reclamado'),
      t('DLA_INI_05', 'Definir competencia'),
      t('DLA_INI_06', 'Redacción de demanda'),
      t('DLA_INI_07', 'Ofrecimiento de prueba:'),
      t('DLA_INI_08', 'Documental'),
      t('DLA_INI_09', 'Testimonial'),
      t('DLA_INI_10', 'Pericial'),
      t('DLA_INI_11', 'Videofilmación'),
      t('DLA_INI_12', 'Informativa / oficios'),
      t('DLA_INI_13', 'Revisión final'),
      t('DLA_INI_14', 'Presentación en SISTEMA judicial SORTEO DE CAUSA - N° CAUSA JUDICIAL'),
      t('DLA_INI_15', 'SUBIR AL SISTEMA ESCRITO PRESENTADO'),
      t('DLA_INI_16', 'Carga de número de CAUSA JUDICIAL'),
      t('DLA_INI_17', 'Carga de juzgado / fuero / jurisdicción - Objeto'),
      t('DLA_INI_18', 'Vincular escrito de demanda presentado'),
      t('DLA_INI_19', 'Control de primer proveído'),
      t('DLA_INI_20', 'Control de proveído inicial'),
      t('DLA_INI_21', 'Acompañar documental faltante SI corresponde'),
      t('DLA_INI_22', 'Aclarar o ampliar lo que corresponde'),
      t('DLA_INI_23', 'Pago de Bono Profesional'),
      t('DLA_INI_24', 'Control de plazo'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'PRUEBA',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DLA_TL_01', 'Control de proveído que ordena traslado'),
      t('DLA_TL_02', 'Confección de cédulas'),
      t('DLA_TL_03', 'Control de domicilios de notificación'),
      t('DLA_TL_04', 'Cédula positiva - registrar fecha de notificación'),
      t('DLA_TL_05', 'Cédula negativa - registrar motivo'),
      t('DLA_TL_06', 'Solicitar oficio al RENAPER/CAMARA NACIONAL ELECTORAL'),
      t('DLA_TL_07', 'Reiterar cédula'),
      t('DLA_TL_08', 'Solicitar notificación bajo responsabilidad SI corresponde'),
      t('DLA_TL_09', 'Control de vencimiento del plazo para contestar'),
      t('DLA_TL_10', 'Demandado contesta demanda - SI / No'),
      t('DLA_TL_11', 'Control de excepciones opuestas'),
      t('DLA_TL_12', 'Control de documental acompañada'),
      t('DLA_TL_13', 'Control de desconocimientos'),
      t('DLA_TL_14', 'Contestación de traslado SI corresponde'),
      t('DLA_TL_15', 'Pedido de rebeldía SI no contesta'),
      t('DLA_TL_16', 'Pedido de apertura a prueba'),
      t('DLA_TL_17', 'Control de fecha de audiencia 360'),
      t('DLA_TL_18', 'Preparar posición de SOFSA'),
      t('DLA_TL_19', 'Control de proveído de apertura a prueba'),
      t('DLA_TL_20', 'Carga de fecha de apertura a prueba'),
    ],
  },
  {
    codigo: 'PRUEBA',
    label: 'Prueba',
    siguiente: 'ALEGATO',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DLA_PR_01', 'Prueba informativa'),
      t('DLA_PR_02', 'Redacción de oficios'),
      t('DLA_PR_03', 'Presentación de oficios'),
      t('DLA_PR_04', 'Seguimiento de libramiento'),
      t('DLA_PR_05', 'Carga de fecha de libramiento'),
      t('DLA_PR_06', 'Control de respuestas'),
      t('DLA_PR_07', 'Reiteración de oficios no contestados'),
      t('DLA_PR_08', 'Acreditación de diligenciamiento en el SISTEMA judicial'),
      t('DLA_PR_09', 'Prueba pericial'),
      t('DLA_PR_10', 'Control de designación de perito'),
      t('DLA_PR_11', 'Control de aceptación de cargo'),
      t('DLA_PR_12', 'Propuesta / control de puntos de pericia'),
      t('DLA_PR_13', 'Pago de Anticipo SI corresponde'),
      t('DLA_PR_14', 'Carga de fecha de pericia SI corresponde'),
      t('DLA_PR_15', 'Coordinar con consultor técnico'),
      t('DLA_PR_16', 'Control de presentación de pericia'),
      t('DLA_PR_17', 'Impugnación de pericia SI corresponde'),
      t('DLA_PR_18', 'Pedido de explicaciones SI corresponde'),
      t('DLA_PR_19', 'Prueba testimonial'),
      t('DLA_PR_20', 'Control de audiencias testimoniales'),
      t('DLA_PR_21', 'Identificar testigos propuestos'),
      t('DLA_PR_22', 'Notificar testigos'),
      t('DLA_PR_23', 'Coordinar con áreas internas / Recursos Humanos'),
      t('DLA_PR_24', 'Preparar interrogatorio'),
      t('DLA_PR_25', 'Otra prueba'),
      t('DLA_PR_26', 'Reconocimiento de documental'),
      t('DLA_PR_27', 'Prueba en poder de terceros'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DLA_AL_01', 'Control de prueba pendiente'),
      t('DLA_AL_02', 'Solicitar clausura de período probatorio SI corresponde'),
      t('DLA_AL_03', 'Control de plazo para alegar'),
      t('DLA_AL_04', 'Carga de fecha de vencimiento'),
      t('DLA_AL_05', 'Análisis de prueba producida'),
      t('DLA_AL_06', 'Redacción de alegato'),
      t('DLA_AL_07', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1° Instancia — Favorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      t('DLA_S1F_01', 'Control de dictado de sentencia'),
      t('DLA_S1F_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      t('DLA_S1F_03', 'Evaluación de montos - Hay diferentes montos - Seria necesario discriminarlos'),
      t('DLA_S1F_04', 'Control de efectos y plazos de los recursos de la contraria'),
      t('DLA_S1F_05', 'Evalución de reclamos de peritos por costas'),
      t('DLA_S1F_06', 'Contestación de la expresión de agravios'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1° Instancia — Desfavorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      t('DLA_S1D_01', 'Control de dictado de sentencia'),
      t('DLA_S1D_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      t('DLA_S1D_03', 'Evaluación de responsabilidad'),
      t('DLA_S1D_04', 'Evaluación de montos - Hay diferentes montos - Seria necesario discriminarlos'),
      t('DLA_S1D_05', 'Apelación de sentencia y EXPRESIÓN DE AGRAVIOS'),
      t('DLA_S1D_06', 'Control de concesión del recurso'),
      t('DLA_S1D_07', 'Contestación de la expresión de agravios'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DLA_AP_01', 'Registro de apelantes'),
      t('DLA_AP_02', 'SUBIR AL SISTEMA LA SENTENCIA DE PRIMERA INSTANCIA'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2° Instancia — Favorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DLA_S2F_01', 'Control de dictado de sentencia'),
      t('DLA_S2F_02', 'Análisis del fallo'),
      t('DLA_S2F_03', 'Evaluación de montos'),
      t('DLA_S2F_04', 'SE PREVISIONA - PERITOS - ESPERAR INITMACIÓN'),
      t('DLA_S2F_05', 'Control de honorarios'),
      t('DLA_S2F_06', 'SUBIR AL SISTEMA LA SENTENCIA DE SEGUNDA INSTANCIA'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2° Instancia — Desfavorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DLA_S2D_01', 'Control de dictado de sentencia'),
      t('DLA_S2D_02', 'Análisis del fallo - RECURSO DE ACLARATORIA'),
      t('DLA_S2D_03', 'Evaluación de responsabilidad'),
      t('DLA_S2D_04', 'Evaluación de montos'),
      t('DLA_S2D_05', 'Definir estrategia: Recurso Extraordinario Federal o derivación al módulo de previsiones'),
      t('DLA_S2D_06', 'SUBIR AL SISTEMA LA SENTENCIA DE SEGUNDA INSTANCIA'),
      t('DLA_S2D_07', 'Control de honorarios'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DLA_REF_01', 'Análisis de procedencia'),
      t('DLA_REF_02', 'Redacción del recurso extraordinario'),
      t('DLA_REF_03', 'Presentación en SISTEMA judicial Y SUBIR AL SISTEMA ESCRITO PRESENTADO'),
      t('DLA_REF_04', 'control formal del recurso'),
      t('DLA_REF_05', 'Seguimiento de concesión o denegación'),
      t('DLA_REF_06', 'SI se deniega:'),
      t('DLA_REF_07', 'Registro y discriminación de montos para informes y previsiones presupuestarias'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    grupoCausal: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DLA_ES_01', 'Liquidación'),
      t('DLA_ES_02', 'Presentación de liquidación'),
      t('DLA_ES_03', 'Contestar traslado de liquidación practicada por Secretaria o perito, o impugnar la liquidacion una vez digitalizada'),
      t('DLA_ES_04', 'Contestar nuevo traslado de liquidacion e impugnar'),
      t('DLA_ES_05', 'Verificar que quede firme liquidacion'),
      t('DLA_ES_06', 'Oponerse a embargo de ser necesario'),
      t('DLA_ES_07', 'Pedido de embargo SI corresponde por honorarios de letrado (ver)'),
      t('DLA_ES_08', 'Seguimiento de embargo de corresponder'),
      t('DLA_ES_09', 'Pedido de libramiento de fondos para el pago'),
      t('DLA_ES_10', 'Control de transferencia / depósito judicial'),
      t('DLA_ES_11', 'Acreditar internamente el pago'),
      t('DLA_ES_12', 'Dar aviso a RR.HH. (En el caso que corresponda)'),
    ],
  },
  {
    codigo: 'FINALIZADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    tareas: [
      t('DLA_FIN_01', 'Verificar cumplimiento total'),
      t('DLA_FIN_02', 'Verificar cobro / imposibilidad de cobro'),
      t('DLA_FIN_03', 'Registrar resultado final'),
      t('DLA_FIN_04', 'Archivo judicial SI corresponde'),
      t('DLA_FIN_05', 'Archivo interno'),
      t('DLA_FIN_06', 'Registrar causal de finalización'),
    ],
  },
]

// ── CICLO: Lanzamiento Judicializado (Delta 5 — 11 estados) ──
// Tareas: SIAJ_Estados_Tareas_v2.xlsx (hoja "Lanzamientos Judicializados").
// Split Operativo/Comercial (ver getSiguienteLanzamiento en
// DetalleExpediente.page.tsx) + bifurcación por vulnerabilidad desde
// CONSTATACION_JUDICIAL (ver RAMIFICACIONES_POR_CODIGO):
//   sin personas vulnerables → SENTENCIA_LANZAMIENTO (camino directo)
//   con personas vulnerables → TRABA_LITIS → SENTENCIA_LANZAMIENTO
// Circuito completo (Operativo):
//   ASIGNADO → INICIO → CONSTATACION_JUDICIAL → [TRABA_LITIS] → SENTENCIA_LANZAMIENTO
//     → APELACION_LANZ → SENTENCIA_CAMARA → REF_LANZ → SENTENCIA_FIRME
//     → MANDAMIENTO_LIBRADO → LANZAMIENTO_EFECTIVIZADO → TERMINADO
// Circuito Comercial (salto directo):
//   INICIO → SENTENCIA_LANZAMIENTO → MANDAMIENTO_LIBRADO
//     → LANZAMIENTO_EFECTIVIZADO → TERMINADO
export const ESTADOS_LANZAMIENTO_JUDICIALIZADO: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'INICIO', tareas: [] },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'CONSTATACION_JUDICIAL',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_INI_01', 'Reunir documental respaldatoria del antecedente'),
      t('LJ_INI_02', 'Presentación en sistema judicial - sorteo de causa - N° causa judicial'),
      t('LJ_INI_03', 'Carga de número de causa judicial'),
      t('LJ_INI_04', 'Carga de juzgado / fuero / jurisdicción - objeto'),
      t('LJ_INI_05', 'Vincular escrito de demanda presentado'),
      t('LJ_INI_06', 'Control de primer proveído'),
      t('LJ_INI_07', 'Control de proveído inicial'),
      t('LJ_INI_08', 'Aclarar o ampliar lo que corresponde'),
      t('LJ_INI_09', 'Pago de bono profesional'),
      t('LJ_INI_10', 'Control de plazo - 3 meses'),
    ],
  },
  {
    codigo: 'CONSTATACION_JUDICIAL',
    label: 'Constatación Judicial',
    siguiente: 'SENTENCIA_LANZAMIENTO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_CJ_01', 'Control de mandamiento de constatación librado'),
      t('LJ_CJ_02', 'Diligenciamiento del mandamiento de constatación'),
      t('LJ_CJ_03', 'Control del acta de constatación - relevar si hay menores, embarazadas o personas con discapacidad'),
      t('LJ_CJ_04', 'Traslado a Defensor Oficial (si corresponde)'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'SENTENCIA_LANZAMIENTO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_TL_01', 'Control de oposición del Defensor Oficial'),
      t('LJ_TL_02', 'Contestación de oposición (si corresponde)'),
      t('LJ_TL_03', 'Ofrecimiento de prueba (si corresponde)'),
      t('LJ_TL_04', 'Cierre de Traba de Litis - queda en condiciones de dictarse Sentencia de Lanzamiento'),
    ],
  },
  {
    codigo: 'SENTENCIA_LANZAMIENTO',
    label: 'Sentencia de Lanzamiento',
    siguiente: 'APELACION_LANZ',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_SL_01', 'Control de dictado de sentencia'),
      t('LJ_SL_02', 'Análisis del fallo - recurso de aclaratoria (si corresponde)'),
      t('LJ_SL_03', 'Subir al sistema la sentencia de lanzamiento'),
    ],
  },
  {
    codigo: 'APELACION_LANZ',
    label: 'Apelación',
    siguiente: 'SENTENCIA_CAMARA',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_AP_01', 'Notificación a Cámara para expresar agravios / contestar agravios'),
      t('LJ_AP_02', 'Redacción de recurso (si apela SOFSA) o contestación de agravios (si apela la contraria)'),
      t('LJ_AP_03', 'Presentación en sistema judicial y subir al sistema la sentencia de primera instancia'),
    ],
  },
  {
    codigo: 'SENTENCIA_CAMARA',
    label: 'Sentencia de Cámara',
    siguiente: 'REF_LANZ',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_SC_01', 'Control de dictado de sentencia'),
      t('LJ_SC_02', 'Análisis del fallo - recurso de aclaratoria (si corresponde)'),
      t('LJ_SC_03', 'Subir al sistema la sentencia de Cámara'),
    ],
  },
  {
    codigo: 'REF_LANZ',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'SENTENCIA_FIRME',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_REF_01', 'Análisis de procedencia'),
      t('LJ_REF_02', 'Redacción del recurso extraordinario'),
      t('LJ_REF_03', 'Presentación en sistema judicial y subir al sistema escrito presentado'),
      t('LJ_REF_04', 'Control formal del recurso'),
      t('LJ_REF_05', 'Seguimiento de concesión o denegación'),
    ],
  },
  {
    codigo: 'SENTENCIA_FIRME',
    label: 'Sentencia Firme',
    siguiente: 'MANDAMIENTO_LIBRADO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_SF_01', 'Control de firmeza - vencidos los plazos de todos los recursos posibles'),
      t('LJ_SF_02', 'Registrar motivo de firmeza (consentida / recursos agotados)'),
    ],
  },
  {
    codigo: 'MANDAMIENTO_LIBRADO',
    label: 'Mandamiento Librado',
    siguiente: 'LANZAMIENTO_EFECTIVIZADO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_ML_01', 'Se libra el mandamiento'),
      t('LJ_ML_02', 'Diligenciamiento del mandamiento'),
      t('LJ_ML_03', 'Control de plazo para el diligenciamiento'),
    ],
  },
  {
    codigo: 'LANZAMIENTO_EFECTIVIZADO',
    label: 'Lanzamiento Efectivizado',
    siguiente: 'TERMINADO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_LE_01', 'Ejecución de la medida'),
      t('LJ_LE_02', 'Depositario de bienes (si corresponde)'),
      t('LJ_LE_03', 'Presentación del Defensor Oficial (si corresponde)'),
      t('LJ_LE_04', 'Subir al sistema el mandamiento diligenciado'),
    ],
  },
  {
    codigo: 'TERMINADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_TER_01', 'Verificar cumplimiento total'),
      t('LJ_TER_02', 'Verificar cobro / imposibilidad de cobro (si aplica)'),
      t('LJ_TER_03', 'Registrar causal de finalización'),
      t('LJ_TER_04', 'Archivo judicial (si corresponde)'),
      t('LJ_TER_05', 'Archivo interno'),
    ],
  },
]

// ── CICLO: Mediaciones / SECLO (Estados_PRD.xlsx) ────────
// ASIGNADO → EN_ANALISIS → [SOLICITUD_INFORMACION] → bifurca:
//   CUMPLIDO_ACUERDO | CUMPLIDO_SIN_ACUERDO (ambos finales/archivados).
// La bifurcación se resuelve en getRamificaciones (DetalleExpediente.page.tsx):
// desde EN_ANALISIS se puede pedir información o cerrar directo; desde
// SOLICITUD_INFORMACION solo queda elegir el resultado. Sin tareas definidas aún.
function cicloAcuerdoNoAcuerdo(): EstadoProcesal[] {
  return [
    { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'EN_ANALISIS', tareas: [] },
    { codigo: 'EN_ANALISIS', label: 'En Análisis', siguiente: undefined, tareas: [] },
    { codigo: 'SOLICITUD_INFORMACION', label: 'Solicitud de Información', siguiente: undefined, tareas: [] },
    { codigo: 'CUMPLIDO_ACUERDO', label: 'Cumplido (acuerdo)', siguiente: undefined, esArchivado: true, tareas: [] },
    { codigo: 'CUMPLIDO_SIN_ACUERDO', label: 'Cumplido (no acuerdo)', siguiente: undefined, esArchivado: true, tareas: [] },
  ]
}
export const ESTADOS_MEDIACION: EstadoProcesal[] = cicloAcuerdoNoAcuerdo()
export const ESTADOS_SECLO: EstadoProcesal[] = cicloAcuerdoNoAcuerdo()

/** Tipos con el ciclo Acuerdo / No acuerdo. */
export const TIPOS_CICLO_ACUERDO = new Set(['MEDIACION', 'SECLO'])

// ── CICLO: Defensa Civil (Estados_PRD.xlsx + decisión 2026-11-03) ──
// ASIGNADO → EN_ANALISIS → bifurca:
//   ASUME_REPRESENTACION → FINALIZADO
//   NO_ASUME_REPRESENTACION (final)
// La bifurcación desde EN_ANALISIS se resuelve en getRamificaciones. Sin tareas.
export const ESTADOS_DEFENSA_CIVIL: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'EN_ANALISIS', tareas: [] },
  { codigo: 'EN_ANALISIS', label: 'En Análisis', siguiente: undefined, tareas: [] },
  { codigo: 'ASUME_REPRESENTACION', label: 'Asume representación', siguiente: 'FINALIZADO', tareas: [] },
  { codigo: 'NO_ASUME_REPRESENTACION', label: 'No asume representación', siguiente: undefined, esArchivado: true, tareas: [] },
  { codigo: 'FINALIZADO', label: 'Finalizado', siguiente: undefined, esArchivado: true, tareas: [] },
]

// ── Mapa general tipo → estados ─────────────────────────
const ESTADOS_PROCESALES: Partial<Record<string, EstadoProcesal[]>> = {
  DEMANDA_CIVIL:             ESTADOS_DEMANDA_CIVIL,
  DEMANDA_LABORAL:           ESTADOS_DEMANDA_LABORAL,
  COBRO_CANON:               ESTADOS_COBRO_CANON,
  RECLAMO_CONTRAT:           ESTADOS_RECLAMO_CONTRAT,
  RECUPERO:                  ESTADOS_RECUPERO,
  EJECUCION_GAR:             ESTADOS_EJECUCION_GAR,
  LANZAMIENTO:               ESTADOS_LANZAMIENTO,
  CONSIGNACION:              ESTADOS_CONSIGNACION,
  DESAFUERO:                 ESTADOS_DESAFUERO,
  DEMANDA_CIVIL_ACTORA:      ESTADOS_DEMANDA_CIVIL_ACTORA,
  DEMANDA_LABORAL_ACTORA:    ESTADOS_DEMANDA_LABORAL_ACTORA,
  LANZAMIENTO_JUDICIALIZADO: ESTADOS_LANZAMIENTO_JUDICIALIZADO,
  MEDIACION:                 ESTADOS_MEDIACION,
  SECLO:                     ESTADOS_SECLO,
  DEFENSA_CIVIL:             ESTADOS_DEFENSA_CIVIL,
}

export function getEstadosProcesales(tipo: string): EstadoProcesal[] {
  return ESTADOS_PROCESALES[tipo] ?? ESTADOS_GENERICOS
}

// ── Sub-estado DESARCHIVADO (Delta 3 / 4B) ───────────────
// Transitorio y común a todos los ciclos Civil/Laboral: se entra desde un estado
// terminal (esArchivado) con "Desarchivar actuación", admite cargar UNA actividad
// genérica y la única salida es "Volver a archivo" (al mismo estado terminal del
// que salió, guardado en Expediente.estado_previo_desarchivo). No forma parte de
// ningún ciclo — por eso no aparece en el stepper ni en Avanzar/Retroceder.
export const ESTADO_DESARCHIVADO: EstadoProcesal = {
  codigo: 'DESARCHIVADO',
  label: 'Desarchivado',
  siguiente: undefined,
  tareas: [],
}

export function getEstadoProcesal(tipo: string, codigo: string): EstadoProcesal | undefined {
  if (codigo === 'DESARCHIVADO') return ESTADO_DESARCHIVADO
  return getEstadosProcesales(tipo).find(e => e.codigo === codigo)
}

/** true si el estado es terminal (archivado) dentro del ciclo del tipo. */
export function esEstadoArchivado(tipo: string, codigo: string): boolean {
  return !!getEstadosProcesales(tipo).find(e => e.codigo === codigo)?.esArchivado
}

export function calcularUrgencia(fechaVencimiento?: string | null): UrgenciaTarea {
  if (!fechaVencimiento) return 'gris'
  const hoy = new Date()
  const vence = new Date(fechaVencimiento)
  const dias = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (dias < 0)  return 'rojo'
  if (dias <= 7) return 'ambar'
  return 'verde'
}
