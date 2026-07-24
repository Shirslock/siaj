import type { TipoGestionItem, CatalogoItem, CatalogoItemExtended, Area } from '../types'

export const LINEAS_FERROVIARIAS: CatalogoItem[] = [
  { id:'LIN_001', label:'ROCA' },
  { id:'LIN_002', label:'SAN MARTÍN' },
  { id:'LIN_003', label:'SARMIENTO' },
  { id:'LIN_004', label:'MITRE' },
  { id:'LIN_005', label:'BELGRANO SUR' },
  { id:'LIN_006', label:'REGIONALES' },
  { id:'LIN_007', label:'LARGA DISTANCIA' },
  { id:'LIN_008', label:'CENTRAL' },
  { id:'LIN_009', label:'TREN DE LA COSTA' },
]

export const TIPOS_GESTION: TipoGestionItem[] = [
  { code:'OFICIO',            id:'TPG_001', label:'Oficios',                          areas:['CIVIL','LABORAL','PENAL'], canal:'EE_GDE',   canales:['EE_GDE','MEMO_GDE'] },
  { code:'CARTA_DOC',         id:'TPG_002', label:'Carta Documento',                  areas:['CIVIL','LABORAL'],         canal:'EE_GDE',   canales:['EE_GDE'] },
  { code:'MEDIACION',         id:'TPG_003', label:'Mediaciones',                      areas:['CIVIL','LABORAL'],         canal:'EE_GDE',   canales:['EE_GDE','MEMO_GDE'] },
  { code:'SECLO',             id:'TPG_004', label:'SECLO',                            areas:['LABORAL'],                 canal:'EE_GDE',   canales:['EE_GDE','MEMO_GDE'] },
  { code:'BENEFICIO_LITIGAR', id:'TPG_005', label:'Beneficio de Litigar sin Gastos',  areas:['CIVIL'],                   canal:'EE_GDE',   canales:['EE_GDE'] },
  { code:'COBRO_CANON',       id:'TPG_006', label:'Cobro de Cánones',                 areas:['CIVIL'],                   canal:'EE_GDE',   canales:['EE_GDE'] },
  { code:'RECLAMO_CONTRAT',   id:'TPG_007', label:'Reclamo a Contratistas',           areas:['CIVIL'],                   canal:'EE_GDE',   canales:['EE_GDE'] },
  { code:'LANZAMIENTO',       id:'TPG_008', label:'Lanzamientos',                     areas:['CIVIL'],                   canal:'MEMO_GDE', canales:['MEMO_GDE'] },
  { code:'LANZAMIENTO_JUDICIALIZADO', id:'TPG_023', label:'Lanzamiento Judicializado', areas:['CIVIL'], canal:'MEMO_GDE', canales:['MEMO_GDE'], soloDesdeJuicio: true },
  { code:'RECUPERO',          id:'TPG_009', label:'Recuperos',                        areas:['CIVIL'],                   canal:'MEMO_GDE', canales:['MEMO_GDE'] },
  { code:'CONSIGNACION',      id:'TPG_010', label:'Consignaciones',                   areas:['LABORAL'],                 canal:'MEMO_GDE', canales:['MEMO_GDE'] },
  { code:'DESAFUERO',         id:'TPG_011', label:'Desafueros',                       areas:['LABORAL'],                 canal:'MEMO_GDE', canales:['MEMO_GDE'] },
  { code:'EJECUCION_GAR',     id:'TPG_012', label:'Ejecución de Pólizas',             areas:['CIVIL'],                   canal:'EE_GDE',   canales:['EE_GDE'] },
  { code:'QUERELLA',          id:'TPG_013', label:'Querellas',                        areas:['PENAL'],                   canal:'MEMO_GDE', canales:['MEMO_GDE'] },
  { code:'DEFENSA_CIVIL',     id:'TPG_014', label:'Defensa Civil',                    areas:['CIVIL'],                   canal:'MEMO_GDE', canales:['MEMO_GDE'] },
  { code:'DEFENSA_PENAL',     id:'TPG_015', label:'Defensa Penal',                    areas:['PENAL'],                   canal:'MEMO_GDE', canales:['MEMO_GDE'] },
  { code:'CARTA_SUCESO',      id:'TPG_016', label:'Carta Suceso (SAE)',               areas:['PENAL'],                   canal:'OTROS',    canales:['OTROS'] },
  { code:'PEDIDO_CAUSA_PENAL',id:'TPG_017', label:'Pedido de Causa Penal',            areas:['CIVIL','LABORAL','PENAL'], canal:'MEMO_GDE', canales:['MEMO_GDE'] },
  { code:'DEMANDA_CIVIL',     id:'TPG_018', label:'Demanda Civil',                    areas:['CIVIL'],                   canal:'EE_GDE',   canales:['EE_GDE'] },
  { code:'DEMANDA_LABORAL',   id:'TPG_019', label:'Demanda Laboral',                  areas:['LABORAL'],                 canal:'EE_GDE',   canales:['EE_GDE'] },
  { code:'OTRAS',             id:'TPG_022', label:'Otras presentaciones / gestiones', areas:['CIVIL','LABORAL','PENAL'], canal:'MEMO_GDE', canales:['EE_GDE','MEMO_GDE','OTROS'] },
]

