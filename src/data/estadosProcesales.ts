import type { EstadoProcesal, UrgenciaTarea } from '../types'

// ── DEMANDA CIVIL — ciclo completo ──────────────────────
export const ESTADOS_DEMANDA_CIVIL: EstadoProcesal[] = [
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'TRABA_LITIS',
    tareas: [
      { id: 'DC_INI_01', nombre: 'Análisis inicial de la demanda',             estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_02', nombre: 'Interposición de revocatoria',               estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_03', nombre: 'Definición de plazo para contestar demanda', estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_04', nombre: 'Revisión integral del expediente',           estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_05', nombre: 'Interposición de caducidad',                 estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_06', nombre: 'Contestación de demanda',                    estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_07', nombre: 'Redacción de defensa de fondo',              estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_08', nombre: 'Planteo de excepciones',                     estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_09', nombre: 'Oposiciones',                                estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_10', nombre: 'Requerir citación de terceros',              estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_11', nombre: 'Ofrecimiento de prueba',                     estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_12', nombre: 'Documental',                                 estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_13', nombre: 'Testimonial — Propuestos por SOFSA',         estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_14', nombre: 'Pericial',                                   estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_15', nombre: 'Informativa',                                estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_INI_16', nombre: 'Presentación en sistema judicial',           estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'TRABA_LITIS',
    label: 'Traba de Litis',
    siguiente: 'EN_PRUEBA',
    tareas: [
      { id: 'DC_TL_01', nombre: 'Notificación de traslado',         estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_TL_02', nombre: 'Control de plazos procesales',     estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_TL_03', nombre: 'Presentación de documentación',    estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'EN_PRUEBA',
    label: 'En Prueba',
    siguiente: 'ALEGATOS',
    tareas: [
      { id: 'DC_EP_01', nombre: 'Producción de prueba documental',  estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_EP_02', nombre: 'Seguimiento de peritos',           estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_EP_03', nombre: 'Control de audiencias de prueba',  estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'ALEGATOS',
    label: 'Alegatos',
    siguiente: 'SENTENCIA',
    tareas: [
      { id: 'DC_AL_01', nombre: 'Redacción de alegatos',            estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_AL_02', nombre: 'Presentación de alegatos',         estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'SENTENCIA',
    label: 'Sentencia',
    siguiente: 'CERRADO',
    tareas: [
      { id: 'DC_SE_01', nombre: 'Análisis de sentencia',            estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_SE_02', nombre: 'Recursos ordinarios',              estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'DC_SE_03', nombre: 'Notificación a área requirente',   estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'CERRADO',
    label: 'Cerrado',
    siguiente: undefined,
    tareas: [
      { id: 'DC_CE_01', nombre: 'Archivo del expediente',           estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
]

// ── Estados genéricos para tipos sin definición específica ──
export const ESTADOS_GENERICOS: EstadoProcesal[] = [
  {
    codigo: 'INICIO',
    label: 'Inicio',
    siguiente: 'EN_TRAMITE',
    tareas: [
      { id: 'GEN_01', nombre: 'Análisis del expediente',            estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
      { id: 'GEN_02', nombre: 'Preparar respuesta o acción',        estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'EN_TRAMITE',
    label: 'En Trámite',
    siguiente: 'CERRADO',
    tareas: [
      { id: 'GEN_03', nombre: 'Seguimiento procesal',               estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
  {
    codigo: 'CERRADO',
    label: 'Cerrado',
    siguiente: undefined,
    tareas: [
      { id: 'GEN_04', nombre: 'Cierre y archivo',                   estado: 'sin_estado', fecha: null, fechaVencimiento: null, alertaActiva: false, diasAlerta: null, observaciones: '', docGde: null },
    ],
  },
]

// ── Mapa general tipo → estados ─────────────────────────
const ESTADOS_PROCESALES: Partial<Record<string, EstadoProcesal[]>> = {
  DEMANDA_CIVIL:   ESTADOS_DEMANDA_CIVIL,
  DEMANDA_LABORAL: ESTADOS_DEMANDA_CIVIL,
}

export function getEstadosProcesales(tipo: string): EstadoProcesal[] {
  return ESTADOS_PROCESALES[tipo] ?? ESTADOS_GENERICOS
}

export function getEstadoProcesal(tipo: string, codigo: string): EstadoProcesal | undefined {
  return getEstadosProcesales(tipo).find(e => e.codigo === codigo)
}

export function calcularUrgencia(fechaVencimiento?: string | null): UrgenciaTarea {
  if (!fechaVencimiento) return 'gris'
  const hoy = new Date()
  const vence = new Date(fechaVencimiento)
  const dias = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (dias < 0)  return 'rojo'
  if (dias <= 7) return 'ambar'
  return 'verde'
}
