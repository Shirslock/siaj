import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { ROL_ACCESOS, getNombreCompleto, mapRol } from '../../data/usuarios'
import type { RolSistema } from '../../types'
import Icon from '../ui/Icon'

const NAV_ITEMS: { key: string; icon: string; label: string; ruta: string }[] = [
  { key: 'dashboard',      icon: 'dashboard',    label: 'Dashboard',              ruta: '/dashboard' },
  { key: 'mesa',           icon: 'inbox',        label: 'Mesa SACO',              ruta: '/mesa' },
  { key: 'actuaciones',    icon: 'work',         label: 'Actuaciones',            ruta: '/actuaciones' },
  { key: 'solicitudes',    icon: 'task',         label: 'Solicitudes',            ruta: '/solicitudes' },
  { key: 'configuracion',  icon: 'settings',     label: 'Configuración',          ruta: '/configuracion' },
]

const AVATAR_COLORS: Record<RolSistema, string> = {
  REFERENTE:      'bg-[#1b3a57] text-white',
  COORDINADOR:    'bg-[#2a5278] text-white',
  ABOGADO:        'bg-[#4a6a84] text-white',
  ADMINISTRATIVO: 'bg-[#7a9ab4] text-white',
}

const ROL_LABEL: Record<RolSistema, string> = {
  REFERENTE:      'Referente',
  COORDINADOR:    'Coordinador',
  ABOGADO:        'Abogado/a',
  ADMINISTRATIVO: 'Administrativo',
}

interface SidebarProps {
  activePage: string
}

export function Sidebar({ activePage }: SidebarProps) {
  const { usuarioActivo, sidebarCollapsed, toggleSidebar } = useUIStore()
  const location = useLocation()

  const visibleItems = useMemo(() => {
    if (!usuarioActivo) return []
    const union = new Set(usuarioActivo.roles.flatMap(rol => ROL_ACCESOS[mapRol(rol)].nav))
    return NAV_ITEMS.filter(item => union.has(item.key))
  }, [usuarioActivo])

  const isActive = (item: { key: string; ruta: string }) =>
    activePage === item.key || location.pathname === item.ruta

  const initials = usuarioActivo
    ? `${usuarioActivo.apellido.charAt(0)}${usuarioActivo.nombre.charAt(0)}`
    : '?'

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#E5E5E5] flex flex-col z-40 transition-all duration-200 overflow-hidden ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-16 flex-shrink-0 bg-[#1b3a57]">
        {!sidebarCollapsed && (
          <div className="border-l-[3px] border-white pl-2.5">
            <p className="font-headline font-black text-white text-[13px] leading-tight tracking-tight">TRENES</p>
            <p className="font-headline font-black text-white text-[13px] leading-tight tracking-tight">ARGENTINOS</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-lg text-white/70 hover:bg-white/15 transition-colors ${
            sidebarCollapsed ? 'mx-auto' : ''
          }`}
          title={sidebarCollapsed ? 'Expandir' : 'Contraer'}
        >
          <Icon name={sidebarCollapsed ? 'menu' : 'menu_open'} size={22} />
        </button>
      </div>

      {/* Usuario activo */}
      {usuarioActivo && (
        <div className={`flex items-center gap-3 px-3 py-3 border-b border-black/10 flex-shrink-0 ${
          sidebarCollapsed ? 'justify-center' : ''
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${AVATAR_COLORS[usuarioActivo.rolSistema]}`}>
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1b3a57] truncate leading-tight">
                {getNombreCompleto(usuarioActivo)}
              </p>
              <p className="text-[10px] text-[#4a6a84] truncate">
                {ROL_LABEL[usuarioActivo.rolSistema]}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {visibleItems.map(item => {
          const active = isActive(item)
          return (
            <Link
              key={item.key}
              to={item.ruta}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg mb-0.5 transition-colors group ${
                active
                  ? 'bg-[#C4DFE8] text-[#1b3a57] border-l-2 border-[#1b3a57]'
                  : 'text-[#1b3a57] hover:bg-[#d8d8d8] border-l-2 border-transparent'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <Icon name={item.icon} className="flex-shrink-0" size={22} />
              {!sidebarCollapsed && (
                <span className={`text-sm truncate ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}
