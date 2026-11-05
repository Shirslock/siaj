import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { esTipoDocumental } from '../../data/catalogos'
import { getEstadoProcesal } from '../../data/estadosProcesales'
import { RUTAS } from '../../utils/routing'
import { formatFecha } from '../../utils/format'
import { getAlertaExpediente, getAlertaTimer } from '../../utils/alertas'
import Icon from '../../components/ui/Icon'
import { USUARIOS } from '../../data/usuarios'
import type { Area, Expediente, Tarea, Usuario } from '../../types'

// Lógica/cálculos y componentes de la pantalla Principal (ver Home.page.tsx).

// 'ARCHIVO' es el código de estado terminal real del ciclo Penal (etapasPenales.ts) —
// distinto de 'ARCHIVADO'/'ARCHIVADA' que usan los demás tipos (mismo criterio que BandejaAbogado).
// Delta 13: también los terminales de los ciclos procesales C/L (FINALIZADO,
// TERMINADO de Lanzamiento Judicializado, DEVUELTO_SECTOR_REQUIRENTE) — un
// antecedente finalizado en cascada ya no cuenta como activo.
export const ESTADOS_CERRADO = ['ARCHIVADO', 'ARCHIVADA', 'ARCHIVO', 'CERRADO', 'CUMPLIDO', 'COMPLETADA', 'FINALIZADO', 'TERMINADO', 'DEVUELTO_SECTOR_REQUIRENTE', 'CUMPLIDO_ACUERDO', 'CUMPLIDO_SIN_ACUERDO', 'NO_ASUME_REPRESENTACION']

// ── Card base de widget ─────────────────────────────────────────────────────────

export function WidgetCard({
  titulo, sub, children,
}: {
  titulo?: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {titulo && (
        <h2 className="text-sm font-semibold text-gray-800">{titulo}</h2>
      )}
      {sub && <p className="text-xs text-gray-400 mb-3">{sub}</p>}
      {children}
    </div>
  )
}

// ── KPI de la fila superior ─────────────────────────────────────────────────────

