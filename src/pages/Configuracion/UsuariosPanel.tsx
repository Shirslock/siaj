import { useState } from 'react'
import { useConfiguracionStore } from '../../store/configuracion.store'
import { Modal } from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import { LINEAS_FERROVIARIAS } from '../../data/catalogos'
import type { Area } from '../../types'

type RolBDOpcion = 'abogado' | 'abogada' | 'asistente_jurídico' | 'abogado_coordinador' | 'gerente' | 'adm_mesa'
type JurisdiccionMatricula = 'CABA' | 'PROVINCIA' | 'FEDERAL'

const JURISDICCIONES: JurisdiccionMatricula[] = ['CABA', 'PROVINCIA', 'FEDERAL']

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
  abogado:             'bg-[#e8f0ff] text-[#242C4F]',
  abogada:             'bg-[#e8f0ff] text-[#242C4F]',
  asistente_jurídico:  'bg-amber-100 text-amber-700',
  abogado_coordinador: 'bg-[#d4e6f1] text-[#242C4F]',
  gerente:             'bg-[#256386] text-white',
  adm_mesa:            'bg-[#E3E4E9] text-[#758A93]',
}

const AREA_BADGES: Record<string, string> = {
  CIVIL:   'bg-blue-100 text-blue-700',
  LABORAL: 'bg-amber-100 text-amber-700',
  PENAL:   'bg-red-100 text-red-700',
}

const AREAS: Area[] = ['CIVIL', 'LABORAL', 'PENAL']

interface FormUsuario {
  apellido:    string
  nombre:      string
  email:       string
  rolBD:       RolBDOpcion
  areas:       Area[]
  fifoOrder:   Partial<Record<'CIVIL' | 'LABORAL', number>>
  lineasPenal: string[]
  matriculas:  Partial<Record<JurisdiccionMatricula, string>>
  activo:      boolean
}

const BLANK_FORM: FormUsuario = {
  apellido:    '',
  nombre:      '',
  email:       '',
  rolBD:       'abogado',
  areas:       [],
  fifoOrder:   {},
  lineasPenal: [],
  matriculas:  {},
  activo:      true,
}

