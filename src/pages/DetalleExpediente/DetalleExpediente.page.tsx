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
import { getEtapasPenales } from '../../data/etapasPenales'
import { DatosTab }          from './tabs/DatosTab'
import { VinculosTab }       from './tabs/VinculosTab'
import { IntervinientesTab } from './tabs/IntervinientesTab'
import { TimelineTab }       from './tabs/TimelineTab'
import { DocumentosTab }     from './tabs/DocumentosTab'
import { PrevisionTab }      from './tabs/PrevisionTab'
import Icon from '../../components/ui/Icon'
import { toast } from 'react-toastify'

type Tab = 'datos' | 'vinculos' | 'intervinientes' | 'timeline' | 'docs' | 'prevision'
type AccionMenu = 'estado' | 'causa' | 'desagrupar' | 'reasignar' | 'iniciar_juicio'

const ALL_JUZGADOS = [...JUZGADOS, ...TRIBUNALES, ...FISCALIAS, ...UFIS, ...COMISARIAS]
const HOY = new Date().toISOString().split('T')[0]
const TIPOS_CON_JUICIO = new Set([
  'COBRO_CANON', 'RECLAMO_CONTRAT', 'LANZAMIENTO', 'RECUPERO',
  'CONSIGNACION', 'DESAFUERO', 'EJECUCION_GAR', 'QUERELLA',
])

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
  const { usuarioActivo } = useUIStore()

  const [tab, setTab] = useState<Tab>('datos')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accion, setAccion] = useState<AccionMenu | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevaCausa, setNuevaCausa] = useState('')
  const [nuevoAbogado, setNuevoAbogado] = useState('')
  const [motivoEstado, setMotivoEstado] = useState('')
  const [formJuicio, setFormJuicio] = useState({
  oficio_judicial: '',
  tipo_intervencion: '',
  secretaria: '',
  numero_causa: '',
  juzgado: '',
  caratula: '',
  abogado_contraria: '',
  parte_actora: '',
  parte_demandada: 'SOFSE',
  coactores: '',
  codemandados: '',
  fecha_inicio: HOY,
  tipo_juicio: '',
  monto: '',
})

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
          <Icon name="search_off" size={48} />
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
    if (a === 'estado') { setNuevoEstado(exp!.area === 'PENAL' ? '' : exp!.estado); setMotivoEstado('') }
    if (a === 'causa')  setNuevaCausa(exp!.numero_causa ?? '')
    if (a === 'reasignar') setNuevoAbogado(exp!.abogado_id ?? '')
    if (a === 'iniciar_juicio') {
      setFormJuicio(p => ({ ...p, caratula: exp!.caratula, numero_causa: exp!.numero_causa ?? '' }))
    }
    setAccion(a)
  }

  function confirmarEstado() {
    if (exp!.area === 'PENAL') {
      if (!nuevoEstado || nuevoEstado === exp!.estadoProcesal) { setAccion(null); return }
      const etapas = getEtapasPenales(exp!.tipo)
      const etapaActual = etapas.find(e => e.codigo === (exp!.estadoProcesal ?? exp!.estado))
      const etapaDestino = etapas.find(e => e.codigo === nuevoEstado)
      const nombre = usuarioActivo ? getNombreCompleto(usuarioActivo) : 'Usuario'
      agregarActividad(exp!.id, {
        id: `ACT_${Date.now()}`,
        expediente_id: exp!.id,
        tipo: 'MOVIMIENTO',
        titulo: `Cambio de estado: ${etapaActual?.label ?? exp!.estadoProcesal} → ${etapaDestino?.label ?? nuevoEstado}`,
        descripcion: motivoEstado.trim() || `Estado avanzado por ${nombre}.`,
        fecha: HOY,
        activo: true,
        subitems: [],
        estadoExpediente: nuevoEstado,
        doc_gde: null,
        creado_por: usuarioActivo?.id,
      })
      actualizarEstado(exp!.id, nuevoEstado)
      actualizarExpediente(exp!.id, { estadoProcesal: nuevoEstado })
      toast.success(`Estado actualizado a ${etapaDestino?.label ?? nuevoEstado}`)
      setMotivoEstado('')
      setAccion(null)
      return
    }
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
      toast.success(`Estado actualizado a ${siguienteEstadoProcesal.label}`)
      setMotivoEstado('')
      setAccion(null)
      return
    }
    if (!nuevoEstado || nuevoEstado === exp!.estado) { setAccion(null); return }
    actualizarEstado(exp!.id, nuevoEstado)
    toast.success(`Estado actualizado a "${nuevoEstado}".`)
    setAccion(null)
  }

  function confirmarCausa() {
    actualizarExpediente(exp!.id, { numero_causa: nuevaCausa.trim() || null })
    toast.success('N° Causa actualizado.')
    setAccion(null)
  }

  function confirmarDesagrupar() {
    actualizarExpediente(exp!.id, { numero_causa: null })
    toast.success('Expediente desagrupado de la causa.')
    setAccion(null)
  }

  function confirmarReasignar() {
    if (!nuevoAbogado) { setAccion(null); return }
    asignarAbogado(exp!.id, nuevoAbogado)
    toast.success('Expediente reasignado.')
    setAccion(null)
  }

  function confirmarIniciarJuicio() {
  actualizarExpediente(exp!.id, {
    numero_causa: formJuicio.numero_causa.trim() || exp!.numero_causa,
    campos_mesa: {
      ...exp!.campos_mesa,
      mesa_num_causa:     formJuicio.numero_causa,
      mesa_juzgado:       formJuicio.juzgado,
      mesa_secretaria:    formJuicio.secretaria,
      mesa_caratula:      formJuicio.caratula,
      mesa_abogado_contr: formJuicio.abogado_contraria,
      mesa_parte_actora:  formJuicio.parte_actora,
      mesa_parte_dem:     formJuicio.parte_demandada,
      mesa_coactores:     formJuicio.coactores,
      mesa_codemandados:  formJuicio.codemandados,
      mesa_fecha_inicio:  formJuicio.fecha_inicio,
      mesa_juicio:        formJuicio.tipo_juicio,
      mesa_monto:         formJuicio.monto,
      mesa_oficio_judicial: formJuicio.oficio_judicial,
      mesa_tipo_intervencion: formJuicio.tipo_intervencion,
    },
  })
  toast.success('Juicio iniciado y datos registrados.')
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
          <Icon name="chevron_right" size={14} />
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
              <Icon name="add" size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-card-lg z-10 overflow-hidden border border-[rgba(0,0,0,0.10)]">
                {[
                  { key: 'estado' as AccionMenu,    icon: 'swap_horiz',    label: 'Cambiar estado',  show: true },
                  { key: 'causa' as AccionMenu,     icon: 'link',          label: 'Agrupar a causa', show: !exp.numero_causa },
                  { key: 'desagrupar' as AccionMenu,icon: 'link_off',      label: 'Desagrupar',      show: !!exp.numero_causa },
                  { key: 'reasignar' as AccionMenu, icon: 'person_search', label: 'Reasignar',       show: puedeReasignar(usuarioActivo) },
                  { key: 'iniciar_juicio' as AccionMenu, icon: 'gavel', label: 'Iniciar Juicio', show: TIPOS_CON_JUICIO.has(exp.tipo) },
                ]
                .filter(item => item.show)
                .map(item => (
                  <button
                    key={item.key}
                    onClick={() => openAccion(item.key)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-[#1b3a57] hover:bg-[#e8e8e8] transition-colors"
                  >
                    <Icon name={item.icon} size={18} />
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
            <Icon name={t.icon} size={16} />
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
              disabled={exp.area === 'PENAL' ? !nuevoEstado : (!esFlujoProcesal && !nuevoEstado)}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Confirmar
            </button>
          </>
        }
      >
        {exp.area === 'PENAL' ? (
          <div className="space-y-4">
            <div>
              <label className="field-label">Nuevo estado procesal</label>
              <select className="field-input w-full" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
                <option value="">Seleccionar…</option>
                {getEtapasPenales(exp.tipo)
                  .filter(e => e.codigo !== 'ASIGNADO' && e.numero >= 0 && e.codigo !== exp.estadoProcesal)
                  .map(e => <option key={e.codigo} value={e.codigo}>{e.label}</option>)}
              </select>
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
        ) : esFlujoProcesal ? (
          <div className="space-y-4">
            <div className="bg-[rgba(196,223,232,0.30)] rounded-xl p-4 flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-[#4a6a84] uppercase tracking-wide">Estado actual</span>
                <span className="text-sm font-black text-[#1b3a57]">{estadoProcesalActual?.label}</span>
              </div>
              <Icon name="arrow_forward" size={24} />
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

      {/* Modal: Iniciar Juicio */}
      <Modal
        open={accion === 'iniciar_juicio'}
        onClose={() => setAccion(null)}
        titulo="Iniciar Juicio"
        size="lg"
        footer={
          <>
            <button onClick={() => setAccion(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirmarIniciarJuicio}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 transition-opacity"
            >
              <Icon name="gavel" size={16} />
              Confirmar Inicio
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Aviso */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Icon name="warning" size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">Confirmar inicio de acción judicial</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Esta acción registrará el inicio del proceso judicial para{' '}
                <span className="font-mono font-bold">{exp.id}</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Oficio Judicial (OJ)</label>
              <input type="text" className="field-input w-full" placeholder="OJ-2026-XXXX"
                value={formJuicio.oficio_judicial}
                onChange={e => setFormJuicio(p => ({ ...p, oficio_judicial: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Tipo de Intervención <span className="text-[#b91c1c]">*</span></label>
              <select className="field-input w-full"
                value={formJuicio.tipo_intervencion}
                onChange={e => setFormJuicio(p => ({ ...p, tipo_intervencion: e.target.value }))}>
                <option value="">— Seleccioná —</option>
                <option>Actora</option>
                <option>Demandada</option>
                <option>Sin Intervención</option>
              </select>
            </div>
            <div>
              <label className="field-label">Secretaría</label>
              <input type="text" className="field-input w-full" placeholder="Ej: Secretaría N°3"
                value={formJuicio.secretaria}
                onChange={e => setFormJuicio(p => ({ ...p, secretaria: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">N° de Causa <span className="text-[#b91c1c]">*</span></label>
              <input type="text" className="field-input w-full font-mono" placeholder="FSM-XXXXX/2026"
                value={formJuicio.numero_causa}
                onChange={e => setFormJuicio(p => ({ ...p, numero_causa: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="field-label">Juzgado</label>
              <select className="field-input w-full"
                value={formJuicio.juzgado}
                onChange={e => setFormJuicio(p => ({ ...p, juzgado: e.target.value }))}>
                <option value="">— Seleccioná juzgado —</option>
                {ALL_JUZGADOS.map(j => <option key={j.id} value={j.id}>{j.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="field-label">Carátula</label>
              <input type="text" className="field-input w-full"
                value={formJuicio.caratula}
                onChange={e => setFormJuicio(p => ({ ...p, caratula: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Abogado de la Contraria <span className="text-[#b91c1c]">*</span></label>
              <input type="text" className="field-input w-full" placeholder="Dr. Apellido, Nombre"
                value={formJuicio.abogado_contraria}
                onChange={e => setFormJuicio(p => ({ ...p, abogado_contraria: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Parte Actora <span className="text-[#b91c1c]">*</span></label>
              <input type="text" className="field-input w-full" placeholder="Nombre del actor"
                value={formJuicio.parte_actora}
                onChange={e => setFormJuicio(p => ({ ...p, parte_actora: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Parte Demandada <span className="text-[#b91c1c]">*</span></label>
              <input type="text" className="field-input w-full"
                value={formJuicio.parte_demandada}
                onChange={e => setFormJuicio(p => ({ ...p, parte_demandada: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Coactores</label>
              <input type="text" className="field-input w-full" placeholder="Si corresponde"
                value={formJuicio.coactores}
                onChange={e => setFormJuicio(p => ({ ...p, coactores: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Codemandados</label>
              <input type="text" className="field-input w-full" placeholder="Si corresponde"
                value={formJuicio.codemandados}
                onChange={e => setFormJuicio(p => ({ ...p, codemandados: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Fecha de Inicio <span className="text-[#b91c1c]">*</span></label>
              <input type="date" className="field-input w-full"
                value={formJuicio.fecha_inicio}
                onChange={e => setFormJuicio(p => ({ ...p, fecha_inicio: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Tipo de Juicio <span className="text-[#b91c1c]">*</span></label>
              <select className="field-input w-full"
                value={formJuicio.tipo_juicio}
                onChange={e => setFormJuicio(p => ({ ...p, tipo_juicio: e.target.value }))}>
                <option value="">— Seleccioná —</option>
                {['DAÑOS Y PERJUICIOS','COBRO DE SUMAS DE DINERO','EJECUTIVO O PREPARACIÓN VÍA EJECUTIVA',
                  'ACCIDENTE - ACCIÓN CIVIL','AMPARO','BENEFICIO DE LSG','CONSIGNACIÓN','OTROS']
                  .map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Monto de la Demanda <span className="text-[#b91c1c]">*</span></label>
              <input type="number" className="field-input w-full" placeholder="$ 0"
                value={formJuicio.monto}
                onChange={e => setFormJuicio(p => ({ ...p, monto: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
