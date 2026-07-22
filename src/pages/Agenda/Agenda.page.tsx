import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgendaEvents } from './useAgendaEvents'
import { useAgendaStore, COLOR_EVENTO } from '../../store/agenda.store'
import { useUIStore } from '../../store/ui.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { USUARIOS, getNombreCompleto } from '../../data/usuarios'
import type { TipoEventoCustom, EventoCustom } from '../../store/agenda.store'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { RUTAS } from '../../utils/routing'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'
import type { AgendaEvent } from '../../types'

// ── Constantes ────────────────────────────────────────────────────────────────

const DIAS_SEMANA  = ['Lun','Mar','Mié','Jue','Vie']
const DIAS_FULL    = ['Lunes','Martes','Miércoles','Jueves','Viernes']
const MESES        = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type Vista = 'mes' | 'semana'
type TipoFiltro = 'todas' | 'tareas' | 'actividades' | 'audiencias' | 'sistema'

const TIPO_COLOR: Record<string, string> = {
  AUDIENCIA:  'bg-purple-100 text-purple-800 border-purple-300',
  TAREA:      'bg-[#dbeafe] text-[#1b3a57] border-blue-200',
  ACTIVIDAD:  'bg-[#C4DFE8] text-[#1b3a57] border-[#a8cdd8]',
  SISTEMA:    'bg-slate-100 text-slate-700 border-slate-300',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDiasDelMes(year: number, month: number) {
  const primerDia = new Date(year, month, 1)
  const ultimoDia = new Date(year, month + 1, 0)
  const offset    = (primerDia.getDay() + 6) % 7
  const dias: (Date | null)[] = []
  for (let i = 0; i < offset; i++) dias.push(null)
  for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(year, month, d))
  // Completar hasta múltiplo de 7
  while (dias.length % 7 !== 0) dias.push(null)
  return dias
}

