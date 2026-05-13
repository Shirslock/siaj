import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { TablaExpedientes } from '../../components/expedientes/TablaExpedientes'
import { formatFecha } from '../../utils/format'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import type { Actividad, Area, Documento, VinculoExpediente } from '../../types'

type Tab = 'timeline' | 'expedientes' | 'repositorio' | 'vinculados'

interface MovimientoEnriquecido extends Actividad {
  _expId:       string
  _expArea:     Area
  _expCaratula: string
}

interface DocEnriquecido extends Documento {
  _expId:   string
  _expArea: Area
}

export default function CausaDetallePage() {
  const params = useParams()
  const numeroCausa = params['*'] ?? ''
  const { expedientes } = useExpedientesStore()
  const [tab, setTab] = useState<Tab>('timeline')

  const expsEnCausa = useMemo(() =>
    expedientes.filter(e => e.numero_causa === numeroCausa),
    [expedientes, numeroCausa])

  const timeline = useMemo((): MovimientoEnriquecido[] =>
    expsEnCausa
      .flatMap(e => e.timeline.map(act => ({
        ...act,
        _expId:       e.id,
        _expArea:     e.area,
        _expCaratula: e.caratula,
      })))
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [expsEnCausa])

  const documentos = useMemo((): DocEnriquecido[] =>
    expsEnCausa.flatMap(e =>
      e.documentos.map(d => ({ ...d, _expId: e.id, _expArea: e.area }))
    ),
    [expsEnCausa])

  const vinculados = useMemo((): VinculoExpediente[] => {
    const seen = new Set<string>()
    const result: VinculoExpediente[] = []
    for (const exp of expsEnCausa) {
      for (const v of exp.vinculos) {
        if (!seen.has(v.id)) {
          seen.add(v.id)
          result.push(v)
        }
      }
    }
    return result
  }, [expsEnCausa])

  const TABS: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: 'timeline',    label: 'Timeline',    icon: 'timeline',    count: timeline.length },
    { key: 'expedientes', label: 'Expedientes', icon: 'folder_open', count: expsEnCausa.length },
    { key: 'repositorio', label: 'Repositorio', icon: 'folder',      count: documentos.length },
    { key: 'vinculados',  label: 'Vinculados',  icon: 'account_tree',count: vinculados.length },
  ]

  if (expsEnCausa.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant">search_off</span>
          <p className="mt-4 text-on-surface font-medium">Causa no encontrada</p>
          <p className="text-sm text-on-surface-variant mt-1 font-mono">{numeroCausa}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5 flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">N° Causa</p>
          <p className="font-mono font-bold text-xl text-on-surface mt-0.5">{numeroCausa}</p>
        </div>
        <div className="h-8 w-px bg-outline-variant/50" />
        <div className="flex gap-2 flex-wrap">
          {[...new Set(expsEnCausa.map(e => e.area))].map(area => (
            <AreaBadge key={area} area={area} />
          ))}
        </div>
        <div className="h-8 w-px bg-outline-variant/50" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Expedientes</p>
          <p className="text-sm font-semibold text-on-surface mt-0.5">{expsEnCausa.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-surface-container-lowest shadow-sm text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
            <span className="text-xs bg-surface-container-high rounded-full px-1.5 py-0.5 text-on-surface-variant">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'timeline' && (
        <div className="space-y-3">
          {timeline.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl shadow-card p-10 text-center text-on-surface-variant text-sm">
              No hay movimientos registrados.
            </div>
          ) : (
            timeline.map((mov, i) => (
              <TimelineCard key={`${mov._expId}-${mov.id ?? i}`} mov={mov} />
            ))
          )}
        </div>
      )}

      {tab === 'expedientes' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card">
          <TablaExpedientes expedientes={expsEnCausa} />
        </div>
      )}

      {tab === 'repositorio' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          {documentos.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant text-sm">No hay documentos.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/50">
                  {['Documento', 'Tipo', 'Expediente', 'Fecha', 'Tamaño'].map(col => (
                    <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {documentos.map((doc, i) => (
                  <tr key={i} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[18px] ${doc.color}`}>{doc.icon}</span>
                        <span className="text-on-surface text-sm">{doc.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant">{doc.tipo}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <AreaBadge area={doc._expArea} />
                        <span className="font-mono text-xs text-on-surface-variant">{doc._expId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{formatFecha(doc.fecha)}</td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant">{doc.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'vinculados' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          {vinculados.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant text-sm">No hay expedientes vinculados.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/50">
                  {['Expediente', 'Área', 'Tipo', 'Carátula', 'Estado', 'Letrado/a', 'Relación'].map(col => (
                    <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {vinculados.map(v => {
                  const abogado = v.abogado_id ? getUsuarioById(v.abogado_id) : undefined
                  return (
                    <tr key={v.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-primary whitespace-nowrap">{v.id}</td>
                      <td className="py-3 px-4"><AreaBadge area={v.area} /></td>
                      <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{v.tipo.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4 text-on-surface max-w-xs truncate">{v.caratula}</td>
                      <td className="py-3 px-4 whitespace-nowrap"><EstadoBadge code={v.estado} label={v.estadoLabel} /></td>
                      <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">
                        {abogado ? getNombreCompleto(abogado) : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">
                        {v.tipo_relacion.replace(/_/g, ' ')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function TimelineCard({ mov }: { mov: MovimientoEnriquecido }) {
  const creador = mov.creado_por ? getUsuarioById(mov.creado_por) : undefined
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">article</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-on-surface text-sm">{mov.titulo}</p>
            {mov.estado && <EstadoBadge code={mov.estado} label={mov.estado} />}
            <AreaBadge area={mov._expArea} />
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">{mov.descripcion}</p>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-on-surface-variant flex-wrap">
            <span>{formatFecha(mov.fecha)}</span>
            {creador && <span>{getNombreCompleto(creador)}</span>}
            <span className="font-mono">{mov._expId}</span>
            {mov.doc_gde && (
              <span className="font-mono flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">link</span>
                {mov.doc_gde}
              </span>
            )}
          </div>
          {mov.checklist && mov.checklist.length > 0 && (
            <div className="mt-3 space-y-1">
              {mov.checklist.map(ck => (
                <div key={ck.id} className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className={`material-symbols-outlined text-[14px] ${ck.completado ? 'text-green-600' : 'text-outline'}`}>
                    {ck.completado ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  {ck.texto}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
