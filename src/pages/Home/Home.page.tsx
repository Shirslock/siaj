import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { TIPO_LABEL } from '../BandejaAbogado/BandejaAbogado.page'
import { RUTAS } from '../../utils/routing'
import { formatFecha } from '../../utils/format'
import { getAlertaExpediente, getAlertaTimer } from '../../utils/alertas'
import type { Expediente } from '../../types'

// 'ARCHIVO' es el código de estado terminal real del ciclo Penal (etapasPenales.ts) —
// distinto de 'ARCHIVADO'/'ARCHIVADA' que usan los demás tipos (mismo criterio que BandejaAbogado).
const ESTADOS_CERRADO = ['ARCHIVADO', 'ARCHIVADA', 'ARCHIVO', 'CERRADO', 'CUMPLIDO', 'COMPLETADA']

const COLORES_DONUT = ['#2a78d6', '#1baf7a', '#7F77DD', '#eda100', '#e34948', '#8aa0b3', '#85B7EB', '#0b3d66']

// ── Widgets genéricos (mismo estilo visual que Dashboard.page.tsx) ─────────────

function WidgetCard({
  titulo, sub, children, onClick,
}: {
  titulo?: string
  sub?: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#1b3a57]' : ''
      }`}
    >
      {titulo && (
        <p className="text-[11px] font-semibold text-[#4a6a84] uppercase tracking-wide mb-0.5">
          {titulo}
        </p>
      )}
      {sub && <p className="text-[11px] text-[#7a9ab4] mb-3">{sub}</p>}
      {children}
    </div>
  )
}

// ── Tag / chip de la columna izquierda ──────────────────────────────────────────

function Tag({
  label, valor, color, onClick,
}: {
  label: string
  valor: number
  color?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white transition-all ${
        onClick ? 'cursor-pointer hover:border-[#1b3a57] hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />}
        <span className="text-[12px] text-[#4a6a84] font-medium truncate">{label}</span>
      </div>
      <span className="text-[13px] font-bold text-[#1b3a57] flex-shrink-0">{valor}</span>
    </div>
  )
}

function SeparadorTags() {
  return <div className="h-px bg-[rgba(0,0,0,0.07)] my-2" />
}

// ── Vencimientos + tareas (fusionados) ─────────────────────────────────────────

interface ItemVencimiento {
  exp: Expediente
  estado: 'vencido' | 'por_vencer'
  fecha?: string
  nombre?: string
}

function construirVencimientos(
  expedientes: Expediente[],
  tareasMap: Record<string, import('../../types').Tarea[]>,
): ItemVencimiento[] {
  const items: ItemVencimiento[] = []
  expedientes.forEach(exp => {
    const alertaTareas = getAlertaExpediente(exp.id, tareasMap, exp.timeline)
    const alertaTimer  = getAlertaTimer(exp)
    const timerVencido = alertaTimer.activa && alertaTimer.diasRestantes !== undefined && alertaTimer.diasRestantes <= 0

    if (alertaTareas.estado === 'vencido' || timerVencido) {
      items.push({
        exp,
        estado: 'vencido',
        fecha:  alertaTareas.fechaVencimiento ?? alertaTimer.fechaVencimiento,
        nombre: alertaTareas.nombreElemento ?? 'Plazo procesal',
      })
    } else if (alertaTareas.estado === 'por_vencer' || alertaTimer.activa) {
      items.push({
        exp,
        estado: 'por_vencer',
        fecha:  alertaTareas.fechaVencimiento ?? alertaTimer.fechaVencimiento,
        nombre: alertaTareas.nombreElemento ?? 'Plazo procesal',
      })
    }
  })
  // Vencido primero, y dentro de cada grupo el más antiguo primero — mismo criterio que usa PanelLetrado.
  return items.sort((a, b) => {
    if (a.estado !== b.estado) return a.estado === 'vencido' ? -1 : 1
    return (a.fecha ?? '').localeCompare(b.fecha ?? '')
  })
}

function WidgetVencimientos({ items }: { items: ItemVencimiento[] }) {
  const navigate = useNavigate()
  const visibles = items.slice(0, 8)

  return (
    <WidgetCard titulo="Vencimientos y tareas" sub="Plazos y tareas activas, ordenados por urgencia">
      {visibles.length === 0 ? (
        <p className="text-[12px] text-[#7a9ab4] text-center py-6">Sin vencimientos activos.</p>
      ) : (
        <div className="divide-y divide-[rgba(0,0,0,0.05)]">
          {visibles.map(({ exp, estado, fecha, nombre }) => (
            <div
              key={exp.id}
              onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id))}
              className="flex items-center justify-between gap-3 py-2.5 cursor-pointer hover:bg-[#f5f5f5] transition-colors rounded-lg px-1.5 -mx-1.5"
            >
              <div className="min-w-0">
                <p className="text-[12px] text-[#1b3a57] font-medium truncate">{exp.caratula}</p>
                <p className="text-[11px] text-[#7a9ab4]">
                  {exp.id}{nombre ? ` · ${nombre}` : ''}{fecha ? ` · ${formatFecha(fecha)}` : ''}
                </p>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${
                estado === 'vencido'
                  ? 'bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]'
                  : 'bg-[#fef3c7] text-[#d97706] border border-[#fde68a]'
              }`}>
                {estado === 'vencido' ? 'Vencido' : 'Por vencer'}
              </span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => navigate(`${RUTAS.ACTUACIONES}?alerta=1`)}
        className="mt-3 text-[11px] font-bold text-[#1b3a57] hover:underline"
      >
        Ver todas las actuaciones con alerta →
      </button>
    </WidgetCard>
  )
}