function getLunesDeSemana(ref: Date): Date {
  const d = new Date(ref)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

const BLANK_EVENTO = {
  titulo: '',
  descripcion: '',
  fecha: '',
  hora: '',
  tipo: 'reunion' as TipoEventoCustom,
}

// ── Chip de evento ────────────────────────────────────────────────────────────

function EventoChip({ ev, onClick }: { ev: AgendaEvent | EventoCustom; onClick: () => void }) {
  const esCustom = 'tipo' in ev && ['reunion','recordatorio','vencimiento','otro'].includes((ev as EventoCustom).tipo)
  if (esCustom) {
    const ec = ev as EventoCustom
    return (
      <button
        onClick={e => { e.stopPropagation(); onClick() }}
        className={`w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border ${COLOR_EVENTO[ec.tipo]}`}
      >
        {ec.hora && <span className="mr-1 opacity-70">{ec.hora}</span>}
        {ec.titulo}
      </button>
    )
  }
  const ae = ev as AgendaEvent
  const colorClass = TIPO_COLOR[ae.tipo ?? 'ACTIVIDAD'] ?? TIPO_COLOR.ACTIVIDAD
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className={`w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border ${colorClass}`}
    >
      {ae.titulo}
    </button>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AgendaPage() {
  const navigate  = useNavigate()
  const eventos   = useAgendaEvents()
  const { usuarioActivo } = useUIStore()
  const { expedientes }   = useExpedientesStore()
  const { eventosCustom, eliminarEvento } = useAgendaStore()

  const [vista,           setVista]           = useState<Vista>('mes')
  const [fechaRef,        setFechaRef]        = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [filtroTipo,      setFiltroTipo]      = useState<TipoFiltro>('todas')
  const [filtroAbogado,   setFiltroAbogado]   = useState('')
  const [filtroArea,      setFiltroArea]      = useState('')
  const [eventoDetalle,   setEventoDetalle]   = useState<EventoCustom | null>(null)
  const [agendaEvDetalle, setAgendaEvDetalle] = useState<AgendaEvent | null>(null)
  const [,               setFormEvento]      = useState(BLANK_EVENTO)

  const esReferente   = usuarioActivo?.rolSistema === 'REFERENTE'
  const esCoordinador = usuarioActivo?.rolSistema === 'COORDINADOR'
  const esAbogado     = usuarioActivo?.rolSistema === 'ABOGADO'

  // Abogados disponibles para filtro (según rol)
  const abogadosFiltro = useMemo(() => {
    if (esAbogado) {
      // Abogado solo puede ver audiencias de su área
      const miArea = expedientes.find(e => e.abogado_id === usuarioActivo?.id)?.area
      return USUARIOS.filter(u => u.rolSistema === 'ABOGADO' && (miArea ? u.areas?.includes(miArea) : false))
    }
    if (esCoordinador) {
      const misAreas = usuarioActivo?.areas ?? []
      return USUARIOS.filter(u => u.rolSistema === 'ABOGADO' && u.areas?.some(a => misAreas.includes(a)))
    }
    return USUARIOS.filter(u => u.rolSistema === 'ABOGADO')
  }, [usuarioActivo, expedientes, esAbogado, esCoordinador])

  // Filtrado de eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(e => {
      if (filtroTipo === 'tareas'      && !e.id.startsWith('TAREA_') && !e.id.startsWith('KANBAN_')) return false
      if (filtroTipo === 'actividades' && e.tipo !== 'ACTIVIDAD') return false
      if (filtroTipo === 'audiencias'  && e.tipo !== 'AUDIENCIA')  return false
      if (filtroTipo === 'sistema'     && e.tipo !== 'SISTEMA')    return false
      if (filtroAbogado && e.abogado_id !== filtroAbogado) return false
      if (filtroArea    && e.area       !== filtroArea)    return false
      return true
    })
  }, [eventos, filtroTipo, filtroAbogado, filtroArea])

  const eventosDelDia = useCallback((fecha: string) =>
    eventosFiltrados.filter(e => e.fecha_vencimiento === fecha),
    [eventosFiltrados]
  )

  const eventosCustomDelDia = useCallback((fecha: string) =>
    eventosCustom.filter(e => e.fecha === fecha),
    [eventosCustom]
  )

  // ── Navegación ──────────────────────────────────────────────────────────────

  const year  = fechaRef.getFullYear()
  const month = fechaRef.getMonth()

  function navAnterior() {
    if (vista === 'mes') {
      setFechaRef(new Date(year, month - 1, 1))
    } else {
      setFechaRef(prev => addDays(prev, -7))
    }
  }

  function navSiguiente() {
    if (vista === 'mes') {
      setFechaRef(new Date(year, month + 1, 1))
    } else {
      setFechaRef(prev => addDays(prev, 7))
    }
  }

  function irHoy() { setFechaRef(new Date()) }

  // ── Título header ───────────────────────────────────────────────────────────

  const tituloHeader = useMemo(() => {
    if (vista === 'mes') return `${MESES[month]} ${year}`
    const lunes    = getLunesDeSemana(fechaRef)
    const viernes  = addDays(lunes, 4)
    const mismoMes = lunes.getMonth() === viernes.getMonth()
    if (mismoMes) return `${lunes.getDate()} – ${viernes.getDate()} ${MESES[viernes.getMonth()]} ${viernes.getFullYear()}`
    return `${lunes.getDate()} ${MESES[lunes.getMonth()]} – ${viernes.getDate()} ${MESES[viernes.getMonth()]} ${viernes.getFullYear()}`
  }, [vista, fechaRef, month, year])

  const hoy    = isoDate(new Date())
  const diaSel = diaSeleccionado ?? hoy

  // ── Render vista mes ────────────────────────────────────────────────────────

  function renderMes() {
    const dias = getDiasDelMes(year, month)
    return (
      <div className="bg-white rounded-2xl shadow-card overflow-hidden flex-1">
        {/* Header días */}
        <div className="grid grid-cols-5 border-b border-[rgba(0,0,0,0.08)] bg-[#f9f9f9]">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#4a6a84] text-center">
              {d}
            </div>
          ))}
        </div>
        {/* Grilla — solo lun-vie */}
        <div className="grid grid-cols-5">
          {dias
            .filter((_) => {
              // Eliminar sábado (idx%7===5) y domingo (idx%7===6) del array original de 7 cols
              return true // ya filtramos abajo
            })
            .reduce<(Date | null)[][]>((acc, _d, _idx) => {
              // Agrupamos en semanas de 7 y tomamos solo lun-vie
              return acc
            }, [])
          }
          {/* Recalculamos para grilla de 5 cols */}
          {(() => {
            const primerDia = new Date(year, month, 1)
            const offset    = (primerDia.getDay() + 6) % 7 // lunes=0
            const ultimoDia = new Date(year, month + 1, 0).getDate()
            const celdas: (Date | null)[] = []
            // Offset solo aplica a lun-vie, ignoramos fines de semana del offset
            const offsetLV = Math.min(offset, 4) // máx 4 (viernes)
            for (let i = 0; i < offsetLV; i++) celdas.push(null)
            for (let d = 1; d <= ultimoDia; d++) {
              const fecha = new Date(year, month, d)
              const dow   = (fecha.getDay() + 6) % 7 // lunes=0
              if (dow < 5) celdas.push(fecha) // solo lun-vie
            }
            while (celdas.length % 5 !== 0) celdas.push(null)
            return celdas.map((fecha, idx) => {
              if (!fecha) return (
                <div key={idx} className="border-b border-r border-[rgba(0,0,0,0.05)] min-h-[120px] bg-[#fafafa]" />
              )
              const iso       = isoDate(fecha)
              const evs       = eventosDelDia(iso)
              const evsCustom = eventosCustomDelDia(iso)
              const isToday   = iso === hoy
              const isSel     = iso === diaSeleccionado
              return (
                <div
                  key={iso}
                  onClick={() => { setDiaSeleccionado(iso); setFormEvento({ ...BLANK_EVENTO, fecha: iso }) }}
                  className={`border-b border-r border-[rgba(0,0,0,0.05)] min-h-[120px] p-2 cursor-pointer transition-colors hover:bg-[#f0f0f0] ${isSel ? 'bg-[rgba(196,223,232,0.30)]' : ''}`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isToday ? 'bg-[#1b3a57] text-white' : 'text-[#1b3a57]'}`}>
                    {fecha.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {evs.slice(0, 3).map(ev => (
                      <EventoChip key={ev.id} ev={ev} onClick={() => setAgendaEvDetalle(ev)} />
                    ))}
                    {evs.length > 3 && (
                      <p className="text-[9px] text-[#4a6a84] font-bold">+{evs.length - 3} más</p>
                    )}
                    {evsCustom.map(ev => (
                      <EventoChip key={ev.id} ev={ev} onClick={() => setEventoDetalle(ev)} />
                    ))}
                  </div>
                </div>
              )
            })
          })()}
        </div>
      </div>
    )
  }

  // ── Render vista semana ─────────────────────────────────────────────────────

  function renderSemana() {
    const lunes = getLunesDeSemana(fechaRef)
    const dias  = Array.from({ length: 5 }, (_, i) => addDays(lunes, i))

    return (
      <div className="bg-white rounded-2xl shadow-card overflow-hidden flex-1">
        <div className="grid grid-cols-5 border-b border-[rgba(0,0,0,0.08)]">
          {dias.map((fecha, i) => {
            const iso     = isoDate(fecha)
            const isToday = iso === hoy
            const isSel   = iso === diaSeleccionado
            const evs     = eventosDelDia(iso)
            const evsC    = eventosCustomDelDia(iso)
            const total   = evs.length + evsC.length
            return (
              <div
                key={iso}
                onClick={() => setDiaSeleccionado(iso)}
                className={`border-r border-[rgba(0,0,0,0.05)] cursor-pointer transition-colors ${isSel ? 'bg-[rgba(196,223,232,0.20)]' : 'hover:bg-[#f9f9f9]'}`}
              >
                {/* Header columna */}
                <div className={`px-3 py-3 border-b border-[rgba(0,0,0,0.08)] text-center ${isToday ? 'bg-[#1b3a57]' : 'bg-[#f9f9f9]'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-white' : 'text-[#4a6a84]'}`}>
                    {DIAS_FULL[i]}
                  </p>
                  <p className={`text-2xl font-bold mt-0.5 ${isToday ? 'text-white' : 'text-[#1b3a57]'}`}>
                    {fecha.getDate()}
                  </p>
                  {total > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isToday ? 'bg-white/20 text-white' : 'bg-[#C4DFE8] text-[#1b3a57]'}`}>
                      {total} evento{total !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {/* Eventos del día */}
                <div className="p-2 space-y-1 min-h-[400px]">
                  {evs.map(ev => (
                    <button
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); setAgendaEvDetalle(ev) }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-80 ${TIPO_COLOR[ev.tipo ?? 'ACTIVIDAD']}`}
                    >
                      <p className="truncate">{ev.titulo}</p>
                      <p className="text-[10px] font-mono opacity-70 truncate">{ev.expediente_id}</p>
                    </button>
                  ))}
                  {evsC.map(ev => (
                    <button
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); setEventoDetalle(ev) }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-80 ${COLOR_EVENTO[ev.tipo]}`}
                    >
                      {ev.hora && <span className="opacity-70 mr-1">{ev.hora}</span>}
                      {ev.titulo}
                    </button>
                  ))}
                  {total === 0 && (
                    <p className="text-[10px] text-[#4a6a84] text-center pt-8 opacity-50">Sin eventos</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Panel lateral día seleccionado ──────────────────────────────────────────

  const eventosPanel     = eventosDelDia(diaSel)
  const eventosCustomPanel = eventosCustomDelDia(diaSel)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={navAnterior} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e8e8e8] text-[#1b3a57]">
            <Icon name="arrow_back" size={18} />
          </button>
          <h1 className="font-headline font-extrabold text-2xl text-[#1b3a57] min-w-[260px] text-center">
            {tituloHeader}
          </h1>
          <button onClick={navSiguiente} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e8e8e8] text-[#1b3a57]">
            <Icon name="arrow_forward" size={18} />
          </button>
          <button onClick={irHoy} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[rgba(0,0,0,0.15)] hover:bg-[#e8e8e8] text-[#1b3a57] transition-colors">
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          {/* Toggle vista */}
          <div className="flex items-center gap-1 bg-[#e8e8e8] rounded-xl p-1">
            {(['mes','semana'] as Vista[]).map(v => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${vista === v ? 'bg-white shadow-sm text-[#1b3a57]' : 'text-[#4a6a84] hover:text-[#1b3a57]'}`}
              >
                {v === 'mes' ? 'Mes' : 'Semana'}
              </button>
            ))}
          </div>

          {/* Filtro tipo */}
          <div className="flex items-center gap-1 bg-[#e8e8e8] rounded-xl p-1">
            {([
              { key: 'todas'      as TipoFiltro, label: 'Todas' },
              { key: 'tareas'     as TipoFiltro, label: 'Tareas' },
              { key: 'actividades'as TipoFiltro, label: 'Actividades' },
              { key: 'audiencias' as TipoFiltro, label: 'Audiencias' },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setFiltroTipo(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroTipo === f.key ? 'bg-white shadow-sm text-[#1b3a57]' : 'text-[#4a6a84] hover:text-[#1b3a57]'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filtro área */}
          {esReferente && (
            <select
              value={filtroArea}
              onChange={e => setFiltroArea(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs border border-[rgba(0,0,0,0.15)] bg-white text-[#1b3a57] focus:outline-none"
            >
              <option value="">Todas las áreas</option>
              <option value="CIVIL">Civil</option>
              <option value="LABORAL">Laboral</option>
              <option value="PENAL">Penal</option>
            </select>
          )}

          {/* Filtro abogado — visible si no es abogado puro o si es abogado (para ver audiencias de área) */}
          {(esReferente || esCoordinador) && (
            <select
              value={filtroAbogado}
              onChange={e => setFiltroAbogado(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs border border-[rgba(0,0,0,0.15)] bg-white text-[#1b3a57] focus:outline-none max-w-[180px]"
            >
              <option value="">Todos los letrados</option>
              {abogadosFiltro.map(u => (
                <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Leyenda tipos */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { tipo: 'AUDIENCIA',  label: 'Audiencia' },
          { tipo: 'TAREA',      label: 'Tarea' },
          { tipo: 'ACTIVIDAD',  label: 'Actividad' },
        ].map(({ tipo, label }) => (
          <span key={tipo} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border ${TIPO_COLOR[tipo]}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {label}
          </span>
        ))}
      </div>

      {/* Layout: calendario + panel */}
      <div className="flex gap-5 items-start">

        {/* Calendario */}
        <div className="flex-1 min-w-0 flex flex-col">
          {vista === 'mes' ? renderMes() : renderSemana()}
        </div>

        {/* Panel lateral día */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-card p-4 sticky top-4">
          <p className="text-sm font-bold text-[#1b3a57] mb-1">
            {new Date(diaSel + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-xs text-[#4a6a84] mb-3">
            {eventosPanel.length + eventosCustomPanel.length} evento{(eventosPanel.length + eventosCustomPanel.length) !== 1 ? 's' : ''}
          </p>

          {eventosPanel.length === 0 && eventosCustomPanel.length === 0 ? (
            <div className="py-8 text-center">
              <Icon name="inbox" size={32} className="block mb-2 mx-auto text-[#4a6a84]" />
              <p className="text-xs text-[#4a6a84]">Sin eventos para este día.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventosPanel.map(ev => (
                <div
                  key={ev.id}
                  className={`rounded-xl border p-3 ${TIPO_COLOR[ev.tipo ?? 'ACTIVIDAD']}`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${TIPO_COLOR[ev.tipo ?? 'ACTIVIDAD']}`}>
                      {ev.tipo === 'AUDIENCIA' ? 'Audiencia' : ev.tipo === 'TAREA' ? 'Tarea' : 'Actividad'}
                    </span>
                    {ev.tipo !== 'TAREA' && (
                      <button
                        title={ev.estado === 'COMPLETADA' ? 'Cumplido' : 'Marcar cumplido'}
                        disabled={ev.estado === 'COMPLETADA'}
                        onClick={e => {
                          e.stopPropagation()
                          const { editarActividad } = useExpedientesStore.getState()
                          editarActividad(
                            ev.expediente_id,
                            Number(ev.actividad_id),
                            { estado: 'COMPLETADA' },
                            usuarioActivo?.id ?? ''
                          )
                          toast.success('Actividad marcada como cumplida.')
                        }}
                        className={`flex-shrink-0 p-0.5 rounded-lg transition-colors ${
                          ev.estado === 'COMPLETADA'
                            ? 'text-green-600 opacity-100 cursor-default'
                            : 'text-[#4a6a84] hover:bg-green-100 hover:text-green-600'
                        }`}
                      >
                        <Icon name="check_circle" size={16} />
                      </button>
                    )}
                  </div>
                  <p
                    className="text-sm font-semibold text-[#1b3a57] cursor-pointer hover:underline"
                    onClick={() => navigate(RUTAS.EXPEDIENTE(ev.expediente_id))}
                  >
                    {ev.titulo}
                  </p>
                  <p className="text-[10px] font-mono text-[#4a6a84] mt-0.5">{ev.expediente_id}</p>
                </div>
              ))}
              {eventosCustomPanel.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => setEventoDetalle(ev)}
                  className={`rounded-xl border p-3 cursor-pointer hover:opacity-80 transition-opacity ${COLOR_EVENTO[ev.tipo]}`}
                >
                  <p className="text-sm font-semibold">{ev.titulo}</p>
                  {ev.hora && <p className="text-[10px] opacity-70">{ev.hora}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal detalle agenda event */}
      <Modal
        open={!!agendaEvDetalle}
        onClose={() => setAgendaEvDetalle(null)}
        titulo={agendaEvDetalle?.titulo ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAgendaEvDetalle(null)}>Cerrar</Button>
            {agendaEvDetalle && agendaEvDetalle.tipo !== 'TAREA' && (
              <button
                onClick={() => {
                  const { editarActividad } = useExpedientesStore.getState()
                  editarActividad(
                    agendaEvDetalle.expediente_id,
                    Number(agendaEvDetalle.actividad_id),
                    { estado: 'COMPLETADA' },
                    usuarioActivo?.id ?? ''
                  )
                  toast.success('Actividad marcada como cumplida.')
                  setAgendaEvDetalle(null)
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-green-600 text-green-700 hover:bg-green-50 transition-colors"
              >
                <Icon name="check_circle" size={16} />
                Cumplido
              </button>
            )}
            {agendaEvDetalle && (
              <Button variant="primary" onClick={() => { navigate(RUTAS.EXPEDIENTE(agendaEvDetalle.expediente_id)); setAgendaEvDetalle(null) }}>
                Ver actuación
              </Button>
            )}
          </>
        }
      >
        {agendaEvDetalle && (
          <div className="space-y-2 py-1">
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${TIPO_COLOR[agendaEvDetalle.tipo ?? 'ACTIVIDAD']}`}>
              {agendaEvDetalle.tipo === 'AUDIENCIA' ? 'Audiencia' : agendaEvDetalle.tipo === 'TAREA' ? 'Tarea' : 'Actividad'}
            </span>
            <p className="text-sm text-[#4a6a84]">📅 {agendaEvDetalle.fecha_vencimiento}</p>
            <p className="text-sm text-[#4a6a84]">📁 Actuación: <span className="font-mono font-bold text-[#1b3a57]">{agendaEvDetalle.expediente_id}</span></p>
            <p className="text-sm text-[#4a6a84]">🏛️ Área: {agendaEvDetalle.area}</p>
          </div>
        )}
      </Modal>

      {/* Modal detalle evento custom */}
      <Modal
        open={!!eventoDetalle}
        onClose={() => setEventoDetalle(null)}
        titulo={eventoDetalle?.titulo ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="danger" onClick={() => { if (eventoDetalle) { eliminarEvento(eventoDetalle.id); setEventoDetalle(null); toast.success('Evento eliminado.') } }}>
              Eliminar
            </Button>
            <Button variant="secondary" onClick={() => setEventoDetalle(null)}>Cerrar</Button>
          </>
        }
      >
        {eventoDetalle && (
          <div className="space-y-2 py-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${COLOR_EVENTO[eventoDetalle.tipo]}`}>
              {eventoDetalle.tipo.charAt(0).toUpperCase() + eventoDetalle.tipo.slice(1)}
            </span>
            <p className="text-sm text-[#4a6a84]">📅 {eventoDetalle.fecha} {eventoDetalle.hora && `· ${eventoDetalle.hora}`}</p>
            {eventoDetalle.descripcion && <p className="text-sm text-[#1b3a57]">{eventoDetalle.descripcion}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}