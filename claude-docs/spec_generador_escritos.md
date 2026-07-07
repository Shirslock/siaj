# SPEC — Generador de Escritos (SIAJ)

**Rama:** `feat/ux-refinements`
**Requisito origen:** 2.2 / 2.3 / 2.4 (Estandarización, Firmante/Carácter, Tipología y plantillas)
**Punto de entrada:** Modal "Nueva actividad" → tab Presentación (`TimelineTab.tsx` Civil/Laboral, `TimelinePenal.tsx` Penal)
**Etapa actual (Etapa 1):** todo manual/paramétrico. Sin backend, sin AI, sin autocompletado de personería (eso es Etapa 2) y sin sugerencia inteligente (Etapa 3). Lo que SIAJ ya tiene guardado (carátula, expediente, juzgado, secretaría, intervinientes) sí se pre-completa porque no requiere backend nuevo.

---

## 1. Resumen del flujo

1. Abogado/Asistente abre "Nueva actividad" → selecciona **Tipo = Presentación**.
2. Aparece un botón **"Generar Escrito"** debajo del selector de Tipo (solo visible con Tipo=PRESENTACION).
3. Se abre `GenerarEscritoModal` (wizard de 4 pasos):
   - **Paso 1 — Grupo:** 9 grupos estratégicos (cards o lista).
   - **Paso 2 — Título:** lista de títulos de escritos del grupo elegido, filtrados por `fuero` (Civil/Laboral/Ambos) según `exp.area`. Cada ítem muestra un chip de nivel (Automática=verde / Asistida por dato=azul / Asistida por criterio=naranja).
   - **Paso 3 — Datos:** formulario dinámico según el nivel:
     - Bloque fijo siempre presente: **Firmante**, **Matrícula**, **Carácter de representación**, **Datos judiciales** (carátula/expediente/juzgado/secretaría, pre-cargados y editables).
     - Bloque variable: los campos de `variables[]` de la plantilla elegida (vacío si es Automática).
     - Caso **Cédula** (MT-08, MT-09, MT-11, MT-15, MT-22 — cualquier plantilla con variable `DESTINATARIO`): el campo Destinatario/DNI se pre-completa desde `exp.intervinientes` (rol demandado) con opción de cambiarlo manualmente.
   - **Paso 4 — Vista previa:** cuerpo final armado (Encabezado + Personería + Cuerpo con variables reemplazadas + Cierre), editable en un textarea antes de confirmar.
4. Al confirmar, el modal devuelve `{ titulo, cuerpo, escrito_id }` al padre, que:
   - Setea `formAct.titulo = titulo` (exactamente el título del catálogo — regla "una fila = un título").
   - Setea `formAct.descripcion = cuerpo`.
   - Guarda `escrito_id` en la actividad para trazabilidad (nuevo campo opcional).
   - El resto del flujo de "Nueva actividad" sigue igual (fecha, N° GDE, adjunto, movimiento impulsorio si aplica).

El botón "Generar Escrito" es un **asistente de redacción**, no reemplaza los campos existentes: el abogado puede cerrarlo y tipear libremente si prefiere.

---

## 2. Tipos nuevos (`src/types/index.ts`)

Agregar al final, antes de los tipos de formulario:

```ts
export type NivelAutomatizacionEscrito =
  | 'AUTOMATICA'
  | 'ASISTIDA_DATO'
  | 'ASISTIDA_CRITERIO'

export type FueroEscrito = 'CIVIL' | 'LABORAL' | 'AMBOS'

export type TipoCampoVariable =
  | 'text' | 'textarea' | 'date' | 'select' | 'interviniente'

export interface VariableEscrito {
  id: string                 // slug usado en el cuerpo como {{id}}
  label: string
  tipo: TipoCampoVariable
  opciones?: string[]        // para 'select'
  requerido?: boolean
  esDestinatarioCedula?: boolean   // dispara auto-fill desde Intervinientes
}

export interface EscritoTemplate {
  id: string                       // 'MT-01'...'MT-29'
  grupo: string                    // '1. Presentación y personería', etc.
  titulo: string                   // título EXACTO que se escribe en la actividad
  fuero: FueroEscrito
  nivel: NivelAutomatizacionEscrito
  cuerpo: string                   // texto con placeholders {{variable_id}}
  variables: VariableEscrito[]
  linkModelo?: string              // para 'Asistida por criterio' (link a modelo completo)
  observaciones?: string
}

export type CaracterRepresentacion = 'APODERADO' | 'PATROCINANTE' | 'DERECHO_PROPIO'
export type RepresentadoEscrito = 'ESTADO_NACIONAL' | 'SOFSE'

export interface Matricula {
  id: string
  abogado_id: string        // dueño de la matrícula (referencia a Usuario.id)
  area: Area                // a qué área pertenece esta matrícula (CIVIL/LABORAL/PENAL)
  jurisdiccion: string       // 'CABA' | 'PBA' | ...
  tomo: string
  folio: string
}

export interface DatosEscrito {
  matricula_id: string        // fuente de verdad — el firmante se DERIVA de acá
  firmante_id: string         // = matriculas.find(m => m.id === matricula_id)?.abogado_id
  caracter: CaracterRepresentacion
  representado: RepresentadoEscrito
  cuil_firmante: string
  causa: string | null
  juzgado?: string
  secretaria?: string
  variables: Record<string, string>   // valores cargados por variable_id
}
```

Extender `Usuario`:

```ts
export interface Usuario {
  ...
  cuil?: string
}
```

