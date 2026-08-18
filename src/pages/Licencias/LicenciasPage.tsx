import { useState, useMemo } from 'react'
import { useUIStore } from '../../store/ui.store'
import { useLicenciasStore, type Licencia, type MotivoLicencia } from '../../store/tareas.store'
import { USUARIOS, getNombreCompleto, getUsuarioById } from '../../data/usuarios'
import { Modal } from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import { formatFecha } from '../../utils/format'
import { toast } from 'react-toastify'
import { ClockIcon } from '@heroicons/react/24/outline'

const HOY = new Date().toISOString().split('T')[0]

const MOTIVOS: { value: MotivoLicencia; label: string }[] = [
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'medica',     label: 'Médica' },
  { value: 'examen',     label: 'Examen' },
  { value: 'otro',       label: 'Otro' },
]

const BLANK = {
  motivo:          '' as MotivoLicencia | '',
  motivo_detalle:  '',
  fecha_inicio:    '',
  fecha_fin:       '',
  reemplazante_id: '',
}

function getEstado(l: Licencia): 'activa' | 'proxima' | 'finalizada' {
  if (l.fecha_fin < HOY)    return 'finalizada'
  if (l.fecha_inicio > HOY) return 'proxima'
  return 'activa'
}

const ESTADO_STYLE = {
  activa:     'bg-green-100 text-green-700',
  proxima:    'bg-blue-100 text-blue-700',
  finalizada: 'bg-[#E3E4E9] text-[#758A93]',
}

