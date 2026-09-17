# Módulo de Escritos Judiciales Pre-definidos — SIAJ

> Documento funcional para generación de Historias de Usuario. Describe la funcionalidad **tal
> como está implementada hoy** en SIAJ (Sistema Integral de Asuntos Jurídicos), sin roadmap
> futuro. Alcance: fueros **Civil y Laboral**. El fuero **Penal** no tiene catálogo propio
> todavía (ver sección 7).

---

## 1. Qué es y para qué sirve

SIAJ es el sistema de gestión de expedientes judiciales del área legal de una empresa
(SOFSE — Operadora Ferroviaria Sociedad del Estado, litigando en representación del Estado
Nacional y de sí misma). Cada expediente judicial ("actuación") tiene una línea de tiempo
donde el letrado registra actividades: presentaciones, notificaciones, audiencias, etc.

El **Módulo de Escritos** es un asistente de redacción que ayuda al letrado (o a un asistente
jurídico que trabaje en su nombre) a generar el texto de un escrito judicial estandarizado
—con los datos del expediente y del firmante ya insertados— y descargarlo como archivo Word
(`.docx`) listo para presentar. No reemplaza la carga manual de actividades: es una ayuda
opcional; el letrado puede cerrarlo en cualquier momento y tipear el título/descripción a
mano si prefiere.

**Importante — SIAJ no firma ni presenta nada por sí mismo.** El circuito real es:
1. El letrado genera el escrito en SIAJ y descarga el `.docx`.
2. Lo sube a un sistema externo (fuera de SIAJ) para que se apruebe y/o firme.
3. Una vez aprobado, vuelve a SIAJ y carga el archivo definitivo como evidencia.

Esto define dos estados de una actividad de tipo escrito: **generado, pendiente de
aprobación externa** y **aprobado y cargado** (ver sección 6).

---

## 2. Actores

| Actor | Qué puede hacer |
|---|---|
| **Abogado / Letrado** | Genera escritos para sus propias actuaciones. Firma con su propia matrícula (sugerida automáticamente) o, si tiene más de una matrícula (distintas jurisdicciones), elige cuál usar. |
| **Asistente jurídico / Coordinador** | Puede redactar un escrito por un abogado que no es él mismo — en ese caso el sistema no sugiere ninguna matrícula por defecto y debe elegir manualmente la matrícula del abogado titular entre las disponibles para esa área. |
| **Referente** | Mismo acceso que un coordinador, sin restricción de área. |

No hay backend de aprobación/firma dentro de SIAJ — la aprobación ocurre en un sistema
externo no integrado (ver sección 6).

---

## 3. Flujo funcional completo

**Punto de entrada:** dentro de una actuación (Civil o Laboral), al crear una **Nueva
actividad** con **Tipo = Presentación**, aparece un botón **"Generar Escrito"**. Al tocarlo se
abre un asistente (wizard) de 4 pasos.

### Paso 1 — Elegir grupo
El letrado ve 9 grupos temáticos de escritos (ver catálogo completo en sección 5):
1. Presentación y personería
2. Bonos, tasas y copias
3. Notificaciones y cédulas
4. Oficios y averiguación de domicilio
5. Impulso y trámite
6. Prueba
7. Rebeldía
8. Recursos
9. Caducidad

### Paso 2 — Elegir título
Dentro del grupo elegido, ve la lista de títulos de escritos disponibles — **filtrada
automáticamente según el fuero de la actuación** (Civil o Laboral): un escrito puede estar
disponible para ambos fueros o ser exclusivo de uno. Cada título muestra una etiqueta de
color según su **nivel de automatización**:
- 🟢 **Automática** — el texto está completo, sin datos que completar.
- 🔵 **Asistida por dato** — el texto tiene "huecos" (variables) que el letrado completa con
  datos puntuales (una fecha, un nombre, un número de foja, etc.).
- 🟠 **Asistida por criterio** — el escrito requiere argumentación jurídica propia del
  letrado (ej. fundar un recurso); SIAJ da un esqueleto con la estructura, no el argumento.

### Paso 3 — Completar datos
Formulario con dos bloques:

