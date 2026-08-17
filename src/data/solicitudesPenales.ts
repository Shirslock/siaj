// Configuración de sub-formularios para cada tipo de "Solicitud" dentro
// de OFICIO.variante_penal (campo abg_tipo_solicitud, multiselect).
// Cada tipo tiene su propio set de campos que se completan en un modal
// (ver ModalSolicitudPenal.tsx) y se guardan en
// campos_abogado.abg_solicitudes_detalle[tipo].

export interface CampoSolicitudPenal {
  id:              string
  label:           string
  tipo:            'text' | 'textarea' | 'date' | 'time' | 'money' | 'select'
  options?:        string[]
  permiteArchivo?: boolean
  full?:           boolean
}

export interface ConfigSolicitudPenal {
  tipo:   string   // debe matchear el value del multiselect
  campos: CampoSolicitudPenal[]
  // Solo para Averiguación de Paradero: campos condicionales según
  // el valor de un campo select específico
  camposCondicionales?: {
    campoDisparador: string   // id del select
    opciones: Record<string, CampoSolicitudPenal[]>
  }
}

export const TIPOS_SOLICITUD_PENAL: string[] = [
  'Solicitud de Información',
  'Solicitud de Filmaciones Estáticas',
  'Solicitud de Filmaciones Dinámicas',
  'Notificación Conciliación',
  'Notificación Reparación Integral',
  'Notificación Suspensión de Juicio a Prueba (Probation)',
  'Solicitud de Intervención',
  'Citaciones a Testimonial',
  'Citaciones a Indagatoria',
  'Solicitud de Averiguación de Paradero (Búsqueda de Personas)',
]

