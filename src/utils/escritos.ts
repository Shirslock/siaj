import type { EscritoTemplate, DatosEscrito, Expediente } from '../types'
import { getNombreCompleto, getUsuarioById } from '../data/usuarios'

const CARACTER_LABEL: Record<DatosEscrito['caracter'], string> = {
  APODERADO: 'apoderado/a',
  PATROCINANTE: 'patrocinante',
  DERECHO_PROPIO: 'por derecho propio',
}

export function armarEncabezado(exp: Expediente, datos: DatosEscrito): string {
  const firmante = getUsuarioById(datos.firmante_id)
  return [
    'Señor Juez:',
    `${firmante ? getNombreCompleto(firmante) : '[FIRMANTE]'}, en mi carácter de ${CARACTER_LABEL[datos.caracter]} de ${datos.representado === 'SOFSE' ? 'la OPERADORA FERROVIARIA SOCIEDAD DEL ESTADO (SOFSE)' : 'el ESTADO NACIONAL'} en autos "${exp.caratula}" (Expte. ${exp.numero_ee_gde}${datos.juzgado ? `, ${datos.juzgado}` : ''}${datos.secretaria ? `, ${datos.secretaria}` : ''}), a V.S. digo:`,
  ].join('\n')
}

export function armarPersoneria(datos: DatosEscrito): string {
  const partes = [`CUIL ${datos.cuil_firmante || '[CUIL]'}`]
  if (datos.causa) partes.push(`Causa N° ${datos.causa}`)
  const matricula = datos.matricula_id ? `Matrícula ${datos.matricula_id}` : 'Matrícula sin cargar'
  return `Personería acreditada — ${matricula}. ${partes.join(' — ')}.`
}

export const CIERRE_FIJO =
  'Proveer de conformidad,\nSERÁ JUSTICIA.'

export function reemplazarVariables(template: EscritoTemplate, valores: Record<string, string>): string {
  let cuerpo = template.cuerpo
  for (const v of template.variables) {
    const valor = valores[v.id]?.trim() || `[${v.label.toUpperCase()}]`
    cuerpo = cuerpo.replaceAll(`{{${v.id}}}`, valor)
  }
  return cuerpo
}

export function armarEscritoCompleto(exp: Expediente, template: EscritoTemplate, datos: DatosEscrito): string {
  return [
    armarEncabezado(exp, datos),
    '',
    armarPersoneria(datos),
    '',
    reemplazarVariables(template, datos.variables),
    '',
    CIERRE_FIJO,
  ].join('\n')
}
