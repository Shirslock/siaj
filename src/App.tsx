import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { useUIStore } from './store/ui.store'
import { RUTAS } from './utils/routing'
import DashboardPage from './pages/Dashboard/Dashboard.page'
import HomePage from './pages/Home/Home.page'
import Home2Page from './pages/Home/Home2.page'
import Home3Page from './pages/Home/Home3.page'
import MesaSacoPage from './pages/MesaSaco/MesaSaco.page'
import AltaExpedientePage from './pages/AltaExpediente/AltaExpediente.page'
import ActuacionesPage from './pages/Actuaciones/Actuaciones.page'
import CausaDetallePage from './pages/CausaDetalle/CausaDetalle.page'
import DetalleExpedientePage from './pages/DetalleExpediente/DetalleExpediente.page'
import ConfiguracionPage from './pages/Configuracion/Configuracion.page'
import AgendaPage from './pages/Agenda/Agenda.page'
import TareasPage from './pages/Tareas/tareas.page'
import LicenciasPage from './pages/Licencias/LicenciasPage'
import NovedadesPJNPage from './pages/NovedadesPJN/NovedadesPJN.page'

// El "/" resuelve por rol: ABOGADO va a su Home personal, el resto mantiene
// el destino histórico (/dashboard). Etapa 1 — no afecta a otros roles.
function RaizPorRol() {
  const { usuarioActivo } = useUIStore()
  const destino = usuarioActivo?.rolSistema === 'ABOGADO' ? RUTAS.HOME : RUTAS.DASHBOARD
  return <Navigate to={destino} replace />
}

export default function App() {
  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/"                  element={<RaizPorRol />} />
          <Route path="/home"              element={<HomePage />} />
          {/* /home2 y /home3: variantes de layout en comparación — acceso solo vía
              HomeDesignSwitcher dentro de las 3 páginas, no están en ROL_ACCESOS/Sidebar. */}
          <Route path="/home2"             element={<Home2Page />} />
          <Route path="/home3"             element={<Home3Page />} />
          <Route path="/dashboard"         element={<DashboardPage />} />
          <Route path="/mesa"              element={<MesaSacoPage />} />
          <Route path="/mesa/alta"         element={<AltaExpedientePage />} />
          <Route path="/actuaciones/nueva-penal" element={<AltaExpedientePage modoAbogadoPenal />} />
          <Route path="/actuaciones"         element={<ActuacionesPage />} />
          <Route path="/bandeja/abogado"   element={<Navigate to="/actuaciones" replace />} />
          <Route path="/bandeja/area"      element={<Navigate to="/actuaciones" replace />} />
          <Route path="/expediente/*"      element={<DetalleExpedientePage />} />
          <Route path="/causa/*"           element={<CausaDetallePage />} />
          <Route path="/penal"             element={<Navigate to="/" replace />} />
          <Route path="/agenda"            element={<AgendaPage />} />
          <Route path="/tareas"            element={<TareasPage />} />
          <Route path="/licencias"         element={<LicenciasPage />} />
          <Route path="/novedades-pjn"     element={<NovedadesPJNPage />} />
          <Route path="/configuracion"     element={<ConfiguracionPage />} />
        </Routes>
      </AppLayout>
    </>
  )
}
