import { useState, useMemo, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { usePjnStore } from '../../store/pjn.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { ROL_ACCESOS, mapRol } from '../../data/usuarios'
import { filtrarNovedadesPorRol, filtrarAlertasActuacionesPorRol } from '../../utils/pjnVisibilidad'
import { UserSwitcher } from './UserSwitcher'
import Icon from '../ui/Icon'

const NAV_ITEMS: { key: string; icon: string; label: string; ruta: string }[] = [
  { key: 'home',           icon: 'nav_home',        label: 'Principal',              ruta: '/home' },
  { key: 'dashboard',      icon: 'nav_dashboard',   label: 'Panel de Control',       ruta: '/dashboard' },
  { key: 'mesa',           icon: 'nav_mesa',        label: 'Mesa SACO',              ruta: '/mesa' },
  { key: 'actuaciones',    icon: 'nav_actuaciones', label: 'Actuaciones',            ruta: '/actuaciones' },
  { key: 'novedades_judiciales', icon: 'refresh',   label: 'Novedades judiciales',   ruta: '/novedades-judiciales' },
  { key: 'boga',           icon: 'smart_toy',       label: 'Chat con Boga',          ruta: '/boga' },
  { key: 'agenda',         icon: 'nav_agenda',      label: 'Agenda',                 ruta: '/agenda' },
  { key: 'tareas',         icon: 'nav_solicitudes', label: 'Solicitudes',            ruta: '/tareas' },
  { key: 'licencias',      icon: 'clock',           label: 'Licencias',              ruta: '/licencias' },
  { key: 'configuracion',  icon: 'settings',        label: 'Configuración',          ruta: '/configuracion' },
]

interface SidebarProps {
  activePage: string
}

// PRD (siaj-design-system.md §2): aside fijo off-canvas, fondo #E5E5E5, links de texto con
// hover azul y el activo en azul-700 semibold. Se abre desde la hamburguesa del header.
export function Sidebar({ activePage }: SidebarProps) {
  const { usuarioActivo, sidebarOpen, closeSidebar } = useUIStore()
  const { novedades, actuacionesSinCargar } = usePjnStore()
  const { expedientes } = useExpedientesStore()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const location = useLocation()
  const switcherButtonRef = useRef<HTMLButtonElement>(null)

  const visibleItems = useMemo(() => {
    if (!usuarioActivo) return []
    const union = new Set(usuarioActivo.roles.flatMap(rol => ROL_ACCESOS[mapRol(rol)].nav))
    return NAV_ITEMS.filter(item => union.has(item.key))
  }, [usuarioActivo])

  const novedadesPendientes = useMemo(() => {
    const novedadesCount = filtrarNovedadesPorRol(novedades, expedientes, usuarioActivo)
      .filter(n => n.estado === 'pendiente').length
    const alertasCount = filtrarAlertasActuacionesPorRol(actuacionesSinCargar, usuarioActivo)
      .filter(a => a.estado === 'pendiente').length
    return novedadesCount + alertasCount
  }, [novedades, actuacionesSinCargar, expedientes, usuarioActivo])

  const isActive = (item: { key: string; ruta: string }) =>
    activePage === item.key || location.pathname === item.ruta

  return (
    <>
      {/* Cierra el menú al hacer clic afuera */}
      {sidebarOpen && <div className="fixed inset-0 z-40" onClick={closeSidebar} />}

      <aside
        className={`bg-[#E5E5E5] text-[#1b3a57] w-64 h-full flex flex-col transition-transform duration-300 overflow-y-auto overflow-x-hidden py-6 fixed top-0 left-0 z-50 shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <p className="px-4 pb-4 text-lg font-semibold text-[#1b3a57]">SIAJ</p>

        <nav className="flex flex-col gap-3 px-4 flex-1">
          {visibleItems.map(item => {
            const active = isActive(item)
            return (
              <Link
                key={item.key}
                to={item.ruta}
                onClick={closeSidebar}
                className={`flex items-center gap-3 transition-colors text-sm hover:text-blue-700 ${
                  active ? 'text-blue-700 font-semibold' : 'text-[#1b3a57]'
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span className="flex-1 flex items-center justify-between gap-2 truncate">
                  {item.label}
                  {item.key === 'novedades_judiciales' && novedadesPendientes > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                      {novedadesPendientes > 9 ? '9+' : novedadesPendientes}
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Herramienta de la demo: cambiar de usuario (no existe en el PRD) */}
        <div className="relative px-4 pt-4 mt-4 border-t border-black/10">
          {showSwitcher && (
            <UserSwitcher
              onClose={() => setShowSwitcher(false)}
              triggerRef={switcherButtonRef}
            />
          )}
          <button
            ref={switcherButtonRef}
            onClick={() => setShowSwitcher(v => !v)}
            className="flex items-center gap-3 text-sm text-[#1b3a57] hover:text-blue-700 transition-colors"
          >
            <Icon name="swap_horiz" size={20} />
            Cambiar usuario
          </button>
        </div>
      </aside>
    </>
  )
}
