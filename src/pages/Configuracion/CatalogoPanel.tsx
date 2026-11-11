import { useState } from 'react'
import type { TablaConfig } from './tablas.config'
import { DATOS_SOLO_LECTURA } from './tablas.config'
import { useConfiguracionStore } from '../../store/configuracion.store'
import { Modal } from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import type { CatalogoItem, CatalogoItemExtended, MonedaItem, TipoGestionItem } from '../../types'

interface Props { tabla: TablaConfig }

const AREA_BADGES: Record<string, string> = {
  CIVIL:    'bg-blue-100 text-blue-700',
  LABORAL:  'bg-amber-100 text-amber-700',
  PENAL:    'bg-red-100 text-red-700',
}

const TIPOS_ORGANISMO = ['Juzgado', 'Tribunal', 'Fiscalía', 'UFI', 'Comisaría']


function BadgeActivo({ activo }: { activo?: boolean }) {
  const inactivo = activo === false
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      inactivo ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'
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
        <h2 className="text-lg font-semibold text-gray-800">{tabla.label}</h2>
        <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          <Icon name="block" size={12} /> Solo lectura
        </span>
      </div>
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['ID', 'Valor'].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-mono text-xs text-gray-400">{item.id}</td>
                <td className="py-2.5 px-4 text-gray-800 font-medium">{item.label}</td>
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
  const { agregarItem, editarItem } = store

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<CatalogoItem | null>(null)
  const [form, setForm] = useState({ id: '', label: '', dias: '', activo: true })

  const esSancion = tabla.especial === 'sancion'
  const modoEdicion = !!editando

  function abrirNuevo() {
    setEditando(null)
    setForm({ id: '', label: '', dias: '', activo: true })
    setModalAbierto(true)
  }

  function abrirEditar(item: CatalogoItem) {
    setEditando(item)
    setForm({ id: item.id, label: item.label, dias: '', activo: item.activo ?? true })
    setModalAbierto(false) // se abre via editando
  }

  function cerrar() {
    setEditando(null)
    setModalAbierto(false)
    setForm({ id: '', label: '', dias: '', activo: true })
  }

  function guardar() {
    if (!form.label.trim()) return
    if (modoEdicion && editando) {
      editarItem(tabla.storeKey, editando.id, { label: form.label.trim(), activo: form.activo })
    } else {
      const id = form.id.trim() || `X_${Date.now()}`
      agregarItem(tabla.storeKey, { id, label: form.label.trim(), activo: form.activo })
    }
    cerrar()
  }

  const mostrarDias = esSancion && form.label.toLowerCase().includes('suspens')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{tabla.label}</h2>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:opacity-90 transition-opacity"
        >
          <Icon name="add" size={16} /> Nuevo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['ID', 'Valor', 'Estado', ''].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-mono text-xs text-gray-400">{item.id}</td>
                <td className="py-2.5 px-4 text-gray-800 font-medium">{item.label}</td>
                <td className="py-2.5 px-4"><BadgeActivo activo={item.activo} /></td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditar(item)}
                      title="Editar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-blue-50 hover:text-gray-800 transition-colors"
                    >
                      <Icon name="edit" size={14} />
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
            <button onClick={cerrar} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={!form.label.trim()}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
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
            <label className="field-label">Valor <span className="text-red-700">*</span></label>
            <input
              type="text"
              className="field-input w-full"
              value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
            />
          </div>
          {mostrarDias && (
            <div>
              <label className="field-label">Días <span className="text-red-700">*</span></label>
              <input
                type="number"
                min={1}
                className="field-input w-full font-mono"
                value={form.dias}
                onChange={e => setForm(p => ({ ...p, dias: e.target.value }))}
              />
            </div>
          )}
          <div className="pt-2 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${
                  form.activo ? 'bg-blue-700' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.activo ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Activo</p>
                <p className="text-[11px] text-gray-500">Los ítems inactivos no aparecen en los formularios</p>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Vista Moneda ─────────────────────────────────────────────────────────────
// Único catálogo donde `id` es la sigla (ARS/USD/EUR) — el valor de negocio que queda guardado
// en los campos money_multi. Se desactiva igual que los demás catálogos (nunca se borra), así
// una moneda usada en montos ya cargados sigue resolviendo símbolo y formato.

