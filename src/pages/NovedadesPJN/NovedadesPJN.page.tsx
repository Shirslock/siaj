import { useMemo, useState } from 'react'
import { usePjnStore } from '../../store/pjn.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { filtrarNovedadesPorRol, filtrarAlertasActuacionesPorRol } from '../../utils/pjnVisibilidad'
import { esNovedadVencida } from '../../utils/pjnVencimiento'
import { NovedadPjnCard } from '../../components/pjn/NovedadPjnCard'
import { Button } from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { formatFecha } from '../../utils/format'
import { toast } from 'react-toastify'
import type { NovedadPJN } from '../../types'

type Filtro = 'pendientes' | 'vencidas' | 'todas'

interface GrupoCorrida {
  key: string
  expediente_id: string
  corrida_id: string
  fecha_deteccion: string
  items: NovedadPJN[]
}

function agruparPorCorrida(lista: NovedadPJN[]): GrupoCorrida[] {
  const grupos: Record<string, GrupoCorrida> = {}
  lista.forEach(n => {
    const key = `${n.expediente_id}_${n.corrida_id}`
    if (!grupos[key]) {
      grupos[key] = { key, expediente_id: n.expediente_id, corrida_id: n.corrida_id, fecha_deteccion: n.fecha_deteccion, items: [] }
    }
    grupos[key].items.push(n)
  })
  return Object.values(grupos)
    .map(g => ({ ...g, items: g.items.slice().sort((a, b) => a.row_index - b.row_index) }))
    .sort((a, b) => new Date(b.fecha_deteccion).getTime() - new Date(a.fecha_deteccion).getTime())
}

export default function NovedadesPJNPage() {
  const { novedades, actuacionesSinCargar, descartarAlerta, resolverAlerta } = usePjnStore()
  const { expedientes } = useExpedientesStore()
  const { usuarioActivo } = useUIStore()
  const [filtro, setFiltro] = useState<Filtro>('pendientes')

  const visibles = useMemo(
    () => filtrarNovedadesPorRol(novedades, expedientes, usuarioActivo),
    [novedades, expedientes, usuarioActivo]
  )

  const alertasVisibles = useMemo(
    () => filtrarAlertasActuacionesPorRol(actuacionesSinCargar, usuarioActivo)
      .filter(a => a.estado === 'pendiente'),
    [actuacionesSinCargar, usuarioActivo]
  )

  const pendientesTodas = visibles.filter(n => n.estado === 'pendiente')
  const pendientes = pendientesTodas.filter(n => !esNovedadVencida(n))
  const vencidas = pendientesTodas.filter(n => esNovedadVencida(n))

  const lista = filtro === 'pendientes' ? pendientes : filtro === 'vencidas' ? vencidas : visibles
  const grupos = useMemo(() => agruparPorCorrida(lista), [lista])

  function handleDescartarAlerta(id: string) {
    if (!usuarioActivo) return
    descartarAlerta(id, usuarioActivo.id)
    toast.info('Alerta descartada.')
  }

  function handleResolverAlerta(id: string) {
    if (!usuarioActivo) return
    resolverAlerta(id, usuarioActivo.id)
    toast.success('Alerta marcada como resuelta.')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="refresh" size={18} className="text-[#1b3a57]" />
          <h2 className="text-lg font-bold text-[#1b3a57]">Novedades PJN</h2>
          {pendientes.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#185fa5] text-white">
              {pendientes.length} pendientes
            </span>
          )}
          {vencidas.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#b91c1c] text-white">
              {vencidas.length} vencidas
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-[#e5e5e5] rounded-lg p-1">
          <button
            onClick={() => setFiltro('pendientes')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filtro === 'pendientes' ? 'bg-white text-[#1b3a57] shadow-sm' : 'text-[#4a6a84]'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFiltro('vencidas')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filtro === 'vencidas' ? 'bg-white text-[#1b3a57] shadow-sm' : 'text-[#4a6a84]'
            }`}
          >
            Vencidas
          </button>
          <button
            onClick={() => setFiltro('todas')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filtro === 'todas' ? 'bg-white text-[#1b3a57] shadow-sm' : 'text-[#4a6a84]'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {alertasVisibles.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7a9ab4] mb-2">
            Actuaciones en PJN sin cargar en SIAJ ({alertasVisibles.length})
          </p>
          <div className="space-y-3">
            {alertasVisibles.map(a => (
              <div key={a.id} className="rounded-xl border border-[#f5c2c0] bg-[#fdecea] p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <Icon name="warning" size={16} className="text-[#b91c1c]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1b3a57] font-mono">{a.numero_causa}</p>
                    {a.caratula_pjn && <p className="text-sm text-[#1b3a57]">{a.caratula_pjn}</p>}
                    <p className="text-xs text-[#7a9ab4] mt-0.5">
                      {[a.juzgado, a.fuero].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-[11px] text-[#7a9ab4] mt-0.5">
                      Detectada el {formatFecha(a.fecha_deteccion)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleDescartarAlerta(a.id)}>
                    Descartar
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleResolverAlerta(a.id)}>
                    Marcar como resuelta
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white py-16 text-center">
          <Icon name="refresh" size={28} className="text-[#7a9ab4] mx-auto mb-2" />
          <p className="text-sm text-[#4a6a84]">Sin novedades pendientes de PJN.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(g => (
            <div key={g.key}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#7a9ab4] mb-2">
                {g.items.length} {g.items.length === 1 ? 'movimiento detectado' : 'movimientos detectados'} el {formatFecha(g.fecha_deteccion)}
              </p>
              <div className="space-y-3">
                {g.items.map(n => (
                  <NovedadPjnCard key={n.id} novedad={n} mostrarActuacion />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
