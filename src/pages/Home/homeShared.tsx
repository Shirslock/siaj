import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { TIPO_LABEL } from '../BandejaAbogado/BandejaAbogado.page'
import { RUTAS } from '../../utils/routing'
import { formatFecha } from '../../utils/format'
import { getAlertaExpediente, getAlertaTimer } from '../../utils/alertas'
import Icon from '../../components/ui/Icon'
import type { Expediente, Tarea } from '../../types'

// Lógica/cálculos y componentes de la pantalla Principal (ver Home.page.tsx).

// 'ARCHIVO' es el código de estado terminal real del ciclo Penal (etapasPenales.ts) —
// distinto de 'ARCHIVADO'/'ARCHIVADA' que usan los demás tipos (mismo criterio que BandejaAbogado).
export const ESTADOS_CERRADO = ['ARCHIVADO', 'ARCHIVADA', 'ARCHIVO', 'CERRADO', 'CUMPLIDO', 'COMPLETADA']

// ── Card base de widget ─────────────────────────────────────────────────────────

export function WidgetCard({
  titulo, sub, children,
}: {
  titulo?: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="p-5 rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white">
      {titulo && (
        <h2 className="font-headline text-[17px] font-bold text-[#1b3a57] leading-tight">{titulo}</h2>
      )}
      {sub && <p className="text-[12px] text-[#7a9ab4] mt-0.5 mb-4">{sub}</p>}
      {children}
    </div>
  )
}

// ── KPI de la fila superior ─────────────────────────────────────────────────────

// Clases literales (Tailwind no resuelve clases armadas dinámicamente).
const TONOS_KPI = {
  azul: { caja: 'bg-[#dbeafe]', icono: 'text-[#2a78d6]' },
  teal: { caja: 'bg-[#d3efe8]', icono: 'text-[#129a86]' },
  rojo: { caja: 'bg-[#fde4e4]', icono: 'text-[#e34948]' },
} as const

export function KpiCard({
  icono, label, valor, tono, onClick,
}: {
  icono: string
  label: string
  valor: number
  tono: keyof typeof TONOS_KPI
  onClick?: () => void
}) {
  const t = TONOS_KPI[tono]
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#1b3a57]' : ''
      }`}
    >
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${t.caja}`}>
        <Icon name={icono} size={22} className={t.icono} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] text-[#4a6a84] truncate">{label}</p>
        <p className="text-[28px] font-bold text-[#1b3a57] leading-tight">{valor}</p>
      </div>
    </div>
  )
}

// ── Barras de distribución (reemplazan a los donuts) ────────────────────────────

export interface FilaBarra {
  label: string
  valor: number
  color: string
  onClick?: () => void
}

