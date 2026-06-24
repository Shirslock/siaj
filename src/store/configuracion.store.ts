import { create } from 'zustand'
import { getCatalogo, agregarItemCatalogo, editarItemCatalogo, getUsuarios } from '../api/catalogos'
import { TIPOS_GESTION } from '../data/catalogos'
import type { CatalogoItem, CatalogoItemExtended, TipoGestionItem } from '../types'

const TABLA_A_TIPO: Record<string, string> = {
  lineas:                    'LINEA',
  juzgados:                  'JUZGADO',
  tribunales:                'TRIBUNAL',
  fiscalias:                 'FISCALIA',
  ufis:                      'UFI',
  comisarias:                'COMISARIA',
  tiposGestion:              'TIPO_GESTION',
  tiposJuicio:               'TIPO_JUICIO',
  tiposHechoPenal:           'TIPO_HECHO_PENAL',
  tiposHechoDesafuero:       'TIPO_HECHO_DESAFUERO',
  tiposHechoDemandaCivil:    'TIPO_HECHO_DEMANDA_CIVIL',
  tiposHechoDemandaLaboral:  'TIPO_HECHO_DEMANDA_LABORAL',
  tiposHechoCartaSuceso:     'TIPO_HECHO_CARTA_SUCESO',
  sanciones:                 'SANCION',
  tiposMediacion:            'MEDIACION',
  topesConvenio:             'TOPE_CONVENIO',
  jurisdiccionesCS:          'JURISDICCION_CS',
  areasRequirente:           'AREA_REQUIRENTE',
  documental:                'DOCUMENTAL',
  caracteresOficio:          'CARACTER_OFICIO',
  rolesInterviniente:        'ROL_INTERVINIENTE',
  tiposDocInterviniente:     'TIPO_DOC_INTERVINIENTE',
}

function tablaNombre(tabla: string): string {
  return TABLA_A_TIPO[tabla] ?? tabla.toUpperCase()
}

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
  usuarios:                 any[]

  cargarCatalogos: () => Promise<void>
  cargarUsuarios:  () => Promise<void>
  agregarItem:    (tabla: string, item: CatalogoItem) => Promise<void>
  editarItem:     (tabla: string, id: string, cambios: Partial<CatalogoItemExtended> | Record<string, unknown>) => Promise<void>
  desactivarItem: (tabla: string, id: string) => Promise<void>
}

const TIPOS_CARGA = [
  ['LINEA',                    'lineas'],
  ['JUZGADO',                  'juzgados'],
  ['TRIBUNAL',                 'tribunales'],
  ['FISCALIA',                 'fiscalias'],
  ['UFI',                      'ufis'],
  ['COMISARIA',                'comisarias'],
  // TIPO_GESTION se mantiene como mock: el campo `code` no existe en catalogo_items
  ['TIPO_JUICIO',              'tiposJuicio'],
  ['TIPO_HECHO_PENAL',         'tiposHechoPenal'],
  ['TIPO_HECHO_DESAFUERO',     'tiposHechoDesafuero'],
  ['TIPO_HECHO_DEMANDA_CIVIL', 'tiposHechoDemandaCivil'],
  ['TIPO_HECHO_DEMANDA_LABORAL', 'tiposHechoDemandaLaboral'],
  ['TIPO_HECHO_CARTA_SUCESO',  'tiposHechoCartaSuceso'],
  ['SANCION',                  'sanciones'],
  ['MEDIACION',                'tiposMediacion'],
  ['TOPE_CONVENIO',            'topesConvenio'],
  ['JURISDICCION_CS',          'jurisdiccionesCS'],
  ['AREA_REQUIRENTE',          'areasRequirente'],
  ['DOCUMENTAL',               'documental'],
  ['CARACTER_OFICIO',          'caracteresOficio'],
  ['ROL_INTERVINIENTE',        'rolesInterviniente'],
  ['TIPO_DOC_INTERVINIENTE',   'tiposDocInterviniente'],
] as const

export const useConfiguracionStore = create<ConfiguracionState>((set) => ({
  lineas:                   [],
  tiposGestion:             TIPOS_GESTION,
  tiposJuicio:              [],
  areasRequirente:          [],
  documental:               [],
  caracteresOficio:         [],
  tiposMediacion:           [],
  topesConvenio:            [],
  jurisdiccionesCS:         [],
  tiposSolicitudOficioP:    [
    { id: 'TSO_001', label: 'Solicitud de información' },
    { id: 'TSO_002', label: 'Solicitud de filmaciones' },
    { id: 'TSO_003', label: 'Solicitud de intervención' },
    { id: 'TSO_004', label: 'Citaciones' },
    { id: 'TSO_005', label: 'Solicitud de asistencia a MARC' },
    { id: 'TSO_006', label: 'Otros' },
  ],
  juzgados:                 [],
  tribunales:               [],
  fiscalias:                [],
  ufis:                     [],
  comisarias:               [],
  tiposHechoPenal:          [],
  tiposHechoDesafuero:      [],
  tiposHechoDemandaCivil:   [],
  tiposHechoDemandaLaboral: [],
  tiposHechoCartaSuceso:    [],
  sanciones:                [],
  rolesInterviniente:       [],
  tiposDocInterviniente:    [],
  usuarios:                 [],

  cargarCatalogos: async () => {
    const resultados = await Promise.all(
      TIPOS_CARGA.map(([tipo]) => getCatalogo(tipo).catch(() => ({ data: [] })))
    )
    const updates: Record<string, any[]> = {}
    TIPOS_CARGA.forEach(([, key], i) => {
      updates[key] = resultados[i].data
    })
    set(updates)
  },

  cargarUsuarios: async () => {
    const res = await getUsuarios()
    set({ usuarios: res.data })
  },

  agregarItem: async (tabla, item) => {
    const tipo = tablaNombre(tabla)
    const res = await agregarItemCatalogo(tipo, item)
    set(s => ({ [tabla]: [...(s[tabla as keyof ConfiguracionState] as Tabla), res.data] }))
  },

  editarItem: async (tabla, id, cambios) => {
    const tipo = tablaNombre(tabla)
    set(s => ({
      [tabla]: (s[tabla as keyof ConfiguracionState] as CatalogoItem[])
        .map(i => i.id === id ? { ...i, ...cambios } : i),
    }))
    await editarItemCatalogo(tipo, id, cambios as Partial<CatalogoItem>)
  },

  desactivarItem: async (tabla, id) => {
    const tipo = tablaNombre(tabla)
    set(s => ({
      [tabla]: (s[tabla as keyof ConfiguracionState] as CatalogoItem[])
        .filter(i => i.id !== id),
    }))
    await editarItemCatalogo(tipo, id, { activo: false })
  },
}))
