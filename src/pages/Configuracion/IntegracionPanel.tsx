import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { toast } from 'react-toastify'

// ── Tipos ────────────────────────────────────────────────────────────────────

type Sistema = 'PJN' | 'MEV'
type TipoUsuario = 'automatico' | 'personal'

interface CredencialIntegracion {
  id: string
  sistema: Sistema
  tipo: TipoUsuario
  usuario: string
  descripcion: string
  fecha_actualizacion: string
  vence_en_dias: number
}

// ── Política de vencimiento ──────────────────────────────────────────────────

const POLITICA_VENCIMIENTO: Record<Sistema, number> = {
  PJN: 200,
  MEV: 90,
}

const HOY = new Date()

function diasHastaVencimiento(fechaActualizacion: string, sistema: Sistema): number {
  const dias = POLITICA_VENCIMIENTO[sistema]
  const actualizacion = new Date(fechaActualizacion)
  const vencimiento = new Date(actualizacion)
  vencimiento.setDate(vencimiento.getDate() + dias)
  return Math.ceil((vencimiento.getTime() - HOY.getTime()) / (1000 * 60 * 60 * 24))
}

function estadoVencimiento(dias: number): { color: string; label: string; icon: string } {
  if (dias < 0)  return { color: 'bg-red-100 text-red-700 border-red-200',       label: 'Vencida',          icon: 'error' }
  if (dias <= 15) return { color: 'bg-red-50 text-red-600 border-red-100',        label: `Vence en ${dias}d`, icon: 'warning' }
  if (dias <= 30) return { color: 'bg-amber-50 text-amber-700 border-amber-100',  label: `Vence en ${dias}d`, icon: 'schedule' }
  return           { color: 'bg-green-50 text-green-700 border-green-100',        label: `Vence en ${dias}d`, icon: 'check_circle' }
}

// ── Mock inicial ─────────────────────────────────────────────────────────────

const MOCK: CredencialIntegracion[] = [
  {
    id: 'CRED_001',
    sistema: 'PJN',
    tipo: 'automatico',
    usuario: 'siaj_integracion@pjn.gov.ar',
    descripcion: 'Usuario automático — mantiene causas en favoritos y sincroniza novedades',
    fecha_actualizacion: '2026-03-24',
    vence_en_dias: 0,
  },
  {
    id: 'CRED_002',
    sistema: 'MEV',
    tipo: 'automatico',
    usuario: 'siaj_mev@pjn.gov.ar',
    descripcion: 'Usuario automático para consulta de novedades MEV',
    fecha_actualizacion: '2026-08-05',
    vence_en_dias: 0,
  },
]

// ── Componente ────────────────────────────────────────────────────────────────

