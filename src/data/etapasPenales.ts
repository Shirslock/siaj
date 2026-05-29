import type { EtapaPenal, SubActividadPenal, CampoPenal } from '../types'

// ── Campos comunes reutilizables ─────────────────────

const ORG: CampoPenal = {
  id: 'organismo', label: 'Organismo Judicial Interviniente', type: 'text', full: true,
}
const OBS: CampoPenal = {
  id: 'observaciones', label: 'Observaciones', type: 'textarea', full: true,
}
const PLAZO_APELAR: CampoPenal = {
  id: 'plazo_apelar', label: 'Plazo para Apelar', type: 'text',
}
const SENTENCIA_FIRME: CampoPenal = {
  id: 'sentencia_firme', label: 'Sentencia Firme', type: 'select', options: ['SI', 'NO'],
}
const MONTO: CampoPenal = {
  id: 'monto', label: 'Monto', type: 'money',
}
const TAREAS_COM: CampoPenal = {
  id: 'tareas_comunitarias', label: 'Tareas Comunitarias', type: 'text',
}
const MOTIVOS: CampoPenal = {
  id: 'motivos', label: 'Motivos', type: 'textarea', full: true,
}
const UPLOAD_ACUERDO: CampoPenal = {
  id: 'acuerdo_doc', label: 'Subir Acuerdo (Documento)', type: 'upload',
}
const UPLOAD_NO_ACUERDO: CampoPenal = {
  id: 'no_acuerdo_doc', label: 'Subir No Acuerdo (Documento)', type: 'upload',
}
const UPLOAD_RESOLUCION: CampoPenal = {
  id: 'resolucion', label: 'Subir Resolución', type: 'upload',
}

// ── Sub-actividades Instrucción (5.1 – 5.15) ─────────

const SUB_5_1: SubActividadPenal = {
  id: 'INS_5_1', numero: '5.1', nombre: 'Datos Imputados', tipo: 'LIBRE',
  camposLibres: [
    { id: 'datos_imputados', label: 'Datos del imputado (campo a completar)', type: 'textarea', full: true },
    { id: 'delegada_196', label: 'Delegada por Art. 196 CPPN', type: 'select', options: ['SI', 'NO'] },
    ORG,
  ],
}

const SUB_5_2: SubActividadPenal = {
  id: 'INS_5_2', numero: '5.2', nombre: 'Declaración Indagatoria', tipo: 'SI_NO',
  camposSI: [
    { id: 'citaciones', label: 'Llamado a Indagatoria — Subir citaciones', type: 'upload' },
    { id: 'presentacion_espontanea', label: 'Presentación Espontánea', type: 'date' },
    { id: 'declaraciones', label: 'Indagatoria — Subir declaraciones', type: 'upload' },
    ORG,
  ],
}

const SUB_5_3: SubActividadPenal = {
  id: 'INS_5_3', numero: '5.3', nombre: 'Prueba', tipo: 'SI_NO',
  camposSI: [
    { id: 'documentacion', label: 'Subir Documentación', type: 'upload' },
    ORG,
  ],
}

const SUB_5_4: SubActividadPenal = {
  id: 'INS_5_4', numero: '5.4', nombre: 'Conciliación', tipo: 'ACUERDO',
  camposHayAcuerdo: [UPLOAD_ACUERDO, ORG, MONTO, TAREAS_COM, MOTIVOS],
  camposNoAcuerdo:  [UPLOAD_NO_ACUERDO, ORG, MOTIVOS],
}

const SUB_5_5: SubActividadPenal = {
  id: 'INS_5_5', numero: '5.5', nombre: 'Reparación Integral', tipo: 'ACUERDO',
  camposHayAcuerdo: [UPLOAD_ACUERDO, ORG, MONTO, TAREAS_COM, MOTIVOS],
  camposNoAcuerdo:  [UPLOAD_NO_ACUERDO, ORG, MOTIVOS],
}

const SUB_5_6: SubActividadPenal = {
  id: 'INS_5_6', numero: '5.6', nombre: 'Suspensión del Juicio a Prueba (Probation)', tipo: 'SI_NO',
  camposSI: [
    { id: 'resolucion_acuerdo',    label: 'Acuerdo — Opinión no vinculante — Subir resolución',     type: 'upload' },
    { id: 'resolucion_desacuerdo', label: 'En desacuerdo — Opinión no vinculante — Subir resolución', type: 'upload' },
    { id: 'plazo_cumplimiento',    label: 'Plazo de Cumplimiento', type: 'text' },
    ORG, MONTO, TAREAS_COM, MOTIVOS,
  ],
  camposNO: [UPLOAD_RESOLUCION, ORG, MOTIVOS],
}

