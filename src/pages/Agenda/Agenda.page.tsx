import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgendaEvents } from './useAgendaEvents'
import { useAgendaStore, COLOR_EVENTO } from '../../store/agenda.store'
import type { TipoEventoCustom, EventoCustom } from '../../store/agenda.store'
import { useUIStore } from '../../store/ui.store'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { RUTAS } from '../../utils/routing'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'

const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getDiasDelMes(year: number, month: number) {
  const primerDia = new Date(year, month, 1)
  const ultimoDia = new Date(year, month + 1, 0)
  const offset = (primerDia.getDay() + 6) % 7 // lunes=0
  const dias: (Date | null)[] = []
  for (let i = 0; i < offset; i++) dias.push(null)
  for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(year, month, d))
  return dias
}

const BLANK_EVENTO = {
  titulo: '',
  descripcion: '',
  fecha: '',
  hora: '',
  tipo: 'reunion' as TipoEventoCustom,
}

export default function AgendaPage() {
  const navigate = useNavigate()
  const eventos = useAgendaEvents()
  const { usuarioActivo } = useUIStore()
  const { eventosCustom, agregarEvento, eliminarEvento } = useAgendaStore()
  const [fechaRef, setFechaRef] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todas' | 'tareas' | 'sistema'>('todas')
  const [modalEvento, setModalEvento] = useState(false)
  const [eventoDetalle, setEventoDetalle] = useState<EventoCustom | null>(null)
  const [formEvento, setFormEvento] = useState(BLANK_EVENTO)

  const year = fechaRef.getFullYear()
  const month = fechaRef.getMonth()
  const dias = useMemo(() => getDiasDelMes(year, month), [year, month])

  const eventosFiltrados = useMemo(() => {
    if (filtro === 'todas') return eventos
    if (filtro === 'tareas') return eventos.filter(e => e.id.startsWith('TAREA_') || e.id.startsWith('KANBAN_'))
    return eventos.filter(e => e.id.startsWith('ACT_'))
  }, [eventos, filtro])

  function eventosDelDia(fecha: string) {
    return eventosFiltrados.filter(e => e.fecha_vencimiento === fecha)
  }

  function eventosCustomDelDia(fecha: string) {
    return eventosCustom.filter(e => e.fecha === fecha)
  }

  function handleClickDia(fecha: string) {
    setDiaSeleccionado(fecha)
    setFormEvento({ ...BLANK_EVENTO, fecha })
    setModalEvento(true)
  }

  const hoy = new Date().toISOString().split('T')[0]
  const diaSel = diaSeleccionado ?? hoy
  const eventosPanel = eventosDelDia(diaSel)

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setFechaRef(new Date(year, month - 1, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e8e8e8] text-[#1b3a57]">
            <Icon name="arrow_back" size={18} />
          </button>
          <h1 className="font-headline font-extrabold text-2xl text-[#1b3a57]">
            {MESES[month]} {year}
          </h1>
          <button onClick={() => setFechaRef(new Date(year, month + 1, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e8e8e8] text-[#1b3a57]">
            <Icon name="arrow_forward" size={18} />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1 bg-[#e8e8e8] rounded-xl p-1">
          {[
            { key: 'todas' as const,  label: 'Todas' },
            { key: 'tareas' as const, label: 'Tareas' },
            { key: 'sistema' as const, label: 'Sistema' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filtro === f.key ? 'bg-white shadow-sm text-[#1b3a57]' : 'text-[#4a6a84] hover:text-[#1b3a57]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5 items-start">

        {/* Calendario */}
        <div className="flex-1 bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[rgba(0,0,0,0.08)] bg-[#f9f9f9]">
            {DIAS.map(d => (
              <div key={d} className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#4a6a84] text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dias.map((fecha, idx) => {
              if (!fecha) return <div key={idx} className="border-b border-r border-[rgba(0,0,0,0.05)] min-h-[100px] bg-[#fafafa]" />
              const iso = fecha.toISOString().split('T')[0]
              const evs = eventosDelDia(iso)
              const evsCustom = eventosCustomDelDia(iso)
              const isToday = iso === hoy
              const isSelected = iso === diaSeleccionado
              return (
                <div
                  key={iso}
                  onClick={() => handleClickDia(iso)}
                  className={`border-b border-r border-[rgba(0,0,0,0.05)] min-h-[100px] p-2 cursor-pointer transition-colors hover:bg-[#f0f0f0] ${
                    isSelected ? 'bg-[rgba(196,223,232,0.30)]' : ''
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    isToday ? 'bg-[#1b3a57] text-white' : 'text-[#1b3a57]'
                  }`}>
                    {fecha.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {evs.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${
                          ev.id.startsWith('TAREA_') || ev.id.startsWith('KANBAN_') ? 'bg-[#dbeafe] text-[#1b3a57]' : 'bg-[#C4DFE8] text-[#1b3a57]'
                        }`}
                      >
                        {ev.titulo}
                      </div>
                    ))}
                    {evs.length > 2 && (
                      <p className="text-[9px] text-[#4a6a84] font-bold">+{evs.length - 2} más</p>
                    )}
                    {evsCustom.map(ev => (
                      <div
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); setEventoDetalle(ev) }}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate cursor-pointer ${COLOR_EVENTO[ev.tipo]}`}
                      >
                        {ev.hora && <span className="mr-1 opacity-70">{ev.hora}</span>}
                        {ev.titulo}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel lateral del día */}
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl shadow-card p-4 sticky top-4">
          <p className="text-sm font-bold text-[#1b3a57] mb-1">
            {new Date(diaSel + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-xs text-[#4a6a84] mb-3">
            {eventosPanel.length} evento{eventosPanel.length !== 1 ? 's' : ''} programado{eventosPanel.length !== 1 ? 's' : ''}
          </p>

          {eventosPanel.length === 0 ? (
            <div className="py-8 text-center">
              <Icon name="inbox" size={32} className="block mb-2" />
              <p className="text-xs text-[#4a6a84]">Sin eventos para este día.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventosPanel.map(ev => {
                const esTarea = ev.id.startsWith('TAREA_') || ev.id.startsWith('KANBAN_')
                return (
                  <div
                    key={ev.id}
                    onClick={() => navigate(RUTAS.EXPEDIENTE(ev.expediente_id))}
                    className="rounded-xl border border-[rgba(0,0,0,0.08)] p-3 cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                  >
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      esTarea ? 'bg-[#dbeafe] text-[#1b3a57]' : 'bg-[#C4DFE8] text-[#1b3a57]'
                    }`}>
                      {esTarea ? 'Tarea' : 'Sistema'}
                    </span>
                    <p className="text-sm font-semibold text-[#1b3a57] mt-1">{ev.titulo}</p>
                    <p className="text-[10px] font-mono text-[#4a6a84] mt-0.5">Expte. {ev.expediente_id}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo evento */}
      <Modal
        open={modalEvento}
        onClose={() => { setModalEvento(false); setFormEvento(BLANK_EVENTO) }}
        titulo="Nuevo evento"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalEvento(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!formEvento.titulo.trim()}
              onClick={() => {
                agregarEvento({
                  ...formEvento,
                  color: COLOR_EVENTO[formEvento.tipo],
                  creado_por: usuarioActivo?.id ?? '',
                })
                setModalEvento(false)
                setFormEvento(BLANK_EVENTO)
                toast.success('Evento creado.')
              }}
            >
              Crear evento
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-1">
          {/* Tipo */}
          <div>
            <label className="field-label">Tipo de evento</label>
            <div className="flex gap-1 flex-wrap">
              {([
                ['reunion', 'Reunión'],
                ['recordatorio', 'Recordatorio'],
                ['vencimiento', 'Vencimiento'],
                ['otro', 'Otro'],
              ] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFormEvento(p => ({ ...p, tipo: val }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                    formEvento.tipo === val
                      ? 'bg-[#1b3a57] text-white border-[#1b3a57]'
                      : 'bg-white text-[#4a6a84] border-[rgba(0,0,0,0.12)]'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="field-label">Título *</label>
            <input
              type="text"
              className="field-input w-full"
              placeholder="Ej: Reunión con RRHH"
              autoFocus
              value={formEvento.titulo}
              onChange={e => setFormEvento(p => ({ ...p, titulo: e.target.value }))}
            />
          </div>

          {/* Fecha + Hora */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="field-label">Fecha</label>
              <input
                type="date"
                className="field-input w-full"
                value={formEvento.fecha}
                onChange={e => setFormEvento(p => ({ ...p, fecha: e.target.value }))}
              />
            </div>
            <div className="w-32">
              <label className="field-label">Hora</label>
              <input
                type="time"
                className="field-input w-full"
                value={formEvento.hora}
                onChange={e => setFormEvento(p => ({ ...p, hora: e.target.value }))}
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="field-label">Descripción</label>
            <textarea
              className="field-input w-full min-h-[60px] resize-none"
              placeholder="Detalles del evento..."
              value={formEvento.descripcion}
              onChange={e => setFormEvento(p => ({ ...p, descripcion: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Modal detalle evento custom */}
      <Modal
        open={!!eventoDetalle}
        onClose={() => setEventoDetalle(null)}
        titulo={eventoDetalle?.titulo ?? ''}
        size="sm"
        footer={
          <>
            <Button
              variant="danger"
              onClick={() => {
                if (eventoDetalle) {
                  eliminarEvento(eventoDetalle.id)
                  setEventoDetalle(null)
                  toast.success('Evento eliminado.')
                }
              }}
            >
              Eliminar
            </Button>
            <Button variant="secondary" onClick={() => setEventoDetalle(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {eventoDetalle && (
          <div className="space-y-2 py-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${COLOR_EVENTO[eventoDetalle.tipo]}`}>
                {eventoDetalle.tipo.charAt(0).toUpperCase() + eventoDetalle.tipo.slice(1)}
              </span>
            </div>
            <p className="text-sm text-[#4a6a84]">
              📅 {eventoDetalle.fecha}
              {eventoDetalle.hora && ` · ${eventoDetalle.hora}`}
            </p>
            {eventoDetalle.descripcion && (
              <p className="text-sm text-[#1b3a57]">{eventoDetalle.descripcion}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}