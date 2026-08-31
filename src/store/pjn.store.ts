import { create } from 'zustand'
import { PJN_NOVEDADES_MOCK, simularConsultaManualPjn } from '../data/pjnNovedades.mock'
import { useExpedientesStore } from './expedientes.store'
import type { Expediente, NovedadPJN } from '../types'

interface PjnState {
  novedades: NovedadPJN[]
  aplicarNovedad: (id: string, usuarioId: string, textoFinal?: string) => void
  descartarNovedad: (id: string, usuarioId: string) => void
  consultarNovedadIndividual: (
    expediente: Expediente,
    credenciales: { usuario: string; contrasena: string }
  ) => Promise<string>
}

export const usePjnStore = create<PjnState>((set, get) => ({
  novedades: PJN_NOVEDADES_MOCK,

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
              fecha_aplicacion: new Date().toISOString().split('T')[0],
            }
          : n
      ),
    }))
  },

  consultarNovedadIndividual: async (expediente, credenciales) => {
    const resultado = await simularConsultaManualPjn(expediente, credenciales)
    if (resultado.novedades.length > 0) {
      set(s => ({ novedades: [...s.novedades, ...resultado.novedades] }))
    }
    return resultado.corridaId
  },
}))
