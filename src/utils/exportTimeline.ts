import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable, { type RowInput } from 'jspdf-autotable'
import type { Actividad, Tarea, EstadoTarea } from '../types'
import { getUsuarioById, getNombreCompleto } from '../data/usuarios'

export interface FilaTimelineExport {
  fecha: string
  tipo: string
  titulo: string
  descripcion: string
  docGde: string
  estado: string
  estadoExpediente: string
  tareasDetalle?: string
  expediente?: string
  area?: string
}

function sanitizarParaPDF(texto: string): string {
  return texto
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/✓/g, '[OK]')
    .replace(/⊘/g, '[N/P]')
    .replace(/⏱/g, '[..]')
    .replace(/○/g, '[-]')
    .replace(/[^\x00-\xFF]/g, '?')
}

function labelEstadoTarea(e: EstadoTarea): string {
  const map: Record<EstadoTarea, string> = {
    sin_estado:    'Sin estado',
    en_curso:      'En curso',
    cumplido:      'Cumplido',
    no_procedente: 'No procedente',
  }
  return map[e] ?? e
}

export function actividadesToFilas(
  actividades: Actividad[],
  expedienteId?: string,
  area?: string,
): FilaTimelineExport[] {
  const filas: FilaTimelineExport[] = []
  for (const act of actividades) {
    let tareasDetalle = ''
    if (act.tareasSnapshot && act.tareasSnapshot.length > 0) {
      tareasDetalle = act.tareasSnapshot
        .map(t => {
          const icono = t.estado === 'cumplido'      ? '✓'
                      : t.estado === 'no_procedente' ? '⊘'
                      : t.estado === 'en_curso'      ? '⏱'
                      : '○'
          return `${icono} ${t.nombre}`
        })
        .join('\n')
    }
    filas.push({
      fecha:            act.fecha ?? '',
      tipo:             act.estadoExpediente && act.titulo.startsWith('Cambio')
                          ? 'Sistema'
                          : 'Actividad',
      titulo:           act.titulo,
      descripcion:      act.descripcion ?? '',
      docGde:           act.doc_gde ?? '',
      estado:           act.estado ?? '',
      estadoExpediente: (() => {
        if (
          act.estadoExpediente &&
          (act.titulo.startsWith('Cambio de estado:') ||
           act.titulo.startsWith('Retroceso de estado:'))
        ) {
          const match = act.titulo.match(/(?:Cambio|Retroceso) de estado: (.+) →/)
          if (match?.[1]) return match[1].trim()
        }
        return act.estadoExpediente ?? ''
      })(),
      tareasDetalle,
      expediente:       expedienteId,
      area:             area,
    })
    for (const reply of act.replies ?? []) {
      const autorU = getUsuarioById(reply.autor_id)
      const nombreAutor = autorU ? getNombreCompleto(autorU) : reply.autor_id
      filas.push({
        fecha:            reply.fecha,
        tipo:             'Comentario',
        titulo:           `-> ${nombreAutor}`,
        descripcion:      reply.texto,
        docGde:           reply.doc_gde ?? '',
        estado:           '',
        estadoExpediente: '',
        tareasDetalle:    reply.fecha_vencimiento
          ? `Vence: ${reply.fecha_vencimiento}${reply.fecha_aviso ? ` - Aviso: ${reply.fecha_aviso}` : ''}`
          : '',
        expediente:       expedienteId,
        area:             area,
      })
    }
  }
  return filas
}

export function tareasToFilas(
  tareas: Tarea[],
  estadoProcesal: string,
  expedienteId?: string,
  area?: string,
): FilaTimelineExport[] {
  return tareas
    .filter(t => t.estado !== 'sin_estado')
    .map(t => ({
      fecha:            t.fecha ?? '',
      tipo:             'Tarea',
      titulo:           t.nombre,
      descripcion:      t.observaciones ?? '',
      docGde:           t.docGde ?? '',
      estado:           labelEstadoTarea(t.estado),
      estadoExpediente: estadoProcesal,
      tareasDetalle:    '',
      expediente:       expedienteId,
      area:             area,
    }))
}

