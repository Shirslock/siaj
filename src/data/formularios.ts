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
        { id:'mesa_num_causa',   label:'N° de Causa',   type:'text', mono:true, placeholder:'Ej: 12345/2026' },
        { id:'mesa_num_sumario', label:'N° de Sumario', type:'text', mono:true, placeholder:'Ej: SUM-2026-001' },
        { id:'mesa_num_ipp',     label:'N° de IPP',     type:'text', mono:true, placeholder:'Ej: IPP-1234/2026' },
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
        { id:'abg_tipo_hecho',     label:'Tipo de hecho',    type:'multiselect', options:['APEDREO','APEDREO CON LESIONES','APEDREO CON DAÑO','DAÑO BIENES FFCC','ROBO BIENES FFCC','LESIONES','OTROS'] },
        { id:'abg_tipo_solicitud', label:'Tipo de solicitud', type:'multiselect', options:['Solicitud de información','Solicitud de filmaciones','Solicitud de intervención','Citaciones','Solicitud de asistencia a Métodos Alternativos de Resolución del conflicto','Otros'] },
        { id:'abg_num_siniestro',  label:'Accidente Ferroviario (N° Siniestro)', type:'text', mono:true, placeholder:'Ej: SIN-2026-001' },
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
      { id:'resultado',              label:'Resultado',            type:'select', options:['PENDIENTE','ACUERDO','FRACASÓ','CONTINÚA','ARCHIVADA'] },
      { id:'monto_acuerdo',          label:'Monto del Acuerdo',    type:'money' },
      { id:'fecha_acuerdo',          label:'Fecha del Acuerdo',    type:'date' },
      { id:'abg_objeto_reclamo',     label:'Objeto del reclamo',   type:'textarea', full:true },
      { id:'abg_monto_reclamado',    label:'Monto reclamado',      type:'money' },
      { id:'abg_fecha_cierre',       label:'Fecha de cierre',      type:'date' },
      { id:'abg_requiere_asistencia',label:'Requiere Asistencia',  type:'select', options:['Sí','No'] },
      { id:'observaciones',          label:'Observaciones',        type:'textarea', full:true },
    ],
  },

  SECLO: {
    label: 'SECLO',
    mesa: [
      { id:'mesa_requirente',     label:'Requirente',          type:'text' },
      { id:'mesa_cuil_requirente',label:'CUIL Requirente',     type:'text',   mono:true },
      { id:'mesa_requerido',      label:'Requerido',           type:'text' },
      { id:'mesa_objeto_reclamo', label:'Objeto del reclamo',  type:'textarea', full:true },
    ],
    abogado: [
      { id:'abg_monto_reclamado',    label:'Monto reclamado',     type:'money' },
      { id:'abg_requiere_asistencia',label:'Requiere Asistencia', type:'select', options:['Sí','No'] },
    ],
  },

  BENEFICIO_LITIGAR: {
    label: 'Beneficio de Litigar sin Gastos',
    mesa: [
      { id:'juzgado',                   label:'Juzgado',                        type:'juzgado' },
      { id:'mesa_caratula',             label:'Carátula',                       type:'text',   full:true },
      { id:'mesa_secretaria',           label:'Secretaría',                     type:'text' },
      { id:'mesa_expediente_vinculado', label:'Expediente principal vinculado', type:'text',   mono:true },
      { id:'documental',                label:'Documental',                     type:'select', options:['Completo','Incompleto'] },
    ],
    abogado: [
      { id:'abg_fecha_recepcion',label:'Fecha de recepción',  type:'date' },
      { id:'abg_plazo_contestar',label:'Plazo para contestar',type:'date' },
    ],
  },

  COBRO_CANON: {
    label: 'Cobro de Cánones',
    mesa: [
      { id:'permisionario',    label:'Permisionario',                   type:'text' },
      { id:'ref_contrato_ppu', label:'Referencia de contrato / N° PPU', type:'text',   mono:true },
      { id:'area_requirente',  label:'Área Requirente',                 type:'select', options:['COMERCIAL','LÍNEAS'] },
      { id:'fecha_requerimiento', label:'Fecha del requerimiento',      type:'date' },
    ],
    abogado: [
      { id:'periodo_adeudado',   label:'Período adeudado',                type:'text' },
      { id:'monto_informado',    label:'Monto informado',                 type:'money' },
      { id:'monto_actualizado',  label:'Monto actualizado',               type:'money' },
      { id:'garante',            label:'Garante',                         type:'text' },
      { id:'inicio_prescripcion',label:'Inicio de plazo de prescripción', type:'date' },
    ],
  },

  RECLAMO_CONTRAT: {
    label: 'Reclamo a Contratistas',
    mesa: [
      { id:'contratista',            label:'Contratista',                    type:'text' },
      { id:'objeto_ee_contratacion', label:'Objeto / N° EE / Contratación', type:'text', full:true },
      { id:'area_requirente',        label:'Área Requirente',                type:'text' },
      { id:'fecha_requerimiento',    label:'Fecha del requerimiento',        type:'date' },
    ],
    abogado: [
      { id:'inicio_prescripcion',label:'Inicio de plazo de prescripción', type:'date' },
      { id:'motivo_juridico',    label:'Motivo jurídico / contractual',   type:'textarea', full:true },
      { id:'monto_reclamar',     label:'Monto a reclamar',                type:'money' },
    ],
  },

  LANZAMIENTO: {
    label: 'Lanzamientos',
    mesa: [
      { id:'numero_memo',        label:'N° Memo',                  type:'text',  mono:true },
      { id:'area_requirente',    label:'Área Requirente',           type:'text' },
      { id:'fecha_requerimiento',label:'Fecha del requerimiento',   type:'date' },
    ],
    abogado: [
      { id:'abg_linea',                label:'Línea Ferroviaria',       type:'linea' },
      { id:'abg_lugar_estacion_km',    label:'Lugar / Estación / Km',   type:'text', full:true },
      { id:'abg_notificacion_ocupante',label:'Notificación al ocupante', type:'date' },
      { id:'abg_documental',           label:'Documental',              type:'select', options:['Completo','Incompleto'] },
    ],
  },

  RECUPERO: {
    label: 'Recuperos',
    mesa: [
      { id:'num_siniestro',      label:'N° Siniestro',            type:'text',  mono:true },
      { id:'fecha_siniestro',    label:'Fecha de siniestro',      type:'date' },
      { id:'linea',              label:'Línea Ferroviaria',        type:'linea' },
      { id:'fecha_requerimiento',label:'Fecha del requerimiento', type:'date' },
    ],
    abogado: [
      { id:'abg_pan',            label:'PAN',              type:'text' },
      { id:'abg_seguro',         label:'Seguro',           type:'text' },
      { id:'abg_monto_reclamar', label:'Monto a reclamar', type:'money' },
      { id:'abg_documental',     label:'Documental',       type:'select', options:['Completo','Incompleto'] },
    ],
  },

  CONSIGNACION: {
    label: 'Consignaciones',
    mesa: [
      { id:'nombre_causante', label:'Nombre del Causante / Ex trabajador', type:'text', full:true },
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
      { id:'fecha_ingreso', label:'Fecha de ingreso', type:'date' },
      { id:'empleado',      label:'Empleado',          type:'text' },
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
      { id:'contratista',       label:'Contratista / Proveedor',     type:'text' },
      { id:'area_requirente',   label:'Área Requirente',              type:'text' },
      { id:'fecha_ingreso_saco',label:'Fecha de ingreso a SACO',      type:'date' },
      { id:'num_ee',            label:'N° Expediente Electrónico',    type:'text',   mono:true },
    ],
    abogado: [
      { id:'abg_aseguradora',        label:'Aseguradora',                   type:'text' },
      { id:'abg_num_poliza',         label:'N° Póliza/s',                   type:'text',   mono:true },
      { id:'abg_tipo_poliza',        label:'Tipo de Póliza/s',              type:'text' },
      { id:'abg_monto_ejecutar',     label:'Monto/s a ejecutar',            type:'money' },
      { id:'abg_fecha_rescision',    label:'Fecha de rescisión',            type:'date' },
      { id:'abg_fecha_prescripcion', label:'Fecha de prescripción',         type:'date' },
      { id:'abg_instruccion_daños',  label:'Instrucción de reclamar daños', type:'text',   full:true },
      { id:'abg_acuerdo',            label:'Acuerdo',                       type:'text',   full:true },
    ],
  },

  QUERELLA: {
    label: 'Querellas',
    mesa: [
      { id:'area_requirente', label:'Área Requirente',   type:'text' },
      { id:'linea',           label:'Línea Ferroviaria', type:'linea' },
      { id:'numero_causa',    label:'N° Causa / IPP',    type:'causa' },
      { id:'juzgado',         label:'Juzgado',           type:'juzgado' },
      { id:'fiscalia',        label:'Fiscalía',          type:'juzgado' },
      { id:'tribunal',        label:'Tribunal',          type:'juzgado' },
      { id:'ufi',             label:'UFI',               type:'juzgado' },
    ],
    abogado: [
      { id:'abg_caratula',          label:'Carátula',           type:'text',   full:true },
      { id:'abg_tipo_hecho',        label:'Tipo de hecho',      type:'select', options:['APEDREO CON LESIONES','DAÑO BIENES FFCC','ROBO BIENES FFCC','INTERRUPCIÓN A LOS MEDIOS DE TRANSPORTE','ESTRAGO','OTROS'] },
      { id:'abg_fecha_hecho',       label:'Fecha del hecho',    type:'date' },
      { id:'abg_lugar_hecho',       label:'Lugar del hecho',    type:'text',   full:true },
      { id:'estado_causa',          label:'Estado de la Causa', type:'select', options:['INSTRUCCIÓN','ELEVADA A JUICIO','JUICIO ORAL','SENTENCIA','ARCHIVADA'] },
      { id:'fecha_prox_audiencia',  label:'Próxima Audiencia',  type:'date' },
      { id:'imputados',             label:'Imputados',          type:'text' },
      { id:'observaciones',         label:'Observaciones',      type:'textarea', full:true },
    ],
  },

  DEFENSA_CIVIL: {
    label: 'Defensa Civil',
    mesa: [
      { id:'numero_causa',          label:'N° Causa',                    type:'causa' },
      { id:'juzgado',               label:'Juzgado',                     type:'juzgado' },
      { id:'mesa_caratula',         label:'Carátula',                    type:'text',   full:true },
      { id:'mesa_datos_dependientes',label:'Datos de los dependientes',  type:'textarea', full:true },
      { id:'tipo_juicio',           label:'Tipo de Juicio',              type:'select', options:['ACCIDENTE - ACCIÓN CIVIL','AMPARO','COBRO DE SUMAS DE DINERO','DAÑOS Y PERJUICIOS','EJECUCIÓN FISCAL'] },
      { id:'monto_reclamado',       label:'Monto Reclamado',             type:'money' },
    ],
    abogado: [
      { id:'estado_tramite',     label:'Estado',                     type:'select', options:['INGRESADO','EN TRÁMITE','AUDIENCIA FIJADA','SENTENCIA','APELACIÓN','FIRME','ARCHIVADO'] },
      { id:'fecha_contestacion', label:'Fecha Contestación Demanda', type:'date' },
      { id:'abg_tipo_hecho',     label:'Tipo de hecho',              type:'text' },
      { id:'abg_fecha_hecho',    label:'Fecha del hecho',            type:'date' },
      { id:'abg_lugar_hecho',    label:'Lugar del hecho',            type:'text',   full:true },
      { id:'abg_linea',          label:'Línea ferroviaria',          type:'linea' },
      { id:'observaciones',      label:'Observaciones',              type:'textarea', full:true },
    ],
  },

  DEFENSA_PENAL: {
    label: 'Defensa Penal',
    mesa: [
      { id:'area_requirente',  label:'Área Requirente',              type:'text' },
      { id:'linea',            label:'Línea Ferroviaria',            type:'linea' },
      { id:'datos_empleado',   label:'Datos del empleado a asistir', type:'textarea', full:true },
    ],
    abogado: [
      { id:'abg_numero_causa',    label:'N° Causa / IPP',          type:'causa' },
      { id:'abg_juzgado',         label:'Juzgado',                  type:'juzgado' },
      { id:'abg_fiscalia',        label:'Fiscalía',                 type:'juzgado' },
      { id:'abg_tribunal',        label:'Tribunal',                 type:'juzgado' },
      { id:'abg_ufi',             label:'UFI',                      type:'juzgado' },
      { id:'abg_caratula',        label:'Carátula',                 type:'text',   full:true },
      { id:'abg_datos_imputados', label:'Datos de los imputados',   type:'textarea', full:true },
      { id:'abg_tipo_hecho',      label:'Tipo de hecho',            type:'select', options:['APEDREO CON LESIONES','DAÑO BIENES FFCC','ROBO BIENES FFCC','LESIONES','ESTRAGO','OTROS'] },
      { id:'abg_fecha_hecho',     label:'Fecha del hecho',          type:'date' },
      { id:'abg_lugar_hecho',     label:'Lugar del hecho',          type:'text',   full:true },
      { id:'estado_causa',        label:'Estado de la Causa',       type:'select', options:['INSTRUCCIÓN','ELEVADA A JUICIO','JUICIO ORAL','SOBRESEÍDO','SENTENCIA','ARCHIVADA'] },
      { id:'fecha_prox_audiencia',label:'Próxima Audiencia',        type:'date' },
      { id:'observaciones',       label:'Observaciones',            type:'textarea', full:true },
    ],
  },

  CARTA_SUCESO: {
    label: 'Carta Suceso (SAE)',
    mesa: [],
    abogado: [
      { id:'abg_documental',   label:'Documental',        type:'select', options:['Completo','Incompleto'] },
      { id:'numero_sae',       label:'N° de Suceso',      type:'text',   mono:true },
      { id:'abg_jurisdiccion', label:'Jurisdicción',      type:'select', options:['MORÓN','SAN ISIDRO','SAN MARTÍN','CAMPANA','CABA','MERCEDES','LOMAS DE ZAMORA','QUILMES','ZÁRATE','JUNÍN','PERGAMINO','MAR DEL PLATA','LA PLATA','TEMPERLEY'] },
      { id:'abg_tipo_hecho',   label:'Tipo de hecho',     type:'select', options:['APEDREO','APEDREO CON DAÑO','DAÑO BIENES FFCC','ROBO BIENES FFCC','LESIONES','OTROS'] },
      { id:'abg_fecha_hecho',  label:'Fecha del hecho',   type:'date' },
      { id:'abg_lugar_hecho',  label:'Lugar del hecho',   type:'text',   full:true },
      { id:'abg_linea',        label:'Línea ferroviaria', type:'linea' },
      { id:'abg_juzgado',      label:'Juzgado',           type:'juzgado' },
      { id:'abg_fiscalia',     label:'Fiscalía',          type:'juzgado' },
      { id:'abg_num_causa',    label:'N° de Causa',       type:'text',   mono:true },
      { id:'abg_denunciante',  label:'Denunciante',       type:'text' },
      { id:'estado_tramite',   label:'Estado',            type:'select', options:['PENDIENTE CARGA','CARGADA','NOTIFICADA','ARCHIVADA'] },
      { id:'observaciones',    label:'Observaciones',     type:'textarea', full:true },
    ],
  },

  PEDIDO_CAUSA_PENAL: {
    label: 'Pedido de Causa Penal',
    mesa: [
      { id:'linea',        label:'Línea Ferroviaria',   type:'linea' },
      { id:'juzgado',      label:'Fiscalía / UFI',      type:'juzgado' },
      { id:'numero_causa', label:'N° Causa / IPP',      type:'causa' },
      { id:'tipo_hecho',   label:'Tipo de Hecho',       type:'select', options:['DAÑO BIENES FFCC','ROBO BIENES FFCC','LESIONES','ESTRAGO','OTROS'] },
      { id:'fiscalia',     label:'Fiscalía',            type:'juzgado' },
      { id:'tribunal',     label:'Tribunal',            type:'juzgado' },
      { id:'ufi',          label:'UFI',                 type:'juzgado' },
      { id:'caratula',     label:'Carátula',            type:'text',   full:true },
      { id:'fecha_hecho',  label:'Fecha del hecho',     type:'date' },
      { id:'lugar_hecho',  label:'Lugar del hecho',     type:'text',   full:true },
    ],
    abogado: [
      { id:'estado_tramite',        label:'Estado',                 type:'select', options:['INGRESADO','PENDIENTE RESPUESTA','RECIBIDA CAUSA','ARCHIVADO'] },
      { id:'fecha_recepcion_causa', label:'Fecha Recepción Causa',  type:'date' },
      { id:'abg_num_siniestro',     label:'N° de Siniestro',        type:'text',   mono:true },
      { id:'observaciones',         label:'Observaciones',          type:'textarea', full:true },
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
      { id:'abg_tipo_hecho',     label:'Tipo de hecho',              type:'text' },
      { id:'abg_fecha_hecho',    label:'Fecha del hecho',            type:'date' },
      { id:'abg_lugar_hecho',    label:'Lugar del hecho',            type:'text',   full:true },
      { id:'abg_linea',          label:'Línea ferroviaria',          type:'linea' },
      { id:'abg_num_siniestro',  label:'N° de Siniestro',            type:'text',   mono:true },
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
      { id:'abg_tipo_hecho',     label:'Tipo de hecho',              type:'text' },
      { id:'abg_fecha_hecho',    label:'Fecha del hecho',            type:'date' },
      { id:'abg_lugar_hecho',    label:'Lugar del hecho',            type:'text',   full:true },
      { id:'abg_linea',          label:'Línea ferroviaria',          type:'linea' },
      { id:'abg_num_siniestro',  label:'N° de Siniestro',            type:'text',   mono:true },
      { id:'observaciones',      label:'Observaciones',              type:'textarea', full:true },
    ],
  },

  OTRAS: {
    label: 'Otras presentaciones / gestiones',
    mesa: [
      { id:'fecha_ingreso',    label:'Fecha del ingreso',        type:'date' },
      { id:'remitente',        label:'Remitente',                 type:'text' },
      { id:'tema_reclamo',     label:'Tema / Reclamo principal', type:'text',   full:true },
      { id:'descripcion_gestion', label:'Descripción de la Gestión',      type:'textarea', full:true },
      { id:'juzgado',          label:'Juzgado / Organismo (si aplica)',  type:'juzgado' },
      { id:'numero_causa',     label:'N° Causa (si aplica)',             type:'causa' },
    ],
    abogado: [
      { id:'estado_tramite',    label:'Estado',                                   type:'select', options:['INGRESADO','EN TRÁMITE','RESUELTO','ARCHIVADO'] },
      { id:'requiere_respuesta',label:'Requiere respuesta',                        type:'select', options:['Sí','No'] },
      { id:'area_informante',   label:'Área informante',                           type:'text' },
      { id:'vinculacion',       label:'Vinculación con contrato o expediente',     type:'text',   full:true },
      { id:'fecha_respuesta',   label:'Fecha de respuesta',                        type:'date' },
      { id:'observaciones',     label:'Observaciones',                             type:'textarea', full:true },
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
