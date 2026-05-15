import type { CampoFormulario, FormularioSubtipo } from '../types'

export const CAMPOS_COMUNES_MESA: CampoFormulario[] = [
  { id:'numero_ee_gde',         label:'N° EE / Memo GDE',      type:'text',   required:true, placeholder:'Ej: EE-2026-00001-APN-SOFSA', hint:'Campo obligatorio al alta', mono:true },
  { id:'area',                  label:'Área',                   type:'select', required:true, options:['CIVIL','LABORAL','PENAL'] },
  { id:'tipo_gestion',          label:'Tipo de Gestión',        type:'select', required:true, onchange:'filterByArea' },
  { id:'caratula',              label:'Carátula',               type:'text',   full:true,     placeholder:'Ej: GOMEZ MARIO C/ SOFSA SA S/ DAÑOS Y PERJUICIOS' },
  { id:'fecha_recepcion',       label:'Fecha de Recepción',     type:'date',   defaultToday:true },
  { id:'mesa_tipo_intervencion',label:'Tipo de Intervención',   type:'select', options:['Actora','Demandada','Sin Intervención'] },
]

export const FORMULARIOS: Record<string, FormularioSubtipo> = {
  OFICIO: {
    label: 'Oficios',
    mesa: [
      { id:'juzgado',        label:'Juzgado / Organismo',   type:'juzgado' },
      { id:'numero_oficio',  label:'N° de Oficio',          type:'text',   placeholder:'Ej: 12345/2026', mono:true },
      { id:'caracter_oficio',label:'Carácter',              type:'select', options:['Informativo','Urgente','Reiteratorio'] },
      { id:'documental',     label:'Documental',            type:'select', options:['Completo','Incompleto'] },
      { id:'plazo_respuesta',label:'Plazo de Respuesta',    type:'date' },
    ],
    abogado: [
      { id:'tipo_intervencion',label:'Tipo de Intervención', type:'select', options:['Actora','Demandada','Sin Intervención'] },
      { id:'estado_tramite',   label:'Estado del Trámite',   type:'select', options:['RECIBIDO','EN ANÁLISIS','RESPONDIDO','ARCHIVADO'] },
      { id:'fecha_respuesta',  label:'Fecha de Respuesta',   type:'date' },
      { id:'observaciones',    label:'Observaciones',        type:'textarea', full:true },
    ],
    variante_penal: {
      mesa: [
        { id:'linea',          label:'Línea Ferroviaria',        type:'linea' },
        { id:'tipo_hecho',     label:'Tipo de Hecho',           type:'select', options:['APEDREO','APEDREO CON LESIONES','APEDREO CON DAÑO','DAÑO BIENES FFCC','ROBO BIENES FFCC','ROBO DE CABLES','LESIONES','OTROS'] },
        { id:'juzgado',        label:'Juzgado / Fiscalía / UFI', type:'juzgado' },
        { id:'numero_causa',   label:'N° Causa',                 type:'causa' },
        { id:'caracter_oficio',label:'Carácter',                 type:'select', options:['Informativo','Urgente','Reiteratorio'] },
      ],
      abogado: [
        { id:'estado_causa',          label:'Estado de la Causa',    type:'text' },
        { id:'fecha_prox_movimiento', label:'Próximo Movimiento',    type:'date' },
        { id:'observaciones',         label:'Observaciones',          type:'textarea', full:true },
      ],
    },
  },

  CARTA_DOC: {
    label: 'Carta Documento',
    mesa: [
      { id:'numero_carta', label:'N° de Carta Documento', type:'text',   mono:true },
      { id:'remitente',    label:'Remitente',              type:'text' },
      { id:'fecha_carta',  label:'Fecha de la Carta',      type:'date' },
      { id:'documental',   label:'Documental',             type:'select', options:['Completo','Incompleto'] },
    ],
    abogado: [
      { id:'tipo_intervencion', label:'Tipo de Intervención', type:'select', options:['Actora','Demandada','Sin Intervención'] },
      { id:'respuesta_enviada', label:'Respuesta Enviada',    type:'boolean' },
      { id:'fecha_respuesta',   label:'Fecha de Respuesta',   type:'date' },
      { id:'estado_tramite',    label:'Estado',               type:'select', options:['RECIBIDA','EN ANÁLISIS','RESPONDIDA','SIN RESPUESTA','ARCHIVADA'] },
      { id:'observaciones',     label:'Observaciones',        type:'textarea', full:true },
    ],
  },

  MEDIACION: {
    label: 'Mediaciones',
    mesa: [
      { id:'numero_mediacion', label:'N° de Mediación',   type:'text',   mono:true },
      { id:'tipo_mediacion',   label:'Tipo de Mediación', type:'select', options:['PRIVADA','DEFENSA DEL CONSUMIDOR','OTROS'] },
      { id:'mediador',         label:'Mediador',           type:'text' },
      { id:'sede',             label:'Sede',               type:'text' },
      { id:'fecha_audiencia',  label:'Fecha de Audiencia', type:'date' },
    ],
    abogado: [
      { id:'tipo_intervencion', label:'Tipo de Intervención', type:'select', options:['Actora','Demandada','Sin Intervención'] },
      { id:'resultado',         label:'Resultado',            type:'select', options:['PENDIENTE','ACUERDO','FRACASÓ','CONTINÚA','ARCHIVADA'] },
      { id:'monto_acuerdo',     label:'Monto del Acuerdo',    type:'money' },
      { id:'fecha_acuerdo',     label:'Fecha del Acuerdo',    type:'date' },
      { id:'observaciones',     label:'Observaciones',        type:'textarea', full:true },
    ],
  },

  SECLO: {
    label: 'SECLO',
    mesa: [
      { id:'numero_seclo',   label:'N° SECLO',           type:'text',   mono:true },
      { id:'jurisdiccion',   label:'Jurisdicción',        type:'select', options:['MORÓN','SAN ISIDRO','SAN MARTÍN','CABA','LOMAS DE ZAMORA','LA PLATA','QUILMES'] },
      { id:'fecha_audiencia',label:'Fecha de Audiencia',  type:'date' },
      { id:'documental',     label:'Documental',          type:'select', options:['Completo','Incompleto'] },
    ],
    abogado: [
      { id:'tipo_intervencion',label:'Tipo de Intervención', type:'select', options:['Demandada','Sin Intervención'] },
      { id:'resultado',        label:'Resultado',            type:'select', options:['PENDIENTE','ACUERDO','FRACASÓ','SIN ACUERDO','ARCHIVADO'] },
      { id:'monto_acuerdo',    label:'Monto del Acuerdo',    type:'money' },
      { id:'tope_convenio',    label:'Tope Convenio',        type:'select', options:['SI','NO','VIZZOTI'] },
      { id:'observaciones',    label:'Observaciones',        type:'textarea', full:true },
    ],
  },

  BENEFICIO_LITIGAR: {
    label: 'Beneficio de Litigar sin Gastos',
    mesa: [
      { id:'numero_causa', label:'N° Causa',    type:'causa' },
      { id:'juzgado',      label:'Juzgado',     type:'juzgado' },
      { id:'documental',   label:'Documental',  type:'select', options:['Completo','Incompleto'] },
    ],
    abogado: [
      { id:'estado_tramite',   label:'Estado',             type:'select', options:['INGRESADO','EN TRÁMITE','OTORGADO','DENEGADO','ARCHIVADO'] },
      { id:'fecha_resolucion', label:'Fecha de Resolución',type:'date' },
      { id:'observaciones',    label:'Observaciones',       type:'textarea', full:true },
    ],
  },

  COBRO_CANON: {
    label: 'Cobro de Cánones',
    mesa: [
      { id:'numero_causa',    label:'N° Causa',          type:'causa' },
      { id:'juzgado',         label:'Juzgado',           type:'juzgado' },
      { id:'area_requirente', label:'Área Requirente',   type:'select', options:['COMERCIAL','LÍNEAS'] },
      { id:'monto_reclamado', label:'Monto Reclamado',   type:'money' },
    ],
    abogado: [
      { id:'estado_tramite', label:'Estado',          type:'select', options:['INGRESADO','EN TRÁMITE','COBRADO','PARCIALMENTE COBRADO','ARCHIVADO'] },
      { id:'monto_cobrado',  label:'Monto Cobrado',   type:'money' },
      { id:'fecha_cobro',    label:'Fecha de Cobro',  type:'date' },
      { id:'observaciones',  label:'Observaciones',   type:'textarea', full:true },
    ],
  },

  RECLAMO_CONTRAT: {
    label: 'Reclamo a Contratistas',
    mesa: [
      { id:'numero_contrato', label:'N° Contrato',       type:'text',   mono:true },
      { id:'contratista',     label:'Contratista',        type:'text' },
      { id:'monto_reclamado', label:'Monto Reclamado',    type:'money' },
      { id:'documental',      label:'Documental',         type:'select', options:['Completo','Incompleto'] },
    ],
    abogado: [
      { id:'estado_tramite',   label:'Estado',             type:'select', options:['INGRESADO','NOTIFICADO','EN NEGOCIACIÓN','COBRADO','JUDICIALIZADO','ARCHIVADO'] },
      { id:'monto_recuperado', label:'Monto Recuperado',   type:'money' },
      { id:'observaciones',    label:'Observaciones',      type:'textarea', full:true },
    ],
  },

  LANZAMIENTO: {
    label: 'Lanzamientos',
    mesa: [
      { id:'numero_causa',          label:'N° Causa',               type:'causa' },
      { id:'juzgado',               label:'Juzgado',                type:'juzgado' },
      { id:'domicilio_lanzamiento', label:'Domicilio del Inmueble', type:'text',   full:true },
      { id:'linea',                 label:'Línea Ferroviaria',       type:'linea' },
    ],
    abogado: [
      { id:'estado_tramite',    label:'Estado',               type:'select', options:['INGRESADO','EN TRÁMITE','FECHA FIJADA','EJECUTADO','SUSPENDIDO','ARCHIVADO'] },
      { id:'fecha_lanzamiento', label:'Fecha de Lanzamiento', type:'date' },
      { id:'observaciones',     label:'Observaciones',        type:'textarea', full:true },
    ],
  },

  RECUPERO: {
    label: 'Recuperos',
    mesa: [
      { id:'numero_causa',    label:'N° Causa / Expediente', type:'causa' },
      { id:'origen',          label:'Origen del Recupero',   type:'text' },
      { id:'monto_reclamado', label:'Monto a Recuperar',     type:'money' },
      { id:'linea',           label:'Línea Ferroviaria',      type:'linea' },
    ],
    abogado: [
      { id:'estado_tramite',   label:'Estado',             type:'select', options:['INGRESADO','EN GESTIÓN','COBRADO','INCOBRABLE','ARCHIVADO'] },
      { id:'monto_recuperado', label:'Monto Recuperado',   type:'money' },
      { id:'observaciones',    label:'Observaciones',      type:'textarea', full:true },
    ],
  },

  CONSIGNACION: {
    label: 'Consignaciones',
    mesa: [
      { id:'numero_causa',    label:'N° Causa',          type:'causa' },
      { id:'juzgado',         label:'Juzgado',           type:'juzgado' },
      { id:'monto_consignado',label:'Monto Consignado',  type:'money' },
      { id:'documental',      label:'Documental',        type:'select', options:['Completo','Incompleto'] },
    ],
    abogado: [
      { id:'estado_tramite', label:'Estado',        type:'select', options:['INGRESADO','EN TRÁMITE','ACEPTADA','RECHAZADA','ARCHIVADA'] },
      { id:'observaciones',  label:'Observaciones', type:'textarea', full:true },
    ],
  },

  DESAFUERO: {
    label: 'Desafueros',
    mesa: [
      { id:'tipo_hecho', label:'Tipo de Hecho', type:'select', options:['HURTO - ROBO','VIOLENCIA','GÉNERO','REORGANIZACIÓN','OTROS'] },
      { id:'empleado',   label:'Empleado',       type:'text' },
      { id:'legajo',     label:'N° Legajo',       type:'text', mono:true },
      { id:'sancion',    label:'Sanción',         type:'select', options:['Suspensión','Despidos','Otras'] },
    ],
    abogado: [
      { id:'estado_tramite',   label:'Estado',             type:'select', options:['INGRESADO','EN TRÁMITE','APROBADO','DENEGADO','ARCHIVADO'] },
      { id:'fecha_resolucion', label:'Fecha de Resolución',type:'date' },
      { id:'observaciones',    label:'Observaciones',      type:'textarea', full:true },
    ],
  },

  EJECUCION_GAR: {
    label: 'Ejecución de Pólizas',
    mesa: [
      { id:'numero_poliza',   label:'N° de Póliza',    type:'text',   mono:true },
      { id:'aseguradora',     label:'Aseguradora',      type:'text' },
      { id:'monto_poliza',    label:'Monto de la Póliza',type:'money' },
      { id:'numero_causa',    label:'N° Causa',          type:'causa' },
    ],
    abogado: [
      { id:'estado_tramite', label:'Estado',          type:'select', options:['INICIADA','EN TRÁMITE','COBRADA','RECHAZADA','ARCHIVADA'] },
      { id:'monto_cobrado',  label:'Monto Cobrado',   type:'money' },
      { id:'observaciones',  label:'Observaciones',   type:'textarea', full:true },
    ],
  },

  QUERELLA: {
    label: 'Querellas',
    mesa: [
      { id:'linea',         label:'Línea Ferroviaria',    type:'linea' },
      { id:'tipo_hecho',    label:'Tipo de Hecho',        type:'select', options:['APEDREO CON LESIONES','DAÑO BIENES FFCC','ROBO BIENES FFCC','INTERRUPCIÓN A LOS MEDIOS DE TRANSPORTE','ESTRAGO','OTROS'] },
      { id:'juzgado',       label:'Juzgado / Fiscalía',   type:'juzgado' },
      { id:'numero_causa',  label:'N° Causa / IPP',       type:'causa' },
      { id:'fecha_hecho',   label:'Fecha del Hecho',      type:'date' },
    ],
    abogado: [
      { id:'estado_causa',        label:'Estado de la Causa',  type:'select', options:['INSTRUCCIÓN','ELEVADA A JUICIO','JUICIO ORAL','SENTENCIA','ARCHIVADA'] },
      { id:'fecha_prox_audiencia',label:'Próxima Audiencia',   type:'date' },
      { id:'imputados',           label:'Imputados',            type:'text' },
      { id:'observaciones',       label:'Observaciones',        type:'textarea', full:true },
    ],
  },

  DEFENSA_CIVIL: {
    label: 'Defensa Civil',
    mesa: [
      { id:'numero_causa',    label:'N° Causa',          type:'causa' },
      { id:'juzgado',         label:'Juzgado',           type:'juzgado' },
      { id:'tipo_juicio',     label:'Tipo de Juicio',    type:'select', options:['ACCIDENTE - ACCIÓN CIVIL','AMPARO','COBRO DE SUMAS DE DINERO','DAÑOS Y PERJUICIOS','EJECUCIÓN FISCAL'] },
      { id:'monto_reclamado', label:'Monto Reclamado',   type:'money' },
    ],
    abogado: [
      { id:'tipo_intervencion',  label:'Tipo de Intervención',      type:'select', options:['Demandada','Sin Intervención'] },
      { id:'estado_tramite',     label:'Estado',                     type:'select', options:['INGRESADO','EN TRÁMITE','AUDIENCIA FIJADA','SENTENCIA','APELACIÓN','FIRME','ARCHIVADO'] },
      { id:'fecha_contestacion', label:'Fecha Contestación Demanda', type:'date' },
      { id:'observaciones',      label:'Observaciones',              type:'textarea', full:true },
    ],
  },

  DEFENSA_PENAL: {
    label: 'Defensa Penal',
    mesa: [
      { id:'linea',        label:'Línea Ferroviaria',          type:'linea' },
      { id:'juzgado',      label:'Juzgado / Fiscalía',         type:'juzgado' },
      { id:'numero_causa', label:'N° Causa / IPP',             type:'causa' },
      { id:'imputado',     label:'Imputado (Empleado SOFSA)',  type:'text' },
    ],
    abogado: [
      { id:'estado_causa',        label:'Estado de la Causa', type:'select', options:['INSTRUCCIÓN','ELEVADA A JUICIO','JUICIO ORAL','SOBRESEÍDO','SENTENCIA','ARCHIVADA'] },
      { id:'fecha_prox_audiencia',label:'Próxima Audiencia',  type:'date' },
      { id:'observaciones',       label:'Observaciones',       type:'textarea', full:true },
    ],
  },

  CARTA_SUCESO: {
    label: 'Carta Suceso (SAE)',
    mesa: [
      { id:'linea',       label:'Línea Ferroviaria', type:'linea' },
      { id:'tipo_hecho',  label:'Tipo de Hecho',     type:'select', options:['APEDREO','APEDREO CON DAÑO','DAÑO BIENES FFCC','ROBO BIENES FFCC','LESIONES','OTROS'] },
      { id:'fecha_hecho', label:'Fecha del Hecho',   type:'date' },
      { id:'lugar_hecho', label:'Lugar del Hecho',   type:'text' },
    ],
    abogado: [
      { id:'numero_sae',    label:'N° SAE',       type:'text',   mono:true },
      { id:'estado_tramite',label:'Estado',        type:'select', options:['PENDIENTE CARGA','CARGADA','NOTIFICADA','ARCHIVADA'] },
      { id:'observaciones', label:'Observaciones', type:'textarea', full:true },
    ],
  },

  PEDIDO_CAUSA_PENAL: {
    label: 'Pedido de Causa Penal',
    mesa: [
      { id:'linea',        label:'Línea Ferroviaria',   type:'linea' },
      { id:'juzgado',      label:'Fiscalía / UFI',      type:'juzgado' },
      { id:'numero_causa', label:'N° Causa / IPP',      type:'causa' },
      { id:'tipo_hecho',   label:'Tipo de Hecho',       type:'select', options:['DAÑO BIENES FFCC','ROBO BIENES FFCC','LESIONES','ESTRAGO','OTROS'] },
    ],
    abogado: [
      { id:'estado_tramite',          label:'Estado',                  type:'select', options:['INGRESADO','PENDIENTE RESPUESTA','RECIBIDA CAUSA','ARCHIVADO'] },
      { id:'fecha_recepcion_causa',   label:'Fecha Recepción Causa',   type:'date' },
      { id:'observaciones',           label:'Observaciones',           type:'textarea', full:true },
    ],
  },

  DEMANDA_CIVIL: {
    label: 'Demanda Civil',
    mesa: [
      { id:'numero_causa',    label:'N° Causa',          type:'causa' },
      { id:'juzgado',         label:'Juzgado',           type:'juzgado' },
      { id:'tipo_juicio',     label:'Tipo de Juicio',    type:'select', options:['DAÑOS Y PERJUICIOS','COBRO DE SUMAS DE DINERO','EJECUTIVO O PREPARACIÓN VÍA EJECUTIVA','ACCIDENTE - ACCIÓN CIVIL','AMPARO','OTROS'] },
      { id:'monto_reclamado', label:'Monto Reclamado',   type:'money' },
      { id:'documental',      label:'Documental',        type:'select', options:['Completo','Incompleto'] },
    ],
    abogado: [
      { id:'tipo_intervencion',  label:'Tipo de Intervención',      type:'select', options:['Actora','Demandada','Sin Intervención'] },
      { id:'estado_tramite',     label:'Estado',                     type:'select', options:['INGRESADO','EN TRAMITACIÓN','AUDIENCIA PACTADA','SENTENCIA','APELACIÓN','FIRME','ARCHIVADO'] },
      { id:'fecha_contestacion', label:'Fecha Contestación Demanda', type:'date' },
      { id:'monto_acuerdo',      label:'Monto del Acuerdo',          type:'money' },
      { id:'observaciones',      label:'Observaciones',              type:'textarea', full:true },
    ],
  },

  DEMANDA_LABORAL: {
    label: 'Demanda Laboral',
    mesa: [
      { id:'numero_causa',    label:'N° Causa',          type:'causa' },
      { id:'juzgado',         label:'Juzgado',           type:'juzgado' },
      { id:'tipo_juicio',     label:'Tipo de Juicio',    type:'select', options:['DESPIDO','DIFERENCIAS SALARIALES','ACCIDENTE DE TRABAJO','ENFERMEDAD PROFESIONAL','OTROS'] },
      { id:'monto_reclamado', label:'Monto Reclamado',   type:'money' },
      { id:'documental',      label:'Documental',        type:'select', options:['Completo','Incompleto'] },
    ],
    abogado: [
      { id:'tipo_intervencion',  label:'Tipo de Intervención',      type:'select', options:['Demandada','Sin Intervención'] },
      { id:'estado_tramite',     label:'Estado',                     type:'select', options:['INGRESADO','EN TRAMITACIÓN','AUDIENCIA PACTADA','SENTENCIA','APELACIÓN','FIRME','ARCHIVADO'] },
      { id:'tope_convenio',      label:'Tope Convenio',              type:'select', options:['SI','NO','VIZZOTI'] },
      { id:'fecha_contestacion', label:'Fecha Contestación Demanda', type:'date' },
      { id:'monto_acuerdo',      label:'Monto del Acuerdo',          type:'money' },
      { id:'observaciones',      label:'Observaciones',              type:'textarea', full:true },
    ],
  },

  OTRAS: {
    label: 'Otras presentaciones / gestiones',
    mesa: [
      { id:'descripcion_gestion', label:'Descripción de la Gestión',  type:'textarea', full:true },
      { id:'juzgado',             label:'Juzgado / Organismo (si aplica)', type:'juzgado' },
      { id:'numero_causa',        label:'N° Causa (si aplica)',        type:'causa' },
    ],
    abogado: [
      { id:'estado_tramite', label:'Estado',        type:'select', options:['INGRESADO','EN TRÁMITE','RESUELTO','ARCHIVADO'] },
      { id:'observaciones',  label:'Observaciones', type:'textarea', full:true },
    ],
  },
}

export function getCamposFormulario(tipo: string, etapa: 'mesa' | 'abogado', area?: string): CampoFormulario[] {
  const form = FORMULARIOS[tipo]
  if (!form) return []
  if (tipo === 'OFICIO' && area === 'PENAL' && form.variante_penal) {
    return form.variante_penal[etapa]
  }
  return form[etapa]
}
