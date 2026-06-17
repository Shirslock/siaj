import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import type { RolSistema } from '../../types'

const RUTA_POR_ROL: Record<RolSistema, string> = {
  REFERENTE:      '/dashboard',
  COORDINADOR:    '/actuaciones',
  ABOGADO:        '/actuaciones',
  ADMINISTRATIVO: '/mesa',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const loginAsync = useUIStore(s => s.loginAsync)
  const usuarioActivo = useUIStore(s => s.usuarioActivo)

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  // Si ya está logueado, redirigir
  if (usuarioActivo) {
    const ruta = RUTA_POR_ROL[usuarioActivo.rolSistema] ?? '/dashboard'
    navigate(ruta, { replace: true })
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await loginAsync(email, password)
      const u = useUIStore.getState().usuarioActivo
      const ruta = u ? (RUTA_POR_ROL[u.rolSistema] ?? '/dashboard') : '/dashboard'
      navigate(ruta, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1b3a57] mb-4">
            <span className="font-headline font-black text-white text-xl">S</span>
          </div>
          <h1 className="font-headline font-bold text-2xl text-[#1b3a57]">SIAJ</h1>
          <p className="text-sm text-[#4a6a84] mt-1">Sistema de Administración Jurídica</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/8 p-8">
          <h2 className="font-headline font-bold text-lg text-[#1b3a57] mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label block mb-1.5 text-xs font-semibold text-[#4a6a84] uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@sofsa.gob.ar"
                required
                autoComplete="email"
                className="field-input w-full px-3 py-2.5 rounded-xl border border-[#c4d4e0] bg-[#f8fafc] text-sm text-[#1b3a57] placeholder:text-[#9ab4c8] focus:outline-none focus:ring-2 focus:ring-[#63B2DA]/40 focus:border-[#63B2DA] transition-colors"
              />
            </div>

            <div>
              <label className="field-label block mb-1.5 text-xs font-semibold text-[#4a6a84] uppercase tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="field-input w-full px-3 py-2.5 rounded-xl border border-[#c4d4e0] bg-[#f8fafc] text-sm text-[#1b3a57] placeholder:text-[#9ab4c8] focus:outline-none focus:ring-2 focus:ring-[#63B2DA]/40 focus:border-[#63B2DA] transition-colors"
              />
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-sm text-[#b91c1c]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#1b3a57] text-white text-sm font-semibold hover:bg-[#15304a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