export function exportarExcel(
  filas: FilaTimelineExport[],
  nombreArchivo: string,
  incluirExpediente = false,
): void {
  const encabezados = [
    'Fecha', 'Tipo', 'Título', 'Descripción',
    'Documento GDE', 'Estado', 'Estado Expediente',
    'Tareas realizadas',
    ...(incluirExpediente ? ['Expediente', 'Área'] : []),
  ]

  const datos = filas.map(f => [
    f.fecha, f.tipo, f.titulo, f.descripcion,
    f.docGde, f.estado, f.estadoExpediente,
    f.tareasDetalle ?? '',
    ...(incluirExpediente ? [f.expediente ?? '', f.area ?? ''] : []),
  ])

  const ws = XLSX.utils.aoa_to_sheet([encabezados, ...datos])

  ws['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 50 },
    { wch: 30 }, { wch: 15 }, { wch: 20 },
    { wch: 60 },
    ...(incluirExpediente ? [{ wch: 15 }, { wch: 10 }] : []),
  ]

  const colTareas = 7

  for (let r = 1; r <= datos.length; r++) {
    const cellAddr = XLSX.utils.encode_cell({ r, c: colTareas })
    if (ws[cellAddr]) {
      ws[cellAddr].s = {
        alignment: { wrapText: true, vertical: 'top' },
      }
    }
  }

  encabezados.forEach((_, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i })
    if (ws[cell]) {
      ws[cell].s = {
        font: { bold: true },
        alignment: { wrapText: true, vertical: 'center' },
      }
    }
  })

  const rowHeights: { hpt: number }[] = [{ hpt: 20 }]
  datos.forEach((fila) => {
    const tareas = fila[colTareas] as string ?? ''
    const lineas = tareas ? tareas.split('\n').length : 1
    rowHeights.push({ hpt: Math.max(20, lineas * 16) })
  })
  ws['!rows'] = rowHeights

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Línea de Tiempo')
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`)
}

export function exportarPDF(
  filas: FilaTimelineExport[],
  nombreArchivo: string,
  titulo: string,
  subtitulo: string,
  incluirExpediente = false,
): void {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(27, 58, 87)
  doc.text('SIAJ — Sistema Integral de Asuntos Jurídicos', 14, 15)

  doc.setFontSize(12)
  doc.text(titulo, 14, 23)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(74, 106, 132)
  doc.text(subtitulo, 14, 29)
  doc.text(
    `Exportado el ${new Date().toLocaleDateString('es-AR')} — ${filas.length} registros`,
    14, 34,
  )

  const columnas = [
    { header: 'Fecha',             dataKey: 'fecha' },
    { header: 'Tipo',              dataKey: 'tipo' },
    { header: 'Título',            dataKey: 'titulo' },
    { header: 'Descripción',       dataKey: 'descripcion' },
    { header: 'Doc GDE',           dataKey: 'docGde' },
    { header: 'Estado',            dataKey: 'estado' },
    { header: 'Estado Exp.',       dataKey: 'estadoExpediente' },
    { header: 'Tareas realizadas', dataKey: 'tareasDetalle' },
    ...(incluirExpediente
      ? [{ header: 'Expediente', dataKey: 'expediente' }, { header: 'Área', dataKey: 'area' }]
      : []),
  ]

  const filasSanitizadas = filas.map(f => ({
    ...f,
    titulo:        sanitizarParaPDF(f.titulo),
    descripcion:   sanitizarParaPDF(f.descripcion),
    tareasDetalle: f.tareasDetalle ? sanitizarParaPDF(f.tareasDetalle) : '',
  }))

  autoTable(doc, {
    startY: 38,
    columns: columnas,
    body: filasSanitizadas as unknown as RowInput[],
    styles:             { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: [27, 58, 87] },
    headStyles:         { fillColor: [27, 58, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      titulo:        { cellWidth: 35 },
      descripcion:   { cellWidth: 40 },
      docGde:        { cellWidth: 30 },
      tareasDetalle: {
        cellWidth: 55,
        overflow: 'linebreak',
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      },
    },
    didParseCell: (data) => {
      if (data.column.dataKey === 'tareasDetalle' && data.cell.raw) {
        const texto = String(data.cell.raw)
        if (texto.includes('\n')) {
          data.cell.text = texto.split('\n')
        }
      }
    },
    didDrawPage: (data) => {
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(
        `Página ${data.pageNumber}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 8,
      )
    },
  })

  doc.save(`${nombreArchivo}.pdf`)
}
