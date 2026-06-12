import type { Usuario, RolSistema, RolBD, AccesosRol } from '../types'

export function mapRol(rolBD: string): RolSistema {
  if (rolBD === 'gerente') return 'REFERENTE'
  if (rolBD === 'abogado_coordinador') return 'COORDINADOR'
  if (rolBD === 'adm_mesa') return 'ADMINISTRATIVO'
  return 'ABOGADO'
}

export const USUARIOS: Usuario[] = [
  { id:'UR_001', apellido:'ARMANI',          nombre:'GIULIANA',      rolBD:'abogada',             roles:['abogada'],                             rolSistema: mapRol('abogada'),             areas:['LABORAL'],                    fifoOrder:{ LABORAL:1 } },
  { id:'UR_002', apellido:'BARRIOS',         nombre:'CYNTHIA',       rolBD:'asistente_jurídico',  roles:['asistente_jurídico'],                  rolSistema: mapRol('asistente_jurídico'),  areas:['CIVIL','LABORAL'] },
  { id:'UR_003', apellido:'BENITEZ',         nombre:'ADRIANA',       rolBD:'abogada',             roles:['abogada'],                             rolSistema: mapRol('abogada'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:1 } },
  { id:'UR_004', apellido:'CASANO',          nombre:'FELIX',         rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:2 } },
  { id:'UR_005', apellido:'CRESPI',          nombre:'FACUNDO',       rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:3 } },
  { id:'UR_006', apellido:'ESCALANTE',       nombre:'CAROLINA',      rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:4 } },
  { id:'UR_007', apellido:'FERRARI',         nombre:'JESSICA',       rolBD:'abogada',             roles:['abogada'],                             rolSistema: mapRol('abogada'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:5 } },
  { id:'UR_008', apellido:'GONZALEZ',        nombre:'ARACELI',       rolBD:'abogada',             roles:['abogada'],                             rolSistema: mapRol('abogada'),             areas:['CIVIL','LABORAL'],            fifoOrder:{ CIVIL:6 } },
  { id:'UR_009', apellido:'JUAREZ',          nombre:'PAL',           rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:7 } },
  { id:'UR_010', apellido:'MOLINELLI',       nombre:'RODRIGO',       rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['LABORAL'],                    fifoOrder:{ LABORAL:2 } },
  { id:'UR_011', apellido:'PEREZ',           nombre:'FERNANDA',      rolBD:'abogada',             roles:['abogada'],                             rolSistema: mapRol('abogada'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:8 } },
  { id:'UR_012', apellido:'PIRES',           nombre:'DAIANA',        rolBD:'abogada',             roles:['abogada'],                             rolSistema: mapRol('abogada'),             areas:['LABORAL'],                    fifoOrder:{ LABORAL:3 } },
  { id:'UR_013', apellido:'PISANO',          nombre:'PABLO',         rolBD:'abogado_coordinador', roles:['abogado_coordinador'],                 rolSistema: mapRol('abogado_coordinador'), areas:['CIVIL','LABORAL'] },
  { id:'UR_014', apellido:'SANTILLAN',       nombre:'MELISA',        rolBD:'abogada',             roles:['abogada'],                             rolSistema: mapRol('abogada'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:9 } },
  { id:'UR_015', apellido:'SBARBATI',        nombre:'PABLO',         rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:10 } },
  { id:'UR_016', apellido:'VETRANO',         nombre:'MAGDALENA',     rolBD:'abogada',             roles:['abogada'],                             rolSistema: mapRol('abogada'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:11 } },
  { id:'UR_017', apellido:'WILSON',          nombre:'EDUARDO',       rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['LABORAL'],                    fifoOrder:{ LABORAL:4 } },
  { id:'UR_018', apellido:'LOPEZ',           nombre:'ALEJANDRA',     rolBD:'gerente',             roles:['gerente'],                             rolSistema: mapRol('gerente'),             areas:['CIVIL','LABORAL','PENAL'] },
  { id:'UR_019', apellido:'DESIDERI',        nombre:'GUSTAVO',       rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['PENAL'],                      lineasPenal:['LIN_001','LIN_004','LIN_007','LIN_009'] },
  { id:'UR_020', apellido:'VEGA',            nombre:'DIEGO',         rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:12 } },
  { id:'UR_021', apellido:'RUSSO',           nombre:'MAURICIO',      rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['CIVIL'],                      fifoOrder:{ CIVIL:13 } },
  { id:'UR_022', apellido:'DANTIOCHIA',      nombre:'LUIS',          rolBD:'abogado_coordinador', roles:['abogado_coordinador'],                 rolSistema: mapRol('abogado_coordinador'), areas:['PENAL'],                      lineasPenal:['LIN_001','LIN_002','LIN_003','LIN_004','LIN_005','LIN_006','LIN_007','LIN_008','LIN_009'] },
  { id:'UR_023', apellido:'BIONDI',          nombre:'WALTER',        rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['PENAL'],                      lineasPenal:['LIN_002','LIN_005','LIN_008'] },
  { id:'UR_024', apellido:'PRINOTTI',        nombre:'MAXIMILIANO',   rolBD:'abogado',             roles:['abogado'],                             rolSistema: mapRol('abogado'),             areas:['PENAL'],                      lineasPenal:['LIN_002','LIN_003','LIN_006','LIN_007'] },
  { id:'UR_025', apellido:'FISICARO',        nombre:'NARELLA',       rolBD:'asistente_jurídico',  roles:['asistente_jurídico'],                  rolSistema: mapRol('asistente_jurídico'),  areas:['PENAL'],                      lineasPenal:['LIN_001','LIN_007'] },
  { id:'UR_026', apellido:'TENTORI',         nombre:'NICOLAS',       rolBD:'gerente',             roles:['gerente'],                             rolSistema: mapRol('gerente'),             areas:['CIVIL','LABORAL','PENAL'] },
  { id:'UR_027', apellido:'STRUZKA',         nombre:'SOFIA',         rolBD:'gerente',             roles:['gerente'],                             rolSistema: mapRol('gerente'),             areas:['CIVIL','LABORAL','PENAL'] },
  { id:'UR_028', apellido:'JANUSKEVICIUS',   nombre:'ANALIA',        rolBD:'adm_mesa',            roles:['adm_mesa'],                            rolSistema: mapRol('adm_mesa'),            areas:['CIVIL','LABORAL','PENAL'] },
  { id:'UR_029', apellido:'VALDIVIA ALFARO', nombre:'SELVA EDITH',   rolBD:'adm_mesa',            roles:['adm_mesa'],                            rolSistema: mapRol('adm_mesa'),            areas:['CIVIL','LABORAL','PENAL'] },
  { id:'UR_030', apellido:'ROLDAN',          nombre:'PEDRO ADRIAN',  rolBD:'adm_mesa',            roles:[],                                      rolSistema: 'ADMINISTRATIVO',             areas:[] },
  { id:'UR_031', apellido:'SOSA',            nombre:'VANINA',        rolBD:'adm_mesa',            roles:['adm_mesa'],                            rolSistema: mapRol('adm_mesa'),            areas:['CIVIL','LABORAL','PENAL'] },
  { id:'UR_032', apellido:'BUÑIRIGO',        nombre:'ROSANA',        rolBD:'adm_mesa',            roles:['adm_mesa','asistente_jurídico'],        rolSistema: mapRol('adm_mesa'),            areas:['LABORAL'] },
]