const SUB_5_7: SubActividadPenal = {
  id: 'INS_5_7', numero: '5.7', nombre: 'Procesamiento', tipo: 'SI_NO',
  camposSI: [
    { id: 'resolucion', label: 'Resolución de Procesamiento — Agregar archivo', type: 'upload' },
    ORG, OBS, PLAZO_APELAR, SENTENCIA_FIRME,
  ],
}

const SUB_5_8: SubActividadPenal = {
  id: 'INS_5_8', numero: '5.8', nombre: 'Sobreseimiento', tipo: 'SI_NO', finalizaCausa: true,
  camposSI: [
    { id: 'resolucion', label: 'Resolución Sobreseimiento — Agregar archivo', type: 'upload' },
    ORG, OBS, PLAZO_APELAR, SENTENCIA_FIRME,
  ],
}

const SUB_5_9: SubActividadPenal = {
  id: 'INS_5_9', numero: '5.9', nombre: 'Falta de Mérito', tipo: 'SI_NO',
  camposSI: [
    { id: 'resolucion', label: 'Resolución Falta de Mérito — Agregar archivo', type: 'upload' },
    ORG, OBS, PLAZO_APELAR,
  ],
}

const SUB_5_10: SubActividadPenal = {
  id: 'INS_5_10', numero: '5.10', nombre: 'Instrucción Complementaria', tipo: 'SI_NO',
  camposSI: [
    { id: 'resolucion',   label: 'Subir Resolución', type: 'upload' },
    ORG,
    { id: 'nueva_prueba', label: 'Nueva Prueba Producida — Subir Documental', type: 'upload' },
    OBS,
  ],
}

const SUB_5_11: SubActividadPenal = {
  id: 'INS_5_11', numero: '5.11', nombre: 'Elevación a Juicio', tipo: 'SI_NO', avanzaEtapa: 'JUICIO',
  camposSI: [
    { id: 'resolucion', label: 'Subir Resolución Auto de Elevación a Juicio', type: 'upload' },
    ORG, OBS, PLAZO_APELAR, SENTENCIA_FIRME,
  ],
}

const SUB_5_12: SubActividadPenal = {
  id: 'INS_5_12', numero: '5.12', nombre: 'Prescripción de Acción Penal', tipo: 'SI_NO', finalizaCausa: true,
  camposSI: [
    { id: 'escrito',    label: 'Plantea Prescripción — Subir escrito', type: 'upload' },
    ORG,
    { id: 'resolucion', label: 'Resolución favorable o desfavorable — Subir escrito', type: 'upload' },
    PLAZO_APELAR, SENTENCIA_FIRME,
  ],
}

const SUB_5_13: SubActividadPenal = {
  id: 'INS_5_13', numero: '5.13', nombre: 'Recurso de Apelación', tipo: 'SI_NO',
  camposSI: [
    { id: 'presenta_apelacion',    label: '5.13.1 Presenta Apelación — Subir escrito',              type: 'upload' },
    ORG,
    { id: 'presenta_adhesion',     label: '5.13.2 Presenta Adhesión (Apelación) — Subir escrito',   type: 'upload' },
    { id: 'resolucion_concede',    label: '5.13.3 Resolución Concede Apelación — Subir resolución', type: 'upload' },
    { id: 'notificacion_454',      label: '5.13.4 Notificación Audiencia Art. 454 CPPN — Subir',    type: 'upload' },
    { id: 'asistencia_454',        label: 'Asistencia Audiencia Art. 454 CPPN — Oral',              type: 'date'   },
    { id: 'presentacion_memorial', label: 'Presentación de Memorial — Subir escrito',               type: 'upload' },
    { id: 'resolucion_memorial',   label: 'Resolución Audiencia 454 CPPN — Memorial',               type: 'upload' },
    { id: 'resolucion_no_concede', label: '5.13.5 Resolución No Concede Apelación — Subir escrito', type: 'upload' },
  ],
}

const SUB_5_14: SubActividadPenal = {
  id: 'INS_5_14', numero: '5.14', nombre: 'Recurso de Queja', tipo: 'SI_NO',
  camposSI: [
    { id: 'recurso',    label: 'Presenta Recurso de Queja — Subir escrito',   type: 'upload' },
    { id: 'resolucion', label: 'Resolución Recurso de Queja — Subir resolución', type: 'upload' },
    ORG,
  ],
}

const SUB_5_15: SubActividadPenal = {
  id: 'INS_5_15', numero: '5.15', nombre: 'Recurso de Casación', tipo: 'SI_NO',
  camposSI: [
    { id: 'recurso',    label: 'Presenta Recurso de Casación — Subir escrito',   type: 'upload' },
    { id: 'resolucion', label: 'Resolución Recurso de Casación — Subir resolución', type: 'upload' },
    ORG,
  ],
}