> **Cambio de diseño respecto a la v1 de este spec:** ya no hay un select de "Firmante" independiente del de "Matrícula". La matrícula es la entidad que se elige — cada matrícula pertenece a un abogado y a un área — y el firmante queda determinado automáticamente por `matricula.abogado_id`. Esto refleja el pedido: *"le sugerirá la matrícula de quien esté logueado, pero también podrá seleccionar del listado de otras matrículas del mismo área"*. Un mismo abogado puede tener más de una matrícula (ej. CABA y PBA) → aparece más de una vez en el listado, una fila por matrícula.

Extender `Actividad`:

```ts
export type EstadoEscritoActividad = 'GENERADO' | 'APROBADO_CARGADO'

export interface Actividad {
  ...
  escrito_id?: string                    // referencia al EscritoTemplate usado, si vino del generador
  escrito_estado?: EstadoEscritoActividad // GENERADO = se descargó el .docx y falta la aprobación externa
}
```

`escrito_estado` documenta el circuito real: SIAJ genera el .docx, el letrado lo baja, lo sube a otro sistema para que lo aprueben/firmen, y **recién después** vuelve a subir el archivo aprobado a SIAJ. Por eso la actividad se crea en `GENERADO` sin adjunto, y pasa a `APROBADO_CARGADO` cuando el letrado adjunta el archivo definitivo (reutilizando el flujo de **Reply con adjunto** ya existente — ver sección 6b).

> Nota: `Matricula`/`cuil` en `Usuario` quedan `undefined` para la mayoría de los 32 usuarios mock hasta que Configuración → Personal cargue el dato real. El wizard debe tolerar matrícula vacía (mostrar "Sin matrícula cargada — completar en Configuración") sin romper el flujo.

---

## 3. Catálogo (`src/data/escritos.ts`) — nuevo archivo

Contiene los 29 escritos validados en `ESCRITOS_PARA_AUTOMATIZACION.xlsx` (hoja "Validación de cuerpos"), agrupados en los 9 grupos de negocio. Placeholders del Excel (`[destinatario]`) se normalizan a `{{destinatario}}`.

