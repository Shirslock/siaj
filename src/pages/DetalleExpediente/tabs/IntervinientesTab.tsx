import { useState, useEffect } from 'react'
import type { Expediente, Interviniente } from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { Modal } from '../../../components/ui/Modal'
import { ROLES_INTERVINIENTE, TIPOS_DOC_INTERVINIENTE } from '../../../data/catalogos'
import Icon from '../../../components/ui/Icon'
import { toast } from 'react-toastify'

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
  const { agregarInterviniente, eliminarInterviniente, editarInterviniente } = useExpedientesStore()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Interviniente | null>(null)
  const [form, setForm] = useState<Omit<Interviniente, 'id'>>(BLANK)
  const [formNombre, setFormNombre] = useState({ apellido: '', nombre: '' })
  const [verDetalle, setVerDetalle] = useState<Interviniente | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<Interviniente | null>(null)

  const modoEdicion = !!editando

  useEffect(() => {
    if (editando) {
      setForm({
        nombre:             editando.nombre,
        rol_procesal:       editando.rol_procesal,
        tipo_documento:     editando.tipo_documento,
        numero_documento:   editando.numero_documento,
        representado_por:   editando.representado_por   ?? '',
        contacto_telefono:  editando.contacto_telefono  ?? '',
        contacto_email:     editando.contacto_email     ?? '',
        contacto_domicilio: editando.contacto_domicilio ?? '',
        observaciones:      editando.observaciones      ?? '',
      })
      const partes = editando.nombre.split(', ')
      setFormNombre({ apellido: partes[0] ?? '', nombre: partes[1] ?? '' }) 
    }
  }, [editando])

  function setField(k: keyof typeof BLANK, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function resetForm() {
    setForm(BLANK)
    setFormNombre({ apellido: '', nombre: '' })
  }

  function cerrarModal() {
    setEditando(null)
    setModalAbierto(false)
    resetForm()
  }

  function confirmar() {
    const nombreCompleto = `${formNombre.apellido.trim()}, ${formNombre.nombre.trim()}`
    const formFinal = { ...form, nombre: nombreCompleto }

    if (modoEdicion && editando) {
      editarInterviniente(exp.id, editando.id, {
        ...formFinal,
        contacto_email:     formFinal.contacto_email     || undefined,
        contacto_telefono:  formFinal.contacto_telefono  || undefined,
        contacto_domicilio: formFinal.contacto_domicilio || undefined,
        representado_por:   formFinal.representado_por   || undefined,
        observaciones:      formFinal.observaciones      || undefined,
      })
      toast.success('Interviniente actualizado.')
      setEditando(null)
    } else {
      const nuevo: Interviniente = {
        ...formFinal,
        id: `IN_${Date.now()}`,
        contacto_email:     formFinal.contacto_email     || undefined,
        contacto_telefono:  formFinal.contacto_telefono  || undefined,
        contacto_domicilio: formFinal.contacto_domicilio || undefined,
        representado_por:   formFinal.representado_por   || undefined,
        observaciones:      formFinal.observaciones      || undefined,
      }
      agregarInterviniente(exp.id, nuevo)
      toast.success('Interviniente agregado.')
      setModalAbierto(false)
    }
    resetForm()
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-end">
          <button
            onClick={() => { resetForm(); setModalAbierto(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[#1b3a57] text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            <Icon name="person_add" size={18} />
            Agregar interviniente
          </button>
        </div>

        {exp.intervinientes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center text-[#4a6a84] text-sm">
            No hay intervinientes registrados.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.12)]">
                  {['Nombre', 'Rol', 'Documento', 'Letrado', 'Contacto', ''].map(col => (
                    <th key={col} className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {exp.intervinientes.map(int => (
                  <tr key={int.id} className="hover:bg-[#f0f0f0] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-[#1b3a57] font-medium">{int.nombre}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold bg-[#e8e8e8] px-2 py-0.5 rounded-full text-[#4a6a84]">
                        {ROL_LABEL[int.rol_procesal] ?? int.rol_procesal}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4a6a84]">
                      <span>{DOC_LABEL[int.tipo_documento] ?? int.tipo_documento}</span>
                      <span className="font-mono ml-1">{int.numero_documento}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-[#4a6a84]">
                        {int.representado_por
                          ? int.representado_por
                          : <span className="text-[#c0c0c0]">—</span>
                        }
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4a6a84] space-y-0.5">
                      {int.contacto_email     && <p>{int.contacto_email}</p>}
                      {int.contacto_telefono  && <p>{int.contacto_telefono}</p>}
                      {int.contacto_domicilio && <p className="truncate max-w-[180px]">{int.contacto_domicilio}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setVerDetalle(int)}
                          title="Ver detalle"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#e8f0ff] hover:text-[#1b3a57] transition-colors"
                        >
                          <Icon name="visibility" size={15} />
                        </button>
                        <button
                          onClick={() => setEditando(int)}
                          title="Editar"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#e8f0ff] hover:text-[#1b3a57] transition-colors"
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmarEliminar(int)}
                          title="Eliminar"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Icon name="delete" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalAbierto || !!editando}
        onClose={cerrarModal}
        titulo={modoEdicion ? 'Editar interviniente' : 'Agregar interviniente'}
        size="lg"
        footer={
          <>
            <button
              onClick={cerrarModal}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={!formNombre.apellido.trim() || !formNombre.nombre.trim() || !form.numero_documento.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {modoEdicion ? 'Guardar cambios' : 'Agregar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Nombre <span className="text-[#b91c1c]">*</span></label>
              <input type="text" className="field-input w-full" placeholder="Mario Oscar" value={formNombre.nombre} onChange={e => setFormNombre(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Apellido <span className="text-[#b91c1c]">*</span></label>
              <input type="text" className="field-input w-full" placeholder="RODRIGUEZ" value={formNombre.apellido} onChange={e => setFormNombre(p => ({ ...p, apellido: e.target.value }))} />
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
              <label className="field-label">N° Documento <span className="text-[#b91c1c]">*</span></label>
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

      {/* Modal ver detalle */}
      <Modal
        open={!!verDetalle}
        onClose={() => setVerDetalle(null)}
        titulo="Detalle del interviniente"
        size="lg"
        footer={
          <button onClick={() => setVerDetalle(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
            Cerrar
          </button>
        }
      >
        {verDetalle && (
          <div className="space-y-3 text-sm">
            {[
              ['Nombre completo', verDetalle.nombre],
              ['Rol procesal', ROL_LABEL[verDetalle.rol_procesal] ?? verDetalle.rol_procesal],
              ['Documento', `${DOC_LABEL[verDetalle.tipo_documento] ?? verDetalle.tipo_documento} ${verDetalle.numero_documento}`],
              ['Representado por', verDetalle.representado_por],
              ['Email', verDetalle.contacto_email],
              ['Teléfono', verDetalle.contacto_telefono],
              ['Domicilio', verDetalle.contacto_domicilio],
              ['Observaciones', verDetalle.observaciones],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex gap-3 py-2 border-b border-[rgba(0,0,0,0.06)] last:border-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84] w-32 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-[#1b3a57]">{value}</span>
              </div>
            ) : null)}
          </div>
        )}
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal
        open={!!confirmarEliminar}
        onClose={() => setConfirmarEliminar(null)}
        titulo="Eliminar interviniente"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmarEliminar(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!confirmarEliminar) return
                eliminarInterviniente(exp.id, confirmarEliminar.id)
                toast.success('Interviniente eliminado.')
                setConfirmarEliminar(null)
              }}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#b91c1c] text-white hover:opacity-90 transition-opacity"
            >
              Eliminar
            </button>
          </>
        }
      >
        {confirmarEliminar && (
          <p className="text-sm text-[#1b3a57]">
            ¿Confirmás que querés eliminar a <span className="font-bold">{confirmarEliminar.nombre}</span>? Esta acción no se puede deshacer.
          </p>
        )}
      </Modal>
    </>
  )
}
