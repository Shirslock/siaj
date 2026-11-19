import * as XLSX from 'xlsx'
import { TIPOS_GESTION } from '../data/catalogos'
import { getNombreCompleto, getUsuarioById } from '../data/usuarios'
import type { Expediente } from '../types'
import { labelEstado } from './estadoLabel'
import { formatNumeroCausaPjn } from './numeroCausa'

const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS_GESTION.map(t => [t.code, t.label]))

// Estructura mínima que necesita este módulo — coincide con `ItemBandeja` de
// BandejaAbogado.page.tsx sin depender de ese archivo.
export type ItemBandejaExport =
  | { kind: 'causa'; numeroCausa: string; expedientes: Expediente[] }
  | { kind: 'suelto'; exp: Expediente }

// Tipo de Juicio y Tipo de Hecho de una actuación. Según el tipo de gestión viven en Mesa SACO
// (`mesa_juicio`, `tipo_juicio`, `tipo_hecho`) o en el letrado (`abg_tipo_hecho`, que en Denuncia
// puede ser multiselect → lista). Los usan la tabla/filtros de la Bandeja del Abogado y este Excel.
function valoresCampo(...fuentes: unknown[]): string[] {
  return fuentes
    .flatMap(f => (Array.isArray(f) ? f : [f]))
    .map(v => String(v ?? '').trim())
    .filter(Boolean)
}
export const tiposJuicioDe = (e: Expediente): string[] =>
  valoresCampo(e.campos_mesa?.['mesa_juicio'], e.campos_mesa?.['tipo_juicio'])
export const tiposHechoDe = (e: Expediente): string[] =>
  valoresCampo(e.campos_abogado?.['abg_tipo_hecho'], e.campos_mesa?.['tipo_hecho'])

export interface FilaBandejaExport {
  numeroExpediente: string
  numeroCausa: string
  caratula: string
  area: string
  tipo: string
  tipoJuicio: string
  tipoHecho: string
  letrado: string
  estado: string
  fechaRecepcion: string
}

function filaDesdeExpediente(exp: Expediente): FilaBandejaExport {
  const letrado = exp.abogado_id ? getUsuarioById(exp.abogado_id) : undefined
  return {
    numeroExpediente: exp.id,
    numeroCausa: formatNumeroCausaPjn(exp),
    caratula: exp.caratula,
    area: exp.area,
    tipo: TIPO_LABEL[exp.tipo] ?? exp.tipo,
    tipoJuicio: [...new Set(tiposJuicioDe(exp))].join(', '),
    tipoHecho: [...new Set(tiposHechoDe(exp))].join(', '),
    letrado: letrado ? getNombreCompleto(letrado) : '—',
    estado: labelEstado(exp),
    fechaRecepcion: exp.fecha_recepcion,
  }
}

/**
 * Arma las filas de exportación: exactamente las actuaciones que muestra la tabla con los
 * filtros aplicados (una por fila, en el orden de pantalla). Las causas agrupadas aportan solo
 * sus actuaciones filtradas; no se completan otras actuaciones de la misma causa.
 */
export function construirFilasBandejaExport(items: ItemBandejaExport[]): FilaBandejaExport[] {
  return items
    .flatMap(item => (item.kind === 'suelto' ? [item.exp] : item.expedientes))
    .map(filaDesdeExpediente)
}

/**
 * Bandeja Mesa SACO: exporta las actuaciones tal como están filtradas en pantalla
 * (lista plana, sin agrupador de causa), con las mismas columnas de la tabla (incluido Estado).
 */
export function exportarMesaSacoExcel(
  expedientes: Expediente[],
  lineaLabel: (id: string | undefined) => string,
  nombreArchivo: string,
): void {
  const encabezados = [
    'N° Interno', 'N° Causa', 'Área', 'Carátula', 'Tipo de Gestión', 'Estado',
    'Referencia GDE', 'Letrado', 'Línea', 'Fecha Recepción', 'Cargada en SIGEJ',
  ]
  const datos = expedientes.map(e => {
    const letrado = e.abogado_id ? getUsuarioById(e.abogado_id) : undefined
    return [
      e.id, formatNumeroCausaPjn(e), e.area, e.caratula,
      TIPO_LABEL[e.tipo] ?? e.tipo, labelEstado(e), e.numero_ee_gde ?? '',
      letrado ? getNombreCompleto(letrado) : '—', lineaLabel(e.linea), e.fecha_recepcion,
      e.cargada_sigej ? 'Sí' : 'No',
    ]
  })
  const ws = XLSX.utils.aoa_to_sheet([encabezados, ...datos])
  ws['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 45 }, { wch: 24 }, { wch: 22 },
    { wch: 22 }, { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 16 },
  ]
  encabezados.forEach((_, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i })
    if (ws[cell]) ws[cell].s = { font: { bold: true }, alignment: { wrapText: true, vertical: 'center' } }
  })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bandeja Mesa SACO')
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`)
}

export function exportarBandejaExcel(filas: FilaBandejaExport[], nombreArchivo: string): void {
  const encabezados = [
    'N° Expediente', 'N° Causa', 'Carátula', 'Área', 'Tipo', 'Tipo de Juicio', 'Tipo de Hecho',
    'Letrado', 'Estado', 'Fecha Recepción',
  ]

  const datos = filas.map(f => [
    f.numeroExpediente, f.numeroCausa, f.caratula, f.area, f.tipo, f.tipoJuicio, f.tipoHecho,
    f.letrado, f.estado, f.fechaRecepcion,
  ])

  const ws = XLSX.utils.aoa_to_sheet([encabezados, ...datos])

  ws['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 45 }, { wch: 10 }, { wch: 22 }, { wch: 26 }, { wch: 26 },
    { wch: 25 }, { wch: 20 }, { wch: 14 },
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