// Recursos reutilizados en Juicio (id con prefijo JUI_)
const RECURSOS_JUICIO: SubActividadPenal[] = [
  { ...SUB_5_9,  id: 'JUI_5_9'  },
  { ...SUB_5_10, id: 'JUI_5_10' },
  { ...SUB_5_12, id: 'JUI_5_12' },
  { ...SUB_5_13, id: 'JUI_5_13' },
  { ...SUB_5_14, id: 'JUI_5_14' },
  { ...SUB_5_15, id: 'JUI_5_15' },
]

// ── Sub-actividades Juicio (6.1 – 6.7) ───────────────

const SUB_6_1: SubActividadPenal = {
  id: 'JUI_6_1', numero: '6.1', nombre: 'Audiencia de Debate ante Tribunal Oral', tipo: 'SI_NO',
  camposSI: [
    { id: 'notificacion', label: 'Notificación Audiencia de Debate', type: 'date'   },
    { id: 'asistencia',   label: 'Asistencia Audiencia de Debate',   type: 'date'   },
    { id: 'documental',   label: 'Subir Documental',                 type: 'upload' },
    OBS, ORG,
  ],
}

const SUB_6_2: SubActividadPenal = {
  id: 'JUI_6_2', numero: '6.2', nombre: 'Prueba', tipo: 'SI_NO',
  camposSI: [
    { id: 'documentacion', label: 'Subir Documentación', type: 'upload' },
    ORG,
  ],
}

const SUB_6_3: SubActividadPenal = {
  id: 'JUI_6_3', numero: '6.3', nombre: 'Conciliación', tipo: 'ACUERDO',
  camposHayAcuerdo: [UPLOAD_ACUERDO, ORG, MONTO, TAREAS_COM, MOTIVOS],
  camposNoAcuerdo:  [UPLOAD_NO_ACUERDO, ORG, MOTIVOS],
}

const SUB_6_4: SubActividadPenal = {
  id: 'JUI_6_4', numero: '6.4', nombre: 'Reparación Integral', tipo: 'ACUERDO',
  camposHayAcuerdo: [UPLOAD_ACUERDO, ORG, MONTO, TAREAS_COM, MOTIVOS],
  camposNoAcuerdo:  [UPLOAD_NO_ACUERDO, ORG, MOTIVOS],
}

const SUB_6_5: SubActividadPenal = {
  id: 'JUI_6_5', numero: '6.5', nombre: 'Suspensión del Juicio a Prueba (Probation)', tipo: 'SI_NO',
  camposSI: [
    { id: 'resolucion_acuerdo',    label: 'Acuerdo — Opinión no vinculante — Subir resolución',      type: 'upload' },
    { id: 'resolucion_desacuerdo', label: 'En desacuerdo — Opinión no vinculante — Subir resolución', type: 'upload' },
    { id: 'plazo_cumplimiento',    label: 'Plazo de Cumplimiento', type: 'text' },
    ORG, MONTO, TAREAS_COM, MOTIVOS,
  ],
  camposNO: [UPLOAD_RESOLUCION, ORG, MOTIVOS],
}

const SUB_6_6: SubActividadPenal = {
  id: 'JUI_6_6', numero: '6.6', nombre: 'Condena', tipo: 'LIBRE', avanzaEtapa: 'EJECUCION_PENAL',
  camposLibres: [
    { id: 'resolucion', label: 'Resolución de Condena — Agregar archivo', type: 'upload' },
    MOTIVOS,
    { id: 'pena', label: 'Pena', type: 'text' },
    PLAZO_APELAR, SENTENCIA_FIRME,
  ],
}

const SUB_6_7: SubActividadPenal = {
  id: 'JUI_6_7', numero: '6.7', nombre: 'Absolución', tipo: 'LIBRE', finalizaCausa: true,
  camposLibres: [
    { id: 'resolucion', label: 'Resolución de Absolución — Agregar archivo', type: 'upload' },
    MOTIVOS, PLAZO_APELAR, SENTENCIA_FIRME,
  ],
}

// ── Sub-actividades Ejecución Penal (7.1) ─────────────

const SUB_7_1: SubActividadPenal = {
  id: 'EJE_7_1', numero: '7.1', nombre: 'Sentencia de Ejecución', tipo: 'SI_NO',
  camposSI: [
    { id: 'sentencia',          label: 'Sentencia de Ejecución — Agregar archivo', type: 'upload'   },
    MOTIVOS,
    { id: 'detalle',            label: 'Detalle',                                  type: 'textarea', full: true },
    { id: 'plazo_cumplimiento', label: 'Plazo de Cumplimiento',                    type: 'text'     },
  ],
}

