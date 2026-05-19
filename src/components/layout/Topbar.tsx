import { useUIStore } from '../../store/ui.store'
import { getNombreCompleto } from '../../data/usuarios'
import type { RolSistema } from '../../types'

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
        <h1 className="font-headline font-bold text-lg text-on-primary leading-tight">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-sm text-on-primary opacity-80 leading-tight">{subtitulo}</p>
        )}
      </div>

      {/* Usuario + notificaciones */}
      <div className="flex items-center gap-4">
        {usuarioActivo && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-primary leading-tight">
                {getNombreCompleto(usuarioActivo)}
              </p>
              <p className="text-xs text-on-primary opacity-70 leading-tight">
                {ROL_LABEL[usuarioActivo.rolSistema]}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-on-primary/20 flex items-center justify-center text-on-primary text-xs font-bold flex-shrink-0">
              {initials}
            </div>
          </div>
        )}
        <button className="text-on-primary opacity-60 hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-[22px]">notifications_none</span>
        </button>
      </div>
    </header>
  )
}