```ts
import type { EscritoTemplate } from '../types'

export const GRUPOS_ESCRITOS = [
  '1. Presentación y personería',
  '2. Bonos, tasas y copias',
  '3. Notificaciones y cédulas',
  '4. Oficios y averiguación de domicilio',
  '5. Impulso y trámite',
  '6. Prueba',
  '7. Rebeldía',
  '8. Recursos',
  '9. Caducidad',
] as const

export const ESCRITOS: EscritoTemplate[] = [
  {
    id: 'MT-01', grupo: GRUPOS_ESCRITOS[0],
    titulo: 'Se presenta - solicita se vincule',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que conforme lo acredito con la copia simple del poder general para juicios que acompaño, y que declaro vigente en todas sus partes, soy apoderad{o/a} judicial de {{representado}}, con domicilio legal y sede en Av. J. M. Ramos Mejía N° 1302, 4° piso, CABA. Que en el carácter invocado, y a fin de realizar presentaciones y producir la prueba ordenada, vengo a solicitar se vincule mi CUIT {{cuit}} al sistema como letrad{o/a} apoderad{o/a}.',
    variables: [
      { id: 'representado', label: 'Representado', tipo: 'select', opciones: ['Estado Nacional', 'SOFSE'], requerido: true },
      { id: 'cuit', label: 'CUIT', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-02', grupo: GRUPOS_ESCRITOS[0],
    titulo: 'Se presenta - acredita personería (Estado Nacional)',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que en fecha 17 de febrero de 2016 el Ministerio de Transporte dictó la Resolución N° 21, por la cual autorizó a la Gerencia de Asuntos Jurídicos y Legales de la OPERADORA FERROVIARIA SOCIEDAD DEL ESTADO (SOFSE) a asumir la representación del Estado Nacional en las causas relativas a reclamos judiciales derivados del transporte ferroviario de su competencia. En consecuencia, mediante el poder que se adjunta, esta operadora facultó a los abogados allí detallados a presentarse e intervenir en defensa de los intereses del Estado Nacional en todo asunto judicial o extrajudicial, presente o futuro, de cualquier naturaleza, fuero o jurisdicción. Adjunto copia de los actos mencionados para que se tenga por acreditada la personería invocada.',
    variables: [],
    observaciones: 'Acredita personería Res. MT 21/2016. Título distinto de MT-10.',
  },
  {
    id: 'MT-03', grupo: GRUPOS_ESCRITOS[0],
    titulo: 'Autoriza',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que vengo a autorizar a {{personas_autorizadas}} a compulsar el expediente, retirar copias y diligenciar cédulas y oficios, y a realizar las diligencias de mero trámite que correspondan.',
    variables: [{ id: 'personas_autorizadas', label: 'Personas autorizadas', tipo: 'text', requerido: true }],
    observaciones: 'Fórmula pendiente de confirmar con Gerencia.',
  },
  {
    id: 'MT-04', grupo: GRUPOS_ESCRITOS[1],
    titulo: 'Acredita bono genérico y específico',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Por medio del presente, vengo a acompañar bono profesional, conforme el art. 51 inc. d) de la ley 23.187, solicitando sea agregado a sus efectos.',
    variables: [],
    observaciones: "Variante 'con Deox' agrega solicitud de Deox al CPACF (checkbox opcional a futuro).",
  },
  {
    id: 'MT-05', grupo: GRUPOS_ESCRITOS[1],
    titulo: 'Solicita eximir copias',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que habiendo advertido que el traslado de la demanda fue ordenado sin eximición de copias, vengo a solicitar se exima de las mismas, atento que tanto la demanda como su documental se encuentran digitalizadas.',
    variables: [],
  },
  {
    id: 'MT-06', grupo: GRUPOS_ESCRITOS[1],
    titulo: 'Solicita eximir sellado',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Por medio de la presente, vengo a solicitar a V.S. se exima de la colocación del Sello Medalla en las cédulas de notificación a librarse en autos.',
    variables: [],
  },
  {
    id: 'MT-07', grupo: GRUPOS_ESCRITOS[1],
    titulo: 'Solicita eximir copias y sellado (ambas)',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que vengo a solicitar a V.S.: (i) se exima de acompañar copias, atento que la demanda y su documental se encuentran digitalizadas; y (ii) se exima de la colocación del Sello Medalla en las cédulas de notificación a librarse en autos.',
    variables: [],
  },
  {
    id: 'MT-08', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Solicita nueva cédula con habilitación de días y horas',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que por medio de la presente vengo a acompañar cédula de notificación enviada a {{destinatario}}, DNI N° {{dni}}, cuyo resultado fue negativo, toda vez que el oficial notificador ha informado {{motivo}}. Que, en virtud de lo manifestado, vengo a solicitar a V.S. ordene librar una nueva cédula con habilitación de días y horas inhábiles.',
    variables: [
      { id: 'destinatario', label: 'Destinatario', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true },
      { id: 'dni', label: 'DNI', tipo: 'text', requerido: true },
      { id: 'motivo', label: 'Motivo del resultado negativo', tipo: 'textarea', requerido: true },
    ],
  },
  {
    id: 'MT-09', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Solicita bajo responsabilidad de la parte',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que vengo a solicitar se libre {{tipo_documento}} dirigida a {{destinatario}}, al domicilio denunciado, bajo responsabilidad de esta parte.',
    variables: [
      { id: 'tipo_documento', label: 'Tipo de documento', tipo: 'select', opciones: ['cédula', 'oficio'], requerido: true },
      { id: 'destinatario', label: 'Destinatario', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true },
    ],
  },
  {
    id: 'MT-10', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Se acompaña para confronte',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Se acompaña {{documento}} para su confronte.',
    variables: [{ id: 'documento', label: 'Documento que se acompaña', tipo: 'text', requerido: true }],
    observaciones: 'Si el documento es siempre el mismo pasa a Automática.',
  },
  {
    id: 'MT-11', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Oficial ad hoc',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Por medio de la presente vengo a solicitar se designe a quien suscribe como oficial notificador ad hoc, a los efectos de notificar la cédula dirigida a {{destinatario}}, toda vez que la oficina correspondiente no cuenta con oficial notificador.',
    variables: [{ id: 'destinatario', label: 'Destinatario', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true }],
  },
  {
    id: 'MT-12', grupo: GRUPOS_ESCRITOS[2],
    titulo: 'Acredita diligenciamiento (genérico)',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que vengo a acreditar el diligenciamiento correspondiente a la notificación ordenada. Solicito se tenga presente a sus efectos.',
    variables: [],
  },
  {
    id: 'MT-13', grupo: GRUPOS_ESCRITOS[3],
    titulo: 'Solicita oficio de averiguación de domicilio (Renaper / DPPJ / etc.)',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'I.- Que vengo a adjuntar la cédula dirigida a {{requerido}} con resultado negativo. II.- Que atento lo informado por el oficial notificador, y a fin de garantizar la defensa en juicio y evitar nulidades procesales, solicito a V.S. se libre oficio a {{organismo}} para que informe el último domicilio que conste en sus registros respecto de {{requerido}}, CUIT/DNI {{cuit_dni}}.',
    variables: [
      { id: 'requerido', label: 'Requerido', tipo: 'interviniente', requerido: true },
      { id: 'organismo', label: 'Organismo', tipo: 'select', opciones: ['Renaper', 'DPPJ', 'IGJ', 'Otro'], requerido: true },
      { id: 'cuit_dni', label: 'CUIT/DNI', tipo: 'text', requerido: true },
    ],
    observaciones: 'Una sola fila: el organismo es dato interno, no cambia el título.',
  },
  {
    id: 'MT-14', grupo: GRUPOS_ESCRITOS[3],
    titulo: 'Solicita oficio reiteratorio',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Atento a que {{organismo}} no ha contestado el oficio remitido el {{fecha_oficio}} por DEOX, vengo a solicitar se libre oficio reiteratorio al mismo{{apercibimiento}}.',
    variables: [
      { id: 'organismo', label: 'Organismo', tipo: 'text', requerido: true },
      { id: 'fecha_oficio', label: 'Fecha del oficio', tipo: 'date', requerido: true },
      { id: 'apercibimiento', label: 'Bajo apercibimiento de (opcional)', tipo: 'text' },
    ],
  },
  {
    id: 'MT-15', grupo: GRUPOS_ESCRITOS[3],
    titulo: 'Solicita nuevo traslado con el domicilio informado',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento el domicilio informado por {{organismo}}, vengo a solicitar se ordene un nuevo traslado de la demanda dirigido a {{demandado}}, DNI N° {{dni}}, con los mismos fines y efectos, al domicilio informado.',
    variables: [
      { id: 'organismo', label: 'Organismo', tipo: 'text', requerido: true },
      { id: 'demandado', label: 'Demandado', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true },
      { id: 'dni', label: 'DNI', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-16', grupo: GRUPOS_ESCRITOS[4],
    titulo: 'Solicita se resuelva',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que, atento al estado de autos, solicito se resuelva {{planteo}} solicitado por esta parte a fs. {{foja}}.',
    variables: [
      { id: 'planteo', label: 'Planteo / pedido', tipo: 'textarea', requerido: true },
      { id: 'foja', label: 'Foja', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-17', grupo: GRUPOS_ESCRITOS[4],
    titulo: 'Solicita se digitalice',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento a que {{que_digitalizar}} se encuentran en soporte papel, y a fin de agilizar su consulta y tramitación, vengo a solicitar se ordene su digitalización e incorporación al expediente electrónico.',
    variables: [{ id: 'que_digitalizar', label: 'Qué se digitaliza', tipo: 'text', requerido: true }],
    observaciones: 'Confirmar si es documental acompañada o el expediente completo.',
  },
  {
    id: 'MT-18', grupo: GRUPOS_ESCRITOS[5],
    titulo: 'Solicita apertura a prueba',
    fuero: 'CIVIL', nivel: 'AUTOMATICA',
    cuerpo: 'Que atento al estado de autos, vengo a solicitar se abra la causa a prueba.',
    variables: [],
    observaciones: 'En Laboral la etapa probatoria es distinta (Ley 18.345) — no ofrecer este escrito en LABORAL.',
  },
  {
    id: 'MT-19', grupo: GRUPOS_ESCRITOS[5],
    titulo: 'Solicita audiencia 360',
    fuero: 'CIVIL', nivel: 'AUTOMATICA',
    cuerpo: 'Que atento al estado de autos, vengo a solicitar a V.S. fije fecha para la audiencia preliminar del art. 360 del CPCCN.',
    variables: [],
  },
  {
    id: 'MT-20', grupo: GRUPOS_ESCRITOS[5],
    titulo: 'Solicita se declare la negligencia',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento que {{parte}} no ha producido la prueba {{prueba}} ofrecida, pese al tiempo transcurrido, vengo a acusar la negligencia en su producción y a solicitar se la tenga por desistida.',
    variables: [
      { id: 'parte', label: 'Parte', tipo: 'select', opciones: ['la parte actora', 'la parte demandada', 'el tercero citado'], requerido: true },
      { id: 'prueba', label: 'Prueba', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-21', grupo: GRUPOS_ESCRITOS[5],
    titulo: 'Solicita se recepcione prueba en soporte digital',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento que esta parte ofreció como prueba {{prueba_ofrecida}} (conf. {{escrito_y_punto}}), vengo a solicitar se ordene recepcionar {{soporte}} con {{contenido}}.',
    variables: [
      { id: 'prueba_ofrecida', label: 'Prueba ofrecida', tipo: 'text', requerido: true },
      { id: 'escrito_y_punto', label: 'Escrito y punto', tipo: 'text', requerido: true },
      { id: 'soporte', label: 'Soporte', tipo: 'text', requerido: true },
      { id: 'contenido', label: 'Contenido', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'MT-22', grupo: GRUPOS_ESCRITOS[6],
    titulo: 'Solicita se declare la rebeldía',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que conforme surge de la cédula de notificación agregada en autos, y toda vez que {{demandado}}, DNI N° {{dni}}, ha quedado debidamente notificado el día {{fecha_notificacion}} sin que hasta la fecha se haya presentado a contestar la demanda, vengo a solicitar que se lo declare rebelde conforme el art. 59 del Código Procesal.',
    variables: [
      { id: 'demandado', label: 'Demandado', tipo: 'interviniente', esDestinatarioCedula: true, requerido: true },
      { id: 'dni', label: 'DNI', tipo: 'text', requerido: true },
      { id: 'fecha_notificacion', label: 'Fecha de notificación', tipo: 'date', requerido: true },
    ],
  },
  {
    id: 'MT-23', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Solicita se eleven',
    fuero: 'AMBOS', nivel: 'AUTOMATICA',
    cuerpo: 'Que atento al estado de autos, solicito se eleven las actuaciones ante la {{camara}} a efectos de que resuelva el recurso de apelación oportunamente presentado.',
    variables: [{ id: 'camara', label: 'Cámara / Sala', tipo: 'text' }],
    observaciones: 'Si la cámara debe elegirse manualmente, pasa a Asistida por dato.',
  },
  {
    id: 'MT-24', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Apela competencia',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Siguiendo expresas instrucciones de mi mandante y por causarme gravamen irreparable, vengo en tiempo y forma a deducir recurso de apelación contra la resolución dictada por V.S. en la causa el {{fecha_resolucion}}, notificada por cédula electrónica N° {{numero_cedula}} el día {{fecha_notificacion}} (conf. arts. 242 inc. 2, 243, 244, 245 y ccdtes. del CPCCN).',
    variables: [
      { id: 'fecha_resolucion', label: 'Fecha de la resolución', tipo: 'date', requerido: true },
      { id: 'numero_cedula', label: 'N° de cédula electrónica', tipo: 'text', requerido: true },
      { id: 'fecha_notificacion', label: 'Fecha de notificación', tipo: 'date', requerido: true },
    ],
    observaciones: 'Fundamentación va en el Memorial (MT-26).',
  },
  {
    id: 'MT-25', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Apela sentencia de primera instancia',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Siguiendo expresas instrucciones de mi mandante y por causarme gravamen irreparable, vengo en tiempo y forma a deducir recurso de apelación contra la resolución dictada por V.S. en la causa el {{fecha_resolucion}}, notificada por cédula electrónica N° {{numero_cedula}} el día {{fecha_notificacion}} (conf. arts. 242 inc. 2, 243, 244, 245 y ccdtes. del CPCCN).',
    variables: [
      { id: 'fecha_resolucion', label: 'Fecha de la resolución', tipo: 'date', requerido: true },
      { id: 'numero_cedula', label: 'N° de cédula electrónica', tipo: 'text', requerido: true },
      { id: 'fecha_notificacion', label: 'Fecha de notificación', tipo: 'date', requerido: true },
    ],
    observaciones: 'Expresión de agravios va aparte (Asistida por criterio).',
  },
  {
    id: 'MT-26', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Memorial competencia',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: '[ESQUELETO] I.- Objeto: funda el recurso concedido en relación, contra la resolución del {{fecha_resolucion}}, notificada el {{fecha_notificacion}}. II.- Antecedentes: {{resumen_hechos}}. III.- AGRAVIOS: [repertorio estándar SOFSE]. IV.- Petitorio.',
    variables: [
      { id: 'fecha_resolucion', label: 'Fecha de resolución/sentencia', tipo: 'date', requerido: true },
      { id: 'fecha_notificacion', label: 'Fecha de notificación', tipo: 'date', requerido: true },
      { id: 'resumen_hechos', label: 'Resumen de los hechos de la demanda', tipo: 'textarea', requerido: true },
    ],
    linkModelo: '[pendiente — link al modelo completo de Gerencia]',
    observaciones: 'Concedido en relación → memorial. Los agravios son repertorio fijo de SOFSE.',
  },
  {
    id: 'MT-27', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Revocatoria',
    fuero: 'AMBOS', nivel: 'ASISTIDA_CRITERIO',
    cuerpo: '[ESQUELETO] I.- Interpone revocatoria (con apelación en subsidio, art. 241 CPCCN). II.- Providencia recurrida: {{providencia}}. III.- AGRAVIO: {{agravio}}. IV.- Petitorio.',
    variables: [
      { id: 'providencia', label: 'Providencia recurrida', tipo: 'text', requerido: true },
      { id: 'agravio', label: 'Argumento / agravio', tipo: 'textarea', requerido: true },
    ],
    linkModelo: '[pendiente — link al modelo completo]',
    observaciones: 'Arts. 238/241 CPCCN. El agravio depende de la estrategia jurídica del letrado.',
  },
  {
    id: 'MT-28', grupo: GRUPOS_ESCRITOS[7],
    titulo: 'Revocatoria in extremis',
    fuero: 'AMBOS', nivel: 'ASISTIDA_CRITERIO',
    cuerpo: '[ESQUELETO] I.- Interpone revocatoria in extremis contra {{resolucion}}. II.- Error manifiesto: {{error_manifiesto}}. III.- Fundamento. IV.- Petitorio.',
    variables: [
      { id: 'resolucion', label: 'Resolución', tipo: 'text', requerido: true },
      { id: 'error_manifiesto', label: 'Error manifiesto', tipo: 'textarea', requerido: true },
    ],
    linkModelo: '[pendiente — link al modelo completo]',
    observaciones: 'Uso excepcional.',
  },
  {
    id: 'MT-29', grupo: GRUPOS_ESCRITOS[8],
    titulo: 'Caducidad',
    fuero: 'AMBOS', nivel: 'ASISTIDA_DATO',
    cuerpo: 'Que atento que ha transcurrido el plazo del art. 310 del CPCCN sin que se haya instado el curso del proceso —siendo el último acto impulsorio de fecha {{fecha_ultimo_impulso}}—, vengo a acusar la caducidad de la instancia y a solicitar se la declare.',
    variables: [
      { id: 'fecha_ultimo_impulso', label: 'Fecha del último acto impulsorio', tipo: 'date', requerido: true },
    ],
    observaciones: 'Auto-completar {{fecha_ultimo_impulso}} desde exp.fecha_ultimo_impulsorio cuando exista.',
  },
]

export function getEscritosPorGrupo(grupo: string, area: 'CIVIL' | 'LABORAL' | 'PENAL'): EscritoTemplate[] {
  return ESCRITOS.filter(e => e.grupo === grupo && (e.fuero === 'AMBOS' || e.fuero === area))
}

export function getEscritoById(id: string): EscritoTemplate | undefined {
  return ESCRITOS.find(e => e.id === id)
}
```

