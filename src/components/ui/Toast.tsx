import { useUIStore } from '../../store/ui.store'

const TOAST_CONFIG = {
  success: { bg: 'bg-green-100 border-green-300',   text: 'text-green-800',              icon: 'check_circle' },
  error:   { bg: 'bg-[#fee2e2] border-red-300',text: 'text-[#991b1b]',     icon: 'error' },
  warn:    { bg: 'bg-yellow-100 border-yellow-300',  text: 'text-yellow-800',             icon: 'warning' },
  info:    { bg: 'bg-[#C4DFE8] border-[rgba(27,58,87,0.20)]', text: 'text-[#1b3a57]', icon: 'info' },
} as const

export function Toast() {
  const { toasts, removeToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80">
      {toasts.map(toast => {
        const cfg = TOAST_CONFIG[toast.tipo]
        return (
          <div
            key={toast.id}
            className={`toast-slide-in flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card ${cfg.bg} ${cfg.text}`}
          >
            <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">
              {cfg.icon}
            </span>
            <p className="flex-1 text-sm font-medium leading-snug">{toast.mensaje}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