// Clases literales (Tailwind no resuelve clases armadas dinámicamente).
// Los tonos claros solo cambian la cajita del ícono; `destacado` pinta la tarjeta entera
// (fondo navy de la marca) para que resalte del resto de la fila.
const TARJETA_CLARA = {
  tarjeta: 'bg-white border-gray-200 text-gray-800',
  label: 'text-gray-500',
  valor: 'text-gray-800',
}
const TONOS_KPI = {
  azul: { ...TARJETA_CLARA, caja: 'bg-blue-100', icono: 'text-blue-600' },
  teal: { ...TARJETA_CLARA, caja: 'bg-green-100', icono: 'text-green-600' },
  rojo: { ...TARJETA_CLARA, caja: 'bg-red-100', icono: 'text-red-500' },
  destacado: {
    tarjeta: 'bg-[#0B2545] border-[#0B2545] text-white',
    label: 'text-white/90',
    valor: 'text-white',
    caja: 'bg-white/15',
    icono: 'text-white',
  },
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
      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-3 py-3 text-center transition-shadow ${t.tarjeta} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <span className={`flex items-center justify-center w-8 h-8 rounded-full ${t.caja}`}>
        <Icon name={icono} size={16} className={t.icono} />
      </span>
      <span className={`text-xl font-semibold leading-none ${t.valor}`}>{valor}</span>
      <span className={`text-xs leading-tight ${t.label}`}>{label}</span>
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
    <div className="space-y-2.5">
      {filas.map(f => (
        <div
          key={f.label}
          onClick={f.onClick}
          className={`flex items-center gap-3 text-xs ${f.onClick ? 'cursor-pointer group' : ''}`}
        >
          <span title={f.label} className="w-2/5 text-gray-600 truncate group-hover:underline">{f.label}</span>
          <span className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <span
              className="block h-full rounded-full bg-blue-600 transition-all"
              style={{ width: f.valor > 0 ? `${Math.max((f.valor / max) * 100, 4)}%` : '0%' }}
            />
          </span>
          <span className="w-7 text-right text-gray-600 flex-shrink-0">{f.valor}</span>
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
      className={`flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-white transition-shadow ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">Actuaciones cerradas</p>
        <p className="text-xs text-gray-400 mt-0.5">Total de actuaciones finalizadas.</p>
      </div>
      <span className="text-2xl font-semibold text-gray-800 leading-none flex-shrink-0">{valor}</span>
    </div>
  )
}

// ── Próximas audiencias ─────────────────────────────────────────────────────────

export interface ItemAudiencia {
  exp: Expediente
  titulo: string
  fecha: string
}

export function WidgetAudiencias({ items }: { items: ItemAudiencia[] }) {
  const navigate = useNavigate()

  return (
    <WidgetCard
      titulo="Próximas audiencias"
      sub={
        items.length === 0
          ? 'Sin audiencias agendadas.'
          : `${items.length} audiencia${items.length !== 1 ? 's' : ''} agendada${items.length !== 1 ? 's' : ''}.`
      }
    >
      {items.length > 0 && (
        <div className="space-y-0.5">
          {items.map((a, i) => (
            <div
              key={`${a.exp.id}-${i}`}
              onClick={() => navigate(RUTAS.EXPEDIENTE(a.exp.id))}
              className="flex items-start gap-2.5 px-2 py-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Icon name="calendar" size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-gray-800 truncate">{a.titulo}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {formatFecha(a.fecha)} · {a.exp.id}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
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
      className="grid grid-cols-[minmax(0,1fr)_130px_112px] items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 truncate">{exp.caratula}</p>
        <p className="text-[11.5px] text-gray-400 mt-0.5 truncate">
          {exp.id}{nombre ? ` · ${nombre}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[12px] text-gray-500 whitespace-nowrap">
        <Icon name="calendar" size={14} className={esVencido ? 'text-red-500' : 'text-amber-700'} />
        {fecha ? formatFecha(fecha) : '—'}
      </div>
      <div className="flex justify-end">
        <span className={`text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${
          esVencido
            ? 'bg-red-50 text-red-700'
            : 'bg-amber-50 text-amber-700'
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
    ? { icono: 'text-red-600', texto: 'text-red-600' }
    : { icono: 'text-amber-700', texto: 'text-amber-700' }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={icono} size={14} className={cls.icono} />
        <span className={`text-xs font-semibold ${cls.texto}`}>
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

  const vencidas = items.filter(i => i.estado === 'vencido')
  const proximas = items.filter(i => i.estado === 'por_vencer')
  const sinResultados =
    (tab === 'todas' && items.length === 0) ||
    (tab === 'vencidas' && vencidas.length === 0) ||
    (tab === 'por_vencer' && proximas.length === 0)
  const mensajeVacio =
    tab === 'vencidas'   ? 'Sin actuaciones vencidas.'
    : tab === 'por_vencer' ? 'Sin actuaciones por vencer.'
    : 'Sin vencimientos activos.'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Encabezado: título + tabs + buscador */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Vencimientos y tareas</h2>
          <p className="text-xs text-gray-400">Plazos y tareas activas, ordenados por urgencia.</p>
        </div>

        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden shrink-0">
          {TABS_VENC.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-blue-700 text-white'
                  : `${i > 0 ? 'border-l border-gray-300 ' : ''}bg-white text-gray-600 hover:bg-gray-50`
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grupos */}
      {sinResultados ? (
        <p className="text-[12px] text-gray-400 text-center py-10">{mensajeVacio}</p>
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
        className="mt-3 text-xs text-blue-700 hover:underline cursor-pointer"
      >
        Ver todas las actuaciones con alerta →
      </button>
    </div>
  )
}

// ── Alcance (scope) ─────────────────────────────────────────────────────────────

// COORDINADOR y REFERENTE (Gerente) entran a Principal con alcance ampliado además
// del Dashboard; ABOGADO mantiene el comportamiento original con scope fijo 'MIAS'.
export type Scope = 'MIAS' | 'AREA' | 'TODO' | 'LETRADO'

// Letrados que el usuario puede elegir en "Por letrado": el COORDINADOR ve los de sus áreas;
// el REFERENTE (Gerente) ve todos. Orden alfabético por apellido.
export function letradosDisponibles(usuario: Usuario | null | undefined): Usuario[] {
  if (!usuario) return []
  const misAreas = usuario.areas ?? []
  return USUARIOS.filter(u =>
    u.rolSistema === 'ABOGADO' &&
    (usuario.rolSistema === 'REFERENTE' || misAreas.some(a => u.areas.includes(a)))
  ).sort((a, b) => a.apellido.localeCompare(b.apellido))
}

// ── Datos de la pantalla ────────────────────────────────────────────────────────

export function useHomeData(scope: Scope = 'MIAS', letradoId = '') {
  const { expedientes, tareasMap } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const navigate = useNavigate()

  const misExpedientes = useMemo(() => {
    if (scope === 'TODO') return expedientes
    if (scope === 'LETRADO') return expedientes.filter(e => e.abogado_id === letradoId)
    if (scope === 'AREA') {
      const misAreas = usuarioActivo?.areas ?? []
      return expedientes.filter(e => misAreas.includes(e.area as Area))
    }
    return expedientes.filter(e => e.abogado_id === usuarioActivo?.id)
  }, [expedientes, usuarioActivo, scope, letradoId])

  const misActivos = useMemo(() =>
    misExpedientes.filter(e => !ESTADOS_CERRADO.includes(e.estado)),
    [misExpedientes])

  const vencimientos = useMemo(() =>
    construirVencimientos(misActivos, tareasMap),
    [misActivos, tareasMap])

  // Causas vs. documentos: la separación es por TIPO de gestión (`TIPOS_DOCUMENTALES` en
  // catalogos.ts), no por si la actuación trae n° de causa cargado — un oficio judicial
  // normalmente referencia una causa ajena y aun así es un documento. Los dos contadores
  // suman exactamente `misActivos.length`.
  const causasActivasCount = useMemo(() =>
    misActivos.filter(e => !esTipoDocumental(e.tipo)).length,
    [misActivos])

  const documentosActivosCount = useMemo(() =>
    misActivos.filter(e => esTipoDocumental(e.tipo)).length,
    [misActivos])

  const asignadoCount = useMemo(() =>
    misActivos.filter(e => e.estado === 'ASIGNADO').length,
    [misActivos])

  // Las 4 filas de "Por rol" salen del mismo campo (`mesa_tipo_intervencion`). 'Denunciante' es
  // un valor del ciclo Penal, así que solo se puebla para letrados con actuaciones penales.
  // 'Actuación de Oficio' (el otro valor penal) queda deliberadamente fuera de la distribución.
  const intervencion = useMemo(() => {
    let actora = 0, demandada = 0, denunciante = 0, sinIntervencion = 0
    misActivos.forEach(e => {
      const valor = String(e.campos_mesa?.['mesa_tipo_intervencion'] ?? '')
      if (valor === 'Actora') actora++
      else if (valor === 'Demandada') demandada++
      else if (valor === 'Denunciante') denunciante++
      else if (valor === 'Sin Intervención' || valor === '') sinIntervencion++
    })
    return { actora, demandada, denunciante, sinIntervencion }
  }, [misActivos])

  const porVencerCount = useMemo(() =>
    vencimientos.filter(i => i.estado === 'por_vencer').length,
    [vencimientos])

  const urgentesCount = useMemo(() =>
    misActivos.filter(e => e.es_urgente).length,
    [misActivos])

  // Distribución por estado procesal (en qué etapa está cada actuación), no por objeto
  // del juicio. El label sale de `getEstadoProcesal(tipo, codigo)` — el ciclo de estados
  // depende del tipo, así que se resuelve por expediente y se agrupa por código.
  const estadosActivos = useMemo(() => {
    const conteo: Record<string, { count: number; label: string }> = {}
    misActivos.forEach(e => {
      const code = e.estadoProcesal ?? e.estado
      const label = getEstadoProcesal(e.tipo, code)?.label ?? code
      if (conteo[code]) conteo[code].count++
      else conteo[code] = { count: 1, label }
    })
    return Object.entries(conteo)
      .map(([code, { count, label }]) => ({ code, count, label }))
      .sort((a, b) => b.count - a.count)
  }, [misActivos])

  // Audiencias: se cargan como actividad genérica de `tipo: 'AUDIENCIA'` en el timeline, no como
  // entidad propia. La fecha de la audiencia es `fecha_vencimiento` cuando está cargada (así la
  // modela el mock, con `fecha` = alta de la actividad) y si no, `fecha`. Solo las de hoy en
  // adelante — una audiencia que ya pasó no sirve para organizar el día.
  const audiencias = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0]
    return misActivos
      .flatMap(exp =>
        (exp.timeline ?? [])
          .filter(act => act.tipo === 'AUDIENCIA' && act.activo !== false && !act.eliminado)
          .map(act => ({
            exp,
            titulo: act.titulo,
            fecha: act.fecha_vencimiento ?? act.fecha,
          }))
      )
      .filter(a => a.fecha >= hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [misActivos])

  const cerradasCount = useMemo(() =>
    misExpedientes.filter(e => ESTADOS_CERRADO.includes(e.estado)).length,
    [misExpedientes])

  return {
    usuarioActivo,
    navigate,
    scope,
    misExpedientes,
    misActivos,
    vencimientos,
    causasActivasCount,
    documentosActivosCount,
    asignadoCount,
    intervencion,
    porVencerCount,
    urgentesCount,
    estadosActivos,
    audiencias,
    cerradasCount,
  }
}