> **Alcance Penal:** el catálogo de 29 MT- es de fuero Civil/Laboral (mero trámite). Para PENAL, el selector de Grupo/Título queda deshabilitado hasta que el negocio valide un catálogo específico — mostrar mensaje "Catálogo de escritos Penal — próximamente" en `TimelinePenal.tsx`. No inventar plantillas penales.

---

## 3b. Catálogo de matrículas (`src/data/matriculas.ts`) — nuevo archivo

Pool de matrículas por área. Un abogado puede tener más de una fila (una por jurisdicción). Placeholder — completar/editar con datos reales vía Configuración → Personal en una iteración posterior; por ahora alcanza con cargar 4-6 filas de prueba para los letrados usados en los mocks.

```ts
import type { Matricula } from '../types'

export const MATRICULAS: Matricula[] = [
  { id: 'MAT_001', abogado_id: 'UR_004', area: 'CIVIL',   jurisdiccion: 'CABA', tomo: '120', folio: '45' },
  { id: 'MAT_002', abogado_id: 'UR_004', area: 'CIVIL',   jurisdiccion: 'PBA',  tomo: '58',  folio: '210' },
  { id: 'MAT_003', abogado_id: 'UR_007', area: 'CIVIL',   jurisdiccion: 'CABA', tomo: '95',  folio: '12' },
  { id: 'MAT_004', abogado_id: 'UR_012', area: 'LABORAL', jurisdiccion: 'CABA', tomo: '77',  folio: '301' },
  { id: 'MAT_005', abogado_id: 'UR_010', area: 'LABORAL', jurisdiccion: 'CABA', tomo: '64',  folio: '88' },
  { id: 'UR_019', abogado_id: 'UR_019', area: 'PENAL',    jurisdiccion: 'CABA', tomo: '33',  folio: '19' },
  // completar el resto de letrados en Configuración → Personal cuando se cargue el módulo real
]

export function getMatriculasPorArea(area: Matricula['area']): Matricula[] {
  return MATRICULAS.filter(m => m.area === area)
}

/** Matrícula sugerida por defecto: la del usuario logueado para el área del expediente.
 *  Si tiene más de una en esa área, devuelve la primera (el resto queda igual disponible en el listado). */
export function getMatriculaSugerida(usuarioActivoId: string, area: Matricula['area']): Matricula | null {
  return MATRICULAS.find(m => m.abogado_id === usuarioActivoId && m.area === area) ?? null
}

export function getNombreMatricula(m: Matricula, nombreAbogado: string): string {
  return `${nombreAbogado} — Matrícula ${m.jurisdiccion} T°${m.tomo} F°${m.folio}`
}
```