export function UsuariosPanel() {
  const { usuarios } = useConfiguracionStore()

  const [editando, setEditando] = useState<(typeof usuarios)[0] | null>(null)
  const [form, setForm]         = useState<FormUsuario>(BLANK_FORM)
  const [altaAbierta, setAltaAbierta] = useState(false)

  function abrirEditar(u: (typeof usuarios)[0]) {
    setEditando(u)
    setForm({
      apellido:    u.apellido,
      nombre:      u.nombre,
      email:       (u as any).email ?? '',
      rolBD:       u.rolBD as RolBDOpcion,
      areas:       [...u.areas] as Area[],
      fifoOrder:   (u.fifoOrder as Partial<Record<'CIVIL' | 'LABORAL', number>>) ?? {},
      lineasPenal: u.lineasPenal ?? [],
      matriculas:  (u as any).matriculas ?? {},
      activo:      (u as any).activo ?? true,
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

  const tieneCivLab = form.areas.includes('CIVIL') || form.areas.includes('LABORAL')
  const tienePenal  = form.areas.includes('PENAL')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#242C4F]">Abogados / Usuarios</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9a9a9a]">{usuarios.length} usuarios</span>
          <button
            onClick={() => { setAltaAbierta(true); setEditando(null); setForm(BLANK_FORM) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[#256386] text-white hover:opacity-90 transition-opacity"
          >
            <Icon name="add" size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.1)]">
              {['Nombre', 'Rol', 'Área/s', 'Mail', 'Matrícula', 'Secuencia / Línea', ''].map(c => (
                <th key={c} className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-[#758A93]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
            {usuarios.map(u => {
              const matriculas = (u as any).matriculas as Partial<Record<JurisdiccionMatricula, string>> | undefined
              const activo     = (u as any).activo ?? true
              return (
                <tr key={u.id} className="hover:bg-[#f8f8f8]">

                  {/* Nombre */}
                  <td className="py-2.5 px-4">
                    <p className="text-[#242C4F] font-semibold text-sm">{u.apellido}, {u.nombre}</p>
                    <p className="text-[10px] text-[#9a9a9a] font-mono">{u.id}</p>
                  </td>

                  {/* Rol */}
                  <td className="py-2.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROL_BD_BADGE[u.rolBD] ?? 'bg-[#E3E4E9] text-[#758A93]'}`}>
                      {ROL_BD_LABEL[u.rolBD] ?? u.rolBD}
                    </span>
                  </td>

                  {/* Área/s */}
                  <td className="py-2.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {u.areas.map(a => (
                        <span key={a} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${AREA_BADGES[a] ?? 'bg-[#E3E4E9] text-[#758A93]'}`}>{a}</span>
                      ))}
                      {u.areas.length === 0 && <span className="text-[#c0c0c0] text-xs">—</span>}
                    </div>
                  </td>

                  {/* Mail */}
                  <td className="py-2.5 px-4">
                    <span className="text-xs text-[#758A93]">{(u as any).email ?? '—'}</span>
                  </td>

                  {/* Matrícula */}
                  <td className="py-2.5 px-4">
                    {matriculas && Object.keys(matriculas).length > 0
                      ? Object.entries(matriculas).map(([jur, num]) => (
                          <div key={jur} className="text-[10px] text-[#242C4F]">
                            <span className="font-bold text-[#758A93]">{jur}:</span> {num}
                          </div>
                        ))
                      : <span className="text-[#c0c0c0] text-xs">—</span>}
                  </td>

                  {/* Secuencia / Línea */}
                  <td className="py-2.5 px-4">
                    {u.lineasPenal && u.lineasPenal.length > 0 ? (
                      <span className="text-[10px] text-[#758A93]">
                        {u.lineasPenal.length} línea{u.lineasPenal.length !== 1 ? 's' : ''}
                      </span>
                    ) : u.fifoOrder && Object.keys(u.fifoOrder).length > 0 ? (
                      <div className="space-y-0.5">
                        {Object.entries(u.fifoOrder).map(([area, pos]) => (
                          <div key={area} className="text-[10px] font-mono text-[#242C4F]">
                            <span className="text-[#758A93]">{area}</span> #{pos}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#c0c0c0] text-xs">—</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activo ? 'bg-green-100 text-green-700' : 'bg-[#E3E4E9] text-[#9a9a9a]'}`}>
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => abrirEditar(u)}
                        title="Editar"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#758A93] hover:bg-[#e8f0ff] hover:text-[#242C4F] transition-colors"
                      >
                        <Icon name="edit" size={14} />
                      </button>
                    </div>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal editar */}
      <Modal
        open={!!editando}
        onClose={cerrar}
        titulo={editando ? `Editar — ${editando.apellido}, ${editando.nombre}` : ''}
        size="md"
        footer={
          <>
            <button onClick={cerrar} className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9] transition-colors">
              Cancelar
            </button>
            <button
              onClick={cerrar}
              disabled={!form.apellido.trim() || !form.nombre.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#256386] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Guardar cambios
            </button>
          </>
        }
      >
        <div className="space-y-4">

          {/* Nombre y apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Apellido</label>
              <input type="text" className="field-input w-full" value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Nombre</label>
              <input type="text" className="field-input w-full" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="field-label">Email</label>
            <input type="email" className="field-input w-full" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>

          {/* Rol */}
          <div>
            <label className="field-label">Rol</label>
            <select className="field-input w-full" value={form.rolBD} onChange={e => setForm(p => ({ ...p, rolBD: e.target.value as RolBDOpcion }))}>
              {ROL_BD_OPCIONES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Área/s */}
          <div>
            <label className="field-label mb-1.5 block">Área/s</label>
            <div className="flex gap-3">
              {AREAS.map(a => (
                <label key={a} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" className="rounded" checked={form.areas.includes(a)} onChange={() => toggleArea(a)} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${AREA_BADGES[a]}`}>{a}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Matrículas */}
          <div>
            <label className="field-label mb-2 block">Matrículas</label>
            <div className="space-y-2">
              {JURISDICCIONES.map(jur => (
                <div key={jur} className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#758A93] w-20 flex-shrink-0">{jur}</span>
                  <input
                    type="text"
                    className="field-input flex-1 font-mono text-sm"
                    placeholder={`Nro. matrícula ${jur}...`}
                    value={form.matriculas[jur] ?? ''}
                    onChange={e => setForm(p => ({
                      ...p,
                      matriculas: { ...p.matriculas, [jur]: e.target.value || undefined },
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FIFO — solo Civil/Laboral */}
          {tieneCivLab && (
            <div>
              <label className="field-label mb-1.5 block">Secuencia FIFO</label>
              <div className="space-y-2">
                {(['CIVIL', 'LABORAL'] as const).filter(a => form.areas.includes(a)).map(a => (
                  <div key={a} className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 ${AREA_BADGES[a]}`}>{a}</span>
                    <input
                      type="number"
                      min={1}
                      className="field-input w-24 font-mono"
                      placeholder="Ej: 5"
                      value={form.fifoOrder[a] ?? ''}
                      onChange={e => setForm(p => ({
                        ...p,
                        fifoOrder: { ...p.fifoOrder, [a]: e.target.value ? Number(e.target.value) : undefined },
                      }))}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#9a9a9a] mt-1">Orden de asignación automática</p>
            </div>
          )}

          {/* Líneas — solo Penal */}
          {tienePenal && (
            <div>
              <label className="field-label mb-1.5 block">Líneas asignadas</label>
              <div className="grid grid-cols-3 gap-1.5">
                {LINEAS_FERROVIARIAS.map(l => (
                  <label key={l.id} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" className="rounded" checked={form.lineasPenal.includes(l.id)} onChange={() => toggleLinea(l.id)} />
                    <span className="text-xs text-[#242C4F]">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Estado activo — al final */}
          <div className="pt-2 border-t border-[rgba(0,0,0,0.06)]">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${
                  form.activo ? 'bg-[#256386]' : 'bg-[rgba(0,0,0,0.15)]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.activo ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#242C4F]">Usuario activo</p>
                <p className="text-[11px] text-[#758A93]">Los usuarios inactivos no pueden acceder al sistema</p>
              </div>
            </label>
          </div>

        </div>
      </Modal>

      {/* Modal alta */}
      <Modal
        open={altaAbierta}
        onClose={() => { setAltaAbierta(false); setForm(BLANK_FORM) }}
        titulo="Nuevo usuario"
        size="md"
        footer={
          <>
            <button
              onClick={() => { setAltaAbierta(false); setForm(BLANK_FORM) }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { setAltaAbierta(false); setForm(BLANK_FORM) }}
              disabled={!form.apellido.trim() || !form.nombre.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#256386] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Dar de alta
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
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" className="field-input w-full" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Rol</label>
            <select className="field-input w-full" value={form.rolBD} onChange={e => setForm(p => ({ ...p, rolBD: e.target.value as RolBDOpcion }))}>
              {ROL_BD_OPCIONES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label mb-1.5 block">Área/s</label>
            <div className="flex gap-3">
              {AREAS.map(a => (
                <label key={a} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" className="rounded" checked={form.areas.includes(a)} onChange={() => toggleArea(a)} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${AREA_BADGES[a]}`}>{a}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label mb-2 block">Matrículas</label>
            <div className="space-y-2">
              {JURISDICCIONES.map(jur => (
                <div key={jur} className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#758A93] w-20 flex-shrink-0">{jur}</span>
                  <input
                    type="text"
                    className="field-input flex-1 font-mono text-sm"
                    placeholder={`Nro. matrícula ${jur}...`}
                    value={form.matriculas[jur] ?? ''}
                    onChange={e => setForm(p => ({
                      ...p,
                      matriculas: { ...p.matriculas, [jur]: e.target.value || undefined },
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
          {tieneCivLab && (
            <div>
              <label className="field-label mb-1.5 block">Secuencia FIFO</label>
              <div className="space-y-2">
                {(['CIVIL', 'LABORAL'] as const).filter(a => form.areas.includes(a)).map(a => (
                  <div key={a} className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 ${AREA_BADGES[a]}`}>{a}</span>
                    <input
                      type="number" min={1}
                      className="field-input w-24 font-mono"
                      placeholder="Ej: 5"
                      value={form.fifoOrder[a] ?? ''}
                      onChange={e => setForm(p => ({
                        ...p,
                        fifoOrder: { ...p.fifoOrder, [a]: e.target.value ? Number(e.target.value) : undefined },
                      }))}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#9a9a9a] mt-1">Orden de asignación automática</p>
            </div>
          )}
          {tienePenal && (
            <div>
              <label className="field-label mb-1.5 block">Líneas asignadas</label>
              <div className="grid grid-cols-3 gap-1.5">
                {LINEAS_FERROVIARIAS.map(l => (
                  <label key={l.id} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" className="rounded" checked={form.lineasPenal.includes(l.id)} onChange={() => toggleLinea(l.id)} />
                    <span className="text-xs text-[#242C4F]">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-[rgba(0,0,0,0.06)]">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${
                  form.activo ? 'bg-[#256386]' : 'bg-[rgba(0,0,0,0.15)]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.activo ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#242C4F]">Usuario activo</p>
                <p className="text-[11px] text-[#758A93]">Los usuarios inactivos no pueden acceder al sistema</p>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}