function SistemaLicencias({ licencias, esCoord }: { licencias: Licencia[]; esCoord: boolean }) {
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const abogados = USUARIOS.filter(u => u.rolSistema === 'ABOGADO' || u.rolSistema === 'COORDINADOR')

  const filtradas = licencias.filter(l => {
    if (filtroUsuario && l.usuario_id !== filtroUsuario) return false
    if (filtroEstado && getEstado(l) !== filtroEstado) return false
    return true
  })

  return (
    <>
      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-card px-5 py-3 flex items-center gap-3 mb-4">
        <select
          className="field-input flex-1 text-sm"
          value={filtroUsuario}
          onChange={e => setFiltroUsuario(e.target.value)}
        >
          <option value="">{esCoord ? 'Todos los abogados del área' : 'Todos los abogados'}</option>
          {abogados.map(u => (
            <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
          ))}
        </select>
        <select
          className="field-input flex-1 text-sm"
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="proxima">Próxima</option>
          <option value="finalizada">Finalizada</option>
        </select>
        {(filtroUsuario || filtroEstado) && (
          <button
            onClick={() => { setFiltroUsuario(''); setFiltroEstado('') }}
            className="flex items-center gap-1 text-xs text-[#758A93] hover:text-[#242C4F]"
          >
            <Icon name="filter_list_off" size={14} /> Limpiar
          </button>
        )}
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-8 text-center">
          <ClockIcon className="w-9 h-9 text-[#c0c0c0] mx-auto mb-2" />
          <p className="text-sm text-[#758A93]">No hay licencias para mostrar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#E3E4E9]">
                {['Usuario', 'Motivo', 'Desde', 'Hasta', 'Reemplazante', 'Estado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#758A93]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
              {filtradas.map(l => {
                const u      = getUsuarioById(l.usuario_id)
                const reempl = getUsuarioById(l.reemplazante_id)
                const estado = getEstado(l)
                return (
                  <tr key={l.id} className="hover:bg-[#f9fbfc] transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-[#242C4F]">{u ? getNombreCompleto(u) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#758A93] capitalize">
                      {l.motivo === 'otro' ? l.motivo_detalle : MOTIVOS.find(m => m.value === l.motivo)?.label}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#758A93]">{formatFecha(l.fecha_inicio)}</td>
                    <td className="px-4 py-3 text-sm text-[#758A93]">{formatFecha(l.fecha_fin)}</td>
                    <td className="px-4 py-3 text-sm text-[#242C4F]">{reempl ? getNombreCompleto(reempl) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${ESTADO_STYLE[estado]}`}>
                        {estado}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default function LicenciasPage() {
  const { usuarioActivo } = useUIStore()
  const { licencias, agregarLicencia, eliminarLicencia } = useLicenciasStore()

  const [vista, setVista] = useState<'mis_licencias' | 'soy_reemplazante' | 'sistema'>('mis_licencias')

  const [modalNueva, setModalNueva] = useState(false)
  const [modalEliminar, setModalEliminar] = useState<Licencia | null>(null)
  const [form, setForm] = useState(BLANK)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const uid = usuarioActivo?.id ?? ''

  // Mis licencias
  const misLicencias = useMemo(() =>
    licencias.filter(l => l.usuario_id === uid)
      .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio)),
    [licencias, uid]
  )

  // Actuaciones donde soy reemplazante
  const comoReemplazante = useMemo(() =>
    licencias.filter(l => {
      if (l.reemplazante_id !== uid) return false
      return l.fecha_fin >= HOY
    }),
    [licencias, uid]
  )

  // Licencias activas de mi área (para coordinadores/gerentes)
  const esCoord = usuarioActivo?.rolSistema === 'COORDINADOR'
  const esGerente = usuarioActivo?.rolSistema === 'REFERENTE'
  const licenciasArea = useMemo(() => {
    if (!esCoord && !esGerente) return []
    return licencias.filter(l => {
      if (l.fecha_fin < HOY) return false
      const u = getUsuarioById(l.usuario_id)
      if (!u) return false
      if (esCoord) return u.areas.some(a => usuarioActivo?.areas.includes(a))
      return true
    })
  }, [licencias, esCoord, esGerente, usuarioActivo])

  // Abogados disponibles como reemplazante (mismo área, excluyendo yo)
  const posiblesReemplazantes = useMemo(() =>
    USUARIOS.filter(u =>
      u.id !== uid &&
      u.areas.some(a => usuarioActivo?.areas.includes(a)) &&
      (u.rolSistema === 'ABOGADO' || u.rolSistema === 'COORDINADOR')
    ),
    [uid, usuarioActivo]
  )

  // Validación
  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!form.motivo)            e.motivo = 'Seleccioná un motivo.'
    if (form.motivo === 'otro' && !form.motivo_detalle.trim())
                                 e.motivo_detalle = 'Ingresá el motivo.'
    if (!form.fecha_inicio)      e.fecha_inicio = 'Ingresá la fecha de inicio.'
    if (form.fecha_inicio < HOY) e.fecha_inicio = 'La fecha de inicio no puede ser anterior a hoy.'
    if (!form.fecha_fin)         e.fecha_fin = 'Ingresá la fecha de fin.'
    if (form.fecha_fin && form.fecha_inicio && form.fecha_fin < form.fecha_inicio)
                                 e.fecha_fin = 'La fecha de fin no puede ser anterior a la de inicio.'
    if (!form.reemplazante_id)   e.reemplazante_id = 'Designá un reemplazante.'

    // Verificar superposición
    const seSuperpone = licencias.some(l =>
      l.usuario_id === uid &&
      l.fecha_inicio <= (form.fecha_fin || '9999') &&
      l.fecha_fin    >= (form.fecha_inicio || '0000')
    )
    if (seSuperpone) e.fecha_inicio = 'Ya tenés una licencia en ese período.'

    setErrores(e)
    return Object.keys(e).length === 0
  }

  function guardar() {
    if (!validar()) return
    agregarLicencia({
      usuario_id:      uid,
      motivo:          form.motivo as MotivoLicencia,
      motivo_detalle:  form.motivo === 'otro' ? form.motivo_detalle : undefined,
      fecha_inicio:    form.fecha_inicio,
      fecha_fin:       form.fecha_fin,
      reemplazante_id: form.reemplazante_id,
      created_at:      HOY,
    })
    toast.success('Licencia registrada correctamente.')
    setModalNueva(false)
    setForm(BLANK)
    setErrores({})
  }

  function confirmarEliminar() {
    if (!modalEliminar) return
    eliminarLicencia(modalEliminar.id)
    toast.success('Licencia eliminada.')
    setModalEliminar(null)
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline font-extrabold text-3xl text-[#242C4F]">Licencias</h1>
          <p className="text-sm text-[#758A93] mt-1">Gestioná tus ausencias y designá reemplazantes.</p>
        </div>
        <button
          onClick={() => { setForm(BLANK); setErrores({}); setModalNueva(true) }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#256386] text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Icon name="add" size={18} />
          Nueva licencia
        </button>
      </div>

      {/* Toggle vistas */}
      <div className="flex items-center gap-3">
        {(['mis_licencias', 'soy_reemplazante', ...(esCoord || esGerente ? ['sistema' as const] : [])] as const).map(v => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
              vista === v
                ? 'bg-[#256386] text-white'
                : 'bg-white border border-[rgba(0,0,0,0.10)] text-[#758A93] hover:text-[#242C4F]'
            }`}
          >
            {v === 'mis_licencias' ? 'Mis licencias' : v === 'soy_reemplazante' ? 'Como reemplazante' : 'Licencias del sistema'}
          </button>
        ))}
        <p className="text-[11px] text-[#9AA6B2]">
          {vista === 'mis_licencias'
            ? 'Tus licencias registradas'
            : vista === 'soy_reemplazante'
            ? 'Actuaciones de colegas a tu cargo durante su ausencia'
            : esCoord
            ? 'Licencias activas y próximas de tu área'
            : 'Todas las licencias del sistema'}
        </p>
      </div>

      {vista === 'mis_licencias' ? (
        <section>
          {misLicencias.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <ClockIcon className="w-9 h-9 text-[#c0c0c0] mx-auto mb-2" />
              <p className="text-sm text-[#758A93]">No tenés licencias registradas.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#E3E4E9]">
                    {['Motivo', 'Desde', 'Hasta', 'Reemplazante', 'Estado', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#758A93]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                  {misLicencias.map(l => {
                    const estado = getEstado(l)
                    const reempl = getUsuarioById(l.reemplazante_id)
                    const puedeEliminar = l.fecha_inicio >= HOY
                    return (
                      <tr key={l.id} className="hover:bg-[#f9fbfc] transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-[#242C4F] capitalize">
                          {l.motivo === 'otro' ? l.motivo_detalle : MOTIVOS.find(m => m.value === l.motivo)?.label}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#758A93]">{formatFecha(l.fecha_inicio)}</td>
                        <td className="px-4 py-3 text-sm text-[#758A93]">{formatFecha(l.fecha_fin)}</td>
                        <td className="px-4 py-3 text-sm text-[#242C4F]">{reempl ? getNombreCompleto(reempl) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${ESTADO_STYLE[estado]}`}>
                            {estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {puedeEliminar && (
                            <button
                              onClick={() => setModalEliminar(l)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#758A93] hover:bg-red-50 hover:text-red-600 transition-colors ml-auto"
                            >
                              <Icon name="delete" size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : vista === 'soy_reemplazante' ? (
        <section>
          {comoReemplazante.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <ClockIcon className="w-9 h-9 text-[#c0c0c0] mx-auto mb-2" />
              <p className="text-sm text-[#758A93]">No sos reemplazante de ningún colega en este momento.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#E3E4E9]">
                    {['Titular', 'Motivo', 'Desde', 'Hasta', 'Estado'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#758A93]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                  {comoReemplazante.map(l => {
                    const titular = getUsuarioById(l.usuario_id)
                    const estado  = getEstado(l)
                    return (
                      <tr key={l.id} className="hover:bg-[#f9fbfc] transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-[#242C4F]">{titular ? getNombreCompleto(titular) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-[#758A93] capitalize">
                          {l.motivo === 'otro' ? l.motivo_detalle : MOTIVOS.find(m => m.value === l.motivo)?.label}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#758A93]">{formatFecha(l.fecha_inicio)}</td>
                        <td className="px-4 py-3 text-sm text-[#758A93]">{formatFecha(l.fecha_fin)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${ESTADO_STYLE[estado]}`}>
                            {estado}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  <Icon name="info" size={14} />
                  Podés buscar las actuaciones de estos usuarios usando los filtros en el módulo de Actuaciones.
                </p>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section>
          <SistemaLicencias licencias={licenciasArea} esCoord={esCoord} />
        </section>
      )}

      {/* Modal nueva licencia */}
      <Modal
        open={modalNueva}
        onClose={() => setModalNueva(false)}
        titulo="Nueva licencia"
        size="md"
        footer={
          <>
            <button onClick={() => setModalNueva(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9]">
              Cancelar
            </button>
            <button
              onClick={guardar}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold bg-[#256386] text-white hover:opacity-90 transition-opacity"
            >
              <Icon name="save" size={15} />
              Guardar licencia
            </button>
          </>
        }
      >
        <div className="space-y-4">

          {/* Motivo */}
          <div>
            <label className="field-label">Motivo <span className="text-[#C3292F]">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {MOTIVOS.map(m => (
                <label
                  key={m.value}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                    form.motivo === m.value
                      ? 'bg-[rgba(196,223,232,0.30)] border-[#4a9ab5]'
                      : 'border-[rgba(0,0,0,0.10)] hover:bg-[#EEEBE6]'
                  }`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    className="accent-[#256386]"
                    checked={form.motivo === m.value}
                    onChange={() => setForm(p => ({ ...p, motivo: m.value, motivo_detalle: '' }))}
                  />
                  <span className="text-sm text-[#242C4F]">{m.label}</span>
                </label>
              ))}
            </div>
            {errores.motivo && <p className="text-[11px] text-[#C3292F] mt-1">{errores.motivo}</p>}
          </div>

          {/* Detalle si es "otro" */}
          {form.motivo === 'otro' && (
            <div>
              <label className="field-label">Especificá el motivo <span className="text-[#C3292F]">*</span></label>
              <input
                type="text"
                className="field-input w-full"
                placeholder="Ej: Mudanza, trámite personal..."
                value={form.motivo_detalle}
                onChange={e => setForm(p => ({ ...p, motivo_detalle: e.target.value }))}
              />
              {errores.motivo_detalle && <p className="text-[11px] text-[#C3292F] mt-1">{errores.motivo_detalle}</p>}
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Fecha de inicio <span className="text-[#C3292F]">*</span></label>
              <input
                type="date"
                className="field-input w-full"
                min={HOY}
                value={form.fecha_inicio}
                onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value, fecha_fin: '' }))}
              />
              {errores.fecha_inicio && <p className="text-[11px] text-[#C3292F] mt-1">{errores.fecha_inicio}</p>}
            </div>
            <div>
              <label className="field-label">Fecha de fin <span className="text-[#C3292F]">*</span></label>
              <input
                type="date"
                className="field-input w-full"
                min={form.fecha_inicio || HOY}
                value={form.fecha_fin}
                onChange={e => setForm(p => ({ ...p, fecha_fin: e.target.value }))}
              />
              {errores.fecha_fin && <p className="text-[11px] text-[#C3292F] mt-1">{errores.fecha_fin}</p>}
            </div>
          </div>

          {/* Reemplazante */}
          <div>
            <label className="field-label">Reemplazante designado <span className="text-[#C3292F]">*</span></label>
            <select
              className="field-input w-full"
              value={form.reemplazante_id}
              onChange={e => setForm(p => ({ ...p, reemplazante_id: e.target.value }))}
            >
              <option value="">— Seleccioná un colega —</option>
              {posiblesReemplazantes.map(u => (
                <option key={u.id} value={u.id}>{getNombreCompleto(u)}</option>
              ))}
            </select>
            {errores.reemplazante_id && <p className="text-[11px] text-[#C3292F] mt-1">{errores.reemplazante_id}</p>}
            <p className="text-[11px] text-[#9AA6B2] mt-1">
              Este usuario tendrá acceso temporal a tus actuaciones durante el período indicado.
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Icon name="info" size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">
              Tus actuaciones <strong>no se reasignan</strong>. El reemplazante designado podrá operar sobre ellas durante tu ausencia usando los filtros de búsqueda.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal
        open={!!modalEliminar}
        onClose={() => setModalEliminar(null)}
        titulo="Eliminar licencia"
        size="sm"
        footer={
          <>
            <button onClick={() => setModalEliminar(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#758A93] hover:bg-[#E3E4E9]">
              Cancelar
            </button>
            <button
              onClick={confirmarEliminar}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:opacity-90 transition-opacity"
            >
              Eliminar
            </button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Icon name="delete" size={24} className="text-red-600" />
          </div>
          <p className="text-sm text-[#242C4F]">
            ¿Eliminás la licencia del <strong>{modalEliminar ? formatFecha(modalEliminar.fecha_inicio) : ''}</strong> al <strong>{modalEliminar ? formatFecha(modalEliminar.fecha_fin) : ''}</strong>?
          </p>
          <p className="text-xs text-[#758A93] mt-2">El reemplazante perderá el acceso temporal a tus actuaciones.</p>
        </div>
      </Modal>
    </div>
  )
}