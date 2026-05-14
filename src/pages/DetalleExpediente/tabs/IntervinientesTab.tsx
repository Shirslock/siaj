import { useState } from 'react'
import type { Expediente, Interviniente } from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { Modal } from '../../../components/ui/Modal'
import { ROLES_INTERVINIENTE, TIPOS_DOC_INTERVINIENTE } from '../../../data/catalogos'

interface Props { exp: Expediente }

const ROL_LABEL: Record<string, string> = {
  INT_001: 'ACTOR',
  INT_002: 'DEMANDADO',
  INT_003: 'TERCERO',
  INT_004: 'PERITO',
}

const DOC_LABEL: Record<string, string> = {
  TC_001: 'DNI',
  TC_002: 'CUIL',
  TC_003: 'CUIT',
  TC_004: 'PASAPORTE',
}

const BLANK: Omit<Interviniente, 'id'> = {
  nombre: '',
  rol_procesal: 'INT_001',
  tipo_documento: 'TC_001',
  numero_documento: '',
  contacto_email: '',
  contacto_telefono: '',
  contacto_domicilio: '',
  representado_por: '',
  observaciones: '',
}

export function IntervinientesTab({ exp }: Props) {
  const { agregarInterviniente, eliminarInterviniente } = useExpedientesStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Omit<Interviniente, 'id'>>(BLANK)

  function setField(k: keyof typeof BLANK, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function agregar() {
    if (!form.nombre.trim() || !form.numero_documento.trim()) return
    const nuevo: Interviniente = {
      ...form,
      id: `IN_${Date.now()}`,
      contacto_email:    form.contacto_email    || undefined,
      contacto_telefono: form.contacto_telefono || undefined,
      contacto_domicilio: form.contacto_domicilio || undefined,
      representado_por:  form.representado_por  || undefined,
      observaciones:     form.observaciones     || undefined,
    }
    agregarInterviniente(exp.id, nuevo)
    setModal(false)
    setForm(BLANK)
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-end">
          <button
            onClick={() => { setForm(BLANK); setModal(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Agregar interviniente
          </button>
        </div>

        {exp.intervinientes.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-10 text-center text-on-surface-variant text-sm">
            No hay intervinientes registrados.
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/50">
                  {['Nombre', 'Rol', 'Documento', 'Contacto', ''].map(col => (
                    <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {exp.intervinientes.map(int => (
                  <tr key={int.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-on-surface font-medium">{int.nombre}</p>
                      {int.representado_por && (
                        <p className="text-xs text-on-surface-variant mt-0.5">Rep.: {int.representado_por}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
                        {ROL_LABEL[int.rol_procesal] ?? int.rol_procesal}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant">
                      <span>{DOC_LABEL[int.tipo_documento] ?? int.tipo_documento}</span>
                      <span className="font-mono ml-1">{int.numero_documento}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant space-y-0.5">
                      {int.contacto_email     && <p>{int.contacto_email}</p>}
                      {int.contacto_telefono  && <p>{int.contacto_telefono}</p>}
                      {int.contacto_domicilio && <p className="truncate max-w-[180px]">{int.contacto_domicilio}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => eliminarInterviniente(exp.id, int.id)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        titulo="Agregar interviniente"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={agregar}
              disabled={!form.nombre.trim() || !form.numero_documento.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Agregar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Nombre completo <span className="text-error">*</span></label>
              <input type="text" className="field-input w-full" placeholder="Apellido, Nombre" value={form.nombre} onChange={e => setField('nombre', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Rol procesal</label>
              <select className="field-input w-full" value={form.rol_procesal} onChange={e => setField('rol_procesal', e.target.value)}>
                {ROLES_INTERVINIENTE.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Representado por</label>
              <input type="text" className="field-input w-full" placeholder="Letrado patrocinante" value={form.representado_por} onChange={e => setField('representado_por', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Tipo de documento</label>
              <select className="field-input w-full" value={form.tipo_documento} onChange={e => setField('tipo_documento', e.target.value)}>
                {TIPOS_DOC_INTERVINIENTE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">N° Documento <span className="text-error">*</span></label>
              <input type="text" className="field-input w-full font-mono" placeholder="23456789" value={form.numero_documento} onChange={e => setField('numero_documento', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input type="email" className="field-input w-full" value={form.contacto_email} onChange={e => setField('contacto_email', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Teléfono</label>
              <input type="text" className="field-input w-full" value={form.contacto_telefono} onChange={e => setField('contacto_telefono', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="field-label">Domicilio</label>
              <input type="text" className="field-input w-full" value={form.contacto_domicilio} onChange={e => setField('contacto_domicilio', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="field-label">Observaciones</label>
              <textarea className="field-input w-full resize-y" style={{ minHeight: 60 }} value={form.observaciones} onChange={e => setField('observaciones', e.target.value)} />
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
