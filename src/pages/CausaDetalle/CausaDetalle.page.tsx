import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { TablaExpedientes } from '../../components/expedientes/TablaExpedientes'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
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

const TABS: { id: Tab; label: string }[] = [
  { id: 'timeline',    label: 'Timeline' },
  { id: 'expedientes', label: 'Expedientes agrupados' },
  { id: 'repositorio', label: 'Repositorio' },
  { id: 'vinculados',  label: 'Expedientes vinculados entre áreas' },
]

function iconPorTipo(tipo: string): string {
  const map: Record<string, string> = {
    RECEPCION:      'description',
    CONTESTACION:   'reply',
    PRESENTACION:   'upload_file',
    AUDIENCIA:      'gavel',
    PERICIA:        'science',
    TRASLADO:       'forward',
    NOTIFICACION:   'notifications',
    MOVIMIENTO:     'notes',
    NOTA_RESPUESTA: 'question_answer',
    OTRO:           'more_horiz',
  }
  return map[tipo] ?? 'description'
}

export default function CausaDetallePage() {
  const params     = useParams()
  const navigate   = useNavigate()
  const numeroCausa = params['*'] ?? ''
  const { expedientes } = useExpedientesStore()

  const [tabActivo,    setTabActivo]    = useState<Tab>('timeline')
  const [filtroExpId,  setFiltroExpId]  = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [filtroBuscar, setFiltroBuscar] = useState('')
  const [modalNueva,   setModalNueva]   = useState(false)

  const expsDeCausa = useMemo(() =>
    expedientes.filter(e => e.numero_causa === numeroCausa),
    [expedientes, numeroCausa])

  const timeline = useMemo((): MovimientoEnriquecido[] =>
    expsDeCausa
      .flatMap(e => e.timeline.map(act => ({
        ...act,
        _expId:       e.id,
        _expArea:     e.area,
        _expCaratula: e.caratula,
      })))
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [expsDeCausa])

  const tiposUnicos = useMemo(() =>
    [...new Set(timeline.map(m => m.tipo))],
    [timeline])

  const movimientosFiltrados = useMemo(() =>
    timeline.filter(mov => {
      if (filtroExpId && mov._expId !== filtroExpId) return false
      if (filtroTipo  && mov.tipo   !== filtroTipo)  return false
      if (filtroBuscar) {
        const q = filtroBuscar.toLowerCase()
        return (
          mov.titulo.toLowerCase().includes(q) ||
          (mov.descripcion ?? '').toLowerCase().includes(q)
        )
      }
      return true
    }),
    [timeline, filtroExpId, filtroTipo, filtroBuscar])

  const documentos = useMemo((): DocEnriquecido[] =>
    expsDeCausa.flatMap(e =>
      e.documentos.map(d => ({ ...d, _expId: e.id, _expArea: e.area }))
    ),
    [expsDeCausa])

  const vinculados = useMemo((): VinculoExpediente[] => {
    const seen = new Set<string>()
    const result: VinculoExpediente[] = []
    for (const exp of expsDeCausa) {
      for (const v of exp.vinculos) {
        if (!seen.has(v.id)) { seen.add(v.id); result.push(v) }
      }
    }
    return result
  }, [expsDeCausa])

  const hayFiltros = filtroExpId !== '' || filtroTipo !== '' || filtroBuscar !== ''

  if (expsDeCausa.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#4a6a84]">search_off</span>
          <p className="mt-4 text-[#1b3a57] font-medium">Causa no encontrada</p>
          <p className="text-sm text-[#4a6a84] mt-1 font-mono">{numeroCausa}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto">

      {/* ── HEADER ── */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e8e8e8] transition-colors text-[#4a6a84]"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">
            N° Causa Judicial
          </p>
        </div>

        <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57] mb-1 ml-10">
          {numeroCausa}
        </h1>

        <p className="text-sm text-[#4a6a84] ml-10 mb-6">
          {expsDeCausa.length} expediente{expsDeCausa.length !== 1 ? 's' : ''} activo{expsDeCausa.length !== 1 ? 's' : ''} —{' '}
          {[...new Set(expsDeCausa.map(e => e.area))].join(' · ')}
        </p>
      </div>

      {/* ── TABS ── */}
      <div className="px-6 border-b border-[rgba(0,0,0,0.08)]">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabActivo(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tabActivo === tab.id
                  ? 'border-[#1b3a57] text-[#1b3a57] font-semibold'
                  : 'border-transparent text-[#4a6a84] hover:text-[#1b3a57] hover:border-[rgba(0,0,0,0.12)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="px-6 py-6">

        {/* ── TAB: TIMELINE ── */}
        {tabActivo === 'timeline' && (
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden">

            {/* Card header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-[rgba(0,0,0,0.06)]">
              <p className="font-semibold text-sm text-[#1b3a57]">Historial completo de la causa</p>
              <Button variant="primary" icon="add_circle" size="sm" onClick={() => setModalNueva(true)}>
                Nueva Actividad
              </Button>
            </div>

            {/* Filtros */}
            <div className="px-6 py-3 flex items-center gap-3 flex-wrap border-b border-[rgba(0,0,0,0.04)]">
              <select
                className="field-input min-w-[200px] w-auto"
                value={filtroExpId}
                onChange={e => setFiltroExpId(e.target.value)}
              >
                <option value="">Expediente: Todos</option>
                {expsDeCausa.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.id} — {e.caratula.slice(0, 30)}{e.caratula.length > 30 ? '…' : ''}
                  </option>
                ))}
              </select>

              <select
                className="field-input min-w-[160px] w-auto"
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
              >
                <option value="">Tipo: Todos</option>
                {tiposUnicos.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#4a6a84] pointer-events-none">
                  search
                </span>
                <input
                  className="field-input pl-9"
                  placeholder="Buscar por título de actividad..."
                  value={filtroBuscar}
                  onChange={e => setFiltroBuscar(e.target.value)}
                />
              </div>

              {hayFiltros && (
                <button
                  onClick={() => { setFiltroExpId(''); setFiltroTipo(''); setFiltroBuscar('') }}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#4a6a84] hover:text-[#1b3a57] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  Limpiar
                </button>
              )}
            </div>

            {/* Lista */}
            {movimientosFiltrados.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <span className="material-symbols-outlined text-4xl text-[rgba(0,0,0,0.35)] block mb-3">history</span>
                <p className="text-sm text-[#4a6a84]">
                  No hay actividades que coincidan con los filtros.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {movimientosFiltrados.map((mov, i) => (
                  <div
                    key={`${mov._expId}-${mov.id ?? i}`}
                    className="px-6 py-4 flex items-start gap-4 hover:bg-[#f0f0f0]/50 transition-colors"
                  >
                    {/* Dot */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 rounded-full bg-[#1b3a57] mt-1" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      {/* Fila superior: badges */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <AreaBadge area={mov._expArea} />
                        <span className="font-mono text-[11px] font-bold text-[#1b3a57]">{mov._expId}</span>
                        <span className="text-[11px] text-[#4a6a84] truncate max-w-[300px]">
                          {mov._expCaratula}
                        </span>
                        {mov.activo && (
                          <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-[#1b3a57]">
                            ACTIVO
                          </span>
                        )}
                      </div>

                      {/* Fila principal: ícono + título + fecha */}
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span
                          className="material-symbols-outlined text-[#4a6a84] flex-shrink-0"
                          style={{ fontSize: '16px' }}
                        >
                          {iconPorTipo(mov.tipo)}
                        </span>
                        <p className="text-sm font-semibold text-[#1b3a57]">{mov.titulo}</p>
                        <p className="text-[11px] text-[#4a6a84] flex-shrink-0">
                          {formatFecha(mov.fecha)} · 09:00
                        </p>
                      </div>

                      {/* Descripción */}
                      {mov.descripcion && (
                        <p className="text-xs text-[#4a6a84] leading-relaxed ml-6 mb-1">
                          {mov.descripcion}
                        </p>
                      )}

                      {/* Doc GDE */}
                      {mov.doc_gde && (
                        <div className="flex items-center gap-1.5 ml-6 mt-1">
                          <span
                            className="material-symbols-outlined text-[#4a6a84] flex-shrink-0"
                            style={{ fontSize: '14px' }}
                          >
                            attach_file
                          </span>
                          <span className="font-mono text-[11px] text-[#4a6a84]">{mov.doc_gde}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: EXPEDIENTES AGRUPADOS ── */}
        {tabActivo === 'expedientes' && (
          <div className="bg-white rounded-2xl shadow-card">
            <TablaExpedientes expedientes={expsDeCausa} />
          </div>
        )}

        {/* ── TAB: REPOSITORIO ── */}
        {tabActivo === 'repositorio' && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {documentos.length === 0 ? (
              <div className="p-10 text-center text-[#4a6a84] text-sm">No hay documentos.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(0,0,0,0.12)]">
                    {['Documento', 'Tipo', 'Expediente', 'Fecha', 'Tamaño'].map(col => (
                      <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-[#4a6a84]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {documentos.map((doc, i) => (
                    <tr key={i} className="hover:bg-[#f0f0f0] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[18px] ${doc.color}`}>{doc.icon}</span>
                          <span className="text-[#1b3a57] text-sm">{doc.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4a6a84]">{doc.tipo}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <AreaBadge area={doc._expArea} />
                          <span className="font-mono text-xs text-[#4a6a84]">{doc._expId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4a6a84] whitespace-nowrap">{formatFecha(doc.fecha)}</td>
                      <td className="py-3 px-4 text-xs text-[#4a6a84]">{doc.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── TAB: VINCULADOS ── */}
        {tabActivo === 'vinculados' && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {vinculados.length === 0 ? (
              <div className="p-10 text-center text-[#4a6a84] text-sm">No hay expedientes vinculados.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(0,0,0,0.12)]">
                    {['Expediente', 'Área', 'Tipo', 'Carátula', 'Estado', 'Letrado/a', 'Relación'].map(col => (
                      <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-[#4a6a84]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {vinculados.map(v => {
                    const abogado = v.abogado_id ? getUsuarioById(v.abogado_id) : undefined
                    return (
                      <tr key={v.id} className="hover:bg-[#f0f0f0] transition-colors">
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-[#1b3a57] whitespace-nowrap">{v.id}</td>
                        <td className="py-3 px-4"><AreaBadge area={v.area} /></td>
                        <td className="py-3 px-4 text-xs text-[#4a6a84] whitespace-nowrap">{v.tipo.replace(/_/g, ' ')}</td>
                        <td className="py-3 px-4 text-[#1b3a57] max-w-xs truncate">{v.caratula}</td>
                        <td className="py-3 px-4 whitespace-nowrap"><EstadoBadge code={v.estado} label={v.estadoLabel} /></td>
                        <td className="py-3 px-4 text-xs text-[#4a6a84] whitespace-nowrap">
                          {abogado ? getNombreCompleto(abogado) : '—'}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#4a6a84] whitespace-nowrap">
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

      {/* Modal Nueva Actividad */}
      <Modal
        open={modalNueva}
        onClose={() => setModalNueva(false)}
        titulo="Nueva Actividad"
        size="sm"
        footer={<Button variant="ghost" onClick={() => setModalNueva(false)}>Cerrar</Button>}
      >
        <p className="text-sm text-[#4a6a84]">Funcionalidad en desarrollo.</p>
      </Modal>

    </div>
  )
}
