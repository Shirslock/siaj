import { useState } from 'react'
import type { Expediente, VinculoExpediente } from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { Link } from 'react-router-dom'
import { AreaBadge } from '../../../components/ui/Badge'
import { TIPOS_GESTION } from '../../../data/catalogos'
import { RUTAS } from '../../../utils/routing'
import { labelEstado } from '../../../utils/estadoLabel'
import { Modal } from '../../../components/ui/Modal'
import { getNombreCompleto, getUsuarioById } from '../../../data/usuarios'
import Icon from '../../../components/ui/Icon'

type TipoRelacion = VinculoExpediente['tipo_relacion']

const TIPOS_RELACION: { value: TipoRelacion; label: string }[] = [
  { value: 'MISMO_SINIESTRO', label: 'Mismo Siniestro' },
  { value: 'MISMA_CAUSA',     label: 'Misma Causa' },
  { value: 'RELACIONADO',     label: 'Relacionado' },
]

interface Props { exp: Expediente }

export function VinculosTab({ exp }: Props) {
  const { expedientes, vincularExpediente, desvincularExpediente } = useExpedientesStore()

  const [modal, setModal] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<Expediente | null>(null)
  const [tipoRelacion, setTipoRelacion] = useState<TipoRelacion>('RELACIONADO')
  const [confirmarDesvincular, setConfirmarDesvincular] = useState<VinculoExpediente | null>(null)

  const vinculadosIds = new Set(exp.vinculos.map(v => v.id))
  const candidatos = expedientes.filter(e =>
    e.id !== exp.id && !vinculadosIds.has(e.id)
  )
  const filtrados = busqueda.trim()
    ? candidatos.filter(e =>
        e.id.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.caratula.toLowerCase().includes(busqueda.toLowerCase())
      )
    : candidatos.slice(0, 10)

  function openModal() {
    setModal(true)
    setBusqueda('')
    setSeleccionado(null)
    setTipoRelacion('RELACIONADO')
  }

  function confirmar() {
    if (!seleccionado) return
    const vinculo: VinculoExpediente = {
      id:           seleccionado.id,
      area:         seleccionado.area,
      tipo:         seleccionado.tipo,
      caratula:     seleccionado.caratula,
      estado:       seleccionado.estado,
      estadoLabel:  seleccionado.estado,
      tipo_relacion: tipoRelacion,
      numero_causa:  seleccionado.numero_causa ?? undefined,
      abogado_id:    seleccionado.abogado_id,
    }
    vincularExpediente(exp.id, vinculo)
    setModal(false)
  }

  return (
    <>
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Actuaciones vinculadas
            <span className="ml-2 text-xs font-normal text-gray-400">({exp.vinculos.length})</span>
          </h2>
          <button
            onClick={openModal}
            className="flex items-center gap-1 text-xs bg-blue-700 text-white rounded-md px-2.5 py-1.5 hover:bg-blue-800 transition-colors"
          >
            <Icon name="add_link" size={14} />
            Vincular actuación
          </button>
        </div>

        {exp.vinculos.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">Sin actuaciones vinculadas.</p>
        ) : (
          <div className="space-y-3">
            {exp.vinculos.map(v => {
              const ab = v.abogado_id ? getUsuarioById(v.abogado_id) : undefined
              return (
                <div key={v.id} className="border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link to={RUTAS.EXPEDIENTE(v.id)} className="font-medium text-blue-700 hover:underline">{v.id}</Link>
                      <AreaBadge area={v.area} />
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {TIPOS_GESTION.find(t => t.code === v.tipo)?.label ?? v.tipo}
                      </span>
                      <span className="text-xs border border-gray-300 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide font-medium">
                        {v.tipo_relacion.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{v.caratula}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {v.numero_causa && <span className="font-mono">{v.numero_causa}</span>}
                      {ab && <span>{getNombreCompleto(ab)}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmarDesvincular(v)}
                    title="Desvincular"
                    className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <Icon name="link_off" size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        titulo="Vincular actuación"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setModal(false)}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={!seleccionado}
              className="px-4 py-2 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Vincular
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              className="field-input pl-9 w-full"
              placeholder="Buscar por ID o carátula…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filtrados.map(e => (
              <button
                key={e.id}
                onClick={() => setSeleccionado(e)}
                className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all ${
                  seleccionado?.id === e.id
                    ? 'border-blue-700 bg-blue-100'
                    : 'border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs font-semibold text-gray-800">{e.id}</span>
                  <AreaBadge area={e.area} />
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{labelEstado(e)}</span>
                </div>
                <p className="text-xs text-gray-800 truncate">{e.caratula}</p>
              </button>
            ))}
            {filtrados.length === 0 && (
              <p className="text-sm text-center text-gray-500 py-4">Sin resultados.</p>
            )}
          </div>

          <div>
            <label className="field-label">Tipo de relación</label>
            <select
              className="field-input w-full"
              value={tipoRelacion}
              onChange={e => setTipoRelacion(e.target.value as TipoRelacion)}
            >
              {TIPOS_RELACION.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmarDesvincular}
        onClose={() => setConfirmarDesvincular(null)}
        titulo="Desvincular actuación"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmarDesvincular(null)}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!confirmarDesvincular) return
                desvincularExpediente(exp.id, confirmarDesvincular.id)
                setConfirmarDesvincular(null)
              }}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Desvincular
            </button>
          </>
        }
      >
        {confirmarDesvincular && (
          <div className="space-y-2">
            <p className="text-sm text-gray-800">
              ¿Confirmás que querés desvincular la siguiente actuación?
            </p>
            <div className="bg-gray-100 rounded-lg px-4 py-3 mt-2">
              <p className="font-mono text-xs font-semibold text-gray-800">{confirmarDesvincular.id}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{confirmarDesvincular.caratula}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