**Regla de sugerencia:** al abrir el Paso 3, si `getMatriculaSugerida(usuarioActivo.id, exp.area)` devuelve algo, queda preseleccionada. Si el usuario logueado no tiene matrícula cargada para esa área (ej. un asistente jurídico armando el escrito por el abogado), no se preselecciona nada y se muestra el listado completo de `getMatriculasPorArea(exp.area)` para elegir manualmente — caso frecuente, ya que el asistente redacta pero el que firma es el abogado matriculado.

---

## 4. Función de armado de cuerpo (`src/utils/escritos.ts`)

```ts
import type { EscritoTemplate, DatosEscrito, Expediente } from '../types'
import { getNombreCompleto, getUsuarioById } from '../data/usuarios'
import { formatFecha } from './format'

const CARACTER_LABEL: Record<DatosEscrito['caracter'], string> = {
  APODERADO: 'apoderado/a',
  PATROCINANTE: 'patrocinante',
  DERECHO_PROPIO: 'por derecho propio',
}

export function armarEncabezado(exp: Expediente, datos: DatosEscrito): string {
  const firmante = getUsuarioById(datos.firmante_id)
  return [
    'Señor Juez:',
    `${firmante ? getNombreCompleto(firmante) : '[FIRMANTE]'}, en mi carácter de ${CARACTER_LABEL[datos.caracter]} de ${datos.representado === 'SOFSE' ? 'la OPERADORA FERROVIARIA SOCIEDAD DEL ESTADO (SOFSE)' : 'el ESTADO NACIONAL'} en autos "${exp.caratula}" (Expte. ${exp.numero_ee_gde}${datos.juzgado ? `, ${datos.juzgado}` : ''}${datos.secretaria ? `, ${datos.secretaria}` : ''}), a V.S. digo:`,
  ].join('\n')
}

export function armarPersoneria(datos: DatosEscrito): string {
  const partes = [`CUIL ${datos.cuil_firmante || '[CUIL]'}`]
  if (datos.causa) partes.push(`Causa N° ${datos.causa}`)
  const matricula = datos.matricula_id ? `Matrícula ${datos.matricula_id}` : 'Matrícula sin cargar'
  return `Personería acreditada — ${matricula}. ${partes.join(' — ')}.`
}

export const CIERRE_FIJO =
  'Proveer de conformidad,\nSERÁ JUSTICIA.'

export function reemplazarVariables(template: EscritoTemplate, valores: Record<string, string>): string {
  let cuerpo = template.cuerpo
  for (const v of template.variables) {
    const valor = valores[v.id]?.trim() || `[${v.label.toUpperCase()}]`
    cuerpo = cuerpo.replaceAll(`{{${v.id}}}`, valor)
  }
  return cuerpo
}

export function armarEscritoCompleto(exp: Expediente, template: EscritoTemplate, datos: DatosEscrito): string {
  return [
    armarEncabezado(exp, datos),
    '',
    armarPersoneria(datos),
    '',
    reemplazarVariables(template, datos.variables),
    '',
    CIERRE_FIJO,
  ].join('\n')
}
```

