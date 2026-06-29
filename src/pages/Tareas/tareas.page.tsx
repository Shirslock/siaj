import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import {
  useTareasStore, PERSONAS_POR_AREA,
  type TareaKanban, type PrioridadTarea, type EstadoTareaKanban, type AreaDestinataria,
} from '../../store/tareas.store'
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

type EstadoTarea = EstadoTareaKanban
type GrupoAsignacion = 'CIVIL' | 'LABORAL' | 'PENAL' | 'RRHH' | 'COMERCIAL' | 'SEGUROS' | ''
type TipoFiltro = 'mis_tareas' | 'creadas_por_mi' | 'interna' | 'externa' | ''

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
  area_destinataria: '' as AreaDestinataria,
  persona_contacto_id: '',
  persona_contacto: '',
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

      {/* Interno SIAJ — letrado asignado */}
      {tarea.asignado_a && (
        <div className="flex items-center gap-1 mt-1.5">
          <Icon name="person" size={11} className="text-[#4a6a84]" />
          <span className="text-[10px] text-[#4a6a84] truncate">
            {getNombreCompleto(getUsuarioById(tarea.asignado_a)!)}
          </span>
        </div>
      )}

      {/* Externo SIAJ — área + persona de contacto */}
      {tarea.area_destinataria && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#e8e8e8] text-[#4a6a84]">
            {tarea.area_destinataria}
          </span>
          {tarea.persona_contacto && (
            <span className="text-[10px] text-[#4a6a84] truncate">
              {tarea.persona_contacto}
            </span>
          )}
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
        {asignado && (
          <div
            title={getNombreCompleto(asignado)}
            className="w-6 h-6 rounded-full bg-[#1b3a57] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
          >
            {initials}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Drag and drop ─────────────────────────────────────────────────────────────

function ColumnaDroppable({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ''} ${isOver ? 'ring-2 ring-[#1b3a57] ring-offset-2 rounded-2xl' : ''} transition-all`}
    >
      {children}
    </div>
  )
}

function TareaCardDraggable({
  tarea,
  ...props
}: {
  tarea: TareaKanban
  onMover: (id: string, estado: EstadoTarea) => void
  onEditar: (t: TareaKanban) => void
  onEliminar: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tarea.id })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative ${isDragging ? 'opacity-40 cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* Handle de drag — ícono en el header */}
      <div
        {...listeners}
        className="absolute top-2 right-8 w-6 h-6 flex items-center justify-center text-[#c0c0c0] hover:text-[#4a6a84] cursor-grab active:cursor-grabbing touch-none z-10"
      >
        <Icon name="drag_indicator" size={14} />
      </div>
      <TareaCard tarea={tarea} {...props} />
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function TareasPage() {
  const { expedientes } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const { tareas, agregarTarea, editarTarea, moverTarea: moverTareaStore, eliminarTarea: eliminarTareaStore } = useTareasStore()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [tareaEditando, setTareaEditando] = useState<TareaKanban | null>(null)
  const [form, setForm] = useState(BLANK_TAREA)
  const [grupoAsignacion, setGrupoAsignacion] = useState<GrupoAsignacion>('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('mis_tareas')
  const [filtroLetrado, setFiltroLetrado] = useState('')
  const [filtroAreaExt, setFiltroAreaExt] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroExpediente, setFiltroExpediente] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [tareaArrastrada, setTareaArrastrada] = useState<TareaKanban | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // px mínimos antes de activar
      },
    })
  )

  // Filtrar tareas
  const tareasFiltradas = useMemo(() => {
    const uid = usuarioActivo?.id ?? ''
    return tareas.filter(t => {
      // Filtro por tipo de vista
      if (tipoFiltro === 'mis_tareas') {
        if (t.creado_por !== uid && t.asignado_a !== uid) return false
      }
      if (tipoFiltro === 'creadas_por_mi') {
        if (t.creado_por !== uid) return false
      }
      if (tipoFiltro === 'interna') {
        // Tiene asignado_a (letrado interno)
        if (!t.asignado_a) return false
        // Si hay filtroLetrado específico, aplicarlo
        if (filtroLetrado && t.asignado_a !== filtroLetrado) return false
      }
      if (tipoFiltro === 'externa') {
        // Tiene area_destinataria (RRHH/COM/SEG)
        if (!t.area_destinataria) return false
        // Si hay filtroAreaExt específico, aplicarlo
        if (filtroAreaExt && t.area_destinataria !== filtroAreaExt) return false
      }

      // Filtros de texto y prioridad existentes
      if (filtroPrioridad && t.prioridad !== filtroPrioridad) return false
      if (filtroExpediente && !t.expediente_id.toLowerCase().includes(filtroExpediente.toLowerCase()) &&
          !t.expediente_caratula.toLowerCase().includes(filtroExpediente.toLowerCase())) return false
      if (busqueda && !t.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false
      return true
    })
  }, [tareas, tipoFiltro, filtroLetrado, filtroAreaExt, filtroPrioridad, filtroExpediente, busqueda, usuarioActivo])

  const tareasPorEstado = useMemo(() => {
    const map: Record<EstadoTarea, TareaKanban[]> = { pendiente: [], en_curso: [], completada: [] }
    tareasFiltradas.forEach(t => map[t.estado].push(t))
    return map
  }, [tareasFiltradas])

  function abrirNueva() {
    setTareaEditando(null)
    setForm({ ...BLANK_TAREA, asignado_a: '' })
    setGrupoAsignacion('')
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
      area_destinataria: t.area_destinataria ?? '',
      persona_contacto_id: t.persona_contacto_id ?? '',
      persona_contacto: t.persona_contacto ?? '',
    })
    if (t.area_destinataria) {
      setGrupoAsignacion(t.area_destinataria)
    } else if (t.asignado_a) {
      const u = getUsuarioById(t.asignado_a)
      const areaJuridica = u?.areas.find(a => ['CIVIL', 'LABORAL', 'PENAL'].includes(a))
      setGrupoAsignacion((areaJuridica as GrupoAsignacion) ?? '')
    } else {
      setGrupoAsignacion('')
    }
    setModalAbierto(true)
  }

  function getPersonasGrupo(grupo: GrupoAsignacion): { id: string; nombre: string }[] {
    if (!grupo) return []
    if (['CIVIL', 'LABORAL', 'PENAL'].includes(grupo)) {
      return USUARIOS
        .filter(u =>
          (u.rolSistema === 'ABOGADO' || u.rolSistema === 'COORDINADOR') &&
          u.areas.includes(grupo as Area)
        )
        .map(u => ({
          id: u.id,
          nombre: `${u.apellido}, ${u.nombre}${u.id === usuarioActivo?.id ? ' (yo)' : ''}`,
        }))
    }
    return PERSONAS_POR_AREA
      .filter(p => p.area === grupo)
      .map(p => ({ id: p.id, nombre: p.nombre }))
  }

  function guardarTarea() {
    if (!form.titulo.trim() || !form.expediente_id) return
    const expObj = expedientes.find(e => e.id === form.expediente_id)
    if (tareaEditando) {
      editarTarea(tareaEditando.id, {
        ...form,
        fecha_limite: form.fecha_limite || null,
        expediente_caratula: expObj?.caratula ?? tareaEditando.expediente_caratula,
        expediente_area: expObj?.area ?? tareaEditando.expediente_area,
        area_destinataria: form.area_destinataria || undefined,
        persona_contacto_id: form.persona_contacto_id || undefined,
        persona_contacto: form.persona_contacto || undefined,
      })
      toast.success('Tarea actualizada.')
    } else {
      agregarTarea({
        ...form,
        fecha_limite: form.fecha_limite || null,
        expediente_caratula: expObj?.caratula ?? '',
        expediente_area: expObj?.area ?? 'CIVIL',
        creado_por: usuarioActivo?.id ?? '',
        estado: 'pendiente',
        created_at: HOY,
        area_destinataria: form.area_destinataria || undefined,
        persona_contacto_id: form.persona_contacto_id || undefined,
        persona_contacto: form.persona_contacto || undefined,
      })
      toast.success('Tarea asignada.')
    }
    setModalAbierto(false)
  }

  function moverTarea(id: string, estado: EstadoTarea) {
    moverTareaStore(id, estado)
    toast.success(`Tarea movida a ${COLUMNAS.find(c => c.key === estado)?.label}.`)
  }

  function eliminarTarea(id: string) {
    eliminarTareaStore(id)
    toast.success('Tarea eliminada.')
  }

  function handleDragStart(event: DragStartEvent) {
    const tarea = tareas.find(t => t.id === event.active.id)
    setTareaArrastrada(tarea ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setTareaArrastrada(null)
    if (!over) return
    const tareaId = active.id as string
    const columnaDestino = over.id as EstadoTarea
    if (!['pendiente', 'en_curso', 'completada'].includes(columnaDestino)) return
    const tarea = tareas.find(t => t.id === tareaId)
    if (!tarea) return
    if (tarea.estado === columnaDestino) return
    moverTarea(tareaId, columnaDestino)
  }

  function limpiarFiltros() {
    setTipoFiltro('mis_tareas')
    setFiltroLetrado('')
    setFiltroAreaExt('')
    setBusqueda('')
    setFiltroExpediente('')
    setFiltroPrioridad('')
  }

  const hayFiltrosActivos =
    tipoFiltro !== 'mis_tareas' ||
    busqueda !== '' ||
    filtroExpediente !== '' ||
    filtroPrioridad !== ''

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

        {/* Tipo de filtro */}
        <div className="flex gap-2 flex-wrap">
          {/* Select principal de tipo de filtro */}
          <select
            className="field-input text-sm"
            value={tipoFiltro}
            onChange={e => {
              setTipoFiltro(e.target.value as TipoFiltro)
              setFiltroLetrado('')
              setFiltroAreaExt('')
            }}
          >
            <option value="mis_tareas">★ Mis tareas</option>
            <option value="creadas_por_mi">Mis pedidos</option>
            <option value="interna">Interna SIAJ</option>
            <option value="externa">Externa SIAJ</option>
            <option value="">Todas</option>
          </select>

          {/* Segundo select — interna (letrado) */}
          {tipoFiltro === 'interna' && (
            <select
              className="field-input text-sm"
              value={filtroLetrado}
              onChange={e => setFiltroLetrado(e.target.value)}
            >
              <option value="">Todos los letrados</option>
              {abogados.map(u => (
                <option key={u.id} value={u.id}>
                  {getNombreCompleto(u)}{u.id === usuarioActivo?.id ? ' (yo)' : ''}
                </option>
              ))}
            </select>
          )}

          {/* Segundo select — externa (área) */}
          {tipoFiltro === 'externa' && (
            <select
              className="field-input text-sm"
              value={filtroAreaExt}
              onChange={e => setFiltroAreaExt(e.target.value)}
            >
              <option value="">Todas las áreas</option>
              <option value="RRHH">RRHH</option>
              <option value="COMERCIAL">Comercial</option>
              <option value="SEGUROS">Seguros</option>
            </select>
          )}
        </div>

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

        {hayFiltrosActivos && (
          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs font-bold text-[#4a6a84] hover:text-[#1b3a57] transition-colors"
          >
            <Icon name="filter_alt_off" size={14} />
            Limpiar
          </button>
        )}
      </div>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-5 items-start">
          {COLUMNAS.map(col => {
            const items = tareasPorEstado[col.key]
            return (
              <ColumnaDroppable key={col.key} id={col.key} className="space-y-3">
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
                <div className="space-y-3 min-h-[120px]">
                  {items.map(t => (
                    <TareaCardDraggable
                      key={t.id}
                      tarea={t}
                      onMover={moverTarea}
                      onEditar={abrirEditar}
                      onEliminar={eliminarTarea}
                    />
                  ))}

                  {/* Zona de drop vacía visible */}
                  {items.length === 0 && (
                    <div className="h-20 rounded-xl border-2 border-dashed border-[rgba(0,0,0,0.08)] flex items-center justify-center text-xs text-[#c0c0c0]">
                      Soltá aquí
                    </div>
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
              </ColumnaDroppable>
            )
          })}
        </div>

        {/* Overlay — preview flotante al arrastrar */}
        <DragOverlay>
          {tareaArrastrada && (
            <div className="opacity-95 rotate-1 shadow-2xl rounded-xl">
              <TareaCard
                tarea={tareaArrastrada}
                onMover={() => {}}
                onEditar={() => {}}
                onEliminar={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
            {/* Asignar a — selector en dos pasos */}
            <div className="space-y-2">
              <label className="field-label">Asignar a</label>

              {/* Paso 1 — Grupo/Área */}
              <select
                className="field-input w-full"
                value={grupoAsignacion}
                onChange={e => {
                  const g = e.target.value as GrupoAsignacion
                  setGrupoAsignacion(g)
                  setForm(p => ({
                    ...p,
                    asignado_a: '',
                    area_destinataria: (['RRHH', 'COMERCIAL', 'SEGUROS'] as GrupoAsignacion[]).includes(g) ? g as AreaDestinataria : '',
                    persona_contacto_id: '',
                    persona_contacto: '',
                  }))
                }}
              >
                <option value="">Sin asignar</option>
                <optgroup label="Interno SIAJ">
                  <option value="CIVIL">Civil</option>
                  <option value="LABORAL">Laboral</option>
                  <option value="PENAL">Penal</option>
                </optgroup>
                <optgroup label="Externo SIAJ">
                  <option value="RRHH">RRHH</option>
                  <option value="COMERCIAL">Comercial</option>
                  <option value="SEGUROS">Seguros</option>
                </optgroup>
              </select>

              {/* Paso 2 — Persona (solo si hay grupo) */}
              {grupoAsignacion && (
                <select
                  className="field-input w-full"
                  value={
                    ['CIVIL', 'LABORAL', 'PENAL'].includes(grupoAsignacion)
                      ? form.asignado_a
                      : form.persona_contacto_id
                  }
                  onChange={e => {
                    const val = e.target.value
                    const esInterno = ['CIVIL', 'LABORAL', 'PENAL'].includes(grupoAsignacion)
                    if (esInterno) {
                      setForm(p => ({ ...p, asignado_a: val }))
                    } else {
                      const persona = PERSONAS_POR_AREA.find(p => p.id === val)
                      setForm(p => ({
                        ...p,
                        persona_contacto_id: val,
                        persona_contacto: persona?.nombre ?? '',
                      }))
                    }
                  }}
                >
                  <option value="">Seleccioná una persona...</option>
                  {getPersonasGrupo(grupoAsignacion).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              )}
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