import type { NovedadPJN } from '../types'

// Mock de novedades detectadas por la sincronización con el Portal PJN.
// Solo aplica a actuaciones con `numero_causa` real cargado — en el mock actual
// eso reduce el universo a P-0100/2026 y P-0101/2026 (ambas PENAL, letrado UR_019).
export const PJN_NOVEDADES_MOCK: NovedadPJN[] = [
  {
    id: 'PJN_001',
    expediente_id: 'P-0100/2026',
    tipo_cambio: 'nuevo_movimiento',
    titulo: 'Nuevo despacho en el expediente',
    descripcion: 'El Portal PJN detectó un nuevo despacho judicial no registrado en SIAJ. Fecha del despacho según PJN: 21/08/2026.',
    valor_sugerido: 'Se dispone librar oficio a la Comisaría interviniente a fin de que remita copia certificada del sumario labrado, con carácter de urgente.',
    fecha_deteccion: '2026-08-22',
    estado: 'pendiente',
  },
  {
    id: 'PJN_002',
    expediente_id: 'P-0100/2026',
    tipo_cambio: 'cedula_notificada',
    titulo: 'Cédula notificada en el expediente',
    descripcion: 'El Portal PJN registró la notificación de una cédula electrónica dirigida a esta parte. Fecha de notificación según PJN: 22/08/2026.',
    valor_sugerido: 'Cédula electrónica notificada — corre traslado de la prueba testimonial ofrecida por la fiscalía.',
    fecha_deteccion: '2026-08-23',
    estado: 'pendiente',
  },
  {
    id: 'PJN_003',
    expediente_id: 'P-0100/2026',
    tipo_cambio: 'cambio_estado',
    titulo: 'PJN reporta cambio de estado procesal',
    descripcion: 'El Portal PJN muestra el expediente en estado "ELEVACIÓN A JUICIO", distinto al estado actual registrado en SIAJ ("EN ANÁLISIS").',
    valor_sugerido: 'Portal PJN: expediente elevado a juicio.',
    fecha_deteccion: '2026-08-23',
    estado: 'pendiente',
  },
  {
    id: 'PJN_004',
    expediente_id: 'P-0101/2026',
    tipo_cambio: 'nueva_resolucion',
    titulo: 'Nueva resolución judicial',
    descripcion: 'El Portal PJN detectó una resolución judicial no registrada en SIAJ, dictada el 21/08/2026 por el Juzgado Nac. Crim. y Correc. 22.',
    valor_sugerido: 'Resolución: se tiene por presentada la querella y se corre vista al Ministerio Público Fiscal por el término de ley.',
    fecha_deteccion: '2026-08-21',
    estado: 'pendiente',
  },
  {
    id: 'PJN_005',
    expediente_id: 'P-0101/2026',
    tipo_cambio: 'nuevo_movimiento',
    titulo: 'Nuevo despacho en el expediente',
    descripcion: 'El Portal PJN detectó un nuevo despacho judicial no registrado en SIAJ. Fecha del despacho según PJN: 20/08/2026.',
    valor_sugerido: 'Se agrega informe médico legal del damnificado, remitido por el Hospital Pirovano.',
    fecha_deteccion: '2026-08-21',
    estado: 'pendiente',
  },
  {
    id: 'PJN_006',
    expediente_id: 'P-0101/2026',
    tipo_cambio: 'cedula_notificada',
    titulo: 'Cédula notificada en el expediente',
    descripcion: 'El Portal PJN registró la notificación de una cédula electrónica dirigida a esta parte. Fecha de notificación según PJN: 19/08/2026.',
    valor_sugerido: 'Cédula electrónica notificada — se fija audiencia testimonial para el 05/09/2026 a las 10:00 hs.',
    fecha_deteccion: '2026-08-20',
    estado: 'pendiente',
  },
]