> El texto exacto de Encabezado/Cierre está pendiente de validación con Gerencia (no vino en el Excel de escritos, que solo valida cuerpos). Dejar estas dos funciones fácilmente reemplazables por el texto institucional definitivo sin tocar el resto del flujo.

---

## 5. Componente `GenerarEscritoModal` (`src/components/escritos/GenerarEscritoModal.tsx`)

Props:
```ts
interface Props {
  open: boolean
  onClose: () => void
  exp: Expediente
  onGenerar: (resultado: { titulo: string; cuerpo: string; escrito_id: string }) => void
}
```

Estado interno: `paso: 1|2|3|4`, `grupoSel`, `escritoSel: EscritoTemplate | null`, `datos: DatosEscrito`.

- **Paso 1:** grid de 9 botones (uno por grupo de `GRUPOS_ESCRITOS`).
- **Paso 2:** lista de `getEscritosPorGrupo(grupoSel, exp.area)` — cada fila muestra título + `<Badge>` de nivel (verde/azul/naranja según `nivel`). Si Penal → mensaje deshabilitado (ver nota arriba).
- **Paso 3:**
  - Sección **Firmante / Matrícula** — **un solo select**, no dos:
    - Opciones = `getMatriculasPorArea(exp.area)`, etiquetadas con `getNombreMatricula(m, nombre)` (ej. "PIRES, Juan — Matrícula CABA T°77 F°301").
    - `<optgroup label="Sugerida">` con la matrícula de `usuarioActivo` en esa área, si existe (`getMatriculaSugerida`).
    - `<optgroup label="Otras matrículas del área">` con el resto — permite firmar con la matrícula de otro letrado del área (ej. el coordinador, o el abogado titular cuando redacta un asistente).
    - Al cambiar la selección, `datos.matricula_id` y `datos.firmante_id` (= `matricula.abogado_id`) se actualizan juntos.
    - Si `getMatriculasPorArea(exp.area)` está vacío → aviso "No hay matrículas cargadas para esta área. Cargarlas en Configuración → Personal" y el paso permite continuar igual (el escrito se genera con `[MATRÍCULA SIN CARGAR]` en el bloque de personería).
  - Sección **Carácter**: 3 radios (Apoderado / Patrocinante / Por derecho propio).
  - Sección **Representado**: 2 radios (Estado Nacional / SOFSE).
  - Sección **Datos judiciales**: carátula (readonly, de `exp.caratula`), N° expediente (readonly, `exp.numero_ee_gde`), Juzgado (prellenado de `exp.juzgado`, editable), Secretaría (editable, opcional).
  - Sección **Variables del escrito** (si `escritoSel.variables.length > 0`): un `FormField` por variable, según `tipo`. Para `tipo === 'interviniente'`: select de `exp.intervinientes` (mostrar nombre + rol_procesal) + fallback a texto libre "Otro (especificar)". Al elegir un interviniente con variable `esDestinatarioCedula`, autocompletar también el campo `dni` si existe otra variable `dni` en la misma plantilla, usando `interviniente.numero_documento`.