export const CONFIG_SOLICITUDES_PENALES: Record<string, ConfigSolicitudPenal> = {

  'Solicitud de Información': {
    tipo: 'Solicitud de Información',
    campos: [
      { id:'tipo_info',         label:'Tipo de información solicitada', tipo:'textarea', full:true },
      { id:'areas_intervenir',  label:'Áreas a intervenir',             tipo:'textarea', full:true, permiteArchivo:true },
      { id:'respuesta_area',    label:'Respuesta del área',             tipo:'textarea', full:true, permiteArchivo:true },
    ],
  },

  'Solicitud de Filmaciones Estáticas': {
    tipo: 'Solicitud de Filmaciones Estáticas',
    campos: [
      { id:'fechas_solicitadas',  label:'Fechas solicitadas',             tipo:'text' },
      { id:'rangos_horarios',     label:'Rangos horarios solicitados',    tipo:'text' },
      { id:'lugares_solicitados', label:'Lugares solicitados',            tipo:'text', full:true },
      { id:'areas_intervenir',    label:'Áreas a intervenir',             tipo:'textarea', full:true, permiteArchivo:true },
      { id:'respuesta_areas',     label:'Respuesta de las áreas',         tipo:'textarea', full:true, permiteArchivo:true },
    ],
  },

  'Solicitud de Filmaciones Dinámicas': {
    tipo: 'Solicitud de Filmaciones Dinámicas',
    campos: [
      { id:'fechas_solicitadas', label:'Fechas solicitadas',              tipo:'text' },
      { id:'rangos_horarios',    label:'Rangos horarios solicitados',     tipo:'text' },
      { id:'formaciones',       label:'Formaciones ferroviarias solicitadas', tipo:'text', full:true },
      { id:'areas_intervenir',   label:'Áreas a intervenir',              tipo:'textarea', full:true, permiteArchivo:true },
      { id:'respuesta_areas',    label:'Respuesta de las áreas',          tipo:'textarea', full:true, permiteArchivo:true },
    ],
  },

  'Notificación Conciliación': {
    tipo: 'Notificación Conciliación',
    campos: [
      { id:'organismos_solicitantes', label:'Organismos solicitantes',   tipo:'text', full:true },
      { id:'detalle_propuesta',       label:'Detalle de la Propuesta',   tipo:'textarea', full:true, permiteArchivo:true },
      { id:'propuesta_sofsa',         label:'Propuesta por parte de SOFSA', tipo:'textarea', full:true, permiteArchivo:true },
      { id:'fecha_conciliacion',      label:'Fecha de la Conciliación',  tipo:'date' },
      { id:'montos',                  label:'Montos',                    tipo:'money' },
      { id:'fecha_cumplimiento',      label:'Fecha de cumplimiento',     tipo:'date' },
      { id:'comprobantes',            label:'Comprobantes',              tipo:'text', full:true, permiteArchivo:true },
      { id:'audiencias',              label:'Audiencias',                tipo:'textarea', full:true, permiteArchivo:true },
      { id:'fechas_audiencias',       label:'Fechas de Audiencias',      tipo:'date' },
      { id:'actas_audiencias',        label:'Actas de Audiencias',       tipo:'text', full:true, permiteArchivo:true },
      { id:'valuaciones_sector',      label:'Valuaciones del sector',    tipo:'textarea', full:true, permiteArchivo:true },
    ],
  },

  'Notificación Reparación Integral': {
    tipo: 'Notificación Reparación Integral',
    campos: [
      { id:'organismos_solicitantes', label:'Organismos solicitantes',   tipo:'text', full:true },
      { id:'detalle_propuesta',       label:'Detalle de la Propuesta',   tipo:'textarea', full:true, permiteArchivo:true },
      { id:'propuesta_sofsa',         label:'Propuesta por parte de SOFSA', tipo:'textarea', full:true, permiteArchivo:true },
      { id:'fecha_reparacion',        label:'Fecha de la Reparación integral', tipo:'date' },
      { id:'montos',                  label:'Montos',                    tipo:'money' },
      { id:'fecha_cumplimiento',      label:'Fecha de cumplimiento',     tipo:'date' },
      { id:'comprobantes',            label:'Comprobantes',              tipo:'text', full:true, permiteArchivo:true },
      { id:'audiencias',              label:'Audiencias',                tipo:'textarea', full:true, permiteArchivo:true },
      { id:'fechas_audiencias',       label:'Fechas de Audiencias',      tipo:'date' },
      { id:'actas_audiencias',        label:'Actas de Audiencias',       tipo:'text', full:true, permiteArchivo:true },
      { id:'valuaciones_sector',      label:'Valuaciones del sector',    tipo:'textarea', full:true, permiteArchivo:true },
    ],
  },

  'Notificación Suspensión de Juicio a Prueba (Probation)': {
    tipo: 'Notificación Suspensión de Juicio a Prueba (Probation)',
    campos: [
      { id:'organismos_solicitantes', label:'Organismos solicitantes',   tipo:'text', full:true },
      { id:'detalle_propuesta',       label:'Detalle de la Propuesta',   tipo:'textarea', full:true, permiteArchivo:true },
      { id:'propuesta_sofsa',         label:'Propuesta por parte de SOFSA', tipo:'textarea', full:true, permiteArchivo:true },
      { id:'fecha_probation',         label:'Fecha de la Suspensión de Juicio a Prueba', tipo:'date' },
      { id:'montos',                  label:'Montos',                    tipo:'money' },
      { id:'tareas',                  label:'Tareas',                    tipo:'textarea', full:true },
      { id:'fecha_cumplimiento',      label:'Fecha de cumplimiento',     tipo:'date' },
      { id:'comprobantes',            label:'Comprobantes',              tipo:'text', full:true, permiteArchivo:true },
      { id:'audiencias',              label:'Audiencias',                tipo:'textarea', full:true, permiteArchivo:true },
      { id:'fechas_audiencias',       label:'Fechas de Audiencias',      tipo:'date' },
      { id:'actas_audiencias',        label:'Actas de Audiencias',       tipo:'text', full:true, permiteArchivo:true },
      { id:'valuaciones_sector',      label:'Valuaciones del sector',    tipo:'textarea', full:true, permiteArchivo:true },
    ],
  },

  'Solicitud de Intervención': {
    tipo: 'Solicitud de Intervención',
    campos: [
      { id:'tipo_intervencion',    label:'Tipo de intervención solicitada', tipo:'text', full:true },
      { id:'organismo_solicitante',label:'Organismo solicitante',           tipo:'text' },
      { id:'area_notificar',       label:'Área a notificar',                tipo:'text', permiteArchivo:true },
      { id:'respuesta_area',       label:'Respuesta del área',              tipo:'textarea', full:true, permiteArchivo:true },
    ],
  },

  'Citaciones a Testimonial': {
    tipo: 'Citaciones a Testimonial',
    campos: [
      { id:'citado_nombre',      label:'Nombre y apellido',    tipo:'text' },
      { id:'citado_legajo',      label:'N° de Legajo',         tipo:'text' },
      { id:'citado_funcion',     label:'Función',               tipo:'text' },
      { id:'fecha_citacion',     label:'Fecha de citación',     tipo:'date' },
      { id:'horario_citacion',   label:'Horario de citación',   tipo:'time' },
      { id:'tipo_celebracion',   label:'Tipo de celebración',   tipo:'select', options:['Virtual','Presencial'] },
      { id:'lugar_celebracion',  label:'Lugar de celebración',  tipo:'text', full:true },
      { id:'area_interviniente', label:'Área interviniente',    tipo:'text' },
      { id:'fecha_cumplimiento', label:'Fecha de cumplimiento', tipo:'date' },
      { id:'asistencia_rito',    label:'Se prestó asistencia Art. RITO (Art. 481 inc. C)', tipo:'select', options:['SI','NO'] },
    ],
  },

  'Citaciones a Indagatoria': {
    tipo: 'Citaciones a Indagatoria',
    campos: [
      { id:'citado_nombre',        label:'Nombre y apellido',    tipo:'text' },
      { id:'citado_legajo',        label:'N° de Legajo',         tipo:'text' },
      { id:'citado_funcion',       label:'Función',               tipo:'text' },
      { id:'fecha_citacion',       label:'Fecha de citación',     tipo:'date' },
      { id:'horario_citacion',     label:'Horario de citación',   tipo:'time' },
      { id:'lugar_celebracion',    label:'Lugar de celebración',  tipo:'text', full:true },
      { id:'tipo_celebracion',     label:'Tipo de celebración',   tipo:'select', options:['Virtual','Presencial'] },
      { id:'area_interviniente',   label:'Área interviniente',    tipo:'text' },
      { id:'fecha_cumplimiento',   label:'Fecha de cumplimiento', tipo:'date' },
      { id:'se_presta_asistencia', label:'Se presta asistencia',  tipo:'select', options:['SI','NO'] },
    ],
  },

  'Solicitud de Averiguación de Paradero (Búsqueda de Personas)': {
    tipo: 'Solicitud de Averiguación de Paradero (Búsqueda de Personas)',
    campos: [
      { id:'tipo_requerimiento', label:'Tipo de Requerimiento', tipo:'select', options:['Colaboración','Información'] },
    ],
    camposCondicionales: {
      campoDisparador: 'tipo_requerimiento',
      opciones: {
        'Colaboración': [
          { id:'pase_areas', label:'Pase a las áreas correspondientes', tipo:'textarea', full:true, permiteArchivo:true },
        ],
        'Información': [
          { id:'memo_ggo',       label:'Memo a GGO',           tipo:'textarea', full:true, permiteArchivo:true },
          { id:'respuesta_area', label:'Respuesta del área',   tipo:'textarea', full:true, permiteArchivo:true },
        ],
      },
    },
  },
}
