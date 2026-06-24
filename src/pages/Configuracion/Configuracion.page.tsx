import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { useConfiguracionStore } from '../../store/configuracion.store'
import { GRUPOS_CONFIG } from './tablas.config'
import type { TablaConfig } from './tablas.config'
import { CatalogoPanel } from './CatalogoPanel'
import { UsuariosPanel } from './UsuariosPanel'
import Icon from '../../components/ui/Icon'

export default function ConfiguracionPage() {
  const { usuarioActivo } = useUIStore()
  const { cargarCatalogos, cargarUsuarios } = useConfiguracionStore()

  const primeraTabla = GRUPOS_CONFIG[0].tablas[3] // lineas — primera editable
  const [tablaActiva, setTablaActiva] = useState<TablaConfig>(primeraTabla)
  const [gruposColapsados, setGruposColapsados] = useState<Set<string>>(new Set())

  useEffect(() => {
    cargarCatalogos()
    cargarUsuarios()
  }, [])

  if (usuarioActivo?.rolSistema !== 'REFERENTE') {
    return <Navigate to="/actuaciones" replace />
  }

  function toggleGrupo(id: string) {
    setGruposColapsados(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar izquierdo */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-[rgba(0,0,0,0.08)] overflow-y-auto">
        <div className="px-4 py-4 border-b border-[rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2">
            <Icon name="settings" size={18} className="text-[#1b3a57]" />
            <span className="font-headline font-bold text-[#1b3a57] text-sm">Configuración</span>
          </div>
        </div>

        <nav className="py-2">
          {GRUPOS_CONFIG.map(grupo => {
            const colapsado = gruposColapsados.has(grupo.id)
            return (
              <div key={grupo.id}>
                <button
                  onClick={() => toggleGrupo(grupo.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#4a6a84] hover:bg-[#f5f5f5] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon name={grupo.icono} size={14} />
                    <span>{grupo.label}</span>
                  </div>
                  <Icon name={colapsado ? 'expand_more' : 'expand_less'} size={14} />
                </button>

                {!colapsado && (
                  <div className="pb-1">
                    {grupo.tablas.map(tabla => {
                      const activa = tablaActiva.id === tabla.id
                      return (
                        <button
                          key={tabla.id}
                          onClick={() => !tabla.soloLectura && setTablaActiva(tabla)}
                          className={`w-full flex items-center justify-between px-5 py-1.5 text-sm transition-colors text-left ${
                            activa
                              ? 'bg-[#C4DFE8] text-[#1b3a57] font-semibold border-l-2 border-[#1b3a57]'
                              : tabla.soloLectura
                                ? 'text-[#b0b0b0] cursor-default pl-[21px]'
                                : 'text-[#4a6a84] hover:bg-[#f0f0f0] border-l-2 border-transparent'
                          }`}
                        >
                          <span className="truncate">{tabla.label}</span>
                          {tabla.soloLectura && (
                            <Icon name="block" size={12} className="flex-shrink-0 text-[#c0c0c0]" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto bg-[#f5f5f5] p-6">
        {tablaActiva.tipo === 'usuario'
          ? <UsuariosPanel />
          : <CatalogoPanel tabla={tablaActiva} />
        }
      </main>
    </div>
  )
}
