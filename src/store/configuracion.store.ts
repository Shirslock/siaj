import { create } from 'zustand'
import {
  LINEAS_FERROVIARIAS, TIPOS_GESTION,
  TIPOS_JUICIO, AREAS_REQUIRENTE, DOCUMENTAL,
  CARACTERES_OFICIO, TIPOS_MEDIACION,
  TOPES_CONVENIO, JURISDICCIONES_CS,
  JUZGADOS, TRIBUNALES, FISCALIAS, UFIS,
  COMISARIAS, TIPOS_HECHO_PENAL,
  TIPOS_HECHO_DESAFUERO, SANCIONES,
  ROLES_INTERVINIENTE, TIPOS_DOC_INTERVINIENTE,
} from '../data/catalogos'
import { USUARIOS } from '../data/usuarios'
import type { CatalogoItem, CatalogoItemExtended, TipoGestionItem } from '../types'

type Tabla = CatalogoItem[] | CatalogoItemExtended[] | TipoGestionItem[]

interface ConfiguracionState {
  lineas:                   CatalogoItem[]
  tiposGestion:             TipoGestionItem[]
  tiposJuicio:              CatalogoItem[]
  areasRequirente:          CatalogoItem[]
  documental:               CatalogoItem[]
  caracteresOficio:         CatalogoItem[]
  tiposMediacion:           CatalogoItem[]
  topesConvenio:            CatalogoItem[]
  jurisdiccionesCS:         CatalogoItem[]
  tiposSolicitudOficioP:    CatalogoItem[]
  juzgados:                 CatalogoItemExtended[]
  tribunales:               CatalogoItemExtended[]
  fiscalias:                CatalogoItemExtended[]
  ufis:                     CatalogoItemExtended[]
  comisarias:               CatalogoItemExtended[]
  tiposHechoPenal:          CatalogoItem[]
  tiposHechoDesafuero:      CatalogoItem[]
  tiposHechoDemandaCivil:   CatalogoItem[]
  tiposHechoDemandaLaboral: CatalogoItem[]
  tiposHechoCartaSuceso:    CatalogoItem[]
  sanciones:                CatalogoItem[]
  rolesInterviniente:       CatalogoItem[]
  tiposDocInterviniente:    CatalogoItem[]
  usuarios:                 typeof USUARIOS

  agregarItem:    (tabla: string, item: CatalogoItem) => void
  editarItem:     (tabla: string, id: string, cambios: Partial<CatalogoItem>) => void
  desactivarItem: (tabla: string, id: string) => void
}

export const useConfiguracionStore = create<ConfiguracionState>((set) => ({
  lineas:                LINEAS_FERROVIARIAS,
  tiposGestion:          TIPOS_GESTION,
  tiposJuicio:           TIPOS_JUICIO,
  areasRequirente:       AREAS_REQUIRENTE,
  documental:            DOCUMENTAL,
  caracteresOficio:      CARACTERES_OFICIO,
  tiposMediacion:        TIPOS_MEDIACION,
  topesConvenio:         TOPES_CONVENIO,
  jurisdiccionesCS:      JURISDICCIONES_CS,
  tiposSolicitudOficioP: [
    { id: 'TSO_001', label: 'Solicitud de información' },
    { id: 'TSO_002', label: 'Solicitud de filmaciones' },
    { id: 'TSO_003', label: 'Solicitud de intervención' },
    { id: 'TSO_004', label: 'Citaciones' },
    { id: 'TSO_005', label: 'Solicitud de asistencia a MARC' },
    { id: 'TSO_006', label: 'Otros' },
  ],
  juzgados:                 JUZGADOS,
  tribunales:               TRIBUNALES,
  fiscalias:                FISCALIAS,
  ufis:                     UFIS,
  comisarias:               COMISARIAS,
  tiposHechoPenal:          TIPOS_HECHO_PENAL,
  tiposHechoDesafuero:      TIPOS_HECHO_DESAFUERO,
  tiposHechoDemandaCivil: [
    { id: 'THC_001', label: 'ACCIDENTE - ACCIÓN CIVIL' },
    { id: 'THC_002', label: 'DAÑOS Y PERJUICIOS' },
    { id: 'THC_003', label: 'COBRO DE SUMAS DE DINERO' },
    { id: 'THC_004', label: 'AMPARO' },
    { id: 'THC_005', label: 'OTROS' },
  ],
  tiposHechoDemandaLaboral: [
    { id: 'THL_001', label: 'DESPIDO' },
    { id: 'THL_002', label: 'ACCIDENTE DE TRABAJO' },
    { id: 'THL_003', label: 'ENFERMEDAD PROFESIONAL' },
    { id: 'THL_004', label: 'DIFERENCIAS SALARIALES' },
    { id: 'THL_005', label: 'OTROS' },
  ],
  tiposHechoCartaSuceso: [
    { id: 'THX_001', label: 'APEDREO' },
    { id: 'THX_002', label: 'APEDREO CON DAÑO' },
    { id: 'THX_003', label: 'DAÑO BIENES FFCC' },
    { id: 'THX_004', label: 'ROBO BIENES FFCC' },
    { id: 'THX_005', label: 'LESIONES' },
    { id: 'THX_006', label: 'OTROS' },
  ],
  sanciones:             SANCIONES,
  rolesInterviniente:    ROLES_INTERVINIENTE,
  tiposDocInterviniente: TIPOS_DOC_INTERVINIENTE,
  usuarios:              [...USUARIOS],

  agregarItem: (tabla, item) =>
    set(state => ({
      [tabla]: [...(state[tabla as keyof ConfiguracionState] as Tabla), item],
    })),

  editarItem: (tabla, id, cambios) =>
    set(state => ({
      [tabla]: (state[tabla as keyof ConfiguracionState] as CatalogoItem[])
        .map(i => i.id === id ? { ...i, ...cambios } : i),
    })),

  desactivarItem: (tabla, id) =>
    set(state => ({
      [tabla]: (state[tabla as keyof ConfiguracionState] as CatalogoItem[])
        .map(i => i.id === id ? { ...i, activo: false } : i),
    })),
}))
