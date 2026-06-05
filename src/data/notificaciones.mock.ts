import type { Notificacion } from '../types'

export const NOTIFICACIONES_MOCK: Notificacion[] = [
  {
    id: 'NOTIF_001',
    tipo: 'ASIGNACION',
    expedienteId: 'C-0023/2026',
    tipoGestion: 'Demanda Civil',
    caratula: 'RODRIGUEZ MARIO OSCAR C/ SOFSA SA S/ DAÑOS Y PERJUICIOS',
    numeroCausa: '12345/2026',
    leida: false,
    fecha: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    destinatarioId: 'UR_004',
  },
  {
    id: 'NOTIF_002',
    tipo: 'REASIGNACION',
    expedienteId: 'C-0021/2026',
    tipoGestion: 'Cobro de Cánones',
    caratula: 'COBRO DE CANON — PERMISIONARIO XYZ S.A.',
    numeroCausa: null,
    leida: false,
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    destinatarioId: 'UR_004',
  },
  {
    id: 'NOTIF_003',
    tipo: 'ASIGNACION',
    expedienteId: 'C-0022/2026',
    tipoGestion: 'Oficio Civil / Laboral',
    caratula: 'MUNICIPALIDAD DE LOMAS C/ SOFSA — OFICIO',
    numeroCausa: null,
    leida: true,
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    destinatarioId: 'UR_004',
  },
]
