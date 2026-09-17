import { useMemo } from 'react'
import { useExpedientesStore } from '../../../store/expedientes.store'
import { BogaChat } from '../../../components/boga/BogaChat'
import type { Expediente } from '../../../types'

interface Props { exp: Expediente }

const PREGUNTAS_SUGERIDAS = [
  '¿Cuál es el estado actual de esta actuación?',
  'Resumime el historial de esta actuación',
  '¿Cuáles son los próximos pasos a seguir?',
  '¿Hay novedades del PJN pendientes de revisión?',
]

export function AsistenteTab({ exp }: Props) {
  const expedientes = useExpedientesStore(s => s.expedientes)

  const contexto = useMemo(() => {
    const resumenTodasLasActuaciones = expedientes
      .filter(e => e.id !== exp.id)
      .map(e => ({
        id: e.id,
        area: e.area,
        tipo: e.tipo,
        caratula: e.caratula,
        estado: e.estadoProcesal ?? e.estado,
        letrado_id: e.abogado_id,
        numero_causa: e.numero_causa,
      }))

    return JSON.stringify({
      actuacion_actual: {
        id: exp.id,
        area: exp.area,
        tipo: exp.tipo,
        caratula: exp.caratula,
        estado: exp.estadoProcesal ?? exp.estado,
        abogado_id: exp.abogado_id,
        campos_mesa: exp.campos_mesa,
        campos_abogado: exp.campos_abogado,
        timeline_resumen: exp.timeline
          .slice(0, 15)
          .map(a => ({ tipo: a.tipo, titulo: a.titulo, fecha: a.fecha })),
      },
      otras_actuaciones_del_sistema: resumenTodasLasActuaciones,
    })
  }, [exp, expedientes])

  return (
    <div className="h-[600px]">
      <BogaChat
        titulo={`Boga — ${exp.id}`}
        saludoInicial={`¡Hola! Soy Boga, el asistente de esta actuación (${exp.id}). ¿En qué te puedo ayudar?`}
        contexto={contexto}
        preguntasSugeridas={PREGUNTAS_SUGERIDAS}
      />
    </div>
  )
}
