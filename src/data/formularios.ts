import type { CampoFormulario, FormularioSubtipo } from '../types'

export const CAMPOS_COMUNES_MESA: CampoFormulario[] = [
  { id:'mesa_oficio_judicial',   label:'N° OJ',                  type:'text',     placeholder:'N° OJ' },
  { id:'mesa_tipo_intervencion', label:'Tipo de Intervención',   type:'select',   options:['Actora','Demandada','Sin Intervención'] },
  { id:'mesa_comentarios',       label:'Comentarios',            type:'textarea', full:true },
]

export const FORMULARIOS: Record<string, FormularioSubtipo> = {
  OFICIO: {
    label: 'Oficios',
    mesa: [
      { id:'mesa_num_causa',      label:'N° de Causa',              type:'causa',   mono:true },
      { id:'mesa_juzgado',        label:'Juzgado',                  type:'juzgado' },
      { id:'mesa_tribunal',       label:'Tribunal',                 type:'juzgado' },
      { id:'mesa_secretaria',     label:'Secretaría',               type:'text' },
      { id:'mesa_organismo',      label:'Organismo',                type:'text' },
      { id:'mesa_caratula',       label:'Carátula',                 type:'text',    full:true },
      { id:'mesa_fecha_recep_of', label:'Fecha recepción de oficio',type:'date' },
    ],
    abogado: [
      { id:'abg_caracter',          label:'Carácter',               type:'select',   options:['Informativo','Urgente','Reiteratorio'] },
      { id:'abg_objeto_req',        label:'Objeto del requerimiento',type:'textarea', full:true },
      { id:'abg_area_informante',   label:'Área informante',         type:'text' },
      { id:'abg_fecha_contestacion',label:'Fecha de contestación',   type:'date' },
    ],
    variante_penal: {
      mesa: [
        { id:'mesa_num_causa',      label:'N° Causa / Sumario / IPP', type:'causa',   mono:true },
        { id:'mesa_caratula',       label:'Carátula',                  type:'text',    full:true },
        { id:'mesa_juzgado',        label:'Juzgado',                   type:'juzgado' },
        { id:'mesa_fiscalia',       label:'Fiscalía',                  type:'juzgado' },
        { id:'mesa_comisaria',      label:'Comisaría',                 type:'juzgado' },
        { id:'mesa_tribunal',       label:'Tribunal',                  type:'juzgado' },
        { id:'mesa_linea',          label:'Línea ferroviaria',         type:'linea' },
        { id:'mesa_fecha_recep_of', label:'Fecha recepción de oficio', type:'date' },
      ],
      abogado: [
        { id:'abg_datos_contacto', label:'Datos contacto requirente', type:'text',    full:true, hint:'Tel / Mail / Dir / Contacto' },
        { id:'abg_fecha_hecho',    label:'Fecha del hecho',           type:'date' },
        { id:'abg_lugar_hecho',    label:'Lugar del hecho',           type:'text',    full:true },
        { id:'abg_damnificado',    label:'Parte damnificada',         type:'text' },
        { id:'abg_imputado',       label:'Parte imputada',            type:'text' },
        { id:'abg_tipo_hecho',     label:'Tipo de hecho',             type:'select',  options:['APEDREO','APEDREO CON LESIONES','APEDREO CON DAÑO','DAÑO BIENES FFCC','ROBO BIENES FFCC','LESIONES','OTROS'] },
        { id:'abg_tipo_solicitud', label:'Tipo de solicitud',         type:'select',  options:['Informativo','Urgente','Reiteratorio'] },
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
      { id:'abg_monto_reclam',   label:'Monto reclamado',                       type:'money' },
      { id:'abg_objeto',         label:'Objeto',                                 type:'textarea', full:true },
      { id:'abg_requiere_resp',  label:'Requiere respuesta',                     type:'select',   options:['Sí','No'] },
      { id:'abg_area_informante',label:'Área informante',                        type:'text' },
      { id:'abg_vinculacion',    label:'Vinculación con contrato o expediente',  type:'text',     full:true },
      { id:'abg_fecha_resp',     label:'Fecha de respuesta',                     type:'date' },
    ],
  },

  MEDIACION: {
    label: 'Mediaciones',
    mesa: [
      { id:'mesa_tipo_mediacion',  label:'Tipo de mediación',  type:'select', options:['Privada','Defensa del consumidor','Otros'] },
      { id:'mesa_requirente',      label:'Requirente',          type:'text' },
      { id:'mesa_requerido',       label:'Requerido',           type:'text' },
      { id:'mesa_mediador',        label:'Mediador / Organismo',type:'text' },
      { id:'mesa_fecha_audiencia', label:'Fecha de audiencia',  type:'date' },
    ],
    abogado: [
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
      { id:'abg_fecha_deceso',  label:'Fecha del deceso',                    type:'date' },
      { id:'abg_herederos_leg', label:'Herederos denunciados en el legajo',  type:'textarea', full:true },
      { id:'abg_otros_hered',   label:'Otros supuestos herederos',           type:'textarea', full:true },
      { id:'abg_dir_hered',     label:'Dirección de los herederos',          type:'textarea', full:true },
      { id:'abg_motivos',       label:'Motivos de la consignación',          type:'textarea', full:true },
      { id:'abg_monto',         label:'Monto a consignar',                   type:'money' },
      { id:'abg_tope_convenio', label:'Se aplicó tope de convenio',          type:'select',   options:['Sí','No','Vizzoti'] },
      { id:'abg_tope_aplicado', label:'Tope de convenio aplicado',           type:'text' },
      { id:'abg_categoria',     label:'Categoría',                           type:'text' },
      { id:'abg_convenio',      label:'Convenio colectivo aplicable',        type:'text' },
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
      { id:'abg_area_req',        label:'Área requirente',       type:'text' },
      { id:'abg_linea_req',       label:'Línea requirente',      type:'linea' },
      { id:'abg_motivo',          label:'Motivo / hecho denunciado', type:'textarea', full:true },
      { id:'abg_tipo_hecho',      label:'Tipo de hecho',         type:'select',   options:['HURTO - ROBO','VIOLENCIA','GÉNERO','REORGANIZACIÓN','OTROS'] },
      { id:'abg_fecha_hecho',     label:'Fecha del hecho',       type:'date' },
      { id:'abg_sancion',         label:'Sanción que se persigue',type:'select',  options:['Suspensión','Despido','Otras'], onchange:'onSancionChange' },
      { id:'abg_dias_suspension', label:'Cantidad de días',      type:'text',     placeholder:'Ej: 30', dependsOn:{ field:'abg_sancion', value:'Suspensión' } },
      { id:'abg_fecha_informe',   label:'Fecha informe sanción', type:'date' },
      { id:'abg_causa_penal',     label:'N° Causa Penal',        type:'text',     mono:true },
      { id:'abg_nro_ucit',        label:'N° Informe UCIT',       type:'text',     mono:true },
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
      { id:'mesa_num_causa',     label:'N° de Causa',          type:'causa',   mono:true },
      { id:'mesa_juzgado',       label:'Juzgado',               type:'juzgado' },
      { id:'mesa_secretaria',    label:'Secretaría',            type:'text' },
      { id:'mesa_caratula',      label:'Carátula',              type:'text',    full:true },
      { id:'mesa_abogado_contr', label:'Abogado de la contraria',type:'text' },
      { id:'mesa_parte_actora',  label:'Parte Actora',          type:'text' },
      { id:'mesa_parte_dem',     label:'Parte Demandada',       type:'text' },
      { id:'mesa_coactores',     label:'Coactores',             type:'text',    full:true },
      { id:'mesa_codemandados',  label:'Codemandado',           type:'text',    full:true },
      { id:'mesa_fecha_inicio',  label:'Fecha de inicio',       type:'date' },
      { id:'mesa_juicio',        label:'Tipo de Juicio',        type:'select',  options:['DAÑOS Y PERJUICIOS','COBRO DE SUMAS DE DINERO','EJECUTIVO O PREPARACIÓN VÍA EJECUTIVA','ACCIDENTE - ACCIÓN CIVIL','AMPARO','BENEFICIO DE LSG','CONSIGNACIÓN','OTROS'] },
      { id:'mesa_monto',         label:'Monto de la demanda',   type:'money' },
    ],
    abogado: [
      { id:'estado_tramite',     label:'Estado',                     type:'select', options:['INGRESADO','EN TRAMITACIÓN','AUDIENCIA PACTADA','SENTENCIA','APELACIÓN','FIRME','ARCHIVADO'] },
      { id:'fecha_contestacion', label:'Fecha Contestación Demanda', type:'date' },
      { id:'monto_acuerdo',      label:'Monto del Acuerdo',          type:'money' },
      { id:'observaciones',      label:'Observaciones',              type:'textarea', full:true },
    ],
  },

  DEMANDA_LABORAL: {
    label: 'Demanda Laboral',
    mesa: [
      { id:'mesa_num_causa',     label:'N° de Causa',          type:'causa',   mono:true },
      { id:'mesa_juzgado',       label:'Juzgado',               type:'juzgado' },
      { id:'mesa_secretaria',    label:'Secretaría',            type:'text' },
      { id:'mesa_caratula',      label:'Carátula',              type:'text',    full:true },
      { id:'mesa_abogado_contr', label:'Abogado de la contraria',type:'text' },
      { id:'mesa_parte_actora',  label:'Parte Actora',          type:'text' },
      { id:'mesa_parte_dem',     label:'Parte Demandada',       type:'text' },
      { id:'mesa_coactores',     label:'Coactores',             type:'text',    full:true },
      { id:'mesa_codemandados',  label:'Codemandado',           type:'text',    full:true },
      { id:'mesa_fecha_inicio',  label:'Fecha de inicio',       type:'date' },
      { id:'mesa_juicio',        label:'Tipo de Juicio',        type:'select',  options:['DESPIDO','DIFERENCIAS SALARIALES','ACCIDENTE DE TRABAJO','ENFERMEDAD PROFESIONAL','OTROS'] },
      { id:'mesa_monto',         label:'Monto de la demanda',   type:'money' },
    ],
    abogado: [
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