// ── Mis actuaciones por sub-estado ──────────────────────────────────────────────

function WidgetPorSubEstado({ expedientes }: { expedientes: Expediente[] }) {
  const navigate = useNavigate()

  const data = useMemo(() => {
    const conteo: Record<string, number> = {}
    expedientes.forEach(e => {
      const code = e.estadoProcesal ?? e.estado
      conteo[code] = (conteo[code] ?? 0) + 1
    })
    return Object.entries(conteo)
      .map(([code, value]) => ({ code, name: code, value }))
      .sort((a, b) => b.value - a.value)
  }, [expedientes])

  if (data.length === 0) {
    return (
      <WidgetCard titulo="Mis actuaciones por sub-estado">
        <p className="text-[12px] text-[#7a9ab4] text-center py-6">Sin actuaciones activas.</p>
      </WidgetCard>
    )
  }

  return (
    <WidgetCard titulo="Mis actuaciones por sub-estado" sub="Click en un sector para filtrar en Actuaciones">
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
              dataKey="value" strokeWidth={2} stroke="#fff" cursor="pointer"
              onClick={(d: any) => navigate(`${RUTAS.ACTUACIONES}?estado=${encodeURIComponent(d.code)}`)}
            >
              {data.map((d, i) => <Cell key={d.code} fill={COLORES_DONUT[i % COLORES_DONUT.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 min-w-0">
          {data.map((d, i) => (
            <div
              key={d.code}
              onClick={() => navigate(`${RUTAS.ACTUACIONES}?estado=${encodeURIComponent(d.code)}`)}
              className="flex items-center gap-1.5 text-[11px] cursor-pointer hover:opacity-70 transition-opacity"
            >
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORES_DONUT[i % COLORES_DONUT.length] }} />
              <span className="text-[#4a6a84] truncate">{d.name}</span>
              <span className="font-semibold text-[#1b3a57] ml-auto pl-3">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  )
}

// ── Por tipo de intervención (mesa_tipo_intervencion — Civil/Laboral: Actora/Demandada; Penal: Denunciante/Actuación de Oficio) ──

function WidgetTipoIntervencion({ expedientes }: { expedientes: Expediente[] }) {
  const navigate = useNavigate()

  const data = useMemo(() => {
    const conteo: Record<string, number> = {}
    expedientes.forEach(e => {
      const valor = String(e.campos_mesa?.['mesa_tipo_intervencion'] ?? '') || 'Sin Intervención'
      conteo[valor] = (conteo[valor] ?? 0) + 1
    })
    return Object.entries(conteo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [expedientes])

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <WidgetCard titulo="Por tipo de intervención" sub="Actora / Demandada / Denunciante / Oficio, según el área de cada actuación">
      {total === 0 ? (
        <p className="text-[12px] text-[#7a9ab4] text-center py-6">Sin actuaciones activas.</p>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                dataKey="value" strokeWidth={2} stroke="#fff" cursor="pointer"
                onClick={(d: any) => navigate(`${RUTAS.ACTUACIONES}?parte=${encodeURIComponent(d.name)}`)}
              >
                {data.map((d, i) => <Cell key={d.name} fill={COLORES_DONUT[i % COLORES_DONUT.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 min-w-0">
            {data.map((d, i) => (
              <div
                key={d.name}
                onClick={() => navigate(`${RUTAS.ACTUACIONES}?parte=${encodeURIComponent(d.name)}`)}
                className="flex items-center gap-1.5 text-[11px] cursor-pointer hover:opacity-70 transition-opacity"
              >
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORES_DONUT[i % COLORES_DONUT.length] }} />
                <span className="text-[#4a6a84] truncate">{d.name}</span>
                <span className="font-semibold text-[#1b3a57] ml-auto pl-3">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

// ── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────────

export default function HomePage() {
  const { expedientes, tareasMap } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const navigate = useNavigate()

  const misExpedientes = useMemo(() =>
    expedientes.filter(e => e.abogado_id === usuarioActivo?.id),
    [expedientes, usuarioActivo])

  const misActivos = useMemo(() =>
    misExpedientes.filter(e => !ESTADOS_CERRADO.includes(e.estado)),
    [misExpedientes])

  const vencimientos = useMemo(() =>
    construirVencimientos(misActivos, tareasMap),
    [misActivos, tareasMap])

  // Causas judiciales distintas entre mis activas — no cuenta actuaciones sueltas
  // (mismo criterio de agrupación que BandejaAbogado.page.tsx / construirItems).
  const causasActivasCount = useMemo(() => {
    const causas = new Set<string>()
    misActivos.forEach(e => {
      const nc = (e.numero_causa ?? '').trim()
      if (nc && nc.toUpperCase() !== 'SS') causas.add(nc)
    })
    return causas.size
  }, [misActivos])

  const asignadoCount = useMemo(() =>
    misActivos.filter(e => e.estado === 'ASIGNADO').length,
    [misActivos])

  const intervencion = useMemo(() => {
    let actora = 0, demandada = 0, sinIntervencion = 0
    misActivos.forEach(e => {
      const valor = String(e.campos_mesa?.['mesa_tipo_intervencion'] ?? '')
      if (valor === 'Actora') actora++
      else if (valor === 'Demandada') demandada++
      else if (valor === 'Sin Intervención' || valor === '') sinIntervencion++
    })
    const penal = misActivos.filter(e => e.area === 'PENAL').length
    return { actora, demandada, sinIntervencion, penal }
  }, [misActivos])

  const porVencerCount = useMemo(() =>
    vencimientos.filter(i => i.estado === 'por_vencer').length,
    [vencimientos])

  const urgentesCount = useMemo(() =>
    misActivos.filter(e => e.es_urgente).length,
    [misActivos])

  const tiposActivos = useMemo(() => {
    const conteo: Record<string, number> = {}
    misActivos.forEach(e => { conteo[e.tipo] = (conteo[e.tipo] ?? 0) + 1 })
    return Object.entries(conteo)
      .map(([code, count]) => ({ code, count, label: TIPO_LABEL[code] ?? code }))
      .sort((a, b) => b.count - a.count)
  }, [misActivos])

  const cerradasCount = useMemo(() =>
    misExpedientes.filter(e => ESTADOS_CERRADO.includes(e.estado)).length,
    [misExpedientes])

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57]">Inicio</h1>
        <p className="text-sm text-[#4a6a84] mt-1">
          Hola, <span className="font-semibold text-[#1b3a57]">{usuarioActivo?.nombre} {usuarioActivo?.apellido}</span>.
          Gestionando <span className="font-semibold text-[#1b3a57]">{misActivos.length}</span> actuación
          {misActivos.length !== 1 ? 'es' : ''} activa{misActivos.length !== 1 ? 's' : ''}.
        </p>
      </div>

      <div className="flex gap-4 items-start">
        {/* Columna izquierda: tags/contadores, todos con deep-link a Actuaciones */}
        <div className="w-64 flex-shrink-0 space-y-1.5">
          <Tag
            label="Total de Causas Activas" valor={causasActivasCount}
            onClick={() => navigate(RUTAS.ACTUACIONES)}
          />
          <Tag
            label="Total de actuaciones activas" valor={misActivos.length}
            onClick={() => navigate(RUTAS.ACTUACIONES)}
          />
          <Tag
            label="Nuevas actuaciones (Asignado)" valor={asignadoCount}
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?estado=ASIGNADO`)}
          />

          <SeparadorTags />

          <Tag
            label="Actora" valor={intervencion.actora} color="#2a78d6"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?parte=Actora`)}
          />
          <Tag
            label="Demandada" valor={intervencion.demandada} color="#eda100"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?parte=Demandada`)}
          />
          <Tag
            label="Sin Intervención" valor={intervencion.sinIntervencion} color="#8aa0b3"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?parte=${encodeURIComponent('Sin Intervención')}`)}
          />
          <Tag
            label="Penal" valor={intervencion.penal} color="#7F77DD"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?area=PENAL`)}
          />

          <SeparadorTags />

          <Tag
            label="Tareas por vencer" valor={porVencerCount} color="#d97706"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?alerta=1`)}
          />
          <Tag
            label="Urgentes" valor={urgentesCount} color="#e34948"
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?urgente=1`)}
          />

          {tiposActivos.length > 0 && (
            <>
              <SeparadorTags />
              <p className="text-[10px] font-black text-[#7a9ab4] uppercase tracking-widest px-1 mb-1">
                Por tipo de gestión
              </p>
              {tiposActivos.map(t => (
                <Tag
                  key={t.code} label={t.label} valor={t.count}
                  onClick={() => navigate(`${RUTAS.ACTUACIONES}?tipo=${encodeURIComponent(t.code)}`)}
                />
              ))}
            </>
          )}

          <SeparadorTags />

          <Tag
            label="Actuaciones cerradas" valor={cerradasCount}
            onClick={() => navigate(`${RUTAS.ACTUACIONES}?tab=archivados`)}
          />
        </div>

        {/* Columna derecha: vencimientos y donuts */}
        <div className="flex-1 min-w-0 space-y-4">
          <WidgetVencimientos items={vencimientos} />

          <div className="grid grid-cols-2 gap-4">
            <WidgetPorSubEstado expedientes={misActivos} />
            <WidgetTipoIntervencion expedientes={misActivos} />
          </div>
        </div>
      </div>
    </div>
  )
}
