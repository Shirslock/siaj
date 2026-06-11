import { useState } from 'react'
import type { TablaConfig } from './tablas.config'
import { DATOS_SOLO_LECTURA } from './tablas.config'
import { useConfiguracionStore } from '../../store/configuracion.store'
import { Modal } from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import type { CatalogoItem, CatalogoItemExtended, TipoGestionItem, Area, Canal } from '../../types'

interface Props { tabla: TablaConfig }

const AREA_BADGES: Record<string, string> = {
  CIVIL:    'bg-blue-100 text-blue-700',
  LABORAL:  'bg-amber-100 text-amber-700',
  PENAL:    'bg-red-100 text-red-700',
}

const TIPOS_ORGANISMO = ['Juzgado', 'Tribunal', 'Fiscalía', 'UFI', 'Comisaría']
const AREAS: Area[] = ['CIVIL', 'LABORAL', 'PENAL']
const CANALES: Canal[] = ['EE_GDE', 'MEMO_GDE', 'OTROS']

function BadgeActivo({ activo }: { activo?: boolean }) {
  const inactivo = activo === false
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
      inactivo ? 'bg-[#e8e8e8] text-[#9a9a9a]' : 'bg-green-100 text-green-700'
    }`}>
      {inactivo ? 'Inactivo' : 'Activo'}
    </span>
  )
}

// ── Solo Lectura ─────────────────────────────────────────────────────────────

function VistaLectura({ tabla }: { tabla: TablaConfig }) {
  const items = DATOS_SOLO_LECTURA[tabla.id] ?? []
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-[#1b3a57]">{tabla.label}</h2>
        <span className="flex items-center gap-1 text-[11px] text-[#9a9a9a] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
          <Icon name="block" size={12} /> Solo lectura
        </span>
      </div>
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.1)]">
              {['ID', 'Valor'].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-[#f8f8f8]">
                <td className="py-2.5 px-4 font-mono text-xs text-[#9a9a9a]">{item.id}</td>
                <td className="py-2.5 px-4 text-[#1b3a57] font-medium">{item.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Vista Simple ─────────────────────────────────────────────────────────────

function VistaSimple({ tabla }: { tabla: TablaConfig }) {
  const store = useConfiguracionStore()
  const items = (store[tabla.storeKey as keyof typeof store] as CatalogoItem[]) ?? []
  const { agregarItem, editarItem, desactivarItem } = store

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<CatalogoItem | null>(null)
  const [form, setForm] = useState({ id: '', label: '', dias: '' })

  const esSancion = tabla.especial === 'sancion'
  const modoEdicion = !!editando

  function abrirNuevo() {
    setEditando(null)
    setForm({ id: '', label: '', dias: '' })
    setModalAbierto(true)
  }

  function abrirEditar(item: CatalogoItem) {
    setEditando(item)
    setForm({ id: item.id, label: item.label, dias: '' })
    setModalAbierto(false) // se abre via editando
  }

  function cerrar() {
    setEditando(null)
    setModalAbierto(false)
    setForm({ id: '', label: '', dias: '' })
  }

  function guardar() {
    if (!form.label.trim()) return
    if (modoEdicion && editando) {
      editarItem(tabla.storeKey, editando.id, { label: form.label.trim() })
    } else {
      const id = form.id.trim() || `X_${Date.now()}`
      agregarItem(tabla.storeKey, { id, label: form.label.trim() })
    }
    cerrar()
  }

  const mostrarDias = esSancion && form.label.toLowerCase().includes('suspens')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1b3a57]">{tabla.label}</h2>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[#1b3a57] text-white hover:opacity-90 transition-opacity"
        >
          <Icon name="add" size={16} /> Nuevo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.1)]">
              {['ID', 'Valor', 'Estado', ''].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-[#f8f8f8]">
                <td className="py-2.5 px-4 font-mono text-xs text-[#9a9a9a]">{item.id}</td>
                <td className="py-2.5 px-4 text-[#1b3a57] font-medium">{item.label}</td>
                <td className="py-2.5 px-4"><BadgeActivo activo={item.activo} /></td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditar(item)}
                      title="Editar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#e8f0ff] hover:text-[#1b3a57] transition-colors"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={() => desactivarItem(tabla.storeKey, item.id)}
                      title="Desactivar"
                      disabled={item.activo === false}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Icon name="block" size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalAbierto || !!editando}
        onClose={cerrar}
        titulo={modoEdicion ? `Editar — ${tabla.label}` : `Nuevo — ${tabla.label}`}
        size="sm"
        footer={
          <>
            <button onClick={cerrar} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={!form.label.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {!modoEdicion && (
            <div>
              <label className="field-label">Código</label>
              <input
                type="text"
                className="field-input w-full font-mono"
                placeholder="Ej: LIN_010"
                value={form.id}
                onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
              />
            </div>
          )}
          <div>
            <label className="field-label">Valor <span className="text-[#b91c1c]">*</span></label>
            <input
              type="text"
              className="field-input w-full"
              value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
            />
          </div>
          {mostrarDias && (
            <div>
              <label className="field-label">Días <span className="text-[#b91c1c]">*</span></label>
              <input
                type="number"
                min={1}
                className="field-input w-full font-mono"
                value={form.dias}
                onChange={e => setForm(p => ({ ...p, dias: e.target.value }))}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

// ── Vista Extended ────────────────────────────────────────────────────────────

function VistaExtended({ tabla }: { tabla: TablaConfig }) {
  const store = useConfiguracionStore()
  const items = (store[tabla.storeKey as keyof typeof store] as CatalogoItemExtended[]) ?? []
  const { agregarItem, editarItem, desactivarItem } = store

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<CatalogoItemExtended | null>(null)
  const [form, setForm] = useState({ label: '', tipo: '', provincia: '', localidad: '' })

  function abrirNuevo() {
    setEditando(null)
    setForm({ label: '', tipo: '', provincia: '', localidad: '' })
    setModalAbierto(true)
  }

  function abrirEditar(item: CatalogoItemExtended) {
    setEditando(item)
    setForm({ label: item.label, tipo: item.tipo ?? '', provincia: item.provincia ?? '', localidad: item.localidad ?? '' })
  }

  function cerrar() {
    setEditando(null)
    setModalAbierto(false)
    setForm({ label: '', tipo: '', provincia: '', localidad: '' })
  }

  function guardar() {
    if (!form.label.trim()) return
    if (editando) {
      editarItem(tabla.storeKey, editando.id, { label: form.label, tipo: form.tipo, provincia: form.provincia, localidad: form.localidad })
    } else {
      agregarItem(tabla.storeKey, {
        id: `EXT_${Date.now()}`,
        label: form.label,
        tipo: form.tipo,
        provincia: form.provincia,
        localidad: form.localidad,
      } as CatalogoItemExtended)
    }
    cerrar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1b3a57]">{tabla.label}</h2>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[#1b3a57] text-white hover:opacity-90 transition-opacity"
        >
          <Icon name="add" size={16} /> Nuevo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.1)]">
              {['Nombre', 'Tipo', 'Provincia', 'Localidad', 'Estado', ''].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-[#f8f8f8]">
                <td className="py-2.5 px-4 text-[#1b3a57] font-medium max-w-[240px]">
                  <p className="truncate">{item.label}</p>
                </td>
                <td className="py-2.5 px-4 text-xs text-[#4a6a84]">{item.tipo ?? '—'}</td>
                <td className="py-2.5 px-4 text-xs text-[#4a6a84]">{item.provincia ?? '—'}</td>
                <td className="py-2.5 px-4 text-xs text-[#4a6a84]">{item.localidad ?? '—'}</td>
                <td className="py-2.5 px-4"><BadgeActivo activo={item.activo} /></td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => abrirEditar(item)} title="Editar" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#e8f0ff] hover:text-[#1b3a57] transition-colors">
                      <Icon name="edit" size={14} />
                    </button>
                    <button onClick={() => desactivarItem(tabla.storeKey, item.id)} title="Desactivar" disabled={item.activo === false} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Icon name="block" size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalAbierto || !!editando}
        onClose={cerrar}
        titulo={editando ? `Editar — ${tabla.label}` : `Nuevo — ${tabla.label}`}
        size="md"
        footer={
          <>
            <button onClick={cerrar} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">Cancelar</button>
            <button onClick={guardar} disabled={!form.label.trim()} className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity">Guardar</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="field-label">Nombre <span className="text-[#b91c1c]">*</span></label>
            <input type="text" className="field-input w-full" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Tipo</label>
              <select className="field-input w-full" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                <option value="">— Seleccionar —</option>
                {TIPOS_ORGANISMO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Provincia</label>
              <input type="text" className="field-input w-full" value={form.provincia} onChange={e => setForm(p => ({ ...p, provincia: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="field-label">Localidad</label>
              <input type="text" className="field-input w-full" value={form.localidad} onChange={e => setForm(p => ({ ...p, localidad: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Vista TipoGestion ─────────────────────────────────────────────────────────

function VistaTipoGestion({ tabla }: { tabla: TablaConfig }) {
  const store = useConfiguracionStore()
  const items = (store[tabla.storeKey as keyof typeof store] as TipoGestionItem[]) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1b3a57]">{tabla.label}</h2>
      </div>
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.1)]">
              {['Código', 'Label', 'Áreas', 'Canal', 'Estado'].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-[#f8f8f8]">
                <td className="py-2.5 px-4 font-mono text-xs text-[#9a9a9a]">{item.code}</td>
                <td className="py-2.5 px-4 text-[#1b3a57] font-medium">{item.label}</td>
                <td className="py-2.5 px-4">
                  <div className="flex flex-wrap gap-1">
                    {item.areas.map(a => (
                      <span key={a} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${AREA_BADGES[a] ?? 'bg-[#e8e8e8] text-[#4a6a84]'}`}>{a}</span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-xs text-[#4a6a84] font-mono">{item.canal}</td>
                <td className="py-2.5 px-4"><BadgeActivo activo={(item as unknown as CatalogoItem).activo} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function CatalogoPanel({ tabla }: Props) {
  if (tabla.soloLectura) return <VistaLectura tabla={tabla} />
  if (tabla.tipo === 'extended') return <VistaExtended tabla={tabla} />
  if (tabla.tipo === 'tipoGestion') return <VistaTipoGestion tabla={tabla} />
  return <VistaSimple tabla={tabla} />
}
