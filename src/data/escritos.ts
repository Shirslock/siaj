import type { EscritoTemplate } from '../types'

export const GRUPOS_ESCRITOS = [
  '1. Presentación y personería',
  '2. Bonos, tasas y copias',
  '3. Notificaciones y cédulas',
  '4. Oficios y averiguación de domicilio',
  '5. Impulso y trámite',
  '6. Prueba',
  '7. Rebeldía',
  '8. Recursos',
  '9. Caducidad',
] as const

export const ESCRITOS: EscritoTemplate[] = [
  {
    id: 'MT-01', grupo: GRUPOS_ESCRITOS[0],
    titulo: 'Se presenta - solicita se vincule',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que conforme lo acredito con la copia simple del poder general para juicios que acompaño, y que declaro vigente en todas sus partes, soy apoderad{o/a} judicial de {{representado}}, con domicilio legal y sede en Av. J. M. Ramos Mejía N° 1302, 4° piso, CABA. Que en el carácter invocado, y a fin de realizar presentaciones y producir la prueba ordenada, vengo a solicitar se vincule mi CUIT {{cuit}} al sistema como letrad{o/a} apoderad{o/a}.',
    variables: [
      { id: 'representado', label: 'Representado', tipo: 'select', opciones: ['Estado Nacional', 'SOFSE'], requerido: true },
      { id: 'cuit', label: 'CUIT', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-02', grupo: GRUPOS_ESCRITOS[0],
    titulo: 'Se presenta - acredita personería (Estado Nacional)',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que en fecha 17 de febrero de 2016 el Ministerio de Transporte dictó la Resolución N° 21, por la cual autorizó a la Gerencia de Asuntos Jurídicos y Legales de la OPERADORA FERROVIARIA SOCIEDAD DEL ESTADO (SOFSE) a asumir la representación del Estado Nacional en las causas relativas a reclamos judiciales derivados del transporte ferroviario de su competencia. En consecuencia, mediante el poder que se adjunta, esta operadora facultó a los abogados allí detallados a presentarse e intervenir en defensa de los intereses del Estado Nacional en todo asunto judicial o extrajudicial, presente o futuro, de cualquier naturaleza, fuero o jurisdicción. Adjunto copia de los actos mencionados para que se tenga por acreditada la personería invocada.',
    variables: [],
    observaciones: 'Acredita personería Res. MT 21/2016. Título distinto de MT-10.',
  },
  {
    id: 'MT-03', grupo: GRUPOS_ESCRITOS[0],
    titulo: 'Autoriza',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que vengo a autorizar a {{personas_autorizadas}} a compulsar el expediente, retirar copias y diligenciar cédulas y oficios, y a realizar las diligencias de mero trámite que correspondan.',
    variables: [{ id: 'personas_autorizadas', label: 'Personas autorizadas', tipo: 'text', requerido: true }],
    observaciones: 'Fórmula pendiente de confirmar con Gerencia.',
  },
  {
    id: 'MT-04', grupo: GRUPOS_ESCRITOS[1],
    titulo: 'Acredita bono genérico y específico',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Por medio del presente, vengo a acompañar bono profesional, conforme el art. 51 inc. d) de la ley 23.187, solicitando sea agregado a sus efectos.',
    variables: [],
    observaciones: "Variante 'con Deox' agrega solicitud de Deox al CPACF (checkbox opcional a futuro).",
  },
  {
    id: 'MT-05', grupo: GRUPOS_ESCRITOS[1],
    titulo: 'Solicita eximir copias',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que habiendo advertido que el traslado de la demanda fue ordenado sin eximición de copias, vengo a solicitar se exima de las mismas, atento que tanto la demanda como su documental se encuentran digitalizadas.',
    variables: [],
  },
  {
    id: 'MT-06', grupo: GRUPOS_ESCRITOS[1],
    titulo: 'Solicita eximir sellado',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Por medio de la presente, vengo a solicitar a V.S. se exima de la colocación del Sello Medalla en las cédulas de notificación a librarse en autos.',
    variables: [],
  },
  {
    id: 'MT-07', grupo: GRUPOS_ESCRITOS[1],
    titulo: 'Solicita eximir copias y sellado (ambas)',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que vengo a solicitar a V.S.: (i) se exima de acompañar copias, atento que la demanda y su documental se encuentran digitalizadas; y (ii) se exima de la colocación del Sello Medalla en las cédulas de notificación a librarse en autos.',
    variables: [],
  },
  {
    id: 'MT-08', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Solicita nueva cédula con habilitación de días y horas',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que por medio de la presente vengo a acompañar cédula de notificación enviada a {{destinatario}}, DNI N° {{dni}}, cuyo resultado fue negativo, toda vez que el oficial notificador ha informado {{motivo}}. Que, en virtud de lo manifestado, vengo a solicitar a V.S. ordene librar una nueva cédula con habilitación de días y horas inhábiles.',
    variables: [
      { id: 'destinatario', label: 'Destinatario', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true },
      { id: 'dni', label: 'DNI', tipo: 'text', requerido: true },
      { id: 'motivo', label: 'Motivo del resultado negativo', tipo: 'textarea', requerido: true },
    ],
  },
  {
    id: 'MT-09', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Solicita bajo responsabilidad de la parte',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que vengo a solicitar se libre {{tipo_documento}} dirigida a {{destinatario}}, al domicilio denunciado, bajo responsabilidad de esta parte.',
    variables: [
      { id: 'tipo_documento', label: 'Tipo de documento', tipo: 'select', opciones: ['cédula', 'oficio'], requerido: true },
      { id: 'destinatario', label: 'Destinatario', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true },
    ],
  },
  {
    id: 'MT-10', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Se acompaña para confronte',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Se acompaña {{documento}} para su confronte.',
    variables: [{ id: 'documento', label: 'Documento que se acompaña', tipo: 'text', requerido: true }],
    observaciones: 'Si el documento es siempre el mismo pasa a Automática.',
  },
  {
    id: 'MT-11', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Oficial ad hoc',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Por medio de la presente vengo a solicitar se designe a quien suscribe como oficial notificador ad hoc, a los efectos de notificar la cédula dirigida a {{destinatario}}, toda vez que la oficina correspondiente no cuenta con oficial notificador.',
    variables: [{ id: 'destinatario', label: 'Destinatario', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true }],
  },
  {
    id: 'MT-12', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Acredita diligenciamiento (genérico)',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que vengo a acreditar el diligenciamiento correspondiente a la notificación ordenada. Solicito se tenga presente a sus efectos.',
    variables: [],
  },
  {
    id: 'MT-13', grupo: GRUPOS_ESCRITOS[3],
    titulo: 'Solicita oficio de averiguación de domicilio (Renaper / DPPJ / etc.)',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'I.- Que vengo a adjuntar la cédula dirigida a {{requerido}} con resultado negativo. II.- Que atento lo informado por el oficial notificador, y a fin de garantizar la defensa en juicio y evitar nulidades procesales, solicito a V.S. se libre oficio a {{organismo}} para que informe el último domicilio que conste en sus registros respecto de {{requerido}}, CUIT/DNI {{cuit_dni}}.',
    variables: [
      { id: 'requerido', label: 'Requerido', tipo: 'interviniente', requerido: true },
      { id: 'organismo', label: 'Organismo', tipo: 'select', opciones: ['Renaper', 'DPPJ', 'IGJ', 'Otro'], requerido: true },
      { id: 'cuit_dni', label: 'CUIT/DNI', tipo: 'text', requerido: true },
    ],
    observaciones: 'Una sola fila: el organismo es dato interno, no cambia el título.',
  },
  {
    id: 'MT-14', grupo: GRUPOS_ESCRITOS[3],
    titulo: 'Solicita oficio reiteratorio',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Atento a que {{organismo}} no ha contestado el oficio remitido el {{fecha_oficio}} por DEOX, vengo a solicitar se libre oficio reiteratorio al mismo{{apercibimiento}}.',
    variables: [
      { id: 'organismo', label: 'Organismo', tipo: 'text', requerido: true },
      { id: 'fecha_oficio', label: 'Fecha del oficio', tipo: 'date', requerido: true },
      { id: 'apercibimiento', label: 'Bajo apercibimiento de (opcional)', tipo: 'text' },
    ],
  },
  {
    id: 'MT-15', grupo: GRUPOS_ESCRITOS[3],
    titulo: 'Solicita nuevo traslado con el domicilio informado',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento el domicilio informado por {{organismo}}, vengo a solicitar se ordene un nuevo traslado de la demanda dirigido a {{demandado}}, DNI N° {{dni}}, con los mismos fines y efectos, al domicilio informado.',
    variables: [
      { id: 'organismo', label: 'Organismo', tipo: 'text', requerido: true },
      { id: 'demandado', label: 'Demandado', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true },
      { id: 'dni', label: 'DNI', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-16', grupo: GRUPOS_ESCRITOS[4],
    titulo: 'Solicita se resuelva',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que, atento al estado de autos, solicito se resuelva {{planteo}} solicitado por esta parte a fs. {{foja}}.',
    variables: [
      { id: 'planteo', label: 'Planteo / pedido', tipo: 'textarea', requerido: true },
      { id: 'foja', label: 'Foja', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-17', grupo: GRUPOS_ESCRITOS[4],
    titulo: 'Solicita se digitalice',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento a que {{que_digitalizar}} se encuentran en soporte papel, y a fin de agilizar su consulta y tramitación, vengo a solicitar se ordene su digitalización e incorporación al expediente electrónico.',
    variables: [{ id: 'que_digitalizar', label: 'Qué se digitaliza', tipo: 'text', requerido: true }],
    observaciones: 'Confirmar si es documental acompañada o el expediente completo.',
  },
  {
    id: 'MT-18', grupo: GRUPOS_ESCRITOS[5],
    titulo: 'Solicita apertura a prueba',
    fuero: 'CIVIL', nivel: 'AUTOMATICA',
    cuerpo: 'Que atento al estado de autos, vengo a solicitar se abra la causa a prueba.',
    variables: [],
    observaciones: 'En Laboral la etapa probatoria es distinta (Ley 18.345) — no ofrecer este escrito en LABORAL.',
  },
  {
    id: 'MT-19', grupo: GRUPOS_ESCRITOS[5],
    titulo: 'Solicita audiencia 360',
    fuero: 'CIVIL', nivel: 'AUTOMATICA',
    cuerpo: 'Que atento al estado de autos, vengo a solicitar a V.S. fije fecha para la audiencia preliminar del art. 360 del CPCCN.',
    variables: [],
  },
  {
    id: 'MT-20', grupo: GRUPOS_ESCRITOS[5],
    titulo: 'Solicita se declare la negligencia',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento que {{parte}} no ha producido la prueba {{prueba}} ofrecida, pese al tiempo transcurrido, vengo a acusar la negligencia en su producción y a solicitar se la tenga por desistida.',
    variables: [
      { id: 'parte', label: 'Parte', tipo: 'select', opciones: ['la parte actora', 'la parte demandada', 'el tercero citado'], requerido: true },
      { id: 'prueba', label: 'Prueba', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-21', grupo: GRUPOS_ESCRITOS[5],
    titulo: 'Solicita se recepcione prueba en soporte digital',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento que esta parte ofreció como prueba {{prueba_ofrecida}} (conf. {{escrito_y_punto}}), vengo a solicitar se ordene recepcionar {{soporte}} con {{contenido}}.',
    variables: [
      { id: 'prueba_ofrecida', label: 'Prueba ofrecida', tipo: 'text', requerido: true },
      { id: 'escrito_y_punto', label: 'Escrito y punto', tipo: 'text', requerido: true },
      { id: 'soporte', label: 'Soporte', tipo: 'text', requerido: true },
      { id: 'contenido', label: 'Contenido', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-22', grupo: GRUPOS_ESCRITOS[6],
    titulo: 'Solicita se declare la rebeldía',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que conforme surge de la cédula de notificación agregada en autos, y toda vez que {{demandado}}, DNI N° {{dni}}, ha quedado debidamente notificado el día {{fecha_notificacion}} sin que hasta la fecha se haya presentado a contestar la demanda, vengo a solicitar que se lo declare rebelde conforme el art. 59 del Código Procesal.',
    variables: [
      { id: 'demandado', label: 'Demandado', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true },
      { id: 'dni', label: 'DNI', tipo: 'text', requerido: true },
      { id: 'fecha_notificacion', label: 'Fecha de notificación', tipo: 'date', requerido: true },
    ],
  },
  {
    id: 'MT-23', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Solicita se eleven',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que atento al estado de autos, solicito se eleven las actuaciones ante la {{camara}} a efectos de que resuelva el recurso de apelación oportunamente presentado.',
    variables: [{ id: 'camara', label: 'Cámara / Sala', tipo: 'text' }],
    observaciones: 'Si la cámara debe elegirse manualmente, pasa a Asistida por dato.',
  },
  {
    id: 'MT-24', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Apela competencia',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Siguiendo expresas instrucciones de mi mandante y por causarme gravamen irreparable, vengo en tiempo y forma a deducir recurso de apelación contra la resolución dictada por V.S. en la causa el {{fecha_resolucion}}, notificada por cédula electrónica N° {{numero_cedula}} el día {{fecha_notificacion}} (conf. arts. 242 inc. 2, 243, 244, 245 y ccdtes. del CPCCN).',
    variables: [
      { id: 'fecha_resolucion', label: 'Fecha de la resolución', tipo: 'date', requerido: true },
      { id: 'numero_cedula', label: 'N° de cédula electrónica', tipo: 'text', requerido: true },
      { id: 'fecha_notificacion', label: 'Fecha de notificación', tipo: 'date', requerido: true },
    ],
    observaciones: 'Fundamentación va en el Memorial (MT-26).',
  },
  {
    id: 'MT-25', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Apela sentencia de primera instancia',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Siguiendo expresas instrucciones de mi mandante y por causarme gravamen irreparable, vengo en tiempo y forma a deducir recurso de apelación contra la resolución dictada por V.S. en la causa el {{fecha_resolucion}}, notificada por cédula electrónica N° {{numero_cedula}} el día {{fecha_notificacion}} (conf. arts. 242 inc. 2, 243, 244, 245 y ccdtes. del CPCCN).',
    variables: [
      { id: 'fecha_resolucion', label: 'Fecha de la resolución', tipo: 'date', requerido: true },
      { id: 'numero_cedula', label: 'N° de cédula electrónica', tipo: 'text', requerido: true },
      { id: 'fecha_notificacion', label: 'Fecha de notificación', tipo: 'date', requerido: true },
    ],
    observaciones: 'Expresión de agravios va aparte (Asistida por criterio).',
  },
  {
    id: 'MT-26', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Memorial competencia',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: '[ESQUELETO] I.- Objeto: funda el recurso concedido en relación, contra la resolución del {{fecha_resolucion}}, notificada el {{fecha_notificacion}}. II.- Antecedentes: {{resumen_hechos}}. III.- AGRAVIOS: [repertorio estándar SOFSE]. IV.- Petitorio.',
    variables: [
      { id: 'fecha_resolucion', label: 'Fecha de resolución/sentencia', tipo: 'date', requerido: true },
      { id: 'fecha_notificacion', label: 'Fecha de notificación', tipo: 'date', requerido: true },
      { id: 'resumen_hechos', label: 'Resumen de los hechos de la demanda', tipo: 'textarea', requerido: true },
    ],
    linkModelo: '[pendiente — link al modelo completo de Gerencia]',
    observaciones: 'Concedido en relación → memorial. Los agravios son repertorio fijo de SOFSE.',
  },
  {
    id: 'MT-27', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Revocatoria',
    fuero: 'AMBOS', nivel: 'ASISTIDA_CRITERIO',
    cuerpo: '[ESQUELETO] I.- Interpone revocatoria (con apelación en subsidio, art. 241 CPCCN). II.- Providencia recurrida: {{providencia}}. III.- AGRAVIO: {{agravio}}. IV.- Petitorio.',
    variables: [
      { id: 'providencia', label: 'Providencia recurrida', tipo: 'text', requerido: true },
      { id: 'agravio', label: 'Argumento / agravio', tipo: 'textarea', requerido: true },
    ],
    linkModelo: '[pendiente — link al modelo completo]',
    observaciones: 'Arts. 238/241 CPCCN. El agravio depende de la estrategia jurídica del letrado.',
  },
  {
    id: 'MT-28', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Revocatoria in extremis',
    fuero: 'AMBOS', nivel: 'ASISTIDA_CRITERIO',
    cuerpo: '[ESQUELETO] I.- Interpone revocatoria in extremis contra {{resolucion}}. II.- Error manifiesto: {{error_manifiesto}}. III.- Fundamento. IV.- Petitorio.',
    variables: [
      { id: 'resolucion', label: 'Resolución', tipo: 'text', requerido: true },
      { id: 'error_manifiesto', label: 'Error manifiesto', tipo: 'textarea', requerido: true },
    ],
    linkModelo: '[pendiente — link al modelo completo]',
    observaciones: 'Uso excepcional.',
  },
  {
    id: 'MT-29', grupo: GRUPOS_ESCRITOS[8],
    titulo: 'Caducidad',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento que ha transcurrido el plazo del art. 310 del CPCCN sin que se haya instado el curso del proceso —siendo el último acto impulsorio de fecha {{fecha_ultimo_impulso}}—, vengo a acusar la caducidad de la instancia y a solicitar se la declare.',
    variables: [
      { id: 'fecha_ultimo_impulso', label: 'Fecha del último acto impulsorio', tipo: 'date', requerido: true },
    ],
    observaciones: 'Auto-completar {{fecha_ultimo_impulso}} desde exp.fecha_ultimo_impulsorio cuando exista.',
  },
]

export function getEscritosPorGrupo(grupo: string, area: 'CIVIL' | 'LABORAL' | 'PENAL'): EscritoTemplate[] {
  return ESCRITOS.filter(e => e.grupo === grupo && (e.fuero === 'AMBOS' || e.fuero === area))
}

export function getEscritoById(id: string): EscritoTemplate | undefined {
  return ESCRITOS.find(e => e.id === id)
}
