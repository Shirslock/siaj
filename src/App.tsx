import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import DashboardPage from './pages/Dashboard/Dashboard.page'
import MesaSacoPage from './pages/MesaSaco/MesaSaco.page'
import AltaExpedientePage from './pages/AltaExpediente/AltaExpediente.page'
import ActuacionesPage from './pages/Actuaciones/Actuaciones.page'
import CausaDetallePage from './pages/CausaDetalle/CausaDetalle.page'
import DetalleExpedientePage from './pages/DetalleExpediente/DetalleExpediente.page'
import ConfiguracionPage from './pages/Configuracion/Configuracion.page'
import TareasPage from './pages/Tareas/tareas.page'
import LoginPage from './pages/Login/Login.page'
import { useUIStore } from './store/ui.store'
import { getMe } from './api/auth'

function PagePlaceholder({ nombre }: { nombre: string }) {
  return (
    <div className="p-8">
      <p className="font-headline text-2xl text-[#1b3a57] font-bold">{nombre}</p>
      <p className="text-[#4a6a84] mt-2 text-sm">Página en construcción — Fase siguiente</p>
    </div>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const usuarioActivo = useUIStore(s => s.usuarioActivo)
  const token = useUIStore(s => s.token)

  useEffect(() => {
    const stored = sessionStorage.getItem('siaj_token')
    if (!stored) {
      navigate('/login', { replace: true })
      return
    }
    if (stored && !usuarioActivo) {
      getMe().then(res => {
        useUIStore.setState({ usuarioActivo: res.data as never, token: stored })
      }).catch(() => {
        sessionStorage.removeItem('siaj_token')
        useUIStore.setState({ token: null })
        navigate('/login', { replace: true })
      })
    }
  }, [usuarioActivo, token, navigate])

  const stored = sessionStorage.getItem('siaj_token')
  if (!stored) return null
  if (!usuarioActivo) return null

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <AppLayout>
              <Routes>
                <Route path="/"                  element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"         element={<DashboardPage />} />
                <Route path="/mesa"              element={<MesaSacoPage />} />
                <Route path="/mesa/alta"         element={<AltaExpedientePage />} />
                <Route path="/actuaciones/nueva-penal" element={<AltaExpedientePage modoAbogadoPenal />} />
                <Route path="/actuaciones"       element={<ActuacionesPage />} />
                <Route path="/bandeja/abogado"   element={<Navigate to="/actuaciones" replace />} />
                <Route path="/bandeja/area"      element={<Navigate to="/actuaciones" replace />} />
                <Route path="/expediente/*"      element={<DetalleExpedientePage />} />
                <Route path="/causa/*"           element={<CausaDetallePage />} />
                <Route path="/penal"             element={<Navigate to="/" replace />} />
                <Route path="/agenda"            element={<PagePlaceholder nombre="Agenda" />} />
                <Route path="/solicitudes"       element={<TareasPage />} />
                <Route path="/configuracion"     element={<ConfiguracionPage />} />
              </Routes>
            </AppLayout>
          </AuthGuard>
        }
      />
    </Routes>
  )
}
