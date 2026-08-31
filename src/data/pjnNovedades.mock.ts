import type { Expediente, NovedadPJN } from '../types'

// Mock de movimientos detectados por la sincronización con el Portal PJN — Nivel 1:
// datos crudos, sin clasificar, agrupados por corrida (`corrida_id`). El letrado decide
// movimiento por movimiento si lo aplica al historial. Solo aplica a actuaciones con
// `numero_causa` real cargado.
export const PJN_NOVEDADES_MOCK: NovedadPJN[] = [
  // ── C-0100/2026 (CIVIL) — corrida 2025-06-19, detecta movimientos del 18/06/2025 ──
  // Secuencia real: pedido de alegatos (fs.253) → autos para alegar (fs.254) →
  // dos cédulas notificadas el mismo día a las 09:58.
  { id: 'PJN_001', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20250619',
    fecha_deteccion: '2025-06-19', fecha_movimiento: '2025-06-18', row_index: 1,
    oficina: 'ISJ', tipo: 'CEDULA ELECTRONICA PARTE',
    detalle: 'CEDULA N° 25000094250380 - NOTIFICADO EL 18/06/2025 09:58',
    estado: 'pendiente' },
  { id: 'PJN_002', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20250619',
    fecha_deteccion: '2025-06-19', fecha_movimiento: '2025-06-18', row_index: 2,
    oficina: 'ISJ', tipo: 'CEDULA ELECTRONICA PARTE',
    detalle: 'CEDULA N° 25000094250379 - NOTIFICADO EL 18/06/2025 09:58',
    estado: 'pendiente' },
  { id: 'PJN_003', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20250619',
    fecha_deteccion: '2025-06-19', fecha_movimiento: '2025-06-18', row_index: 3,
    oficina: 'ISJ', tipo: 'MOVIMIENTO', detalle: 'EN LETRA',
    estado: 'descartada', aplicada_por: 'UR_004', fecha_aplicacion: '2025-06-19' },
  { id: 'PJN_004', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20250619',
    fecha_deteccion: '2025-06-19', fecha_movimiento: '2025-06-18', row_index: 4,
    oficina: 'ISJ', tipo: 'FIRMA DESPACHO',
    detalle: 'AUTOS PARA ALEGAR (EXPEDIENTE DIGITAL)', foja: '254/254',
    estado: 'aplicada', aplicada_por: 'UR_004', fecha_aplicacion: '2025-06-19' },
  { id: 'PJN_005', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20250619',
    fecha_deteccion: '2025-06-19', fecha_movimiento: '2025-06-18', row_index: 5,
    oficina: 'ISJ', tipo: 'ESCRITO AGREGADO',
    detalle: 'SE PONGAN PARA ALEGAR [Presentado 11/06/2025 12:01]', foja: '253/253',
    tiene_documento: true,
    documento_url: '/scw/viewer.seam?id=JkUVdAfAlXNl9uDJ8eOK%2BwQlKVyIjkHxjnnI&tipoDoc=escrito',
    estado: 'pendiente' },

  // ── C-0100/2026 (CIVIL) — corrida 2026-07-18, detecta movimientos del 17/07/2026 ──
  // Corrida "ruidosa": mucho movimiento de estado interno (EN DESPACHO/EN LETRA,
  // EVENTO, CAMBIO DE ESTADO, PASE) y un solo hito sustantivo (FIRMA DESPACHO que
  // corre traslado de un recurso de inconstitucionalidad). Buen caso para mostrarle
  // al letrado en la demo por qué Nivel 2 va a importar más adelante.
  { id: 'PJN_006', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 1,
    oficina: 'ISJ', tipo: 'MOVIMIENTO', detalle: 'EN DESPACHO', estado: 'pendiente' },
  { id: 'PJN_007', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 2,
    oficina: 'ISJ', tipo: 'MOVIMIENTO', detalle: 'EN LETRA', estado: 'pendiente' },
  { id: 'PJN_008', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 3,
    oficina: 'ISJ', tipo: 'CEDULA ELECTRONICA TRIBUNAL',
    detalle: 'CEDULA N° 26000109795790 - NOTIFICADO EL DIA: 17/07/2026 09:57',
    tiene_documento: true,
    documento_url: '/scw/viewer.seam?id=XcuJ7pcTF%2BBZFa5KwwfcgretVsdgg&tipoDoc=cedula',
    estado: 'pendiente' },
  { id: 'PJN_009', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 4,
    oficina: 'ISJ', tipo: 'CEDULA ELECTRONICA TRIBUNAL',
    detalle: 'CEDULA N° 26000109795789 - NOTIFICADO EL DIA: 17/07/2026 09:57',
    estado: 'pendiente' },
  { id: 'PJN_010', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 5,
    oficina: 'ISJ', tipo: 'EVENTO', detalle: 'NOTIFICACION', estado: 'pendiente' },
  { id: 'PJN_011', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 6,
    oficina: 'ISJ', tipo: 'CAMBIO DE ESTADO DE EXPEDIENTE',
    detalle: 'APERTURA RECURSO - RELACION', estado: 'pendiente' },
  { id: 'PJN_012', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 7,
    oficina: 'ISJ', tipo: 'FIRMA DESPACHO',
    detalle: 'POR RECIBIDOS. DEL RECURSO DE INCONSTITUCIONALIDAD INTERPUESTO CORRASE TRASLADO.',
    foja: '562/562', estado: 'pendiente' },
  { id: 'PJN_013', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 8,
    oficina: 'ISJ', tipo: 'DEO',
    detalle: 'ENVIO DEO: 23999755 - REMISIÓN DE AUTOS PRINCIPALES - JUZGADO CIVIL 99',
    estado: 'pendiente' },
  { id: 'PJN_014', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 9,
    oficina: 'ISJ', tipo: 'RECEPCION PASE', detalle: 'CAMARA CIVIL - SALA J',
    estado: 'pendiente' },
  { id: 'PJN_015', expediente_id: 'C-0100/2026', corrida_id: 'RUN_C0100_20260718',
    fecha_deteccion: '2026-07-18', fecha_movimiento: '2026-07-17', row_index: 10,
    oficina: '032', tipo: 'PASE', detalle: 'CAMARA CIVIL - SALA J',
    estado: 'pendiente' },

  // ── L-0100/2026 (LABORAL) — corrida 2026-08-21, ilustrativa ──
  { id: 'PJN_016', expediente_id: 'L-0100/2026', corrida_id: 'RUN_L0100_20260821',
    fecha_deteccion: '2026-08-21', fecha_movimiento: '2026-08-20', row_index: 1,
    oficina: 'SEC30', tipo: 'MOVIMIENTO', detalle: 'EN DESPACHO', estado: 'pendiente' },
  { id: 'PJN_017', expediente_id: 'L-0100/2026', corrida_id: 'RUN_L0100_20260821',
    fecha_deteccion: '2026-08-21', fecha_movimiento: '2026-08-20', row_index: 2,
    oficina: 'SEC30', tipo: 'FIRMA DESPACHO',
    detalle: 'SE TIENE POR CONTESTADA LA DEMANDA. TRASLADO DE LA PRUEBA OFRECIDA POR 10 DÍAS',
    foja: '88/88', estado: 'pendiente' },
  { id: 'PJN_018', expediente_id: 'L-0100/2026', corrida_id: 'RUN_L0100_20260821',
    fecha_deteccion: '2026-08-21', fecha_movimiento: '2026-08-19', row_index: 3,
    oficina: 'SEC30', tipo: 'ESCRITO AGREGADO',
    detalle: 'CONTESTA TRASLADO DE PRUEBA [Presentado 19/08/2026 16:40]',
    foja: '89/91', estado: 'pendiente' },
  { id: 'PJN_019', expediente_id: 'L-0100/2026', corrida_id: 'RUN_L0100_20260821',
    fecha_deteccion: '2026-08-21', fecha_movimiento: '2026-08-20', row_index: 4,
    oficina: 'SEC30', tipo: 'CEDULA ELECTRONICA PARTE',
    detalle: 'CEDULA N° 26000112233440 - NOTIFICADO EL 20/08/2026 10:15',
    tiene_documento: true,
    documento_url: '/scw/viewer.seam?id=Qz9pLwFa3KTbb2mVxrwn&tipoDoc=cedula',
    estado: 'pendiente' },
  { id: 'PJN_020', expediente_id: 'L-0100/2026', corrida_id: 'RUN_L0100_20260821',
    fecha_deteccion: '2026-08-21', fecha_movimiento: '2026-08-20', row_index: 5,
    oficina: 'SEC30', tipo: 'MOVIMIENTO', detalle: 'EN LETRA', estado: 'pendiente' },

  // ── P-0100/2026 (PENAL) — corrida 2026-08-23, ilustrativa ──
  { id: 'PJN_021', expediente_id: 'P-0100/2026', corrida_id: 'RUN_P0100_20260823',
    fecha_deteccion: '2026-08-23', fecha_movimiento: '2026-08-22', row_index: 1,
    oficina: 'JCC22', tipo: 'MOVIMIENTO', detalle: 'EN DESPACHO', estado: 'pendiente' },
  { id: 'PJN_022', expediente_id: 'P-0100/2026', corrida_id: 'RUN_P0100_20260823',
    fecha_deteccion: '2026-08-23', fecha_movimiento: '2026-08-22', row_index: 2,
    oficina: 'JCC22', tipo: 'FIRMA DESPACHO',
    detalle: 'SE ORDENA LIBRAR OFICIO A LA COMISARÍA INTERVINIENTE A FIN DE QUE REMITA COPIA CERTIFICADA DEL SUMARIO LABRADO',
    foja: '41/41', estado: 'pendiente' },
  { id: 'PJN_023', expediente_id: 'P-0100/2026', corrida_id: 'RUN_P0100_20260823',
    fecha_deteccion: '2026-08-23', fecha_movimiento: '2026-08-22', row_index: 3,
    oficina: 'JCC22', tipo: 'DEO',
    detalle: 'ENVIO DEO: 88123456 - OFICIO COMISARÍA 25° - CABA', estado: 'pendiente' },
  { id: 'PJN_024', expediente_id: 'P-0100/2026', corrida_id: 'RUN_P0100_20260823',
    fecha_deteccion: '2026-08-23', fecha_movimiento: '2026-08-22', row_index: 4,
    oficina: 'JCC22', tipo: 'CEDULA ELECTRONICA TRIBUNAL',
    detalle: 'CEDULA N° 26000113345501 - NOTIFICADO EL DIA: 22/08/2026 11:30',
    estado: 'pendiente' },
  { id: 'PJN_025', expediente_id: 'P-0100/2026', corrida_id: 'RUN_P0100_20260823',
    fecha_deteccion: '2026-08-23', fecha_movimiento: '2026-08-22', row_index: 5,
    oficina: 'JCC22', tipo: 'EVENTO', detalle: 'NOTIFICACION', estado: 'pendiente' },
]

