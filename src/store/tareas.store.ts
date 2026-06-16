import { create } from 'zustand'
import type { Area } from '../types'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type PrioridadTarea = 'alta' | 'media' | 'baja'
export type EstadoTareaKanban = 'pendiente' | 'en_curso' | 'completada'
export type AreaDestinataria = 'RRHH' | 'COMERCIAL' | 'SEGUROS' | ''

export interface PersonaArea {
  id: string
  nombre: string
  area: AreaDestinataria
  email?: string
}

export const PERSONAS_POR_AREA: PersonaArea[] = [
  // RRHH
  { id: 'PA_001', nombre: 'GARCIA, María José', area: 'RRHH',      email: 'mgarcia@sofsa.ar' },
  { id: 'PA_002', nombre: 'TORRES, Roberto',     area: 'RRHH',      email: 'rtorres@sofsa.ar' },
  // COMERCIAL
  { id: 'PA_003', nombre: 'FERNÁNDEZ, Laura',    area: 'COMERCIAL', email: 'lfernandez@sofsa.ar' },
  { id: 'PA_004', nombre: 'MOLINA, Diego',       area: 'COMERCIAL', email: 'dmolina@sofsa.ar' },
  // SEGUROS
  { id: 'PA_005', nombre: 'SUÁREZ, Patricia',    area: 'SEGUROS',   email: 'psuarez@sofsa.ar' },
  { id: 'PA_006', nombre: 'RUIZ, Alejandro',     area: 'SEGUROS',   email: 'aruiz@sofsa.ar' },
]

export interface TareaKanban {
  id: string
  titulo: string
  descripcion: string
  expediente_id: string
  expediente_caratula: string
  expediente_area: Area
  asignado_a: string        // usuario id
  creado_por: string        // usuario id
  fecha_limite: string | null
  prioridad: PrioridadTarea
  estado: EstadoTareaKanban
  mostrar_en_agenda: boolean
  etiquetas: string[]
  created_at: string
  area_destinataria?: AreaDestinataria
  persona_contacto_id?: string
  persona_contacto?: string   // nombre para display
}

// ── Mock inicial ──────────────────────────────────────────────────────────────

const HOY = new Date().toISOString().split('T')[0]

const fechaEnDias = (dias: number) => {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}

const TAREAS_MOCK: TareaKanban[] = [
  {
    id: 'TK_001',
    titulo: 'Presentar contestación de demanda',
    descripcion: 'Redactar y presentar el escrito de contestación ante el Juzgado Federal Civil N°1.',
    expediente_id: 'C-0023/2026',
    expediente_caratula: 'RODRIGUEZ MARIO OSCAR C/ SOFSA SA S/ DAÑOS Y PERJUICIOS',
    expediente_area: 'CIVIL',
    asignado_a: 'UR_004',
    creado_por: 'UR_013',
    fecha_limite: '2026-06-15',
    prioridad: 'alta',
    estado: 'pendiente',
    mostrar_en_agenda: true,
    etiquetas: ['Escrito', 'Urgente'],
    created_at: '2026-05-10',
  },
  {
    id: 'TK_002',
    titulo: 'Revisar peritos propuestos',
    descripcion: 'Analizar los peritos propuestos por la parte actora y evaluar impugnar.',
    expediente_id: 'C-0026/2026',
    expediente_caratula: 'GOMEZ CARLOS ALBERTO C/ SOFSA SA S/ DAÑOS Y PERJUICIOS',
    expediente_area: 'CIVIL',
    asignado_a: 'UR_004',
    creado_por: 'UR_004',
    fecha_limite: '2026-06-20',
    prioridad: 'media',
    estado: 'en_curso',
    mostrar_en_agenda: false,
    etiquetas: ['Peritos'],
    created_at: '2026-05-12',
  },
  {
    id: 'TK_003',
    titulo: 'Solicitar filmaciones a Seguridad',
    descripcion: 'Oficiar a la comisaría para obtener filmaciones del incidente ferroviario.',
    expediente_id: 'P-0012/2026',
    expediente_caratula: 'APEDREO CON DAÑO — Línea Roca Km 27 Est. Temperley',
    expediente_area: 'PENAL',
    asignado_a: 'UR_019',
    creado_por: 'UR_022',
    fecha_limite: '2026-06-10',
    prioridad: 'alta',
    estado: 'en_curso',
    mostrar_en_agenda: true,
    etiquetas: ['Oficio'],
    created_at: '2026-05-08',
  },
  {
    id: 'TK_004',
    titulo: 'Cargar datos del acuerdo extrajudicial',
    descripcion: 'Registrar en el sistema los términos del acuerdo alcanzado.',
    expediente_id: 'C-0021/2026',
    expediente_caratula: 'JUZ. FED. CIVIL N°2 — OFICIO S/ MARTINEZ PAULA SILVANA',
    expediente_area: 'CIVIL',
    asignado_a: 'UR_007',
    creado_por: 'UR_013',
    fecha_limite: '2026-05-30',
    prioridad: 'baja',
    estado: 'completada',
    mostrar_en_agenda: false,
    etiquetas: ['Acuerdo'],
    created_at: '2026-05-01',
  },
  {
    id: 'KANBAN_DEMO_001',
    titulo: 'Solicitar legajo a RRHH',
    descripcion: 'Pedido de legajo del empleado Rodríguez para causa de desafuero',
    expediente_id: 'C-0023/2026',
    expediente_caratula: 'RODRIGUEZ MARIO OSCAR C/ SOFSA SA S/ DAÑOS Y PERJUICIOS',
    expediente_area: 'CIVIL',
    asignado_a: 'UR_004',
    creado_por: 'UR_004',
    fecha_limite: fechaEnDias(5),
    prioridad: 'alta',
    estado: 'pendiente',
    mostrar_en_agenda: true,
    area_destinataria: 'RRHH',
    persona_contacto_id: 'PA_001',
    persona_contacto: 'GARCIA, María José',
    etiquetas: [],
    created_at: HOY,
  },
]

// ── Store ─────────────────────────────────────────────────────────────────────

interface TareasState {
  tareas: TareaKanban[]
  agregarTarea: (t: Omit<TareaKanban, 'id'>) => void
  editarTarea: (id: string, cambios: Partial<TareaKanban>) => void
  moverTarea: (id: string, estado: EstadoTareaKanban) => void
  eliminarTarea: (id: string) => void
}

export const useTareasStore = create<TareasState>((set) => ({
  tareas: TAREAS_MOCK,

  agregarTarea: (t) =>
    set(state => ({
      tareas: [{ ...t, id: `TK_${Date.now()}` }, ...state.tareas],
    })),

  editarTarea: (id, cambios) =>
    set(state => ({
      tareas: state.tareas.map(t => t.id === id ? { ...t, ...cambios } : t),
    })),

  moverTarea: (id, estado) =>
    set(state => ({
      tareas: state.tareas.map(t => t.id === id ? { ...t, estado } : t),
    })),

  eliminarTarea: (id) =>
    set(state => ({
      tareas: state.tareas.filter(t => t.id !== id),
    })),
}))
