import { USUARIOS, getNombreCompleto } from '../data/usuarios'
import { PERSONAS_POR_AREA } from '../store/tareas.store'
import type { Usuario, Area } from '../types'

export type GrupoAsig = 'CIVIL' | 'LABORAL' | 'PENAL' | 'RRHH' | 'COMERCIAL' | 'SEGUROS' | ''

export const BLANK_SOLICITUD = {
  titulo:              '',
  descripcion:         '',
  grupoAsig:           '' as GrupoAsig,
  asignado_a:          '',
  persona_contacto_id: '',
  persona_contacto:    '',
  area_destinataria:   '' as 'RRHH' | 'COMERCIAL' | 'SEGUROS' | '',
  prioridad:           'media' as 'alta' | 'media' | 'baja',
  fecha_limite:        '',
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

      {/* Asignar a — selector en dos pasos */}
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
              asignado_a:          '',
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

        {form.grupoAsig && (
          <select
            className="field-input w-full"
            value={
              ['CIVIL', 'LABORAL', 'PENAL'].includes(form.grupoAsig)
                ? form.asignado_a
                : form.persona_contacto_id
            }
            onChange={e => {
              const val  = e.target.value
              const esInt = ['CIVIL', 'LABORAL', 'PENAL'].includes(form.grupoAsig)
              if (esInt) {
                setForm(p => ({ ...p, asignado_a: val }))
              } else {
                const persona = PERSONAS_POR_AREA.find(p => p.id === val)
                setForm(p => ({
                  ...p,
                  persona_contacto_id: val,
                  persona_contacto:    persona?.nombre ?? '',
                }))
              }
            }}
          >
            <option value="">Seleccioná una persona...</option>
            {getPersonasGrupo(form.grupoAsig).map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        )}
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
          onChange={e => setForm(p => ({ ...p, fecha_limite: e.target.value }))}
        />
      </div>
    </div>
  )
}
