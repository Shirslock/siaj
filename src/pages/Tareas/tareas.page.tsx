import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { AreaBadge } from '../../components/ui/Badge'
import { USUARIOS, getNombreCompleto, getUsuarioById } from '../../data/usuarios'
import { RUTAS } from '../../utils/routing'
import { formatFecha } from '../../utils/format'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'
import type { Area } from '../../types'

// ── Tipos locales ─────────────────────────────────────────────────────────────

type PrioridadTarea = 'alta' | 'media' | 'baja'
type EstadoTarea = 'pendiente' | 'en_curso' | 'completada'

interface TareaKanban {
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
  estado: EstadoTarea
  mostrar_en_agenda: boolean
  etiquetas: string[]
  created_at: string
}

// ── Mock inicial ──────────────────────────────────────────────────────────────

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
]

// ── Configuración de columnas ─────────────────────────────────────────────────

const COLUMNAS: { key: EstadoTarea; label: string; color: string; dot: string }[] = [
  { key: 'pendiente',  label: 'Pendiente',  color: 'bg-[#fef3c7] border-[#fde68a]',  dot: 'bg-[#d97706]' },
  { key: 'en_curso',   label: 'En curso',   color: 'bg-[#dbeafe] border-[#bfdbfe]',  dot: 'bg-[#1b3a57]' },
  { key: 'completada', label: 'Completada', color: 'bg-[#dcfce7] border-[#bbf7d0]',  dot: 'bg-[#15803d]' },
]

const PRIORIDAD_CONFIG: Record<PrioridadTarea, { label: string; color: string }> = {
  alta:  { label: 'Alta',  color: 'bg-[#fee2e2] text-[#b91c1c]' },
  media: { label: 'Media', color: 'bg-[#fef3c7] text-[#d97706]' },
  baja:  { label: 'Baja',  color: 'bg-[#e8e8e8] text-[#4a6a84]' },
}

const HOY = new Date().toISOString().split('T')[0]

const BLANK_TAREA = {
  titulo: '',
  descripcion: '',
  expediente_id: '',
  asignado_a: '',
  fecha_limite: '',
  prioridad: 'media' as PrioridadTarea,
  mostrar_en_agenda: false,
  etiquetas: [] as string[],
}

// ── Card de tarea ─────────────────────────────────────────────────────────────

