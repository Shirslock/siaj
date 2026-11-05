// Validación de adjuntos: no se admiten videos, ni sueltos ni dentro de un .zip
// (incluidos .zip anidados). Todo corre en el navegador, sin dependencias: se lee el
// directorio central del ZIP y, para los zips anidados, se descomprime con DecompressionStream.

import type { AdjuntoRef } from '../types'

export const EXTENSIONES_VIDEO = [
  'mp4', 'm4v', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'mpg', 'mpeg', 'mpe',
  '3gp', '3g2', 'ts', 'mts', 'm2ts', 'vob', 'ogv', 'asf', 'rm', 'rmvb', 'divx', 'f4v',
]

const PROFUNDIDAD_MAX_ZIP = 3
const TAMANO_MAX_ZIP_ANIDADO = 100 * 1024 * 1024 // 100 MB comprimidos

export interface ArchivoRechazado {
  nombre: string
  motivo: string
}

export interface ResultadoValidacion {
  aceptados: File[]
  rechazados: ArchivoRechazado[]
}

function extension(nombre: string): string {
  const i = nombre.lastIndexOf('.')
  return i < 0 ? '' : nombre.slice(i + 1).toLowerCase()
}

export function esVideo(nombre: string, mime = ''): boolean {
  return mime.startsWith('video/') || EXTENSIONES_VIDEO.includes(extension(nombre))
}

export function esZip(nombre: string, mime = ''): boolean {
  return extension(nombre) === 'zip' || mime === 'application/zip' || mime === 'application/x-zip-compressed'
}

interface EntradaZip {
  nombre: string
  metodo: number
  tamComprimido: number
  offsetLocal: number
}

/** Lee el directorio central de un ZIP. Lanza si el archivo no es un ZIP legible. */
function leerEntradas(buf: Uint8Array): EntradaZip[] {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  // End Of Central Directory: firma 0x06054b50, a lo sumo 64 KB + 22 bytes antes del final.
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('No es un ZIP válido')
  const total = dv.getUint16(eocd + 10, true)
  let pos = dv.getUint32(eocd + 16, true)
  if (total === 0xffff || pos === 0xffffffff) throw new Error('ZIP64 no soportado')

  const dec = new TextDecoder('utf-8')
  const entradas: EntradaZip[] = []
  for (let n = 0; n < total; n++) {
    if (pos + 46 > buf.length || dv.getUint32(pos, true) !== 0x02014b50) throw new Error('Directorio ZIP dañado')
    const flags = dv.getUint16(pos + 8, true)
    const metodo = dv.getUint16(pos + 10, true)
    const tamComprimido = dv.getUint32(pos + 20, true)
    const largoNombre = dv.getUint16(pos + 28, true)
    const largoExtra = dv.getUint16(pos + 30, true)
    const largoComentario = dv.getUint16(pos + 32, true)
    const offsetLocal = dv.getUint32(pos + 42, true)
    const nombre = dec.decode(buf.subarray(pos + 46, pos + 46 + largoNombre))
    entradas.push({ nombre, metodo, tamComprimido, offsetLocal })
    if (flags & 0x1) throw new Error('ZIP con contraseña: no se puede verificar su contenido')
    pos += 46 + largoNombre + largoExtra + largoComentario
  }
  return entradas
}

async function extraerEntrada(buf: Uint8Array, e: EntradaZip): Promise<Uint8Array> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const o = e.offsetLocal
  if (dv.getUint32(o, true) !== 0x04034b50) throw new Error('Entrada ZIP dañada')
  const inicio = o + 30 + dv.getUint16(o + 26, true) + dv.getUint16(o + 28, true)
  const datos = buf.subarray(inicio, inicio + e.tamComprimido)
  if (e.metodo === 0) return datos
  if (e.metodo !== 8) throw new Error('Método de compresión no soportado')
  if (typeof DecompressionStream === 'undefined') throw new Error('El navegador no puede verificar zips anidados')
  const stream = new Blob([datos as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Devuelve el nombre del primer video hallado en el ZIP (o null si no hay). */
async function buscarVideoEnZip(buf: Uint8Array, nivel: number): Promise<string | null> {
  const entradas = leerEntradas(buf)
  for (const e of entradas) {
    if (e.nombre.endsWith('/')) continue
    if (esVideo(e.nombre)) return e.nombre
  }
  for (const e of entradas) {
    if (e.nombre.endsWith('/') || !esZip(e.nombre)) continue
    if (nivel >= PROFUNDIDAD_MAX_ZIP) throw new Error('Demasiados niveles de .zip anidados')
    if (e.tamComprimido > TAMANO_MAX_ZIP_ANIDADO) throw new Error(`El zip anidado "${e.nombre}" es muy grande para verificarlo`)
    const interno = await buscarVideoEnZip(await extraerEntrada(buf, e), nivel + 1)
    if (interno) return `${e.nombre} › ${interno}`
  }
  return null
}

export async function validarAdjuntos(archivos: File[]): Promise<ResultadoValidacion> {
  const aceptados: File[] = []
  const rechazados: ArchivoRechazado[] = []
  for (const f of archivos) {
    if (esVideo(f.name, f.type)) {
      rechazados.push({ nombre: f.name, motivo: 'no se admiten archivos de video' })
      continue
    }
    if (esZip(f.name, f.type)) {
      try {
        const video = await buscarVideoEnZip(new Uint8Array(await f.arrayBuffer()), 1)
        if (video) {
          rechazados.push({ nombre: f.name, motivo: `el .zip contiene un video (${video})` })
          continue
        }
      } catch (err) {
        rechazados.push({
          nombre: f.name,
          motivo: `no se pudo verificar el .zip (${err instanceof Error ? err.message : 'error de lectura'})`,
        })
        continue
      }
    }
    aceptados.push(f)
  }
  return { aceptados, rechazados }
}

export function aAdjuntoRef(f: File): AdjuntoRef {
  return { nombre: f.name, size: formatearTamano(f.size) }
}

/** Adjuntos de una actividad: los múltiples nuevos, o el legado de un solo archivo. */
export function adjuntosDeActividad(act: { adjuntos?: AdjuntoRef[]; adjunto_nombre?: string | null }): AdjuntoRef[] {
  if (act.adjuntos && act.adjuntos.length > 0) return act.adjuntos
  return act.adjunto_nombre ? [{ nombre: act.adjunto_nombre, size: '' }] : []
}

export function formatearTamano(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
