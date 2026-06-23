import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import {
  TIPOS_GESTION,
  TIPOS_INTERVENCION_CIVIL_LAB,
  TIPOS_INTERVENCION_PENAL,
} from '../../data/catalogos'
import { getCamposFormulario, CAMPOS_COMUNES_MESA } from '../../data/formularios'
import { ASIGNACION_PENAL } from '../../data/usuarios'
import { numerador } from '../../utils/format'
import { RUTAS } from '../../utils/routing'
import type { Area, Canal, TipoGestion } from '../../types'
import { toast } from 'react-toastify'

const TIPOS_PENAL_ABOGADO = new Set([
  'QUERELLA', 'DEFENSA_PENAL', 'CARTA_SUCESO', 'OFICIO', 'PEDIDO_CAUSA_PENAL',
])

export function useAltaForm(modoAbogadoPenal = false) {
  const navigate = useNavigate()
  const {} = useUIStore()
  const { expedientes } = useExpedientesStore()

  const [canal, setCanalState] = useState<Canal | ''>('EE_GDE')
  const [area, setAreaState] = useState<Area | ''>(modoAbogadoPenal ? 'PENAL' : '')
  const [tipo, setTipoState] = useState<TipoGestion | ''>('')
  const [lineaSeleccionada, setLineaSeleccionada] = useState('')
  const [camposMesa, setCamposMesaState] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const tiposFiltrados = useMemo(
    () => TIPOS_GESTION.filter(t =>
      !!area &&
      t.areas.includes(area as Area) &&
      (canal ? t.canales.includes(canal as Canal) : true) &&
      (!modoAbogadoPenal || TIPOS_PENAL_ABOGADO.has(t.code))
    ),
    [area, canal]
  )

  function setCanal(c: Canal | '') {
    setCanalState(c)
    if (tipo) {
      const td = TIPOS_GESTION.find(t => t.code === tipo)
      const stillValid =
        !!td &&
        (area ? td.areas.includes(area as Area) : false) &&
        (c ? td.canales.includes(c) : true)
      if (!stillValid) {
        setTipoState('')
        setCamposMesaState({})
      }
    }
  }

  function setArea(a: Area | '') {
    setAreaState(a)
    setTipoState('')
    setCamposMesaState(prev => ({ numero_ee_gde: prev['numero_ee_gde'] }))
  }

  function setTipo(t: TipoGestion | '') {
    setTipoState(t)
    setCamposMesaState(prev => ({ numero_ee_gde: prev['numero_ee_gde'] }))
    if (t) {
      const td = TIPOS_GESTION.find(x => x.code === t)
      if (td && canal && td.canal !== canal) {
        toast.info(`Este tipo se registra habitualmente por ${td.canal.replace('_', ' ')}. Canal actual: ${(canal as string).replace('_', ' ')}.`)
      }
    }
  }

  function setCampoMesa(id: string, val: unknown) {
    setCamposMesaState(prev => ({ ...prev, [id]: val }))
  }

  function setLinea(lineaId: string) {
    setLineaSeleccionada(lineaId)
    setCamposMesaState(prev => ({
      ...prev,
      linea: lineaId,
      abogado_id: lineaId ? ASIGNACION_PENAL[lineaId] : undefined,
    }))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!((camposMesa['numero_ee_gde'] as string | undefined ?? '').trim())) {
      errs['numero_ee_gde'] = 'El N° EE/Memo GDE es obligatorio.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function submit() {
    if (!validate()) return
    const count = expedientes.filter(e => e.area === (area as Area)).length + 1
    const newId = numerador(area as Area, count, new Date().getFullYear())
    toast.success(`Expediente ${newId} registrado y derivado correctamente.`)
    navigate(modoAbogadoPenal ? RUTAS.ACTUACIONES : RUTAS.MESA)
  }

  const tipoSeleccionado = useMemo(
    () => TIPOS_GESTION.find(t => t.code === tipo),
    [tipo]
  )

  const numeroCausaActual = camposMesa['numero_causa'] as string | undefined
  const causaDuplicada = useMemo(
    () => numeroCausaActual?.trim()
      ? expedientes.filter(e => e.numero_causa === numeroCausaActual.trim())
      : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [numeroCausaActual, expedientes]
  )

  const camposComunes = useMemo(() => {
    return CAMPOS_COMUNES_MESA.map(c => {
      if (c.id === 'mesa_tipo_intervencion') {
        return {
          ...c,
          options: (area === 'PENAL' ? TIPOS_INTERVENCION_PENAL : TIPOS_INTERVENCION_CIVIL_LAB)
            .map(t => t.label),
        }
      }
      return c
    })
  }, [area])

  const camposTipo = useMemo(
    () => tipo ? getCamposFormulario(tipo, 'mesa', area || undefined) : [],
    [tipo, area]
  )

  return {
    canal, area, tipo, camposMesa, errors,
    tiposFiltrados, tipoSeleccionado, causaDuplicada,
    camposComunes, camposTipo, lineaSeleccionada,
    setCanal, setArea, setTipo, setCampoMesa, setLinea, submit, validate,
  }
}
