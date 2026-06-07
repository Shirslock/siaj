import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { TablaExpedientes } from '../../components/expedientes/TablaExpedientes'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { formatFecha } from '../../utils/format'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import type { Actividad, Area, Documento, VinculoExpediente } from '../../types'
import Icon from '../../components/ui/Icon'
import { exportarExcel, exportarPDF, type FilaTimelineExport } from '../../utils/exportTimeline'
import { toast } from '../../components/ui/Toast'

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

  const [tabActivo,      setTabActivo]      = useState<Tab>('timeline')
  const [filtroExpId,    setFiltroExpId]    = useState('')
  const [filtroTipo,     setFiltroTipo]     = useState('')
  const [filtroBuscar,   setFiltroBuscar]   = useState('')
  const [menuExportCausa, setMenuExportCausa] = useState(false)

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

  const nombreArchivoCausa = `timeline_causa_${numeroCausa.replace(/\//g, '-')}_${new Date().toISOString().split('T')[0]}`
  const tituloCausa    = `Timeline — Causa ${numeroCausa}`
  const subtituloCausa = `${expsDeCausa.length} expediente${expsDeCausa.length !== 1 ? 's' : ''} — ${[...new Set(expsDeCausa.map(e => e.area))].join(' · ')}`

  function getFilasExportCausa(): FilaTimelineExport[] {
    return movimientosFiltrados.map(mov => ({
      fecha:            mov.fecha ?? '',
      tipo:             mov.titulo.startsWith('Cambio') ? 'Sistema' : 'Actividad',
      titulo:           mov.titulo,
      descripcion:      mov.descripcion ?? '',
      docGde:           mov.doc_gde ?? '',
      estado:           mov.estado ?? '',
      estadoExpediente: mov.estadoExpediente ?? '',
      expediente:       mov._expId,
      area:             mov._expArea,
    }))
  }

  useEffect(() => {
    if (!menuExportCausa) return
    const handler = () => setMenuExportCausa(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuExportCausa])

  if (expsDeCausa.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <Icon name="search_off" size={48} />
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
            <Icon name="arrow_back" size={20} />
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
              <div className="flex items-center gap-2">
                {/* Botón exportar */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuExportCausa(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-[rgba(0,0,0,0.15)] rounded-lg bg-white text-[#1b3a57] hover:bg-[#f0f0f0] transition-colors"
                  >
                    <Icon name="download" size={14} />
                    Exportar
                    <Icon name="chevron_right" size={12} className={menuExportCausa ? 'rotate-90 transition-transform' : 'transition-transform'} />
                  </button>

                  {menuExportCausa && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[rgba(0,0,0,0.12)] rounded-xl shadow-card-lg z-50 py-1 min-w-[160px]">
                      <button
                        onClick={() => { exportarExcel(getFilasExportCausa(), nombreArchivoCausa, true); setMenuExportCausa(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1b3a57] hover:bg-[#f5f5f5] transition-colors"
                      >
                        <Icon name="description" size={16} className="text-[#15803d]" />
                        Descargar Excel
                      </button>
                      <button
                        onClick={() => { exportarPDF(getFilasExportCausa(), nombreArchivoCausa, tituloCausa, subtituloCausa, true); setMenuExportCausa(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1b3a57] hover:bg-[#f5f5f5] transition-colors"
                      >
                        <Icon name="picture_as_pdf" size={16} className="text-[#b91c1c]" />
                        Descargar PDF
                      </button>
                    </div>
                  )}
                </div>

              </div>
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
                <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a84] pointer-events-none" />
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
                  <Icon name="close" size={14} />
                  Limpiar
                </button>
              )}
            </div>

            {/* Lista */}
            {movimientosFiltrados.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Icon name="history" className="block mb-3" size={40} />
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
                        <Icon name={iconPorTipo(mov.tipo)} size={16} className="text-[#4a6a84] flex-shrink-0" />
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
                          <Icon name="attach_file" size={14} className="text-[#4a6a84] flex-shrink-0" />
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
                    {['Documento', 'Tipo', 'Expediente', 'Fecha', 'Tamaño', ''].map(col => (
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
                          <Icon name={doc.icon} size={18} className={doc.color} />
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
                      <td className="py-3 px-4">
                        <button className="flex items-center gap-1.5 text-xs font-bold text-[#1b3a57] hover:text-[#4a9ab5] transition-colors cursor-pointer"
                        onClick={() => toast.info(`Descarga de "${doc.nombre}".`)}
                        >
                          <Icon name="download" size={15} />
                        </button>
                      </td>
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


    </div>
  )
}
