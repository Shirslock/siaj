# Historia de Usuario

**HU-Principal — Página de Inicio del Abogado ("Principal")**

Etapa 1 | Septiembre 2026 | Sprint: *A definir*

---

## Datos generales

| Campo | Detalle |
|---|---|
| **Rol** | Abogado / Asistente Jurídico |
| **Necesidad** | Como abogado, necesito una pantalla de inicio con un resumen de mi carga de trabajo (causas, actuaciones, vencimientos, rol procesal) apenas ingreso al sistema, para poder priorizar mi día sin tener que recorrer manualmente toda la Bandeja de Actuaciones. |
| **Objetivo** | Que al ingresar al sistema, el abogado vea de un vistazo cuántas causas y cuántos documentos tiene activos, qué se le vence, qué audiencias tiene próximas, qué le asignaron nuevo, cómo se reparte su carga por tipo de intervención (Actora / Demandada / Denunciante / Sin intervención) y por estado procesal, y pueda saltar directo a la lista ya filtrada con un solo clic. |
| **Estado previo** | No existía una pantalla de inicio propia para el abogado. Al ingresar, todos los roles caían en el mismo Dashboard analítico ("Panel de Control"), pensado para Gerencia/Coordinación, sin ningún dato personalizado de la carga de trabajo del abogado. |

---

## Criterios de Aceptación

### 1. Acceso — quién ve esta pantalla

- Al iniciar sesión (o al navegar a la raíz del sistema), el usuario con rol **Abogado** es dirigido automáticamente a la pantalla **"Principal"**.
- Los roles **Gerente**, **Coordinador** y **Mesa SACO** no tienen cambios — siguen accediendo a sus pantallas de siempre (Dashboard / Mesa SACO). "Principal" es exclusiva del rol Abogado en esta etapa.
- El menú lateral del abogado muestra la opción **"Principal"** como punto de entrada.
- El encabezado saluda al abogado por su nombre e indica cuántas actuaciones activas está gestionando.

### 2. Indicadores principales (fila superior)

Cuatro indicadores destacados, cada uno con su ícono. Al hacer clic, cada uno lleva a la Bandeja de Actuaciones ya filtrada:

| Indicador | Qué muestra |
|---|---|
| **Causas activas** | Actuaciones activas del abogado que son una causa judicial propia: Demandas, Lanzamientos, Querellas, Defensas, Mediaciones, SECLO, Cobro de cánones, Recuperos, Ejecución de pólizas, etc. |
| **Documentos activos** | Actuaciones activas que el abogado lleva como documento: Oficios, Carta Documento, Pedido de Causa Penal, Carta Suceso (SAE) y Otras presentaciones. |
| **Nuevas asignadas** | Actuaciones recién asignadas al abogado, que todavía no iniciaron su trámite. |
| **Urgentes** | Actuaciones marcadas como urgentes. |

**Por qué se separan causas de documentos:** hay abogados que llevan ambas cosas y otros que llevan solo documentos (típicamente oficios). Con un único total, estos últimos veían la pantalla casi vacía o distorsionada.

La clasificación es **por tipo de gestión, no por si la actuación tiene número de causa cargado**: un oficio judicial normalmente referencia el número de causa del expediente ajeno y aun así es un documento, no una causa propia del abogado.

El total general de actuaciones activas no se repite como indicador — ya está en el saludo del encabezado, y equivale a la suma de "Causas activas" + "Documentos activos".

### 3. Vencimientos y tareas (bloque principal)

- Listado de las actuaciones que tienen una actividad o plazo **vencido** o **próximo a vencer**, ordenado por urgencia (las vencidas primero y, dentro de cada grupo, las más antiguas arriba).
- El listado se presenta **agrupado**, con el total de cada grupo a la vista: **"Vencidas (N)"** y **"Próximas (N)"**.
- Cada fila muestra la carátula, el número de actuación, la tarea o plazo pendiente, la fecha de vencimiento y una etiqueta de estado (**VENCIDO** / **POR VENCER**).
- **Filtro por pestañas**: *Todas* | *Vencidas* | *Por vencer*, para enfocarse solo en un grupo.
- Cada fila lleva **directo al detalle de esa actuación** (no a la Bandeja).
- Un enlace al pie lleva a la Bandeja de Actuaciones filtrada por alertas de vencimiento.

