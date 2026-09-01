import { useState } from 'react'
import { usePjnStore, MAX_CONSULTAS_DIARIAS } from '../../store/pjn.store'
import { useUIStore } from '../../store/ui.store'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import Icon from '../ui/Icon'
import { NovedadPjnCard } from './NovedadPjnCard'
import type { Expediente } from '../../types'

interface Props {
  expediente: Expediente
  open: boolean
  onClose: () => void
}

type Etapa = 'form' | 'cargando' | 'resultados' | 'error'

export function ConsultarNovedadPjnModal({ expediente, open, onClose }: Props) {
  const { consultarNovedadIndividual, novedades, consultasRestantesHoy } = usePjnStore()
  const { usuarioActivo } = useUIStore()
  const [etapa, setEtapa] = useState<Etapa>('form')
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [corridaId, setCorridaId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const restantes = usuarioActivo ? consultasRestantesHoy(usuarioActivo.id) : 0
  const sinCupo = restantes <= 0

  function resetForm(limpiarUsuario: boolean) {
    setEtapa('form')
    setContrasena('')
    if (limpiarUsuario) setUsuario('')
  }

  function handleClose() {
    resetForm(true)
    setCorridaId(null)
    setErrorMsg('')
    onClose()
  }

  async function handleConsultar() {
    if (!usuarioActivo) return
    setEtapa('cargando')
    try {
      const id = await consultarNovedadIndividual(expediente, { usuario, contrasena }, usuarioActivo.id)
      setContrasena('')
      setCorridaId(id)
      setEtapa('resultados')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al consultar el Portal PJN.')
      setEtapa('error')
    }
  }

  const resultadosCorrida = corridaId
    ? novedades.filter(n => n.corrida_id === corridaId)
    : []

  return (
    <Modal open={open} onClose={handleClose} titulo="Consultar Novedad PJN" size="md">
      {(etapa === 'form' || etapa === 'cargando') && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#f5f5f5] px-4 py-3">
            <p className="text-xs text-[#4a6a84]">Causa a consultar</p>
            <p className="text-sm font-bold font-mono text-[#1b3a57]">{expediente.numero_causa}</p>
          </div>

          {sinCupo ? (
            <>
              <div className="rounded-xl bg-red-50 border border-red-200/60 px-4 py-3 flex items-start gap-2.5">
                <Icon name="error" size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  Alcanzaste el límite de {MAX_CONSULTAS_DIARIAS} consultas manuales por hoy. Volvé a intentarlo mañana.
                </p>
              </div>
              <div className="flex items-center justify-end">
                <Button variant="secondary" size="sm" onClick={handleClose}>Cerrar</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-[#4a6a84]">
                Te quedan {restantes} de {MAX_CONSULTAS_DIARIAS} consultas hoy.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#4a6a84] mb-1">Usuario PJN</label>
                <input
                  type="text"
                  className="field-input w-full text-sm"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  disabled={etapa === 'cargando'}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4a6a84] mb-1">Contraseña PJN</label>
                <input
                  type="password"
                  className="field-input w-full text-sm"
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  disabled={etapa === 'cargando'}
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={handleClose} disabled={etapa === 'cargando'}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConsultar}
                  disabled={etapa === 'cargando' || !usuario.trim() || !contrasena.trim()}
                >
                  {etapa === 'cargando' ? (
                    <span className="flex items-center gap-2">
                      <Icon name="refresh" size={16} className="animate-spin" />
                      Consultando el Portal PJN...
                    </span>
                  ) : (
                    'Consultar'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {etapa === 'error' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 border border-red-200/60 px-4 py-3 flex items-start gap-2.5">
            <Icon name="error" size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={handleClose}>Cerrar</Button>
            <Button variant="primary" size="sm" onClick={() => resetForm(false)}>Reintentar</Button>
          </div>
        </div>
      )}

      {etapa === 'resultados' && (
        <div className="space-y-3">
          {resultadosCorrida.length === 0 ? (
            <>
              <p className="text-sm text-[#4a6a84]">No se encontraron novedades nuevas para esta causa.</p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => resetForm(true)}>Volver a intentar</Button>
                <Button variant="primary" size="sm" onClick={handleClose}>Cerrar</Button>
              </div>
            </>
          ) : (
            <>
              {resultadosCorrida.map(n => (
                <NovedadPjnCard key={n.id} novedad={n} mostrarActuacion={false} />
              ))}
              <div className="flex items-center justify-end pt-1">
                <Button variant="secondary" size="sm" onClick={handleClose}>Cerrar</Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
