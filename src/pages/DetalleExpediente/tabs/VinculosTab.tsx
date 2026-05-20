import { useState } from 'react'
import type { Expediente, VinculoExpediente } from '../../../types'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { AreaBadge, EstadoBadge } from '../../../components/ui/Badge'
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
      <div className="space-y-3">
        <div className="flex justify-end">
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[#1b3a57] text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            <Icon name="add_link" size={18} />
            Vincular expediente
          </button>
        </div>

        {exp.vinculos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center text-[#4a6a84] text-sm">
            No hay expedientes vinculados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {exp.vinculos.map(v => {
              const ab = v.abogado_id ? getUsuarioById(v.abogado_id) : undefined
              return (
                <div key={v.id} className="bg-white rounded-2xl shadow-card p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm font-bold text-[#1b3a57]">{v.id}</span>
                      <AreaBadge area={v.area} />
                      <EstadoBadge code={v.estado} label={v.estadoLabel} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a6a84] bg-[#e8e8e8] px-2 py-0.5 rounded-full">
                        {v.tipo_relacion.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-[#1b3a57] truncate">{v.caratula}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#4a6a84]">
                      {v.numero_causa && <span className="font-mono">{v.numero_causa}</span>}
                      {ab && <span>{getNombreCompleto(ab)}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => desvincularExpediente(exp.id, v.id)}
                    title="Desvincular"
                    className="p-1.5 rounded-lg text-[#4a6a84] hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <Icon name="link_off" size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        titulo="Vincular expediente"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={!seleccionado}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1b3a57] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Vincular
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Icon name="search" size={18} />
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
                className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all ${
                  seleccionado?.id === e.id
                    ? 'border-[#1b3a57] bg-[#C4DFE8]'
                    : 'border-[rgba(0,0,0,0.10)] hover:bg-[#e8e8e8]'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs font-bold text-[#1b3a57]">{e.id}</span>
                  <AreaBadge area={e.area} />
                  <EstadoBadge code={e.estado} label={e.estado} />
                </div>
                <p className="text-xs text-[#1b3a57] truncate">{e.caratula}</p>
              </button>
            ))}
            {filtrados.length === 0 && (
              <p className="text-sm text-center text-[#4a6a84] py-4">Sin resultados.</p>
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
    </>
  )
}
