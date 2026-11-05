import Icon from '../ui/Icon'

export type EstadoPaso = 'done' | 'current' | 'pending' | 'rejected'

export interface PasoStepper {
  key: string
  label: string
  estado: EstadoPaso
  onClick?: () => void
  title?: string
}

interface Props {
  pasos: PasoStepper[]
  /** Mensaje sobre el stepper cuando la actuación todavía no comenzó (PRD letrado §6.2). */
  pendienteDeInicio?: boolean
}

// Stepper de estados del PRD (siaj-design-system.md §8.4 a):
// completado verde con ✓, actual azul con anillo, pendiente gris; conector h-0.5.
export function StepperPRD({ pasos, pendienteDeInicio = false }: Props) {
  if (pasos.length <= 1) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      {pendienteDeInicio && (
        <div className="py-4 text-center">
          <p className="text-sm font-semibold text-gray-700">Actuación pendiente de inicio.</p>
          <p className="text-xs text-gray-400 mt-1">Usá Acciones → Cambiar estado para comenzar.</p>
        </div>
      )}
      <div className="flex items-start overflow-x-auto pb-2">
        {pasos.map((p, i) => {
          const sig = pasos[i + 1]
          const conectorAzul = p.estado === 'done' && !!sig && sig.estado !== 'pending'
          const clickeable = !!p.onClick && p.estado !== 'current'
          return (
            <div key={p.key} className="flex items-start flex-1 last:flex-none min-w-0">
              <div className="flex flex-col items-center shrink-0">
                <button
                  type="button"
                  disabled={!clickeable}
                  onClick={p.onClick}
                  title={clickeable ? (p.title ?? `Ir a ${p.label}`) : undefined}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                    clickeable ? 'cursor-pointer hover:ring-2 hover:ring-blue-200' : 'cursor-default'
                  } ${
                    p.estado === 'done'
                      ? 'bg-green-500 text-white'
                      : p.estado === 'current'
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : p.estado === 'rejected'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {p.estado === 'done'
                    ? <Icon name="check" size={16} />
                    : p.estado === 'rejected'
                      ? <Icon name="close" size={16} />
                      : i + 1}
                </button>
                <p
                  className={`text-[11px] mt-2 text-center w-16 leading-tight ${
                    p.estado === 'current'
                      ? 'text-blue-700 font-semibold'
                      : p.estado === 'done'
                        ? 'text-gray-500'
                        : p.estado === 'rejected'
                          ? 'text-red-700'
                          : 'text-gray-300'
                  }`}
                >
                  {p.label}
                </p>
              </div>
              {sig && (
                <div className={`flex-1 h-0.5 mt-[18px] min-w-4 ${conectorAzul ? 'bg-blue-300' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
