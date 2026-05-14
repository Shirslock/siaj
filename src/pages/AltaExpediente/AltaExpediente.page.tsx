import { getCamposFormulario } from '../../data/formularios'
import { TIPOS_GESTION } from '../../data/catalogos'
import { useAltaForm } from './useAltaForm'
import { FormularioDinamico } from '../../components/expedientes/FormularioDinamico'
import { FormField } from '../../components/ui/FormField'
import type { Area, Canal, TipoGestion } from '../../types'

const AREAS: { id: Area; label: string; icon: string }[] = [
  { id: 'CIVIL',   label: 'Civil',   icon: 'balance' },
  { id: 'LABORAL', label: 'Laboral', icon: 'work' },
  { id: 'PENAL',   label: 'Penal',   icon: 'gavel' },
]

const CANALES: { id: Canal; label: string; icon: string }[] = [
  { id: 'EE_GDE',   label: 'EE GDE',   icon: 'description' },
  { id: 'MEMO_GDE', label: 'Memo GDE', icon: 'mail' },
  { id: 'OTROS',    label: 'Otros',    icon: 'alternate_email' },
]

export default function AltaExpedientePage() {
  const {
    area, tipo, canal, camposMesa, errors, causaDuplicada, tipoSeleccionado,
    setArea, setTipo, setCanal, setCampoMesa, submit,
  } = useAltaForm()

  const tiposDisponibles = area
    ? TIPOS_GESTION.filter(t => t.areas.includes(area as Area))
    : []

  const canalesDisponibles: Canal[] = tipoSeleccionado
    ? tipoSeleccionado.canales
    : ['EE_GDE', 'MEMO_GDE', 'OTROS']

  const camposDinamicos = area && tipo
    ? getCamposFormulario(tipo, 'mesa', area)
    : []

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-screen-xl">
      <div className="flex gap-6 items-start">

        {/* Left panel — configuración */}
        <div className="w-72 flex-shrink-0 space-y-4">

          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Área</p>
            <div className="flex flex-col gap-2">
              {AREAS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setArea(a.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    area === a.id
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container border-outline-variant/50 text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
            {errors['area'] && <p className="mt-2 text-xs text-red-600">{errors['area']}</p>}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Tipo de Gestión</p>
            <select
              className="field-input w-full"
              value={tipo}
              onChange={e => setTipo(e.target.value as TipoGestion | '')}
              disabled={!area}
            >
              <option value="">Seleccionar…</option>
              {tiposDisponibles.map(t => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
            {errors['tipo'] && <p className="mt-1 text-xs text-red-600">{errors['tipo']}</p>}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Canal de Ingreso</p>
            <div className="flex flex-col gap-2">
              {CANALES.map(c => {
                const disponible = canalesDisponibles.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => disponible && tipo && setCanal(c.id)}
                    disabled={!disponible || !tipo}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      canal === c.id
                        ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                        : disponible && tipo
                          ? 'bg-surface-container border-outline-variant/50 text-on-surface hover:bg-surface-container-high'
                          : 'bg-surface-container border-outline-variant/30 text-on-surface-variant opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {(area || tipo) && (
            <div className="bg-surface-container rounded-2xl p-4 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Resumen</p>
              {area && (
                <p className="text-sm text-on-surface">
                  <span className="text-on-surface-variant text-xs">Área: </span>{area}
                </p>
              )}
              {tipoSeleccionado && (
                <p className="text-sm text-on-surface">
                  <span className="text-on-surface-variant text-xs">Tipo: </span>{tipoSeleccionado.label}
                </p>
              )}
              {canal && (
                <p className="text-sm text-on-surface">
                  <span className="text-on-surface-variant text-xs">Canal: </span>{canal.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right panel — formulario */}
        <div className="flex-1 space-y-5">

          {!area && (
            <div className="bg-surface-container rounded-2xl p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] block mb-3">folder_open</span>
              <p className="text-sm font-medium">Seleccioná el Área y el Tipo de Gestión para comenzar.</p>
            </div>
          )}

          {area && (
            <>
              {/* BLOQUE 1 — Documentación GDE */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">Documentación GDE</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="N° EE / Memo GDE" required hint="Único campo obligatorio al alta" error={errors['numero_ee_gde']}>
                    <input
                      type="text"
                      className="field-input font-mono"
                      placeholder="Ej: EE-2026-00001-APN-SOFSA"
                      value={(camposMesa['numero_ee_gde'] as string) ?? ''}
                      onChange={e => setCampoMesa('numero_ee_gde', e.target.value)}
                    />
                  </FormField>
                  <FormField label="N° Causa" hint="Opcional. SS = Sin Siniestro">
                    <input
                      type="text"
                      className="field-input font-mono"
                      placeholder="Ej: 12345/2026 o SS"
                      value={(camposMesa['numero_causa'] as string) ?? ''}
                      onChange={e => setCampoMesa('numero_causa', e.target.value)}
                    />
                    {causaDuplicada.length > 0 && (
                      <p className="mt-1 text-xs text-amber-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        Causa existente — {causaDuplicada.length} exp. ya registrado{causaDuplicada.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </FormField>
                </div>
              </div>

              {/* BLOQUE 2 — Datos de recepción */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">Datos de Recepción</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Carátula" full>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Ej: GOMEZ MARIO C/ SOFSA SA S/ DAÑOS Y PERJUICIOS"
                      value={(camposMesa['caratula'] as string) ?? ''}
                      onChange={e => setCampoMesa('caratula', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Fecha de Recepción">
                    <input
                      type="date"
                      className="field-input"
                      value={(camposMesa['fecha_recepcion'] as string) ?? today}
                      onChange={e => setCampoMesa('fecha_recepcion', e.target.value)}
                    />
                  </FormField>
                </div>
              </div>

              {/* BLOQUE 3 — Campos dinámicos del tipo */}
              {tipo && camposDinamicos.length > 0 && (
                <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                    {tipoSeleccionado?.label ?? 'Detalles'}
                  </p>
                  <FormularioDinamico
                    campos={camposDinamicos}
                    valores={camposMesa}
                    onChange={setCampoMesa}
                  />
                </div>
              )}

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                  onClick={() => window.history.back()}
                >
                  Cancelar
                </button>
                <button
                  className="px-6 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-sm"
                  onClick={submit}
                >
                  Registrar Expediente
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
