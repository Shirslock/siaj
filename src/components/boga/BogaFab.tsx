import { useMemo, useState } from 'react'
import { useExpedientesStore } from '../../store/expedientes.store'
import { BogaChat } from './BogaChat'
import bogaAvatar from '../../assets/boga-avatar.jpg'

const PREGUNTAS_SUGERIDAS = [
  '¿Cómo doy de alta un expediente nuevo?',
  '¿Dónde veo las novedades del PJN?',
  '¿Cómo busco una actuación por número de causa?',
  '¿Qué son las áreas del sistema?',
]

export function BogaFab() {
  const [abierto, setAbierto] = useState(false)
  const expedientes = useExpedientesStore(s => s.expedientes)

  const contexto = useMemo(() => {
    const resumenActuaciones = expedientes.map(e => ({
      id: e.id,
      area: e.area,
      tipo: e.tipo,
      caratula: e.caratula,
      estado: e.estadoProcesal ?? e.estado,
      letrado_id: e.abogado_id,
      numero_causa: e.numero_causa,
    }))

    return JSON.stringify({
      modo: 'asistente_general_del_sistema',
      secciones_del_sistema: [
        { nombre: 'Principal', ruta: '/home' },
        { nombre: 'Panel de Control', ruta: '/dashboard' },
        { nombre: 'Mesa SACO', ruta: '/mesa' },
        { nombre: 'Actuaciones', ruta: '/actuaciones' },
        { nombre: 'Agenda', ruta: '/agenda' },
        { nombre: 'Novedades judiciales', ruta: '/novedades-judiciales' },
        { nombre: 'Configuración del Sistema', ruta: '/configuracion' },
      ],
      actuaciones_del_sistema: resumenActuaciones,
    })
  }, [expedientes])

  return (
    <>
      {abierto && (
        <div className="fixed bottom-24 right-6 w-96 h-[520px] max-w-[calc(100vw-3rem)] z-50 shadow-card-lg rounded-2xl">
          <BogaChat
            titulo="Boga — Asistente del sistema"
            saludoInicial="¡Hola! Soy Boga. Puedo ayudarte a moverte por SIAJ, encontrar actuaciones o responder dudas generales del sistema. ¿En qué te puedo ayudar?"
            contexto={contexto}
            preguntasSugeridas={PREGUNTAS_SUGERIDAS}
            incluirChiste={false}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto(o => !o)}
        title={abierto ? 'Cerrar asistente' : 'Abrir asistente Boga'}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-card-lg border border-[rgba(0,0,0,0.08)] overflow-hidden bg-white hover:scale-105 transition-transform z-50 flex items-center justify-center"
      >
        <img src={bogaAvatar} alt="Boga" className="w-full h-full object-cover" />
      </button>
    </>
  )
}
