import { create } from 'zustand'
import { PJN_NOVEDADES_MOCK } from '../data/pjnNovedades.mock'
import { useExpedientesStore } from './expedientes.store'
import type { NovedadPJN } from '../types'

interface PjnState {
  novedades: NovedadPJN[]
  aplicarNovedad: (id: string, usuarioId: string, textoFinal?: string) => void
  descartarNovedad: (id: string, usuarioId: string) => void
}

export const usePjnStore = create<PjnState>((set, get) => ({
  novedades: PJN_NOVEDADES_MOCK,

  aplicarNovedad: (id, usuarioId, textoFinal) => {
    const nov = get().novedades.find(n => n.id === id)
    if (!nov) return

    const expStore = useExpedientesStore.getState()
    const HOY = new Date().toISOString().split('T')[0]
    const texto = textoFinal ?? nov.valor_sugerido ?? nov.descripcion

    // Despachar a la acción real según el tipo de cambio — reutiliza toda la
    // infraestructura existente de actividades, sin crear un tipo especial.
    switch (nov.tipo_cambio) {
      case 'nuevo_movimiento':
      case 'nueva_resolucion':
      case 'cedula_notificada':
        expStore.agregarActividad(nov.expediente_id, {
          id: `PJN_ACT_${Date.now()}`,
          expediente_id: nov.expediente_id,
          tipo: 'MOVIMIENTO',
          titulo: nov.titulo,
          descripcion: texto,
          fecha: HOY,
          activo: true,
          subitems: [],
          origen_pjn: true,
        })
        break
      case 'cambio_estado':
        // El letrado revisa y confirma — acá solo registramos la novedad como
        // actividad informativa; el cambio de estado real lo sigue haciendo el
        // letrado manualmente desde el modal "Cambiar estado" (no forzamos un
        // estado nuevo sin que el letrado lo confirme explícitamente en su propio flujo).
        expStore.agregarActividad(nov.expediente_id, {
          id: `PJN_ACT_${Date.now()}`,
          expediente_id: nov.expediente_id,
          tipo: 'MOVIMIENTO',
          titulo: nov.titulo,
          descripcion: `${texto}\n\nNota: PJN reporta un cambio de estado. Revisar y actualizar manualmente desde "Cambiar estado" si corresponde.`,
          fecha: HOY,
          activo: true,
          subitems: [],
          origen_pjn: true,
        })
        break
    }

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
}))
