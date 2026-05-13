import { useState } from 'react'
import { useUIStore } from '../../store/ui.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { AreaBadge, EstadoBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { FormularioDinamico } from '../../components/expedientes/FormularioDinamico'
import { formatFecha } from '../../utils/format'
import { getCamposFormulario } from '../../data/formularios'
import type { ItemQueue } from '../../types'

const CANAL_LABEL: Record<string, string> = {
  EE_GDE:   'EE GDE',
  MEMO_GDE: 'Memo GDE',
  OTROS:    'Otros',
}

export default function MesaSacoPage() {
  const { queue } = useExpedientesStore()
  const { showToast } = useUIStore()
  const [item, setItem] = useState<ItemQueue | null>(null)
  const [valores, setValores] = useState<Record<string, unknown>>({})

  const campos = item ? getCamposFormulario(item.tipo, 'mesa', item.area) : []

  function abrirModal(it: ItemQueue) {
    setItem(it)
    setValores({})
  }

  function cerrarModal() {
    setItem(null)
    setValores({})
  }

  function handleProcesar() {
    showToast('Expediente procesado y asignado correctamente', 'success')
    cerrarModal()
  }

  return (
    <div className="p-6 space-y-4 max-w-screen-xl">
      <p className="text-on-surface-variant text-sm">{queue.length} entradas en cola</p>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/50">
              {['EE / Memo GDE', 'Área', 'Tipo', 'Carátula', 'Canal', 'Fecha', 'Estado', ''].map(col => (
                <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {queue.map(q => (
              <tr key={q.id} className="hover:bg-surface-container-low transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-on-surface">{q.ee}</td>
                <td className="py-3 px-4"><AreaBadge area={q.area} /></td>
                <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{q.tipo.replace(/_/g, ' ')}</td>
                <td className="py-3 px-4 text-on-surface max-w-xs truncate">{q.caratula}</td>
                <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{CANAL_LABEL[q.canal] ?? q.canal}</td>
                <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{formatFecha(q.fecha)}</td>
                <td className="py-3 px-4"><EstadoBadge code={q.estado} label={q.estado} /></td>
                <td className="py-3 px-4">
                  {q.estado !== 'ASIGNADO' && (
                    <Button size="sm" variant="secondary" onClick={() => abrirModal(q)}>
                      Procesar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!item}
        onClose={cerrarModal}
        titulo={`Procesar — ${item?.tipo.replace(/_/g, ' ')} (${item?.area})`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={cerrarModal}>Cancelar</Button>
            <Button onClick={handleProcesar} icon="check">Procesar y asignar</Button>
          </>
        }
      >
        {item && (
          <div className="space-y-4">
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Carátula</p>
              <p className="text-on-surface font-medium text-sm">{item.caratula}</p>
              <p className="text-xs text-on-surface-variant mt-1 font-mono">{item.ee}</p>
            </div>
            {campos.length > 0 ? (
              <FormularioDinamico
                campos={campos}
                valores={valores}
                onChange={(id, val) => setValores(v => ({ ...v, [id]: val }))}
              />
            ) : (
              <p className="text-sm text-on-surface-variant">No hay campos adicionales para este tipo.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
