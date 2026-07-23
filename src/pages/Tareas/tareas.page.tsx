import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import {
  useTareasStore,
} from '../../store/tareas.store'
import { Modal } from '../../components/ui/Modal'
import { AreaBadge } from '../../components/ui/Badge'
import { USUARIOS, getNombreCompleto, getUsuarioById } from '../../data/usuarios'
import { RUTAS } from '../../utils/routing'
import { formatFecha } from '../../utils/format'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'
import { useSolicitudesStore, type Solicitud } from '../../store/tareas.store'
import { useNotificacionesStore } from '../../store/notificaciones.store'

// ── Tipos locales ─────────────────────────────────────────────────────────────
type TipoFiltro = 'mis_tareas' | 'creadas_por_mi' | 'interna' | 'externa' | ''

const HOY = new Date().toISOString().split('T')[0]

// ── Página principal ──────────────────────────────────────────────────────────

export default function TareasPage() {
  const navigate = useNavigate()
  const { usuarioActivo } = useUIStore()
  const { } = useTareasStore()
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('mis_tareas')
  const [filtroLetrado, setFiltroLetrado] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroExpediente, setFiltroExpediente] = useState('')
  const [busqueda, setBusqueda] = useState('')

  function limpiarFiltros() {
    setTipoFiltro('')
    setFiltroLetrado('')
    setBusqueda('')
    setFiltroExpediente('')
    setFiltroPrioridad('')
  }
  const hayFiltrosActivos = tipoFiltro !== '' || busqueda !== '' || filtroExpediente !== '' || filtroPrioridad !== '' || filtroLetrado !== ''

  const abogados = USUARIOS.filter(u => u.rolSistema === 'ABOGADO' || u.rolSistema === 'COORDINADOR')

  // ── Estado solicitudes ────────────────────────────────────────────────────
  const { solicitudes, responderSolicitud } = useSolicitudesStore()
  const [vista, setVista] = useState<'mis_solicitudes' | 'mis_pedidos'>('mis_solicitudes')
  const [modalRespuesta, setModalRespuesta] = useState<Solicitud | null>(null)
  const [modalVer, setModalVer] = useState<Solicitud | null>(null)
  const [respForm, setRespForm] = useState({ comentario: '', adjunto_nombre: '', adjunto_size: '' })
  const [menuSol, setMenuSol] = useState<string | null>(null)

  const uid = usuarioActivo?.id ?? ''
  const esCoordinador = usuarioActivo?.rolSistema === 'COORDINADOR'
  const esGerente = usuarioActivo?.rolSistema === 'REFERENTE'

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(s => {
      if (vista === 'mis_solicitudes' && s.creado_por !== uid) return false
      if (vista === 'mis_pedidos' && !s.asignado_a.includes(uid)) return false
      if (tipoFiltro === 'interna' && s.tipo !== 'interna') return false
      if (tipoFiltro === 'externa' && s.tipo !== 'externa') return false
      if (filtroPrioridad && s.prioridad !== filtroPrioridad) return false
      if (filtroExpediente && !s.expediente_id.toLowerCase().includes(filtroExpediente.toLowerCase())) return false
      if (filtroLetrado && s.creado_por !== filtroLetrado) return false
      if (busqueda && !s.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false
      return true
    })
  }, [solicitudes, vista, uid, tipoFiltro, filtroPrioridad, filtroExpediente, filtroLetrado, busqueda])

  function puedeAdjuntar(s: Solicitud): boolean {
    if (s.estado === 'respondida') return false
    if (s.tipo === 'externa' && s.creado_por === uid) return true
    if (s.tipo === 'interna' && s.asignado_a.includes(uid)) return true
    return false
  }

  function guardarRespuesta() {
    if (!modalRespuesta || !respForm.comentario.trim()) return
    responderSolicitud(modalRespuesta.id, {
      comentario: respForm.comentario,
      adjunto_nombre: respForm.adjunto_nombre || undefined,
      adjunto_size: respForm.adjunto_size || undefined,
      respondido_por: uid,
      fecha: new Date().toISOString().split('T')[0],
    })
    if (modalRespuesta.tipo === 'interna') {
      useNotificacionesStore.getState().agregarNotificacion({
        tipo: 'ALERTA_VENCIMIENTO',
        titulo: `Respuesta: ${modalRespuesta.titulo}`,
        descripcion: `${getNombreCompleto(getUsuarioById(uid)!)} respondió tu solicitud.`,
        expedienteId: modalRespuesta.expediente_id,
        tipoGestion: '', caratula: modalRespuesta.expediente_caratula,
        numeroCausa: null, leida: false,
        fecha: new Date().toISOString(),
        destinatarioId: modalRespuesta.creado_por,
      })
    }
    toast.success('Respuesta registrada. Solicitud marcada como cumplida.')
    setModalRespuesta(null)
    setRespForm({ comentario: '', adjunto_nombre: '', adjunto_size: '' })
  }

  const PRIORIDAD_COLOR: Record<string, string> = {
    alta: 'bg-[#fee2e2] text-[#b91c1c]',
    media: 'bg-[#fef3c7] text-[#d97706]',
    baja: 'bg-[#e8e8e8] text-[#4a6a84]',
  }

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">

      {/* Header */}
      <div>
        <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57]">Solicitudes</h1>
        <p className="text-sm text-[#4a6a84] mt-1">
          {solicitudesFiltradas.length} solicitud{solicitudesFiltradas.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Toggle mis solicitudes / mis pedidos */}
      <div className="flex items-center gap-3 flex-wrap">
        {(['mis_solicitudes', 'mis_pedidos'] as const).map(v => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
              vista === v
                ? 'bg-[#1b3a57] text-white'
                : 'bg-white border border-[rgba(0,0,0,0.10)] text-[#4a6a84] hover:text-[#1b3a57]'
            }`}
          >
            {v === 'mis_solicitudes' ? 'Mis solicitudes' : 'Mis pedidos'}
          </button>
        ))}
        <p className="text-[11px] text-[#7a9ab4]">
          {vista === 'mis_solicitudes'
            ? 'Solicitudes que hiciste a otros'
            : 'Pedidos que otros te hicieron a vos'}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-card px-5 py-3 flex items-center gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a84] pointer-events-none" />
          <input className="field-input pl-8 w-full text-sm" placeholder="Buscar solicitud..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <input className="field-input flex-1 min-w-0 text-sm" placeholder="N° actuación..." value={filtroExpediente} onChange={e => setFiltroExpediente(e.target.value)} />
        <select className="field-input flex-1 min-w-0 text-sm" value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value as TipoFiltro)}>
          <option value="">Interno / Externo</option>
          <option value="interna">Interna</option>
          <option value="externa">Externa</option>
        </select>
        <select className="field-input flex-1 min-w-0 text-sm" value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}>
          <option value="">Prioridad</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        {(esCoordinador || esGerente) && (
          <select className="field-input flex-1 min-w-0 text-sm" value={filtroLetrado} onChange={e => setFiltroLetrado(e.target.value)}>
            <option value="">Todos los letrados</option>
            {abogados.map(u => <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>)}
          </select>
        )}
        {hayFiltrosActivos && (
          <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs font-bold text-[#4a6a84] hover:text-[#1b3a57] transition-colors">
            <Icon name="filter_alt_off" size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.06)]">
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">Actuación</th>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">Solicitud</th>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">
                {vista === 'mis_solicitudes' ? 'Dirigida a' : 'Solicitado por'}
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">Prioridad</th>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">Fecha límite</th>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
            {solicitudesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <Icon name="inbox" size={32} className="text-[#c0c0c0] mx-auto mb-2" />
                  <p className="text-sm text-[#7a9ab4]">Sin solicitudes para mostrar.</p>
                </td>
              </tr>
              ) : solicitudesFiltradas.map((s, idx) => {
              const vencida = s.fecha_limite && s.fecha_limite < HOY && s.estado !== 'respondida'
              return (
                <tr key={s.id} className="hover:bg-[#f9fbfc] transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(RUTAS.EXPEDIENTE(s.expediente_id))} className="flex items-center gap-1.5 group">
                      <Icon name="folder" size={13} className="text-[#4a6a84]" />
                      <span className="font-mono text-xs font-bold text-[#4a6a84] group-hover:text-[#1b3a57] transition-colors">{s.expediente_id}</span>
                      <AreaBadge area={s.expediente_area} />
                    </button>
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-sm font-semibold text-[#1b3a57] truncate">{s.titulo}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        s.tipo === 'interna' ? 'bg-[#dbeafe] text-[#1b3a57]' : 'bg-[#f3e8ff] text-[#7c3aed]'
                      }`}>
                        {s.tipo === 'interna' ? 'Interna' : 'Externa'}
                      </span>
                    </div>
                    {s.descripcion && <p className="text-[11px] text-[#4a6a84] truncate">{s.descripcion}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-[#1b3a57]">
                      {vista === 'mis_solicitudes'
                        ? s.asignado_a_nombre
                        : (() => {
                            const u = USUARIOS.find(u => u.id === s.creado_por)
                            return u ? `${u.apellido}, ${u.nombre}` : s.creado_por
                          })()
                      }
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${PRIORIDAD_COLOR[s.prioridad]}`}>
                      {s.prioridad.charAt(0).toUpperCase() + s.prioridad.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.fecha_limite ? (
                      <span className={`flex items-center gap-1 text-xs font-medium ${vencida ? 'text-[#b91c1c]' : 'text-[#4a6a84]'}`}>
                        {vencida && <Icon name="warning" size={12} />}
                        {formatFecha(s.fecha_limite)}
                      </span>
                    ) : <span className="text-[11px] text-[#c0c0c0]">Sin fecha</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                      s.estado === 'respondida' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#d97706]'
                    }`}>
                      <Icon name={s.estado === 'respondida' ? 'check_circle' : 'schedule'} size={11} />
                      {s.estado === 'respondida' ? 'Respondida' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setMenuSol(menuSol === s.id ? null : s.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
                      >
                        <Icon name="more_vert" size={16} />
                      </button>
                      {menuSol === s.id && (
                        <div
                          className={`absolute right-0 w-48 bg-white rounded-xl shadow-card-lg border border-[rgba(0,0,0,0.10)] z-20 py-1 ${
                            idx === 0 && solicitudesFiltradas.length > 1 ? 'top-full mt-1' : 'bottom-full mb-1'
                          }`}
                          onMouseLeave={() => setMenuSol(null)}
                        >
                          <button onClick={() => { setModalVer(s); setMenuSol(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#1b3a57] hover:bg-[#f5f5f5]">
                            <Icon name="visibility" size={14} /> Ver detalle
                          </button>
                          {puedeAdjuntar(s) && (
                            <button onClick={() => { setModalRespuesta(s); setMenuSol(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#1b3a57] hover:bg-[#f5f5f5]">
                              <Icon name="attach_file" size={14} /> Adjuntar respuesta
                            </button>
                          )}
                          <button onClick={() => { navigate(RUTAS.EXPEDIENTE(s.expediente_id)); setMenuSol(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#1b3a57] hover:bg-[#f5f5f5]">
                            <Icon name="open_in_new" size={14} /> Ver actuación
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal ver detalle */}
      <Modal open={!!modalVer} onClose={() => setModalVer(null)} titulo="Detalle de solicitud" size="md"
        footer={<button onClick={() => setModalVer(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8]">Cerrar</button>}
      >
        {modalVer && (
          <div className="space-y-4">
            <div className="space-y-0">
              {([
                ['Actuación', modalVer.expediente_id],
                ['Título', modalVer.titulo],
                ['Descripción', modalVer.descripcion],
                ['Tipo', modalVer.tipo === 'interna' ? 'Interna' : 'Externa'],
                ['Prioridad', modalVer.prioridad.charAt(0).toUpperCase() + modalVer.prioridad.slice(1)],
                ['Dirigida a', modalVer.asignado_a_nombre],
                ['Fecha límite', modalVer.fecha_limite ? formatFecha(modalVer.fecha_limite) : 'Sin fecha'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex gap-3 py-2.5 border-b border-[rgba(0,0,0,0.06)] last:border-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84] w-28 flex-shrink-0 pt-0.5">{label}</span>
                  <span className="text-sm text-[#1b3a57]">{value}</span>
                </div>
              ))}
            </div>
            {modalVer.respuesta && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Respuesta</p>
                <p className="text-sm text-[#1b3a57]">{modalVer.respuesta.comentario}</p>
                {modalVer.respuesta.adjunto_nombre && (
                  <div className="flex items-center gap-2 mt-1">
                    <Icon name="attach_file" size={13} className="text-[#4a6a84]" />
                    <span className="text-xs text-[#4a6a84]">{modalVer.respuesta.adjunto_nombre}</span>
                    <button className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#1b3a57] text-white hover:opacity-80 transition-opacity ml-1">
                      <Icon name="download" size={11} />
                      Descargar
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-[#7a9ab4]">
                  {formatFecha(modalVer.respuesta.fecha)} · {(() => {
                    const u = getUsuarioById(modalVer.respuesta.respondido_por)
                    return u ? getNombreCompleto(u) : modalVer.respuesta.respondido_por
                  })()}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal adjuntar respuesta */}
      <Modal open={!!modalRespuesta} onClose={() => setModalRespuesta(null)} titulo="Adjuntar respuesta" size="md"
        footer={
          <>
            <button onClick={() => setModalRespuesta(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8]">Cancelar</button>
            <button
              onClick={guardarRespuesta}
              disabled={!respForm.comentario.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Icon name="save" size={15} /> Guardar respuesta
            </button>
          </>
        }
      >
        {modalRespuesta && (
          <div className="space-y-4">
            <div className="bg-[#f5f5f5] rounded-xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84] mb-1">Solicitud</p>
              <p className="text-sm font-semibold text-[#1b3a57]">{modalRespuesta.titulo}</p>
              <p className="text-xs text-[#4a6a84] mt-0.5">{modalRespuesta.descripcion}</p>
            </div>
            <div>
              <label className="field-label">Comentario <span className="text-[#b91c1c]">*</span></label>
              <textarea
                className="field-input w-full resize-y"
                style={{ minHeight: 80 }}
                placeholder="Describí la respuesta o lo que estás adjuntando..."
                value={respForm.comentario}
                onChange={e => setRespForm(p => ({ ...p, comentario: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label">Adjunto (opcional)</label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[rgba(0,0,0,0.15)] cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                <Icon name="attach_file" size={18} className="text-[#4a6a84]" />
                <span className="text-sm text-[#4a6a84]">{respForm.adjunto_nombre || 'Seleccionar archivo...'}</span>
                <input type="file" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) setRespForm(p => ({ ...p, adjunto_nombre: f.name, adjunto_size: `${(f.size / 1024).toFixed(0)} KB` }))
                }} />
              </label>
              {respForm.adjunto_nombre && (
                <p className="text-[10px] text-[#4a6a84] mt-1">{respForm.adjunto_nombre} · {respForm.adjunto_size}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}