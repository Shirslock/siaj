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
  REFERENTE:      'bg-primary text-on-primary',
  COORDINADOR:    'bg-secondary text-white',
  ABOGADO:        'bg-on-surface text-surface',
  ADMINISTRATIVO: 'bg-outline text-surface',
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
      className="fixed bottom-16 left-2 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-card-lg z-[200] overflow-hidden max-h-[70vh] flex flex-col"
    >
      <div className="px-4 py-3 border-b border-outline-variant/40 bg-surface-container-low">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          Cambiar usuario — Demo
        </p>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        {grupos.map(({ rol, label, usuarios }) => (
          <div key={rol}>
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-outline">
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
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${AVATAR_COLORS[u.rolSistema]}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.apellido}, {u.nombre}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{u.rolBD}</p>
                  </div>
                  {isActive && (
                    <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
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
