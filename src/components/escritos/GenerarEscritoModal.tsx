import { useEffect, useState } from 'react'
import type { Expediente, EscritoTemplate, DatosEscrito, NivelAutomatizacionEscrito } from '../../types'
import { GRUPOS_ESCRITOS, getEscritosPorGrupo } from '../../data/escritos'
import { getMatriculasPorArea, getMatriculaSugerida, getNombreMatricula } from '../../data/matriculas'
import { getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { useUIStore } from '../../store/ui.store'
import { Modal } from '../ui/Modal'
import { FormField } from '../ui/FormField'
import { Button } from '../ui/Button'
import { EscritoPreview } from './EscritoPreview'

interface Props {
  open: boolean
  onClose: () => void
  exp: Expediente
  onGenerar: (resultado: { titulo: string; cuerpo: string; escrito_id: string }) => void
}

const NIVEL_CONFIG: Record<NivelAutomatizacionEscrito, { label: string; bg: string; text: string }> = {
  AUTOMATICA:        { label: 'Automática',           bg: 'bg-[#dcfce7]', text: 'text-[#15803d]' },
  ASISTIDA_DATO:      { label: 'Asistida por dato',    bg: 'bg-[#dbeafe]', text: 'text-[#1b3a57]' },
  ASISTIDA_CRITERIO:  { label: 'Asistida por criterio', bg: 'bg-[#fef3c7]', text: 'text-[#d97706]' },
}

function NivelBadge({ nivel }: { nivel: NivelAutomatizacionEscrito }) {
  const cfg = NIVEL_CONFIG[nivel]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function blankDatos(exp: Expediente): DatosEscrito {
  return {
    matricula_id: '',
    firmante_id: '',
    caracter: 'APODERADO',
    representado: 'ESTADO_NACIONAL',
    cuil_firmante: '',
    causa: exp.numero_causa ?? null,
    juzgado: exp.juzgado ?? '',
    secretaria: '',
    variables: {},
  }
}

export function GenerarEscritoModal({ open, onClose, exp, onGenerar }: Props) {
  const { usuarioActivo } = useUIStore()
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1)
  const [grupoSel, setGrupoSel] = useState<string | null>(null)
  const [escritoSel, setEscritoSel] = useState<EscritoTemplate | null>(null)
  const [datos, setDatos] = useState<DatosEscrito>(() => blankDatos(exp))

  useEffect(() => {
    if (!open) return
    setPaso(1)
    setGrupoSel(null)
    setEscritoSel(null)
    const base = blankDatos(exp)
    if (usuarioActivo) {
      const sugerida = getMatriculaSugerida(usuarioActivo.id, exp.area)
      if (sugerida) {
        base.matricula_id = sugerida.id
        base.firmante_id = sugerida.abogado_id
      }
      if (usuarioActivo.cuil) base.cuil_firmante = usuarioActivo.cuil
    }
    setDatos(base)
  }, [open, exp, usuarioActivo])

  if (!open) return null

  const esPenal = exp.area === 'PENAL'
  const matriculasArea = getMatriculasPorArea(exp.area)
  const sugerida = usuarioActivo ? getMatriculaSugerida(usuarioActivo.id, exp.area) : null
  const otrasMatriculas = matriculasArea.filter(m => m.id !== sugerida?.id)

  const faltaMatricula = matriculasArea.length > 0 && !datos.matricula_id
  const faltanVariablesRequeridas = faltaMatricula || !!escritoSel?.variables.some(
    v => v.requerido && !datos.variables[v.id]?.trim()
  )

  function handleSeleccionarMatricula(matriculaId: string) {
    const m = matriculasArea.find(mm => mm.id === matriculaId)
    setDatos(d => ({ ...d, matricula_id: matriculaId, firmante_id: m?.abogado_id ?? '' }))
  }

  function handleVariable(id: string, valor: string) {
    setDatos(d => ({ ...d, variables: { ...d.variables, [id]: valor } }))
  }

  function handleSeleccionarInterviniente(varId: string, esDestinatarioCedula: boolean | undefined, intervinienteId: string) {
    if (intervinienteId === '__OTRO__') {
      handleVariable(varId, '')
      return
    }
    const interviniente = exp.intervinientes.find(i => i.id === intervinienteId)
    if (!interviniente) return
    handleVariable(varId, interviniente.nombre)
    if (esDestinatarioCedula && escritoSel?.variables.some(v => v.id === 'dni')) {
      handleVariable('dni', interviniente.numero_documento)
    }
  }

  const titulo =
    paso === 1 ? 'Generar Escrito — Grupo' :
    paso === 2 ? 'Generar Escrito — Título' :
    paso === 3 ? 'Generar Escrito — Datos' :
    'Generar Escrito — Vista previa'

  return (
    <Modal
      open={open}
      onClose={onClose}
      titulo={titulo}
      size="xl"
      footer={paso === 4 ? undefined : (
        <>
          {paso > 1 && paso < 4 && (
            <Button variant="secondary" onClick={() => setPaso(p => (p - 1) as 1 | 2 | 3)}>
              Atrás
            </Button>
          )}
          {paso === 3 && (
            <Button variant="primary" disabled={faltanVariablesRequeridas} onClick={() => setPaso(4)}>
              Siguiente
            </Button>
          )}
        </>
      )}
    >
      {paso === 1 && (
        <div className="grid grid-cols-3 gap-3">
          {GRUPOS_ESCRITOS.map(grupo => (
            <button
              key={grupo}
              type="button"
              onClick={() => { setGrupoSel(grupo); setPaso(2) }}
              className="p-4 rounded-xl border border-[rgba(0,0,0,0.1)] text-left text-sm font-semibold text-[#1b3a57] hover:bg-[rgba(27,58,87,0.05)] hover:border-[#4a9ab5] transition-colors"
            >
              {grupo}
            </button>
          ))}
        </div>
      )}

      {paso === 2 && grupoSel && (
        esPenal ? (
          <div className="p-6 text-center text-sm text-[#4a6a84] bg-[#f5f5f5] rounded-xl">
            Catálogo de escritos Penal — próximamente
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {getEscritosPorGrupo(grupoSel, exp.area as 'CIVIL' | 'LABORAL').map(escrito => (
              <button
                key={escrito.id}
                type="button"
                onClick={() => { setEscritoSel(escrito); setPaso(3) }}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[rgba(0,0,0,0.1)] text-left hover:bg-[rgba(27,58,87,0.05)] hover:border-[#4a9ab5] transition-colors"
              >
                <span className="text-sm text-[#1b3a57]">{escrito.titulo}</span>
                <NivelBadge nivel={escrito.nivel} />
              </button>
            ))}
            {getEscritosPorGrupo(grupoSel, exp.area as 'CIVIL' | 'LABORAL').length === 0 && (
              <p className="text-sm text-[#4a6a84]">No hay escritos para este grupo en el fuero del expediente.</p>
            )}
          </div>
        )
      )}

      {paso === 3 && escritoSel && (
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Firmante / Matrícula" full required>
            {matriculasArea.length === 0 ? (
              <p className="text-xs text-[#b91c1c]">
                No hay matrículas cargadas para esta área. Cargarlas en Configuración → Personal.
              </p>
            ) : (
              <select
                value={datos.matricula_id}
                onChange={e => handleSeleccionarMatricula(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg bg-white text-[#1b3a57] focus:outline-none focus:border-[#1b3a57]"
              >
                <option value="">Seleccionar...</option>
                {sugerida && (
                  <optgroup label="Sugerida">
                    <option value={sugerida.id}>
                      {getNombreMatricula(sugerida, getUsuarioById(sugerida.abogado_id) ? getNombreCompleto(getUsuarioById(sugerida.abogado_id)!) : sugerida.abogado_id)}
                    </option>
                  </optgroup>
                )}
                <optgroup label="Otras matrículas del área">
                  {otrasMatriculas.map(m => (
                    <option key={m.id} value={m.id}>
                      {getNombreMatricula(m, getUsuarioById(m.abogado_id) ? getNombreCompleto(getUsuarioById(m.abogado_id)!) : m.abogado_id)}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
          </FormField>

          <FormField label="Carácter">
            <div className="flex flex-col gap-1.5">
              {([
                ['APODERADO', 'Apoderado/a'],
                ['PATROCINANTE', 'Patrocinante'],
                ['DERECHO_PROPIO', 'Por derecho propio'],
              ] as const).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm text-[#1b3a57]">
                  <input
                    type="radio"
                    name="caracter"
                    checked={datos.caracter === value}
                    onChange={() => setDatos(d => ({ ...d, caracter: value }))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Representado">
            <div className="flex flex-col gap-1.5">
              {([
                ['ESTADO_NACIONAL', 'Estado Nacional'],
                ['SOFSE', 'SOFSE'],
              ] as const).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm text-[#1b3a57]">
                  <input
                    type="radio"
                    name="representado"
                    checked={datos.representado === value}
                    onChange={() => setDatos(d => ({ ...d, representado: value }))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Carátula">
            <input readOnly value={exp.caratula} className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.1)] rounded-lg bg-[#f5f5f5] text-[#4a6a84]" />
          </FormField>

          <FormField label="N° Expediente">
            <input readOnly value={exp.numero_ee_gde} className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.1)] rounded-lg bg-[#f5f5f5] text-[#4a6a84]" />
          </FormField>

          <FormField label="Juzgado">
            <input
              value={datos.juzgado ?? ''}
              onChange={e => setDatos(d => ({ ...d, juzgado: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg focus:outline-none focus:border-[#1b3a57]"
            />
          </FormField>

          <FormField label="Secretaría" hint="Opcional">
            <input
              value={datos.secretaria ?? ''}
              onChange={e => setDatos(d => ({ ...d, secretaria: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg focus:outline-none focus:border-[#1b3a57]"
            />
          </FormField>

          {escritoSel.variables.map(v => (
            <FormField key={v.id} label={v.label} required={v.requerido} full={v.tipo === 'textarea'}>
              {v.tipo === 'interviniente' ? (
                <div className="flex flex-col gap-2">
                  <select
                    onChange={e => handleSeleccionarInterviniente(v.id, v.esDestinatarioCedula, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg bg-white text-[#1b3a57] focus:outline-none focus:border-[#1b3a57]"
                  >
                    <option value="">Seleccionar interviniente...</option>
                    {exp.intervinientes.map(i => (
                      <option key={i.id} value={i.id}>{i.nombre} — {i.rol_procesal}</option>
                    ))}
                    <option value="__OTRO__">Otro (especificar)</option>
                  </select>
                  <input
                    placeholder="Nombre"
                    value={datos.variables[v.id] ?? ''}
                    onChange={e => handleVariable(v.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg focus:outline-none focus:border-[#1b3a57]"
                  />
                </div>
              ) : v.tipo === 'select' ? (
                <select
                  value={datos.variables[v.id] ?? ''}
                  onChange={e => handleVariable(v.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg bg-white text-[#1b3a57] focus:outline-none focus:border-[#1b3a57]"
                >
                  <option value="">Seleccionar...</option>
                  {v.opciones?.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              ) : v.tipo === 'textarea' ? (
                <textarea
                  value={datos.variables[v.id] ?? ''}
                  onChange={e => handleVariable(v.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg focus:outline-none focus:border-[#1b3a57]"
                  rows={3}
                />
              ) : v.tipo === 'date' ? (
                <input
                  type="date"
                  value={datos.variables[v.id] ?? ''}
                  onChange={e => handleVariable(v.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg focus:outline-none focus:border-[#1b3a57]"
                />
              ) : (
                <input
                  value={datos.variables[v.id] ?? ''}
                  onChange={e => handleVariable(v.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg focus:outline-none focus:border-[#1b3a57]"
                />
              )}
            </FormField>
          ))}
        </div>
      )}

      {paso === 4 && escritoSel && (
        <EscritoPreview
          exp={exp}
          template={escritoSel}
          datos={datos}
          onAtras={() => setPaso(3)}
          onGenerar={onGenerar}
        />
      )}
    </Modal>
  )
}