function TareaCard({
  tarea,
  onMover,
  onEditar,
  onEliminar,
}: {
  tarea: TareaKanban
  onMover: (id: string, estado: EstadoTarea) => void
  onEditar: (t: TareaKanban) => void
  onEliminar: (id: string) => void
}) {
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const asignado = getUsuarioById(tarea.asignado_a)
  const vencida = tarea.fecha_limite && tarea.fecha_limite < HOY && tarea.estado !== 'completada'
  const initials = asignado ? `${asignado.apellido[0]}${asignado.nombre[0]}` : '?'

  const siguienteEstado: Record<EstadoTarea, EstadoTarea | null> = {
    pendiente: 'en_curso',
    en_curso: 'completada',
    completada: null,
  }

  return (
    <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] shadow-card p-4 space-y-3 relative group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#1b3a57] leading-snug flex-1">{tarea.titulo}</p>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuAbierto(v => !v)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors opacity-0 group-hover:opacity-100"
          >
            <Icon name="more_vert" size={16} />
          </button>
          {menuAbierto && (
            <div
              className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-card-lg border border-[rgba(0,0,0,0.10)] z-20 py-1"
              onMouseLeave={() => setMenuAbierto(false)}
            >
              <button
                onClick={() => { onEditar(tarea); setMenuAbierto(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#1b3a57] hover:bg-[#e8e8e8] transition-colors"
              >
                <Icon name="edit" size={14} /> Editar
              </button>
              {siguienteEstado[tarea.estado] && (
                <button
                  onClick={() => { onMover(tarea.id, siguienteEstado[tarea.estado]!); setMenuAbierto(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#1b3a57] hover:bg-[#e8e8e8] transition-colors"
                >
                  <Icon name="arrow_forward" size={14} />
                  Mover a {COLUMNAS.find(c => c.key === siguienteEstado[tarea.estado])?.label}
                </button>
              )}
              <button
                onClick={() => { navigate(RUTAS.EXPEDIENTE(tarea.expediente_id)); setMenuAbierto(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#1b3a57] hover:bg-[#e8e8e8] transition-colors"
              >
                <Icon name="open_in_new" size={14} /> Ver expediente
              </button>
              <div className="my-1 border-t border-[rgba(0,0,0,0.06)]" />
              <button
                onClick={() => { onEliminar(tarea.id); setMenuAbierto(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#b91c1c] hover:bg-[#fee2e2] transition-colors"
              >
                <Icon name="delete" size={14} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expediente vinculado */}
      <button
        onClick={() => navigate(RUTAS.EXPEDIENTE(tarea.expediente_id))}
        className="flex items-center gap-1.5 w-full text-left group/link"
      >
        <Icon name="folder" size={12} className="text-[#4a6a84] flex-shrink-0" />
        <span className="text-[10px] font-mono font-bold text-[#4a6a84] group-hover/link:text-[#1b3a57] transition-colors truncate">
          {tarea.expediente_id}
        </span>
        <AreaBadge area={tarea.expediente_area} />
      </button>

      {tarea.descripcion && (
        <p className="text-[11px] text-[#4a6a84] line-clamp-2">{tarea.descripcion}</p>
      )}

      {/* Etiquetas */}
      {tarea.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tarea.etiquetas.map(e => (
            <span key={e} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#C4DFE8] text-[#1b3a57]">
              {e}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          {/* Prioridad */}
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${PRIORIDAD_CONFIG[tarea.prioridad].color}`}>
            {PRIORIDAD_CONFIG[tarea.prioridad].label}
          </span>
          {/* Fecha límite */}
          {tarea.fecha_limite && (
            <span className={`flex items-center gap-1 text-[10px] font-bold ${vencida ? 'text-[#b91c1c]' : 'text-[#4a6a84]'}`}>
              <Icon name={vencida ? 'warning' : 'schedule'} size={11} />
              {formatFecha(tarea.fecha_limite)}
            </span>
          )}
        </div>
        {/* Avatar asignado */}
        <div
          title={asignado ? getNombreCompleto(asignado) : 'Sin asignar'}
          className="w-6 h-6 rounded-full bg-[#1b3a57] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
        >
          {initials}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function TareasPage() {
  const { expedientes } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()

  const [tareas, setTareas] = useState<TareaKanban[]>(TAREAS_MOCK)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tareaEditando, setTareaEditando] = useState<TareaKanban | null>(null)
  const [form, setForm] = useState(BLANK_TAREA)
  const [filtroAsignado, setFiltroAsignado] = useState<string>(usuarioActivo?.id ?? '')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroExpediente, setFiltroExpediente] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Filtrar tareas
  const tareasFiltradas = useMemo(() => {
    return tareas.filter(t => {
      if (filtroAsignado && t.asignado_a !== filtroAsignado) return false
      if (filtroPrioridad && t.prioridad !== filtroPrioridad) return false
      if (filtroExpediente && !t.expediente_id.toLowerCase().includes(filtroExpediente.toLowerCase()) &&
          !t.expediente_caratula.toLowerCase().includes(filtroExpediente.toLowerCase())) return false
      if (busqueda && !t.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false
      return true
    })
  }, [tareas, filtroAsignado, filtroPrioridad, filtroExpediente, busqueda])

  const tareasPorEstado = useMemo(() => {
    const map: Record<EstadoTarea, TareaKanban[]> = { pendiente: [], en_curso: [], completada: [] }
    tareasFiltradas.forEach(t => map[t.estado].push(t))
    return map
  }, [tareasFiltradas])

  function abrirNueva() {
    setTareaEditando(null)
    setForm({ ...BLANK_TAREA, asignado_a: usuarioActivo?.id ?? '' })
    setModalAbierto(true)
  }

  function abrirEditar(t: TareaKanban) {
    setTareaEditando(t)
    setForm({
      titulo: t.titulo,
      descripcion: t.descripcion,
      expediente_id: t.expediente_id,
      asignado_a: t.asignado_a,
      fecha_limite: t.fecha_limite ?? '',
      prioridad: t.prioridad,
      mostrar_en_agenda: t.mostrar_en_agenda,
      etiquetas: t.etiquetas,
    })
    setModalAbierto(true)
  }

  function guardarTarea() {
    if (!form.titulo.trim() || !form.expediente_id) return
    const expObj = expedientes.find(e => e.id === form.expediente_id)
    if (tareaEditando) {
      setTareas(prev => prev.map(t => t.id === tareaEditando.id ? {
        ...t,
        ...form,
        fecha_limite: form.fecha_limite || null,
        expediente_caratula: expObj?.caratula ?? t.expediente_caratula,
        expediente_area: expObj?.area ?? t.expediente_area,
      } : t))
      toast.success('Tarea actualizada.')
    } else {
      const nueva: TareaKanban = {
        id: `TK_${Date.now()}`,
        ...form,
        fecha_limite: form.fecha_limite || null,
        expediente_caratula: expObj?.caratula ?? '',
        expediente_area: expObj?.area ?? 'CIVIL',
        creado_por: usuarioActivo?.id ?? '',
        estado: 'pendiente',
        created_at: HOY,
      }
      setTareas(prev => [nueva, ...prev])
      toast.success('Tarea asignada.')
    }
    setModalAbierto(false)
  }

  function moverTarea(id: string, estado: EstadoTarea) {
    setTareas(prev => prev.map(t => t.id === id ? { ...t, estado } : t))
    toast.success(`Tarea movida a ${COLUMNAS.find(c => c.key === estado)?.label}.`)
  }

  function eliminarTarea(id: string) {
    setTareas(prev => prev.filter(t => t.id !== id))
    toast.success('Tarea eliminada.')
  }

  const abogados = USUARIOS.filter(u => u.rolSistema === 'ABOGADO' || u.rolSistema === 'COORDINADOR')

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57]">Tareas</h1>
          <p className="text-sm text-[#4a6a84] mt-1">
            {tareasFiltradas.length} tarea{tareasFiltradas.length !== 1 ? 's' : ''} ·{' '}
            {tareasPorEstado.pendiente.length} pendiente{tareasPorEstado.pendiente.length !== 1 ? 's' : ''} ·{' '}
            {tareasPorEstado.en_curso.length} en curso
          </p>
        </div>
        <Button variant="primary" icon="add" onClick={abrirNueva}>
          Nueva tarea
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-card px-5 py-3 flex items-center gap-3 flex-wrap">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px]">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a84] pointer-events-none" />
          <input
            className="field-input pl-9 w-full text-sm"
            placeholder="Buscar tarea..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* Expediente */}
        <div className="relative min-w-[180px]">
          <Icon name="folder" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a84] pointer-events-none" />
          <input
            className="field-input pl-8 w-full text-sm"
            placeholder="Filtrar por expediente..."
            value={filtroExpediente}
            onChange={e => setFiltroExpediente(e.target.value)}
          />
        </div>

        {/* Asignado */}
        <select
          className="field-input text-sm"
          value={filtroAsignado}
          onChange={e => setFiltroAsignado(e.target.value)}
        >
          <option value="">Todos los letrados</option>
          <option value={usuarioActivo?.id ?? ''} style={{ fontWeight: 'bold' }}>★ Mis tareas</option>
          <option disabled>──────────</option>
          {abogados.filter(u => u.id !== usuarioActivo?.id).map(u => (
            <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
          ))}
        </select>

        {/* Prioridad */}
        <select
          className="field-input text-sm"
          value={filtroPrioridad}
          onChange={e => setFiltroPrioridad(e.target.value)}
        >
          <option value="">Todas las prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>

        {(busqueda || filtroExpediente || filtroPrioridad || filtroAsignado !== (usuarioActivo?.id ?? '')) && (
          <button
            onClick={() => { setBusqueda(''); setFiltroExpediente(''); setFiltroPrioridad(''); setFiltroAsignado(usuarioActivo?.id ?? '') }}
            className="flex items-center gap-1 text-xs font-bold text-[#4a6a84] hover:text-[#1b3a57] transition-colors"
          >
            <Icon name="filter_alt_off" size={14} />
            Limpiar
          </button>
        )}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-5 items-start">
        {COLUMNAS.map(col => {
          const items = tareasPorEstado[col.key]
          return (
            <div key={col.key} className="space-y-3">
              {/* Header columna */}
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${col.color}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-black uppercase tracking-widest text-[#1b3a57]">
                    {col.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#4a6a84] bg-white/60 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="bg-white/60 border border-dashed border-[rgba(0,0,0,0.12)] rounded-xl p-6 text-center">
                    <p className="text-xs text-[#7a9ab4]">Sin tareas</p>
                  </div>
                ) : (
                  items.map(t => (
                    <TareaCard
                      key={t.id}
                      tarea={t}
                      onMover={moverTarea}
                      onEditar={abrirEditar}
                      onEliminar={eliminarTarea}
                    />
                  ))
                )}
              </div>

              {/* Botón agregar en columna pendiente */}
              {col.key === 'pendiente' && (
                <button
                  onClick={abrirNueva}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-dashed border-[rgba(0,0,0,0.15)] text-[#4a6a84] hover:text-[#1b3a57] hover:border-[#1b3a57] hover:bg-white transition-all text-xs font-medium"
                >
                  <Icon name="add" size={14} />
                  Agregar tarea
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal nueva/editar tarea */}
      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        titulo={tareaEditando ? 'Editar tarea' : 'Nueva tarea'}
        size="md"
        footer={
          <>
            <button
              onClick={() => setModalAbierto(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardarTarea}
              disabled={!form.titulo.trim() || !form.expediente_id}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Icon name="save" size={16} />
              {tareaEditando ? 'Guardar cambios' : 'Asignar tarea'}
            </button>
          </>
        }
      >
        <div className="space-y-4">

          {/* Título */}
          <div>
            <label className="field-label">Título de la tarea <span className="text-[#b91c1c]">*</span></label>
            <input
              type="text"
              className="field-input w-full"
              placeholder="Ej: Presentar escrito de contestación..."
              value={form.titulo}
              onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="field-label">Descripción</label>
            <textarea
              className="field-input w-full resize-y"
              style={{ minHeight: 72 }}
              placeholder="Detalles de la tarea..."
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            />
          </div>

          {/* Expediente asociado */}
          <div>
            <label className="field-label">Expediente asociado <span className="text-[#b91c1c]">*</span></label>
            <select
              className="field-input w-full"
              value={form.expediente_id}
              onChange={e => setForm(p => ({ ...p, expediente_id: e.target.value }))}
            >
              <option value="">Seleccionar expediente...</option>
              {expedientes.map(e => (
                <option key={e.id} value={e.id}>
                  {e.id} — {e.caratula.slice(0, 60)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Asignar a */}
            <div>
              <label className="field-label">Asignar a</label>
              <select
                className="field-input w-full"
                value={form.asignado_a}
                onChange={e => setForm(p => ({ ...p, asignado_a: e.target.value }))}
              >
                <option value="">Sin asignar</option>
                {abogados.map(u => (
                  <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
                ))}
              </select>
            </div>

            {/* Prioridad */}
            <div>
              <label className="field-label">Prioridad</label>
              <div className="flex gap-2 mt-1">
                {(['alta', 'media', 'baja'] as PrioridadTarea[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(prev => ({ ...prev, prioridad: p }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all capitalize ${
                      form.prioridad === p
                        ? p === 'alta' ? 'bg-[#fee2e2] border-[#fca5a5] text-[#b91c1c]'
                        : p === 'media' ? 'bg-[#fef3c7] border-[#fde68a] text-[#d97706]'
                        : 'bg-[#e8e8e8] border-[rgba(0,0,0,0.20)] text-[#4a6a84]'
                        : 'border-[rgba(0,0,0,0.12)] text-[#4a6a84] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fecha límite */}
          <div>
            <label className="field-label">Fecha límite</label>
            <input
              type="date"
              className="field-input w-full"
              value={form.fecha_limite}
              onChange={e => setForm(p => ({ ...p, fecha_limite: e.target.value }))}
            />
          </div>

          {/* Mostrar en agenda */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setForm(p => ({ ...p, mostrar_en_agenda: !p.mostrar_en_agenda }))}
              className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${
                form.mostrar_en_agenda ? 'bg-[#1b3a57]' : 'bg-[#e8e8e8]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.mostrar_en_agenda ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1b3a57]">Mostrar en agenda</p>
              <p className="text-[11px] text-[#4a6a84]">Aparecerá en el calendario en la fecha límite</p>
            </div>
          </label>

        </div>
      </Modal>
    </div>
  )
}