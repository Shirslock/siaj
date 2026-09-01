import { create } from 'zustand'
import { ACTUACIONES_PJN_SIN_CARGAR_MOCK, PJN_NOVEDADES_MOCK, simularConsultaManualPjn } from '../data/pjnNovedades.mock'
import { useExpedientesStore } from './expedientes.store'
import type { ActuacionPjnSinCargar, Expediente, NovedadPJN } from '../types'

// Límite de negocio: 3 consultas manuales exitosas por letrado por día, sumando todas las
// causas que consulte (no es por causa). Solo cuentan los intentos exitosos — con o sin
// novedades encontradas; un error de credenciales no consume cupo, se puede reintentar.
export const MAX_CONSULTAS_DIARIAS = 3

interface PjnState {
  novedades: NovedadPJN[]
  actuacionesSinCargar: ActuacionPjnSinCargar[]
  consultasManualesPorUsuario: Record<string, { fecha: string; cantidad: number }>
  aplicarNovedad: (id: string, usuarioId: string, textoFinal?: string) => void
  aplicarNovedades: (ids: string[], usuarioId: string) => void
  descartarNovedad: (id: string, usuarioId: string) => void
  descartarNovedades: (ids: string[], usuarioId: string) => void
  consultarNovedadIndividual: (
    expediente: Expediente,
    credenciales: { usuario: string; contrasena: string },
    usuarioId: string
  ) => Promise<string>
  consultasRestantesHoy: (usuarioId: string) => number
  descartarAlerta: (id: string, usuarioId: string) => void
  resolverAlerta: (id: string, usuarioId: string) => void
}

function hoyISO(): string {
  return new Date().toISOString().split('T')[0]
}

export const usePjnStore = create<PjnState>((set, get) => ({
  novedades: PJN_NOVEDADES_MOCK,
  actuacionesSinCargar: ACTUACIONES_PJN_SIN_CARGAR_MOCK,
  consultasManualesPorUsuario: {},

  aplicarNovedades: (ids, usuarioId) => {
    ids.forEach(id => {
      const nov = get().novedades.find(n => n.id === id)
      if (nov && nov.estado === 'pendiente') get().aplicarNovedad(id, usuarioId)
    })
  },

  aplicarNovedad: (id, usuarioId, textoFinal) => {
    const nov = get().novedades.find(n => n.id === id)
    if (!nov) return

    const expStore = useExpedientesStore.getState()
    const HOY = new Date().toISOString().split('T')[0]
    const texto = textoFinal ?? nov.detalle

    // Nivel 1: sin clasificación — una sola rama, siempre actividad MOVIMIENTO con el
    // tipo crudo del PJN como título y la metadata cruda (oficina/foja/link) al pie.
    const metadata = [
      nov.oficina ? `Oficina: ${nov.oficina}` : null,
      nov.foja ? `Fs. ${nov.foja}` : null,
      'PJN',
    ].filter(Boolean).join(' · ')

    // placeholder — reemplazar por el dominio real del PJN cuando se defina
    const PJN_BASE_URL = 'https://scw.pjn.gov.ar'
    const lineaDocumento = nov.tiene_documento && nov.documento_url
      ? `\n\nDocumento (PJN): ${PJN_BASE_URL}${nov.documento_url}`
      : ''

    expStore.agregarActividad(nov.expediente_id, {
      id: `PJN_ACT_${Date.now()}`,
      expediente_id: nov.expediente_id,
      tipo: 'MOVIMIENTO',
      titulo: nov.tipo,
      descripcion: `${texto}\n\n${metadata}${lineaDocumento}`,
      fecha: HOY,
      activo: true,
      subitems: [],
      origen_pjn: true,
    })

    set(s => ({
      novedades: s.novedades.map(n =>
        n.id === id
          ? { ...n, estado: 'aplicada' as const, aplicada_por: usuarioId, fecha_aplicacion: HOY }
          : n
      ),
    }))
  },

  descartarNovedad: (id, usuarioId) => {
    set(s => ({
      novedades: s.novedades.map(n =>
        n.id === id
          ? {
              ...n,
              estado: 'descartada' as const,
              aplicada_por: usuarioId,
              fecha_aplicacion: hoyISO(),
            }
          : n
      ),
    }))
  },

  descartarNovedades: (ids, usuarioId) => {
    ids.forEach(id => {
      const nov = get().novedades.find(n => n.id === id)
      if (nov && nov.estado === 'pendiente') get().descartarNovedad(id, usuarioId)
    })
  },

  consultasRestantesHoy: usuarioId => {
    const registro = get().consultasManualesPorUsuario[usuarioId]
    const usadasHoy = registro && registro.fecha === hoyISO() ? registro.cantidad : 0
    return MAX_CONSULTAS_DIARIAS - usadasHoy
  },

  consultarNovedadIndividual: async (expediente, credenciales, usuarioId) => {
    if (get().consultasRestantesHoy(usuarioId) <= 0) {
      throw new Error(`Alcanzaste el límite de ${MAX_CONSULTAS_DIARIAS} consultas manuales por hoy.`)
    }

    const resultado = await simularConsultaManualPjn(expediente, credenciales)

    // Solo cuentan los intentos exitosos (con o sin novedades) — un error de credenciales
    // no consume cupo, se puede reintentar sin gastarlo.
    set(s => {
      const HOY = hoyISO()
      const registro = s.consultasManualesPorUsuario[usuarioId]
      const cantidad = registro && registro.fecha === HOY ? registro.cantidad + 1 : 1
      return {
        consultasManualesPorUsuario: {
          ...s.consultasManualesPorUsuario,
          [usuarioId]: { fecha: HOY, cantidad },
        },
      }
    })

    if (resultado.novedades.length > 0) {
      set(s => ({ novedades: [...s.novedades, ...resultado.novedades] }))
    }
    return resultado.corridaId
  },

  descartarAlerta: (id, usuarioId) => {
    const HOY = new Date().toISOString().split('T')[0]
    set(s => ({
      actuacionesSinCargar: s.actuacionesSinCargar.map(a =>
        a.id === id
          ? { ...a, estado: 'descartada' as const, descartada_por: usuarioId, fecha_resolucion: HOY }
          : a
      ),
    }))
  },

  // Decisión de negocio: cargar la actuación que generó la alerta es 100% desacoplado del
  // flujo de Alta de Expediente normal — no hay auto-consulta al PJN ni linking automático.
  // "Resuelta" solo confirma que alguien ya vio la alerta y cargó la actuación en algún
  // lado; no vincula ningún expediente puntual (por eso misma firma que descartarAlerta).
  resolverAlerta: (id, usuarioId) => {
    const HOY = new Date().toISOString().split('T')[0]
    set(s => ({
      actuacionesSinCargar: s.actuacionesSinCargar.map(a =>
        a.id === id
          ? { ...a, estado: 'resuelta' as const, descartada_por: usuarioId, fecha_resolucion: HOY }
          : a
      ),
    }))
  },
}))
