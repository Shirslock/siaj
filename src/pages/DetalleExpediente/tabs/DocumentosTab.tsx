import type { Expediente } from '../../../types'
import { formatFecha } from '../../../utils/format'

interface Props { exp: Expediente }

export function DocumentosTab({ exp }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          disabled
          title="Funcionalidad pendiente"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[#e8e8e8] text-[#4a6a84] cursor-not-allowed opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Subir documento
        </button>
      </div>

      {exp.documentos.length === 0 ? (
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
              {exp.documentos.map((doc, i) => (
                <tr
                  key={i}
                  className="group border-b border-[rgba(0,0,0,0.06)] hover:bg-[#f0f0f0] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-[20px] ${doc.color}`}>{doc.icon}</span>
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
                    <button
                      disabled
                      title="Descarga no disponible en esta versión"
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#4a6a84] hover:bg-[#e0e0e0] transition-all cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
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
