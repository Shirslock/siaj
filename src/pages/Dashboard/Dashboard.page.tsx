import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { TablaExpedientes } from '../../components/expedientes/TablaExpedientes'
import { getUsuarioById } from '../../data/usuarios'
import { getAlertaExpediente, type EstadoAlerta } from '../../utils/alertas'
import { RUTAS } from '../../utils/routing'
import type { Expediente, Area, Tarea } from '../../types'
import Icon from '../../components/ui/Icon'

const HOY = new Date().toISOString().split('T')[0]

const COLOR_AREA: Record<Area, string> = {
  CIVIL:   '#2a78d6',
  LABORAL: '#1baf7a',
  PENAL:   '#7F77DD',
}

const ESTADOS_CERRADOS = ['ARCHIVADO', 'ARCHIVADA', 'Finalizado', 'Archivado', 'CERRADO']

const COLORES_ESTADOS = ['#eda100', '#7F77DD', '#2a78d6', '#1baf7a', '#85B7EB', '#e34948']

function estaActiva(e: Expediente): boolean {
  return !ESTADOS_CERRADOS.includes(e.estado)
}

function diasHasta(fecha: string): number {
  return Math.round((new Date(fecha).getTime() - new Date(HOY).getTime()) / 86400000)
}

type Franja = 'vencido' | 'porVencer7' | 'porVencer30' | 'sinAlerta'

function clasificarVencimiento(exp: Expediente, tareasMap: Record<string, Tarea[]>): Franja {
  const alerta = getAlertaExpediente(exp.id, tareasMap, exp.timeline)
  if (alerta.estado === 'vencido') return 'vencido'
  if (alerta.estado === 'por_vencer' && alerta.fechaVencimiento) {
    const dias = diasHasta(alerta.fechaVencimiento)
    return dias <= 7 ? 'porVencer7' : 'porVencer30'
  }
  return 'sinAlerta'
}

