export function formatFecha(fecha: string): string {
  if (!fecha) return ''
  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return fecha
  return fecha
}

// ── Monedas — el catálogo es la ÚNICA fuente de verdad ──────────────────────────────────────
// Editable desde Configuración → Tablas → Monedas (`useConfiguracionStore().monedas`,
// sembrado desde `data/catalogos.ts#MONEDAS_INICIAL`). Ningún helper de acá adentro tiene
// ARS/USD/EUR hardcodeado: todos reciben el catálogo como parámetro. Agregar una moneda nueva
// (ej. BRL) es una fila más en Configuración, sin tocar componentes.
//
// `Moneda` es la sigla (`MonedaItem.id`) como string simple, no un union literal: al ser un
// catálogo editable en runtime, TypeScript no puede conocer de antemano qué siglas van a existir.
// La validación de que una sigla es válida se hace en runtime contra el catálogo
// (`normalizarMoneda`), y `formatMonto`/`simboloMoneda` nunca rompen ni tragan el importe ante
// una sigla desconocida: si no la encuentran en el catálogo, muestran la sigla tal cual.
import type { MonedaItem } from '../types'

export type Moneda = string

// La moneda local (default cuando falta el dato; base de la actualización por índice en
// Previsión) es una decisión de negocio fija — no depende del orden del catálogo editable, así
// que reordenar monedas en Configuración nunca cambia qué moneda es "la local".
const MONEDA_LOCAL: Moneda = 'ARS'

function definicionMoneda(moneda: Moneda, catalogo: MonedaItem[]): MonedaItem | undefined {
  return catalogo.find(m => m.id === moneda)
}

// Símbolo de una moneda (`$`, `US$`, `€`, ...), sin espacio — para armar totales compactos
// (ej. KPIs) sin arrastrar el espacio que sí lleva `formatMonto`. Si la sigla no está en el
// catálogo (dato viejo/corrupto, o la moneda se borró — algo que este catálogo no permite, solo
// desactiva), devuelve la sigla misma en vez de romper o inventar un símbolo.
export function simboloMoneda(moneda: Moneda, catalogo: MonedaItem[]): string {
  return definicionMoneda(moneda, catalogo)?.simbolo ?? moneda
}

// Los expedientes previos al campo de moneda no tienen valor guardado: se asume la moneda local.
// También cubre el caso de una sigla que ya no está en el catálogo.
export function normalizarMoneda(val: unknown, catalogo: MonedaItem[]): Moneda {
  return typeof val === 'string' && catalogo.some(m => m.id === val) ? val : MONEDA_LOCAL
}

// La actualización por índice de inflación es sobre la moneda local: no aplica al resto.
export function aplicaIndiceInflacion(moneda: Moneda): boolean {
  return moneda === MONEDA_LOCAL
}