export function IntegracionPanel() {
  const [credenciales, setCredenciales] = useState<CredencialIntegracion[]>(
    MOCK.map(c => ({ ...c, vence_en_dias: diasHastaVencimiento(c.fecha_actualizacion, c.sistema) }))
  )
  const [editando, setEditando] = useState<CredencialIntegracion | null>(null)
  const [form, setForm] = useState({ usuario: '', password: '', password2: '', descripcion: '' })
  const [mostrarPass, setMostrarPass] = useState(false)
  const [mostrarPass2, setMostrarPass2] = useState(false)

  function abrirEditar(c: CredencialIntegracion) {
    setEditando(c)
    setForm({ usuario: c.usuario, password: '', password2: '', descripcion: c.descripcion })
    setMostrarPass(false)
    setMostrarPass2(false)
  }

  function cerrar() {
    setEditando(null)
    setForm({ usuario: '', password: '', password2: '', descripcion: '' })
  }

  function guardar() {
    if (!form.usuario.trim()) return
    if (form.password && form.password !== form.password2) {
      toast.error('Las contraseñas no coinciden.')
      return
    }
    setCredenciales(prev => prev.map(c =>
      c.id === editando?.id
        ? {
            ...c,
            usuario: form.usuario,
            descripcion: form.descripcion,
            fecha_actualizacion: new Date().toISOString().split('T')[0],
            vence_en_dias: POLITICA_VENCIMIENTO[c.sistema],
          }
        : c
    ))
    toast.success('Credencial actualizada correctamente.')
    cerrar()
  }

  const passwordMatch = !form.password || form.password === form.password2

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#1b3a57]">Credenciales PJN / MEV</h2>
        <p className="text-xs text-[#7a9ab4] mt-0.5">
          Gestión de usuarios de integración automática con sistemas externos.
        </p>
      </div>

      {/* Banner informativo */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
        <Icon name="info" size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 space-y-1">
          <p><span className="font-bold">PJN:</span> La contraseña vence cada <span className="font-bold">200 días</span>. Cuando venza, actualizarla primero en el portal PJN y luego en SIAJ.</p>
          <p><span className="font-bold">MEV:</span> La contraseña vence cada <span className="font-bold">90 días</span>. Mismo procedimiento.</p>
          <p className="text-blue-700">Si la credencial vence, la integración automática dejará de funcionar hasta que sea renovada.</p>
        </div>
      </div>

      {/* Cards de credenciales */}
      <div className="space-y-4">
        {credenciales.map(c => {
          const dias = c.vence_en_dias
          const estado = estadoVencimiento(dias)
          const politica = POLITICA_VENCIMIENTO[c.sistema]
          const pct = Math.max(0, Math.min(100, (dias / politica) * 100))

          return (
            <div key={c.id} className={`bg-white rounded-2xl shadow-card border ${dias <= 15 ? 'border-red-200' : 'border-[rgba(0,0,0,0.06)]'}`}>
              <div className="px-6 py-4 flex items-start justify-between gap-4">

                {/* Info principal */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Ícono sistema */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    c.sistema === 'PJN' ? 'bg-[#1b3a57]' : 'bg-[#7c3aed]'
                  }`}>
                    <span className="text-white text-[11px] font-black">{c.sistema}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-[#1b3a57]">{c.sistema}</p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        c.tipo === 'automatico' ? 'bg-[#dbeafe] text-[#1b3a57]' : 'bg-[#e8e8e8] text-[#4a6a84]'
                      }`}>
                        {c.tipo === 'automatico' ? 'Automático' : 'Personal'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[#4a6a84] truncate">{c.usuario}</p>
                    <p className="text-[11px] text-[#7a9ab4] mt-0.5">{c.descripcion}</p>

                    {/* Barra de progreso */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#4a6a84]">Último cambio: {c.fecha_actualizacion}</span>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${estado.color}`}>
                          <Icon name={estado.icon} size={11} />
                          {estado.label}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#e8e8e8] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            dias < 0 ? 'bg-red-500' : dias <= 15 ? 'bg-red-400' : dias <= 30 ? 'bg-amber-400' : 'bg-green-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-[#9a9a9a]">
                        Política: vence cada {politica} días
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón actualizar */}
                <button
                  onClick={() => abrirEditar(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#1b3a57] text-[#1b3a57] hover:bg-[#1b3a57] hover:text-white transition-colors flex-shrink-0"
                >
                  <Icon name="key" size={14} />
                  Actualizar credencial
                </button>
              </div>

              {/* Alerta urgente si vence pronto */}
              {dias <= 15 && (
                <div className="px-6 py-2.5 border-t border-red-100 bg-red-50 rounded-b-2xl flex items-center gap-2">
                  <Icon name="warning" size={14} className="text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-medium">
                    {dias < 0
                      ? 'La credencial está vencida. La integración automática no está funcionando.'
                      : `Quedan ${dias} día${dias !== 1 ? 's' : ''} para el vencimiento. Renovar en ${c.sistema} y luego actualizar en SIAJ.`}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal actualizar credencial */}
      <Modal
        open={!!editando}
        onClose={cerrar}
        titulo={`Actualizar credencial — ${editando?.sistema}`}
        size="md"
        footer={
          <>
            <button onClick={cerrar} className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={!form.usuario.trim() || !passwordMatch}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Icon name="save" size={15} />
              Guardar
            </button>
          </>
        }
      >
        {editando && (
          <div className="space-y-4">

            <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <Icon name="info" size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Primero actualizá la contraseña en el portal <span className="font-bold">{editando.sistema}</span>, luego ingresá la nueva contraseña acá para mantener la integración activa.
              </p>
            </div>

            <div>
              <label className="field-label">Usuario / Email</label>
              <input
                type="text"
                className="field-input w-full font-mono"
                value={form.usuario}
                onChange={e => setForm(p => ({ ...p, usuario: e.target.value }))}
              />
            </div>

            <div>
              <label className="field-label">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={mostrarPass ? 'text' : 'password'}
                  className="field-input w-full pr-10"
                  placeholder="Dejar vacío para no cambiar"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button
                  onClick={() => setMostrarPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a6a84] hover:text-[#1b3a57]"
                >
                  <Icon name={mostrarPass ? 'visibility_off' : 'visibility'} size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="field-label">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={mostrarPass2 ? 'text' : 'password'}
                  className={`field-input w-full pr-10 ${!passwordMatch ? 'border-red-400' : ''}`}
                  placeholder="Repetir contraseña"
                  value={form.password2}
                  onChange={e => setForm(p => ({ ...p, password2: e.target.value }))}
                />
                <button
                  onClick={() => setMostrarPass2(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a6a84] hover:text-[#1b3a57]"
                >
                  <Icon name={mostrarPass2 ? 'visibility_off' : 'visibility'} size={16} />
                </button>
              </div>
              {!passwordMatch && (
                <p className="text-[10px] text-red-600 mt-1">Las contraseñas no coinciden.</p>
              )}
            </div>

            <div>
              <label className="field-label">Descripción / Notas</label>
              <textarea
                className="field-input w-full resize-none"
                rows={2}
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#f5f5f5] border border-[rgba(0,0,0,0.06)]">
              <Icon name="update" size={14} className="text-[#4a6a84]" />
              <p className="text-xs text-[#4a6a84]">
                Al guardar, el contador de vencimiento se reiniciará a <span className="font-bold">{editando && POLITICA_VENCIMIENTO[editando.sistema]} días</span>.
              </p>
            </div>

          </div>
        )}
      </Modal>
    </div>
  )
}