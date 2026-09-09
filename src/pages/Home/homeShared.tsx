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

// Lógica/cálculos y widgets compartidos del Home de ABOGADO (ver Home.page.tsx).

// 'ARCHIVO' es el código de estado terminal real del ciclo Penal (etapasPenales.ts) —
// distinto de 'ARCHIVADO'/'ARCHIVADA' que usan los demás tipos (mismo criterio que BandejaAbogado).
export const ESTADOS_CERRADO = ['ARCHIVADO', 'ARCHIVADA', 'ARCHIVO', 'CERRADO', 'CUMPLIDO', 'COMPLETADA']

export const COLORES_DONUT = ['#2a78d6', '#1baf7a', '#7F77DD', '#eda100', '#e34948', '#8aa0b3', '#85B7EB', '#0b3d66']

// ── Widgets genéricos (mismo estilo visual que Dashboard.page.tsx) ─────────────

export function WidgetCard({
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
      className={`p-5 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white transition-all ${
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

// ── Tag / chip de contador ───────────────────────────────────────────────────────

export function Tag({
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
      className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white transition-all ${
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

export function SeparadorTags() {
  return <div className="h-px bg-[rgba(0,0,0,0.07)] my-3" />
}

// ── Vencimientos + tareas (fusionados) ─────────────────────────────────────────

export interface ItemVencimiento {
  exp: Expediente
  estado: 'vencido' | 'por_vencer'
  fecha?: string
  nombre?: string
}

export function construirVencimientos(
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

export function WidgetVencimientos({ items }: { items: ItemVencimiento[] }) {
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
              className="flex items-center justify-between gap-3 py-3 cursor-pointer hover:bg-[#f5f5f5] transition-colors rounded-lg px-2 -mx-2"
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

export function WidgetPorSubEstado({ expedientes }: { expedientes: Expediente[] }) {
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

export function WidgetTipoIntervencion({ expedientes }: { expedientes: Expediente[] }) {
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

// ── Datos compartidos por las 3 variantes ────────────────────────────────────────

export function useHomeData() {
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

  return {
    usuarioActivo,
    navigate,
    misExpedientes,
    misActivos,
    vencimientos,
    causasActivasCount,
    asignadoCount,
    intervencion,
    porVencerCount,
    urgentesCount,
    tiposActivos,
    cerradasCount,
  }
}
