import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { useNotificacionesStore } from '../../store/notificaciones.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { getNombreCompleto, USUARIOS } from '../../data/usuarios'
import type { RolSistema } from '../../types'
import Icon from '../ui/Icon'
import { RUTAS } from '../../utils/routing'
import { useDebounce } from '../../hooks/useDebounce'
import { buscarGlobal } from '../../utils/busquedaGlobal'
import type { ResultadoBusqueda, TipoResultado } from '../../utils/busquedaGlobal'
import { AreaBadge, RolBadge } from '../ui/Badge'

const ROL_LABEL: Record<RolSistema, string> = {
  REFERENTE:      'Referente',
  COORDINADOR:    'Coordinador',
  ABOGADO:        'Abogado/a',
  ADMINISTRATIVO: 'Administrativo',
}

interface TopbarProps {
  titulo: string
  subtitulo?: string
}

function fechaRelativa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  const hs   = Math.floor(diff / 3600000)
  const dias = Math.floor(diff / 86400000)
  if (min < 1)    return 'Ahora mismo'
  if (min < 60)   return `Hace ${min} min`
  if (hs  < 24)   return `Hace ${hs} h`
  if (dias === 1) return 'Ayer'
  return `Hace ${dias} días`
}

export function Topbar({ titulo, subtitulo }: TopbarProps) {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelAbierto, setPanelAbierto] = useState(false)

  const { sidebarCollapsed, usuarioActivo, busquedaGlobal, setBusquedaGlobal } = useUIStore()
  const { notificaciones, marcarLeida, marcarTodasLeidas, descartar } =
    useNotificacionesStore()
  const expedientes = useExpedientesStore(s => s.expedientes)

  const [inputLocal, setInputLocal] = useState(busquedaGlobal)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [expandido, setExpandido] = useState<Record<TipoResultado, boolean>>({
    actuacion: false, interviniente: false, documento: false, usuario: false,
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  const queryDebounced = useDebounce(inputLocal, 300)

  const resultados = useMemo(
    () => buscarGlobal(queryDebounced, expedientes, USUARIOS),
    [queryDebounced, expedientes]
  )

  const hayResultados =
    resultados.actuacion.length > 0 ||
    resultados.interviniente.length > 0 ||
    resultados.documento.length > 0 ||
    resultados.usuario.length > 0

  // Sincronizar si el store se limpia externamente
  useEffect(() => {
    setInputLocal(busquedaGlobal)
  }, [busquedaGlobal])

  useEffect(() => {
    setDropdownAbierto(queryDebounced.trim().length > 0)
    setExpandido({ actuacion: false, interviniente: false, documento: false, usuario: false })
  }, [queryDebounced])

  // Cerrar con click afuera y con ESC
  useEffect(() => {
    if (!dropdownAbierto) return
    function handleClickFuera(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAbierto(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownAbierto(false)
    }
    document.addEventListener('mousedown', handleClickFuera)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickFuera)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [dropdownAbierto])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setInputLocal(val)
    setBusquedaGlobal(val)
  }

  function handleClear() {
    setInputLocal('')
    setBusquedaGlobal('')
    setDropdownAbierto(false)
  }

  function irAResultado(r: ResultadoBusqueda) {
    setDropdownAbierto(false)
    setInputLocal('')
    setBusquedaGlobal('')

    switch (r.payload.tipo) {
      case 'actuacion':
        navigate(RUTAS.EXPEDIENTE(r.payload.exp.id) + '?tab=datos')
        break
      case 'interviniente':
        navigate(RUTAS.EXPEDIENTE(r.payload.expediente_id) + '?tab=intervinientes')
        break
      case 'documento':
        navigate(RUTAS.EXPEDIENTE(r.payload.expediente_id) + '?tab=docs')
        break
      case 'usuario':
        // informativo, no navega
        break
    }
  }

  const misNotifs = notificaciones
    .filter(n => n.destinatarioId === usuarioActivo?.id)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  const noLeidas = misNotifs.filter(n => !n.leida)

  useEffect(() => {
    if (!panelAbierto) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelAbierto])

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

      {/* Buscador global */}
      <div ref={dropdownRef} className="relative flex-1 max-w-md mx-8">
        <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl px-3 py-2 transition-all duration-200 focus-within:bg-white/25 focus-within:border-white/50">
          <Icon name="search" size={15} className="text-white/60 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar actuaciones, personas, documentos..."
            value={inputLocal}
            onChange={handleChange}
            onFocus={() => {
              if (inputLocal.trim()) setDropdownAbierto(true)
            }}
            className="flex-1 bg-transparent text-white placeholder-white/50 text-[13px] outline-none min-w-0"
          />
          {inputLocal && (
            <button
              onClick={handleClear}
              className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        {dropdownAbierto && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.08)] max-h-[70vh] overflow-y-auto z-50">
            {!hayResultados ? (
              <p className="p-4 text-[13px] text-[#7a9ab4] text-center">
                No se encontraron resultados para "{queryDebounced}".
              </p>
            ) : (
              <>
                {resultados.actuacion.length > 0 && (
                  <GrupoResultados
                    titulo="Actuaciones"
                    items={resultados.actuacion}
                    irAResultado={irAResultado}
                    verTodosHref={`/actuaciones?q=${encodeURIComponent(queryDebounced)}`}
                  />
                )}
                {resultados.interviniente.length > 0 && (
                  <GrupoResultados
                    titulo="Intervinientes"
                    items={resultados.interviniente}
                    irAResultado={irAResultado}
                    expandido={expandido.interviniente}
                    onExpandir={() => setExpandido(p => ({ ...p, interviniente: true }))}
                  />
                )}
                {resultados.documento.length > 0 && (
                  <GrupoResultados
                    titulo="Documentos"
                    items={resultados.documento}
                    irAResultado={irAResultado}
                    expandido={expandido.documento}
                    onExpandir={() => setExpandido(p => ({ ...p, documento: true }))}
                  />
                )}
                {resultados.usuario.length > 0 && (
                  <GrupoResultados
                    titulo="Usuarios"
                    items={resultados.usuario}
                    irAResultado={irAResultado}
                    expandido={expandido.usuario}
                    onExpandir={() => setExpandido(p => ({ ...p, usuario: true }))}
                  />
                )}
              </>
            )}
          </div>
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

          {panelAbierto && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-black/10 overflow-hidden z-50">

              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-black/8">
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
                {misNotifs.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Icon name="notifications_none" size={28} className="text-[#7a9ab4] mx-auto mb-2 block" />
                    <p className="text-sm text-[#4a6a84]">Sin notificaciones</p>
                  </div>
                ) : (
                  misNotifs.map(notif => (
                    <div
                      key={notif.id}
                      className={`relative group px-4 py-3 border-b border-black/5 last:border-0 transition-colors ${
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
                            <span className="font-normal text-[#4a6a84] ml-1.5">· {notif.numeroCausa}</span>
                          )}
                        </p>

                        <p className="text-xs text-[#1b3a57] line-clamp-2 mt-0.5">
                          {notif.caratula}
                        </p>

                        <p className="text-[10px] text-[#7a9ab4] mt-1">
                          {fechaRelativa(notif.fecha)}
                        </p>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation()
                          descartar(notif.id)
                        }}
                        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-md text-[#7a9ab4] opacity-0 group-hover:opacity-100 hover:bg-[#e8e8e8] hover:text-[#1b3a57] transition-all"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {misNotifs.length > 0 && (
                <div className="px-4 py-2.5 border-t border-black/6 bg-[#f9f9f9] text-center">
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

function GrupoResultados({
  titulo, items, irAResultado, verTodosHref, expandido, onExpandir,
}: {
  titulo: string
  items: ResultadoBusqueda[]
  irAResultado: (r: ResultadoBusqueda) => void
  verTodosHref?: string
  expandido?: boolean
  onExpandir?: () => void
}) {
  const navigate = useNavigate()
  const visibles = expandido ? items : items.slice(0, 5)
  const hayMas = items.length > 5

  return (
    <div className="border-b border-[rgba(0,0,0,0.06)] last:border-0">
      <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-[#7a9ab4]">
        {titulo}
      </p>
      {visibles.map(r => (
        <ItemResultado key={`${r.tipo}_${r.id}`} r={r} onClick={() => irAResultado(r)} />
      ))}
      {hayMas && !expandido && (
        verTodosHref ? (
          <button
            onClick={() => navigate(verTodosHref)}
            className="w-full text-left px-3 py-2 text-[12px] font-semibold text-[#1b3a57] hover:bg-[#f5f5f5]"
          >
            Ver todos los resultados de {titulo} →
          </button>
        ) : (
          <button
            onClick={onExpandir}
            className="w-full text-left px-3 py-2 text-[12px] font-semibold text-[#1b3a57] hover:bg-[#f5f5f5]"
          >
            Ver todos los resultados de {titulo} ({items.length}) →
          </button>
        )
      )}
    </div>
  )
}

function ItemResultado({ r, onClick }: { r: ResultadoBusqueda; onClick: () => void }) {
  const clickeable = r.payload.tipo !== 'usuario'

  const contenido = (() => {
    switch (r.payload.tipo) {
      case 'actuacion': {
        const exp = r.payload.exp
        return (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[#1b3a57]">{exp.id}</span>
              <AreaBadge area={exp.area} />
            </div>
            <p className="text-[11px] text-[#4a6a84] truncate">
              {exp.caratula || 'Sin carátula'}
            </p>
          </>
        )
      }
      case 'interviniente': {
        const { int, numero_expediente } = r.payload
        return (
          <>
            <p className="text-[12px] font-semibold text-[#1b3a57]">{int.nombre}</p>
            <p className="text-[11px] text-[#4a6a84]">
              {int.rol_procesal} — en {numero_expediente}
            </p>
          </>
        )
      }
      case 'documento': {
        const { doc, numero_expediente } = r.payload
        return (
          <div className="flex items-center gap-2">
            <Icon name={doc.icon || 'description'} size={14} className={doc.color ?? 'text-[#4a6a84]'} />
            <div>
              <p className="text-[12px] font-semibold text-[#1b3a57] truncate">{doc.nombre}</p>
              <p className="text-[11px] text-[#4a6a84]">en {numero_expediente}</p>
            </div>
          </div>
        )
      }
      case 'usuario': {
        const u = r.payload.user
        return (
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-[#1b3a57]">
              {u.apellido}, {u.nombre}
            </p>
            <RolBadge rol={u.rolSistema} />
          </div>
        )
      }
    }
  })()

  if (!clickeable) {
    return <div className="px-3 py-2 cursor-default">{contenido}</div>
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
    >
      {contenido}
    </button>
  )
}
