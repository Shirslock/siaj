import type { EstadoProcesal, UrgenciaTarea, Tarea } from '../types'

// ── Helper para crear tareas con campos por defecto (uso temprano) ──
function tt(id: string, nombre: string): Tarea {
  return { id, nombre, estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null }
}

// ── DEMANDA CIVIL — ciclo completo (Parte Demandada) ─────
// Estructura MATRIZ SACO: ASIGNADO → INICIO → TRABA_LITIS → EN_PRUEBA
// → ALEGATO → SENTENCIA_1_(FAV|DESFAV) → APELACION → SENTENCIA_2_(FAV|DESFAV)
// → REF → EJECUCION_SENTENCIA → FINALIZADO
// (Recurso de Queja ya no es nodo lineal: es trámite paralelo, ver TAREAS_RECURSO_QUEJA)
export const ESTADOS_DEMANDA_CIVIL: EstadoProcesal[] = [
  {
    codigo: 'ASIGNADO',
    label: 'Asignado',
    siguiente: 'INICIO',
    tareas: [],
  },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'TRABA_LITIS',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DC_INI_01', 'Análisis inicial de la demanda'),
      tt('DC_INI_02', 'Interposición de revocatoria'),
      tt('DC_INI_03', 'Definición de plazo para contestar demanda'),
      tt('DC_INI_04', 'Revisión integral del expediente'),
      tt('DC_INI_05', 'Interposición de caducidad'),
      tt('DC_INI_06', 'Contestación de demanda'),
      tt('DC_INI_07', 'Redacción de defensa de fondo'),
      tt('DC_INI_08', 'Planteo de excepciones'),
      tt('DC_INI_09', 'Oposiciones'),
      tt('DC_INI_10', 'Requerir citación de terceros'),
      tt('DC_INI_11', 'Ofrecimiento de prueba'),
      tt('DC_INI_12', 'Documental'),
      tt('DC_INI_13', 'Testimonial — Propuestos por SOFSA'),
      tt('DC_INI_14', 'Pericial'),
      tt('DC_INI_15', 'Informativa'),
      tt('DC_INI_16', 'Presentación en sistema judicial'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'EN_PRUEBA',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DC_TL_01', 'Notificación de traslado'),
      tt('DC_TL_02', 'Control de plazos procesales'),
      tt('DC_TL_03', 'Presentación de documentación'),
    ],
  },
  {
    codigo: 'EN_PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATO',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DC_EP_01', 'Producción de prueba documental'),
      tt('DC_EP_02', 'Seguimiento de peritos'),
      tt('DC_EP_03', 'Control de audiencias de prueba'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DC_AL_01', 'Redacción de alegatos'),
      tt('DC_AL_02', 'Presentación de alegatos'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1° Instancia — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      tt('DC_S1F_01', 'Análisis de sentencia'),
      tt('DC_S1F_02', 'Control de firmeza — apelación de la contraria'),
      tt('DC_S1F_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1° Instancia — Desfavorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      tt('DC_S1D_01', 'Análisis de sentencia'),
      tt('DC_S1D_02', 'Evaluar viabilidad de apelación'),
      tt('DC_S1D_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DC_AP_01', 'Redacción de memorial de agravios'),
      tt('DC_AP_02', 'Presentación de apelación'),
      tt('DC_AP_03', 'Control de elevación'),
      tt('DC_AP_04', 'Seguimiento de cámara'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2° Instancia — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DC_S2F_01', 'Análisis de sentencia de cámara'),
      tt('DC_S2F_02', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2° Instancia — Desfavorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DC_S2D_01', 'Análisis de sentencia'),
      tt('DC_S2D_02', 'Evaluar viabilidad de recurso extraordinario'),
      tt('DC_S2D_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DC_REF_01', 'Redacción de REF'),
      tt('DC_REF_02', 'Presentación de REF'),
      tt('DC_REF_03', 'Control de admisibilidad'),
      tt('DC_REF_04', 'Seguimiento de CSJN'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    grupoCausal: 'EJECUCION_SENTENCIA',
    tareas: [
      tt('DC_ES_01', 'Liquidación definitiva de condena'),
      tt('DC_ES_02', 'Control de observaciones a la liquidación'),
      tt('DC_ES_03', 'Informar a Administración monto a pagar'),
      tt('DC_ES_04', 'Requerir fondos para el pago'),
      tt('DC_ES_05', 'Control de transferencia / pago'),
      tt('DC_ES_06', 'Certificar pago'),
      tt('DC_ES_07', 'Gestión de archivo'),
      tt('DC_ES_CAUSAL', 'Registrar causal de finalización'),
    ],
  },
  {
    codigo: 'FINALIZADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    tareas: [
      tt('DC_FIN_01', 'Archivo del expediente'),
      tt('DC_FIN_02', 'Notificación final a área requirente'),
      tt('DC_FIN_03', 'Registrar resultado'),
      tt('DC_FIN_04', 'Cierre en sistema'),
    ],
  },
]

// ── DEMANDA LABORAL — ciclo completo (Parte Demandada) ───
// Misma estructura MATRIZ SACO que ESTADOS_DEMANDA_CIVIL, adaptada al fuero laboral.
export const ESTADOS_DEMANDA_LABORAL: EstadoProcesal[] = [
  {
    codigo: 'ASIGNADO',
    label: 'Asignado',
    siguiente: 'INICIO',
    tareas: [],
  },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'TRABA_LITIS',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DL_INI_01', 'Análisis inicial de la demanda laboral'),
      tt('DL_INI_02', 'Verificar competencia — fuero laboral'),
      tt('DL_INI_03', 'Definición de plazo para contestar demanda'),
      tt('DL_INI_04', 'Revisión integral del legajo del trabajador'),
      tt('DL_INI_05', 'Contestación de demanda'),
      tt('DL_INI_06', 'Redacción de defensa de fondo'),
      tt('DL_INI_07', 'Planteo de excepciones'),
      tt('DL_INI_08', 'Ofrecimiento de prueba'),
      tt('DL_INI_09', 'Documental'),
      tt('DL_INI_10', 'Testimonial — Propuestos por SOFSA'),
      tt('DL_INI_11', 'Pericial contable / médica'),
      tt('DL_INI_12', 'Presentación en sistema judicial'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'EN_PRUEBA',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DL_TL_01', 'Notificación de traslado'),
      tt('DL_TL_02', 'Control de plazos procesales'),
      tt('DL_TL_03', 'Presentación de documentación'),
    ],
  },
  {
    codigo: 'EN_PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATO',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DL_EP_01', 'Producción de prueba documental'),
      tt('DL_EP_02', 'Control de peritos laborales'),
      tt('DL_EP_03', 'Control de audiencias de prueba'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      tt('DL_AL_01', 'Redacción de alegatos'),
      tt('DL_AL_02', 'Presentación de alegatos'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1° Instancia — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      tt('DL_S1F_01', 'Análisis de sentencia'),
      tt('DL_S1F_02', 'Control de firmeza — apelación de la contraria'),
      tt('DL_S1F_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1° Instancia — Desfavorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      tt('DL_S1D_01', 'Análisis de sentencia'),
      tt('DL_S1D_02', 'Evaluar viabilidad de apelación'),
      tt('DL_S1D_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DL_AP_01', 'Redacción de memorial de agravios'),
      tt('DL_AP_02', 'Presentación de apelación'),
      tt('DL_AP_03', 'Seguimiento de cámara laboral'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2° Instancia — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DL_S2F_01', 'Análisis de sentencia de cámara'),
      tt('DL_S2F_02', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2° Instancia — Desfavorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DL_S2D_01', 'Análisis de sentencia'),
      tt('DL_S2D_02', 'Evaluar recurso extraordinario'),
      tt('DL_S2D_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      tt('DL_REF_01', 'Redacción de REF'),
      tt('DL_REF_02', 'Presentación de REF'),
      tt('DL_REF_03', 'Control de admisibilidad'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    grupoCausal: 'EJECUCION_SENTENCIA',
    tareas: [
      tt('DL_ES_01', 'Liquidación definitiva de condena'),
      tt('DL_ES_02', 'Control de observaciones a la liquidación'),
      tt('DL_ES_03', 'Informar a Administración monto a pagar'),
      tt('DL_ES_04', 'Requerir fondos para el pago'),
      tt('DL_ES_05', 'Control de transferencia / pago'),
      tt('DL_ES_06', 'Certificar pago'),
      tt('DL_ES_07', 'Gestión de archivo'),
      tt('DL_ES_CAUSAL', 'Registrar causal de finalización'),
    ],
  },
  {
    codigo: 'FINALIZADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    tareas: [
      tt('DL_FIN_01', 'Archivo del expediente'),
      tt('DL_FIN_02', 'Notificación final a área requirente'),
      tt('DL_FIN_03', 'Registrar resultado'),
      tt('DL_FIN_04', 'Cierre en sistema'),
    ],
  },
]

// ── Recurso de Queja — trámite paralelo (no es nodo de la cadena) ─
// Aplica desde REF en adelante en los 4 ciclos de Demanda Civil/Laboral.
// Ver useExpedientesStore.toggleQuejaEnTramite().
export const TAREAS_RECURSO_QUEJA: Tarea[] = [
  tt('RQ_01', 'Interposición del recurso de queja'),
  tt('RQ_02', 'Seguimiento ante la Cámara'),
  tt('RQ_03', 'Resolución de la queja'),
  tt('RQ_04', 'Si prospera: retroceder a REF con motivo'),
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

const ACUERDO_EXTRAJUDICIAL_TAREAS: EstadoProcesal = {
  codigo: 'ACUERDO_EXTRAJUDICIAL',
  label: 'Acuerdo Extrajudicial',
  siguiente: undefined,
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

const DEVUELTO_SECTOR_A: EstadoProcesal = {
  codigo: 'DEVUELTO_SECTOR_REQUIRENTE',
  label: 'Devuelto al Sector Requirente',
  siguiente: undefined,
  esArchivado: true,
  tareas: [
    t('DSR_A_01', 'Registrar motivo, fecha, documentación requerida y observaciones'),
  ],
}

const DEVUELTO_SECTOR_B: EstadoProcesal = {
  codigo: 'DEVUELTO_SECTOR_REQUIRENTE',
  label: 'Devuelto al Sector Requirente',
  siguiente: undefined,
  esArchivado: true,
  tareas: [
    t('DSR_B_01', 'Registrar motivo de devolución'),
    t('DSR_B_02', 'Registrar fecha de devolución'),
    t('DSR_B_03', 'Registrar documentación o información requerida'),
    t('DSR_B_04', 'Registrar observaciones (si corresponde)'),
  ],
}

// ── CICLO A: Cobro de Cánones ─────────────────────────────
export const ESTADOS_COBRO_CANON: EstadoProcesal[] = [
  {
    codigo: 'ASIGNADO',
    label: 'Asignado',
    siguiente: 'EN_ANALISIS',
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
  { codigo: 'EN_ANALISIS', label: 'En Análisis', siguiente: undefined, tareas: [] },
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
  DEVUELTO_SECTOR_A,
]

// ── CICLO A: Reclamo a Contratistas ──────────────────────
export const ESTADOS_RECLAMO_CONTRAT: EstadoProcesal[] = [
  {
    codigo: 'ASIGNADO',
    label: 'Asignado',
    siguiente: 'EN_ANALISIS',
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
  { codigo: 'EN_ANALISIS', label: 'En Análisis', siguiente: undefined, tareas: [] },
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
  DEVUELTO_SECTOR_A,
]

// ── CICLO A: Recuperos ────────────────────────────────────
export const ESTADOS_RECUPERO: EstadoProcesal[] = [
  {
    codigo: 'ASIGNADO',
    label: 'Asignado',
    siguiente: 'EN_ANALISIS',
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
  { codigo: 'EN_ANALISIS', label: 'En Análisis', siguiente: undefined, tareas: [] },
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
  DEVUELTO_SECTOR_A,
]

// ── CICLO A: Ejecución de Garantías ──────────────────────
export const ESTADOS_EJECUCION_GAR: EstadoProcesal[] = [
  {
    codigo: 'ASIGNADO',
    label: 'Asignado',
    siguiente: 'EN_ANALISIS',
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
  { codigo: 'EN_ANALISIS', label: 'En Análisis', siguiente: undefined, tareas: [] },
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
  DEVUELTO_SECTOR_A,
]

// ── CICLO A: Lanzamientos ─────────────────────────────────
export const ESTADOS_LANZAMIENTO: EstadoProcesal[] = [
  {
    codigo: 'ASIGNADO',
    label: 'Asignado',
    siguiente: 'EN_ANALISIS',
    tareas: [
      t('LAN_01', 'Análisis de antecedentes del inmueble — jurisdicción'),
      t('LAN_02', 'Verificar fecha de notificación e intimación'),
      t('LAN_03', 'Identificar intrusos / permisionarios'),
      t('LAN_04', 'Verificar documentación respaldatoria'),
      t('LAN_05', 'Solicitar antecedentes internos faltantes'),
      t('LAN_06', 'Evaluar posibilidad de lanzamiento'),
      t('LAN_07', 'Definir estrategia: Acuerdo extrajudicial / Devuelto al sector / Inicio de juicio'),
    ],
  },
  { codigo: 'EN_ANALISIS', label: 'En Análisis', siguiente: undefined, tareas: [] },
  ACUERDO_EXTRAJUDICIAL_TAREAS,
  {
    codigo: 'JUICIO_INICIADO',
    label: 'Juicio Iniciado',
    siguiente: undefined,
    tareas: [
      t('LAN_JI_01', 'Registrar tipo de acción judicial y observaciones'),
      t('LAN_JI_02', 'Cambio de estado a: Lanzamiento Judicializado'),
    ],
  },
  DEVUELTO_SECTOR_A,
]

// ── CICLO B: Consignaciones ───────────────────────────────
export const ESTADOS_CONSIGNACION: EstadoProcesal[] = [
  {
    codigo: 'ASIGNADO',
    label: 'Asignado',
    siguiente: 'EN_ANALISIS',
    tareas: [
      t('CON_01', 'Pedido de antecedentes a RRHH'),
      t('CON_02', 'Control de monto y concepto'),
      t('CON_03', 'Evaluación de estrategia judicial'),
      t('CON_04', 'Definir estrategia: Devuelto al sector / Juicio iniciado'),
    ],
  },
  { codigo: 'EN_ANALISIS', label: 'En Análisis', siguiente: undefined, tareas: [] },
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
  DEVUELTO_SECTOR_B,
]

// ── CICLO B: Desafueros ───────────────────────────────────
export const ESTADOS_DESAFUERO: EstadoProcesal[] = [
  {
    codigo: 'ASIGNADO',
    label: 'Asignado',
    siguiente: 'EN_ANALISIS',
    tareas: [
      t('DES_01', 'Pedido de antecedentes internos'),
      t('DES_02', 'Control de documentación respaldatoria'),
      t('DES_03', 'Evaluación de estrategia judicial'),
      t('DES_04', 'Evaluación de riesgo institucional'),
      t('DES_05', 'Definir estrategia: Devuelto al sector / Juicio iniciado'),
    ],
  },
  { codigo: 'EN_ANALISIS', label: 'En Análisis', siguiente: undefined, tareas: [] },
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
  DEVUELTO_SECTOR_B,
]

// ── CICLO: Demanda Civil — Parte Actora ──────────────────
export const ESTADOS_DEMANDA_CIVIL_ACTORA: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'INICIO', tareas: [] },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'TRABA_LITIS',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DCA_INI_01', 'Análisis inicial del expediente'), t('DCA_INI_02', 'Verificar competencia y jurisdicción'),
      t('DCA_INI_03', 'Preparar escrito de demanda'), t('DCA_INI_04', 'Adjuntar documental'), t('DCA_INI_05', 'Ofrecimiento de prueba'),
      t('DCA_INI_06', 'Presentación de demanda'), t('DCA_INI_07', 'Control de cargo judicial'), t('DCA_INI_08', 'Solicitar medidas cautelares si corresponde'),
      t('DCA_INI_09', 'Control de traslado al demandado'), t('DCA_INI_10', 'Análisis de contestación de demanda'),
      t('DCA_INI_11', 'Replanteo de prueba si corresponde'), t('DCA_INI_12', 'Presentación en sistema judicial'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'PRUEBA',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DCA_TL_01', 'Control de notificación de traslado'), t('DCA_TL_02', 'Control de plazos procesales'),
      t('DCA_TL_03', 'Presentación de documental complementaria'), t('DCA_TL_04', 'Seguimiento de excepciones si las hay'),
    ],
  },
  {
    codigo: 'PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATO',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DCA_PR_01', 'Producción de prueba documental'), t('DCA_PR_02', 'Seguimiento de peritos'),
      t('DCA_PR_03', 'Control de audiencias de prueba'), t('DCA_PR_04', 'Impulso procesal'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DCA_AL_01', 'Redacción de alegatos'), t('DCA_AL_02', 'Presentación de alegatos'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1° Instancia — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      t('DCA_S1F_01', 'Análisis de sentencia'), t('DCA_S1F_02', 'Liquidación judicial'),
      t('DCA_S1F_03', 'Notificación a área requirente'), t('DCA_S1F_04', 'Verificar cumplimiento voluntario'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1° Instancia — Desfavorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      t('DCA_S1D_01', 'Análisis de sentencia'), t('DCA_S1D_02', 'Evaluar viabilidad de apelación'),
      t('DCA_S1D_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DCA_AP_01', 'Redacción de memorial de agravios'), t('DCA_AP_02', 'Presentación de apelación'),
      t('DCA_AP_03', 'Control de elevación'), t('DCA_AP_04', 'Seguimiento de cámara'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2° Instancia — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DCA_S2F_01', 'Análisis de sentencia de cámara'), t('DCA_S2F_02', 'Liquidación judicial'),
      t('DCA_S2F_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2° Instancia — Desfavorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DCA_S2D_01', 'Análisis de sentencia'), t('DCA_S2D_02', 'Evaluar viabilidad de recurso extraordinario'),
      t('DCA_S2D_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DCA_REF_01', 'Redacción de REF'), t('DCA_REF_02', 'Presentación de REF'),
      t('DCA_REF_03', 'Control de admisibilidad'), t('DCA_REF_04', 'Seguimiento de CSJN'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    grupoCausal: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DCA_ES_01', 'Liquidación definitiva'), t('DCA_ES_02', 'Presentación de liquidación'),
      t('DCA_ES_03', 'Control de observaciones'), t('DCA_ES_04', 'Seguimiento de aprobación'),
      t('DCA_ES_05', 'Gestión de cobro'), t('DCA_ES_06', 'Verificar acreditación'),
      t('DCA_ES_07', 'Informar a Administración'), t('DCA_ES_08', 'Requerir fondos al Banco'),
      t('DCA_ES_09', 'Control de transferencia'), t('DCA_ES_10', 'Certificar cobro'),
      t('DCA_ES_11', 'Gestión de archivo'), t('DCA_ES_CAUSAL', 'Registrar causal de finalización'),
    ],
  },
  {
    codigo: 'FINALIZADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    tareas: [
      t('DCA_FIN_01', 'Archivo del expediente'), t('DCA_FIN_02', 'Notificación final a área requirente'),
      t('DCA_FIN_03', 'Registrar resultado'), t('DCA_FIN_04', 'Cierre en sistema'),
    ],
  },
]

// ── CICLO: Demanda Laboral — Parte Actora ────────────────
export const ESTADOS_DEMANDA_LABORAL_ACTORA: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'INICIO', tareas: [] },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'TRABA_LITIS',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DLA_INI_01', 'Análisis inicial del expediente'), t('DLA_INI_02', 'Verificar competencia — fuero laboral'),
      t('DLA_INI_03', 'Preparar escrito de demanda laboral'), t('DLA_INI_04', 'Adjuntar documental'),
      t('DLA_INI_05', 'Ofrecimiento de prueba'), t('DLA_INI_06', 'Presentación de demanda'),
      t('DLA_INI_07', 'Control de cargo judicial'), t('DLA_INI_08', 'Solicitar medidas cautelares si corresponde'),
      t('DLA_INI_09', 'Control de traslado al demandado'), t('DLA_INI_10', 'Análisis de contestación'),
      t('DLA_INI_11', 'Replanteo de prueba si corresponde'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'PRUEBA',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DLA_TL_01', 'Control de notificación de traslado'), t('DLA_TL_02', 'Control de plazos procesales'),
      t('DLA_TL_03', 'Presentación de documental complementaria'),
    ],
  },
  {
    codigo: 'PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATO',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DLA_PR_01', 'Producción de prueba documental'), t('DLA_PR_02', 'Control de peritos laborales'),
      t('DLA_PR_03', 'Control de audiencias'), t('DLA_PR_04', 'Impulso procesal'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    grupoCausal: 'PRE_SENTENCIA_1',
    tareas: [
      t('DLA_AL_01', 'Redacción de alegatos'), t('DLA_AL_02', 'Presentación de alegatos'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1° Instancia — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      t('DLA_S1F_01', 'Análisis de sentencia'), t('DLA_S1F_02', 'Liquidación judicial'),
      t('DLA_S1F_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1° Instancia — Desfavorable',
    siguiente: 'APELACION',
    grupoCausal: 'SENTENCIA_1',
    tareas: [
      t('DLA_S1D_01', 'Análisis de sentencia'), t('DLA_S1D_02', 'Evaluar viabilidad de apelación'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DLA_AP_01', 'Redacción de memorial'), t('DLA_AP_02', 'Presentación de apelación'),
      t('DLA_AP_03', 'Seguimiento de cámara laboral'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2° Instancia — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DLA_S2F_01', 'Análisis de sentencia de cámara'), t('DLA_S2F_02', 'Liquidación judicial'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2° Instancia — Desfavorable',
    siguiente: 'REF',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DLA_S2D_01', 'Análisis de sentencia'), t('DLA_S2D_02', 'Evaluar recurso extraordinario'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'EJECUCION_SENTENCIA',
    grupoCausal: 'INSTANCIA_RECURSIVA',
    tareas: [
      t('DLA_REF_01', 'Redacción de REF'), t('DLA_REF_02', 'Presentación de REF'),
      t('DLA_REF_03', 'Control de admisibilidad'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    grupoCausal: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DLA_ES_01', 'Liquidación definitiva'), t('DLA_ES_02', 'Presentación de liquidación'),
      t('DLA_ES_03', 'Control de observaciones'), t('DLA_ES_04', 'Seguimiento de aprobación'),
      t('DLA_ES_05', 'Gestión de cobro'), t('DLA_ES_06', 'Verificar acreditación'),
      t('DLA_ES_07', 'Informar a Administración'), t('DLA_ES_08', 'Requerir fondos'),
      t('DLA_ES_09', 'Control de transferencia'), t('DLA_ES_10', 'Certificar cobro'),
      t('DLA_ES_11', 'Gestión de archivo'), t('DLA_ES_CAUSAL', 'Registrar causal de finalización'),
    ],
  },
  {
    codigo: 'FINALIZADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    tareas: [
      t('DLA_FIN_01', 'Archivo del expediente'), t('DLA_FIN_02', 'Notificación final a área requirente'),
      t('DLA_FIN_03', 'Registrar resultado'), t('DLA_FIN_04', 'Cierre en sistema'),
    ],
  },
]

// ── CICLO: Lanzamiento Judicializado (MATRIZ SACO) ───────
// Split Operativo/Comercial (ver getSiguienteLanzamiento en
// DetalleExpediente.page.tsx) + bifurcación por vulnerabilidad
// desde CONSTATACION_JUDICIAL (ver RAMIFICACIONES_POR_CODIGO).
// Circuito completo (Operativo, con vulnerables):
//   ASIGNADO → INICIO → CONSTATACION_JUDICIAL
//     → TRASLADO_DEFENSOR_OFICIAL → TRABA_LITIS → SENTENCIA_LANZAMIENTO
//     → APELACION_LANZ → SENTENCIA_CAMARA → REF_LANZ → SENTENCIA_FIRME
//     → MANDAMIENTO_LIBRADO → LANZAMIENTO_EFECTIVIZADO → TERMINADO
// Circuito Comercial (salto directo, ver PASO 4):
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
      t('LJ_INI_01', 'Análisis de antecedentes del inmueble'),
      t('LJ_INI_02', 'Verificar documentación respaldatoria'),
    ],
  },
  {
    codigo: 'CONSTATACION_JUDICIAL',
    label: 'Constatación Judicial',
    siguiente: 'SENTENCIA_LANZAMIENTO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_CJ_01', 'Solicitar constatación judicial'),
      t('LJ_CJ_02', 'Registrar resultado de constatación'),
      t('LJ_CJ_03', 'Verificar presencia de personas vulnerables (menores/embarazadas/discapacidad)'),
    ],
  },
  {
    codigo: 'TRASLADO_DEFENSOR_OFICIAL',
    label: 'Traslado a Defensor Oficial (con vulnerables)',
    siguiente: 'TRABA_LITIS',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_TDO_01', 'Notificar traslado a Defensor Oficial'),
      t('LJ_TDO_02', 'Aguardar toma de intervención'),
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'SENTENCIA_LANZAMIENTO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_TL_01', 'Control de traslados'),
      t('LJ_TL_02', 'Seguimiento de resoluciones del Defensor Oficial'),
    ],
  },
  {
    codigo: 'SENTENCIA_LANZAMIENTO',
    label: 'Sentencia de Lanzamiento (sin vulnerables — directo)',
    siguiente: 'APELACION_LANZ',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_SL_01', 'Control de dictado de sentencia de lanzamiento'),
      t('LJ_SL_02', 'Notificar a las partes'),
    ],
  },
  {
    codigo: 'APELACION_LANZ',
    label: 'Apelación',
    siguiente: 'SENTENCIA_CAMARA',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_AP_01', 'Notificación para expresar agravios (Defensor Oficial u otra parte)'),
      t('LJ_AP_02', 'Redacción de recurso'),
    ],
  },
  {
    codigo: 'SENTENCIA_CAMARA',
    label: 'Sentencia de Cámara',
    siguiente: 'REF_LANZ',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_SC_01', 'Control de dictado de sentencia de Cámara'),
    ],
  },
  {
    codigo: 'REF_LANZ',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'SENTENCIA_FIRME',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_REF_01', 'Presentación del Recurso Extraordinario Federal'),
      t('LJ_REF_02', 'Seguimiento (no suspende el trámite)'),
    ],
  },
  {
    codigo: 'SENTENCIA_FIRME',
    label: 'Sentencia Firme',
    siguiente: 'MANDAMIENTO_LIBRADO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_SF_01', 'Control de firmeza de la sentencia'),
    ],
  },
  {
    codigo: 'MANDAMIENTO_LIBRADO',
    label: 'Mandamiento Librado',
    siguiente: 'LANZAMIENTO_EFECTIVIZADO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_ML_01', 'Solicitar libramiento de mandamiento'),
      t('LJ_ML_02', 'Coordinar con Fuerzas de Seguridad'),
    ],
  },
  {
    codigo: 'LANZAMIENTO_EFECTIVIZADO',
    label: 'Lanzamiento Efectivizado',
    siguiente: 'TERMINADO',
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_LE_01', 'Registrar acta de lanzamiento efectivizado'),
      t('LJ_LE_02', 'Notificar a Infraestructura la recuperación del inmueble'),
    ],
  },
  {
    codigo: 'TERMINADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    grupoCausal: 'LANZAMIENTO',
    tareas: [
      t('LJ_TER_01', 'Registrar causal de finalización'),
    ],
  },
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
}

export function getEstadosProcesales(tipo: string): EstadoProcesal[] {
  return ESTADOS_PROCESALES[tipo] ?? ESTADOS_GENERICOS
}

export function getEstadoProcesal(tipo: string, codigo: string): EstadoProcesal | undefined {
  return getEstadosProcesales(tipo).find(e => e.codigo === codigo)
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
