export type TipoNotificacion = 'ASIGNACION' | 'REASIGNACION' | 'ALERTA_VENCIMIENTO'

export interface Notificacion {
  id: string
  tipo: TipoNotificacion
  expedienteId: string
  tipoGestion: string
  caratula: string
  numeroCausa: string | null
  leida: boolean
  fecha: string
  destinatarioId: string
  titulo?: string     
  descripcion?: string
}

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
  | 'LANZAMIENTO_JUDICIALIZADO'
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
  activo?: boolean
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
  soloDesdeJuicio?: boolean
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
  cuil?: string
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
  es_urgente?: boolean
  estadoProcesal?: string
  es_juicio_iniciado?: boolean
  fecha_inicio_juicio?: string
  fecha_ultimo_impulsorio?: string
}

export interface VinculoExpediente {
  id: string
  area: Area
  tipo: TipoGestion
  caratula: string
  estado: string
  estadoLabel: string
  tipo_relacion: 'MISMO_SINIESTRO' | 'MISMA_CAUSA' | 'RELACIONADO' | 'ANTECEDENTE' | 'JUDICIALIZADO'
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
  id: string
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

export interface Reply {
  id:                 string
  autor_id:           string
  texto:              string
  fecha:              string
  doc_gde?:           string
  fecha_vencimiento?: string
  fecha_aviso?:       string
  created_at:         string
}

export type TipoLogAuditoria = 'EDICION' | 'ELIMINACION'

export interface LogAuditoria {
  id:             string
  tipo:           TipoLogAuditoria
  usuario_id:     string
  timestamp:      string       // ISO
  descripcion:    string       // texto libre
  campo_antes?:   string       // snapshot anterior (JSON.stringify)
  campo_despues?: string       // snapshot posterior
}

export interface Actividad {
  id?: string
  expediente_id?: string
  tipo: TipoActividad
  titulo: string
  descripcion: string
  estado?: EstadoActividad
  estadoExpediente?: string
  etapaAnteriorLabel?: string
  etapaNuevaLabel?: string
  fecha: string
  vencimiento?: string
  doc_gde?: string | null
  checklist?: ChecklistItem[]
  subitems: SubActividad[]
  creado_por?: string
  activo: boolean
  adjunto_nombre?: string | null
  tareasSnapshot?: Tarea[]
  es_movimiento_impulsorio?: boolean
  replies?: Reply[]
  log?: LogAuditoria[]
  eliminado?: boolean
  fecha_vencimiento?: string
  fecha_aviso?: string
  escrito_id?: string                    // referencia al EscritoTemplate usado, si vino del generador
  escrito_estado?: EstadoEscritoActividad // GENERADO = se descargó el .docx y falta la aprobación externa
}

export type EstadoEscritoActividad = 'GENERADO' | 'APROBADO_CARGADO'

export interface AgendaEvent {
  id: string
  expediente_id: string
  actividad_id: string
  titulo: string
  fecha_vencimiento: string
  estado: EstadoActividad
  abogado_id: string
  area: Area
  tipo?: 'AUDIENCIA' | 'TAREA' | 'ACTIVIDAD' | 'SISTEMA'
}

export type EstadoTarea = 'sin_estado' | 'en_curso' | 'cumplido' | 'no_procedente'

export type UrgenciaTarea = 'rojo' | 'ambar' | 'verde' | 'gris'

export interface Tarea {
  id: string
  nombre: string
  estado: EstadoTarea
  fecha?: string | null
  fechaVencimiento?: string | null
  fecha_aviso?: string | null
  alertaActiva?: boolean
  diasAlerta?: number | null
  observaciones?: string
  docGde?: string | null
  rango_aviso?: 'diario' | 5 | 10 | 15 | null
  mostrar_en_agenda?: boolean
}

export interface EstadoProcesal {
  codigo: string
  label: string
  siguiente?: string
  tareas: Tarea[]
  esArchivado?: boolean
}

export type EntradaTimeline =
  | { kind: 'actividad'; data: Actividad }
  | { kind: 'estado'; estadoAnterior: string; estadoNuevo: string; fecha: string; usuarioId: string; tareas: Tarea[] }

export type NivelAutomatizacionEscrito =
  | 'AUTOMATICA'
  | 'ASISTIDA_DATO'
  | 'ASISTIDA_CRITERIO'

export type FueroEscrito = 'CIVIL' | 'LABORAL' | 'AMBOS'

export type TipoCampoVariable =
  | 'text' | 'textarea' | 'date' | 'select' | 'interviniente'

export interface VariableEscrito {
  id: string                 // slug usado en el cuerpo como {{id}}
  label: string
  tipo: TipoCampoVariable
  opciones?: string[]        // para 'select'
  requerido?: boolean
  esDestinatarioCedula?: boolean   // dispara auto-fill desde Intervinientes
}

export interface EscritoTemplate {
  id: string                       // 'MT-01'...'MT-29'
  grupo: string                    // '1. Presentación y personería', etc.
  titulo: string                   // título EXACTO que se escribe en la actividad
  fuero: FueroEscrito
  nivel: NivelAutomatizacionEscrito
  cuerpo: string                   // texto con placeholders {{variable_id}}
  variables: VariableEscrito[]
  linkModelo?: string              // para 'Asistida por criterio' (link a modelo completo)
  observaciones?: string
}

export type CaracterRepresentacion = 'APODERADO' | 'PATROCINANTE' | 'DERECHO_PROPIO'
export type RepresentadoEscrito = 'ESTADO_NACIONAL' | 'SOFSE'

export interface Matricula {
  id: string
  abogado_id: string        // dueño de la matrícula (referencia a Usuario.id)
  area: Area                // a qué área pertenece esta matrícula (CIVIL/LABORAL/PENAL)
  jurisdiccion: string       // 'CABA' | 'PBA' | ...
  tomo: string
  folio: string
}

export interface DatosEscrito {
  matricula_id: string        // fuente de verdad — el firmante se DERIVA de acá
  firmante_id: string         // = matriculas.find(m => m.id === matricula_id)?.abogado_id
  caracter: CaracterRepresentacion
  representado: RepresentadoEscrito
  cuil_firmante: string
  causa: string | null
  juzgado?: string
  secretaria?: string
  variables: Record<string, string>   // valores cargados por variable_id
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
  | 'fuero_select'
  | 'juzgado_filtered'
  | 'secretaria_juzgado'
  | 'select'
  | 'multiselect'
  | 'abogado_select'

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
  juzgadoRef?: string
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

// ── Módulo Penal ─────────────────────────────────────

export type EstadoActividadPenal =
  'sin_estado' | 'en_curso' | 'cumplido' | 'no_procedente'

export type ResultadoBinario = 'SI' | 'NO' | null
export type ResultadoAcuerdo = 'HAY_ACUERDO' | 'NO_HAY_ACUERDO' | null

export interface CampoPenal {
  id: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'money' | 'boolean' | 'upload' | 'select'
  placeholder?: string
  options?: string[]
  full?: boolean
}

export interface SubActividadPenal {
  id: string
  numero: string
  nombre: string
  tipo: 'SI_NO' | 'ACUERDO' | 'LIBRE'
  finalizaCausa?: boolean
  avanzaEtapa?: string
  camposSI?: CampoPenal[]
  camposNO?: CampoPenal[]
  camposHayAcuerdo?: CampoPenal[]
  camposNoAcuerdo?: CampoPenal[]
  camposLibres?: CampoPenal[]
}

export interface RegistroActividadPenal {
  id: string
  subActividadId: string
  numero: string
  nombre: string
  estado: EstadoActividadPenal
  resultado: ResultadoBinario | ResultadoAcuerdo
  fecha: string
  campos: Record<string, string | boolean>
  observaciones?: string
  etapaCodigo: string
}

export interface EtapaPenal {
  codigo: string
  label: string
  numero: number
  siguiente?: string
  subActividades: SubActividadPenal[]
}