- **Paso 4 — Vista previa y descarga:** ver sección 4b. Reemplaza al textarea simple de la v1 de este spec.

Navegación: botones "Atrás"/"Siguiente" estándar del Modal (`footer` prop), deshabilitando "Siguiente" si faltan campos requeridos del paso actual.

---

## 4b. Paso 4 — Vista previa tipo Word + descarga .docx

**Objetivo:** que el letrado vea el escrito como si fuera a abrirlo en Word (página A4, tipografía formal), pueda editarlo, y descargue el archivo real en `.docx` — no en `.pdf` ni texto plano, porque después lo tiene que subir a un sistema externo para su aprobación/firma antes de volver a cargarlo en SIAJ.

**Componente `EscritoPreview.tsx`** (dentro de `GenerarEscritoModal`, dos modos):

- **Modo "Vista previa"** (default): `<div>` con look de hoja A4 — `max-w-[794px] mx-auto bg-white shadow-card p-16`, fuente `font-serif` (Times New Roman vía `font-family` inline, no viene en el theme actual), `whitespace-pre-line`, mostrando en orden: Encabezado → Personería → Cuerpo → Cierre → bloque de firma (nombre del firmante + "Letrado — Matrícula {jurisdicción} T°{tomo} F°{folio}").
- **Modo "Editar texto"**: toggle a `<textarea>` de altura completa con el mismo contenido (`cuerpoEditado`, seed = `armarEscritoCompleto(...)`), para ajustes manuales antes de descargar.
- Botones del footer: `Atrás` · `Editar texto` / `Vista previa` (toggle) · **`Descargar Word (.docx)`** (primary).

**Generación del .docx (`src/utils/escritoDocx.ts`)** — usa la librería `docx` (paquete npm para browser, agregar a `package.json` del frontend; **distinta** del uso de `docx` que ya tiene Claude para generar archivos en su propio sandbox — acá corre en el navegador del usuario):

```ts
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import type { Expediente, EscritoTemplate, DatosEscrito } from '../types'

export async function descargarEscritoWord(
  exp: Expediente,
  template: EscritoTemplate,
  datos: DatosEscrito,
  cuerpoFinal: string,
): Promise<void> {
  const parrafos = cuerpoFinal.split('\n').map(linea =>
    new Paragraph({ children: [new TextRun(linea)], spacing: { after: 200 } })
  )

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: template.titulo.toUpperCase(), bold: true, size: 24 })],
          spacing: { after: 400 },
        }),
        ...parrafos,
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const nombreArchivo = `Escrito_${template.id}_${exp.id.replace('/', '-')}_${new Date().toISOString().split('T')[0]}.docx`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
```

**Al descargar:** el botón dispara `descargarEscritoWord(...)` y **también** llama a `onGenerar({ titulo: template.titulo, cuerpo: cuerpoFinal, escrito_id: template.id })` — la descarga y el registro en el timeline ocurren juntos, en el mismo click. No hace falta un botón separado "Confirmar" después de descargar.

---

## 6. Integración en `TimelineTab.tsx`

