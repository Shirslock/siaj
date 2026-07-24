import type { EstadoProcesal, UrgenciaTarea } from '../types'

// ── DEMANDA CIVIL — ciclo completo ──────────────────────
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
    tareas: [
      { id: 'DC_INI_01', nombre: 'Análisis inicial de la demanda',             estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_02', nombre: 'Interposición de revocatoria',               estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_03', nombre: 'Definición de plazo para contestar demanda', estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_04', nombre: 'Revisión integral del expediente',           estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_05', nombre: 'Interposición de caducidad',                 estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_06', nombre: 'Contestación de demanda',                    estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_07', nombre: 'Redacción de defensa de fondo',              estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_08', nombre: 'Planteo de excepciones',                     estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_09', nombre: 'Oposiciones',                                estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_10', nombre: 'Requerir citación de terceros',              estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_11', nombre: 'Ofrecimiento de prueba',                     estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_12', nombre: 'Documental',                                 estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_13', nombre: 'Testimonial — Propuestos por SOFSA',         estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_14', nombre: 'Pericial',                                   estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_15', nombre: 'Informativa',                                estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_16', nombre: 'Presentación en sistema judicial',           estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'EN_PRUEBA',
    tareas: [
      { id: 'DC_TL_01', nombre: 'Notificación de traslado',         estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_TL_02', nombre: 'Control de plazos procesales',     estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_TL_03', nombre: 'Presentación de documentación',    estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'EN_PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATOS',
    tareas: [
      { id: 'DC_EP_01', nombre: 'Producción de prueba documental',  estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_EP_02', nombre: 'Seguimiento de peritos',           estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_EP_03', nombre: 'Control de audiencias de prueba',  estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'ALEGATOS',
    label: 'Alegatos',
    siguiente: 'SENTENCIA',
    tareas: [
      { id: 'DC_AL_01', nombre: 'Redacción de alegatos',            estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_AL_02', nombre: 'Presentación de alegatos',         estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'SENTENCIA',
    label: 'Sentencia',
    siguiente: 'CERRADO',
    tareas: [
      { id: 'DC_SE_01', nombre: 'Análisis de sentencia',            estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_SE_02', nombre: 'Recursos ordinarios',              estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_SE_03', nombre: 'Notificación a área requirente',   estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'CERRADO',
    label: 'Cerrado',
    siguiente: undefined,
    tareas: [
      { id: 'DC_CE_01', nombre: 'Archivo del expediente',           estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
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
    tareas: [
      t('DCA_TL_01', 'Control de notificación de traslado'), t('DCA_TL_02', 'Control de plazos procesales'),
      t('DCA_TL_03', 'Presentación de documental complementaria'), t('DCA_TL_04', 'Seguimiento de excepciones si las hay'),
    ],
  },
  {
    codigo: 'PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATO',
    tareas: [
      t('DCA_PR_01', 'Producción de prueba documental'), t('DCA_PR_02', 'Seguimiento de peritos'),
      t('DCA_PR_03', 'Control de audiencias de prueba'), t('DCA_PR_04', 'Impulso procesal'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    tareas: [
      t('DCA_AL_01', 'Redacción de alegatos'), t('DCA_AL_02', 'Presentación de alegatos'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1ª — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DCA_S1F_01', 'Análisis de sentencia'), t('DCA_S1F_02', 'Liquidación judicial'),
      t('DCA_S1F_03', 'Notificación a área requirente'), t('DCA_S1F_04', 'Verificar cumplimiento voluntario'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1ª — Desfavorable',
    siguiente: 'APELACION',
    tareas: [
      t('DCA_S1D_01', 'Análisis de sentencia'), t('DCA_S1D_02', 'Evaluar viabilidad de apelación'),
      t('DCA_S1D_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    tareas: [
      t('DCA_AP_01', 'Redacción de memorial de agravios'), t('DCA_AP_02', 'Presentación de apelación'),
      t('DCA_AP_03', 'Control de elevación'), t('DCA_AP_04', 'Seguimiento de cámara'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2ª — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DCA_S2F_01', 'Análisis de sentencia de cámara'), t('DCA_S2F_02', 'Liquidación judicial'),
      t('DCA_S2F_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2ª — Desfavorable',
    siguiente: 'REF',
    tareas: [
      t('DCA_S2D_01', 'Análisis de sentencia'), t('DCA_S2D_02', 'Evaluar viabilidad de recurso extraordinario'),
      t('DCA_S2D_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'RECURSO_QUEJA',
    tareas: [
      t('DCA_REF_01', 'Redacción de REF'), t('DCA_REF_02', 'Presentación de REF'),
      t('DCA_REF_03', 'Control de admisibilidad'), t('DCA_REF_04', 'Seguimiento de CSJN'),
    ],
  },
  {
    codigo: 'RECURSO_QUEJA',
    label: 'Recurso de Queja',
    siguiente: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DCA_RQ_01', 'Redacción de queja'), t('DCA_RQ_02', 'Presentación de queja'),
      t('DCA_RQ_03', 'Seguimiento de resolución'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    tareas: [
      t('DCA_ES_01', 'Liquidación definitiva'), t('DCA_ES_02', 'Presentación de liquidación'),
      t('DCA_ES_03', 'Control de observaciones'), t('DCA_ES_04', 'Seguimiento de aprobación'),
      t('DCA_ES_05', 'Gestión de cobro'), t('DCA_ES_06', 'Verificar acreditación'),
      t('DCA_ES_07', 'Informar a Administración'), t('DCA_ES_08', 'Requerir fondos al Banco'),
      t('DCA_ES_09', 'Control de transferencia'), t('DCA_ES_10', 'Certificar cobro'),
      t('DCA_ES_11', 'Gestión de archivo'),
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
    tareas: [
      t('DLA_TL_01', 'Control de notificación de traslado'), t('DLA_TL_02', 'Control de plazos procesales'),
      t('DLA_TL_03', 'Presentación de documental complementaria'),
    ],
  },
  {
    codigo: 'PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATO',
    tareas: [
      t('DLA_PR_01', 'Producción de prueba documental'), t('DLA_PR_02', 'Control de peritos laborales'),
      t('DLA_PR_03', 'Control de audiencias'), t('DLA_PR_04', 'Impulso procesal'),
    ],
  },
  {
    codigo: 'ALEGATO',
    label: 'Alegatos',
    siguiente: 'SENTENCIA_1_FAV',
    tareas: [
      t('DLA_AL_01', 'Redacción de alegatos'), t('DLA_AL_02', 'Presentación de alegatos'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_FAV',
    label: 'Sentencia 1ª — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DLA_S1F_01', 'Análisis de sentencia'), t('DLA_S1F_02', 'Liquidación judicial'),
      t('DLA_S1F_03', 'Notificación a área requirente'),
    ],
  },
  {
    codigo: 'SENTENCIA_1_DESFAV',
    label: 'Sentencia 1ª — Desfavorable',
    siguiente: 'APELACION',
    tareas: [
      t('DLA_S1D_01', 'Análisis de sentencia'), t('DLA_S1D_02', 'Evaluar viabilidad de apelación'),
    ],
  },
  {
    codigo: 'APELACION',
    label: 'Apelación',
    siguiente: 'SENTENCIA_2_FAV',
    tareas: [
      t('DLA_AP_01', 'Redacción de memorial'), t('DLA_AP_02', 'Presentación de apelación'),
      t('DLA_AP_03', 'Seguimiento de cámara laboral'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2ª — Favorable',
    siguiente: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DLA_S2F_01', 'Análisis de sentencia de cámara'), t('DLA_S2F_02', 'Liquidación judicial'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2ª — Desfavorable',
    siguiente: 'REF',
    tareas: [
      t('DLA_S2D_01', 'Análisis de sentencia'), t('DLA_S2D_02', 'Evaluar recurso extraordinario'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'EJECUCION_SENTENCIA',
    tareas: [
      t('DLA_REF_01', 'Redacción de REF'), t('DLA_REF_02', 'Presentación de REF'),
      t('DLA_REF_03', 'Control de admisibilidad'),
    ],
  },
  {
    codigo: 'EJECUCION_SENTENCIA',
    label: 'Ejecución de Sentencia',
    siguiente: 'FINALIZADO',
    tareas: [
      t('DLA_ES_01', 'Liquidación definitiva'), t('DLA_ES_02', 'Presentación de liquidación'),
      t('DLA_ES_03', 'Control de observaciones'), t('DLA_ES_04', 'Seguimiento de aprobación'),
      t('DLA_ES_05', 'Gestión de cobro'), t('DLA_ES_06', 'Verificar acreditación'),
      t('DLA_ES_07', 'Informar a Administración'), t('DLA_ES_08', 'Requerir fondos'),
      t('DLA_ES_09', 'Control de transferencia'), t('DLA_ES_10', 'Certificar cobro'),
      t('DLA_ES_11', 'Gestión de archivo'),
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

// ── CICLO: Lanzamiento Judicializado ─────────────────────
export const ESTADOS_LANZAMIENTO_JUDICIALIZADO: EstadoProcesal[] = [
  { codigo: 'ASIGNADO', label: 'Asignado', siguiente: 'INICIO', tareas: [] },
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'SENTENCIA_LANZAMIENTO',
    tareas: [
      t('LJ_INI_01', 'Reunir documental respaldatoria y antecedentes — vinculación con el lanzamiento'),
      t('LJ_INI_02', 'Presentación en sistema judicial — sorteo de causa'),
      t('LJ_INI_03', 'Carga de número de causa judicial'),
      t('LJ_INI_04', 'Carga de juzgado / fuero / jurisdicción — objeto'),
      t('LJ_INI_05', 'Vincular escrito de demanda presentado'),
      t('LJ_INI_06', 'Control de primer proveído'),
      t('LJ_INI_07', 'Control de proveído inicial'),
      t('LJ_INI_08', 'Aclarar o ampliar lo que corresponde'),
      t('LJ_INI_09', 'Pago de Bono Profesional'),
      t('LJ_INI_10', 'Control de plazo — 3 meses'),
    ],
  },
  {
    codigo: 'SENTENCIA_LANZAMIENTO',
    label: 'Sentencia de Lanzamiento',
    siguiente: 'SENTENCIA_2_FAV',
    tareas: [
      t('LJ_SL_01', 'Se libra el mandamiento'),
      t('LJ_SL_02', 'Diligenciamiento del mandamiento'),
      t('LJ_SL_03', 'Ejecución de la medida'),
      t('LJ_SL_04', 'Depositario de bienes (sí/no)'),
      t('LJ_SL_05', 'Presentación del defensor oficial (sí/no)'),
      t('LJ_SL_06', 'Subir al sistema el mandamiento diligenciado'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_FAV',
    label: 'Sentencia 2ª — Favorable',
    siguiente: 'FINALIZADO',
    tareas: [
      t('LJ_S2F_01', 'Control de dictado de sentencia'),
      t('LJ_S2F_02', 'Análisis del fallo — recurso de aclaratoria (3 días)'),
      t('LJ_S2F_03', 'Subir al sistema la sentencia de segunda instancia'),
    ],
  },
  {
    codigo: 'SENTENCIA_2_DESFAV',
    label: 'Sentencia 2ª — Desfavorable',
    siguiente: 'REF',
    tareas: [
      t('LJ_S2D_01', 'Control de dictado de sentencia'),
      t('LJ_S2D_02', 'Análisis del fallo — recurso de aclaratoria (3 días)'),
      t('LJ_S2D_03', 'Evaluación de responsabilidad'),
      t('LJ_S2D_04', 'Subir al sistema la sentencia de segunda instancia'),
    ],
  },
  {
    codigo: 'REF',
    label: 'Recurso Extraordinario Federal',
    siguiente: 'FINALIZADO',
    tareas: [
      t('LJ_REF_01', 'Análisis de procedencia (10 días)'),
      t('LJ_REF_02', 'Redacción del recurso extraordinario'),
      t('LJ_REF_03', 'Presentación en sistema judicial y subir escrito presentado'),
      t('LJ_REF_04', 'Control formal del recurso'),
      t('LJ_REF_05', 'Seguimiento de concesión o denegación'),
    ],
  },
  {
    codigo: 'FINALIZADO',
    label: 'Finalizado',
    siguiente: undefined,
    esArchivado: true,
    tareas: [
      t('LJ_FIN_01', 'Verificar cumplimiento total'),
      t('LJ_FIN_02', 'Verificar cobro / imposibilidad de cobro'),
      t('LJ_FIN_03', 'Registrar resultado final'),
      t('LJ_FIN_04', 'Archivo judicial si corresponde'),
      t('LJ_FIN_05', 'Archivo interno'),
    ],
  },
]

// ── Mapa general tipo → estados ─────────────────────────
const ESTADOS_PROCESALES: Partial<Record<string, EstadoProcesal[]>> = {
  DEMANDA_CIVIL:             ESTADOS_DEMANDA_CIVIL,
  DEMANDA_LABORAL:           ESTADOS_DEMANDA_CIVIL,
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
