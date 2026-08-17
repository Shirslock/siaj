import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import Icon from '../ui/Icon'
import { useExpedientesStore } from '../../store/expedientes.store'
import { CONFIG_SOLICITUDES_PENALES } from '../../data/solicitudesPenales'

interface SolicitudDetalle {
  campos: Record<string, string>
  archivos: Record<string, string[]>
}

interface Props {
  open: boolean
  onClose: () => void
  expId: string
  tipo: string   // uno de TIPOS_SOLICITUD_PENAL
  dataInicial?: SolicitudDetalle
}

export function ModalSolicitudPenal({ open, onClose, expId, tipo, dataInicial }: Props) {
  const { actualizarCampoAbogado, agregarDocumento, expedientes } = useExpedientesStore()

  const config = CONFIG_SOLICITUDES_PENALES[tipo]

  const [campos, setCampos] = useState<Record<string, string>>(dataInicial?.campos ?? {})
  const [archivos, setArchivos] = useState<Record<string, string[]>>(dataInicial?.archivos ?? {})

  // Resetear al cambiar de tipo/abrir
  useEffect(() => {
    setCampos(dataInicial?.campos ?? {})
    setArchivos(dataInicial?.archivos ?? {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, open])

  if (!config) return null

  // Campos a renderizar: fijos + condicionales
  const campoDisparadorVal = config.camposCondicionales
    ? campos[config.camposCondicionales.campoDisparador]
    : undefined

  const camposCondicionales =
    config.camposCondicionales && campoDisparadorVal
      ? config.camposCondicionales.opciones[campoDisparadorVal] ?? []
      : []

  const todosCampos = [...config.campos, ...camposCondicionales]

  function handleFileUpload(campoId: string, file: File) {
    const docId = `DOC_SOL_${Date.now()}`
    agregarDocumento(expId, {
      id: docId,
      nombre: file.name,
      tipo: file.name.split('.').pop()?.toUpperCase() ?? 'FILE',
      fecha: new Date().toISOString().split('T')[0],
      size: `${Math.round(file.size / 1024)} KB`,
      icon: 'attach_file',
      color: 'text-[#4a6a84]',
    })
    setArchivos(p => ({
      ...p,
      [campoId]: [...(p[campoId] ?? []), docId],
    }))
    toast.success(`${file.name} agregado al repositorio de Documentos.`)
  }

  function guardar() {
    const exp = expedientes.find(e => e.id === expId)
    const actual = (exp?.campos_abogado?.abg_solicitudes_detalle as Record<string, SolicitudDetalle>) ?? {}

    actualizarCampoAbogado(expId, 'abg_solicitudes_detalle', {
      ...actual,
      [tipo]: { campos, archivos },
    })
    toast.success(`Datos de "${tipo}" guardados.`)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      titulo={tipo}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={guardar}>Guardar</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 py-1">
        {todosCampos.map(c => (
          <div key={c.id} className={c.full ? 'col-span-2' : ''}>
            <label className="field-label">{c.label}</label>

            {c.tipo === 'select' ? (
              <select
                className="field-input w-full"
                value={campos[c.id] ?? ''}
                onChange={e => setCampos(p => ({ ...p, [c.id]: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {c.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : c.tipo === 'textarea' ? (
              <textarea
                className="field-input w-full resize-none"
                style={{ minHeight: 64 }}
                value={campos[c.id] ?? ''}
                onChange={e => setCampos(p => ({ ...p, [c.id]: e.target.value }))}
              />
            ) : (
              <input
                type={c.tipo === 'money' ? 'number' : c.tipo}
                className="field-input w-full"
                value={campos[c.id] ?? ''}
                onChange={e => setCampos(p => ({ ...p, [c.id]: e.target.value }))}
              />
            )}

            {c.permiteArchivo && (
              <div className="mt-1.5">
                <label className="flex items-center gap-1.5 text-[11px] text-[#4a6a84] cursor-pointer hover:text-[#1b3a57]">
                  <Icon name="attach_file" size={13} />
                  Adjuntar archivo
                  <input
                    type="file"
                    hidden
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) handleFileUpload(c.id, f)
                    }}
                  />
                </label>
                {(archivos[c.id] ?? []).length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {archivos[c.id].map(docId => (
                      <p key={docId} className="text-[10px] text-[#3b6d11] flex items-center gap-1">
                        <Icon name="check" size={10} />
                        Archivo adjuntado
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}
