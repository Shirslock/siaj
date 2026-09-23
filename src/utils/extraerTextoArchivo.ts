// Extracción de texto client-side de archivos adjuntos en el chat de Boga (PDF/Word) —
// sin backend, el archivo nunca sale del navegador. El texto extraído se usa solo para
// esa consulta puntual (no se persiste, ver src/store/bogaHistorial.store.ts).
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

export const TAMANO_MAXIMO_ARCHIVO_BYTES = 8 * 1024 * 1024 // 8MB
export const EXTENSIONES_SOPORTADAS = ['.pdf', '.docx']

export class ErrorExtraccionArchivo extends Error {}

function tieneExtension(nombre: string, ext: string): boolean {
  return nombre.toLowerCase().endsWith(ext)
}

async function extraerTextoPdf(buffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const textoPorPagina: string[] = []

  for (let numeroPagina = 1; numeroPagina <= pdf.numPages; numeroPagina++) {
    const pagina = await pdf.getPage(numeroPagina)
    const contenido = await pagina.getTextContent()
    const textoPagina = contenido.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
    textoPorPagina.push(textoPagina)
  }

  return textoPorPagina.join('\n\n').trim()
}

async function extraerTextoDocx(buffer: ArrayBuffer): Promise<string> {
  const resultado = await mammoth.extractRawText({ arrayBuffer: buffer })
  return resultado.value.trim()
}

/**
 * Extrae el texto de un PDF o Word (.docx) adjuntado en el chat.
 * Lanza ErrorExtraccionArchivo con un mensaje apto para mostrar al usuario.
 */
export async function extraerTextoArchivo(archivo: File): Promise<string> {
  if (archivo.size > TAMANO_MAXIMO_ARCHIVO_BYTES) {
    throw new ErrorExtraccionArchivo(
      `El archivo supera el tamaño máximo permitido (${TAMANO_MAXIMO_ARCHIVO_BYTES / (1024 * 1024)}MB).`
    )
  }

  const esPdf = tieneExtension(archivo.name, '.pdf')
  const esDocx = tieneExtension(archivo.name, '.docx')

  if (!esPdf && !esDocx) {
    throw new ErrorExtraccionArchivo('Solo se admiten archivos PDF o Word (.docx).')
  }

  let texto: string
  try {
    const buffer = await archivo.arrayBuffer()
    texto = esPdf ? await extraerTextoPdf(buffer) : await extraerTextoDocx(buffer)
  } catch {
    throw new ErrorExtraccionArchivo(
      'No pude leer el archivo. ¿Podés pegar el texto directo en el chat?'
    )
  }

  if (!texto) {
    throw new ErrorExtraccionArchivo(
      'No encontré texto en el archivo (¿es un PDF escaneado como imagen?). ¿Podés pegar el texto directo en el chat?'
    )
  }

  return texto
}
