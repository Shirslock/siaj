import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Toast } from './components/ui/Toast'

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
          <Route path="/dashboard"         element={<PagePlaceholder nombre="Dashboard" />} />
          <Route path="/mesa"              element={<PagePlaceholder nombre="Mesa SIAJ" />} />
          <Route path="/mesa/alta"         element={<PagePlaceholder nombre="Alta de Expediente" />} />
          <Route path="/bandeja/abogado"   element={<PagePlaceholder nombre="Mi Bandeja" />} />
          <Route path="/bandeja/area"      element={<PagePlaceholder nombre="Bandeja Área" />} />
          <Route path="/expediente/:id"    element={<PagePlaceholder nombre="Detalle de Expediente" />} />
          <Route path="/penal"             element={<PagePlaceholder nombre="Gestión Penal" />} />
          <Route path="/agenda"            element={<PagePlaceholder nombre="Agenda" />} />
        </Routes>
      </AppLayout>
      <Toast />
    </>
  )
}
