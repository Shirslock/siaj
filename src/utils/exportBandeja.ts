import * as XLSX from 'xlsx'
import { TIPOS_GESTION } from '../data/catalogos'
import { getNombreCompleto, getUsuarioById } from '../data/usuarios'
import type { Expediente } from '../types'

const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS_GESTION.map(t => [t.code, t.label]))

// Estructura mínima que necesita este módulo — coincide con `ItemBandeja` de
// BandejaAbogado.page.tsx sin depender de ese archivo.
export type ItemBandejaExport =
  | { kind: 'causa'; numeroCausa: string; expedientes: Expediente[] }
  | { kind: 'suelto'; exp: Expediente }

export interface FilaBandejaExport {
  numeroExpediente: string
  numeroCausa: string
  caratula: string
  area: string
  tipo: string
  letrado: string
  estado: string
  fechaRecepcion: string
  incluidoPor: 'Filtro' | 'Agrupador de causa'
}

function filaDesdeExpediente(exp: Expediente, incluidoPor: FilaBandejaExport['incluidoPor']): FilaBandejaExport {
  const letrado = exp.abogado_id ? getUsuarioById(exp.abogado_id) : undefined
  return {
    numeroExpediente: exp.id,
    numeroCausa: exp.numero_causa ?? '',
    caratula: exp.caratula,
    area: exp.area,
    tipo: TIPO_LABEL[exp.tipo] ?? exp.tipo,
    letrado: letrado ? getNombreCompleto(letrado) : '—',
    estado: exp.estado,
    fechaRecepcion: exp.fecha_recepcion,
    incluidoPor,
  }
}

/**
 * Arma las filas de exportación completando, para cada causa presente en
 * `expedientesFiltrados`, el resto de expedientes que comparten `numero_causa`
 * (los "antecedentes") aunque no hayan pasado todos los filtros — se traen desde
 * `poolBase` (ya acotado por rol) filtrado solo por `letrado`/`area`, ninguno de
 * los demás filtros restringe esta completación. Los "sueltos" se exportan tal
 * cual, sin intentar completar nada.
 */
export function construirFilasBandejaExport(
  items: ItemBandejaExport[],
  expedientesFiltrados: Expediente[],
  poolBase: Expediente[],
  filtros: { letrado: string; area: string },
): FilaBandejaExport[] {
  const idsFiltrados = new Set(expedientesFiltrados.map(e => e.id))
  const filas: FilaBandejaExport[] = []

  for (const item of items) {
    if (item.kind === 'suelto') {
      filas.push(filaDesdeExpediente(item.exp, 'Filtro'))
      continue
    }

    const completos = poolBase.filter(e =>
      (e.numero_causa ?? '').trim() === item.numeroCausa &&
      (!filtros.letrado || e.abogado_id === filtros.letrado) &&
      (!filtros.area || e.area === filtros.area)
    )

    const vistos = new Set<string>()
    const grupo = [...item.expedientes, ...completos].filter(e => {
      if (vistos.has(e.id)) return false
      vistos.add(e.id)
      return true
    })

    for (const exp of grupo) {
      filas.push(filaDesdeExpediente(exp, idsFiltrados.has(exp.id) ? 'Filtro' : 'Agrupador de causa'))
    }
  }

  return filas
}

export function exportarBandejaExcel(filas: FilaBandejaExport[], nombreArchivo: string): void {
  const encabezados = [
    'N° Expediente', 'N° Causa', 'Carátula', 'Área', 'Tipo',
    'Letrado', 'Estado', 'Fecha Recepción', 'Incluido por',
  ]

  const datos = filas.map(f => [
    f.numeroExpediente, f.numeroCausa, f.caratula, f.area, f.tipo,
    f.letrado, f.estado, f.fechaRecepcion, f.incluidoPor,
  ])

  const ws = XLSX.utils.aoa_to_sheet([encabezados, ...datos])

  ws['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 45 }, { wch: 10 }, { wch: 22 },
    { wch: 25 }, { wch: 20 }, { wch: 14 }, { wch: 18 },
  ]

  encabezados.forEach((_, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i })
    if (ws[cell]) {
      ws[cell].s = {
        font: { bold: true },
        alignment: { wrapText: true, vertical: 'center' },
      }
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bandeja de Actuaciones')
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`)
}
