import type { ReactNode } from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  iconRight?: string
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  children: ReactNode
}

const VARIANT_CLASSES = {
  primary:   'bg-gradient-to-br from-primary to-primary-dim text-on-primary hover:opacity-90 shadow-sm',
  secondary: 'bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high',
  ghost:     'text-primary hover:bg-primary/10',
  danger:    'bg-error text-white hover:opacity-90',
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  children,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && (
        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
      )}
      {!loading && icon && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      {children}
      {iconRight && (
        <span className="material-symbols-outlined text-[18px]">{iconRight}</span>
      )}
    </button>
  )
}
