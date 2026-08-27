import type { Expediente, Interviniente, Documento, Usuario } from '../types'

export type TipoResultado = 'actuacion' | 'interviniente' | 'documento' | 'usuario'

export interface ResultadoBusqueda {
  tipo: TipoResultado
  id: string
  // dueño del interviniente/documento
  expediente_id?: string
  payload:
    | { tipo: 'actuacion'; exp: Expediente }
    | { tipo: 'interviniente'; int: Interviniente; expediente_id: string; numero_expediente: string }
    | { tipo: 'documento'; doc: Documento; expediente_id: string; numero_expediente: string }
    | { tipo: 'usuario'; user: Usuario }
}

function norm(s: string | null | undefined) {
  return (s ?? '').toLowerCase()
}

export function buscarGlobal(
  query: string,
  expedientes: Expediente[],
  usuarios: Usuario[]
): Record<TipoResultado, ResultadoBusqueda[]> {
  const q = norm(query)
  if (!q.trim()) {
    return { actuacion: [], interviniente: [], documento: [], usuario: [] }
  }

  const actuacion: ResultadoBusqueda[] = expedientes
    .filter(e =>
      norm(e.id).includes(q) ||
      norm(e.caratula).includes(q) ||
      norm(e.numero_causa).includes(q) ||
      norm(String(e.campos_mesa?.numero_ee_gde ?? '')).includes(q) ||
      norm(e.tipo).includes(q)
    )
    .map(exp => ({
      tipo: 'actuacion' as const,
      id: exp.id,
      payload: { tipo: 'actuacion' as const, exp },
    }))

  const interviniente: ResultadoBusqueda[] = []
  const documento: ResultadoBusqueda[] = []

  expedientes.forEach(exp => {
    exp.intervinientes.forEach(int => {
      if (norm(int.nombre).includes(q) || norm(int.numero_documento).includes(q)) {
        interviniente.push({
          tipo: 'interviniente',
          id: int.id,
          expediente_id: exp.id,
          payload: {
            tipo: 'interviniente',
            int,
            expediente_id: exp.id,
            numero_expediente: exp.id,
          },
        })
      }
    })
    exp.documentos.forEach(doc => {
      if (norm(doc.nombre).includes(q) || norm(doc.tipo).includes(q)) {
        documento.push({
          tipo: 'documento',
          id: doc.id,
          expediente_id: exp.id,
          payload: {
            tipo: 'documento',
            doc,
            expediente_id: exp.id,
            numero_expediente: exp.id,
          },
        })
      }
    })
  })

  const usuario: ResultadoBusqueda[] = usuarios
    .filter(u =>
      (u.activo ?? true) && (
        norm(`${u.apellido} ${u.nombre}`).includes(q) ||
        norm(u.cuil).includes(q)
      )
    )
    .map(u => ({
      tipo: 'usuario' as const,
      id: u.id,
      payload: { tipo: 'usuario' as const, user: u },
    }))

  return { actuacion, interviniente, documento, usuario }
}
