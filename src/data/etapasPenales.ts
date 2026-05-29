import type { EtapaPenal, CampoPenal, SubActividadPenal } from '../types'

// ── Campos comunes reutilizables ─────────────────────
const CAMPO_ORGANISMO: CampoPenal = {
  id: 'organismo', label: 'Organismo Judicial Interviniente', type: 'text', full: true,
}
const CAMPO_OBSERVACIONES: CampoPenal = {
  id: 'observaciones', label: 'Observaciones', type: 'textarea', full: true,
}
const CAMPO_PLAZO_APELAR: CampoPenal = {
  id: 'plazo_apelar', label: 'Plazo para Apelar', type: 'text',
}
const CAMPO_SENTENCIA_FIRME: CampoPenal = {
  id: 'sentencia_firme', label: 'Sentencia Firme', type: 'select', options: ['SI', 'NO'],
}
const CAMPO_FECHA_DOC: CampoPenal = {
  id: 'fecha', label: 'Fecha', type: 'date',
}
const CAMPO_MONTO: CampoPenal = {
  id: 'monto', label: 'Monto', type: 'money',
}
const CAMPO_TAREAS_COM: CampoPenal = {
  id: 'tareas_comunitarias', label: 'Tareas Comunitarias', type: 'text',
}
const CAMPO_MOTIVOS: CampoPenal = {
  id: 'motivos', label: 'Motivos', type: 'textarea', full: true,
}

// ── Sub-actividades de Instrucción (5.x) ─────────────

