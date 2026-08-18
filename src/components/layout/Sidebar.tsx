import { useState, useMemo, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { ROL_ACCESOS, getNombreCompleto, mapRol } from '../../data/usuarios'
import type { RolSistema } from '../../types'
import { UserSwitcher } from './UserSwitcher'
import Icon from '../ui/Icon'

const NAV_ITEMS: { key: string; icon: string; label: string; ruta: string }[] = [
  { key: 'dashboard',      icon: 'dashboard',    label: 'Panel de Control',       ruta: '/dashboard' },
  { key: 'mesa',           icon: 'inbox',        label: 'Mesa SACO',              ruta: '/mesa' },
  { key: 'actuaciones',    icon: 'work',         label: 'Actuaciones',            ruta: '/actuaciones' },
  { key: 'agenda',         icon: 'calendar',     label: 'Agenda',                 ruta: '/agenda' },
  { key: 'tareas',         icon: 'task',         label: 'Solicitudes',            ruta: '/tareas' },
  { key: 'licencias',      icon: 'clock',        label: 'Licencias',              ruta: '/licencias' },
  { key: 'configuracion',  icon: 'settings',     label: 'Configuración',          ruta: '/configuracion' },
]

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
  const [showSwitcher, setShowSwitcher] = useState(false)
  const location = useLocation()
  const switcherButtonRef = useRef<HTMLButtonElement>(null)

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
      className={`fixed left-0 top-0 h-screen bg-navy flex flex-col z-40 transition-all duration-200 overflow-hidden ${
        sidebarCollapsed ? 'w-[var(--spacing-sidebar-collapsed)]' : 'w-[var(--spacing-sidebar)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-16 flex-shrink-0">
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
        <div className={`flex items-center gap-3 px-3 py-3 border-b border-cream flex-shrink-0 ${
          sidebarCollapsed ? 'justify-center' : ''
        }`}>
          <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-teal text-white">
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {getNombreCompleto(usuarioActivo)}
              </p>
              <p className="text-[10px] text-white/70 truncate">
                {ROL_LABEL[usuarioActivo.rolSistema]}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto pt-[24px] px-[32px] pb-[32px] flex flex-col gap-4">
        {visibleItems.map(item => {
          const active = isActive(item)
          return (
            <Link
              key={item.key}
              to={item.ruta}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center h-[40px] gap-4 px-2 rounded-lg transition-colors group ${
                active
                  ? 'bg-teal text-white border-l-2 border-white'
                  : 'text-white hover:bg-navy-hover border-l-2 border-transparent'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <Icon name={item.icon} className="flex-shrink-0" size={24} />
              {!sidebarCollapsed && (
                <span className={`text-sm truncate ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer — cambiar usuario */}
      <div className="relative flex-shrink-0 border-t border-cream">
        {showSwitcher && (
          <UserSwitcher
            onClose={() => setShowSwitcher(false)}
            triggerRef={switcherButtonRef}
          />
        )}
        <button
          ref={switcherButtonRef}
          onClick={() => setShowSwitcher(v => !v)}
          title="Cambiar usuario"
          className={`w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-navy-hover transition-colors ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <Icon name="swap_horiz" className="flex-shrink-0" size={24} />
          {!sidebarCollapsed && (
            <span className="text-sm font-medium">Cambiar usuario</span>
          )}
        </button>
      </div>
    </aside>
  )
}
