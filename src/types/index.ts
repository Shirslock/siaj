export type Area = 'CIVIL' | 'LABORAL' | 'PENAL'

export type Canal = 'EE_GDE' | 'MEMO_GDE' | 'OTROS'

export type RolSistema = 'REFERENTE' | 'COORDINADOR' | 'ABOGADO' | 'ADMINISTRATIVO'

export type RolBD =
  | 'gerente'
  | 'abogado_coordinador'
  | 'abogado'
  | 'abogada'
  | 'asistente_jurídico'
  | 'adm_mesa'

export type TipoGestion =
  | 'OFICIO'
  | 'CARTA_DOC'
  | 'MEDIACION'
  | 'SECLO'
  | 'BENEFICIO_LITIGAR'
  | 'COBRO_CANON'
  | 'RECLAMO_CONTRAT'
  | 'LANZAMIENTO'
  | 'RECUPERO'
  | 'CONSIGNACION'
  | 'DESAFUERO'
  | 'EJECUCION_GAR'
  | 'QUERELLA'
  | 'DEFENSA_CIVIL'
  | 'DEFENSA_PENAL'
  | 'CARTA_SUCESO'
  | 'PEDIDO_CAUSA_PENAL'
  | 'DEMANDA_CIVIL'
  | 'DEMANDA_LABORAL'
  | 'OTRAS'

export interface CatalogoItem {
  id: string
  label: string
}

export interface CatalogoItemExtended extends CatalogoItem {
  tipo?: string
  provincia?: string
  localidad?: string
}

export interface TipoGestionItem {
  code: TipoGestion
  id: string
  label: string
  areas: Area[]
  canal: Canal
  canales: Canal[]
}

export interface Usuario {
  id: string
  apellido: string
  nombre: string
  rolBD: RolBD
  roles: RolBD[]
  rolSistema: RolSistema
  areas: Area[]
  lineasPenal?: string[]
  fifoOrder?: {
    CIVIL?: number
    LABORAL?: number
  }
}

export interface Expediente {
  id: string
  area: Area
  tipo: TipoGestion
  estado: string
  caratula: string
  numero_ee_gde: string
  numero_causa?: string | null
  juzgado?: string
  linea?: string
  abogado_id?: string
  fecha_recepcion: string
  campos_mesa: Record<string, unknown>
  campos_abogado: Record<string, unknown>
  vinculos: VinculoExpediente[]
  intervinientes: Interviniente[]
  timeline: Actividad[]
  documentos: Documento[]
  observaciones?: string
  es_principal?: boolean
}

export interface VinculoExpediente {
  id: string
  area: Area
  tipo: TipoGestion
  caratula: string
  estado: string
  estadoLabel: string
  tipo_relacion: 'MISMO_SINIESTRO' | 'MISMA_CAUSA' | 'RELACIONADO'
  numero_causa?: string
  abogado_id?: string
}

export interface Interviniente {
  id: string
  nombre: string
  rol_procesal: string
  tipo_documento: string
  numero_documento: string
  contacto_email?: string
  contacto_telefono?: string
  contacto_domicilio?: string
  representado_por?: string
  observaciones?: string
}

export interface Documento {
  nombre: string
  tipo: string
  fecha: string
  size: string
  icon: string
  color: string
}

export type EstadoActividad = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'VENCIDA'

export type TipoActividad =
  | 'RECEPCION'
  | 'CONTESTACION'
  | 'PRESENTACION'
  | 'AUDIENCIA'
  | 'PERICIA'
  | 'TRASLADO'
  | 'NOTIFICACION'
  | 'MOVIMIENTO'
  | 'NOTA_RESPUESTA'
  | 'OTRO'

export interface ChecklistItem {
  id: string
  texto: string
  completado: boolean
  orden: number
}

export interface SubActividad {
  fecha: string
  titulo: string
  descripcion: string
  doc_gde?: string | null
}

export interface Actividad {
  id?: string
  expediente_id?: string
  tipo: TipoActividad
  titulo: string
  descripcion: string
  estado?: EstadoActividad
  estadoExpediente?: string
  fecha: string
  vencimiento?: string
  doc_gde?: string | null
  checklist?: ChecklistItem[]
  subitems: SubActividad[]
  creado_por?: string
  activo: boolean
}

export interface AgendaEvent {
  id: string
  expediente_id: string
  actividad_id: string
  titulo: string
  fecha_vencimiento: string
  estado: EstadoActividad
  abogado_id: string
  area: Area
}

export type TipoCampo =
  | 'text'
  | 'date'
  | 'money'
  | 'textarea'
  | 'boolean'
  | 'causa'
  | 'linea'
  | 'juzgado'
  | 'select'

export interface CampoFormulario {
  id: string
  label: string
  type: TipoCampo
  placeholder?: string
  required?: boolean
  hint?: string
  defaultToday?: boolean
  full?: boolean
  mono?: boolean
  options?: string[] | { value: string; label: string }[]
  onchange?: string
  dependsOn?: { field: string; value: string }
}

export interface FormularioSubtipo {
  label: string
  mesa: CampoFormulario[]
  abogado: CampoFormulario[]
  variante_penal?: {
    mesa: CampoFormulario[]
    abogado: CampoFormulario[]
  }
}

export interface ItemQueue {
  id: string
  ee: string
  tipo: TipoGestion
  area: Area
  canal: Canal
  caratula: string
  fecha: string
  estado: 'PENDIENTE' | 'ASIGNADO' | 'OBSERVADO'
}

export interface FiltrosExpediente {
  area?: Area
  tipo?: TipoGestion
  estado?: string
  abogado_id?: string
  busqueda?: string
}

export interface AccesosRol {
  nav: string[]
  puedeReasignar: boolean
  verTodaBandeja: boolean
  inicio: string
}
