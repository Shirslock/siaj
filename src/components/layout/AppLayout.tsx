import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BogaFab } from '../boga/BogaFab'

const PAGE_ACTIVE: Record<string, string> = {
  '/home':            'home',
  '/dashboard':       'dashboard',
  '/mesa':            'mesa',
  '/mesa/alta':       'mesa',
  '/actuaciones':     'actuaciones',
  '/bandeja/abogado': 'actuaciones',
  '/bandeja/area':    'actuaciones',
  '/agenda':          'agenda',
  '/configuracion':   'configuracion',
  '/novedades-judiciales': 'novedades_judiciales',
  '/boga':            'boga',
}

// Estructura del PRD (siaj-design-system.md §2): contenedor h-screen con sidebar off-canvas,
// header navy sticky de 48px y <main> con scroll propio.
export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  let activePage = PAGE_ACTIVE[pathname] ?? ''
  if (pathname.startsWith('/expediente/') || pathname.startsWith('/causa/')) activePage = 'actuaciones'

  // dentro del detalle de una actuación ya está la tab "Boga" con contexto específico,
  // y en /boga ya está el chat a pantalla completa — el flotante es redundante en ambos
  const mostrarBogaFab = !pathname.startsWith('/expediente/') && pathname !== '/boga'

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F8]">
      <Sidebar activePage={activePage} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main id="app-main" className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      {mostrarBogaFab && <BogaFab />}
    </div>
  )
}
