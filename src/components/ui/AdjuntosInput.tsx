import { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import Icon from './Icon'
import { validarAdjuntos, formatearTamano } from '../../utils/validarAdjuntos'

interface Props {
  archivos: File[]
  onChange: (archivos: File[]) => void
  /** Texto del botón; por defecto "Adjuntar archivos". */
  etiqueta?: string
  compacto?: boolean
}

/**
 * Selector de adjuntos MÚLTIPLES. Rechaza videos (sueltos o dentro de un .zip) y avisa cuáles.
 * Los archivos aceptados se acumulan: cada selección suma a los ya elegidos.
 */
export function AdjuntosInput({ archivos, onChange, etiqueta = 'Adjuntar archivos', compacto = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [validando, setValidando] = useState(false)

  async function agregar(lista: FileList | null) {
    if (!lista || lista.length === 0) return
    setValidando(true)
    try {
      const { aceptados, rechazados } = await validarAdjuntos(Array.from(lista))
      rechazados.forEach(r => toast.error(`"${r.nombre}" no se adjuntó: ${r.motivo}.`, { autoClose: 7000 }))
      if (aceptados.length > 0) {
        // Evita duplicar el mismo archivo si se elige dos veces.
        const claves = new Set(archivos.map(a => `${a.name}|${a.size}|${a.lastModified}`))
        const nuevos = aceptados.filter(a => !claves.has(`${a.name}|${a.size}|${a.lastModified}`))
        onChange([...archivos, ...nuevos])
      }
    } finally {
      setValidando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      {archivos.map((f, i) => (
        <div key={`${f.name}-${i}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f5f5f5] border border-[rgba(0,0,0,0.08)]">
          <Icon name="attach_file" size={16} className="text-[#1b3a57] flex-shrink-0" />
          <span className="text-xs text-[#1b3a57] flex-1 truncate">{f.name}</span>
          <span className="text-[10px] text-[#4a6a84] whitespace-nowrap">{formatearTamano(f.size)}</span>
          <button
            type="button"
            title="Quitar"
            onClick={() => onChange(archivos.filter((_, j) => j !== i))}
            className="p-0.5 rounded text-[#4a6a84] hover:text-red-600 transition-colors"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      <label
        className={`flex items-center gap-2 ${compacto ? 'px-2 py-1.5' : 'px-3 py-2.5'} rounded-xl border-2 border-dashed border-[rgba(0,0,0,0.12)] cursor-pointer hover:border-[rgba(27,58,87,0.50)] hover:bg-[rgba(27,58,87,0.05)] transition-all group ${validando ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <Icon name="attach_file" size={18} className="text-[#4a6a84] group-hover:text-[#1b3a57]" />
        <span className="text-xs text-[#4a6a84] group-hover:text-[#1b3a57]">
          {validando ? 'Verificando archivos…' : archivos.length > 0 ? 'Agregar más archivos' : etiqueta}
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => { void agregar(e.target.files) }}
        />
      </label>
      <p className="text-[10px] text-[#7a9ab4]">Podés seleccionar varios archivos. No se admiten videos (tampoco dentro de un .zip).</p>
    </div>
  )
}
