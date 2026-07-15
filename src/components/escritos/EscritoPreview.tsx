import { useState } from 'react'
import type { Expediente, EscritoTemplate, DatosEscrito } from '../../types'
import { armarEscritoCompleto } from '../../utils/escritos'
import { descargarEscritoWord } from '../../utils/escritoDocx'
import { MATRICULAS } from '../../data/matriculas'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { Button } from '../ui/Button'

interface EscritoPreviewProps {
  exp: Expediente
  template: EscritoTemplate
  datos: DatosEscrito
  onAtras: () => void
  onGenerar: (resultado: { titulo: string; cuerpo: string; escrito_id: string }) => void
}

export function EscritoPreview({ exp, template, datos, onAtras, onGenerar }: EscritoPreviewProps) {
  const [modo, setModo] = useState<'preview' | 'editar'>('preview')
  const [cuerpoEditado, setCuerpoEditado] = useState(() => armarEscritoCompleto(exp, template, datos))

  const matricula = MATRICULAS.find(m => m.id === datos.matricula_id)
  const firmante = getUsuarioById(datos.firmante_id)
  const nombreFirmante = firmante ? getNombreCompleto(firmante) : '[FIRMANTE]'
  const lineaMatricula = matricula
    ? `Letrado — Matrícula ${matricula.jurisdiccion} T°${matricula.tomo} F°${matricula.folio}`
    : '[MATRÍCULA SIN CARGAR]'

  async function handleDescargar() {
    await descargarEscritoWord(exp, template, datos, cuerpoEditado)
    onGenerar({ titulo: template.titulo, cuerpo: cuerpoEditado, escrito_id: template.id })
  }

  return (
    <div>
      {modo === 'preview' ? (
        <div
          className="max-w-[794px] mx-auto bg-white shadow-card p-16 whitespace-pre-line"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          {cuerpoEditado}
          {'\n\n'}
          <strong>{nombreFirmante}</strong>
          {'\n'}
          {lineaMatricula}
        </div>
      ) : (
        <textarea
          value={cuerpoEditado}
          onChange={e => setCuerpoEditado(e.target.value)}
          className="w-full h-[500px] p-4 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg focus:outline-none focus:border-[#1b3a57]"
        />
      )}

      <div className="flex items-center justify-end gap-3 mt-4">
        <Button variant="secondary" onClick={onAtras}>Atrás</Button>
        <Button
          variant="secondary"
          onClick={() => setModo(modo === 'preview' ? 'editar' : 'preview')}
        >
          {modo === 'preview' ? 'Editar texto' : 'Vista previa'}
        </Button>
        <Button variant="primary" icon="download" onClick={handleDescargar}>
          Descargar Word (.docx)
        </Button>
      </div>
    </div>
  )
}