export function getTiposGestionPorArea(area: Area): TipoGestionItem[] {
  return TIPOS_GESTION.filter(t => t.areas.includes(area))
}

export const JUZGADOS: CatalogoItemExtended[] = [
  { id:'JUZ_001', label:'Juzgado Federal Civil y Comercial N°1 — CABA',             tipo:'Juzgado', provincia:'CABA',      localidad:'CABA' },
  { id:'JUZ_002', label:'Juzgado Federal Civil y Comercial N°2 — CABA',             tipo:'Juzgado', provincia:'CABA',      localidad:'CABA' },
  { id:'JUZ_003', label:'Juzgado Federal en lo Criminal y Correccional N°1 — CABA', tipo:'Juzgado', provincia:'CABA',      localidad:'CABA' },
  { id:'JUZ_004', label:'Juzgado Nacional del Trabajo N°30 — CABA',                 tipo:'Juzgado', provincia:'CABA',      localidad:'CABA' },
  { id:'JUZ_005', label:'Juzgado Federal de Córdoba',                               tipo:'Juzgado', provincia:'Córdoba',   localidad:'Córdoba' },
  { id:'JUZ_006', label:'Juzgado Contencioso Administrativo Federal N°1',           tipo:'Juzgado', provincia:'Federal',   localidad:'Federal' },
  { id:'JUZ_007', label:'Juzgado Federal de Mendoza',                               tipo:'Juzgado', provincia:'Mendoza',   localidad:'Mendoza' },
  { id:'JUZ_008', label:'Juzgado Federal de Rosario',                               tipo:'Juzgado', provincia:'Santa Fe',  localidad:'Rosario' },
]

export const TRIBUNALES: CatalogoItemExtended[] = [
  { id:'TRI_001', label:'Cámara Federal Civil y Comercial — CABA',   tipo:'Tribunal', provincia:'CABA',    localidad:'CABA' },
  { id:'TRI_002', label:'Cámara Nacional del Trabajo — CABA',        tipo:'Tribunal', provincia:'CABA',    localidad:'CABA' },
  { id:'TRI_003', label:'Cámara Contencioso Administrativo Federal', tipo:'Tribunal', provincia:'Federal', localidad:'Federal' },
]

export const FISCALIAS: CatalogoItemExtended[] = [
  { id:'FIS_001', label:'Fiscalía General La Plata',       tipo:'Fiscalía', provincia:'Buenos Aires', localidad:'La Plata' },
  { id:'FIS_002', label:'Fiscalía de Instrucción Córdoba', tipo:'Fiscalía', provincia:'Córdoba',      localidad:'Córdoba' },
  { id:'FIS_003', label:'Fiscalía Regional Rosario',       tipo:'Fiscalía', provincia:'Santa Fe',     localidad:'Rosario' },
]

