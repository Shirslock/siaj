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

// ── Tipos Solicitud ───────────────────────────────────────────────────────────

export type TipoSolicitud = 'interna' | 'externa'
export type EstadoSolicitud = 'pendiente' | 'respondida'

export interface RespuestaSolicitud {
  comentario: string
  adjunto_nombre?: string
  adjunto_size?: string
  respondido_por: string   // usuario id
  fecha: string
}

export interface Solicitud {
  id: string
  tipo: TipoSolicitud
  titulo: string
  descripcion: string
  expediente_id: string
  expediente_caratula: string
  expediente_area: Area
  creado_por: string          // quien hizo la solicitud
  asignado_a: string[]        // a quiénes (usuarios internos o nombre externo)
  asignado_a_nombre: string   // display
  area_destinataria?: AreaDestinataria
  persona_contacto_id?: string
  persona_contacto?: string
  prioridad: PrioridadTarea
  fecha_limite: string | null
  estado: EstadoSolicitud
  respuesta?: RespuestaSolicitud
  created_at: string
}

// ── Mock solicitudes ──────────────────────────────────────────────────────────

const SOLICITUDES_MOCK: Solicitud[] = [
  // ── SOL_001: Solicitud INTERNA hecha por Alejandra Lopez a Felix Casano ──
  // Aparece en "Mis solicitudes" de Alejandra y en "Mis pedidos" de Felix
  {
    id: 'SOL_001',
    tipo: 'interna',
    titulo: 'Antecedentes del expediente C-0041/2026',
    descripcion: 'Necesito el informe de estado actualizado del lanzamiento para elevar a Gerencia. Adjuntá el último escrito presentado.',
    expediente_id: 'C-0041/2026',
    expediente_caratula: 'SOFSA SA C/ PERALTA OSCAR HÉCTOR S/ LANZAMIENTO — INMUEBLE KM 12 LÍNEA ROCA',
    expediente_area: 'CIVIL',
    creado_por: 'UR_018',
    asignado_a: ['UR_004'],
    asignado_a_nombre: 'CASANO, Felix',
    prioridad: 'alta',
    fecha_limite: fechaEnDias(3),
    estado: 'pendiente',
    created_at: HOY,
  },

  // ── SOL_002: Solicitud EXTERNA hecha por Alejandra Lopez a perito externo ──
  // Aparece en "Mis solicitudes" de Alejandra — puede adjuntar respuesta ella misma
  {
    id: 'SOL_002',
    tipo: 'externa',
    titulo: 'Informe pericial contable — Causa 8821/2026',
    descripcion: 'Solicitud de informe pericial contable al perito designado por el juzgado. Se aguarda respuesta por mail.',
    expediente_id: 'C-0042/2026',
    expediente_caratula: 'SOFSA SA C/ PERALTA OSCAR HÉCTOR S/ LANZAMIENTO JUDICIALIZADO',
    expediente_area: 'CIVIL',
    creado_por: 'UR_018',
    asignado_a: [],
    asignado_a_nombre: 'Dr. Pérez, Juan (Perito externo)',
    prioridad: 'media',
    fecha_limite: fechaEnDias(15),
    estado: 'pendiente',
    created_at: HOY,
  },

  // ── SOL_003: Pedido hacia Alejandra Lopez hecho por Adriana Benitez ──
  // Aparece en "Mis pedidos" de Alejandra — puede adjuntar respuesta
  {
    id: 'SOL_003',
    tipo: 'interna',
    titulo: 'Revisión de dictamen — Causa C-0009/2024',
    descripcion: 'Necesito que revises el dictamen antes del viernes y me confirmes si hay observaciones para corregir antes de presentarlo.',
    expediente_id: 'C-0009/2024',
    expediente_caratula: 'SOFSA SA C/ COMERCIOS VARIOS S/ COBRO DE CÁNONES',
    expediente_area: 'CIVIL',
    creado_por: 'UR_003',
    asignado_a: ['UR_018'],
    asignado_a_nombre: 'LOPEZ, Alejandra',
    prioridad: 'alta',
    fecha_limite: fechaEnDias(4),
    estado: 'pendiente',
    created_at: HOY,
  },

  // ── SOL_004: Pedido hacia Alejandra Lopez hecho por Pablo Pisano ──
  // Aparece en "Mis pedidos" de Alejandra — puede adjuntar respuesta
  {
    id: 'SOL_004',
    tipo: 'interna',
    titulo: 'Autorización para ampliar plazo de contestación',
    descripcion: 'La parte actora solicitó extensión. Necesito tu autorización formal para presentar la nota al juzgado.',
    expediente_id: 'C-0023/2026',
    expediente_caratula: 'RODRIGUEZ MARIO OSCAR C/ SOFSA SA S/ DAÑOS Y PERJUICIOS',
    expediente_area: 'CIVIL',
    creado_por: 'UR_013',
    asignado_a: ['UR_018'],
    asignado_a_nombre: 'LOPEZ, Alejandra',
    prioridad: 'media',
    fecha_limite: fechaEnDias(7),
    estado: 'pendiente',
    created_at: HOY,
  },

  // ── SOL_005: Solicitud hecha por Adriana Benitez a Alejandra Lopez ──
  // Aparece en "Mis solicitudes" de Adriana y en "Mis pedidos" de Alejandra
  {
    id: 'SOL_005',
    tipo: 'interna',
    titulo: 'Lineamientos para contestar demanda',
    descripcion: 'Antes de redactar la contestación quiero alinearme con vos en la estrategia procesal. ¿Podés pasarme un memo con los lineamientos?',
    expediente_id: 'C-0001/2026',
    expediente_caratula: 'FERNANDEZ MARIA ROSA C/ SOFSA SA S/ DAÑOS Y PERJUICIOS',
    expediente_area: 'CIVIL',
    creado_por: 'UR_003',
    asignado_a: ['UR_018'],
    asignado_a_nombre: 'LOPEZ, Alejandra',
    prioridad: 'baja',
    fecha_limite: fechaEnDias(10),
    estado: 'pendiente',
    created_at: HOY,
  },
]

// ── Store solicitudes ─────────────────────────────────────────────────────────

interface SolicitudesState {
  solicitudes: Solicitud[]
  agregarSolicitud: (s: Omit<Solicitud, 'id'>) => void
  responderSolicitud: (id: string, respuesta: RespuestaSolicitud) => void
  editarSolicitud: (id: string, cambios: Partial<Solicitud>) => void
}

export const useSolicitudesStore = create<SolicitudesState>((set) => ({
  solicitudes: SOLICITUDES_MOCK,

  agregarSolicitud: (s) =>
    set(state => ({
      solicitudes: [{ ...s, id: `SOL_${Date.now()}` }, ...state.solicitudes],
    })),

  responderSolicitud: (id, respuesta) =>
    set(state => ({
      solicitudes: state.solicitudes.map(s =>
        s.id === id ? { ...s, estado: 'respondida', respuesta } : s
      ),
    })),

  editarSolicitud: (id, cambios) =>
    set(state => ({
      solicitudes: state.solicitudes.map(s => s.id === id ? { ...s, ...cambios } : s),
    })),
}))