function KpiCard({
  label, value, sub, badge, badgeColor,
}: {
  label: string
  value: string | number
  sub?: string
  badge?: string
  badgeColor?: 'red' | 'amber' | 'green' | 'blue'
}) {
  const badgeStyles = {
    red:   'bg-[#fcebeb] text-[#a32d2d]',
    amber: 'bg-[#faeeda] text-[#854f0b]',
    green: 'bg-[#eaf3de] text-[#3b6d11]',
    blue:  'bg-[#e6f1fb] text-[#185fa5]',
  }
  return (
    <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white">
      <p className="text-[11px] text-[#7a9ab4] uppercase tracking-wide mb-1.5">{label}</p>
      <p className="text-[28px] font-semibold text-[#1b3a57] leading-none mb-1">{value}</p>
      {sub && <p className="text-[11px] text-[#7a9ab4]">{sub}</p>}
      {badge && badgeColor && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold mt-1.5 ${badgeStyles[badgeColor]}`}>
          {badge}
        </span>
      )}
    </div>
  )
}

function Semaforo({
  vencidas, porVencer7, porVencer30, sinAlerta,
}: {
  vencidas: number
  porVencer7: number
  porVencer30: number
  sinAlerta: number
}) {
  const total = vencidas + porVencer7 + porVencer30 + sinAlerta
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0)

  return (
    <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white">
      <p className="text-[11px] font-semibold text-[#4a6a84] uppercase tracking-wide mb-0.5">
        Semáforo de vencimientos
      </p>
      <p className="text-[11px] text-[#7a9ab4] mb-3">Estado de todos los plazos activos</p>
      <div className="h-6 rounded-lg overflow-hidden flex mb-2">
        {vencidas > 0 && (
          <div style={{ width: `${pct(vencidas)}%` }} className="bg-[#e34948] flex items-center justify-center text-[10px] font-semibold text-white">
            {vencidas}
          </div>
        )}
        {porVencer7 > 0 && (
          <div style={{ width: `${pct(porVencer7)}%` }} className="bg-[#eda100] flex items-center justify-center text-[10px] font-semibold text-white">
            {porVencer7}
          </div>
        )}
        {porVencer30 > 0 && (
          <div style={{ width: `${pct(porVencer30)}%` }} className="bg-[#FAC775] flex items-center justify-center text-[10px] font-semibold text-[#633806]">
            {porVencer30}
          </div>
        )}
        {sinAlerta > 0 && (
          <div style={{ width: `${pct(sinAlerta)}%` }} className="bg-[#C0DD97] flex items-center justify-center text-[10px] font-semibold text-[#27500A]">
            {sinAlerta}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          ['#e34948', 'Vencidos', vencidas],
          ['#eda100', 'Por vencer <7d', porVencer7],
          ['#FAC775', 'Por vencer <30d', porVencer30],
          ['#97C459', 'Sin alerta', sinAlerta],
        ].map(([c, l, v]) => (
          <span key={String(l)} className="flex items-center gap-1 text-[11px] text-[#4a6a84]">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: String(c) }} />
            {String(l)} ({String(v)})
          </span>
        ))}
      </div>
    </div>
  )
}

function DonutArea({ porArea }: { porArea: Record<Area, number> }) {
  const dataArea = [
    { name: 'Civil',   value: porArea.CIVIL,   color: COLOR_AREA.CIVIL },
    { name: 'Laboral', value: porArea.LABORAL, color: COLOR_AREA.LABORAL },
    { name: 'Penal',   value: porArea.PENAL,   color: COLOR_AREA.PENAL },
  ]
  return (
    <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white">
      <p className="text-[11px] font-semibold text-[#4a6a84] uppercase tracking-wide mb-3">
        Distribución por área
      </p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={dataArea} cx="50%" cy="50%" innerRadius={42} outerRadius={60} dataKey="value" strokeWidth={2} stroke="#fff">
              {dataArea.map(d => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {dataArea.map(d => (
            <div key={d.name} className="flex items-center gap-2 text-[12px]">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
              <span className="text-[#4a6a84]">{d.name}</span>
              <span className="font-semibold text-[#1b3a57] ml-auto pl-3">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BarLetrados({ porLetrado }: { porLetrado: Record<string, number> }) {
  const dataLetrados = Object.entries(porLetrado)
    .map(([id, count]) => {
      const u = getUsuarioById(id)
      return { name: u ? u.apellido : id, value: count }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return (
    <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white">
      <p className="text-[11px] font-semibold text-[#4a6a84] uppercase tracking-wide mb-3">
        Actuaciones por letrado
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={dataLetrados} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#7a9ab4' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#4a6a84' }} axisLine={false} tickLine={false} width={80} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
          <Bar dataKey="value" fill="#2a78d6" radius={[0, 4, 4, 0]} barSize={14} label={{ position: 'right', fontSize: 11, fill: '#4a6a84' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function HeaderPowerBI() {
  return (
    <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(0,0,0,0.07)]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[rgba(0,0,0,0.08)] text-[11px] text-[#7a9ab4]">
          <div className="w-2 h-2 rounded-full bg-[#F2C811]" />
          Power BI
        </div>
        <span className="text-[13px] font-semibold text-[#1b3a57]">SIAJ Analytics</span>
        <span className="text-[11px] text-[#7a9ab4]">Actualizado hace 3 min</span>
      </div>
      <button className="flex items-center gap-1.5 text-[12px] text-[#4a6a84] border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-1.5 hover:bg-[#f5f5f5] transition-colors">
        <Icon name="download" size={14} />
        Exportar
      </button>
    </div>
  )
}

function VencimientoItem({ exp, alerta }: { exp: Expediente; alerta: ReturnType<typeof getAlertaExpediente> }) {
  const navigate = useNavigate()
  const color = alerta.estado === 'vencido' ? '#e34948' : '#eda100'
  return (
    <div
      onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id))}
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[#f5f5f5] cursor-pointer transition-colors"
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-[#1b3a57] truncate">{exp.caratula}</p>
        <p className="text-[11px] text-[#7a9ab4]">{exp.estadoProcesal ?? exp.estado}</p>
      </div>
      <span className="text-[11px] font-semibold flex-shrink-0" style={{ color }}>
        {alerta.estado === 'vencido' ? 'Vencida' : alerta.fechaVencimiento}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const expedientes = useExpedientesStore(s => s.expedientes)
  const tareasMap = useExpedientesStore(s => s.tareasMap)
  const { usuarioActivo } = useUIStore()

  const esReferente   = usuarioActivo?.rolSistema === 'REFERENTE'
  const esCoordinador = usuarioActivo?.rolSistema === 'COORDINADOR'

  const franjas = useMemo(() =>
    expedientes.reduce((acc, e) => {
      acc[e.id] = clasificarVencimiento(e, tareasMap)
      return acc
    }, {} as Record<string, Franja>),
    [expedientes, tareasMap])

  function contarFranjas(exps: Expediente[]) {
    return exps.reduce((acc, e) => {
      const f = franjas[e.id]
      acc[f] = (acc[f] ?? 0) + 1
      return acc
    }, { vencido: 0, porVencer7: 0, porVencer30: 0, sinAlerta: 0 } as Record<Franja, number>)
  }

  // ── Vista REFERENTE ──────────────────────────────────────
  const globalStats = useMemo(() => {
    const totalActivas = expedientes.filter(estaActiva).length
    const porArea: Record<Area, number> = {
      CIVIL:   expedientes.filter(e => e.area === 'CIVIL').length,
      LABORAL: expedientes.filter(e => e.area === 'LABORAL').length,
      PENAL:   expedientes.filter(e => e.area === 'PENAL').length,
    }
    const porLetrado = expedientes.reduce((acc, e) => {
      if (!e.abogado_id) return acc
      acc[e.abogado_id] = (acc[e.abogado_id] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    const montoTotal = expedientes.reduce((sum, e) => {
      const m = Number(e.campos_mesa?.mesa_monto ?? 0)
      return sum + (isNaN(m) ? 0 : m)
    }, 0)
    return { totalActivas, porArea, porLetrado, montoTotal }
  }, [expedientes])

  const criticas = useMemo(() => {
    const rank = (a: EstadoAlerta) => (a === 'vencido' ? 0 : a === 'por_vencer' ? 1 : 2)
    return [...expedientes]
      .sort((a, b) => {
        const alertaA = getAlertaExpediente(a.id, tareasMap, a.timeline)
        const alertaB = getAlertaExpediente(b.id, tareasMap, b.timeline)
        const ra = rank(alertaA.estado)
        const rb = rank(alertaB.estado)
        if (ra !== rb) return ra - rb
        const ua = a.es_urgente ? 0 : 1
        const ub = b.es_urgente ? 0 : 1
        return ua - ub
      })
      .slice(0, 5)
  }, [expedientes, tareasMap])

  // ── Vista COORDINADOR ────────────────────────────────────
  const areaCoord = usuarioActivo?.areas?.[0]
  const expArea = useMemo(() =>
    areaCoord ? expedientes.filter(e => e.area === areaCoord) : [],
    [expedientes, areaCoord])

  const statsArea = useMemo(() => {
    const total = expArea.length
    const activos = expArea.filter(estaActiva).length
    const franjasArea = contarFranjas(expArea)
    const porLetradoArea = expArea.reduce((acc, e) => {
      if (!e.abogado_id) return acc
      acc[e.abogado_id] = (acc[e.abogado_id] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    return { total, activos, franjasArea, porLetradoArea }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expArea, franjas])

  const sinMovimiento = useMemo(() =>
    expArea.filter(e => {
      if (e.fecha_ultimo_impulsorio) return diasHasta(e.fecha_ultimo_impulsorio) < -30
      return diasHasta(e.fecha_recepcion) < -30
    }),
    [expArea])

  const dataEstadosArea = useMemo(() => {
    const estadosDist = expArea.reduce((acc, e) => {
      const s = e.estadoProcesal ?? e.estado ?? 'Sin estado'
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(estadosDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [expArea])

  // ── Vista LETRADO ────────────────────────────────────────
  const misExpedientes = useMemo(() =>
    expedientes.filter(e => e.abogado_id === usuarioActivo?.id),
    [expedientes, usuarioActivo])

  const statsPersonales = useMemo(() => {
    const total = misExpedientes.length
    const activos = misExpedientes.filter(estaActiva).length
    const franjasMias = contarFranjas(misExpedientes)
    return { total, activos, franjasMias }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [misExpedientes, franjas])

  const vencimientosLetrado = useMemo(() =>
    misExpedientes
      .map(e => ({ exp: e, alerta: getAlertaExpediente(e.id, tareasMap, e.timeline) }))
      .filter(v => v.alerta.estado !== 'ninguna')
      .sort((a, b) => {
        if (a.alerta.estado === 'vencido' && b.alerta.estado !== 'vencido') return -1
        if (b.alerta.estado === 'vencido' && a.alerta.estado !== 'vencido') return 1
        return (a.alerta.fechaVencimiento ?? '').localeCompare(b.alerta.fechaVencimiento ?? '')
      }),
    [misExpedientes, tareasMap])

  const dataEstadosLetrado = useMemo(() =>
    misExpedientes.reduce((acc, e) => {
      const s = e.estadoProcesal ?? e.estado ?? 'Sin estado'
      const found = acc.find(x => x.name === s)
      if (found) found.value++
      else acc.push({ name: s, value: 1 })
      return acc
    }, [] as { name: string; value: number }[])
      .sort((a, b) => b.value - a.value),
    [misExpedientes])

  const tareasHoy = useMemo(() =>
    misExpedientes.flatMap(e => {
      const claves = Object.keys(tareasMap).filter(k => k.startsWith(`${e.id}__`))
      return claves.flatMap(k =>
        (tareasMap[k] ?? [])
          .filter(t => t.fechaVencimiento === HOY || t.fecha_aviso === HOY)
          .map(t => ({ tarea: t, caratula: e.caratula ?? e.id }))
      )
    }),
    [misExpedientes, tareasMap])

  return (
    <div className="p-6 max-w-screen-xl">
      <HeaderPowerBI />

      <div className="mb-4">
        <p className="text-[#4a6a84] text-sm">
          Bienvenido/a,{' '}
          <span className="font-semibold text-[#1b3a57]">
            {usuarioActivo?.nombre} {usuarioActivo?.apellido}
          </span>
        </p>
      </div>

      {esReferente && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Actuaciones activas" value={globalStats.totalActivas} sub={`${expedientes.length} totales`} />
            <KpiCard label="Civil" value={globalStats.porArea.CIVIL} badge="CIVIL" badgeColor="blue" />
            <KpiCard label="Laboral" value={globalStats.porArea.LABORAL} badge="LABORAL" badgeColor="green" />
            <KpiCard
              label="Monto expuesto"
              value={`$${(globalStats.montoTotal / 1000000).toFixed(1)}M`}
              sub="Demandas activas"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DonutArea porArea={globalStats.porArea} />
            <BarLetrados porLetrado={globalStats.porLetrado} />
          </div>
          <Semaforo
            vencidas={expedientes.filter(e => franjas[e.id] === 'vencido').length}
            porVencer7={expedientes.filter(e => franjas[e.id] === 'porVencer7').length}
            porVencer30={expedientes.filter(e => franjas[e.id] === 'porVencer30').length}
            sinAlerta={expedientes.filter(e => franjas[e.id] === 'sinAlerta').length}
          />
          <div className="bg-white rounded-2xl shadow-card">
            <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.12)]">
              <h2 className="font-headline font-semibold text-[#1b3a57]">Próximos vencimientos</h2>
              <p className="text-[11px] text-[#7a9ab4] mt-0.5">
                Actuaciones con alerta activa — vencidas primero, luego por vencer
              </p>
            </div>
            <TablaExpedientes expedientes={criticas} />
          </div>
        </div>
      )}

      {esCoordinador && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label={`Actuaciones — ${areaCoord ?? ''}`} value={statsArea.total} sub={`${statsArea.activos} activas`} />
            <KpiCard label="Vencidas" value={statsArea.franjasArea.vencido} badgeColor="red" badge={statsArea.franjasArea.vencido > 0 ? 'Atención' : undefined} />
            <KpiCard label="Por vencer <7d" value={statsArea.franjasArea.porVencer7} badgeColor="amber" />
            <KpiCard label="Sin alerta" value={statsArea.franjasArea.sinAlerta} badgeColor="green" />
          </div>
          <BarLetrados porLetrado={statsArea.porLetradoArea} />
          <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white mb-4">
            <p className="text-[11px] font-semibold text-[#4a6a84] uppercase tracking-wide mb-1">
              Estado procesal del área
            </p>
            <p className="text-[11px] text-[#7a9ab4] mb-3">
              Distribución de sub-estados — {areaCoord}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dataEstadosArea} margin={{ left: 8, right: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#7a9ab4' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fontSize: 11, fill: '#7a9ab4' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#2a78d6" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Semaforo
            vencidas={statsArea.franjasArea.vencido}
            porVencer7={statsArea.franjasArea.porVencer7}
            porVencer30={statsArea.franjasArea.porVencer30}
            sinAlerta={statsArea.franjasArea.sinAlerta}
          />
          <div className="bg-white rounded-2xl shadow-card">
            <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.12)]">
              <h2 className="font-headline font-semibold text-[#1b3a57]">Actuaciones sin movimiento (+30 días)</h2>
            </div>
            <TablaExpedientes expedientes={sinMovimiento} />
          </div>
        </div>
      )}

      {!esReferente && !esCoordinador && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Mis actuaciones" value={statsPersonales.total} sub={`${statsPersonales.activos} activas`} />
            <KpiCard label="Vencidas" value={statsPersonales.franjasMias.vencido} badgeColor="red" badge={statsPersonales.franjasMias.vencido > 0 ? 'Atención' : undefined} />
            <KpiCard label="Por vencer <7d" value={statsPersonales.franjasMias.porVencer7} badgeColor="amber" />
            <KpiCard label="Sin alerta" value={statsPersonales.franjasMias.sinAlerta} badgeColor="green" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white">
              <p className="text-[11px] font-semibold text-[#4a6a84] uppercase tracking-wide mb-3">
                Mis actuaciones por sub-estado
              </p>
              <div className="flex items-center gap-3">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={dataEstadosLetrado} cx="50%" cy="50%" innerRadius={35} outerRadius={52} dataKey="value" strokeWidth={2} stroke="#fff">
                      {dataEstadosLetrado.map((_, i) => (
                        <Cell key={i} fill={COLORES_ESTADOS[i % COLORES_ESTADOS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1 min-w-0">
                  {dataEstadosLetrado.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORES_ESTADOS[i % COLORES_ESTADOS.length] }} />
                      <span className="text-[#4a6a84] truncate flex-1">{d.name}</span>
                      <span className="font-semibold text-[#1b3a57] flex-shrink-0">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white">
              <p className="text-[11px] font-semibold text-[#4a6a84] uppercase tracking-wide mb-1">
                Tareas hoy
              </p>
              <p className="text-[11px] text-[#7a9ab4] mb-3">Vencen o tienen aviso activo hoy</p>
              {tareasHoy.length === 0 ? (
                <p className="text-[12px] text-[#7a9ab4] italic">Sin tareas para hoy 🎉</p>
              ) : (
                <div className="space-y-2">
                  {tareasHoy.slice(0, 4).map((t, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[#faeeda]">
                      <Icon name="warning" size={13} className="text-[#854f0b] flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[#854f0b] truncate">{t.tarea.nombre}</p>
                        <p className="text-[10px] text-[#ba7517] truncate">{t.caratula}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-4">
            <p className="text-[11px] font-semibold text-[#4a6a84] uppercase tracking-wide mb-2 px-2">
              Vencimientos próximos
            </p>
            {vencimientosLetrado.length === 0 ? (
              <p className="text-sm text-[#7a9ab4] py-6 text-center">Sin vencimientos activos.</p>
            ) : (
              <div className="divide-y divide-[rgba(0,0,0,0.05)]">
                {vencimientosLetrado.map(v => (
                  <VencimientoItem key={v.exp.id} exp={v.exp} alerta={v.alerta} />
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-card">
            <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.12)]">
              <h2 className="font-headline font-semibold text-[#1b3a57]">Mis actuaciones</h2>
            </div>
            <TablaExpedientes expedientes={misExpedientes} />
          </div>
        </div>
      )}
    </div>
  )
}