// Textos crudos realistas para simular la respuesta de una consulta manual — deliberadamente
// en la misma línea del mock de arriba (tipos sin clasificar, tal cual los expone el PJN).
const MOVS_MANUAL_MOCK: Array<Pick<NovedadPJN, 'tipo' | 'detalle' | 'oficina' | 'foja'>> = [
  { tipo: 'ESCRITO AGREGADO', detalle: 'SE PRESENTA Y EVACUA TRASLADO CONFERIDO', oficina: 'ISJ', foja: '312/314' },
  { tipo: 'FIRMA DESPACHO', detalle: 'PROVEASE COMO SE PIDE. NOTIFIQUESE.', oficina: 'ISJ', foja: '315/315' },
  { tipo: 'CEDULA ELECTRONICA PARTE', detalle: 'CEDULA N° 26000121987650 - NOTIFICADO EL 31/08/2026 08:40', oficina: 'ISJ' },
  { tipo: 'MOVIMIENTO', detalle: 'EN LETRA', oficina: 'ISJ' },
]

// Simula la consulta on-demand del Portal PJN para una causa puntual, ingresando
// usuario/contraseña propios del letrado. 100% mock en frontend — no hay llamada real
// a ningún servicio externo.
export function simularConsultaManualPjn(
  expediente: Expediente,
  credenciales: { usuario: string; contrasena: string }
): Promise<{ corridaId: string; novedades: NovedadPJN[] }> {
  const corridaId = `RUN_MANUAL_${expediente.id}_${Date.now()}`

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (credenciales.contrasena.trim().toLowerCase() === 'error') {
        reject(new Error('Credenciales inválidas o error de conexión con el Portal PJN.'))
        return
      }

      // Mayoría de las veces devuelve novedades, para que la demo luzca bien.
      const hayNovedades = Math.random() < 0.8
      if (!hayNovedades) {
        resolve({ corridaId, novedades: [] })
        return
      }

      const cantidad = 1 + Math.floor(Math.random() * 3) // 1-3
      const HOY = new Date().toISOString().split('T')[0]
      const elegidos = [...MOVS_MANUAL_MOCK].sort(() => Math.random() - 0.5).slice(0, cantidad)

      const novedades: NovedadPJN[] = elegidos.map((mov, idx) => ({
        id: `PJN_MANUAL_${expediente.id}_${Date.now()}_${idx}`,
        expediente_id: expediente.id,
        corrida_id: corridaId,
        fecha_deteccion: HOY,
        fecha_movimiento: HOY,
        row_index: idx + 1,
        oficina: mov.oficina,
        tipo: mov.tipo,
        detalle: mov.detalle,
        foja: mov.foja,
        estado: 'pendiente',
        origen: 'manual',
      }))

      resolve({ corridaId, novedades })
    }, 1200)
  })
}
