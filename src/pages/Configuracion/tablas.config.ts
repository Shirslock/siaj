export type TipoTablaConfig =
  | 'simple'
  | 'extended'
  | 'tipoGestion'
  | 'usuario'

export interface TablaConfig {
  id:           string
  label:        string
  storeKey:     string
  tipo:         TipoTablaConfig
  soloLectura?: boolean
  icono?:       string
  especial?:    string
}

export interface GrupoConfig {
  id:     string
  label:  string
  icono:  string
  tablas: TablaConfig[]
}

export const GRUPOS_CONFIG: GrupoConfig[] = [
  {
    id: 'base',
    label: 'Configuración Base',
    icono: 'settings',
    tablas: [
      { id: 'areas',          label: 'Área Jurídica',          storeKey: '', tipo: 'simple',   soloLectura: true },
      { id: 'canales',        label: 'Canal de Ingreso',        storeKey: '', tipo: 'simple',   soloLectura: true },
      { id: 'intervenciones', label: 'Tipo de Intervención',    storeKey: '', tipo: 'simple',   soloLectura: true },
      { id: 'lineas',         label: 'Líneas Ferroviarias',     storeKey: 'lineas', tipo: 'simple' },
    ],
  },
  {
    id: 'gestion',
    label: 'Gestión Jurídica',
    icono: 'gavel',
    tablas: [
      { id: 'tiposGestion',          label: 'Tipos de Gestión',               storeKey: 'tiposGestion',          tipo: 'tipoGestion' },
      { id: 'tiposJuicio',           label: 'Tipo de Juicio',                  storeKey: 'tiposJuicio',           tipo: 'simple' },
      { id: 'areasRequirente',       label: 'Área Requirente',                 storeKey: 'areasRequirente',       tipo: 'simple' },
      { id: 'documental',            label: 'Documental',                      storeKey: 'documental',            tipo: 'simple' },
      { id: 'caracteresOficio',      label: 'Carácter del Oficio',             storeKey: 'caracteresOficio',      tipo: 'simple' },
      { id: 'tiposMediacion',        label: 'Tipo de Mediación',               storeKey: 'tiposMediacion',        tipo: 'simple' },
      { id: 'topesConvenio',         label: 'Tope de Convenio',                storeKey: 'topesConvenio',         tipo: 'simple' },
      { id: 'jurisdiccionesCS',      label: 'Jurisdicción — Carta Suceso',     storeKey: 'jurisdiccionesCS',      tipo: 'simple' },
      { id: 'tiposSolicitudOficioP', label: 'Tipo Solicitud Oficio Penal',     storeKey: 'tiposSolicitudOficioP', tipo: 'simple' },
    ],
  },
  {
    id: 'organismos',
    label: 'Organismos Judiciales',
    icono: 'work',
    tablas: [
      { id: 'juzgados',   label: 'Juzgados',                  storeKey: 'juzgados',   tipo: 'extended' },
      { id: 'tribunales', label: 'Tribunales',                 storeKey: 'tribunales', tipo: 'extended' },
      { id: 'fiscalias',  label: 'Fiscalías',                  storeKey: 'fiscalias',  tipo: 'extended' },
      { id: 'ufis',       label: 'UFI',                        storeKey: 'ufis',       tipo: 'extended' },
      { id: 'comisarias', label: 'Seguridad / Comisarías',     storeKey: 'comisarias', tipo: 'extended' },
    ],
  },
  {
    id: 'hechos',
    label: 'Catálogo de Hechos y Sanciones',
    icono: 'timeline',
    tablas: [
      { id: 'tiposHechoDesafuero',      label: 'Tipo de Hecho — Desafueros',       storeKey: 'tiposHechoDesafuero',      tipo: 'simple' },
      { id: 'tiposHechoPenal',          label: 'Tipo de Hecho — Penal / Denuncia', storeKey: 'tiposHechoPenal',          tipo: 'simple' },
      { id: 'tiposHechoDemandaCivil',   label: 'Tipo Hecho Demanda Civil',          storeKey: 'tiposHechoDemandaCivil',   tipo: 'simple' },
      { id: 'tiposHechoDemandaLaboral', label: 'Tipo Hecho Demanda Laboral',        storeKey: 'tiposHechoDemandaLaboral', tipo: 'simple' },
      { id: 'tiposHechoCartaSuceso',    label: 'Tipo Hecho Carta Suceso',           storeKey: 'tiposHechoCartaSuceso',    tipo: 'simple' },
      { id: 'sanciones', label: 'Sanción', storeKey: 'sanciones', tipo: 'simple', especial: 'sancion' },
    ],
  },
  {
    id: 'personal',
    label: 'Personal e Intervinientes',
    icono: 'people',
    tablas: [
      { id: 'usuarios',              label: 'Abogados / Usuarios',           storeKey: 'usuarios',              tipo: 'usuario' },
      { id: 'rolesInterviniente',    label: 'Intervinientes — Rol Procesal',  storeKey: 'rolesInterviniente',    tipo: 'simple' },
      { id: 'tiposDocInterviniente', label: 'Intervinientes — Tipo Documento', storeKey: 'tiposDocInterviniente', tipo: 'simple' },
    ],
  },
]

// Datos estáticos de solo lectura
export const DATOS_SOLO_LECTURA: Record<string, { id: string; label: string }[]> = {
  areas: [
    { id: 'CIVIL',    label: 'CIVIL' },
    { id: 'LABORAL',  label: 'LABORAL' },
    { id: 'PENAL',    label: 'PENAL' },
  ],
  canales: [
    { id: 'EE_GDE',   label: 'EE GDE' },
    { id: 'MEMO_GDE', label: 'MEMO GDE' },
    { id: 'OTROS',    label: 'OTROS' },
  ],
  intervenciones: [
    { id: 'TI_001', label: 'Actora' },
    { id: 'TI_002', label: 'Demandada' },
    { id: 'TI_003', label: 'Denunciante' },
    { id: 'TI_004', label: 'Sin Intervención' },
  ],
}