1. Import:
```ts
import { GenerarEscritoModal } from '../../../components/escritos/GenerarEscritoModal'
```
2. Nuevo estado junto a `modalNuevaActividad`:
```ts
const [modalEscrito, setModalEscrito] = useState(false)
```
3. Dentro del bloque del select de Tipo (línea ~1403), agregar debajo:
```tsx
{formAct.tipo === 'PRESENTACION' && (
  <button
    type="button"
    onClick={() => setModalEscrito(true)}
    className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#4a9ab5] text-[#1b3a57] text-xs font-semibold hover:bg-[rgba(27,58,87,0.05)] transition-colors"
  >
    <Icon name="article" size={16} />
    Generar Escrito
  </button>
)}
```
4. Render del modal (junto al modal de Nueva actividad):
```tsx
<GenerarEscritoModal
  open={modalEscrito}
  onClose={() => setModalEscrito(false)}
  exp={exp}
  onGenerar={({ titulo, cuerpo, escrito_id }) => {
    setFormAct(p => ({ ...p, titulo, descripcion: cuerpo }))
    setEscritoIdSeleccionado(escrito_id)   // nuevo estado local, se agrega a la Actividad al confirmar
    setModalEscrito(false)
    toast.success('Word descargado. Revisá el texto y confirmá la actividad — quedará como "pendiente de aprobación".')
  }}
/>
```
5. En `agregarNuevaActividad()`, incluir en el objeto `act`:
```ts
escrito_id: escritoIdSeleccionado ?? undefined,
escrito_estado: escritoIdSeleccionado ? 'GENERADO' : undefined,
```
y resetear `escritoIdSeleccionado` junto con `setFormAct(BLANK_ACT)`.

## 6b. Badge "pendiente de aprobación" + cierre del circuito

Cuando una actividad tiene `escrito_estado === 'GENERADO'`, el feed del timeline (`TimelineTab.tsx`, render de cada actividad) debe mostrar un badge ámbar junto al título:

```tsx
{act.escrito_estado === 'GENERADO' && (
  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
    Pendiente de aprobación externa
  </span>
)}
```

**Cierre del circuito (sin desarrollo nuevo, reutiliza Replies):** cuando el letrado consigue el archivo aprobado/firmado y lo sube a SIAJ, lo hace con el botón "Comentar" de esa misma actividad (ya existente — sección "Sistema de Replies" de `pages_CLAUDE.md`), adjuntando el PDF/Word aprobado vía `doc_gde` o adjunto del reply. Al guardar ese reply:
- `actualizarTarea`/`agregarReply` ya existe — no requiere store nuevo.
- Agregar un único ajuste: si `replyData.doc_gde` (o adjunto) viene cargado y la actividad tiene `escrito_estado === 'GENERADO'`, `agregarReply` en `expedientes.store.ts` actualiza esa actividad a `escrito_estado: 'APROBADO_CARGADO'` y el badge cambia a verde "Aprobado y cargado".
- Alternativa más simple si no se quiere tocar el store: dejar el cambio de estado manual, con un botón "Marcar como aprobado" visible solo si `escrito_estado === 'GENERADO'`, que llama a una nueva acción liviana `marcarEscritoAprobado(expId, actividadId)`.

## 7. Integración en `TimelinePenal.tsx`

Mismo patrón (mismo `TIPOS` con `'PRESENTACION'`), pero como se indicó, el catálogo de escritos no cubre Penal aún — el botón puede quedar oculto para Penal hasta que exista catálogo, o mostrarse deshabilitado con tooltip "Catálogo de escritos Penal — próximamente". Definir con Chris/Gustavo Desideri antes de habilitarlo.

---

## 8. Roadmap (ya alineado con el requisito de negocio)

- **Etapa 1 (esta spec):** selección 100% manual de firmante/matrícula/carácter; datos judiciales pre-cargados desde `Expediente` (ya guardado, no requiere backend); destinatario/DNI de cédula pre-cargados desde `Intervinientes`.
- **Etapa 2:** autocompletar Personería completa (tomo/folio/CUIL) desde el perfil del abogado en Configuración → Personal, sin selección manual.
- **Etapa 3:** IA (Gemini) sugiere o completa variables de nivel "Asistida por criterio" (MT-27/28) y resume hechos para MT-26, usando el módulo RAG ya en plan (`Saúl Goodman`).

---

## 9. Checklist de implementación para Claude Code

- [ ] Agregar tipos en `src/types/index.ts` (sección 2) — incluye `Matricula`, `DatosEscrito`, `escrito_estado`
- [ ] Instalar dependencia `docx` en el frontend (`npm install docx`) — es distinta de cualquier uso de `docx` del lado de Claude/sandbox
- [ ] Crear `src/data/escritos.ts` (sección 3)
- [ ] Crear `src/data/matriculas.ts` (sección 3b) con datos de prueba para 4-6 letrados
- [ ] Crear `src/utils/escritos.ts` (sección 4 — armado de texto)
- [ ] Crear `src/utils/escritoDocx.ts` (sección 4b — generación y descarga del .docx)
- [ ] Crear `src/components/escritos/GenerarEscritoModal.tsx` + `EscritoPreview.tsx` (sección 5 y 4b)
- [ ] Agregar ícono `article` a `Icon.tsx` si no está mapeado (ya está en la lista de 55+ íconos actuales)
- [ ] Modificar `TimelineTab.tsx`: botón "Generar Escrito", estado `escritoIdSeleccionado`, badge de pendiente de aprobación (secciones 6 y 6b)
- [ ] Modificar `TimelinePenal.tsx` (sección 7) — botón deshabilitado por ahora
- [ ] Agregar `cuil?: string` a 2-3 usuarios mock de prueba en `usuarios.ts`
- [ ] Decidir e implementar el cierre del circuito (sección 6b): ajuste en `agregarReply` del store, o botón manual "Marcar como aprobado"
- [ ] `npx tsc --noEmit` antes de avisar que está listo
- [ ] No commitear sin confirmación explícita de Chris
