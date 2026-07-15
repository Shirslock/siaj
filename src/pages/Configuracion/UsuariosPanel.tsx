import { useState } from 'react'
import { useConfiguracionStore } from '../../store/configuracion.store'
import { Modal } from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import { LINEAS_FERROVIARIAS } from '../../data/catalogos'
import type { Area } from '../../types'

type RolBDOpcion = 'abogado' | 'abogada' | 'asistente_jurídico' | 'abogado_coordinador' | 'gerente' | 'adm_mesa'

const ROL_BD_OPCIONES: { value: RolBDOpcion; label: string }[] = [
  { value: 'abogado',             label: 'Abogado' },
  { value: 'abogada',             label: 'Abogada' },
  { value: 'asistente_jurídico',  label: 'Asistente Jurídico' },
  { value: 'abogado_coordinador', label: 'Coordinador/a' },
  { value: 'gerente',             label: 'Gerente / Referente' },
  { value: 'adm_mesa',            label: 'Administrativo/a Mesa' },
]

const ROL_BD_LABEL: Record<string, string> = Object.fromEntries(
  ROL_BD_OPCIONES.map(r => [r.value, r.label])
)

const ROL_BD_BADGE: Record<string, string> = {
  abogado:             'bg-[#e8f0ff] text-[#1b3a57]',
  abogada:             'bg-[#e8f0ff] text-[#1b3a57]',
  asistente_jurídico:  'bg-amber-100 text-amber-700',
  abogado_coordinador: 'bg-[#d4e6f1] text-[#1b3a57]',
  gerente:             'bg-[#1b3a57] text-white',
  adm_mesa:            'bg-[#e8e8e8] text-[#4a6a84]',
}

const AREA_BADGES: Record<string, string> = {
  CIVIL:   'bg-blue-100 text-blue-700',
  LABORAL: 'bg-amber-100 text-amber-700',
  PENAL:   'bg-red-100 text-red-700',
}

const AREAS: Area[] = ['CIVIL', 'LABORAL', 'PENAL']

interface FormUsuario {
  apellido:   string
  nombre:     string
  email:      string
  rolBD:      RolBDOpcion
  areas:      Area[]
  fifoOrder:  string
  lineasPenal: string[]
}

const BLANK_FORM: FormUsuario = {
  apellido:    '',
  nombre:      '',
  email:       '',
  rolBD:       'abogado',
  areas:       [],
  fifoOrder:   '',
  lineasPenal: [],
}

export function UsuariosPanel() {
  const { usuarios } = useConfiguracionStore()

  const [editando, setEditando] = useState<(typeof usuarios)[0] | null>(null)
  const [form, setForm] = useState<FormUsuario>(BLANK_FORM)

  function abrirEditar(u: (typeof usuarios)[0]) {
    setEditando(u)
    setForm({
      apellido:    u.apellido,
      nombre:      u.nombre,
      email:       '',
      rolBD:       u.rolBD as RolBDOpcion,
      areas:       [...u.areas] as Area[],
      fifoOrder:   '',
      lineasPenal: u.lineasPenal ?? [],
    })
  }

  function cerrar() {
    setEditando(null)
    setForm(BLANK_FORM)
  }

  function toggleArea(a: Area) {
    setForm(p => ({
      ...p,
      areas: p.areas.includes(a) ? p.areas.filter(x => x !== a) : [...p.areas, a],
    }))
  }

  function toggleLinea(id: string) {
    setForm(p => ({
      ...p,
      lineasPenal: p.lineasPenal.includes(id)
        ? p.lineasPenal.filter(x => x !== id)
        : [...p.lineasPenal, id],
    }))
  }

  const tieneCivLab  = form.areas.includes('CIVIL') || form.areas.includes('LABORAL')
  const tienePenal   = form.areas.includes('PENAL')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1b3a57]">Abogados / Usuarios</h2>
        <span className="text-xs text-[#9a9a9a]">{usuarios.length} usuarios</span>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.1)]">
              {['Nombre', 'Rol', 'Área/s', 'Estado', ''].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-[#4a6a84]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-[#f8f8f8]">
                <td className="py-2.5 px-4">
                  <p className="text-[#1b3a57] font-semibold text-sm">{u.apellido}, {u.nombre}</p>
                  <p className="text-[10px] text-[#9a9a9a] font-mono">{u.id}</p>
                </td>
                <td className="py-2.5 px-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROL_BD_BADGE[u.rolBD] ?? 'bg-[#e8e8e8] text-[#4a6a84]'}`}>
                    {ROL_BD_LABEL[u.rolBD] ?? u.rolBD}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex flex-wrap gap-1">
                    {u.areas.map((a: Area) => (
                      <span key={a} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${AREA_BADGES[a] ?? 'bg-[#e8e8e8] text-[#4a6a84]'}`}>{a}</span>
                    ))}
                    {u.areas.length === 0 && <span className="text-[#c0c0c0] text-xs">—</span>}
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Activo
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditar(u)}
                      title="Editar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#e8f0ff] hover:text-[#1b3a57] transition-colors"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      title="Desactivar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-red-50 hover:text-red-600 transition-colors"
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
        open={!!editando}
        onClose={cerrar}
        titulo={editando ? `Editar — ${editando.apellido}, ${editando.nombre}` : ''}
        size="md"
        footer={
          <>
            <button onClick={cerrar} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={cerrar}
              disabled={!form.apellido.trim() || !form.nombre.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Guardar cambios
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Apellido</label>
              <input type="text" className="field-input w-full" value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Nombre</label>
              <input type="text" className="field-input w-full" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="field-label">Email</label>
              <input type="email" className="field-input w-full" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="field-label">Rol</label>
              <select className="field-input w-full" value={form.rolBD} onChange={e => setForm(p => ({ ...p, rolBD: e.target.value as RolBDOpcion }))}>
                {ROL_BD_OPCIONES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label mb-1.5 block">Área/s</label>
            <div className="flex gap-3">
              {AREAS.map(a => (
                <label key={a} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={form.areas.includes(a)}
                    onChange={() => toggleArea(a)}
                  />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${AREA_BADGES[a]}`}>{a}</span>
                </label>
              ))}
            </div>
          </div>

          {tieneCivLab && (
            <div>
              <label className="field-label">Secuencia FIFO</label>
              <input
                type="number"
                min={1}
                className="field-input w-32 font-mono"
                placeholder="Ej: 5"
                value={form.fifoOrder}
                onChange={e => setForm(p => ({ ...p, fifoOrder: e.target.value }))}
              />
              <p className="text-[11px] text-[#9a9a9a] mt-1">Orden de asignación para Civil / Laboral</p>
            </div>
          )}

          {tienePenal && (
            <div>
              <label className="field-label mb-1.5 block">Líneas asignadas</label>
              <div className="grid grid-cols-3 gap-1.5">
                {LINEAS_FERROVIARIAS.map(l => (
                  <label key={l.id} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.lineasPenal.includes(l.id)}
                      onChange={() => toggleLinea(l.id)}
                    />
                    <span className="text-xs text-[#1b3a57]">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
