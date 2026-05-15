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
import { numerador } from '../../utils/format'
import { RUTAS } from '../../utils/routing'
import type { Area, Canal, TipoGestion } from '../../types'

const EXCLUDED_COMUNES = new Set(['numero_ee_gde', 'area', 'tipo_gestion'])

export function useAltaForm() {
  const navigate = useNavigate()
  const { showToast } = useUIStore()
  const { expedientes } = useExpedientesStore()

  const [canal, setCanalState] = useState<Canal | ''>('EE_GDE')
  const [area, setAreaState] = useState<Area | ''>('')
  const [tipo, setTipoState] = useState<TipoGestion | ''>('')
  const [camposMesa, setCamposMesaState] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const tiposFiltrados = useMemo(
    () => TIPOS_GESTION.filter(t =>
      !!area &&
      t.areas.includes(area as Area) &&
      (canal ? t.canales.includes(canal as Canal) : true)
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
    setCamposMesaState({})
  }

  function setTipo(t: TipoGestion | '') {
    setTipoState(t)
    setCamposMesaState({})
    if (t) {
      const td = TIPOS_GESTION.find(x => x.code === t)
      if (td && canal && td.canal !== canal) {
        showToast(
          `Este tipo se registra habitualmente por ${td.canal.replace('_', ' ')}. Canal actual: ${(canal as string).replace('_', ' ')}.`,
          'info'
        )
      }
    }
  }

  function setCampoMesa(id: string, val: unknown) {
    setCamposMesaState(prev => ({ ...prev, [id]: val }))
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
    showToast(`Expediente ${newId} registrado y derivado correctamente.`, 'success')
    navigate(RUTAS.MESA)
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
    return CAMPOS_COMUNES_MESA
      .filter(c => !EXCLUDED_COMUNES.has(c.id))
      .map(c => {
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
    camposComunes, camposTipo,
    setCanal, setArea, setTipo, setCampoMesa, submit,
  }
}
