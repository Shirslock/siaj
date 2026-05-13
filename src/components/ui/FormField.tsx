import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  hint?: string
  required?: boolean
  error?: string
  full?: boolean
  children: ReactNode
}

export function FormField({ label, hint, required, error, full, children }: FormFieldProps) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="field-label">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  )
}