export const UFIS: CatalogoItemExtended[] = [
  { id:'UFI_001', label:'UFI N°3 Lomas de Zamora', tipo:'UFI', provincia:'Buenos Aires', localidad:'Lomas de Zamora' },
  { id:'UFI_002', label:'UFI N°1 Morón',           tipo:'UFI', provincia:'Buenos Aires', localidad:'Morón' },
  { id:'UFI_003', label:'UFI N°2 San Isidro',      tipo:'UFI', provincia:'Buenos Aires', localidad:'San Isidro' },
]

export const COMISARIAS: CatalogoItemExtended[] = [
  { id:'SEG_001', label:'Comisaría 25 de Mayo 1°',                         tipo:'Comisaría', provincia:'Buenos Aires', localidad:'25 de Mayo' },
  { id:'SEG_002', label:'Gendarmería — Agrupación Aviación Campo de Mayo', tipo:'Comisaría', provincia:'Buenos Aires', localidad:'Campo de Mayo' },
  { id:'SEG_003', label:'Comisaría Almirante Brown 7°',                    tipo:'Comisaría', provincia:'Buenos Aires', localidad:'Glew' },
  { id:'SEG_004', label:'Comisaría 1ra La Plata',                          tipo:'Comisaría', provincia:'Buenos Aires', localidad:'La Plata' },
  { id:'SEG_005', label:'Comisaría PFA N°1',                               tipo:'Comisaría', provincia:'CABA',         localidad:'CABA' },
  { id:'SEG_006', label:'Gendarmería — Agrupación III Corrientes',         tipo:'Comisaría', provincia:'Corrientes',   localidad:'Corrientes' },
  { id:'SEG_007', label:'Comisaría Rosario Centro',                        tipo:'Comisaría', provincia:'Santa Fe',     localidad:'Rosario' },
]

export const TIPOS_INTERVENCION_CIVIL_LAB: CatalogoItem[] = [
  { id:'TI_001', label:'Actora' },
  { id:'TI_002', label:'Demandada' },
  { id:'TI_004', label:'Sin Intervención' },
]

export const TIPOS_INTERVENCION_PENAL: CatalogoItem[] = [
  { id:'TI_003', label:'Denunciante' },
  { id:'TI_004', label:'Sin Intervención' },
]

export const TIPOS_JUICIO: CatalogoItem[] = [
  { id:'JUI_001', label:'ACCIDENTE - ACCIÓN CIVIL' },
  { id:'JUI_002', label:'AMPARO' },
  { id:'JUI_003', label:'BENEFICIO DE LSG' },
  { id:'JUI_004', label:'COBRO DE SUMAS DE DINERO' },
  { id:'JUI_005', label:'CONSIGNACIÓN' },
  { id:'JUI_006', label:'DAÑOS Y PERJUICIOS' },
  { id:'JUI_007', label:'DESPIDO' },
  { id:'JUI_008', label:'DIFERENCIAS SALARIALES' },
  { id:'JUI_009', label:'EJECUCIÓN FISCAL' },
  { id:'JUI_010', label:'EJECUTIVO O PREPARACIÓN VÍA EJECUTIVA' },
]

export const TIPOS_HECHO_PENAL: CatalogoItem[] = [
  { id:'THP_001', label:'APEDREO' },
  { id:'THP_002', label:'APEDREO CON LESIONES' },
  { id:'THP_003', label:'APEDREO CON DAÑO' },
  { id:'THP_004', label:'APEDREO CON DAÑO Y LESIONES' },
  { id:'THP_005', label:'DAÑO BIENES FFCC' },
  { id:'THP_006', label:'DAÑO BIENES FFCC (DAÑO EN BARRERA)' },
  { id:'THP_007', label:'DAÑO GRAFITI' },
  { id:'THP_008', label:'ROBO BIENES FFCC' },
  { id:'THP_009', label:'ROBO DE CABLES' },
  { id:'THP_010', label:'TTVA. ROBO BIENES FFCC' },
  { id:'THP_011', label:'TTVA. ROBO DE CABLES' },
  { id:'THP_012', label:'DEFRAUDACIÓN' },
  { id:'THP_013', label:'INTERRUPCIÓN A LOS MEDIOS DE TRANSPORTE' },
  { id:'THP_014', label:'DESCARRILO' },
  { id:'THP_015', label:'ATENTADO A LOS MEDIOS DE TRANSPORTE' },
  { id:'THP_016', label:'LESIONES' },
  { id:'THP_017', label:'INCUMPLIMIENTO A LOS DEBERES DE FUNCIONARIO PÚBLICO' },
  { id:'THP_018', label:'AMENAZAS' },
  { id:'THP_019', label:'ESTRAGO' },
  { id:'THP_020', label:'INTIMIDACIÓN PÚBLICA' },
]

