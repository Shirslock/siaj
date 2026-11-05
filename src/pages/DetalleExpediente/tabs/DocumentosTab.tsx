import type { Expediente, Documento } from '../../../types'
import { formatFecha } from '../../../utils/format'
import Icon from '../../../components/ui/Icon'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { Modal } from '../../../components/ui/Modal'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { validarAdjuntos, formatearTamano } from '../../../utils/validarAdjuntos'
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
  return 'text-gray-500'
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
      className={`border-b border-gray-100 last:border-0 bg-white${isDragging ? ' shadow-lg' : ''}`}
    >
      <td className="w-8 py-2.5 pr-2 select-none">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors touch-none flex items-center justify-center"
          aria-label="Reordenar"
        >
          <Icon name="drag_indicator" size={16} />
        </button>
      </td>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2">
          <Icon name={doc.icon} size={20} className={doc.tipo === 'PDF' ? 'text-red-500' : doc.color} />
          <span className="text-sm text-gray-800">{doc.nombre}</span>
        </div>
      </td>
      <td className="py-2.5 pr-3">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
          doc.tipo === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {doc.tipo}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-sm text-gray-600 whitespace-nowrap">{doc.size}</td>
      <td className="py-2.5 pr-3 text-xs text-gray-400 whitespace-nowrap">{formatFecha(doc.fecha)}</td>
      <td className="py-2.5">
        <div className="flex items-center gap-2 justify-end">
          <button
            disabled
            title="Descarga no disponible en esta versión"
            className="text-gray-400 cursor-not-allowed opacity-60"
          >
            <Icon name="download" size={16} />
          </button>
          <button
            onClick={onEliminar}
            title="Eliminar"
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <Icon name="delete" size={16} />
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
    <section className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Documentos <span className="ml-1 text-sm font-normal text-gray-400">({exp.documentos.length})</span>
        </h2>
        <button
          className="flex items-center gap-1 text-xs bg-blue-700 text-white rounded-md px-2.5 py-1.5 hover:bg-blue-800 transition-colors"
          onClick={() => document.getElementById('doc-upload')?.click()}
        >
          <Icon name="upload_file" size={14} />
          Subir documento
        </button>
        <input
          id="doc-upload"
          type="file"
          multiple
          className="hidden"
          onChange={async (e) => {
            const input = e.target
            const seleccion = Array.from(input.files ?? [])
            if (seleccion.length === 0) return
            // Sin videos (sueltos ni dentro de un .zip)
            const { aceptados, rechazados } = await validarAdjuntos(seleccion)
            rechazados.forEach(r => toast.error(`"${r.nombre}" no se subió: ${r.motivo}.`, { autoClose: 7000 }))
            aceptados.forEach((file, i) => {
              const ext = (file.name.split('.').pop() ?? 'FILE').toUpperCase()
              agregarDocumento(exp.id, {
                id: `DOC_${Date.now()}_${i}`,
                nombre: file.name.replace(/\.[^/.]+$/, ''),
                tipo: ext,
                fecha: new Date().toISOString().split('T')[0],
                size: formatearTamano(file.size),
                icon: getIconForExt(ext),
                color: getColorForExt(ext),
              })
            })
            if (aceptados.length > 0) {
              toast.success(aceptados.length === 1 ? 'Documento subido.' : `${aceptados.length} documentos subidos.`)
            }
            input.value = ''
          }}
        />
      </div>

      {exp.documentos.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-8">
          No hay documentos adjuntos.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="w-8" />
                  {['Archivo', 'Tipo', 'Tamaño', 'Subido', ''].map(col => (
                    <th key={col} className="text-left pb-2 pr-3 text-xs font-semibold uppercase text-gray-500 whitespace-nowrap">
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
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!confirmarEliminar) return
                eliminarDocumento(exp.id, confirmarEliminar)
                setConfirmarEliminar(null)
              }}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </button>
          </>
        }
      >
        {docAEliminar && (
          <div className="space-y-2">
            <p className="text-sm text-gray-800">¿Confirmás que querés eliminar este documento?</p>
            <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-3">
              <Icon name={docAEliminar.icon} size={20} className={docAEliminar.color} />
              <div>
                <p className="text-sm font-medium text-gray-800">{docAEliminar.nombre}</p>
                <p className="text-[10px] text-gray-500">{docAEliminar.tipo} · {docAEliminar.size}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