### 4. Próximas audiencias (columna derecha)

- Bloque con las **audiencias agendadas de hoy en adelante**, ordenadas de la más próxima a la más lejana, con la cantidad total a la vista.
- Cada audiencia muestra su título, la fecha y el número de actuación, y lleva **directo al detalle de esa actuación**.
- Las audiencias ya realizadas quedan en el historial de la actuación y **no** aparecen acá.
- Las audiencias se cargan como una actividad del tipo "Audiencia" dentro de la actuación; no requieren un alta especial ni un módulo aparte.

### 5. Distribuciones (columna derecha)

Dos bloques con barras comparativas. Cada fila, al hacer clic, filtra la Bandeja de Actuaciones:

- **Por rol** — cómo se reparten las actuaciones activas según el tipo de intervención cargado: **Actora**, **Demandada**, **Denunciante** y **Sin intervención**. Se muestran las cuatro categorías siempre, incluso las que están en cero (Denunciante corresponde al fuero Penal, así que queda en cero para un abogado de Civil o Laboral).
- **Por estado procesal** — en qué etapa del trámite está cada actuación activa (Asignado, Inicio, Traba de Litis, En Prueba, Alegatos, Apelación, Ejecución de Sentencia, etc.), ordenado de mayor a menor. Solo aparecen los estados que el abogado efectivamente tiene. Para la gestión diaria interesa la etapa procesal, no el objeto del juicio.

Al pie de la columna, un bloque con **Actuaciones cerradas** (total de actuaciones finalizadas del abogado), que lleva a la Bandeja en su pestaña de archivados.

### 6. Navegación — "ir a la Bandeja ya filtrada"

- Cualquier indicador o fila de distribución de esta pantalla, al hacer clic, **no abre una pantalla nueva**: navega a la Bandeja de Actuaciones existente, con el filtro correspondiente ya aplicado.
- Las excepciones son el listado de Vencimientos y tareas (punto 3) y el de Próximas audiencias (punto 4), donde cada fila individual lleva directo al detalle de esa actuación puntual.
- El número que muestra cada indicador y la cantidad de resultados que trae la Bandeja al hacer clic deben coincidir siempre.

---

## 🚫 Fuera del alcance de esta HU (Etapa 1)

- **Módulo Agenda** — no está integrado a esta pantalla en esta etapa.
- **Módulo Solicitudes** — no está integrado a esta pantalla en esta etapa.
- **Novedades PJN** (integración con el Portal del Poder Judicial) — no aparece en esta pantalla.
- **Asistente IA** — no aparece en esta pantalla.
- **Alta de audiencias como entidad propia**: se siguen cargando como una actividad del tipo "Audiencia" dentro de la actuación. Esta pantalla solo las lee y las agrupa.
- **"Actuación de Oficio"** (el otro tipo de intervención del fuero Penal) no se muestra como categoría en "Por rol".
- Distribución por **objeto del juicio / tipo de gestión** — se reemplazó por la distribución por estado procesal, que es la que sirve para la gestión del abogado.
- Un indicador separado para actuaciones **vencidas**: las vencidas se ven en detalle dentro del listado de Vencimientos y tareas (con su total en el encabezado del grupo), no se duplican como indicador en la fila superior.
- Distinguir entre "vencidas" y "por vencer" al filtrar desde el enlace hacia la Bandeja — ahí se muestran juntas (la distinción está resuelta dentro de la pantalla, con las pestañas).
- Roles Gerente, Coordinador y Mesa SACO: no tienen esta pantalla en esta etapa, siguen con sus pantallas actuales sin cambios.
- Persistencia en backend — la pantalla sigue trabajando sobre datos de ejemplo (mock) en memoria, igual que el resto del prototipo.

---

## Capturas de pantalla

*(completar acá con las capturas de la pantalla "Principal": vista general, fila de indicadores, listado de Vencimientos y tareas con las pestañas, bloque de Próximas audiencias, y los bloques de distribución)*

---

## Nota de diseño

La búsqueda dentro del listado de Vencimientos y tareas se descartó: el Topbar ya tiene un buscador global de actuaciones, y las pestañas resuelven el filtrado que esta pantalla necesita.
