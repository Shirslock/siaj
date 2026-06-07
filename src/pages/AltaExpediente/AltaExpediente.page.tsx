import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAltaForm } from './useAltaForm'
import { useUIStore } from '../../store/ui.store'
import { FormularioDinamico } from '../../components/expedientes/FormularioDinamico'
import { FormField } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { USUARIOS, ASIGNACION_PENAL, getAbogadosFifo, getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { LINEAS_FERROVIARIAS, TIPOS_GESTION } from '../../data/catalogos'
import { CAMPOS_COMUNES_MESA, getCamposFormulario } from '../../data/formularios'
import { RUTAS } from '../../utils/routing'
import type { Area, Canal, TipoGestion } from '../../types'
import Icon from '../../components/ui/Icon'

const AREAS: { id: Area; label: string }[] = [
  { id: 'CIVIL',   label: 'Civil' },
  { id: 'LABORAL', label: 'Laboral' },
  { id: 'PENAL',   label: 'Penal' },
]

const CANALES: { id: Canal; label: string }[] = [
  { id: 'EE_GDE',   label: 'EE GDE' },
  { id: 'MEMO_GDE', label: 'Memo GDE' },
  { id: 'OTROS',    label: 'Otros' },
]

const DOC_LABEL: Record<Canal, string> = {
  EE_GDE:   'N° Expediente Electrónico (GDE)',
  MEMO_GDE: 'N° de Memo GDE',
  OTROS:    'Referencia / N° de documento',
}

const DOC_PLACEHOLDER: Record<Canal, string> = {
  EE_GDE:   'EX-2026-XXXXXXX-APN-SACO#SOFSE',
  MEMO_GDE: 'ME-2026-XXXXXXX-APN-SACO#SOFSE',
  OTROS:    'SAE-2026-XXXX / Referencia',
}

const CANAL_INFO: Record<Canal, string> = {
  EE_GDE:   'Canal Externo: el EE fue creado por Mesa de Entradas General o el organismo notificante.',
  MEMO_GDE: 'Canal Interno: el Memo GDE fue generado por otra área de SOFSE (SGSySL, GCO, GAJ).',
  OTROS:    'Canal Otros: Carta Suceso SAE, mails internos u otros documentos no GDE.',
}

function SegmentedSelector<T extends string>({
  options, value, onChange, disabled,
}: {
  options: { id: T; label: string }[]
  value: T | ''
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex rounded-lg bg-[#e8e8e8] p-1 gap-0.5 ${disabled ? 'opacity-60' : ''}`}>
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.id)}
          className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
            value === o.id
              ? 'bg-white shadow-sm font-bold text-[#1b3a57]'
              : 'font-medium text-[#4a6a84] hover:text-[#1b3a57]'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface Props {
  modoAbogadoPenal?: boolean
}

export default function AltaExpedientePage({ modoAbogadoPenal = false }: Props) {
  const navigate = useNavigate()
  const { usuarioActivo } = useUIStore()
  const {
    canal, area, tipo, camposMesa, errors,
    tiposFiltrados, tipoSeleccionado,
    camposComunes, camposTipo, lineaSeleccionada,
    setCanal, setArea, setTipo, setCampoMesa, setLinea, submit, validate,
  } = useAltaForm(modoAbogadoPenal)

  const [letradoId, setLetradoId] = useState<string>('')
  const [abogadoSeleccionado, setAbogadoSeleccionado] = useState<string>('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [modalRevision, setModalRevision] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const abogadosPenales = useMemo(
    () => USUARIOS.filter(u =>
      u.areas.includes('PENAL') &&
      (u.rolSistema === 'ABOGADO' || u.rolSistema === 'COORDINADOR')
    ).sort((a, b) => a.apellido.localeCompare(b.apellido)),
    []
  )

  const rutaVolver = modoAbogadoPenal ? RUTAS.ACTUACIONES : RUTAS.MESA

  function confirmarAlta() {
    setModalRevision(false)
    submit()
  }

  const lineaValue = camposMesa['linea'] as string | undefined
  const abogadoPenalId = lineaValue ? ASIGNACION_PENAL[lineaValue] : undefined
  const abogadoPenal = abogadoPenalId ? getUsuarioById(abogadoPenalId) : undefined

  const abogadosFifo = useMemo(
    () => area && area !== 'PENAL' ? getAbogadosFifo(area as 'CIVIL' | 'LABORAL') : [],
    [area]
  )

  function handleFile(file: File | null) {
    if (!file) { setArchivo(null); return }
    if (file.type !== 'application/pdf') return
    if (file.size > 10 * 1024 * 1024) return
    setArchivo(file)
  }

  const showSections = !!tipo

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <nav className="text-xs text-[#4a6a84] mb-1 flex items-center gap-1">
            <button
              className="hover:text-[#1b3a57] transition-colors"
              onClick={() => navigate(rutaVolver)}
            >
              {modoAbogadoPenal ? 'Actuaciones' : 'Mesa SACO'}
            </button>
            <span>›</span>
            <span className="text-[#1b3a57]">
              {modoAbogadoPenal ? 'Nueva Actuación Penal' : 'Nueva Actuación'}
            </span>
          </nav>
          <h1 className="font-headline font-extrabold text-3xl text-[#1b3a57]">
            {modoAbogadoPenal ? 'Nueva Actuación Penal' : 'Nuevo Ingreso de Expediente'}
          </h1>
          <p className="text-sm text-[#4a6a84] mt-1">
            Completá los datos según el canal y tipo de gestión.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(rutaVolver)}>
          Cancelar
        </Button>
      </div>

      {/* SECCIÓN 1 — Origen y Tipo de Gestión */}
      <div className="bg-white shadow-card rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-7 h-7 rounded-full bg-[#C4DFE8] text-[#1b3a57] text-sm font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <h2 className="font-headline font-bold text-lg text-[#1b3a57]">Origen y Tipo de Gestión</h2>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {/* Col 1 — Canal de Ingreso */}
          <div>
            <p className="field-label">Canal de Ingreso *</p>
            <SegmentedSelector
              options={CANALES}
              value={canal}
              onChange={(c) => setCanal(c)}
            />
          </div>

          {/* Col 2 — N° de documento */}
          <FormField
            label={canal ? DOC_LABEL[canal as Canal] : 'N° de documento'}
            required
            error={errors['numero_ee_gde']}
          >
            <input
              type="text"
              className={`field-input font-mono ${errors['numero_ee_gde'] ? 'border-[#fca5a5] ring-1 ring-error/20' : ''}`}
              placeholder={canal ? DOC_PLACEHOLDER[canal as Canal] : ''}
              value={(camposMesa['numero_ee_gde'] as string) ?? ''}
              onChange={e => setCampoMesa('numero_ee_gde', e.target.value)}
            />
          </FormField>

          {/* Col 1 — Área Jurídica */}
          <div>
            <p className="field-label">Área Jurídica *</p>
            <SegmentedSelector
              options={AREAS}
              value={area}
              onChange={(a) => setArea(a)}
              disabled={modoAbogadoPenal}
            />
          </div>

          {/* Col 2 — Tipo de Gestión */}
          <FormField label="Tipo de Gestión *">
            <select
              className="field-input"
              value={tipo}
              onChange={e => setTipo(e.target.value as TipoGestion | '')}
              disabled={!area}
            >
              <option value="">
                {!area
                  ? '— Seleccioná área primero —'
                  : tiposFiltrados.length === 0
                    ? '— Sin tipos para este canal —'
                    : '— Seleccioná tipo de gestión —'}
              </option>
              {tiposFiltrados.map(t => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Info canal */}
        {canal && (
          <div className="mt-5 bg-[rgba(196,223,232,0.40)] rounded-lg p-3 flex items-start gap-2">
            <Icon name="info" size={18} className="text-[#1b3a57] mt-0.5 shrink-0" />
            <p className="text-sm text-[#4a6a84]">{CANAL_INFO[canal as Canal]}</p>
          </div>
        )}
      </div>

      {showSections && (
        <>
          {/* SECCIÓN ◈ — Datos de Recepción */}
          <div className="bg-white shadow-card rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-[#e8e8e8] text-[#4a6a84] text-sm font-bold flex items-center justify-center shrink-0">
                ◈
              </span>
              <h2 className="font-headline font-bold text-lg text-[#1b3a57]">Datos de Recepción</h2>
            </div>

            <FormularioDinamico
              campos={camposComunes}
              valores={camposMesa}
              onChange={setCampoMesa}
            />
          </div>

          {/* SECCIÓN 2 — Detalles del Expediente */}
          <div className="bg-white shadow-card rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-[#C4DFE8] text-[#1b3a57] text-sm font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h2 className="font-headline font-bold text-lg text-[#1b3a57]">Detalles de la Actuación</h2>
                {tipoSeleccionado && (
                  <p className="text-xs text-[#4a6a84]">{tipoSeleccionado.label}</p>
                )}
              </div>
            </div>

            {camposTipo.length === 0 ? (
              <p className="text-sm text-[#4a6a84] italic">
                Este tipo de gestión no requiere campos adicionales en la apertura.
              </p>
            ) : (
              <FormularioDinamico
                campos={camposTipo}
                valores={camposMesa}
                onChange={setCampoMesa}
              />
            )}
          </div>

          {/* SECCIÓN 3 — Asignación de Letrado */}
          <div className="bg-white shadow-card rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-[#C4DFE8] text-[#1b3a57] text-sm font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="font-headline font-bold text-lg text-[#1b3a57]">Asignación de Letrado</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {modoAbogadoPenal ? (
                  <FormField label="Letrado asignado" required>
                    <select
                      className="field-input w-full"
                      value={abogadoSeleccionado}
                      onChange={e => setAbogadoSeleccionado(e.target.value)}
                    >
                      <option value="">Seleccionar letrado...</option>
                      {abogadosPenales.map(u => (
                        <option key={u.id} value={u.id}>
                          {getNombreCompleto(u)}{u.id === usuarioActivo?.id ? ' (yo)' : ''}
                        </option>
                      ))}
                    </select>
                  </FormField>
                ) : area === 'PENAL' ? (
                  <>
                    <FormField label="Línea Ferroviaria">
                      <select
                        className="field-input"
                        value={lineaSeleccionada}
                        onChange={e => setLinea(e.target.value)}
                      >
                        <option value="">— Seleccioná línea —</option>
                        {LINEAS_FERROVIARIAS.map(l => (
                          <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Letrado Asignado" hint="Se determina por la línea seleccionada">
                      <input
                        type="text"
                        className="field-input bg-[#e8e8e8]"
                        value={abogadoPenal ? getNombreCompleto(abogadoPenal) : ''}
                        placeholder="Seleccioná una línea para asignar letrado"
                        disabled
                        readOnly
                      />
                    </FormField>
                  </>
                ) : (
                  <FormField label="Letrado Asignado" hint="Asignación secuencial FIFO">
                    <select
                      className="field-input"
                      value={letradoId}
                      onChange={e => setLetradoId(e.target.value)}
                    >
                      <option value="">— siguiente en rotación</option>
                      {abogadosFifo.map(u => (
                        <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
                      ))}
                    </select>
                  </FormField>
                )}
              </div>

              <div className="bg-[#e8e8e8] rounded-xl p-4 flex items-start gap-3">
                <Icon name="info" size={24} className="text-[#1b3a57] shrink-0" />
                <p className="text-sm text-[#4a6a84]">
                  {area === 'PENAL'
                    ? 'Asignación por línea ferroviaria — seleccioná la línea para determinar el letrado automáticamente.'
                    : 'Asignación secuencial FIFO — se sugiere el siguiente letrado disponible en el área.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4 — Documento GDE */}
          <div className="bg-white shadow-card rounded-xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-full bg-[#C4DFE8] text-[#1b3a57] text-sm font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <h2 className="font-headline font-bold text-lg text-[#1b3a57]">
                Documento GDE <span className="text-[#b91c1c] text-base">*</span>
              </h2>
            </div>
            <p className="text-sm text-[#4a6a84] mb-5 ml-10">Adjuntá el PDF de la actuación GDE.</p>

            {!archivo ? (
              <div
                className="border-2 border-dashed border-[rgba(0,0,0,0.12)] rounded-xl p-10 text-center bg-[rgba(232,232,232,0.50)] hover:bg-[#e8e8e8] cursor-pointer group transition-all"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f) handleFile(f)
                }}
              >
                <Icon name="upload_file" className="block mb-3" size={40} />
                <p className="text-sm font-medium text-[#4a6a84]">
                  Arrastrá el PDF aquí o hacé click para seleccionar
                </p>
                <p className="text-xs text-[#7a9ab4] mt-1">Solo PDF — máximo 10 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => handleFile(e.target.files?.[0] ?? null)}
                />
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <Icon name="picture_as_pdf" size={24} className="text-green-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">{archivo.name}</p>
                  <p className="text-xs text-green-700">{(archivo.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  className="text-green-700 hover:text-green-900 transition-colors ml-auto"
                  onClick={() => setArchivo(null)}
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
            )}
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => navigate(rutaVolver)}>
              Cancelar
            </Button>
            <Button variant="primary" icon="task_alt" onClick={() => { if (validate()) setModalRevision(true) }}>
              Revisar y Derivar
            </Button>
          </div>
        </>
      )}

      {/* ── MODAL DE REVISIÓN ── */}
      <Modal
        open={modalRevision}
        onClose={() => setModalRevision(false)}
        titulo="Revisión de la actuación"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalRevision(false)}>
              Volver a editar
            </Button>
            <Button variant="primary" onClick={confirmarAlta}>
              Confirmar y Registrar
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#4a6a84] mb-1">Revisá los datos antes de registrar la actuación.</p>
        <p className="text-sm text-[#4a6a84] mb-5">Una vez registrado será asignado automáticamente.</p>

        {/* ── Identificación ── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84] mb-2">Identificación</p>
        <dl className="mb-5">
          {[
            { label: 'Canal',        valor: CANALES.find(c => c.id === canal)?.label ?? '—' },
            { label: 'Área',         valor: AREAS.find(a => a.id === area)?.label ?? '—' },
            { label: 'Tipo',         valor: TIPOS_GESTION.find(t => t.code === tipo)?.label ?? '—' },
            { label: 'N° EE / Memo', valor: (camposMesa['numero_ee_gde'] as string | undefined) || '—', mono: true },
            { label: 'N° Causa',     valor: (camposMesa['numero_causa'] as string | undefined) || '—' },
          ].map(({ label, valor, mono }) => (
            <div key={label} className="flex items-start gap-3 py-2 border-b border-[rgba(0,0,0,0.05)] last:border-0">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#4a6a84] w-36 flex-shrink-0">{label}</dt>
              <dd className={`text-sm font-semibold text-[#1b3a57] flex-1 ${mono ? 'font-mono' : ''}`}>{valor}</dd>
            </div>
          ))}
        </dl>

        <hr className="border-[rgba(0,0,0,0.08)] mb-5" />

        {/* ── Asignación ── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84] mb-2">Asignación</p>
        <dl className="mb-5">
          {area === 'PENAL' ? (
            lineaSeleccionada ? (
              <>
                <div className="flex items-start gap-3 py-2 border-b border-[rgba(0,0,0,0.05)]">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-[#4a6a84] w-36 flex-shrink-0">Línea</dt>
                  <dd className="text-sm font-semibold text-[#1b3a57] flex-1">
                    {LINEAS_FERROVIARIAS.find(l => l.id === lineaSeleccionada)?.label ?? lineaSeleccionada}
                  </dd>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-[#4a6a84] w-36 flex-shrink-0">Letrado</dt>
                  <dd className="text-sm font-semibold text-[#1b3a57] flex-1">
                    {(() => {
                      const ab = getUsuarioById(ASIGNACION_PENAL[lineaSeleccionada])
                      return ab ? getNombreCompleto(ab) : '—'
                    })()}
                  </dd>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Icon name="warning" size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  Línea ferroviaria no seleccionada. El letrado se determinará al completar.
                </p>
              </div>
            )
          ) : (
            <>
              <div className="flex items-start gap-3 py-2 border-b border-[rgba(0,0,0,0.05)]">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-[#4a6a84] w-36 flex-shrink-0">Criterio</dt>
                <dd className="text-sm font-semibold text-[#1b3a57] flex-1">Secuencial FIFO</dd>
              </div>
              <div className="flex items-start gap-3 py-2">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-[#4a6a84] w-36 flex-shrink-0">Letrado sugerido</dt>
                <dd className="text-sm font-semibold text-[#1b3a57] flex-1">
                  {(() => {
                    const fifo = area ? getAbogadosFifo(area as 'CIVIL' | 'LABORAL') : []
                    return fifo[0] ? getNombreCompleto(fifo[0]) : '—'
                  })()}
                </dd>
              </div>
            </>
          )}
        </dl>

        <hr className="border-[rgba(0,0,0,0.08)] mb-5" />

        {/* ── Datos de Recepción ── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84] mb-2">Datos de Recepción</p>
        <dl className="mb-5">
          {CAMPOS_COMUNES_MESA.filter(c => camposMesa[c.id] !== undefined && camposMesa[c.id] !== '').length === 0 ? (
            <p className="text-sm text-[#4a6a84] italic">Sin datos adicionales.</p>
          ) : (
            CAMPOS_COMUNES_MESA
              .filter(c => camposMesa[c.id] !== undefined && camposMesa[c.id] !== '')
              .map(c => (
                <div key={c.id} className="flex items-start gap-3 py-2 border-b border-[rgba(0,0,0,0.05)] last:border-0">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-[#4a6a84] w-36 flex-shrink-0">{c.label}</dt>
                  <dd className="text-sm font-semibold text-[#1b3a57] flex-1">{String(camposMesa[c.id])}</dd>
                </div>
              ))
          )}
        </dl>

        <hr className="border-[rgba(0,0,0,0.08)] mb-5" />

        {/* ── Campos del tipo ── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-[#4a6a84] mb-2">Campos del tipo</p>
        <dl>
          {tipo && getCamposFormulario(tipo, 'mesa', area || undefined)
            .filter(c => camposMesa[c.id] !== undefined && camposMesa[c.id] !== '').length === 0 ? (
            <p className="text-sm text-[#4a6a84] italic">Sin campos adicionales completados.</p>
          ) : (
            tipo && getCamposFormulario(tipo, 'mesa', area || undefined)
              .filter(c => camposMesa[c.id] !== undefined && camposMesa[c.id] !== '')
              .map(c => (
                <div key={c.id} className="flex items-start gap-3 py-2 border-b border-[rgba(0,0,0,0.05)] last:border-0">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-[#4a6a84] w-36 flex-shrink-0">{c.label}</dt>
                  <dd className="text-sm font-semibold text-[#1b3a57] flex-1">{String(camposMesa[c.id])}</dd>
                </div>
              ))
          )}
        </dl>
      </Modal>

    </div>
  )
}
