import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import DashboardPage from './pages/Dashboard/Dashboard.page'
import MesaSacoPage from './pages/MesaSaco/MesaSaco.page'
import AltaExpedientePage from './pages/AltaExpediente/AltaExpediente.page'
import ActuacionesPage from './pages/Actuaciones/Actuaciones.page'
import CausaDetallePage from './pages/CausaDetalle/CausaDetalle.page'
import DetalleExpedientePage from './pages/DetalleExpediente/DetalleExpediente.page'
import ConfiguracionPage from './pages/Configuracion/Configuracion.page'
import AgendaPage from './pages/Agenda/Agenda.page'
import TareasPage from './pages/Tareas/tareas.page'

export default function App() {
  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/"                  element={<Navigate to="/dashboard" replace />} />
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
          <Route path="/configuracion"     element={<ConfiguracionPage />} />
        </Routes>
      </AppLayout>
    </>
  )
}
