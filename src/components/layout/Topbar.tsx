import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { useNotificacionesStore } from '../../store/notificaciones.store'
import { usePjnStore } from '../../store/pjn.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { USUARIOS } from '../../data/usuarios'
import { filtrarNovedadesPorRol } from '../../utils/pjnVisibilidad'
import type { RolSistema, Notificacion } from '../../types'
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

// Avatar del PRD (profile.svg, 30px): círculo con aro claro y silueta de persona.
function PerfilIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" role="img" aria-label="perfil" className="flex-shrink-0">
      <circle cx="15" cy="15" r="14" fill="#12365F" stroke="#E6EEF7" strokeWidth="1.5" />
      <circle cx="15" cy="11.5" r="4.5" fill="#B7D3EA" />
      <path d="M6.5 24.2c.8-4.1 4.3-6.6 8.5-6.6s7.7 2.5 8.5 6.6a13.5 13.5 0 0 1-17 0Z" fill="#B7D3EA" />
    </svg>
  )
}

export function Topbar() {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelAbierto, setPanelAbierto] = useState(false)

  const { toggleSidebar, usuarioActivo, busquedaGlobal, setBusquedaGlobal } = useUIStore()
  const { notificaciones, marcarLeida, marcarTodasLeidas, descartar } =
    useNotificacionesStore()
  const { novedades: novedadesPjn, descartarNovedad } = usePjnStore()
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

  // Novedades judiciales pendientes visibles para el usuario activo, presentadas como
  // notificaciones "virtuales" (no viven en notificaciones.store — se descartan
  // vía usePjnStore, no vía notificaciones.store.descartar).
  const notifsPjn: Notificacion[] = filtrarNovedadesPorRol(novedadesPjn, expedientes, usuarioActivo)
    .filter(n => n.estado === 'pendiente')
    .map(n => {
      const exp = expedientes.find(e => e.id === n.expediente_id)
      return {
        id: `PJN_NTF_${n.id}`,
        tipo: 'NOVEDAD_PJN' as const,
        expedienteId: n.expediente_id,
        tipoGestion: exp?.tipo ?? '',
        caratula: exp?.caratula ?? n.tipo,
        numeroCausa: exp?.numero_causa ?? null,
        leida: false,
        fecha: n.fecha_deteccion,
        destinatarioId: usuarioActivo?.id ?? '',
        titulo: n.tipo,
        descripcion: n.detalle,
      }
    })

  const misNotifs = [...notificaciones.filter(n => n.destinatarioId === usuarioActivo?.id), ...notifsPjn]
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

  return (
    <header className="bg-[#0B2545] text-white px-4 h-12 flex items-center justify-between gap-4 shadow-md sticky top-0 z-10 flex-shrink-0">
      {/* Hamburguesa + logo (PRD §2) */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1 hover:opacity-75 transition-opacity"
          aria-label="Menú"
        >
          <Icon name="menu" size={24} className="text-white" />
        </button>
        <span className="text-sm font-semibold tracking-wide uppercase whitespace-nowrap hidden sm:block">
          Trenes Argentinos <span className="font-normal opacity-80">Operaciones</span>
        </span>
      </div>

      {/* Buscador global (se mantiene del prototipo) */}
      <div ref={dropdownRef} className="relative flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-md px-3 py-1 transition-colors focus-within:bg-white/20 focus-within:border-white/40">
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
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[70vh] overflow-y-auto z-50">
            {!hayResultados ? (
              <p className="p-4 text-[13px] text-gray-400 text-center">
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
      <div className="flex items-center gap-3 flex-shrink-0">
        {usuarioActivo && (
          <div className="order-2 relative flex items-center cursor-pointer" title={ROL_LABEL[usuarioActivo.rolSistema]}>
            <span className="px-2 text-white hidden sm:block">
              Hola, {usuarioActivo.nombre} {usuarioActivo.apellido}
            </span>
            <PerfilIcon />
          </div>
        )}

        {/* Campana */}
        <div ref={panelRef} className="order-1 relative">
          <button
            onClick={() => setPanelAbierto(p => !p)}
            className="relative p-1 hover:opacity-75 transition-opacity"
            aria-label="Notificaciones"
          >
            <Icon name="notifications_none" size={24} className="text-white" />
            {noLeidas.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {noLeidas.length > 9 ? '9+' : noLeidas.length}
              </span>
            )}
          </button>

          {panelAbierto && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-black/10 overflow-hidden z-50">

              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-black/8">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">Notificaciones</p>
                  {noLeidas.length > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-700 text-white">
                      {noLeidas.length} nuevas
                    </span>
                  )}
                </div>
                {noLeidas.length > 0 && (
                  <button
                    onClick={() => usuarioActivo && marcarTodasLeidas(usuarioActivo.id)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              {/* Lista */}
              <div className="max-h-80 overflow-y-auto">
                {misNotifs.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Icon name="notifications_none" size={28} className="text-gray-400 mx-auto mb-2 block" />
                    <p className="text-sm text-gray-500">Sin notificaciones</p>
                  </div>
                ) : (
                  misNotifs.map(notif => {
                    const esPjn = notif.tipo === 'NOVEDAD_PJN'
                    const esJuicio = notif.tipo === 'INICIO_JUICIO'
                    return (
                    <div
                      key={notif.id}
                      className={`relative group px-4 py-3 border-b border-black/5 last:border-0 transition-colors ${
                        !notif.leida
                          ? 'bg-blue-50 hover:bg-blue-50'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {!notif.leida && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-700" />
                      )}

                      <div
                        className="cursor-pointer pl-2"
                        onClick={() => {
                          if (!esPjn) marcarLeida(notif.id)
                          setPanelAbierto(false)
                          navigate(RUTAS.EXPEDIENTE(notif.expedienteId))
                        }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${
                            esPjn
                              ? 'bg-blue-50 text-blue-700'
                              : esJuicio
                                ? 'bg-violet-100 text-violet-700'
                                : notif.tipo === 'REASIGNACION'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-gray-800'
                          }`}>
                            {esPjn ? 'Novedad PJN' : esJuicio ? 'Juicio iniciado' : notif.tipo === 'REASIGNACION' ? 'Reasignación' : 'Asignación'}
                          </span>
                          <span className="text-[11px] text-gray-500 truncate">
                            {notif.tipoGestion}
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold font-mono text-gray-800">
                          {notif.expedienteId}
                          {notif.numeroCausa && (
                            <span className="font-normal text-gray-500 ml-1.5">· {notif.numeroCausa}</span>
                          )}
                        </p>

                        <p className="text-xs text-gray-800 line-clamp-2 mt-0.5">
                          {esPjn ? notif.titulo : esJuicio ? (notif.descripcion ?? notif.caratula) : notif.caratula}
                        </p>

                        <p className="text-[10px] text-gray-400 mt-1">
                          {fechaRelativa(notif.fecha)}
                        </p>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation()
                          if (esPjn) {
                            if (usuarioActivo) descartarNovedad(notif.id.replace('PJN_NTF_', ''), usuarioActivo.id)
                          } else {
                            descartar(notif.id)
                          }
                        }}
                        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-md text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-800 transition-all"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  )})
                )}
              </div>

              {misNotifs.length > 0 && (
                <div className="px-4 py-2.5 border-t border-black/6 bg-gray-50 text-center">
                  <p className="text-[10px] text-gray-400">
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
    <div className="border-b border-gray-200 last:border-0">
      <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {titulo}
      </p>
      {visibles.map(r => (
        <ItemResultado key={`${r.tipo}_${r.id}`} r={r} onClick={() => irAResultado(r)} />
      ))}
      {hayMas && !expandido && (
        verTodosHref ? (
          <button
            onClick={() => navigate(verTodosHref)}
            className="w-full text-left px-3 py-2 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
          >
            Ver todos los resultados de {titulo} →
          </button>
        ) : (
          <button
            onClick={onExpandir}
            className="w-full text-left px-3 py-2 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
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
              <span className="text-[12px] font-semibold text-gray-800">{exp.id}</span>
              <AreaBadge area={exp.area} />
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              {exp.caratula || 'Sin carátula'}
            </p>
          </>
        )
      }
      case 'interviniente': {
        const { int, numero_expediente } = r.payload
        return (
          <>
            <p className="text-[12px] font-semibold text-gray-800">{int.nombre}</p>
            <p className="text-[11px] text-gray-500">
              {int.rol_procesal} — en {numero_expediente}
            </p>
          </>
        )
      }
      case 'documento': {
        const { doc, numero_expediente } = r.payload
        return (
          <div className="flex items-center gap-2">
            <Icon name={doc.icon || 'description'} size={14} className={doc.color ?? 'text-gray-500'} />
            <div>
              <p className="text-[12px] font-semibold text-gray-800 truncate">{doc.nombre}</p>
              <p className="text-[11px] text-gray-500">en {numero_expediente}</p>
            </div>
          </div>
        )
      }
      case 'usuario': {
        const u = r.payload.user
        return (
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-gray-800">
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
      className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
    >
      {contenido}
    </button>
  )
}