function VistaMoneda({ tabla }: { tabla: TablaConfig }) {
  const store = useConfiguracionStore()
  const items = (store[tabla.storeKey as keyof typeof store] as MonedaItem[]) ?? []
  const { agregarItem, editarItem } = store

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<MonedaItem | null>(null)
  const [form, setForm] = useState({ id: '', label: '', simbolo: '', activo: true })

  const modoEdicion = !!editando

  function abrirNuevo() {
    setEditando(null)
    setForm({ id: '', label: '', simbolo: '', activo: true })
    setModalAbierto(true)
  }

  function abrirEditar(item: MonedaItem) {
    setEditando(item)
    setForm({ id: item.id, label: item.label, simbolo: item.simbolo, activo: item.activo ?? true })
  }

  function cerrar() {
    setEditando(null)
    setModalAbierto(false)
    setForm({ id: '', label: '', simbolo: '', activo: true })
  }

  function guardar() {
    if (!form.label.trim() || !form.simbolo.trim()) return
    if (modoEdicion && editando) {
      editarItem(tabla.storeKey, editando.id, { label: form.label.trim(), simbolo: form.simbolo.trim(), activo: form.activo })
    } else {
      const id = form.id.trim().toUpperCase()
      if (!id) return
      agregarItem(tabla.storeKey, { id, label: form.label.trim(), simbolo: form.simbolo.trim(), activo: form.activo } as MonedaItem)
    }
    cerrar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{tabla.label}</h2>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:opacity-90 transition-opacity"
        >
          <Icon name="add" size={16} /> Nuevo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Sigla', 'Nombre', 'Símbolo', 'Estado', ''].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-mono text-xs text-gray-400">{item.id}</td>
                <td className="py-2.5 px-4 text-gray-800 font-medium">{item.label}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{item.simbolo}</td>
                <td className="py-2.5 px-4"><BadgeActivo activo={item.activo} /></td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditar(item)}
                      title="Editar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-blue-50 hover:text-gray-800 transition-colors"
                    >
                      <Icon name="edit" size={14} />
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
        titulo={modoEdicion ? `Editar — ${tabla.label}` : `Nueva — ${tabla.label}`}
        size="sm"
        footer={
          <>
            <button onClick={cerrar} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={!form.label.trim() || !form.simbolo.trim() || (!modoEdicion && !form.id.trim())}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {!modoEdicion && (
            <div>
              <label className="field-label">Sigla (ISO 4217) <span className="text-red-700">*</span></label>
              <input
                type="text"
                className="field-input w-full font-mono uppercase"
                placeholder="Ej: BRL"
                maxLength={3}
                value={form.id}
                onChange={e => setForm(p => ({ ...p, id: e.target.value.toUpperCase() }))}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Es el valor que queda guardado en los montos — no se puede editar después de creada.
              </p>
            </div>
          )}
          <div>
            <label className="field-label">Nombre <span className="text-red-700">*</span></label>
            <input
              type="text"
              className="field-input w-full"
              placeholder="Ej: Reales brasileños"
              value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
            />
          </div>
          <div>
            <label className="field-label">Símbolo <span className="text-red-700">*</span></label>
            <input
              type="text"
              className="field-input w-full"
              placeholder="Ej: R$"
              value={form.simbolo}
              onChange={e => setForm(p => ({ ...p, simbolo: e.target.value }))}
            />
          </div>
          <div className="pt-2 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${
                  form.activo ? 'bg-blue-700' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.activo ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Activa</p>
                <p className="text-[11px] text-gray-500">
                  Las monedas inactivas no aparecen para elegir en montos nuevos, pero los montos
                  ya cargados con esa moneda se siguen mostrando igual.
                </p>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Vista Extended ────────────────────────────────────────────────────────────

function VistaExtended({ tabla }: { tabla: TablaConfig }) {
  const store = useConfiguracionStore()
  const items = (store[tabla.storeKey as keyof typeof store] as CatalogoItemExtended[]) ?? []
  const { agregarItem, editarItem } = store

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<CatalogoItemExtended | null>(null)
  const [form, setForm] = useState({ label: '', tipo: '', provincia: '', localidad: '', activo: true })

  const [busqueda, setBusqueda] = useState('')
  const [filtroProvincia, setFiltroProvincia] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'' | 'activo' | 'inactivo'>('')

  const provincias = Array.from(new Set(items.map(i => i.provincia).filter((p): p is string => !!p))).sort()
  const hayFiltros = !!(busqueda || filtroProvincia || filtroEstado)

  const q = busqueda.trim().toLowerCase()
  const itemsFiltrados = items.filter(i => {
    if (q && !`${i.label} ${i.localidad ?? ''}`.toLowerCase().includes(q)) return false
    if (filtroProvincia && i.provincia !== filtroProvincia) return false
    if (filtroEstado === 'activo' && i.activo === false) return false
    if (filtroEstado === 'inactivo' && i.activo !== false) return false
    return true
  })

  function limpiarFiltros() {
    setBusqueda('')
    setFiltroProvincia('')
    setFiltroEstado('')
  }

  function abrirNuevo() {
    setEditando(null)
    setForm({ label: '', tipo: '', provincia: '', localidad: '', activo: true })
    setModalAbierto(true)
  }

  function abrirEditar(item: CatalogoItemExtended) {
    setEditando(item)
    setForm({ label: item.label, tipo: item.tipo ?? '', provincia: item.provincia ?? '', localidad: item.localidad ?? '', activo: item.activo ?? true })
  }

  function cerrar() {
    setEditando(null)
    setModalAbierto(false)
    setForm({ label: '', tipo: '', provincia: '', localidad: '', activo: true })
  }

  function guardar() {
    if (!form.label.trim()) return
    if (editando) {
      editarItem(tabla.storeKey, editando.id, { label: form.label, tipo: form.tipo, provincia: form.provincia, localidad: form.localidad, activo: form.activo })
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
        <h2 className="text-lg font-semibold text-gray-800">{tabla.label}</h2>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:opacity-90 transition-opacity"
        >
          <Icon name="add" size={16} /> Nuevo
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            className="field-input w-full pl-8"
            placeholder="Buscar por nombre o localidad"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <select className="field-input !w-52" value={filtroProvincia} onChange={e => setFiltroProvincia(e.target.value)}>
          <option value="">Todas las provincias</option>
          {provincias.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="field-input !w-44" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as '' | 'activo' | 'inactivo')}>
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        {hayFiltros && (
          <button onClick={limpiarFiltros} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
            Limpiar
          </button>
        )}
        <span className="text-[11px] text-gray-500 ml-auto">
          {itemsFiltrados.length} de {items.length}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Nombre', 'Tipo', 'Provincia', 'Localidad', 'Estado', ''].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {itemsFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 px-4 text-center text-sm text-gray-500">
                  Ningún organismo coincide con los filtros.
                </td>
              </tr>
            )}
            {itemsFiltrados.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 text-gray-800 font-medium max-w-[240px]">
                  <p className="truncate">{item.label}</p>
                </td>
                <td className="py-2.5 px-4 text-xs text-gray-500">{item.tipo ?? '—'}</td>
                <td className="py-2.5 px-4 text-xs text-gray-500">{item.provincia ?? '—'}</td>
                <td className="py-2.5 px-4 text-xs text-gray-500">{item.localidad ?? '—'}</td>
                <td className="py-2.5 px-4"><BadgeActivo activo={item.activo} /></td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => abrirEditar(item)} title="Editar" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-blue-50 hover:text-gray-800 transition-colors">
                      <Icon name="edit" size={14} />
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
            <button onClick={cerrar} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button onClick={guardar} disabled={!form.label.trim()} className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 transition-opacity">Guardar</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="field-label">Nombre <span className="text-red-700">*</span></label>
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
          <div className="pt-2 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${
                  form.activo ? 'bg-blue-700' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.activo ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Activo</p>
                <p className="text-[11px] text-gray-500">Los ítems inactivos no aparecen en los formularios</p>
              </div>
            </label>
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
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{tabla.label}</h2>
        <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          <Icon name="block" size={12} /> Solo lectura
        </span>
      </div>
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Código', 'Label', 'Áreas', 'Canal', 'Estado'].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-mono text-xs text-gray-400">{item.code}</td>
                <td className="py-2.5 px-4 text-gray-800 font-medium">{item.label}</td>
                <td className="py-2.5 px-4">
                  <div className="flex flex-wrap gap-1">
                    {item.areas.map(a => (
                      <span key={a} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${AREA_BADGES[a] ?? 'bg-gray-100 text-gray-500'}`}>{a}</span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">{item.canal}</td>
                <td className="py-2.5 px-4"><BadgeActivo activo={item.activo} /></td>
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
  if (tabla.tipo === 'extended') return <VistaExtended key={tabla.id} tabla={tabla} />
  if (tabla.tipo === 'tipoGestion') return <VistaTipoGestion tabla={tabla} />
  if (tabla.tipo === 'moneda') return <VistaMoneda tabla={tabla} />
  return <VistaSimple tabla={tabla} />
}
