import { useRef, useEffect } from 'react'
import { USUARIOS } from '../../data/usuarios'
import { useUIStore } from '../../store/ui.store'
import type { RolSistema } from '../../types'

const ROL_ORDEN: RolSistema[] = ['REFERENTE', 'COORDINADOR', 'ABOGADO', 'ADMINISTRATIVO']

const ROL_LABELS: Record<RolSistema, string> = {
  REFERENTE:      'Referentes',
  COORDINADOR:    'Coordinadores',
  ABOGADO:        'Abogados / Asistentes',
  ADMINISTRATIVO: 'Mesa',
}

const AVATAR_COLORS: Record<RolSistema, string> = {
  REFERENTE:      'bg-[#1b3a57] text-white',
  COORDINADOR:    'bg-[#2a5278] text-white',
  ABOGADO:        'bg-[#4a6a84] text-white',
  ADMINISTRATIVO: 'bg-[#7a9ab4] text-white',
}

interface UserSwitcherProps {
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement>
}

export function UserSwitcher({ onClose, triggerRef }: UserSwitcherProps) {
  const { usuarioActivo, setUsuarioActivo, showToast } = useUIStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, triggerRef])

  const grupos = ROL_ORDEN.map(rol => ({
    rol,
    label: ROL_LABELS[rol],
    usuarios: USUARIOS.filter(u => u.rolSistema === rol && u.roles.length > 0),
  })).filter(g => g.usuarios.length > 0)

  const handleSelect = (id: string, nombre: string) => {
    setUsuarioActivo(id)
    showToast(`Usuario cambiado a ${nombre}`, 'success')
    onClose()
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 w-full max-h-96 overflow-y-auto z-[60] bg-white border border-[rgba(0,0,0,0.12)] rounded-xl shadow-card-lg flex flex-col"
    >
      <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.08)] bg-[#f5f5f5] sticky top-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a6a84]">
          Cambiar usuario — Demo
        </p>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        {grupos.map(({ rol, label, usuarios }) => (
          <div key={rol}>
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#7a9ab4]">
              {label}
            </p>
            {usuarios.map(u => {
              const initials = `${u.apellido.charAt(0)}${u.nombre.charAt(0)}`
              const isActive = u.id === usuarioActivo?.id

              return (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u.id, `${u.apellido}, ${u.nombre}`)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'bg-[#C4DFE8] text-[#1b3a57]'
                      : 'hover:bg-[#e8e8e8] text-[#1b3a57]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${AVATAR_COLORS[u.rolSistema]}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.apellido}, {u.nombre}</p>
                    <p className="text-[10px] text-[#4a6a84] truncate">{u.rolBD}</p>
                  </div>
                  {isActive && (
                    <span className="material-symbols-outlined text-[#1b3a57] text-[18px] flex-shrink-0">
                      check
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
