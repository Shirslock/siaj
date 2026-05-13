import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/mesa':            'Mesa SIAJ',
  '/mesa/alta':       'Alta de Expediente',
  '/bandeja/abogado': 'Mi Bandeja',
  '/bandeja/area':    'Bandeja Área',
  '/penal':           'Gestión Penal',
  '/agenda':          'Agenda',
}

const PAGE_ACTIVE: Record<string, string> = {
  '/dashboard':       'dashboard',
  '/mesa':            'mesa',
  '/mesa/alta':       'mesa',
  '/bandeja/abogado': 'bandeja-abogado',
  '/bandeja/area':    'bandeja-area',
  '/penal':           'gestion-penal',
  '/agenda':          'agenda',
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useUIStore()
  const { pathname } = useLocation()

  let titulo   = PAGE_TITLES[pathname] ?? 'SIAJ'
  let activePage = PAGE_ACTIVE[pathname] ?? ''

  if (pathname.startsWith('/expediente/')) {
    titulo     = 'Detalle de Expediente'
    activePage = 'bandeja-abogado'
  }

  if (pathname.startsWith('/causa/')) {
    titulo     = `Causa ${pathname.replace('/causa/', '')}`
    activePage = 'bandeja-abogado'
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar activePage={activePage} />
      <Topbar titulo={titulo} />
      <main
        className={`pt-16 transition-all duration-200 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
