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

const VARIANT_CLASSES = {
  primary:   'bg-[#256386] hover:bg-[#2a5278] text-white shadow-sm',
  secondary: 'bg-white border border-[rgba(0,0,0,0.2)] text-[#242C4F] hover:bg-[#E3E4E9]',
  ghost:     'text-[#242C4F] hover:bg-[#E5E5E5]',
  danger:    'bg-[#C3292F] hover:bg-[#991b1b] text-white',
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
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#E4EDF2]/50
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && (
        <Icon name="refresh" className="animate-spin" size={18} />
      )}
      {!loading && icon && (
        <Icon name={icon} size={18} />
      )}
      {children}
      {iconRight && (
        <Icon name={iconRight} size={18} />
      )}
    </button>
  )
}
