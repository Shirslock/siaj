import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  titulo: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, titulo, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-in"
      style={{ backgroundColor: 'rgba(11,15,16,0.5)' }}
      onClick={onClose}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-card-lg w-full ${SIZE_CLASSES[size]} flex flex-col max-h-[90vh] modal-content-in`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.12)] flex-shrink-0">
          <h2 className="font-headline font-semibold text-lg text-[#1b3a57]">{titulo}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-[rgba(0,0,0,0.12)] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
