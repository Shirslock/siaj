import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { useNavigate, Navigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { getUsuarioById } from '../../data/usuarios'
import { RUTAS } from '../../utils/routing'
import { normalizarMoneda } from '../../utils/format'
import type { Expediente, Area } from '../../types'
import Icon from '../../components/ui/Icon'

const COLOR_AREA: Record<Area, string> = {
  CIVIL:   '#2a78d6',
  LABORAL: '#1baf7a',
  PENAL:   '#7F77DD',
}

interface Panel {
  titulo: string
  expedientes: Expediente[]
  color?: string
}

type SetPanel = (panel: Panel) => void

// ── Widget genérico ─────────────────────────────────────────

function WidgetCard({
  titulo, sub, children, onClick, highlight,
}: {
  titulo?: string
  sub?: string
  children: React.ReactNode
  onClick?: () => void
  highlight?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border bg-white transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#1b3a57]' : ''
      } ${
        highlight ? 'border-[#1b3a57] ring-2 ring-[#1b3a57] ring-offset-1' : 'border-[rgba(0,0,0,0.07)]'
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
  label, value, sub, badgeColor, onClick,
}: {
  label: string
  value: string | number
  sub?: string
  badgeColor?: 'red' | 'amber' | 'blue' | 'gris'
  onClick?: () => void
}) {
  const barColors = {
    red:  '#e34948',
    amber: '#eda100',
    blue: '#2a78d6',
    gris: '#8aa0b3',
  }
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white border-l-4 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-[#1b3a57] hover:ring-offset-1' : ''
      }`}
      style={{ borderLeftColor: badgeColor ? barColors[badgeColor] : '#e0e6ec' }}
    >
      <p className="text-[11px] text-[#7a9ab4] uppercase tracking-wide mb-1.5">{label}</p>
      <p className="text-[24px] font-semibold text-[#1b3a57] leading-none mb-1">{value}</p>
      {sub && <p className="text-[11px] text-[#7a9ab4]">{sub}</p>}
    </div>
  )
}

// ── PANEL DERECHO ────────────────────────────────────────────

function PanelDetalle({ panel, onCerrar }: { panel: Panel | null; onCerrar: () => void }) {
  const navigate = useNavigate()

  if (!panel) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#7a9ab4]">
        <Icon name="timeline" size={40} className="mb-3 opacity-40" />
        <p className="text-sm font-medium mb-1">Sin selección</p>
        <p className="text-[12px]">
          Hacé click en un indicador para ver el listado de actuaciones
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.07)] flex-shrink-0">
        <div>
          <p className="text-[12px] font-semibold text-[#1b3a57]">{panel.titulo}</p>
          <p className="text-[11px] text-[#7a9ab4]">{panel.expedientes.length} actuaciones</p>
        </div>
        <button
          onClick={onCerrar}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0] transition-colors"
        >
          <Icon name="close" size={16} className="text-[#4a6a84]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[rgba(0,0,0,0.05)]">
        {panel.expedientes.length === 0 ? (
          <p className="text-[12px] text-[#7a9ab4] text-center py-8">
            Sin actuaciones en este indicador.
          </p>
        ) : (
          panel.expedientes.map(exp => (
            <div
              key={exp.id}
              onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id))}
              className="px-4 py-3 hover:bg-[#f5f5f5] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    exp.area === 'CIVIL'
                      ? 'bg-[#e6f1fb] text-[#185fa5]'
                      : exp.area === 'LABORAL'
                      ? 'bg-[#e1f5ee] text-[#0f6e56]'
                      : 'bg-[#eeedfe] text-[#534ab7]'
                  }`}
                >
                  {exp.area}
                </span>
                <span className="text-[11px] text-[#7a9ab4]">{exp.id}</span>
              </div>
              <p className="text-[12px] text-[#1b3a57] font-medium line-clamp-2 mb-0.5">
                {exp.caratula}
              </p>
              <p className="text-[11px] text-[#7a9ab4]">
                {exp.estadoProcesal ?? exp.estado}
                {exp.abogado_id && (() => {
                  const u = getUsuarioById(exp.abogado_id)
                  return u ? ` · ${u.apellido}` : ''
                })()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── PANEL GERENCIA ───────────────────────────────────────────

const DATA_INGRESADAS_CERRADAS = [
  { mes: 'Ene', ingresadas: 12, cerradas: 8 },
  { mes: 'Feb', ingresadas: 9,  cerradas: 11 },
  { mes: 'Mar', ingresadas: 15, cerradas: 7 },
  { mes: 'Abr', ingresadas: 11, cerradas: 9 },
  { mes: 'May', ingresadas: 14, cerradas: 10 },
  { mes: 'Jun', ingresadas: 8,  cerradas: 6 },
]

const FUNNEL_ESTADOS = [
  { label: 'Asignado',       value: 87, color: '#2a78d6' },
  { label: 'En análisis',    value: 62, color: '#1baf7a' },
  { label: 'Traba de litis', value: 41, color: '#7F77DD' },
  { label: 'Prueba',         value: 28, color: '#eda100' },
  { label: 'Sentencia',      value: 14, color: '#e34948' },
  { label: 'Cerrado',        value: 9,  color: '#888780' },
]

function FunnelChart({ onSelect }: { onSelect?: (label: string) => void }) {
  const data = FUNNEL_ESTADOS
  const maxVal = data[0].value
  const svgW = 720
  const svgH = 220
  const maxH = 160
  const minH = 32
  const blockW = 68
  const connW = 28
  const step = blockW + connW
  const totalW = data.length * blockW + (data.length - 1) * connW
  const startX = (svgW - totalW) / 2
  const midY = svgH / 2

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const h = minH + (d.value / maxVal) * (maxH - minH)
        const x = startX + i * step
        const y = midY - h / 2

        let connEl = null
        if (i < data.length - 1) {
          const nextH = minH + (data[i + 1].value / maxVal) * (maxH - minH)
          const x1 = x + blockW
          const x2 = x1 + connW
          const y1top = midY - h / 2
          const y1bot = midY + h / 2
          const y2top = midY - nextH / 2
          const y2bot = midY + nextH / 2

          connEl = (
            <polygon
              key={`conn-${i}`}
              points={`${x1},${y1top} ${x2},${y2top} ${x2},${y2bot} ${x1},${y1bot}`}
              fill={d.color}
              opacity={0.35}
            />
          )
        }

        return (
          <g key={i} onClick={() => onSelect?.(d.label)} cursor={onSelect ? 'pointer' : 'default'}>
            <rect x={x} y={y} width={blockW} height={h} rx={3} fill={d.color} />
            {connEl}
            <text
              x={x + blockW / 2}
              y={midY - maxH / 2 - 20}
              textAnchor="middle"
              fontSize={10}
              fill="#4a6a84"
              fontFamily="system-ui,sans-serif"
            >
              {d.label}
            </text>
            <text
              x={x + blockW / 2}
              y={midY + maxH / 2 + 18}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fill={d.color}
              fontFamily="system-ui,sans-serif"
            >
              {d.value}
            </text>
            <text
              x={x + blockW / 2}
              y={midY + maxH / 2 + 30}
              textAnchor="middle"
              fontSize={9}
              fill="#7a9ab4"
              fontFamily="system-ui,sans-serif"
            >
              causas
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const DATA_STACKED_AREA = [
  { area: 'Civil',   'En análisis': 8,  'Traba de litis': 6, 'Prueba': 4, 'Sentencia': 2 },
  { area: 'Laboral', 'En análisis': 5,  'Traba de litis': 4, 'Prueba': 3, 'Sentencia': 1 },
  { area: 'Penal',   'En análisis': 6,  'Traba de litis': 2, 'Prueba': 2, 'Sentencia': 1 },
]
const SUBESTADOS_KEYS = ['En análisis', 'Traba de litis', 'Prueba', 'Sentencia']
const COLORES_SUBESTADO = ['#85B7EB', '#2a78d6', '#144d7d', '#0b3d66']

const DATA_COMPLEJIDAD = [
  { letrado: 'CASANO',     urgentes: 1, total: 7 },
  { letrado: 'DANTIOCHIA', urgentes: 2, total: 8 },
  { letrado: 'RIOS',       urgentes: 1, total: 6 },
  { letrado: 'MÉNDEZ',     urgentes: 0, total: 3 },
]

const DATA_LUGARES = [
  { lugar: 'Línea Roca km23',  civil: 0, laboral: 1, penal: 3 },
  { lugar: 'Est. Palermo',     civil: 1, laboral: 0, penal: 2 },
  { lugar: 'Est. Once',        civil: 1, laboral: 1, penal: 0 },
  { lugar: 'Línea Mitre km11', civil: 0, laboral: 0, penal: 2 },
  { lugar: 'Est. Quilmes',     civil: 1, laboral: 0, penal: 0 },
  { lugar: 'Otros',            civil: 3, laboral: 1, penal: 1 },
]

const MESES_24 = [
  'Jul-24', 'Ago-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dic-24',
  'Ene-25', 'Feb-25', 'Mar-25', 'Abr-25', 'May-25', 'Jun-25',
  'Jul-25', 'Ago-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dic-25',
  'Ene-26', 'Feb-26', 'Mar-26', 'Abr-26', 'May-26', 'Jun-26',
]
const DATA_ESTACIONALIDAD = MESES_24.map((mes, i) => {
  const esVerano = mes.startsWith('Dic') || mes.startsWith('Ene')
  const esInvierno = mes.startsWith('Jul') || mes.startsWith('Ago')
  const base = esVerano ? 18 : esInvierno ? 15 : 8
  return {
    mes,
    Civil:   base + (i % 3),
    Laboral: Math.round(base * 0.7) + (i % 2),
    Penal:   Math.round(base * 0.5) + (i % 4),
  }
})

const DATA_ORGANISMOS = [
  { name: 'Gerencia Operaciones',      value: 18 },
  { name: 'Gerencia Infraestructura',  value: 14 },
  { name: 'RRHH',                      value: 11 },
  { name: 'Gerencia Comercial',        value: 9 },
  { name: 'Seguridad Interna',         value: 7 },
  { name: 'Administración',           value: 6 },
  { name: 'Legal Externo',             value: 4 },
  { name: 'Otros',                     value: 3 },
]

const DATA_JUZGADOS = [
  { juzgado: 'Juzgado Civil 54',     ganadas: 3, perdidas: 1 },
  { juzgado: 'Juzgado Trabajo 8',    ganadas: 2, perdidas: 2 },
  { juzgado: 'JCC Federal 3',        ganadas: 1, perdidas: 1 },
  { juzgado: 'TOC Federal SM2',      ganadas: 2, perdidas: 0 },
  { juzgado: 'Juzgado Civil 23',     ganadas: 1, perdidas: 2 },
]

function GaugeUrgencia({ urgentes, total }: { urgentes: number; total: number }) {
  const pct = total > 0 ? (urgentes / total) * 100 : 0
  const color = pct > 10 ? '#e34948' : pct > 5 ? '#eda100' : '#3b6d11'
  const data = [
    { name: 'urgentes', value: pct },
    { name: 'resto', value: 100 - pct },
  ]
  return (
    <WidgetCard titulo="Índice de urgencia">
      <div className="flex flex-col items-center">
        <ResponsiveContainer width={200} height={110}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="100%"
              startAngle={180} endAngle={0}
              innerRadius={55} outerRadius={80}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill="#eceff2" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p className="text-[22px] font-semibold -mt-6" style={{ color }}>{pct.toFixed(1)}%</p>
        <p className="text-[11px] text-[#7a9ab4]">{urgentes} urgentes sobre {total} activas</p>
      </div>
    </WidgetCard>
  )
}

function TablaComplejidad({ setPanelActivo, expedientes }: { setPanelActivo: SetPanel; expedientes: Expediente[] }) {
  return (
    <WidgetCard titulo="Complejidad por letrado">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-[10px] text-[#7a9ab4] uppercase">
            <th className="text-left pb-2">Letrado</th>
            <th className="text-right pb-2">Urgentes</th>
            <th className="text-right pb-2">Total</th>
            <th className="text-right pb-2">%</th>
          </tr>
        </thead>
        <tbody>
          {DATA_COMPLEJIDAD.map(row => {
            const pct = row.total > 0 ? Math.round((row.urgentes / row.total) * 100) : 0
            const color = pct >= 20 ? 'bg-[#fcebeb] text-[#a32d2d]' : pct >= 10 ? 'bg-[#faeeda] text-[#854f0b]' : 'bg-[#eaf3de] text-[#3b6d11]'
            return (
              <tr
                key={row.letrado}
                onClick={() => setPanelActivo({ titulo: `Complejidad — ${row.letrado}`, expedientes })}
                className="cursor-pointer hover:bg-[#f5f5f5] transition-colors"
              >
                <td className="py-1.5 text-[#1b3a57] font-medium">{row.letrado}</td>
                <td className="py-1.5 text-right text-[#4a6a84]">{row.urgentes}</td>
                <td className="py-1.5 text-right text-[#4a6a84]">{row.total}</td>
                <td className="py-1.5 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${color}`}>{pct}%</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </WidgetCard>
  )
}

function HeatMapLugares({ setPanelActivo, expedientes }: { setPanelActivo: SetPanel; expedientes: Expediente[] }) {
  const max = Math.max(...DATA_LUGARES.map(l => l.civil + l.laboral + l.penal))
  const bg = (v: number) => {
    if (v === 0) return 'bg-transparent'
    const intensidad = Math.min(1, v / max)
    if (intensidad > 0.66) return 'bg-[#2a78d6] text-white'
    if (intensidad > 0.33) return 'bg-[#85B7EB]'
    return 'bg-[#e6f1fb]'
  }
  return (
    <WidgetCard titulo="Top lugares de hechos">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-[10px] text-[#7a9ab4] uppercase">
            <th className="text-left pb-2">Estación / Km</th>
            <th className="text-center pb-2">Civil</th>
            <th className="text-center pb-2">Laboral</th>
            <th className="text-center pb-2">Penal</th>
            <th className="text-right pb-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {DATA_LUGARES.map(row => {
            const total = row.civil + row.laboral + row.penal
            return (
              <tr
                key={row.lugar}
                onClick={() => setPanelActivo({ titulo: `Lugar de hechos — ${row.lugar}`, expedientes })}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <td className="py-1.5 text-[#1b3a57]">{row.lugar}</td>
                <td className={`text-center py-1.5 rounded ${bg(row.civil)}`}>{row.civil}</td>
                <td className={`text-center py-1.5 rounded ${bg(row.laboral)}`}>{row.laboral}</td>
                <td className={`text-center py-1.5 rounded ${bg(row.penal)}`}>{row.penal}</td>
                <td className="text-right py-1.5 font-semibold text-[#1b3a57]">{total}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </WidgetCard>
  )
}

function PanelGerencia({
  expedientes, setPanelActivo,
}: {
  expedientes: Expediente[]
  setPanelActivo: SetPanel
}) {
  const huerfanas = useMemo(() => expedientes.filter(e => !e.abogado_id), [expedientes])
  const urgentes = useMemo(() => expedientes.filter(e => e.es_urgente), [expedientes])
  const urgentesPorArea = (area: Area) => urgentes.filter(e => e.area === area)
  const expPorArea = (area: Area) => expedientes.filter(e => e.area === area)

  // Solo se suman los montos en pesos: los de otras monedas no son comparables y no se
  // convierten. Sin moneda guardada se asume ARS, así que los expedientes viejos entran.
  const montoTotal = useMemo(() => expedientes.reduce((sum, e) => {
    if (normalizarMoneda(e.campos_mesa?.mesa_monto_moneda) !== 'ARS') return sum
    const m = Number(e.campos_mesa?.mesa_monto ?? 0)
    return sum + (isNaN(m) ? 0 : m)
  }, 0), [expedientes])

  return (
    <div className="space-y-4">
      {/* Fila 1: KPIs principales */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Causas activas" value={87} badgeColor="blue"
          onClick={() => setPanelActivo({ titulo: 'Causas activas', expedientes })}
        />
        <KpiCard
          label="Causas urgentes" value={5} badgeColor="red"
          onClick={() => setPanelActivo({ titulo: 'Causas urgentes', expedientes: urgentes })}
        />
        <KpiCard
          label="Huérfanas sin asignar" value={3} badgeColor="amber"
          onClick={() => setPanelActivo({ titulo: 'Huérfanas sin asignar', expedientes: huerfanas })}
        />
        <KpiCard
          label="Sin impulsorio +60d" value={8} badgeColor="amber"
          onClick={() => setPanelActivo({ titulo: 'Sin impulsorio +60d', expedientes })}
        />
        <KpiCard
          label="Causas vinculadas" value={14} badgeColor="gris"
          onClick={() => setPanelActivo({ titulo: 'Causas vinculadas', expedientes: expedientes.filter(e => e.vinculos.length > 0) })}
        />
        <KpiCard
          label="Monto expuesto (ARS)" value={`$${(montoTotal / 1000000).toFixed(1)}M`} badgeColor="gris"
          onClick={() => setPanelActivo({ titulo: 'Monto expuesto (ARS)', expedientes })}
        />
      </div>

      {/* Fila 2: urgentes y sin movimiento por área */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Civil urgentes" value={2} badgeColor="red" onClick={() => setPanelActivo({ titulo: 'Civil urgentes', expedientes: urgentesPorArea('CIVIL') })} />
        <KpiCard label="Laboral urgentes" value={2} badgeColor="red" onClick={() => setPanelActivo({ titulo: 'Laboral urgentes', expedientes: urgentesPorArea('LABORAL') })} />
        <KpiCard label="Penal urgentes" value={1} badgeColor="red" onClick={() => setPanelActivo({ titulo: 'Penal urgentes', expedientes: urgentesPorArea('PENAL') })} />
        <KpiCard label="Civil sin impulsorio +60d" value={4} badgeColor="amber" onClick={() => setPanelActivo({ titulo: 'Civil sin impulsorio +60d', expedientes: expPorArea('CIVIL') })} />
        <KpiCard label="Laboral sin impulsorio +60d" value={2} badgeColor="amber" onClick={() => setPanelActivo({ titulo: 'Laboral sin impulsorio +60d', expedientes: expPorArea('LABORAL') })} />
        <KpiCard label="Penal sin impulsorio +60d" value={2} badgeColor="amber" onClick={() => setPanelActivo({ titulo: 'Penal sin impulsorio +60d', expedientes: expPorArea('PENAL') })} />
      </div>

      {/* Fila 3: ingresadas vs cerradas */}
      <WidgetCard titulo="Ingresadas vs. cerradas" sub="Últimos 6 meses">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={DATA_INGRESADAS_CERRADAS} margin={{ left: 0, right: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#7a9ab4' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#7a9ab4' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="ingresadas" name="Ingresadas" fill="#2a78d6" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="cerradas" name="Cerradas" fill="#97C459" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </WidgetCard>

      {/* Fila 4: funnel de estados */}
      <WidgetCard
        titulo="Funnel de estados"
        sub="Causas por etapa procesal — Civil + Laboral"
        onClick={() => setPanelActivo({ titulo: 'Todas las causas activas', expedientes })}
      >
        <FunnelChart
          onSelect={(label) => setPanelActivo({ titulo: `Funnel — ${label}`, expedientes })}
        />
      </WidgetCard>

      {/* Fila 5: distribución por sub-estado y área */}
      <WidgetCard titulo="Distribución por sub-estado y área">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={DATA_STACKED_AREA}
            margin={{ left: 0, right: 10, bottom: 0 }}
            onClick={(state) => {
              const label = state?.activeLabel
              setPanelActivo({
                titulo: label ? `Distribución — ${label}` : 'Distribución por área',
                expedientes: expedientes.filter(e => e.area === String(label ?? '').toUpperCase()),
              })
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="area" tick={{ fontSize: 11, fill: '#7a9ab4' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#7a9ab4' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {SUBESTADOS_KEYS.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={COLORES_SUBESTADO[i]} cursor="pointer" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </WidgetCard>

      {/* Fila 6: índice de urgencia + complejidad */}
      <div className="grid grid-cols-2 gap-4">
        <GaugeUrgencia urgentes={5} total={87} />
        <TablaComplejidad setPanelActivo={setPanelActivo} expedientes={expedientes} />
      </div>

      {/* Fila 7: top lugares de hechos */}
      <HeatMapLugares setPanelActivo={setPanelActivo} expedientes={expedientes} />

      {/* Fila 8: estacionalidad */}
      <WidgetCard titulo="Estacionalidad" sub="Causas iniciadas por mes — últimos 24 meses">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={DATA_ESTACIONALIDAD} margin={{ left: 0, right: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#7a9ab4' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 11, fill: '#7a9ab4' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Civil" stroke={COLOR_AREA.CIVIL} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Laboral" stroke={COLOR_AREA.LABORAL} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Penal" stroke={COLOR_AREA.PENAL} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </WidgetCard>

      {/* Fila 9: organismos requirentes */}
      <WidgetCard titulo="Concentración por organismo requirente" sub="Top 8">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={DATA_ORGANISMOS}
            layout="vertical"
            margin={{ left: 10, right: 20 }}
            onClick={(state) => {
              const label = state?.activeLabel
              setPanelActivo({ titulo: label ? `Organismo — ${label}` : 'Organismos requirentes', expedientes })
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#7a9ab4' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#4a6a84' }} axisLine={false} tickLine={false} width={140} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
            <Bar dataKey="value" fill="#2a78d6" radius={[0, 4, 4, 0]} barSize={14} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      </WidgetCard>

      {/* Fila 10: ganadas/perdidas por juzgado */}
      <WidgetCard titulo="Causas ganadas/perdidas por juzgado">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={DATA_JUZGADOS}
            layout="vertical"
            margin={{ left: 10, right: 20 }}
            onClick={(state) => {
              const label = state?.activeLabel
              setPanelActivo({ titulo: label ? `Juzgado — ${label}` : 'Ganadas/perdidas por juzgado', expedientes })
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#7a9ab4' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="juzgado" tick={{ fontSize: 10, fill: '#4a6a84' }} axisLine={false} tickLine={false} width={130} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="ganadas" name="Ganadas" fill="#97C459" radius={[0, 4, 4, 0]} barSize={12} cursor="pointer" />
            <Bar dataKey="perdidas" name="Perdidas" fill="#e34948" radius={[0, 4, 4, 0]} barSize={12} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      </WidgetCard>
    </div>
  )
}

// ── HEADER ────────────────────────────────────────────────────

function HeaderPowerBI() {
  return (
    <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(0,0,0,0.07)]">
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

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────

export default function DashboardPage() {
  const expedientes = useExpedientesStore(s => s.expedientes)
  const { usuarioActivo } = useUIStore()
  const [panelActivo, setPanelActivo] = useState<Panel | null>(null)

  const esReferente   = usuarioActivo?.rolSistema === 'REFERENTE'
  const esCoordinador = usuarioActivo?.rolSistema === 'COORDINADOR'

  // Dashboard (Panel Gerencial) quedó exclusivo de REFERENTE/COORDINADOR — el rol
  // ABOGADO tiene su propio Home (ver src/pages/Home/Home.page.tsx).
  if (!esReferente && !esCoordinador) {
    return <Navigate to={RUTAS.HOME} replace />
  }

  return (
    <div className="flex flex-col h-full p-6">
      <HeaderPowerBI />

      <p className="text-[#4a6a84] text-sm mb-4">
        Bienvenido/a,{' '}
        <span className="font-semibold text-[#1b3a57]">
          {usuarioActivo?.nombre} {usuarioActivo?.apellido}
        </span>
      </p>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <PanelGerencia expedientes={expedientes} setPanelActivo={setPanelActivo} />
        </div>

        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-[rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
          <PanelDetalle panel={panelActivo} onCerrar={() => setPanelActivo(null)} />
        </div>
      </div>
    </div>
  )
}
