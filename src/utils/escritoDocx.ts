import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import type { Expediente, EscritoTemplate, DatosEscrito } from '../types'
import { MATRICULAS } from '../data/matriculas'
import { getUsuarioById, getNombreCompleto } from '../data/usuarios'

export async function descargarEscritoWord(
  exp: Expediente,
  template: EscritoTemplate,
  datos: DatosEscrito,
  cuerpoFinal: string,
): Promise<void> {
  const parrafos = cuerpoFinal.split('\n').map(linea =>
    new Paragraph({ children: [new TextRun(linea)], spacing: { after: 200 } })
  )

  const matricula = MATRICULAS.find(m => m.id === datos.matricula_id)
  const firmante = getUsuarioById(datos.firmante_id)

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: template.titulo.toUpperCase(), bold: true, size: 24 })],
          spacing: { after: 400 },
        }),
        ...parrafos,
        new Paragraph({
          children: [new TextRun({ text: firmante ? getNombreCompleto(firmante) : '[FIRMANTE]', bold: true })],
          spacing: { before: 400 },
        }),
        new Paragraph({
          children: [new TextRun({
            text: matricula
              ? `Letrado — Matrícula ${matricula.jurisdiccion} T°${matricula.tomo} F°${matricula.folio}`
              : '[MATRÍCULA SIN CARGAR]',
          })],
          spacing: { before: 400 },
        }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const nombreArchivo = `Escrito_${template.id}_${exp.id.replace('/', '-')}_${new Date().toISOString().split('T')[0]}.docx`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
