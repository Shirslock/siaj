import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { TIPOS_GESTION } from '../../data/catalogos'
import { numerador } from '../../utils/format'
import { RUTAS } from '../../utils/routing'
import type { Area, Canal, TipoGestion } from '../../types'

export function useAltaForm() {
  const navigate = useNavigate()
  const { showToast } = useUIStore()
  const { expedientes } = useExpedientesStore()

  const [area, setAreaState] = useState<Area | ''>('')
  const [tipo, setTipoState] = useState<TipoGestion | ''>('')
  const [canal, setCanalState] = useState<Canal | ''>('')
  const [camposMesa, setCamposMesaState] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  function setArea(a: Area | '') {
    setAreaState(a)
    setTipoState('')
    setCanalState('')
    setCamposMesaState({})
    setErrors({})
  }

  function setTipo(t: TipoGestion | '') {
    setTipoState(t)
    if (t) {
      const td = TIPOS_GESTION.find(x => x.code === t)
      if (td) setCanalState(td.canal)
    }
    setErrors({})
  }

  function setCanal(c: Canal | '') {
    setCanalState(c)
  }

  function setCampoMesa(id: string, val: unknown) {
    setCamposMesaState(prev => ({ ...prev, [id]: val }))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!area) errs['area'] = 'Seleccione un área.'
    if (!tipo) errs['tipo'] = 'Seleccione un tipo de gestión.'
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
    showToast(`Expediente ${newId} registrado y asignado correctamente.`, 'success')
    navigate(RUTAS.BANDEJA_ABOGADO)
  }

  const numeroCausaActual = camposMesa['numero_causa'] as string | undefined
  const causaDuplicada = numeroCausaActual?.trim()
    ? expedientes.filter(e => e.numero_causa === numeroCausaActual.trim())
    : []

  const tipoSeleccionado = TIPOS_GESTION.find(t => t.code === tipo)

  return {
    area, tipo, canal, camposMesa, errors, causaDuplicada, tipoSeleccionado,
    setArea, setTipo, setCanal, setCampoMesa, submit,
  }
}
