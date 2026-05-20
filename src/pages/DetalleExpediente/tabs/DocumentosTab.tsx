import { useState } from 'react'
import type { Expediente } from '../../../types'
import { formatFecha } from '../../../utils/format'
import Icon from '../../../components/ui/Icon'
import { useExpedientesStore } from '../../../store/expedientes.store'

interface Props { exp: Expediente }

export function DocumentosTab({ exp }: Props) {
  const [docsLocales, setDocsLocales] = useState<{ nombre: string; tipo: string; fecha: string; size: string; icon: string; color: string }[]>([])
  const todosLosDocs = [...exp.documentos, ...docsLocales]
  const { eliminarDocumento } = useExpedientesStore()
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
            const ext = file.name.split('.').pop()?.toUpperCase() ?? 'FILE'
            setDocsLocales(prev => [...prev, {
              nombre: file.name,
              tipo: ext,
              fecha: new Date().toISOString().split('T')[0],
              size: `${(file.size / 1024).toFixed(0)} KB`,
              icon: ext === 'PDF' ? 'picture_as_pdf' : ext === 'DOCX' || ext === 'DOC' ? 'description' : 'attach_file',
              color: ext === 'PDF' ? 'text-red-500' : ext === 'DOCX' || ext === 'DOC' ? 'text-blue-500' : 'text-[#4a6a84]',
            }])
            e.target.value = ''
          }}
        />
      </div>

      {todosLosDocs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-10 text-center text-[#4a6a84] text-sm">
          No hay documentos adjuntos.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm border-separate border-spacing-y-0">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.12)]">
                {['Documento', 'Tipo', 'Fecha', 'Tamaño', ''].map(col => (
                  <th key={col} className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-[#4a6a84]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todosLosDocs.map((doc, i) => (
                <tr
                  key={i}
                  className="group border-b border-[rgba(0,0,0,0.06)] hover:bg-[#f0f0f0] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Icon name={doc.icon} size={20} className={doc.color} />
                      <span className="text-[#1b3a57] font-medium">{doc.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold font-mono bg-[#e8e8e8] px-2 py-0.5 rounded text-[#4a6a84]">
                      {doc.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#4a6a84] whitespace-nowrap">
                    {formatFecha(doc.fecha)}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#4a6a84] whitespace-nowrap">
                    {doc.size}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        disabled
                        title="Descarga no disponible en esta versión"
                        className="p-1.5 rounded-lg text-[#4a6a84] cursor-not-allowed opacity-40"
                      >
                        <Icon name="download" size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (i < exp.documentos.length) {
                            eliminarDocumento(exp.id, i)
                          } else {
                            setDocsLocales(prev => prev.filter((_, j) => j !== i - exp.documentos.length))
                          }
                        }}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-[#4a6a84] hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
