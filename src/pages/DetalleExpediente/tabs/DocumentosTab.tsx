import type { Expediente, Documento } from '../../../types'
import { formatFecha } from '../../../utils/format'
import Icon from '../../../components/ui/Icon'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { Modal } from '../../../components/ui/Modal'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props { exp: Expediente }

function getIconForExt(ext: string): string {
  if (ext === 'PDF') return 'picture_as_pdf'
  if (ext === 'DOCX' || ext === 'DOC') return 'description'
  if (ext === 'XLSX' || ext === 'XLS') return 'table_chart'
  return 'attach_file'
}

function getColorForExt(ext: string): string {
  if (ext === 'PDF') return 'text-red-500'
  if (ext === 'DOCX' || ext === 'DOC') return 'text-blue-500'
  if (ext === 'XLSX' || ext === 'XLS') return 'text-green-600'
  return 'text-[#4a6a84]'
}

function SortableDocRow({
  doc,
  onEliminar,
}: {
  doc: Documento
  onEliminar: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto' as const,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[rgba(0,0,0,0.06)] last:border-0 bg-white${isDragging ? ' shadow-lg' : ''}`}
    >
      <td className="w-8 pl-3 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#c0c0c0] hover:text-[#4a6a84] transition-colors touch-none flex items-center justify-center"
        >
          <Icon name="drag_indicator" size={16} />
        </button>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Icon name={doc.icon} size={18} className={doc.color} />
          <span className="text-sm text-[#1b3a57] font-medium">{doc.nombre}</span>
        </div>
      </td>
      <td className="py-3 px-3">
        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-[#e8e8e8] text-[#4a6a84]">
          {doc.tipo}
        </span>
      </td>
      <td className="py-3 px-3 text-xs text-[#4a6a84] whitespace-nowrap">
        {formatFecha(doc.fecha)}
      </td>
      <td className="py-3 px-3 text-xs text-[#4a6a84] whitespace-nowrap">
        {doc.size}
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-1">
          <button
            disabled
            title="Descarga no disponible en esta versión"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] cursor-not-allowed opacity-40"
          >
            <Icon name="download" size={15} />
          </button>
          <button
            onClick={onEliminar}
            title="Eliminar"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a6a84] hover:bg-[#fee2e2] hover:text-[#b91c1c] transition-colors"
          >
            <Icon name="delete" size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function DocumentosTab({ exp }: Props) {
  const { agregarDocumento, eliminarDocumento, reordenarDocumentos } = useExpedientesStore()
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const docAEliminar = exp.documentos.find(d => d.id === confirmarEliminar)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const docs = exp.documentos
    const oldIdx = docs.findIndex(d => d.id === active.id)
    const newIdx = docs.findIndex(d => d.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const nuevoOrden = arrayMove(docs, oldIdx, newIdx).map(d => d.id)
    reordenarDocumentos(exp.id, nuevoOrden)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[#1b3a57] text-white hover:opacity-90 transition-opacity shadow-sm"
          onClick={() => document.getElementById('doc-upload')?.click()}
        >
          <Icon name="upload_file" size={18} />
          Subir documento
        </button>
        <input
          id="doc-upload"
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const ext = (file.name.split('.').pop() ?? 'FILE').toUpperCase()
            agregarDocumento(exp.id, {
              id: `DOC_${Date.now()}`,
              nombre: file.name.replace(/\.[^/.]+$/, ''),
              tipo: ext,
              fecha: new Date().toISOString().split('T')[0],
              size: `${Math.round(file.size / 1024)} KB`,
              icon: getIconForExt(ext),
              color: getColorForExt(ext),
            })
            e.target.value = ''
          }}
        />
      </div>

      {exp.documentos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-10 text-center text-[#4a6a84] text-sm">
          No hay documentos adjuntos.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.12)]">
                  <th className="w-8" />
                  {['Documento', 'Tipo', 'Fecha', 'Tamaño', ''].map(col => (
                    <th key={col} className="text-left py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-[#4a6a84] whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={exp.documentos.map(d => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {exp.documentos.map(doc => (
                    <SortableDocRow
                      key={doc.id}
                      doc={doc}
                      onEliminar={() => setConfirmarEliminar(doc.id)}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      )}
      <Modal
        open={!!confirmarEliminar}
        onClose={() => setConfirmarEliminar(null)}
        titulo="Eliminar documento"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmarEliminar(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#4a6a84] hover:bg-[#e8e8e8] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!confirmarEliminar) return
                eliminarDocumento(exp.id, confirmarEliminar)
                setConfirmarEliminar(null)
              }}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#b91c1c] text-white hover:opacity-90 transition-opacity"
            >
              Eliminar
            </button>
          </>
        }
      >
        {docAEliminar && (
          <div className="space-y-2">
            <p className="text-sm text-[#1b3a57]">¿Confirmás que querés eliminar este documento?</p>
            <div className="bg-[#f5f5f5] rounded-xl px-4 py-3 flex items-center gap-3">
              <Icon name={docAEliminar.icon} size={20} className={docAEliminar.color} />
              <div>
                <p className="text-sm font-medium text-[#1b3a57]">{docAEliminar.nombre}</p>
                <p className="text-[10px] text-[#4a6a84]">{docAEliminar.tipo} · {docAEliminar.size}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
