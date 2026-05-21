import { useUIStore } from '../../store/ui.store'
import { getNombreCompleto } from '../../data/usuarios'
import type { RolSistema } from '../../types'
import Icon from '../ui/Icon'

const ROL_LABEL: Record<RolSistema, string> = {
  REFERENTE:      'Referente',
  COORDINADOR:    'Coordinador',
  ABOGADO:        'Abogado/a',
  ADMINISTRATIVO: 'Administrativo',
}

interface TopbarProps {
  titulo: string
  subtitulo?: string
}

export function Topbar({ titulo, subtitulo }: TopbarProps) {
  const { sidebarCollapsed, usuarioActivo } = useUIStore()

  const initials = usuarioActivo
    ? `${usuarioActivo.apellido.charAt(0)}${usuarioActivo.nombre.charAt(0)}`
    : '?'

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-[#63B2DA] z-50 flex items-center justify-between px-6 transition-all duration-200 ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}
    >
      {/* Título */}
      <div>
        <h1 className="font-headline font-bold text-lg text-white leading-tight">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-sm text-white opacity-70 leading-tight">{subtitulo}</p>
        )}
      </div>

      {/* Usuario + notificaciones */}
      <div className="flex items-center gap-4">
        {usuarioActivo && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-tight">
                {getNombreCompleto(usuarioActivo)}
              </p>
              <p className="text-xs text-[#C4DFE8] leading-tight">
                {ROL_LABEL[usuarioActivo.rolSistema]}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
          </div>
        )}
        <button className="text-white opacity-60 hover:opacity-100 transition-opacity">
          <Icon name="notifications_none" size={22} />
        </button>
      </div>
    </header>
  )
}