// ── Sub-actividades Archivo (8.1, 8.2) ───────────────

const SUB_8_1: SubActividadPenal = {
  id: 'ARC_8_1', numero: '8.1', nombre: 'Reserva de las Actuaciones', tipo: 'SI_NO',
  camposSI: [
    { id: 'resolucion',  label: 'Resolución de Reserva de Actuaciones — Agregar archivo', type: 'upload'   },
    { id: 'fundamentos', label: 'Fundamentos',                                            type: 'textarea', full: true },
    ORG,
  ],
}

const SUB_8_2: SubActividadPenal = {
  id: 'ARC_8_2', numero: '8.2', nombre: 'Archivo de Causa', tipo: 'SI_NO', finalizaCausa: true,
  camposSI: [
    { id: 'resolucion',  label: 'Resolución de Archivo de Causa — Agregar archivo', type: 'upload'   },
    { id: 'fundamentos', label: 'Fundamentos',                                      type: 'textarea', full: true },
    ORG,
  ],
}

// ── Etapas completas QUERELLA ─────────────────────────

export const ETAPAS_QUERELLA: EtapaPenal[] = [
  {
    // numero: 0 — excluido del stepper visual
    codigo: 'ASIGNADO', label: 'Asignado', numero: 0,
    siguiente: 'EN_ANALISIS',
    subActividades: [],
  },
  {
    codigo: 'EN_ANALISIS', label: 'En Análisis', numero: 1,
    siguiente: 'ACEPTADO',
    subActividades: [],
  },
  {
    codigo: 'ACEPTADO', label: 'Aceptado', numero: 2,
    siguiente: 'INSTRUCCION',
    subActividades: [
      {
        id: 'ACE_3_1', numero: '3.1', nombre: 'Se presenta como parte querellante', tipo: 'LIBRE',
        camposLibres: [
          { id: 'escrito', label: 'Presentación de escrito — Subir escrito', type: 'upload' },
          { id: 'fecha',   label: 'Fecha',                                   type: 'date'   },
        ],
      },
      {
        id: 'ACE_3_2', numero: '3.2', nombre: 'Poder especial para querellar', tipo: 'SI_NO',
        camposSI: [
          { id: 'poder',         label: 'Subir Poder',                                            type: 'upload' },
          { id: 'fecha',         label: 'Fecha',                                                  type: 'date'   },
          { id: 'escrito_tenido', label: 'Presentación de escrito (ser tenido como parte) — Subir', type: 'upload' },
        ],
        camposNO: [
          { id: 'falta_poder', label: 'Falta Poder', type: 'text' },
        ],
      },
    ],
  },
  {
    // numero: -1 — rama alternativa, excluida del stepper
    codigo: 'RECHAZADO', label: 'Rechazado', numero: -1,
    subActividades: [
      {
        id: 'REC_4_1', numero: '4.1', nombre: 'No se presenta como parte querellante', tipo: 'LIBRE',
        camposLibres: [
          MOTIVOS,
          { id: 'fecha', label: 'Fecha', type: 'date' },
        ],
      },
    ],
  },
  {
    codigo: 'INSTRUCCION', label: 'Instrucción', numero: 3,
    siguiente: 'JUICIO',
    subActividades: [
      SUB_5_1, SUB_5_2, SUB_5_3, SUB_5_4, SUB_5_5,
      SUB_5_6, SUB_5_7, SUB_5_8, SUB_5_9, SUB_5_10,
      SUB_5_11, SUB_5_12, SUB_5_13, SUB_5_14, SUB_5_15,
    ],
  },
  {
    codigo: 'JUICIO', label: 'Juicio', numero: 4,
    siguiente: 'EJECUCION_PENAL',
    subActividades: [
      SUB_6_1, SUB_6_2, SUB_6_3, SUB_6_4,
      SUB_6_5, SUB_6_6, SUB_6_7,
      ...RECURSOS_JUICIO,
    ],
  },
  {
    codigo: 'EJECUCION_PENAL', label: 'Ejecución Penal', numero: 5,
    siguiente: 'ARCHIVO',
    subActividades: [SUB_7_1],
  },
  {
    codigo: 'ARCHIVO', label: 'Archivo', numero: 6,
    subActividades: [SUB_8_1, SUB_8_2],
  },
]

// ── Helpers de acceso ─────────────────────────────────

export function getEtapasPenales(_tipo: string): EtapaPenal[] {
  return ETAPAS_QUERELLA
}

export function getEtapaPenal(tipo: string, codigo: string): EtapaPenal | undefined {
  return getEtapasPenales(tipo).find(e => e.codigo === codigo)
}