export function formatMonto(valor: number | string, moneda: Moneda, catalogo: MonedaItem[]): string {
  const simbolo = simboloMoneda(moneda, catalogo) + ' '
  const num = typeof valor === 'string' ? parseFloat(valor.replace(/[^0-9.-]/g, '')) : valor
  if (isNaN(num)) return simbolo + '0,00'
  return simbolo + num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Opciones para un selector de moneda: solo las activas, con label "SIGLA — Nombre".
export function opcionesMoneda(catalogo: MonedaItem[]): { value: Moneda; label: string }[] {
  return catalogo
    .filter(m => m.activo !== false)
    .map(m => ({ value: m.id, label: `${m.id} — ${m.label}` }))
}

export interface ParMoneda {
  moneda: Moneda
  monto: number
}

// Campos money admiten como máximo un par por moneda (nunca dos filas con la misma sigla) — ver
// `money_multi` en formularios.ts. Los datos previos a ese campo repetible guardaban un escalar
// en `campos[id]` + la moneda en el campo hermano `campos[`${id}_moneda`]` — se normalizan acá
// como una lista de 1 par. Si por algún dato viejo/corrupto aparecieran dos filas de la misma
// moneda, se descarta la repetida y queda la primera aparición (nunca se rompe el render).
export function normalizarMontos(valorCampo: unknown, monedaLegacy: unknown, catalogo: MonedaItem[]): ParMoneda[] {
  if (Array.isArray(valorCampo)) {
    const vistas = new Set<Moneda>()
    const pares: ParMoneda[] = []
    valorCampo
      .filter((par): par is Record<string, unknown> => par != null && typeof par === 'object')
      .forEach(par => {
        const moneda = normalizarMoneda(par.moneda, catalogo)
        if (vistas.has(moneda)) return
        vistas.add(moneda)
        pares.push({ moneda, monto: Number(par.monto) || 0 })
      })
    return pares
  }
  if (valorCampo === undefined || valorCampo === null || valorCampo === '') return []
  const monto = typeof valorCampo === 'string' ? parseFloat(valorCampo.replace(/[^0-9.-]/g, '')) : Number(valorCampo)
  if (isNaN(monto)) return []
  return [{ moneda: normalizarMoneda(monedaLegacy, catalogo), monto }]
}

// Suma agrupada por moneda — nunca mezcla montos de monedas distintas entre sí.
export function sumarMontosPorMoneda(pares: ParMoneda[]): Partial<Record<Moneda, number>> {
  const totales: Partial<Record<Moneda, number>> = {}
  pares.forEach(({ moneda, monto }) => {
    totales[moneda] = (totales[moneda] ?? 0) + monto
  })
  return totales
}

// Opciones de moneda para la fila `indexActual` de un campo money_multi: solo activas, y
// excluyendo las que ya usan las OTRAS filas del mismo campo (máximo una fila por moneda — la
// validación de unicidad es por sigla, nunca por posición ni por label, así que renombrar una
// moneda en Configuración no rompe datos ya cargados). Si la moneda actual de esta fila fue
// desactivada, se agrega igual como opción — para no dejar el select en un valor inválido.
export function opcionesMonedaDisponibles(
  pares: { moneda: Moneda }[],
  indexActual: number,
  catalogo: MonedaItem[],
): { value: Moneda; label: string }[] {
  const usadasPorOtras = new Set(pares.filter((_, i) => i !== indexActual).map(p => p.moneda))
  const monedaActual = pares[indexActual]?.moneda
  const disponibles = opcionesMoneda(catalogo)
  const actualSigueDisponible = monedaActual !== undefined && disponibles.some(o => o.value === monedaActual)
  const conActualSiFalta = actualSigueDisponible || monedaActual === undefined
    ? disponibles
    : [...disponibles, { value: monedaActual, label: `${monedaActual} — (inactiva)` }]
  return conActualSiFalta.filter(o => !usadasPorOtras.has(o.value))
}

// Primera moneda activa del catálogo que ninguna fila del campo usa todavía — la que se precarga
// al tocar "Agregar monto". `undefined` cuando ya hay una fila por cada moneda activa (no hay más
// para agregar) — el máximo de filas es implícito: la cantidad de monedas activas, nunca un
// número fijo.
export function proximaMonedaLibre(pares: { moneda: Moneda }[], catalogo: MonedaItem[]): Moneda | undefined {
  const usadas = new Set(pares.map(p => p.moneda))
  return opcionesMoneda(catalogo).map(o => o.value).find(m => !usadas.has(m))
}

// Al guardar, una fila agregada y dejada sin importe no debe persistir como "$0" — se descarta.
export function limpiarMontos(pares: ParMoneda[]): ParMoneda[] {
  return pares.filter(p => p.monto !== 0)
}

// Formato compacto para KPIs (ej. "4.9M", "3K") — sin símbolo de moneda, se antepone con
// `simboloMoneda()` en el punto de uso.
export function abreviarMonto(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toFixed(0)
}

export function numerador(area: 'CIVIL' | 'LABORAL' | 'PENAL', numero: number, anio?: number): string {
  const prefix = area === 'CIVIL' ? 'C' : area === 'LABORAL' ? 'L' : 'P'
  const yr = anio ?? new Date().getFullYear()
  return `${prefix}-${String(numero).padStart(4, '0')}/${yr}`
}

export function formatNombreUsuario(apellido: string, nombre: string): string {
  return `${apellido}, ${nombre}`
}