const SUB_INSTRUCCION: SubActividadPenal[] = [
  {
    id: 'INS_5_1', numero: '5.1', nombre: 'Datos Imputados', tipo: 'LIBRE',
    camposLibres: [
      { id: 'datos_imputados', label: 'Datos del imputado', type: 'textarea', full: true },
      { id: 'delegada_196', label: 'Delegada por Art. 196 CPPN', type: 'select', options: ['SI', 'NO'] },
      CAMPO_ORGANISMO,
    ],
  },
  {
    id: 'INS_5_2', numero: '5.2', nombre: 'Declaración Indagatoria', tipo: 'SI_NO',
    camposSI: [
      { id: 'citaciones', label: 'Llamado a Indagatoria — Subir citaciones', type: 'upload' },
      { id: 'presentacion_espontanea', label: 'Presentación Espontánea', type: 'date' },
      { id: 'declaraciones', label: 'Indagatoria — Subir declaraciones', type: 'upload' },
      CAMPO_ORGANISMO,
    ],
  },
  {
    id: 'INS_5_3', numero: '5.3', nombre: 'Prueba', tipo: 'SI_NO',
    camposSI: [
      { id: 'documentacion', label: 'Subir Documentación', type: 'upload' },
      CAMPO_ORGANISMO,
    ],
  },
  {
    id: 'INS_5_4', numero: '5.4', nombre: 'Conciliación', tipo: 'ACUERDO',
    camposHayAcuerdo: [
      { id: 'acuerdo_doc', label: 'Subir Acuerdo (Documento)', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MONTO, CAMPO_TAREAS_COM, CAMPO_MOTIVOS,
    ],
    camposNoAcuerdo: [
      { id: 'no_acuerdo_doc', label: 'Subir No Acuerdo (Documento)', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MOTIVOS,
    ],
  },
  {
    id: 'INS_5_5', numero: '5.5', nombre: 'Reparación Integral', tipo: 'ACUERDO',
    camposHayAcuerdo: [
      { id: 'acuerdo_doc', label: 'Subir Acuerdo (Documento)', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MONTO, CAMPO_TAREAS_COM, CAMPO_MOTIVOS,
    ],
    camposNoAcuerdo: [
      { id: 'no_acuerdo_doc', label: 'Subir No Acuerdo (Documento)', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MOTIVOS,
    ],
  },
  {
    id: 'INS_5_6', numero: '5.6', nombre: 'Suspensión del Juicio a Prueba (Probation)', tipo: 'SI_NO',
    camposSI: [
      { id: 'resolucion_acuerdo', label: 'Acuerdo — Opinión no vinculante — Subir resolución', type: 'upload' },
      { id: 'resolucion_desacuerdo', label: 'En desacuerdo — Opinión no vinculante — Subir resolución', type: 'upload' },
      { id: 'plazo_cumplimiento', label: 'Plazo de Cumplimiento', type: 'text' },
      CAMPO_ORGANISMO, CAMPO_MONTO, CAMPO_TAREAS_COM, CAMPO_MOTIVOS,
    ],
    camposNO: [
      { id: 'resolucion', label: 'Subir Resolución', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MOTIVOS,
    ],
  },
  {
    id: 'INS_5_7', numero: '5.7', nombre: 'Procesamiento', tipo: 'SI_NO',
    camposSI: [
      { id: 'resolucion', label: 'Resolución de Procesamiento — Agregar archivo', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_OBSERVACIONES, CAMPO_PLAZO_APELAR, CAMPO_SENTENCIA_FIRME,
    ],
  },
  {
    id: 'INS_5_8', numero: '5.8', nombre: 'Sobreseimiento', tipo: 'SI_NO', finalizaCausa: true,
    camposSI: [
      { id: 'resolucion', label: 'Resolución Sobreseimiento — Agregar archivo', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_OBSERVACIONES, CAMPO_PLAZO_APELAR, CAMPO_SENTENCIA_FIRME,
    ],
  },
  {
    id: 'INS_5_9', numero: '5.9', nombre: 'Falta de Mérito', tipo: 'SI_NO',
    camposSI: [
      { id: 'resolucion', label: 'Resolución Falta de Mérito — Agregar archivo', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_OBSERVACIONES, CAMPO_PLAZO_APELAR,
    ],
  },
  {
    id: 'INS_5_10', numero: '5.10', nombre: 'Instrucción Complementaria', tipo: 'SI_NO',
    camposSI: [
      { id: 'resolucion', label: 'Subir Resolución', type: 'upload' },
      CAMPO_ORGANISMO,
      { id: 'nueva_prueba', label: 'Nueva Prueba Producida — Subir Documental', type: 'upload' },
      CAMPO_OBSERVACIONES,
    ],
  },
  {
    id: 'INS_5_11', numero: '5.11', nombre: 'Elevación a Juicio', tipo: 'SI_NO', avanzaEtapa: 'JUICIO',
    camposSI: [
      { id: 'resolucion', label: 'Subir Resolución Auto de Elevación a Juicio', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_OBSERVACIONES, CAMPO_PLAZO_APELAR, CAMPO_SENTENCIA_FIRME,
    ],
  },
  {
    id: 'INS_5_12', numero: '5.12', nombre: 'Prescripción de Acción Penal', tipo: 'SI_NO', finalizaCausa: true,
    camposSI: [
      { id: 'escrito', label: 'Plantea Prescripción — Subir escrito', type: 'upload' },
      CAMPO_ORGANISMO,
      { id: 'resolucion', label: 'Resolución favorable o desfavorable — Subir escrito', type: 'upload' },
      CAMPO_PLAZO_APELAR, CAMPO_SENTENCIA_FIRME,
    ],
  },
  {
    id: 'INS_5_13', numero: '5.13', nombre: 'Recurso de Apelación', tipo: 'SI_NO',
    camposSI: [
      { id: 'presenta_apelacion', label: '5.13.1 Presenta Apelación — Subir escrito', type: 'upload' },
      CAMPO_ORGANISMO,
      { id: 'presenta_adhesion', label: '5.13.2 Presenta Adhesión (Apelación) — Subir escrito', type: 'upload' },
      { id: 'resolucion_concede', label: '5.13.3 Resolución Concede Apelación — Subir resolución', type: 'upload' },
      { id: 'notificacion_454', label: '5.13.4 Notificación Audiencia Art. 454 CPPN — Subir', type: 'upload' },
      { id: 'asistencia_454', label: 'Asistencia Audiencia Art. 454 CPPN — Oral', type: 'date' },
      { id: 'presentacion_memorial', label: 'Presentación de Memorial — Subir escrito', type: 'upload' },
      { id: 'resolucion_no_concede', label: '5.13.5 Resolución No Concede Apelación — Subir escrito', type: 'upload' },
    ],
  },
  {
    id: 'INS_5_14', numero: '5.14', nombre: 'Recurso de Queja', tipo: 'SI_NO',
    camposSI: [
      { id: 'recurso', label: 'Presenta Recurso de Queja — Subir escrito', type: 'upload' },
      { id: 'resolucion', label: 'Resolución Recurso de Queja — Subir resolución', type: 'upload' },
      CAMPO_ORGANISMO,
    ],
  },
  {
    id: 'INS_5_15', numero: '5.15', nombre: 'Recurso de Casación', tipo: 'SI_NO',
    camposSI: [
      { id: 'recurso', label: 'Presenta Recurso de Casación — Subir escrito', type: 'upload' },
      { id: 'resolucion', label: 'Resolución Recurso de Casación — Subir resolución', type: 'upload' },
      CAMPO_ORGANISMO,
    ],
  },
]

// ── Sub-actividades de Juicio (6.x) ──────────────────

const SUB_JUICIO: SubActividadPenal[] = [
  {
    id: 'JUI_6_1', numero: '6.1', nombre: 'Audiencia de Debate ante Tribunal Oral', tipo: 'SI_NO',
    camposSI: [
      { id: 'notificacion', label: 'Notificación Audiencia de Debate', type: 'date' },
      { id: 'asistencia', label: 'Asistencia Audiencia de Debate', type: 'date' },
      { id: 'documental', label: 'Subir Documental', type: 'upload' },
      CAMPO_OBSERVACIONES, CAMPO_ORGANISMO,
    ],
  },
  {
    id: 'JUI_6_2', numero: '6.2', nombre: 'Prueba', tipo: 'SI_NO',
    camposSI: [
      { id: 'documentacion', label: 'Subir Documentación', type: 'upload' },
      CAMPO_ORGANISMO,
    ],
  },
  {
    id: 'JUI_6_3', numero: '6.3', nombre: 'Conciliación', tipo: 'ACUERDO',
    camposHayAcuerdo: [
      { id: 'acuerdo_doc', label: 'Subir Acuerdo', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MONTO, CAMPO_TAREAS_COM, CAMPO_MOTIVOS,
    ],
    camposNoAcuerdo: [
      { id: 'no_acuerdo_doc', label: 'Subir No Acuerdo', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MOTIVOS,
    ],
  },
  {
    id: 'JUI_6_4', numero: '6.4', nombre: 'Reparación Integral', tipo: 'ACUERDO',
    camposHayAcuerdo: [
      { id: 'acuerdo_doc', label: 'Subir Acuerdo', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MONTO, CAMPO_TAREAS_COM, CAMPO_MOTIVOS,
    ],
    camposNoAcuerdo: [
      { id: 'no_acuerdo_doc', label: 'Subir No Acuerdo', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MOTIVOS,
    ],
  },
  {
    id: 'JUI_6_5', numero: '6.5', nombre: 'Suspensión del Juicio a Prueba (Probation)', tipo: 'SI_NO',
    camposSI: [
      { id: 'resolucion_acuerdo', label: 'Acuerdo — Opinión no vinculante — Subir resolución', type: 'upload' },
      { id: 'resolucion_desacuerdo', label: 'En desacuerdo — Opinión no vinculante — Subir resolución', type: 'upload' },
      { id: 'plazo_cumplimiento', label: 'Plazo de Cumplimiento', type: 'text' },
      CAMPO_ORGANISMO, CAMPO_MONTO, CAMPO_TAREAS_COM, CAMPO_MOTIVOS,
    ],
    camposNO: [
      { id: 'resolucion', label: 'Subir Resolución', type: 'upload' },
      CAMPO_ORGANISMO, CAMPO_MOTIVOS,
    ],
  },
  {
    id: 'JUI_6_6', numero: '6.6', nombre: 'Condena', tipo: 'LIBRE', avanzaEtapa: 'EJECUCION_PENAL',
    camposLibres: [
      { id: 'resolucion', label: 'Resolución de Condena — Agregar archivo', type: 'upload' },
      CAMPO_MOTIVOS,
      { id: 'pena', label: 'Pena', type: 'text' },
      CAMPO_PLAZO_APELAR, CAMPO_SENTENCIA_FIRME,
    ],
  },
  {
    id: 'JUI_6_7', numero: '6.7', nombre: 'Absolución', tipo: 'LIBRE', finalizaCausa: true,
    camposLibres: [
      { id: 'resolucion', label: 'Resolución de Absolución — Agregar archivo', type: 'upload' },
      CAMPO_MOTIVOS, CAMPO_PLAZO_APELAR, CAMPO_SENTENCIA_FIRME,
    ],
  },
  // Recursos compartidos con Instrucción
  ...SUB_INSTRUCCION.filter(s =>
    ['INS_5_9', 'INS_5_10', 'INS_5_12', 'INS_5_13', 'INS_5_14', 'INS_5_15'].includes(s.id)
  ).map(s => ({ ...s, id: s.id.replace('INS_', 'JUI_') })),
]

// ── Sub-actividades de Archivo ────────────────────────

const SUB_ARCHIVO: SubActividadPenal[] = [
  {
    id: 'ARC_8_1', numero: '8.1', nombre: 'Reserva de las Actuaciones', tipo: 'SI_NO',
    camposSI: [
      { id: 'resolucion', label: 'Resolución — Agregar archivo', type: 'upload' },
      { id: 'fundamentos', label: 'Fundamentos', type: 'textarea', full: true },
      CAMPO_ORGANISMO,
    ],
  },
  {
    id: 'ARC_8_2', numero: '8.2', nombre: 'Archivo de Causa', tipo: 'SI_NO', finalizaCausa: true,
    camposSI: [
      { id: 'resolucion', label: 'Resolución — Agregar archivo', type: 'upload' },
      { id: 'fundamentos', label: 'Fundamentos', type: 'textarea', full: true },
      CAMPO_ORGANISMO,
    ],
  },
]

// ── Etapas QUERELLA ───────────────────────────────────

export const ETAPAS_QUERELLA: EtapaPenal[] = [
  { codigo: 'RECEPCIONADO', label: 'Recepcionado', numero: 1, siguiente: 'EN_ANALISIS', subActividades: [] },
  { codigo: 'EN_ANALISIS',  label: 'En Análisis',  numero: 2, siguiente: 'ACEPTADO',    subActividades: [] },
  {
    codigo: 'ACEPTADO', label: 'Aceptado', numero: 3, siguiente: 'INSTRUCCION',
    subActividades: [
      {
        id: 'ACE_3_1', numero: '3.1', nombre: 'Se presenta como parte querellante', tipo: 'LIBRE',
        camposLibres: [
          { id: 'escrito', label: 'Presentación de escrito — Subir escrito', type: 'upload' },
          CAMPO_FECHA_DOC,
        ],
      },
      {
        id: 'ACE_3_2', numero: '3.2', nombre: 'Poder especial para querellar', tipo: 'SI_NO',
        camposSI: [
          { id: 'poder', label: 'Subir Poder', type: 'upload' },
          CAMPO_FECHA_DOC,
          { id: 'escrito_tenido', label: 'Presentación de escrito (ser tenido como parte) — Subir', type: 'upload' },
        ],
        camposNO: [
          { id: 'falta_poder', label: 'Falta Poder', type: 'text' },
        ],
      },
    ],
  },
  {
    codigo: 'RECHAZADO', label: 'Rechazado', numero: 4,
    subActividades: [
      {
        id: 'REC_4_1', numero: '4.1', nombre: 'No se presenta como parte querellante', tipo: 'LIBRE',
        camposLibres: [CAMPO_MOTIVOS, CAMPO_FECHA_DOC],
      },
    ],
  },
  { codigo: 'INSTRUCCION',    label: 'Instrucción',    numero: 5, siguiente: 'JUICIO',           subActividades: SUB_INSTRUCCION },
  { codigo: 'JUICIO',         label: 'Juicio',         numero: 6, siguiente: 'EJECUCION_PENAL',  subActividades: SUB_JUICIO },
  {
    codigo: 'EJECUCION_PENAL', label: 'Ejecución Penal', numero: 7, siguiente: 'ARCHIVO',
    subActividades: [
      {
        id: 'EJE_7_1', numero: '7.1', nombre: 'Sentencia de Ejecución', tipo: 'SI_NO',
        camposSI: [
          { id: 'sentencia', label: 'Sentencia de Ejecución — Agregar archivo', type: 'upload' },
          CAMPO_MOTIVOS,
          { id: 'detalle', label: 'Detalle', type: 'textarea', full: true },
          { id: 'plazo_cumplimiento', label: 'Plazo de Cumplimiento', type: 'text' },
        ],
      },
    ],
  },
  { codigo: 'ARCHIVO', label: 'Archivo', numero: 8, subActividades: SUB_ARCHIVO },
]

// ── Etapas DEFENSA_PENAL ──────────────────────────────

export const ETAPAS_DEFENSA_PENAL: EtapaPenal[] = ETAPAS_QUERELLA.map(e => {
  if (e.codigo !== 'ACEPTADO') return e
  return {
    ...e,
    subActividades: [
      {
        id: 'DEF_3_1', numero: '3.1', nombre: 'Asume Defensa Técnica', tipo: 'LIBRE' as const,
        camposLibres: [
          { id: 'acceso_exp', label: '3.1.1 Se presenta en la causa / acceso al expediente', type: 'text' as const },
          { id: 'designa_defensor', label: '3.1.2 Se presenta escrito designa defensor', type: 'upload' as const },
          { id: 'bono_ley', label: '3.1.3 Se aporta bono ley', type: 'upload' as const },
          { id: 'acepta_cargo', label: '3.1.4 Se presenta escrito aceptación del cargo', type: 'upload' as const },
        ],
      },
    ],
  }
})

// ── Etapas CARTA_SUCESO ───────────────────────────────

export const ETAPAS_CARTA_SUCESO: EtapaPenal[] = [
  { codigo: 'RECEPCIONADO', label: 'Recepcionado', numero: 1, siguiente: 'EN_ANALISIS', subActividades: [] },
  {
    codigo: 'EN_ANALISIS', label: 'En Análisis', numero: 2, siguiente: 'PROCEDE',
    subActividades: [
      {
        id: 'CSAE_2_1', numero: '2.1', nombre: 'Procede / No Procede', tipo: 'SI_NO',
        camposSI: [],
        camposNO: [
          { id: 'motivos', label: 'Motivos del descarte', type: 'textarea', full: true },
        ],
      },
    ],
  },
  {
    codigo: 'PROCEDE', label: 'Procede', numero: 3, siguiente: 'FORMULA_DENUNCIA',
    subActividades: [
      {
        id: 'CSAE_3_1', numero: '3.1', nombre: 'Análisis — ¿Hay delito?', tipo: 'SI_NO',
        camposSI: [{ id: 'accion', label: 'Acción', type: 'select', options: ['Se denuncia', 'No se denuncia'] }],
        camposNO: [{ id: 'accion', label: 'Acción', type: 'select', options: ['Se descarta por no corresponder'] }],
      },
      {
        id: 'CSAE_3_2', numero: '3.2', nombre: 'Análisis — ¿Hay denuncia previa?', tipo: 'SI_NO',
        camposSI: [{ id: 'accion', label: 'Acción', type: 'select', options: ['No se denuncia'] }],
        camposNO:  [{ id: 'accion', label: 'Acción', type: 'select', options: ['Se denuncia'] }],
      },
      {
        id: 'CSAE_3_3', numero: '3.3', nombre: 'Análisis — ¿Hay actuación de oficio?', tipo: 'SI_NO',
        camposSI: [{ id: 'accion', label: 'Acción', type: 'select', options: ['No se denuncia pero se registra'] }],
        camposNO:  [{ id: 'accion', label: 'Acción', type: 'select', options: ['Se denuncia'] }],
      },
    ],
  },
  {
    codigo: 'FORMULA_DENUNCIA', label: 'Formula Denuncia', numero: 4, siguiente: 'ARCHIVO',
    subActividades: [
      {
        id: 'CSAE_4_1', numero: '4.1', nombre: 'Formula Denuncia', tipo: 'LIBRE',
        camposLibres: [
          { id: 'denuncia_ifgra', label: 'Denuncia — IFGRA', type: 'upload' },
          { id: 'carta_sae', label: 'Carta SAE Suceso', type: 'upload' },
          { id: 'correo_denuncia', label: 'Correo Formula Denuncia', type: 'upload' },
          { id: 'correo_datos', label: 'Correo Datos de la Causa', type: 'upload' },
        ],
      },
    ],
  },
  {
    codigo: 'ARCHIVO', label: 'Archivo', numero: 5,
    subActividades: SUB_ARCHIVO.map(s => ({ ...s, id: s.id.replace('ARC_8_', 'CSAE_5_'), numero: s.numero.replace('8.', '5.') })),
  },
]

// ── Mapa tipo → etapas ────────────────────────────────

const ETAPAS_POR_TIPO: Partial<Record<string, EtapaPenal[]>> = {
  QUERELLA:      ETAPAS_QUERELLA,
  DEFENSA_PENAL: ETAPAS_DEFENSA_PENAL,
  CARTA_SUCESO:  ETAPAS_CARTA_SUCESO,
}

export function getEtapasPenales(tipo: string): EtapaPenal[] {
  return ETAPAS_POR_TIPO[tipo] ?? ETAPAS_QUERELLA
}

export function getEtapaPenal(tipo: string, codigo: string): EtapaPenal | undefined {
  return getEtapasPenales(tipo).find(e => e.codigo === codigo)
}
