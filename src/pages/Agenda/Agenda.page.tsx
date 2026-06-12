import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgendaEvents } from './useAgendaEvents'
import { RUTAS } from '../../utils/routing'
import Icon from '../../components/ui/Icon'

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

export default function AgendaPage() {
  const navigate = useNavigate()
  const eventos = useAgendaEvents()
  const [fechaRef, setFechaRef] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todas' | 'tareas' | 'sistema'>('todas')

  const year = fechaRef.getFullYear()
  const month = fechaRef.getMonth()
  const dias = useMemo(() => getDiasDelMes(year, month), [year, month])

  const eventosFiltrados = useMemo(() => {
    if (filtro === 'todas') return eventos
    if (filtro === 'tareas') return eventos.filter(e => e.id.startsWith('TAREA_'))
    return eventos.filter(e => e.id.startsWith('ACT_'))
  }, [eventos, filtro])

  function eventosDelDia(fecha: string) {
    return eventosFiltrados.filter(e => e.fecha_vencimiento === fecha)
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
              const isToday = iso === hoy
              const isSelected = iso === diaSeleccionado
              return (
                <div
                  key={iso}
                  onClick={() => setDiaSeleccionado(iso)}
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
                          ev.id.startsWith('TAREA_') ? 'bg-[#dbeafe] text-[#1b3a57]' : 'bg-[#C4DFE8] text-[#1b3a57]'
                        }`}
                      >
                        {ev.titulo}
                      </div>
                    ))}
                    {evs.length > 2 && (
                      <p className="text-[9px] text-[#4a6a84] font-bold">+{evs.length - 2} más</p>
                    )}
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
                const esTarea = ev.id.startsWith('TAREA_')
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
    </div>
  )
}