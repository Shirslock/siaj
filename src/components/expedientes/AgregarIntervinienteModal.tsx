import { useState, useEffect } from 'react'
import type { Interviniente } from '../../types'
import { useExpedientesStore } from '../../store/expedientes.store'
import { Modal } from '../ui/Modal'
import { ROLES_INTERVINIENTE, TIPOS_DOC_INTERVINIENTE } from '../../data/catalogos'
import { toast } from 'react-toastify'

interface Props {
  expedienteId: string
  open: boolean
  onClose: () => void
  // Pre-carga de conveniencia (ej. desde una novedad PJN) — siempre editable, nunca
  // guarda solo: el letrado revisa/completa y confirma con "Agregar".
  valoresIniciales?: Partial<Omit<Interviniente, 'id'>>
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

// Modal de alta de interviniente, extraído de IntervinientesTab.tsx para poder abrirse
// también desde una card de novedad PJN (fuera del contexto de esa tab). Solo cubre el
// alta — la edición sigue viviendo en IntervinientesTab.tsx.
export function AgregarIntervinienteModal({ expedienteId, open, onClose, valoresIniciales }: Props) {
  const { agregarInterviniente } = useExpedientesStore()
  const [form, setForm] = useState<Omit<Interviniente, 'id'>>(BLANK)
  const [formNombre, setFormNombre] = useState({ apellido: '', nombre: '' })

  useEffect(() => {
    if (!open) return
    const base = { ...BLANK, ...valoresIniciales }
    setForm(base)
    const partes = base.nombre ? base.nombre.split(', ') : ['', '']
    setFormNombre({ apellido: partes[0] ?? '', nombre: partes[1] ?? '' })
  }, [open, valoresIniciales])

  function setField(k: keyof typeof BLANK, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function resetForm() {
    setForm(BLANK)
    setFormNombre({ apellido: '', nombre: '' })
  }

  function cerrar() {
    onClose()
    resetForm()
  }

  function confirmar() {
    const nombreCompleto = `${formNombre.apellido.trim()}, ${formNombre.nombre.trim()}`
    const nuevo: Interviniente = {
      ...form,
      nombre: nombreCompleto,
      id: `IN_${Date.now()}`,
      contacto_email:     form.contacto_email     || undefined,
      contacto_telefono:  form.contacto_telefono  || undefined,
      contacto_domicilio: form.contacto_domicilio || undefined,
      representado_por:   form.representado_por   || undefined,
      observaciones:      form.observaciones      || undefined,
    }
    agregarInterviniente(expedienteId, nuevo)
    toast.success('Interviniente agregado.')
    cerrar()
  }

  return (
    <Modal
      open={open}
      onClose={cerrar}
      titulo="Agregar interviniente"
      size="lg"
      footer={
        <>
          <button
            onClick={cerrar}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!formNombre.apellido.trim() || !formNombre.nombre.trim() || !form.numero_documento.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Agregar
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
  )
}