export const TIPOS_HECHO_DESAFUERO: CatalogoItem[] = [
  { id:'HEC_001', label:'HURTO - ROBO' },
  { id:'HEC_002', label:'VIOLENCIA' },
  { id:'HEC_003', label:'GÉNERO' },
  { id:'HEC_004', label:'REORGANIZACIÓN' },
  { id:'HEC_005', label:'OTROS' },
]

export const SANCIONES: CatalogoItem[] = [
  { id:'SAN_001', label:'Suspensión' },
  { id:'SAN_002', label:'Despidos' },
  { id:'SAN_003', label:'Otras' },
]

export const TIPOS_MEDIACION: CatalogoItem[] = [
  { id:'TME_001', label:'PRIVADA' },
  { id:'TME_002', label:'DEFENSA DEL CONSUMIDOR' },
  { id:'TME_003', label:'OTROS' },
]

export const TOPES_CONVENIO: CatalogoItem[] = [
  { id:'TOP_001', label:'SI' },
  { id:'TOP_002', label:'NO' },
  { id:'TOP_003', label:'VIZZOTI' },
]

export const JURISDICCIONES_CS: CatalogoItem[] = [
  { id:'JCS_001', label:'MORÓN' },
  { id:'JCS_002', label:'SAN ISIDRO' },
  { id:'JCS_003', label:'SAN MARTÍN' },
  { id:'JCS_004', label:'CAMPANA' },
  { id:'JCS_005', label:'CABA' },
  { id:'JCS_006', label:'MERCEDES' },
  { id:'JCS_007', label:'LOMAS DE ZAMORA' },
  { id:'JCS_008', label:'QUILMES' },
  { id:'JCS_009', label:'ZÁRATE' },
  { id:'JCS_010', label:'JUNÍN' },
  { id:'JCS_011', label:'PERGAMINO' },
  { id:'JCS_012', label:'MAR DEL PLATA' },
  { id:'JCS_013', label:'LA PLATA' },
  { id:'JCS_014', label:'TEMPERLEY' },
]

export const AREAS_REQUIRENTE: CatalogoItem[] = [
  { id:'ARQ_001', label:'COMERCIAL' },
  { id:'ARQ_002', label:'LÍNEAS' },
]

export const DOCUMENTAL: CatalogoItem[] = [
  { id:'DOC_001', label:'Completo' },
  { id:'DOC_002', label:'Incompleto' },
]

export const CARACTERES_OFICIO: CatalogoItem[] = [
  { id:'CAR_001', label:'Informativo' },
  { id:'CAR_002', label:'Urgente' },
  { id:'CAR_003', label:'Reiteratorio' },
]

export const ROLES_INTERVINIENTE: CatalogoItem[] = [
  { id:'INT_001', label:'ACTOR' },
  { id:'INT_002', label:'DEMANDADO' },
  { id:'INT_003', label:'TERCERO' },
  { id:'INT_004', label:'PERITO' },
]

export const TIPOS_DOC_INTERVINIENTE: CatalogoItem[] = [
  { id:'TC_001', label:'DNI' },
  { id:'TC_002', label:'CUIL' },
  { id:'TC_003', label:'CUIT' },
  { id:'TC_004', label:'PASAPORTE' },
]
