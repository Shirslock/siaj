import type { CampoFormulario } from '../../types'
import { FormField } from '../ui/FormField'
import Icon from '../ui/Icon'
import { JUZGADOS, LINEAS_FERROVIARIAS } from '../../data/catalogos'

interface Props {
  campos: CampoFormulario[]
  valores: Record<string, unknown>
  onChange: (id: string, valor: unknown) => void
}

export function FormularioDinamico({ campos, valores, onChange }: Props) {
  if (campos.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
      {campos.map(campo => {
        const valor = (valores[campo.id] as string) ?? ''

        if (campo.type === 'textarea') {
          return (
            <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
              <textarea
                className="field-input resize-y"
                style={{ minHeight: '80px' }}
                placeholder={campo.placeholder}
                value={valor}
                onChange={e => onChange(campo.id, e.target.value)}
              />
            </FormField>
          )
        }

        if (campo.type === 'select' && campo.options) {
          return (
            <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
              <select className="field-input" value={valor} onChange={e => onChange(campo.id, e.target.value)}>
                <option value="">Seleccionar…</option>
                {(campo.options as Array<string | { value: string; label: string }>).map(opt => {
                  const v = typeof opt === 'string' ? opt : opt.value
                  const l = typeof opt === 'string' ? opt : opt.label
                  return <option key={v} value={v}>{l}</option>
                })}
              </select>
            </FormField>
          )
        }

        if (campo.type === 'juzgado') {
          return (
            <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
              <select className="field-input" value={valor} onChange={e => onChange(campo.id, e.target.value)}>
                <option value="">Seleccionar…</option>
                {JUZGADOS.map(j => <option key={j.id} value={j.id}>{j.label}</option>)}
              </select>
            </FormField>
          )
        }

        if (campo.type === 'linea') {
          return (
            <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
              <select className="field-input" value={valor} onChange={e => onChange(campo.id, e.target.value)}>
                <option value="">Seleccionar…</option>
                {LINEAS_FERROVIARIAS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </FormField>
          )
        }

        if (campo.type === 'multiselect' && campo.options) {
          const opts = campo.options as string[]
          const raw = valores[campo.id]
          const slots: string[] = Array.isArray(raw) && raw.length > 0 ? raw as string[] : ['']

          const commit = (newSlots: string[]) =>
            onChange(campo.id, newSlots.filter(v => v !== ''))

          return (
            <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
              <div className="space-y-2">
                {slots.map((slotVal, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <select
                      value={slotVal}
                      onChange={e => {
                        const nuevos = [...slots]
                        nuevos[si] = e.target.value
                        commit(nuevos)
                      }}
                      className="field-input flex-1"
                    >
                      <option value="">Seleccioná una opción…</option>
                      {opts.map(opt => (
                        <option
                          key={opt}
                          value={opt}
                          disabled={slots.some((v, i) => i !== si && v === opt)}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => commit(slots.filter((_, i) => i !== si))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#fee2e2] hover:text-[#b91c1c] transition-colors flex-shrink-0"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {slots.filter(v => v !== '').length < opts.length && (
                  <button
                    type="button"
                    onClick={() => commit([...slots, ''])}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#1b3a57] hover:text-[#2a5278] transition-colors mt-1"
                  >
                    <Icon name="add" size={14} />
                    Agregar otro
                  </button>
                )}
              </div>
            </FormField>
          )
        }

        if (campo.type === 'boolean') {
          return (
            <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
              <label className="inline-flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(valores[campo.id])}
                  onChange={e => onChange(campo.id, e.target.checked)}
                  className="rounded accent-primary"
                />
                <span className="text-sm text-[#1b3a57]">{campo.placeholder ?? 'Sí'}</span>
              </label>
            </FormField>
          )
        }

        return (
          <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
            <input
              type={campo.type === 'date' ? 'date' : campo.type === 'money' ? 'number' : 'text'}
              className={`field-input${campo.mono ? ' font-mono' : ''}`}
              placeholder={campo.placeholder}
              value={valor}
              onChange={e => onChange(campo.id, e.target.value)}
            />
          </FormField>
        )
      })}
    </div>
  )
}