export const ASIGNACION_PENAL: Record<string, string> = {
  LIN_001: 'UR_019',
  LIN_002: 'UR_023',
  LIN_003: 'UR_024',
  LIN_004: 'UR_019',
  LIN_005: 'UR_023',
  LIN_006: 'UR_024',
  LIN_007: 'UR_019',
  LIN_008: 'UR_023',
  LIN_009: 'UR_019',
}

export function getAbogadosFifo(area: 'CIVIL' | 'LABORAL'): Usuario[] {
  return USUARIOS
    .filter(u => u.areas.includes(area) && u.fifoOrder?.[area] !== undefined)
    .sort((a, b) => (a.fifoOrder![area] ?? 99) - (b.fifoOrder![area] ?? 99))
}

export const ROL_ACCESOS: Record<RolSistema, AccesosRol> = {
  REFERENTE: {
    nav: ['dashboard', 'actuaciones', 'agenda', 'tareas', 'configuracion'],
    puedeReasignar: false,
    verTodaBandeja: true,
    inicio: '/dashboard',
  },
  COORDINADOR: {
    nav: ['dashboard', 'actuaciones', 'agenda', 'tareas'],
    puedeReasignar: false,
    verTodaBandeja: true,
    inicio: '/actuaciones',
  },
  ABOGADO: {
    nav: ['actuaciones', 'agenda', 'tareas'],
    puedeReasignar: false,
    verTodaBandeja: false,
    inicio: '/actuaciones',
  },
  ADMINISTRATIVO: {
    nav: ['mesa'],
    puedeReasignar: false,
    verTodaBandeja: false,
    inicio: '/mesa',
  },
}

export function puedeReasignar(usuario: Usuario | null | undefined): boolean {
  return usuario?.rolBD === 'abogado_coordinador'
}

export function tieneRol(usuario: Usuario, rol: RolBD): boolean {
  return usuario.roles.includes(rol)
}

export function getUsuarioById(id: string): Usuario | undefined {
  return USUARIOS.find(u => u.id === id)
}

export function getNombreCompleto(u: Usuario): string {
  return `${u.apellido}, ${u.nombre}`
}

export function esAbogadoPenal(usuario: Usuario | null | undefined): boolean {
  if (!usuario) return false
  return (
    usuario.areas.includes('PENAL') &&
    (usuario.rolSistema === 'ABOGADO' || usuario.rolSistema === 'COORDINADOR')
  )
}
