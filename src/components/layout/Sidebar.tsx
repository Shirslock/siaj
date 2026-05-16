import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { ROL_ACCESOS, getNombreCompleto, mapRol } from '../../data/usuarios'
import type { RolSistema } from '../../types'
import { UserSwitcher } from './UserSwitcher'

const NAV_ITEMS: { key: string; icon: string; label: string; ruta: string }[] = [
  { key: 'dashboard',       icon: 'dashboard',    label: 'Dashboard',     ruta: '/dashboard' },
  { key: 'mesa',            icon: 'inbox',         label: 'Mesa SIAJ',     ruta: '/mesa' },
  { key: 'bandeja-abogado', icon: 'work',          label: 'Mi Bandeja',    ruta: '/bandeja/abogado' },
  { key: 'bandeja-area',    icon: 'folder_shared', label: 'Bandeja Área',  ruta: '/bandeja/area' },
  { key: 'gestion-penal',   icon: 'gavel',         label: 'Gestión Penal', ruta: '/penal' },
]

const AVATAR_COLORS: Record<RolSistema, string> = {
  REFERENTE:      'bg-primary text-on-primary',
  COORDINADOR:    'bg-secondary text-white',
  ABOGADO:        'bg-on-surface text-surface',
  ADMINISTRATIVO: 'bg-outline text-surface',
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
  const [showSwitcher, setShowSwitcher] = useState(false)
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
      className={`fixed left-0 top-0 h-screen bg-surface-container-high flex flex-col z-40 transition-all duration-200 overflow-hidden ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-16 flex-shrink-0 border-b border-outline-variant/30">
        {!sidebarCollapsed && (
          <span className="font-headline font-bold text-primary text-lg tracking-tight select-none">
            SIAJ
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors ${
            sidebarCollapsed ? 'mx-auto' : ''
          }`}
          title={sidebarCollapsed ? 'Expandir' : 'Contraer'}
        >
          <span className="material-symbols-outlined text-[22px]">
            {sidebarCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>
      </div>

      {/* Usuario activo */}
      {usuarioActivo && (
        <div className={`flex items-center gap-3 px-3 py-3 border-b border-outline-variant/30 flex-shrink-0 ${
          sidebarCollapsed ? 'justify-center' : ''
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${AVATAR_COLORS[usuarioActivo.rolSistema]}`}>
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate leading-tight">
                {getNombreCompleto(usuarioActivo)}
              </p>
              <p className="text-[10px] text-on-surface-variant truncate">
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
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-l-2 border-transparent'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <span className={`material-symbols-outlined text-[22px] flex-shrink-0 ${active ? 'text-primary' : ''}`}>
                {item.icon}
              </span>
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
      <div className="flex-shrink-0 border-t border-outline-variant/30 p-2 relative">
        {showSwitcher && (
          <UserSwitcher onClose={() => setShowSwitcher(false)} />
        )}
        <button
          onClick={() => setShowSwitcher(v => !v)}
          title="Cambiar usuario"
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <span className="material-symbols-outlined text-[22px] flex-shrink-0">swap_horiz</span>
          {!sidebarCollapsed && (
            <span className="text-sm font-medium">Cambiar usuario</span>
          )}
        </button>
      </div>
    </aside>
  )
}
