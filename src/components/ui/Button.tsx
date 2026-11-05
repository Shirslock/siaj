import type { ReactNode } from 'react'
import Icon from './Icon'

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

// PRD (siaj-design-system.md §3): primario azul-700 / secundario borde gris-300, rounded-md, sin sombra.
const VARIANT_CLASSES = {
  primary:   'bg-blue-700 hover:bg-blue-800 text-white',
  secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  ghost:     'text-gray-600 hover:bg-gray-100',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
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
        inline-flex items-center justify-center gap-1.5 rounded-md
        transition-colors focus:outline-none
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && (
        <Icon name="refresh" className="animate-spin" size={16} />
      )}
      {!loading && icon && (
        <Icon name={icon} size={16} />
      )}
      {children}
      {iconRight && (
        <Icon name={iconRight} size={16} />
      )}
    </button>
  )
}
