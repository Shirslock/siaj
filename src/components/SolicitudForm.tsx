import { USUARIOS, getNombreCompleto } from '../data/usuarios'
import { PERSONAS_POR_AREA } from '../store/tareas.store'
import type { Usuario, Area } from '../types'

export type GrupoAsig = 'CIVIL' | 'LABORAL' | 'PENAL' | 'RRHH' | 'COMERCIAL' | 'SEGUROS' | ''

export const BLANK_SOLICITUD = {
  titulo:              '',
  descripcion:         '',
  grupoAsig:           '' as GrupoAsig,
  asignado_a:          [] as string[],
  persona_contacto_id: '',
  persona_contacto:    '',
  area_destinataria:   '' as 'RRHH' | 'COMERCIAL' | 'SEGUROS' | '',
  prioridad:           'media' as 'alta' | 'media' | 'baja',
  fecha_limite:        '',
  mostrar_en_agenda:   false,
}

interface Props {
  form:          typeof BLANK_SOLICITUD
  setForm:       (fn: (p: typeof BLANK_SOLICITUD) => typeof BLANK_SOLICITUD) => void
  usuarioActivo: Usuario | null
}

export function SolicitudForm({ form, setForm, usuarioActivo }: Props) {

  function getPersonasGrupo(g: GrupoAsig) {
    if (!g) return []
    if (['CIVIL', 'LABORAL', 'PENAL'].includes(g)) {
      return USUARIOS
        .filter(u =>
          (u.rolSistema === 'ABOGADO' || u.rolSistema === 'COORDINADOR') &&
          u.areas.includes(g as Area)
        )
        .map(u => ({
          id:     u.id,
          nombre: getNombreCompleto(u) + (u.id === usuarioActivo?.id ? ' (yo)' : ''),
        }))
    }
    return PERSONAS_POR_AREA
      .filter(p => p.area === g)
      .map(p => ({ id: p.id, nombre: p.nombre }))
  }

  return (
    <div className="space-y-3">

      {/* Título */}
      <div>
        <label className="field-label">Título <span className="text-[#b91c1c]">*</span></label>
        <input
          type="text"
          className="field-input w-full"
          placeholder="Ej: Solicitar legajo a RRHH"
          autoFocus
          value={form.titulo}
          onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="field-label">Descripción</label>
        <textarea
          className="field-input w-full resize-none"
          style={{ minHeight: 64 }}
          placeholder="Detallá el pedido..."
          value={form.descripcion}
          onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
        />
      </div>

      {/* Asignar a — selector en dos pasos con multiselect */}
      <div>
        <label className="field-label">Asignar a</label>
        <select
          className="field-input w-full mb-2"
          value={form.grupoAsig}
          onChange={e => {
            const g = e.target.value as GrupoAsig
            const esExt = ['RRHH', 'COMERCIAL', 'SEGUROS'].includes(g)
            setForm(p => ({
              ...p,
              grupoAsig:           g,
              asignado_a:          [],
              persona_contacto_id: '',
              persona_contacto:    '',
              area_destinataria:   esExt ? g as 'RRHH' | 'COMERCIAL' | 'SEGUROS' : '',
            }))
          }}
        >
          <option value="">Sin asignar</option>
          <optgroup label="Interno SIAJ">
            <option value="CIVIL">Civil</option>
            <option value="LABORAL">Laboral</option>
            <option value="PENAL">Penal</option>
          </optgroup>
          <optgroup label="Externo SIAJ">
            <option value="RRHH">RRHH</option>
            <option value="COMERCIAL">Comercial</option>
            <option value="SEGUROS">Seguros</option>
          </optgroup>
        </select>

        {form.grupoAsig && (() => {
          const personas = getPersonasGrupo(form.grupoAsig)
          const esInt    = ['CIVIL', 'LABORAL', 'PENAL'].includes(form.grupoAsig)
          return (
            <div className="space-y-1.5">
              {personas.map(persona => {
                const seleccionado = form.asignado_a.includes(persona.id)
                return (
                  <label
                    key={persona.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                      seleccionado
                        ? 'bg-[rgba(196,223,232,0.30)] border-[#4a9ab5]'
                        : 'border-[rgba(0,0,0,0.10)] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-[#1b3a57]"
                      checked={seleccionado}
                      onChange={() => {
                        if (esInt) {
                          setForm(p => ({
                            ...p,
                            asignado_a: seleccionado
                              ? p.asignado_a.filter(id => id !== persona.id)
                              : [...p.asignado_a, persona.id],
                          }))
                        } else {
                          setForm(p => ({
                            ...p,
                            asignado_a: seleccionado
                              ? p.asignado_a.filter(id => id !== persona.id)
                              : [...p.asignado_a, persona.id],
                          }))
                        }
                      }}
                    />
                    <span className="text-sm text-[#1b3a57]">{persona.nombre}</span>
                  </label>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* Prioridad */}
      <div>
        <label className="field-label">Prioridad</label>
        <div className="flex gap-1">
          {(['alta', 'media', 'baja'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, prioridad: p }))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                form.prioridad === p
                  ? p === 'alta'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : p === 'media'
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-white border-[rgba(0,0,0,0.12)] text-[#4a6a84]'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Fecha límite */}
      <div>
        <label className="field-label">Fecha límite (opcional)</label>
        <input
          type="date"
          className="field-input w-full"
          value={form.fecha_limite}
          onChange={e => setForm(p => ({ ...p, fecha_limite: e.target.value, mostrar_en_agenda: false }))}
        />
      </div>

      {/* Switch agenda — solo si hay fecha límite */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          onClick={() => setForm(p => ({ ...p, mostrar_en_agenda: !p.mostrar_en_agenda }))}
          className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-1 ${
            form.mostrar_en_agenda ? 'bg-[#1b3a57]' : 'bg-[#e8e8e8]'
          }`}
        >
          <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
            form.mostrar_en_agenda ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </div>
        <div>
          <p className="text-sm font-medium text-[#1b3a57]">Mostrar en agenda</p>
          <p className="text-[11px] text-[#4a6a84]">Aparecerá en el calendario en la fecha límite</p>
        </div>
      </label>
    </div>
  )
}
