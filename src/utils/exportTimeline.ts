import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable, { type RowInput } from 'jspdf-autotable'
import type { Actividad, Tarea, EstadoTarea } from '../types'

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
  return actividades.map(act => {
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
        .join(' | ')
    }
    return {
      fecha:            act.fecha ?? '',
      tipo:             act.estadoExpediente && act.titulo.startsWith('Cambio')
                          ? 'Sistema'
                          : 'Actividad',
      titulo:           act.titulo,
      descripcion:      act.descripcion ?? '',
      docGde:           act.doc_gde ?? '',
      estado:           act.estado ?? '',
      estadoExpediente: act.estadoExpediente ?? '',
      tareasDetalle,
      expediente:       expedienteId,
      area:             area,
    }
  })
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

  encabezados.forEach((_, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i })
    if (ws[cell]) ws[cell].s = { font: { bold: true } }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Timeline')
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
  doc.text('SIAJ — Sistema Inteligente de Asuntos Jurídicos', 14, 15)

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

  autoTable(doc, {
    startY: 38,
    columns: columnas,
    body: filas as unknown as RowInput[],
    styles:             { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: [27, 58, 87] },
    headStyles:         { fillColor: [27, 58, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      titulo:        { cellWidth: 35 },
      descripcion:   { cellWidth: 40 },
      docGde:        { cellWidth: 30 },
      tareasDetalle: { cellWidth: 55 },
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
