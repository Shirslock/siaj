# Historia de Usuario

**HU-Principal — Página de Inicio del Abogado ("Principal")**

Etapa 1 | Septiembre 2026 | Sprint: *A definir*

---

## Datos generales

| Campo | Detalle |
|---|---|
| **Rol** | Abogado / Asistente Jurídico |
| **Necesidad** | Como abogado, necesito una pantalla de inicio con un resumen de mi carga de trabajo (causas, actuaciones, vencimientos, rol procesal) apenas ingreso al sistema, para poder priorizar mi día sin tener que recorrer manualmente toda la Bandeja de Actuaciones. |
| **Objetivo** | Que al ingresar al sistema, el abogado vea de un vistazo cuántas causas y actuaciones tiene activas, qué se le vence, qué le asignaron nuevo, cómo se reparten sus causas entre parte Actora / Demandada / Sin intervención / Penal y por tipo de gestión, y pueda saltar directo a la lista ya filtrada con un solo clic. |
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
| **Causas activas** | Cantidad de causas judiciales distintas entre las actuaciones activas del abogado (varias actuaciones pueden compartir una misma causa, por eso este número es menor o igual al siguiente). |
| **Actuaciones activas** | Cantidad total de actuaciones activas a cargo del abogado, tengan o no una causa judicial asociada. |
| **Nuevas asignadas** | Actuaciones recién asignadas al abogado, que todavía no iniciaron su trámite. |
| **Urgentes** | Actuaciones marcadas como urgentes. |

### 3. Vencimientos y tareas (bloque principal)

- Listado de las actuaciones que tienen una actividad o plazo **vencido** o **próximo a vencer**, ordenado por urgencia (las vencidas primero y, dentro de cada grupo, las más antiguas arriba).
- El listado se presenta **agrupado**, con el total de cada grupo a la vista: **"Vencidas (N)"** y **"Próximas (N)"**.
- Cada fila muestra la carátula, el número de actuación, la tarea o plazo pendiente, la fecha de vencimiento y una etiqueta de estado (**VENCIDO** / **POR VENCER**).
- **Filtro por pestañas**: *Todas* | *Vencidas* | *Por vencer*, para enfocarse solo en un grupo.
- Cada fila lleva **directo al detalle de esa actuación** (no a la Bandeja).
- Un enlace al pie lleva a la Bandeja de Actuaciones filtrada por alertas de vencimiento.

### 4. Distribuciones (columna derecha)

Dos bloques con barras comparativas. Cada fila, al hacer clic, filtra la Bandeja de Actuaciones:

- **Por rol** — cómo se reparten las causas activas según el rol procesal cargado en cada actuación: **Actora**, **Demandada**, **Sin intervención** y **Penal**. Se muestran las cuatro categorías siempre, incluso las que están en cero.
- **Por tipo de gestión** — cómo se reparten las actuaciones activas por tipo (Demanda Civil, Lanzamientos, Oficios, etc.), ordenadas de mayor a menor. Solo aparecen los tipos que el abogado efectivamente tiene.

Al pie de la columna, un bloque con **Actuaciones cerradas** (total de actuaciones finalizadas del abogado), que lleva a la Bandeja en su pestaña de archivados.

### 5. Navegación — "ir a la Bandeja ya filtrada"

- Cualquier indicador o fila de distribución de esta pantalla, al hacer clic, **no abre una pantalla nueva**: navega a la Bandeja de Actuaciones existente, con el filtro correspondiente ya aplicado.
- La única excepción es el listado de Vencimientos y tareas (punto 3), donde cada fila individual lleva directo al detalle de esa actuación puntual.
- El número que muestra cada indicador y la cantidad de resultados que trae la Bandeja al hacer clic deben coincidir siempre.

---

## 🚫 Fuera del alcance de esta HU (Etapa 1)

- **Módulo Agenda** — no está integrado a esta pantalla en esta etapa.
- **Módulo Solicitudes** — no está integrado a esta pantalla en esta etapa.
- **Novedades PJN** (integración con el Portal del Poder Judicial) — no aparece en esta pantalla.
- **Asistente IA** — no aparece en esta pantalla.
- Distribución por **sub-estado procesal** — se evaluó y quedó fuera del diseño final.
- Un indicador separado para actuaciones **vencidas**: las vencidas se ven en detalle dentro del listado de Vencimientos y tareas (con su total en el encabezado del grupo), no se duplican como indicador en la fila superior.
- Distinguir entre "vencidas" y "por vencer" al filtrar desde el enlace hacia la Bandeja — ahí se muestran juntas (la distinción está resuelta dentro de la pantalla, con las pestañas).
- Roles Gerente, Coordinador y Mesa SACO: no tienen esta pantalla en esta etapa, siguen con sus pantallas actuales sin cambios.
- Persistencia en backend — la pantalla sigue trabajando sobre datos de ejemplo (mock) en memoria, igual que el resto del prototipo.

---

## Capturas de pantalla

*(completar acá con las capturas de la pantalla "Principal": vista general, fila de indicadores, listado de Vencimientos y tareas con las pestañas, y los bloques de distribución)*

---

## Nota de diseño

La búsqueda dentro del listado de Vencimientos y tareas se descartó: el Topbar ya tiene un buscador global de actuaciones, y las pestañas resuelven el filtrado que esta pantalla necesita.
