import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { usePjnStore } from '../../store/pjn.store'
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { RUTAS } from '../../utils/routing'
import { formatFecha } from '../../utils/format'
import { esNovedadVencida, diasDesdeDeteccion } from '../../utils/pjnVencimiento'
import { ROLES_INTERVINIENTE, TIPOS_DOC_INTERVINIENTE } from '../../data/catalogos'
import { AgregarIntervinienteModal } from '../expedientes/AgregarIntervinienteModal'
import { Button } from '../ui/Button'
import Icon from '../ui/Icon'
import type { CatalogoItem, Interviniente, IntervinientePjnCrudo, NovedadPJN } from '../../types'

interface Props {
  novedad: NovedadPJN
  mostrarActuacion?: boolean
  selMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
}

// placeholder — reemplazar por el dominio real del PJN cuando se defina
const PJN_BASE_URL = 'https://scw.pjn.gov.ar'

// Matchea texto crudo del PJN (case-insensitive) contra el label de un catálogo SIAJ —
// solo para pre-seleccionar en el modal de alta; si no hay match, el modal cae al default.
function matchCatalogId(items: CatalogoItem[], textoCrudo?: string): string | undefined {
  if (!textoCrudo) return undefined
  const norm = textoCrudo.trim().toUpperCase()
  return items.find(i => i.label.toUpperCase() === norm)?.id
}

function valoresDesdeIntervinientePjn(p: IntervinientePjnCrudo): Partial<Omit<Interviniente, 'id'>> {
  const rol = matchCatalogId(ROLES_INTERVINIENTE, p.rol)
  const tipoDoc = matchCatalogId(TIPOS_DOC_INTERVINIENTE, p.tipo_documento)
  return {
    nombre: p.nombre,
    ...(rol ? { rol_procesal: rol } : {}),
    ...(tipoDoc ? { tipo_documento: tipoDoc } : {}),
    numero_documento: p.numero_documento ?? '',
    contacto_domicilio: p.domicilio,
    representado_por: p.representado_por,
  }
}

export function NovedadPjnCard({ novedad, mostrarActuacion = false, selMode = false, selected = false, onToggleSelect }: Props) {
  const navigate = useNavigate()
  const { usuarioActivo } = useUIStore()
  const { aplicarNovedad, descartarNovedad } = usePjnStore()
  const exp = useExpedientesStore(s => s.expedientes.find(e => e.id === novedad.expediente_id))
  const [texto, setTexto] = useState(novedad.detalle)
  const [intervinienteAAgregar, setIntervinienteAAgregar] = useState<IntervinientePjnCrudo | null>(null)

  const pendiente = novedad.estado === 'pendiente'
  const vencida = esNovedadVencida(novedad)

  const metadata = [
    novedad.oficina ? `Oficina: ${novedad.oficina}` : null,
    novedad.foja ? `Fs. ${novedad.foja}` : null,
  ].filter(Boolean).join(' · ')

  function handleAplicar() {
    if (!usuarioActivo) return
    aplicarNovedad(novedad.id, usuarioActivo.id, texto)
    toast.success('Novedad aplicada — se agregó al timeline de la actuación.')
  }

  function handleDescartar() {
    if (!usuarioActivo) return
    descartarNovedad(novedad.id, usuarioActivo.id)
    toast.info('Novedad descartada.')
  }

  return (
    <div className={`rounded-lg border bg-white p-4 ${
      selMode && pendiente && selected ? 'border-blue-700 ring-1 ring-blue-700' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2.5 min-w-0">
          {selMode && pendiente && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect?.(novedad.id)}
              className="mt-1.5 w-4 h-4 flex-shrink-0 accent-blue-700"
            />
          )}
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Icon name="description" size={16} className="text-blue-700" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                {novedad.tipo}
              </p>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                novedad.origen_organismo === 'MEV'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-blue-50 text-blue-700'
              }`}>
                <Icon name={novedad.origen_organismo === 'MEV' ? 'inbox' : 'refresh'} size={9} />
                {novedad.origen_organismo}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800">{novedad.detalle}</p>
            {metadata && (
              <p className="text-xs text-gray-400 mt-0.5">{metadata}</p>
            )}
            {mostrarActuacion && exp && (
              <button
                onClick={() => navigate(RUTAS.EXPEDIENTE(exp.id))}
                className="text-xs font-mono text-gray-500 hover:text-gray-800 hover:underline mt-0.5"
              >
                {exp.id} — {exp.caratula}
              </button>
            )}
          </div>
        </div>

        {!pendiente && (
          <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            novedad.estado === 'aplicada'
              ? 'bg-green-100 text-green-700 border border-green-200/60'
              : 'bg-gray-200 text-gray-500 border border-gray-200'
          }`}>
            {novedad.estado === 'aplicada' ? 'Aplicada' : 'Descartada'}
          </span>
        )}
        {vencida && (
          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            Vencida hace {diasDesdeDeteccion(novedad)} días
          </span>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mb-2">
        Movimiento del {formatFecha(novedad.fecha_movimiento)} · detectado el {formatFecha(novedad.fecha_deteccion)}
      </p>

      {novedad.tiene_documento && novedad.documento_url && (
        <a
          href={`${PJN_BASE_URL}${novedad.documento_url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline mb-3"
        >
          <Icon name="open_in_new" size={13} />
          Descargar del PJN
        </a>
      )}

      {novedad.intervinientes_pjn && novedad.intervinientes_pjn.length > 0 && (
        <div className="mb-3 pt-2 border-t border-gray-200 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Intervinientes notificados (PJN)
          </p>
          {novedad.intervinientes_pjn.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{p.nombre}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {[p.rol, p.tipo_documento && p.numero_documento ? `${p.tipo_documento} ${p.numero_documento}` : p.tipo_documento]
                    .filter(Boolean).join(' · ')}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIntervinienteAAgregar(p)}>
                Agregar a Intervinientes
              </Button>
            </div>
          ))}
        </div>
      )}

      {pendiente ? (
        <>
          <textarea
            className="field-input w-full text-sm resize-y mb-3"
            rows={2}
            value={texto}
            onChange={e => setTexto(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={handleDescartar}>
              Descartar
            </Button>
            <Button variant="primary" size="sm" onClick={handleAplicar}>
              Aplicar
            </Button>
          </div>
        </>
      ) : (
        <p className="text-[11px] text-gray-400">
          {novedad.estado === 'aplicada' ? 'Aplicada' : 'Descartada'} el {formatFecha(novedad.fecha_aplicacion!)}
        </p>
      )}

      {exp && intervinienteAAgregar && (
        <AgregarIntervinienteModal
          expedienteId={exp.id}
          open={!!intervinienteAAgregar}
          onClose={() => setIntervinienteAAgregar(null)}
          valoresIniciales={valoresDesdeIntervinientePjn(intervinienteAAgregar)}
        />
      )}
    </div>
  )
}
