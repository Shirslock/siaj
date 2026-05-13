import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Toast } from './components/ui/Toast'
import DashboardPage from './pages/Dashboard/Dashboard.page'
import MesaSacoPage from './pages/MesaSaco/MesaSaco.page'
import BandejaAbogadoPage from './pages/BandejaAbogado/BandejaAbogado.page'
import BandejaAreaPage from './pages/BandejaArea/BandejaArea.page'
import GestionPenalPage from './pages/GestionPenal/GestionPenal.page'
import CausaDetallePage from './pages/CausaDetalle/CausaDetalle.page'

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
          <Route path="/mesa/alta"         element={<MesaSacoPage />} />
          <Route path="/bandeja/abogado"   element={<BandejaAbogadoPage />} />
          <Route path="/bandeja/area"      element={<BandejaAreaPage />} />
          <Route path="/expediente/*"      element={<PagePlaceholder nombre="Detalle de Expediente" />} />
          <Route path="/causa/*"           element={<CausaDetallePage />} />
          <Route path="/penal"             element={<GestionPenalPage />} />
          <Route path="/agenda"            element={<PagePlaceholder nombre="Agenda" />} />
        </Routes>
      </AppLayout>
      <Toast />
    </>
  )
}
