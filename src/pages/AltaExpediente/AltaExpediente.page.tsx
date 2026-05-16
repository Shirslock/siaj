import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAltaForm } from './useAltaForm'
import { FormularioDinamico } from '../../components/expedientes/FormularioDinamico'
import { FormField } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { ASIGNACION_PENAL, getAbogadosFifo, getUsuarioById, getNombreCompleto } from '../../data/usuarios'
import { LINEAS_FERROVIARIAS } from '../../data/catalogos'
import { RUTAS } from '../../utils/routing'
import type { Area, Canal, TipoGestion } from '../../types'

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

const AREA_BADGE: Record<Area, string> = {
  CIVIL:   'bg-blue-100 text-blue-800',
  LABORAL: 'bg-amber-100 text-amber-800',
  PENAL:   'bg-red-100 text-red-800',
}

function SegmentedSelector<T extends string>({
  options, value, onChange,
}: {
  options: { id: T; label: string }[]
  value: T | ''
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg bg-surface-container p-1 gap-0.5">
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
            value === o.id
              ? 'bg-surface-container-lowest shadow-sm font-bold text-primary'
              : 'font-medium text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function AltaExpedientePage() {
  const navigate = useNavigate()
  const {
    canal, area, tipo, camposMesa, errors,
    tiposFiltrados, tipoSeleccionado, causaDuplicada,
    camposComunes, camposTipo, lineaSeleccionada,
    setCanal, setArea, setTipo, setCampoMesa, setLinea, submit,
  } = useAltaForm()

  const [letradoId, setLetradoId] = useState<string>('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          <nav className="text-xs text-on-surface-variant mb-1 flex items-center gap-1">
            <button
              className="hover:text-on-surface transition-colors"
              onClick={() => navigate(RUTAS.MESA)}
            >
              Mesa SIAJ
            </button>
            <span>›</span>
            <span className="text-on-surface">Nuevo Expediente</span>
          </nav>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface">
            Nuevo Ingreso de Expediente
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Completá los datos según el canal y tipo de gestión.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(RUTAS.MESA)}>
          Cancelar
        </Button>
      </div>

      {/* SECCIÓN 1 — Origen y Tipo de Gestión */}
      <div className="bg-surface-container-lowest shadow-card rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-7 h-7 rounded-full bg-primary-container text-primary text-sm font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <h2 className="font-headline font-bold text-lg text-on-surface">Origen y Tipo de Gestión</h2>
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
              className={`field-input font-mono ${errors['numero_ee_gde'] ? 'border-error ring-1 ring-error/20' : ''}`}
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
          <div className="mt-5 bg-primary-container/40 rounded-lg p-3 flex items-start gap-2">
            <span
              className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              info
            </span>
            <p className="text-sm text-on-surface-variant">{CANAL_INFO[canal as Canal]}</p>
          </div>
        )}
      </div>

      {showSections && (
        <>
          {/* SECCIÓN ◈ — Datos de Recepción */}
          <div className="bg-surface-container-lowest shadow-card rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant text-sm font-bold flex items-center justify-center shrink-0">
                ◈
              </span>
              <h2 className="font-headline font-bold text-lg text-on-surface">Datos de Recepción</h2>
            </div>

            <FormularioDinamico
              campos={camposComunes}
              valores={camposMesa}
              onChange={setCampoMesa}
            />

            {/* N° Causa con detección de duplicados */}
            <div className="mt-4">
              <FormField label="N° Causa" hint="Opcional. SS = Sin Siniestro">
                <input
                  type="text"
                  className="field-input font-mono"
                  placeholder="Ej: 12345/2026 o SS"
                  value={(camposMesa['numero_causa'] as string) ?? ''}
                  onChange={e => setCampoMesa('numero_causa', e.target.value)}
                />
              </FormField>

              {causaDuplicada.length > 0 && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    N° de causa ya registrado — existe al menos un expediente con ese número.
                  </p>
                  <div className="space-y-1.5">
                    {causaDuplicada.map(exp => (
                      <div key={exp.id} className="flex items-center gap-2 text-sm">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${AREA_BADGE[exp.area]}`}>
                          {exp.area}
                        </span>
                        <span className="font-mono text-xs text-on-surface-variant shrink-0">{exp.id}</span>
                        <span className="text-on-surface truncate">{exp.caratula}</span>
                        <button
                          className="ml-auto text-xs text-primary hover:underline shrink-0"
                          onClick={() => navigate(RUTAS.CAUSA(camposMesa['numero_causa'] as string))}
                        >
                          Ver causa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2 — Detalles del Expediente */}
          <div className="bg-surface-container-lowest shadow-card rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-primary-container text-primary text-sm font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h2 className="font-headline font-bold text-lg text-on-surface">Detalles del Expediente</h2>
                {tipoSeleccionado && (
                  <p className="text-xs text-on-surface-variant">{tipoSeleccionado.label}</p>
                )}
              </div>
            </div>

            {camposTipo.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">
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
          <div className="bg-surface-container-lowest shadow-card rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-primary-container text-primary text-sm font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="font-headline font-bold text-lg text-on-surface">Asignación de Letrado</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {area === 'PENAL' ? (
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
                        className="field-input bg-surface-container"
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

              <div className="bg-surface-container rounded-xl p-4 flex items-start gap-3">
                <span
                  className="material-symbols-outlined text-2xl text-primary shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  info
                </span>
                <p className="text-sm text-on-surface-variant">
                  {area === 'PENAL'
                    ? 'Asignación por línea ferroviaria — seleccioná la línea para determinar el letrado automáticamente.'
                    : 'Asignación secuencial FIFO — se sugiere el siguiente letrado disponible en el área.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4 — Documento GDE */}
          <div className="bg-surface-container-lowest shadow-card rounded-xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-full bg-primary-container text-primary text-sm font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <h2 className="font-headline font-bold text-lg text-on-surface">
                Documento GDE <span className="text-error text-base">*</span>
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-5 ml-10">Adjuntá el PDF del expediente GDE.</p>

            {!archivo ? (
              <div
                className="border-2 border-dashed border-outline-variant rounded-xl p-10 text-center bg-surface-container/50 hover:bg-surface-container cursor-pointer group transition-all"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f) handleFile(f)
                }}
              >
                <span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-primary block mb-3 transition-colors">
                  upload_file
                </span>
                <p className="text-sm font-medium text-on-surface-variant">
                  Arrastrá el PDF aquí o hacé click para seleccionar
                </p>
                <p className="text-xs text-outline mt-1">Solo PDF — máximo 10 MB</p>
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
                <span
                  className="material-symbols-outlined text-2xl text-green-700 shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  picture_as_pdf
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">{archivo.name}</p>
                  <p className="text-xs text-green-700">{(archivo.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  className="text-green-700 hover:text-green-900 transition-colors ml-auto"
                  onClick={() => setArchivo(null)}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            )}
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => navigate(RUTAS.MESA)}>
              Cancelar
            </Button>
            <Button variant="primary" icon="task_alt" onClick={submit}>
              Revisar y Derivar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
