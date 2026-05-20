import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { TIPOS_GESTION, JUZGADOS, TRIBUNALES, FISCALIAS, UFIS, COMISARIAS } from '../../data/catalogos'
import { USUARIOS, getNombreCompleto, puedeReasignar } from '../../data/usuarios'
import { ESTADOS_POR_TIPO } from '../../data/expedientes.mock'
import { getEstadoProcesal } from '../../data/estadosProcesales'
import { DatosTab }          from './tabs/DatosTab'
import { VinculosTab }       from './tabs/VinculosTab'
import { IntervinientesTab } from './tabs/IntervinientesTab'
import { TimelineTab }       from './tabs/TimelineTab'
import { DocumentosTab }     from './tabs/DocumentosTab'
import { PrevisionTab }      from './tabs/PrevisionTab'

type Tab = 'datos' | 'vinculos' | 'intervinientes' | 'timeline' | 'docs' | 'prevision'
type AccionMenu = 'estado' | 'causa' | 'desagrupar' | 'reasignar'

const ALL_JUZGADOS = [...JUZGADOS, ...TRIBUNALES, ...FISCALIAS, ...UFIS, ...COMISARIAS]
const HOY = new Date().toISOString().split('T')[0]

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'datos',          label: 'Datos',          icon: 'info' },
  { key: 'timeline',       label: 'Timeline',       icon: 'timeline' },
  { key: 'intervinientes', label: 'Intervinientes', icon: 'people' },
  { key: 'docs',           label: 'Documentos',     icon: 'folder' },
  { key: 'prevision',      label: 'Previsión',      icon: 'trending_up' },
  { key: 'vinculos',       label: 'Vinculados',     icon: 'account_tree' },
]

