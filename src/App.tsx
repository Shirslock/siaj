import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Toast } from './components/ui/Toast'
import DashboardPage from './pages/Dashboard/Dashboard.page'
import MesaSacoPage from './pages/MesaSaco/MesaSaco.page'
import AltaExpedientePage from './pages/AltaExpediente/AltaExpediente.page'
import BandejaAbogadoPage from './pages/BandejaAbogado/BandejaAbogado.page'
import BandejaAreaPage from './pages/BandejaArea/BandejaArea.page'
import CausaDetallePage from './pages/CausaDetalle/CausaDetalle.page'
import DetalleExpedientePage from './pages/DetalleExpediente/DetalleExpediente.page'

function PagePlaceholder({ nombre }: { nombre: string }) {
  return (
    <div className="p-8">
      <p className="font-headline text-2xl text-primary font-bold">{nombre}</p>
      <p className="text-on-surface-variant mt-2 text-sm">Página en construcción — Fase siguiente</p>
    </div>
  )
}

export default function App() {
  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/"                  element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"         element={<DashboardPage />} />
          <Route path="/mesa"              element={<MesaSacoPage />} />
          <Route path="/mesa/alta"         element={<AltaExpedientePage />} />
          <Route path="/bandeja/abogado"   element={<BandejaAbogadoPage />} />
          <Route path="/bandeja/area"      element={<BandejaAreaPage />} />
          <Route path="/expediente/*"      element={<DetalleExpedientePage />} />
          <Route path="/causa/*"           element={<CausaDetallePage />} />
          <Route path="/penal"             element={<Navigate to="/" replace />} />
          <Route path="/agenda"            element={<PagePlaceholder nombre="Agenda" />} />
        </Routes>
      </AppLayout>
      <Toast />
    </>
  )
}
