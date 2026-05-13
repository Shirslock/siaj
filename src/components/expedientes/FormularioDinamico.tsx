import type { CampoFormulario } from '../../types'
import { FormField } from '../ui/FormField'
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
                <span className="text-sm text-on-surface">{campo.placeholder ?? 'Sí'}</span>
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
