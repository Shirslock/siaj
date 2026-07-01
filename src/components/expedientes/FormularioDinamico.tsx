import type { CampoFormulario } from '../../types'
import { FormField } from '../ui/FormField'
import Icon from '../ui/Icon'
import { JUZGADOS, LINEAS_FERROVIARIAS } from '../../data/catalogos'
import { FUEROS_CIVIL_LAB, FUEROS_PENAL, getJuzgadosPorFuero, getSecretarias } from '../../data/juzgadosPJN'

interface Props {
  campos: CampoFormulario[]
  valores: Record<string, unknown>
  onChange: (id: string, valor: unknown) => void
  area?: string
}

export function FormularioDinamico({ campos, valores, onChange, area }: Props) {
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

        if (campo.type === 'fuero_select') {
          const baseId = campo.id.replace('_fuero', '')
          const fuerosPorArea = area === 'PENAL' ? FUEROS_PENAL : FUEROS_CIVIL_LAB
          return (
            <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
              <select
                className="field-input w-full"
                value={valor}
                onChange={e => {
                  onChange(campo.id, e.target.value)
                  onChange(baseId, '')
                }}
              >
                <option value="">Seleccionar fuero...</option>
                {fuerosPorArea.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </FormField>
          )
        }

        if (campo.type === 'juzgado_filtered') {
          const fueroIdDirecto = `${campo.id}_fuero`
          const fueroIdHermano = `${campo.id.replace('tribunal', 'juzgado')}_fuero`
          const fueroVal = (valores[fueroIdDirecto] as string) || (valores[fueroIdHermano] as string) || ''
          const juzgados = fueroVal ? getJuzgadosPorFuero(fueroVal) : []
          const secretariaHija = campos.find(c => c.type === 'secretaria_juzgado' && c.juzgadoRef === campo.id)
          return (
            <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
              <select
                className="field-input w-full"
                value={valor}
                disabled={!fueroVal}
                onChange={e => {
                  onChange(campo.id, e.target.value)
                  if (secretariaHija) onChange(secretariaHija.id, '')
                }}
              >
                <option value="">{fueroVal ? 'Seleccionar juzgado / tribunal...' : 'Primero seleccioná un fuero'}</option>
                {juzgados.map(j => <option key={j.nombre} value={j.nombre}>{j.nombre}</option>)}
              </select>
            </FormField>
          )
        }

        if (campo.type === 'secretaria_juzgado') {
          const juzgadoId = campo.juzgadoRef ?? campo.id.replace('secretaria', 'juzgado')
          const fueroId = `${juzgadoId}_fuero`
          const fueroVal = (valores[fueroId] as string) ?? ''
          const juzgadoVal = (valores[juzgadoId] as string) ?? ''
          const secs = fueroVal && juzgadoVal ? getSecretarias(fueroVal, juzgadoVal) : []

          let input: React.ReactNode
          if (!juzgadoVal) {
            input = (
              <input
                type="text"
                className="field-input w-full"
                placeholder="Seleccioná primero un juzgado"
                disabled
                value=""
                onChange={() => {}}
              />
            )
          } else if (secs.length === 1 && secs[0] === 'ÚNICA') {
            if (valor !== 'ÚNICA') {
              setTimeout(() => onChange(campo.id, 'ÚNICA'), 0)
            }
            input = (
              <input
                type="text"
                className="field-input w-full bg-[#f5f5f5] text-[#4a6a84] cursor-not-allowed"
                value="ÚNICA"
                readOnly
              />
            )
          } else if (secs.length === 1 && secs[0] === 'A COMPLETAR') {
            input = (
              <input
                type="text"
                className="field-input w-full"
                placeholder="Ingresar secretaría..."
                value={valor}
                onChange={e => onChange(campo.id, e.target.value)}
              />
            )
          } else {
            input = (
              <select className="field-input w-full" value={valor} onChange={e => onChange(campo.id, e.target.value)}>
                <option value="">Seleccionar secretaría...</option>
                {secs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )
          }

          return (
            <FormField key={campo.id} label={campo.label} hint={campo.hint} required={campo.required} full={campo.full}>
              {input}
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
