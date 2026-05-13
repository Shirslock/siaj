import { Routes, Route, Navigate } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<div className="p-8 font-headline text-2xl text-primary">SIAJ — Setup OK ✓</div>} />
      </Routes>
    </div>
  )
}
