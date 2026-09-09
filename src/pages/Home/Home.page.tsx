import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { RUTAS } from '../../utils/routing'
import { formatFecha } from '../../utils/format'
import { getAlertaExpediente, getAlertaTimer } from '../../utils/alertas'
import type { Expediente } from '../../types'

// 'ARCHIVO' es el código de estado terminal real del ciclo Penal (etapasPenales.ts) —
// distinto de 'ARCHIVADO'/'ARCHIVADA' que usan los demás tipos (mismo criterio que BandejaAbogado).
const ESTADOS_CERRADO = ['ARCHIVADO', 'ARCHIVADA', 'ARCHIVO', 'CERRADO', 'CUMPLIDO', 'COMPLETADA']

const COLORES_DONUT = ['#2a78d6', '#1baf7a', '#7F77DD', '#eda100', '#e34948', '#8aa0b3', '#85B7EB', '#0b3d66']

const DIAS_NUEVAS = 7

function haceNDias(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}

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

function KpiCard({
  label, valor, color, onClick,
}: {
  label: string
  valor: number
  color: 'red' | 'amber' | 'blue'
  onClick?: () => void
}) {
  const dot = { red: '#e34948', amber: '#eda100', blue: '#2a78d6' }[color]
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-[#1b3a57] hover:ring-offset-1' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
        <p className="text-[11px] text-[#7a9ab4] uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[28px] font-semibold text-[#1b3a57] leading-none">{valor}</p>
    </div>
  )
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

  const fechaDesdeNuevas = useMemo(() => haceNDias(DIAS_NUEVAS), [])

  const nuevasCount = useMemo(() =>
    misActivos.filter(e => e.fecha_recepcion >= fechaDesdeNuevas).length,
    [misActivos, fechaDesdeNuevas])

  const actoraCount = useMemo(() =>
    misActivos.filter(e => String(e.campos_mesa?.['mesa_tipo_intervencion'] ?? '') === 'Actora').length,
    [misActivos])

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

      {/* KPIs con deep-link a Actuaciones */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          label="Por parte Actora" valor={actoraCount} color="blue"
          onClick={() => navigate(`${RUTAS.ACTUACIONES}?parte=Actora`)}
        />
        <KpiCard
          label={`Actuaciones nuevas (${DIAS_NUEVAS}d)`} valor={nuevasCount} color="blue"
          onClick={() => navigate(`${RUTAS.ACTUACIONES}?fechaDesde=${fechaDesdeNuevas}`)}
        />
      </div>

      <WidgetVencimientos items={vencimientos} />

      <div className="grid grid-cols-2 gap-4">
        <WidgetPorSubEstado expedientes={misActivos} />
        <WidgetTipoIntervencion expedientes={misActivos} />
      </div>
    </div>
  )
}
