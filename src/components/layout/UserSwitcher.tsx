import { useRef, useEffect } from 'react'
import { USUARIOS } from '../../data/usuarios'
import { useUIStore } from '../../store/ui.store'
import type { RolSistema } from '../../types'
import Icon from '../ui/Icon'
import { toast } from 'react-toastify'

const ROL_ORDEN: RolSistema[] = ['REFERENTE', 'COORDINADOR', 'ABOGADO', 'ADMINISTRATIVO']

const ROL_LABELS: Record<RolSistema, string> = {
  REFERENTE:      'Referentes',
  COORDINADOR:    'Coordinadores',
  ABOGADO:        'Abogados / Asistentes',
  ADMINISTRATIVO: 'Mesa',
}

const AVATAR_COLORS: Record<RolSistema, string> = {
  REFERENTE:      'bg-blue-700 text-white',
  COORDINADOR:    'bg-blue-800 text-white',
  ABOGADO:        'bg-gray-500 text-white',
  ADMINISTRATIVO: 'bg-gray-400 text-white',
}

interface UserSwitcherProps {
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement>
}

export function UserSwitcher({ onClose, triggerRef }: UserSwitcherProps) {
  const { usuarioActivo, setUsuarioActivo } = useUIStore()
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
    toast.success(`Usuario cambiado a ${nombre}`)
    onClose()
  }

  return (
    <div
      ref={ref}
      className="fixed bottom-16 left-2 w-72 bg-white border border-gray-200 rounded-lg shadow-card-lg z-[200] overflow-hidden max-h-[70vh] flex flex-col"
    >
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-100 sticky top-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Cambiar usuario — Demo
        </p>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        {grupos.map(({ rol, label, usuarios }) => (
          <div key={rol}>
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
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
                      ? 'bg-blue-100 text-gray-800'
                      : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${AVATAR_COLORS[u.rolSistema]}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.apellido}, {u.nombre}</p>
                    <p className="text-[10px] text-gray-500 truncate">{u.rolBD}</p>
                  </div>
                  {isActive && (
                    <Icon name="check" className="flex-shrink-0" size={18} />
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
