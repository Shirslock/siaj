import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { useNotificacionesStore } from '../../store/notificaciones.store'
import { getNombreCompleto } from '../../data/usuarios'
import { RUTAS } from '../../utils/routing'
import type { RolSistema } from '../../types'
import Icon from '../ui/Icon'

const ROL_LABEL: Record<RolSistema, string> = {
  REFERENTE:      'Referente',
  COORDINADOR:    'Coordinador',
  ABOGADO:        'Abogado/a',
  ADMINISTRATIVO: 'Administrativo',
}

function formatFechaRelativa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  const hs   = Math.floor(diff / 3600000)
  const dias = Math.floor(diff / 86400000)
  if (min < 1)    return 'Ahora mismo'
  if (min < 60)   return `Hace ${min} min`
  if (hs < 24)    return `Hace ${hs} h`
  if (dias === 1) return 'Ayer'
  return `Hace ${dias} días`
}

interface TopbarProps {
  titulo: string
  subtitulo?: string
}

export function Topbar({ titulo, subtitulo }: TopbarProps) {
  const { sidebarCollapsed, usuarioActivo } = useUIStore()
  const { notificaciones, marcarLeida, marcarTodasLeidas, descartarNotificacion } =
    useNotificacionesStore()
  const navigate = useNavigate()
  const [panelAbierto, setPanelAbierto] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const misNotificaciones = notificaciones.filter(
    n => n.destinatarioId === usuarioActivo?.id
  )
  const noLeidas = misNotificaciones.filter(n => !n.leida)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = usuarioActivo
    ? `${usuarioActivo.apellido.charAt(0)}${usuarioActivo.nombre.charAt(0)}`
    : '?'

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-[#63B2DA] z-50 flex items-center justify-between px-6 transition-all duration-200 ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}
    >
      {/* Título */}
      <div>
        <h1 className="font-headline font-bold text-lg text-white leading-tight">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-sm text-white opacity-70 leading-tight">{subtitulo}</p>
        )}
      </div>

      {/* Usuario + notificaciones */}
      <div className="flex items-center gap-4">
        {usuarioActivo && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-tight">
                {getNombreCompleto(usuarioActivo)}
              </p>
              <p className="text-xs text-[#C4DFE8] leading-tight">
                {ROL_LABEL[usuarioActivo.rolSistema]}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
          </div>
        )}

        {/* Campana */}
        <div ref={panelRef} className="relative">
          <button
            onClick={() => setPanelAbierto(p => !p)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
          >
            <Icon name="notifications_none" size={22} className="text-white" />
            {noLeidas.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#b91c1c] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                {noLeidas.length > 9 ? '9+' : noLeidas.length}
              </span>
            )}
          </button>

          {/* Panel desplegable */}
          {panelAbierto && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-card-lg border border-[rgba(0,0,0,0.10)] overflow-hidden z-50">

              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-[rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#1b3a57]">Notificaciones</p>
                  {noLeidas.length > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#b91c1c] text-white">
                      {noLeidas.length} nuevas
                    </span>
                  )}
                </div>
                {noLeidas.length > 0 && (
                  <button
                    onClick={() => usuarioActivo && marcarTodasLeidas(usuarioActivo.id)}
                    className="text-[11px] font-bold text-[#4a6a84] hover:text-[#1b3a57] transition-colors"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              {/* Lista */}
              <div className="max-h-80 overflow-y-auto">
                {misNotificaciones.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Icon name="notifications_none" size={28} className="text-[#7a9ab4] mx-auto mb-2 block" />
                    <p className="text-sm text-[#4a6a84]">Sin notificaciones</p>
                  </div>
                ) : (
                  misNotificaciones.map(notif => (
                    <div
                      key={notif.id}
                      className={`group relative px-4 py-3 border-b border-[rgba(0,0,0,0.05)] last:border-0 transition-colors ${
                        !notif.leida
                          ? 'bg-[#f0f6ff] hover:bg-[#e8f0ff]'
                          : 'bg-white hover:bg-[#f9f9f9]'
                      }`}
                    >
                      {!notif.leida && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#1b3a57]" />
                      )}

                      <div
                        className="cursor-pointer pl-2"
                        onClick={() => {
                          marcarLeida(notif.id)
                          setPanelAbierto(false)
                          navigate(RUTAS.EXPEDIENTE(notif.expedienteId))
                        }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                            notif.tipo === 'REASIGNACION'
                              ? 'bg-[#fef3c7] text-[#d97706]'
                              : 'bg-[#C4DFE8] text-[#1b3a57]'
                          }`}>
                            {notif.tipo === 'REASIGNACION' ? 'Reasignación' : 'Asignación'}
                          </span>
                          <span className="text-[11px] text-[#4a6a84] truncate">
                            {notif.tipoGestion}
                          </span>
                        </div>

                        <p className="text-[11px] font-bold font-mono text-[#1b3a57]">
                          {notif.expedienteId}
                          {notif.numeroCausa && (
                            <span className="font-normal text-[#4a6a84] ml-1.5">
                              · {notif.numeroCausa}
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-[#1b3a57] line-clamp-2 mt-0.5">
                          {notif.caratula}
                        </p>

                        <p className="text-[10px] text-[#7a9ab4] mt-1">
                          {formatFechaRelativa(notif.fecha)}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          descartarNotificacion(notif.id)
                        }}
                        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-md text-[#7a9ab4] hover:bg-[#e8e8e8] hover:text-[#1b3a57] transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {misNotificaciones.length > 0 && (
                <div className="px-4 py-2.5 border-t border-[rgba(0,0,0,0.06)] bg-[#f9f9f9] text-center">
                  <p className="text-[10px] text-[#7a9ab4]">
                    Las notificaciones leídas se eliminan automáticamente a los 30 días
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
