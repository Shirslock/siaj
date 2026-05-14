import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { TIPOS_GESTION, JUZGADOS, TRIBUNALES, FISCALIAS, UFIS, COMISARIAS } from '../../data/catalogos'
import { USUARIOS, getNombreCompleto } from '../../data/usuarios'
import { ESTADOS_POR_TIPO } from '../../data/expedientes.mock'
import { DatosTab }          from './tabs/DatosTab'
import { VinculosTab }       from './tabs/VinculosTab'
import { IntervinientesTab } from './tabs/IntervinientesTab'
import { TimelineTab }       from './tabs/TimelineTab'
import { DocumentosTab }     from './tabs/DocumentosTab'
import { PrevisionTab }      from './tabs/PrevisionTab'

type Tab = 'datos' | 'vinculos' | 'intervinientes' | 'timeline' | 'docs' | 'prevision'
type AccionMenu = 'estado' | 'causa' | 'desagrupar' | 'reasignar'

const ALL_JUZGADOS = [...JUZGADOS, ...TRIBUNALES, ...FISCALIAS, ...UFIS, ...COMISARIAS]

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'datos',          label: 'Datos',          icon: 'info' },
  { key: 'vinculos',       label: 'Vinculados',     icon: 'account_tree' },
  { key: 'intervinientes', label: 'Intervinientes', icon: 'people' },
  { key: 'timeline',       label: 'Timeline',       icon: 'timeline' },
  { key: 'docs',           label: 'Documentos',     icon: 'folder' },
  { key: 'prevision',      label: 'Previsión',      icon: 'trending_up' },
]

export default function DetalleExpedientePage() {
  const params = useParams()
  const expId = params['*'] ?? ''

  const { expedienteActivo: exp, setExpedienteActivo, actualizarEstado, asignarAbogado, actualizarExpediente } = useExpedientesStore()
  const { showToast } = useUIStore()

  const [tab, setTab] = useState<Tab>('datos')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accion, setAccion] = useState<AccionMenu | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevaCausa, setNuevaCausa] = useState('')
  const [nuevoAbogado, setNuevoAbogado] = useState('')

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
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant">search_off</span>
          <p className="mt-4 text-on-surface font-medium">Expediente no encontrado</p>
          <p className="text-sm text-on-surface-variant mt-1 font-mono">{expId}</p>
          <Link to="/bandeja/abogado" className="inline-block mt-4 text-sm text-primary hover:underline">
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

  function openAccion(a: AccionMenu) {
    setMenuOpen(false)
    if (a === 'estado') setNuevoEstado(exp.estado)
    if (a === 'causa')  setNuevaCausa(exp.numero_causa ?? '')
    if (a === 'reasignar') setNuevoAbogado(exp.abogado_id ?? '')
    setAccion(a)
  }

  function confirmarEstado() {
    if (!nuevoEstado || nuevoEstado === exp.estado) { setAccion(null); return }
    actualizarEstado(exp.id, nuevoEstado)
    showToast(`Estado actualizado a "${nuevoEstado}".`, 'success')
    setAccion(null)
  }

  function confirmarCausa() {
    actualizarExpediente(exp.id, { numero_causa: nuevaCausa.trim() || null })
    showToast('N° Causa actualizado.', 'success')
    setAccion(null)
  }

  function confirmarDesagrupar() {
    actualizarExpediente(exp.id, { numero_causa: null })
    showToast('Expediente desagrupado de la causa.', 'success')
    setAccion(null)
  }

  function confirmarReasignar() {
    if (!nuevoAbogado) { setAccion(null); return }
    asignarAbogado(exp.id, nuevoAbogado)
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
    <div className="p-6 space-y-5 max-w-screen-xl">

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-3">
          <Link to="/bandeja/abogado" className="hover:text-primary transition-colors">Mi Bandeja</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface">Expediente</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-mono font-bold text-lg text-primary">{exp.id}</span>
              <AreaBadge area={exp.area} />
              <EstadoBadge code={exp.estado} label={exp.estado} />
              {exp.numero_causa && (
                <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-mono">
                  {exp.numero_causa}
                </span>
              )}
            </div>
            <h1 className="font-headline font-bold text-xl text-on-surface leading-snug">{exp.caratula}</h1>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-on-surface-variant flex-wrap">
              <span>{tipoLabel}</span>
              {juzgadoLabel && (
                <>
                  <span className="text-outline-variant">·</span>
                  <span>{juzgadoLabel}</span>
                </>
              )}
            </div>
          </div>

          {/* Acción menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Acciones
              <span className="material-symbols-outlined text-[16px]">{menuOpen ? 'expand_less' : 'expand_more'}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-surface-container-lowest rounded-xl shadow-card-lg z-10 overflow-hidden border border-outline-variant/40">
                {[
                  { key: 'estado' as AccionMenu,    icon: 'swap_horiz',    label: 'Cambiar estado' },
                  { key: 'causa' as AccionMenu,     icon: 'link',          label: 'Agrupar a causa' },
                  { key: 'desagrupar' as AccionMenu,icon: 'link_off',      label: 'Desagrupar', disabled: !exp.numero_causa },
                  { key: 'reasignar' as AccionMenu, icon: 'person_search', label: 'Reasignar' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => !item.disabled && openAccion(item.key)}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                      item.disabled
                        ? 'text-on-surface-variant opacity-40 cursor-not-allowed'
                        : 'text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? 'bg-surface-container-lowest shadow-sm text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
            {tabCounters[t.key] !== undefined && (
              <span className="text-xs bg-surface-container-high rounded-full px-1.5 py-0.5 text-on-surface-variant">
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
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarEstado}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity"
            >
              Confirmar
            </button>
          </>
        }
      >
        <div>
          <label className="field-label">Nuevo estado</label>
          <select className="field-input w-full" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
            <option value="">Seleccionar…</option>
            {estadosPosibles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Modal>

      {/* Modal: Agrupar a causa */}
      <Modal
        open={accion === 'causa'}
        onClose={() => setAccion(null)}
        titulo="Agrupar a causa"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarCausa}
              disabled={!nuevaCausa.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity"
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
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
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
        <p className="text-sm text-on-surface">
          Se desvinculará el expediente <span className="font-mono font-bold">{exp.id}</span> de la causa{' '}
          <span className="font-mono font-bold">{exp.numero_causa}</span>.
        </p>
        <p className="text-xs text-on-surface-variant mt-2">Esta acción no elimina los datos del expediente.</p>
      </Modal>

      {/* Modal: Reasignar */}
      <Modal
        open={accion === 'reasignar'}
        onClose={() => setAccion(null)}
        titulo="Reasignar expediente"
        size="sm"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarReasignar}
              disabled={!nuevoAbogado}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity"
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