export function BarrasDistribucion({ filas }: { filas: FilaBarra[] }) {
  // Proporcional al mayor valor de la serie: la barra más larga llena la pista.
  const max = Math.max(...filas.map(f => f.valor), 1)

  return (
    <div className="space-y-3">
      {filas.map(f => (
        <div
          key={f.label}
          onClick={f.onClick}
          className={`flex items-center gap-3 ${f.onClick ? 'cursor-pointer group' : ''}`}
        >
          <span className="text-[13px] text-[#1b3a57] flex-1 min-w-0 truncate group-hover:underline">
            {f.label}
          </span>
          <span className="text-[13px] font-bold text-[#1b3a57] w-6 text-right flex-shrink-0">
            {f.valor}
          </span>
          <span className="h-2 w-[46%] rounded-full bg-[#dfe9f2] flex-shrink-0 overflow-hidden">
            <span
              className="block h-full rounded-full transition-all"
              style={{
                width: f.valor > 0 ? `${Math.max((f.valor / max) * 100, 6)}%` : '5px',
                background: f.valor > 0 ? f.color : '#b9cddd',
              }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Bloque "Actuaciones cerradas" ───────────────────────────────────────────────

export function WidgetCerradas({ valor, onClick }: { valor: number; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#1b3a57]' : ''
      }`}
    >
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#4a6a84]">Actuaciones cerradas</p>
        <p className="text-[11.5px] text-[#7a9ab4] mt-0.5">Total de actuaciones finalizadas.</p>
      </div>
      <span className="text-[26px] font-bold text-[#1b3a57] leading-none flex-shrink-0">{valor}</span>
    </div>
  )
}

// ── Vencimientos y tareas ───────────────────────────────────────────────────────

export interface ItemVencimiento {
  exp: Expediente
  estado: 'vencido' | 'por_vencer'
  fecha?: string
  nombre?: string
}

export function construirVencimientos(
  expedientes: Expediente[],
  tareasMap: Record<string, Tarea[]>,
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
  // Vencido primero, y dentro de cada grupo el más antiguo primero.
  return items.sort((a, b) => {
    if (a.estado !== b.estado) return a.estado === 'vencido' ? -1 : 1
    return (a.fecha ?? '').localeCompare(b.fecha ?? '')
  })
}

const TABS_VENC = [
  { id: 'todas',      label: 'Todas' },
  { id: 'vencidas',   label: 'Vencidas' },
  { id: 'por_vencer', label: 'Por vencer' },
] as const

type TabVenc = typeof TABS_VENC[number]['id']

function FilaVencimiento({ item }: { item: ItemVencimiento }) {
  const navigate = useNavigate()
  const { exp, estado, fecha, nombre } = item
  const esVencido = estado === 'vencido'

  return (
    <div
      onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id))}
      className="grid grid-cols-[minmax(0,1fr)_130px_112px] items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#f7fafc] transition-colors"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#1b3a57] truncate">{exp.caratula}</p>
        <p className="text-[11.5px] text-[#7a9ab4] mt-0.5 truncate">
          {exp.id}{nombre ? ` · ${nombre}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[12px] text-[#4a6a84] whitespace-nowrap">
        <Icon name="calendar" size={14} className={esVencido ? 'text-[#e34948]' : 'text-[#d97706]'} />
        {fecha ? formatFecha(fecha) : '—'}
      </div>
      <div className="flex justify-end">
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${
          esVencido
            ? 'bg-[#fdeef0] text-[#b3372f]'
            : 'bg-[#fff4e0] text-[#b26a00]'
        }`}>
          {esVencido ? 'Vencido' : 'Por vencer'}
        </span>
      </div>
    </div>
  )
}

function GrupoVencimientos({
  titulo, icono, items, tono,
}: {
  titulo: string
  icono: string
  items: ItemVencimiento[]
  tono: 'rojo' | 'ambar'
}) {
  if (items.length === 0) return null
  const cls = tono === 'rojo'
    ? { fondo: 'bg-[#fdeef0]', icono: 'text-[#c0392b]', texto: 'text-[#b3372f]' }
    : { fondo: 'bg-[#fff7e6]', icono: 'text-[#d97706]', texto: 'text-[#b26a00]' }

  return (
    <div>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cls.fondo}`}>
        <Icon name={icono} size={16} className={cls.icono} />
        <span className={`text-[13px] font-bold ${cls.texto}`}>
          {titulo} ({items.length})
        </span>
      </div>
      <div className="mt-1">
        {items.map(item => <FilaVencimiento key={item.exp.id} item={item} />)}
      </div>
    </div>
  )
}

export function WidgetVencimientos({ items }: { items: ItemVencimiento[] }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabVenc>('todas')
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return items
    return items.filter(({ exp, nombre }) =>
      exp.caratula.toLowerCase().includes(q) ||
      exp.id.toLowerCase().includes(q) ||
      (nombre ?? '').toLowerCase().includes(q)
    )
  }, [items, busqueda])

  const vencidas = filtrados.filter(i => i.estado === 'vencido')
  const proximas = filtrados.filter(i => i.estado === 'por_vencer')
  const sinResultados =
    (tab === 'todas' && filtrados.length === 0) ||
    (tab === 'vencidas' && vencidas.length === 0) ||
    (tab === 'por_vencer' && proximas.length === 0)

  return (
    <div className="p-5 rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white">
      {/* Encabezado: título + tabs + buscador */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="font-headline text-[19px] font-bold text-[#1b3a57] leading-tight">
            Vencimientos y tareas
          </h2>
          <p className="text-[12px] text-[#7a9ab4] mt-0.5">
            Plazos y tareas activas, ordenados por urgencia.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-[#eef2f7] rounded-xl p-1">
            {TABS_VENC.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                  tab === t.id
                    ? 'bg-[#2a78d6] text-white shadow-sm'
                    : 'text-[#4a6a84] hover:text-[#1b3a57]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Icon
              name="search" size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a9ab4] pointer-events-none"
            />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar actuaciones..."
              className="w-56 pl-9 pr-3 py-2 text-[12px] rounded-xl border border-[rgba(0,0,0,0.12)] bg-white text-[#1b3a57] placeholder-[#a0b0bc] focus:outline-none focus:border-[#2a78d6]"
            />
          </div>
        </div>
      </div>

      {/* Grupos */}
      {sinResultados ? (
        <p className="text-[12px] text-[#7a9ab4] text-center py-10">
          {busqueda.trim()
            ? 'Sin resultados para la búsqueda.'
            : 'Sin vencimientos activos.'}
        </p>
      ) : (
        <div className="space-y-5">
          {tab !== 'por_vencer' && (
            <GrupoVencimientos titulo="Vencidas" icono="error" items={vencidas} tono="rojo" />
          )}
          {tab !== 'vencidas' && (
            <GrupoVencimientos titulo="Próximas" icono="schedule" items={proximas} tono="ambar" />
          )}
        </div>
      )}

      <button
        onClick={() => navigate(`${RUTAS.ACTUACIONES}?alerta=1`)}
        className="mt-5 text-[12px] font-bold text-[#1b3a57] hover:underline cursor-pointer"
      >
        Ver todas las actuaciones con alerta →
      </button>
    </div>
  )
}

// ── Datos de la pantalla ────────────────────────────────────────────────────────

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