export default function DetalleExpedientePage() {
  const params = useParams()
  const expId = params['*'] ?? ''

  const { expedienteActivo: exp, setExpedienteActivo, actualizarEstado, asignarAbogado, actualizarExpediente, agregarActividad } = useExpedientesStore()
  const { showToast, usuarioActivo } = useUIStore()

  const [tab, setTab] = useState<Tab>('datos')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accion, setAccion] = useState<AccionMenu | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevaCausa, setNuevaCausa] = useState('')
  const [nuevoAbogado, setNuevoAbogado] = useState('')
  const [motivoEstado, setMotivoEstado] = useState('')

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expId) setExpedienteActivo(expId)
  }, [expId, setExpedienteActivo])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!exp) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#4a6a84]">search_off</span>
          <p className="mt-4 text-[#1b3a57] font-medium">Expediente no encontrado</p>
          <p className="text-sm text-[#4a6a84] mt-1 font-mono">{expId}</p>
          <Link to="/bandeja/abogado" className="inline-block mt-4 text-sm text-[#1b3a57] hover:underline">
            Volver a la bandeja
          </Link>
        </div>
      </div>
    )
  }

  const tipoLabel    = TIPOS_GESTION.find(t => t.code === exp.tipo)?.label ?? exp.tipo
  const juzgadoLabel = exp.juzgado ? (ALL_JUZGADOS.find(j => j.id === exp.juzgado)?.label ?? exp.juzgado) : null
  const estadosPosibles = ESTADOS_POR_TIPO[exp.tipo] ?? []
  const abogadosArea = USUARIOS.filter(u => u.areas.includes(exp.area) && u.rolSistema !== 'ADMINISTRATIVO')

  const estadoProcesalActual = getEstadoProcesal(exp.tipo, exp.estadoProcesal ?? exp.estado)
  const siguienteEstadoProcesal = estadoProcesalActual?.siguiente
    ? getEstadoProcesal(exp.tipo, estadoProcesalActual.siguiente)
    : undefined
  const esFlujoProcesal = !!siguienteEstadoProcesal

  function openAccion(a: AccionMenu) {
    setMenuOpen(false)
    if (a === 'estado') { setNuevoEstado(exp!.estado); setMotivoEstado('') }
    if (a === 'causa')  setNuevaCausa(exp!.numero_causa ?? '')
    if (a === 'reasignar') setNuevoAbogado(exp!.abogado_id ?? '')
    setAccion(a)
  }

  function confirmarEstado() {
    if (esFlujoProcesal && siguienteEstadoProcesal) {
      const nombre = usuarioActivo ? getNombreCompleto(usuarioActivo) : 'Usuario'
      agregarActividad(exp!.id, {
        id: `ACT_${Date.now()}`,
        expediente_id: exp!.id,
        tipo: 'MOVIMIENTO',
        titulo: `Cambio de estado: ${estadoProcesalActual!.label} → ${siguienteEstadoProcesal.label}`,
        descripcion: motivoEstado.trim() || `Estado avanzado por ${nombre}.`,
        fecha: HOY,
        activo: true,
        subitems: [],
        estadoExpediente: siguienteEstadoProcesal.codigo,
        doc_gde: null,
        creado_por: usuarioActivo?.id,
      })
      actualizarEstado(exp!.id, siguienteEstadoProcesal.codigo)
      actualizarExpediente(exp!.id, { estadoProcesal: siguienteEstadoProcesal.codigo })
      showToast(`Estado actualizado a ${siguienteEstadoProcesal.label}`, 'success')
      setMotivoEstado('')
      setAccion(null)
      return
    }
    if (!nuevoEstado || nuevoEstado === exp!.estado) { setAccion(null); return }
    actualizarEstado(exp!.id, nuevoEstado)
    showToast(`Estado actualizado a "${nuevoEstado}".`, 'success')
    setAccion(null)
  }

  function confirmarCausa() {
    actualizarExpediente(exp!.id, { numero_causa: nuevaCausa.trim() || null })
    showToast('N° Causa actualizado.', 'success')
    setAccion(null)
  }

  function confirmarDesagrupar() {
    actualizarExpediente(exp!.id, { numero_causa: null })
    showToast('Expediente desagrupado de la causa.', 'success')
    setAccion(null)
  }

  function confirmarReasignar() {
    if (!nuevoAbogado) { setAccion(null); return }
    asignarAbogado(exp!.id, nuevoAbogado)
    showToast('Expediente reasignado.', 'success')
    setAccion(null)
  }

  const tabCounters: Partial<Record<Tab, number>> = {
    vinculos:       exp.vinculos.length,
    intervinientes: exp.intervinientes.length,
    timeline:       exp.timeline.length,
    docs:           exp.documentos.length,
  }

  return (
    <div className="p-6 space-y-5 max-w-screen-xl overflow-hidden">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#4a6a84] mb-3">
          <Link to="/bandeja/abogado" className="hover:text-[#1b3a57] transition-colors">Mi Bandeja</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1b3a57]">Expediente</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-mono font-bold text-lg text-[#1b3a57]">{exp.id}</span>
              <AreaBadge area={exp.area} />
              <EstadoBadge code={exp.estado} label={exp.estado} />
              {exp.numero_causa && (
                <span className="text-[10px] font-bold bg-[#e8e8e8] text-[#4a6a84] px-2 py-0.5 rounded-full font-mono">
                  {exp.numero_causa}
                </span>
              )}
            </div>
            <h1 className="font-headline font-bold text-xl text-[#1b3a57] leading-snug">{exp.caratula}</h1>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-[#4a6a84] flex-wrap">
              <span>{tipoLabel}</span>
              {juzgadoLabel && (
                <>
                  <span className="text-[rgba(0,0,0,0.35)]">·</span>
                  <span>{juzgadoLabel}</span>
                </>
              )}
            </div>
          </div>

          {/* Acción menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1b3a57] text-white hover:opacity-90 transition-opacity shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-card-lg z-10 overflow-hidden border border-[rgba(0,0,0,0.10)]">
                {[
                  { key: 'estado' as AccionMenu,    icon: 'swap_horiz',    label: 'Cambiar estado',  show: true },
                  { key: 'causa' as AccionMenu,     icon: 'link',          label: 'Agrupar a causa', show: !exp.numero_causa },
                  { key: 'desagrupar' as AccionMenu,icon: 'link_off',      label: 'Desagrupar',      show: !!exp.numero_causa },
                  { key: 'reasignar' as AccionMenu, icon: 'person_search', label: 'Reasignar',       show: puedeReasignar(usuarioActivo) },
                ]
                .filter(item => item.show)
                .map(item => (
                  <button
                    key={item.key}
                    onClick={() => openAccion(item.key)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-[#1b3a57] hover:bg-[#e8e8e8] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#4a6a84]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[rgba(0,0,0,0.10)] w-full">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-px ${
              tab === t.key
                ? 'border-[#1b3a57] text-[#1b3a57]'
                : 'border-transparent text-[#4a6a84] hover:text-[#1b3a57]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
            {tabCounters[t.key] !== undefined && (
              <span className="text-xs bg-[#e0e0e0] rounded-full px-1.5 py-0.5 text-[#4a6a84]">
                {tabCounters[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'datos'          && <DatosTab          exp={exp} />}
      {tab === 'vinculos'       && <VinculosTab        exp={exp} />}
      {tab === 'intervinientes' && <IntervinientesTab  exp={exp} />}
      {tab === 'timeline'       && <TimelineTab        exp={exp} />}
      {tab === 'docs'           && <DocumentosTab      exp={exp} />}
      {tab === 'prevision'      && <PrevisionTab       exp={exp} />}

      {/* Modal: Cambiar estado */}
      <Modal
        open={accion === 'estado'}
        onClose={() => setAccion(null)}
        titulo="Cambiar estado"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarEstado}
              disabled={!esFlujoProcesal && !nuevoEstado}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Confirmar
            </button>
          </>
        }
      >
        {esFlujoProcesal ? (
          <div className="space-y-4">
            <div className="bg-[rgba(196,223,232,0.30)] rounded-xl p-4 flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-[#4a6a84] uppercase tracking-wide">Estado actual</span>
                <span className="text-sm font-black text-[#1b3a57]">{estadoProcesalActual?.label}</span>
              </div>
              <span className="material-symbols-outlined text-2xl text-[#1b3a57]">arrow_forward</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-[#4a6a84] uppercase tracking-wide">Nuevo estado</span>
                <span className="text-sm font-black text-[#1b3a57]">{siguienteEstadoProcesal?.label}</span>
              </div>
            </div>
            <div>
              <label className="field-label">Motivo (opcional)</label>
              <textarea
                className="field-input resize-none h-20 w-full"
                placeholder="Anotá el motivo del cambio..."
                value={motivoEstado}
                onChange={e => setMotivoEstado(e.target.value)}
              />
            </div>
            <p className="text-xs text-[#4a6a84] italic text-center">
              Esta acción quedará registrada en el timeline.
            </p>
          </div>
        ) : (
          <div>
            <label className="field-label">Nuevo estado</label>
            <select className="field-input w-full" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
              <option value="">Seleccionar…</option>
              {estadosPosibles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </Modal>

      {/* Modal: Agrupar a causa */}
      <Modal
        open={accion === 'causa'}
        onClose={() => setAccion(null)}
        titulo="Agrupar a causa"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarCausa}
              disabled={!nuevaCausa.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Agrupar
            </button>
          </>
        }
      >
        <div>
          <label className="field-label">N° Causa</label>
          <input
            type="text"
            className="field-input w-full font-mono"
            placeholder="Ej: 12345/2026"
            value={nuevaCausa}
            onChange={e => setNuevaCausa(e.target.value)}
            autoFocus
          />
          <p className="field-hint">Ingresá el número de causa a la que se agrupará este expediente.</p>
        </div>
      </Modal>

      {/* Modal: Desagrupar */}
      <Modal
        open={accion === 'desagrupar'}
        onClose={() => setAccion(null)}
        titulo="Desagrupar expediente"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarDesagrupar}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:opacity-90 transition-opacity"
            >
              Desagrupar
            </button>
          </>
        }
      >
        <p className="text-sm text-[#1b3a57]">
          Se desvinculará el expediente <span className="font-mono font-bold">{exp.id}</span> de la causa{' '}
          <span className="font-mono font-bold">{exp.numero_causa}</span>.
        </p>
        <p className="text-xs text-[#4a6a84] mt-2">Esta acción no elimina los datos del expediente.</p>
      </Modal>

      {/* Modal: Reasignar */}
      <Modal
        open={accion === 'reasignar'}
        onClose={() => setAccion(null)}
        titulo="Reasignar expediente"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarReasignar}
              disabled={!nuevoAbogado}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Reasignar
            </button>
          </>
        }
      >
        <div>
          <label className="field-label">Letrado/a</label>
          <select className="field-input w-full" value={nuevoAbogado} onChange={e => setNuevoAbogado(e.target.value)}>
            <option value="">Sin asignar</option>
            {abogadosArea.map(u => (
              <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}