**Bloque fijo** (aparece siempre, sin importar el escrito elegido):
- **Firmante / Matrícula** — un solo selector (no dos separados). Lista las matrículas
  disponibles para el área de la actuación. Si el usuario logueado tiene una matrícula
  cargada para esa área, aparece pre-seleccionada ("Sugerida"); el resto de matrículas del
  área también están disponibles para elegir ("Otras matrículas del área") — esto cubre el
  caso de un asistente redactando por un abogado, o de firmar con la matrícula de otro
  letrado del equipo. Al elegir una matrícula, el firmante queda determinado automáticamente
  (una matrícula pertenece a un solo abogado). Si no hay matrículas cargadas para el área, se
  avisa y se permite continuar igual (el escrito queda con un marcador "matrícula sin
  cargar").
- **Carácter de representación** — Apoderado / Patrocinante / Por derecho propio.
- **Representado** — Estado Nacional / SOFSE.
- **Datos judiciales** — carátula y número de expediente (de solo lectura, vienen del
  expediente), juzgado y secretaría (pre-cargados desde el expediente pero editables acá).

**Bloque variable** (solo si el escrito elegido tiene variables — nivel Asistida por dato o
por criterio): un campo por cada variable que pide ese escrito puntual (texto libre, texto
largo, fecha, selector con opciones fijas, o selector de interviniente del expediente).

**Caso especial — destinatario de cédula:** varios escritos piden un campo "Destinatario"
(a quién se le notifica algo). Cuando el escrito lo requiere, ese campo se pre-completa
automáticamente con el interviniente del expediente que tiene rol de demandado — el letrado
puede aceptarlo o cambiarlo manualmente por otro interviniente o texto libre. Si el mismo
escrito también pide un DNI, se pre-completa también desde el documento del interviniente
elegido.

### Paso 4 — Vista previa y descarga
Con todos los datos completos, SIAJ arma el texto final del escrito, combinando:
`Encabezado (Señor Juez, firmante, carácter, carátula/expediente/juzgado) + Personería
(matrícula, CUIL) + Cuerpo del escrito con las variables ya reemplazadas + Cierre fijo`.

El letrado ve esto en dos modos intercambiables:
- **Vista previa** — se muestra con aspecto de hoja tipo Word (A4, tipografía formal).
- **Editar texto** — el mismo contenido en un campo de texto libre, por si necesita ajustar
  algo antes de descargar.

Al confirmar, se dispara **una sola acción**: se descarga el archivo `.docx` **y** se
completa automáticamente el título y la descripción de la actividad que se está creando en
el timeline (el título es siempre el título exacto del catálogo — "una fila del catálogo =
un título de actividad", nunca se edita). No hace falta un paso de confirmación aparte.

El resto del alta de la actividad sigue el flujo normal de "Nueva actividad" (fecha, número
de documento GDE, adjuntos, etc.).

### 3.1 Origen de los datos por campo

Para escribir Historias de Usuario es clave distinguir, de cada dato que aparece en el
Paso 3 o en el texto final del Paso 4, **de dónde sale** y **si el letrado puede tocarlo**.
Se usan 4 categorías:

| Categoría | Qué significa | Cómo se ve en el Paso 3 |
|---|---|---|
| 🔒 **Precargado — solo lectura** | Viene del expediente, el usuario no puede tocarlo | Campo gris/deshabilitado |
| ✏️ **Precargado — editable** | El sistema sugiere un valor pero el usuario puede cambiarlo | Campo con valor inicial, habilitado |
| ⌨️ **A cargo del usuario** | No hay valor por defecto, el usuario elige o tipea | Campo vacío |
| 📄 **Fijo en la plantilla** | No es un campo del formulario: es texto que ya está en el `.docx` de salida | No aparece en el Paso 3, solo en el Paso 4 (preview) |

**Bloque fijo (Paso 3):**

| Campo | Categoría | Origen / detalle |
|---|---|---|
| Carátula y N° de expediente | 🔒 Solo lectura | Del expediente cargado en SIAJ |
| Juzgado y secretaría | ✏️ Editable | Precargado del expediente, corregible |
| Firmante / Matrícula | ✏️ Editable | Sugerida si el usuario logueado tiene matrícula en esa área; si no, el usuario elige de la lista |
| Carácter de representación | ⌨️ Usuario | Sin default — Apoderado/Patrocinante/Por derecho propio |
| Representado | ⌨️ Usuario | Sin default — Estado Nacional/SOFSE |
| Destinatario (cuando el escrito lo pide) | ✏️ Editable | Precargado con el interviniente rol "demandado" del expediente |
| DNI (cuando el escrito también lo pide) | ✏️ Editable | Precargado desde el documento del interviniente elegido en "Destinatario" |
| Resto de variables (nivel Asistida por dato/criterio) | ⌨️ Usuario | Sin default — texto, fecha, selector, según el escrito (ver catálogo sección 5) |

**Texto final (Paso 4):**

| Bloque del texto | Categoría |
|---|---|
| Encabezado (Señor Juez, firmante, carácter, carátula/juzgado) | Se arma combinando los datos de arriba — no es texto fijo, es composición |
| Cuerpo de un escrito 🟢 Automática (ej. "Solicita eximir sellado") | 📄 Fijo — el usuario no completa nada, el texto entero ya está en la plantilla |
| Cuerpo de un escrito 🔵/🟠 con variables | Mezcla: texto fijo de la plantilla + los `{{huecos}}` reemplazados por lo que cargó el usuario |
| Cierre fijo | 📄 Fijo — igual en todos los escritos |

---

## 4. Reglas de negocio clave

- El asistente de escritos es **opcional** — el letrado puede cerrarlo y cargar la actividad
  a mano en cualquier momento, con el título y descripción que quiera.
- Un escrito solo se ofrece si su fuero coincide con el de la actuación (o si es "ambos
  fueros"). No hay catálogo de escritos para Penal (sección 7).
- El nivel de automatización de un escrito determina cuántos datos hay que completar en el
  Paso 3, no cambia el flujo en sí.
- La matrícula elegida define automáticamente quién firma — nunca se elige el firmante por
  separado de la matrícula.
- Un mismo abogado puede tener más de una matrícula (por ejemplo, una para CABA y otra para
  Provincia de Buenos Aires) — cada una aparece como una opción distinta en el selector.
- Los datos judiciales (carátula, expediente, juzgado) se toman del expediente que ya está
  cargado en SIAJ — el letrado no los vuelve a tipear, aunque puede corregir juzgado y
  secretaría si hace falta.
- El texto final siempre es editable a mano antes de descargar — el asistente sugiere, no
  impone.
- El título de la actividad generada tiene que coincidir exactamente con el título del
  catálogo elegido (no se permite editarlo a mano en este flujo).

---

## 5. Catálogo completo de escritos (29)

Leyenda de **Fuero**: C = Civil, L = Laboral, Ambos = Civil y Laboral.
Leyenda de **Nivel**: 🟢 Automática · 🔵 Asistida por dato · 🟠 Asistida por criterio.

### Grupo 1 — Presentación y personería
| Título | Fuero | Nivel | Datos que pide |
|---|---|---|---|
| Se presenta - solicita se vincule | Ambos | 🟢 | — (variables fijas: representado, CUIT) |
| Se presenta - acredita personería (Estado Nacional) | Ambos | 🟢 | — |
| Autoriza | Ambos | 🔵 | Personas autorizadas |

### Grupo 2 — Bonos, tasas y copias
| Título | Fuero | Nivel | Datos que pide |
|---|---|---|---|
| Acredita bono genérico y específico | Ambos | 🟢 | — |
| Solicita eximir copias | Ambos | 🟢 | — |
| Solicita eximir sellado | Ambos | 🟢 | — |
| Solicita eximir copias y sellado (ambas) | Ambos | 🟢 | — |

### Grupo 3 — Notificaciones y cédulas
| Título | Fuero | Nivel | Datos que pide |
|---|---|---|---|
| Solicita nueva cédula con habilitación de días y horas | Ambos | 🔵 | Destinatario, DNI, motivo del resultado negativo |
| Solicita bajo responsabilidad de la parte | Ambos | 🔵 | Tipo de documento (cédula/oficio), destinatario |
| Se acompaña para confronte | Ambos | 🔵 | Documento que se acompaña |
| Oficial ad hoc | Ambos | 🔵 | Destinatario |
| Acredita diligenciamiento (genérico) | Ambos | 🟢 | — |

### Grupo 4 — Oficios y averiguación de domicilio
| Título | Fuero | Nivel | Datos que pide |
|---|---|---|---|
| Solicita oficio de averiguación de domicilio (Renaper / DPPJ / etc.) | Ambos | 🔵 | Requerido, organismo, CUIT/DNI |
| Solicita oficio reiteratorio | Ambos | 🔵 | Organismo, fecha del oficio, apercibimiento (opcional) |
| Solicita nuevo traslado con el domicilio informado | Ambos | 🔵 | Organismo, demandado, DNI |

### Grupo 5 — Impulso y trámite
| Título | Fuero | Nivel | Datos que pide |
|---|---|---|---|
| Solicita se resuelva | Ambos | 🔵 | Planteo/pedido, foja |
| Solicita se digitalice | Ambos | 🔵 | Qué se digitaliza |

### Grupo 6 — Prueba
| Título | Fuero | Nivel | Datos que pide |
|---|---|---|---|
| Solicita apertura a prueba | **Civil** | 🟢 | — (en Laboral la etapa probatoria es distinta, no se ofrece) |
| Solicita audiencia 360 | **Civil** | 🟢 | — |
| Solicita se declare la negligencia | Ambos | 🔵 | Parte, prueba |
| Solicita se recepcione prueba en soporte digital | Ambos | 🔵 | Prueba ofrecida, escrito y punto, soporte, contenido |

### Grupo 7 — Rebeldía
| Título | Fuero | Nivel | Datos que pide |
|---|---|---|---|
| Solicita se declare la rebeldía | Ambos | 🔵 | Demandado, DNI, fecha de notificación |

### Grupo 8 — Recursos
| Título | Fuero | Nivel | Datos que pide |
|---|---|---|---|
| Solicita se eleven | Ambos | 🟢 | Cámara/Sala (opcional) |
| Apela competencia | Ambos | 🔵 | Fecha de resolución, N° de cédula, fecha de notificación |
| Apela sentencia de primera instancia | Ambos | 🔵 | Fecha de resolución, N° de cédula, fecha de notificación |
| Memorial competencia | Ambos | 🔵 | Fecha de resolución, fecha de notificación, resumen de hechos |
| Revocatoria | Ambos | 🟠 | Providencia recurrida, argumento/agravio (requiere criterio del letrado) |
| Revocatoria in extremis | Ambos | 🟠 | Resolución, error manifiesto (uso excepcional, requiere criterio del letrado) |

### Grupo 9 — Caducidad
| Título | Fuero | Nivel | Datos que pide |
|---|---|---|---|
| Caducidad | Ambos | 🔵 | Fecha del último acto impulsorio |

---

## 6. Estados del escrito y circuito de aprobación externa

Cuando una actividad se creó a través del asistente de escritos, queda marcada con un estado
propio (independiente del estado general de la actuación):

1. **Generado, pendiente de aprobación externa** (badge ámbar en el timeline) — se descargó
   el `.docx` y se registró la actividad, pero todavía no hay archivo aprobado cargado en
   SIAJ. Este es el estado inicial siempre.
2. **Aprobado y cargado** (badge verde) — el letrado consiguió el archivo aprobado/firmado en
   el sistema externo y lo subió a SIAJ, adjuntándolo como comentario a esa misma actividad
   (reutiliza el flujo ya existente de comentarios con adjunto del timeline — no es una
   pantalla nueva). En cuanto se adjunta el archivo, el estado cambia automáticamente.

No existe (todavía) ninguna notificación ni recordatorio automático para que el letrado no
se olvide de volver a cargar el archivo aprobado — depende de que él lo haga manualmente.

---

## 7. Fuera de alcance actual (no inventar historias sobre esto)

- **Fuero Penal:** el botón "Generar Escrito" existe en la pantalla de actividades de Penal,
  pero está deshabilitado con el mensaje "Catálogo de escritos Penal — próximamente". No hay
  ningún escrito penal cargado todavía.
- **Autocompletado de personería:** hoy el letrado elige la matrícula manualmente de una
  lista; no hay perfil de abogado que autocomplete tomo/folio/CUIL sin selección.
  Se completan por lo que ya está pre-cargado del expediente/interviniente
  (juzgado, destinatario, DNI), no por perfil del firmante.
- **Sugerencia por IA:** los escritos de nivel "Asistida por criterio" (Revocatoria,
  Revocatoria in extremis) dan solo un esqueleto de estructura — no hay ninguna sugerencia
  automática de argumento ni redacción asistida por inteligencia artificial en este módulo.
- **Firma o aprobación dentro de SIAJ:** SIAJ nunca firma ni aprueba un documento — ese paso
  ocurre siempre en un sistema externo no integrado.
