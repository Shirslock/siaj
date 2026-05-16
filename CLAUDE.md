# CLAUDE.md — SIAJ Frontend
# Sistema Integral de Asuntos Jurídicos — SOFSA / Trenes Argentinos

> Fuente de verdad para Claude Code. Leer completo antes de escribir código.

## 1. Stack

| Herramienta | Versión | Rol |
|-------------|---------|-----|
| React | 18 | UI |
| TypeScript | 5 | Lenguaje |
| Vite | 5 | Build / dev server (`npm run dev`) |
| Tailwind CSS | 3 | Estilos (tokens en `tailwind.config.ts`) |
| Zustand | latest | Estado global |
| React Router | v6 | Routing |
| Material Symbols | @material-symbols/font-400 | Iconos |

## 2. Levantar el proyecto

```bash
npm install
npm run dev     # http://localhost:5173
```

## 3. Mapa de archivos

| Carpeta / Archivo | Responsabilidad |
|-------------------|----------------|
| `src/types/index.ts` | Todos los tipos del dominio. Fuente de verdad de contratos. |
| `src/data/catalogos.ts` | TIPOS_GESTION, JUZGADOS, LINEAS, y todos los catálogos de dropdowns. |
| `src/data/formularios.ts` | Campos por subtipo (etapa mesa + etapa abogado). |
| `src/data/usuarios.ts` | 28 usuarios reales con IDs UR_001–UR_032, roles y asignaciones. |
| `src/data/expedientes.mock.ts` | Datos de ejemplo: queue de mesa, expedientes, detalle. |
| `src/store/expedientes.store.ts` | Estado de expedientes + acciones. |
| `src/store/actividades.store.ts` | Estado del módulo de actividades del letrado. |
| `src/store/agenda.store.ts` | Vencimientos y eventos de agenda. |
| `src/store/ui.store.ts` | Usuario activo, sidebar, toasts. |
| `src/components/ui/` | Átomos: Badge, Button, Modal, Toast, FormField. |
| `src/components/layout/` | AppLayout, Sidebar, Topbar. |
| `src/components/expedientes/` | TablaExpedientes, FilaExpediente, FormularioDinamico. |
| `src/components/actividades/` | Timeline, ActividadCard, ChecklistPanel, NuevaActividad. |
| `src/pages/*/` | Una carpeta por página. `NombrePagina.page.tsx` + hooks locales. |
| `src/utils/format.ts` | formatFecha, formatMonto, numerador. |
| `src/utils/routing.ts` | Constantes de rutas + helper de accesos por rol. |
| `tailwind.config.ts` | Design system Sovereign Ledger. NO modificar tokens. |

> Cada subcarpeta tiene su propio CLAUDE.md con documentación
> específica. Leer el CLAUDE.md de la carpeta antes de modificarla.

## 4. Reglas de negocio — inamovibles

- **Único campo obligatorio al alta:** N° EE/Memo GDE. Todos los demás son opcionales.
- **SS = "Sin Siniestro"** en el campo N° Causa.
- **Numeración:** C-0001/2026 (Civil), L-0001/2026 (Laboral), P-0001/2026 (Penal).
- **Asignación Civil/Laboral:** FIFO secuencial por área (ver `usuarios.ts`).
- **Asignación Penal:** por línea ferroviaria (ver `usuarios.ts` → `lineasPenal`).
- **Edición de campos:** abogados y asistentes pueden editar TODOS los campos del expediente, incluidos los completados por Mesa.
- **sessionStorage:** único uso de storage permitido, exclusivamente para el usuario activo actual (continuidad entre navegación). Todo el resto del estado en Zustand (en memoria).
- Sin backend, sin AI, sin integración automática PJN/SIGEJ (fuera de scope v1).

## 5. Roles del sistema

| Rol en BD | Rol sistema | Permisos |
|-----------|-------------|----------|
| `gerente` | REFERENTE | Todo: dashboard, todas las áreas, auditoría |
| `abogado_coordinador` | COORDINADOR | Su área + bandeja + reportes |
| `abogado` / `abogada` | ABOGADO | Bandeja propia + su área. Edita todos los campos del expediente. |
| `asistente_jurídico` | ABOGADO | Igual que abogado (diferencia pendiente de definición). |
| `adm_mesa` | ADMINISTRATIVO | Mesa SIAJ solamente |
| `adm_mesa` + `asistente_jurídico` | ADMINISTRATIVO + ABOGADO | Caso especial multi-rol. Ve Mesa SIAJ + Mi Bandeja. |

> **Usuarios multi-rol:** el campo `roles: RolBD[]` en Usuario
> contiene todos los roles asignados. El sidebar muestra la unión
> de los ítems de nav de cada rol. Ver `src/data/CLAUDE.md`
> para la lista completa de casos multi-rol.

## 6. Design system — Sovereign Ledger

Los tokens están en `tailwind.config.ts`. No hardcodear colores hex en componentes.
Usar siempre clases Tailwind con los nombres de token: `bg-surface`, `text-on-surface-variant`, `border-outline-variant`, etc.

Fuentes: `font-headline` (Public Sans) para títulos. `font-body` (Inter) para datos.
Sombras: `.shadow-card` y `.shadow-card-lg` (definidas en `index.css`).

## 7. Convenciones de código

- Componentes: `PascalCase.tsx`
- Stores: `kebab-case.store.ts`
- Páginas: `NombrePagina.page.tsx` dentro de `src/pages/NombrePagina/`
- Datos mock: `kebab-case.mock.ts`
- Utils: `kebab-case.ts`
- Todo el texto visible al usuario: en español.
- No crear carpetas nuevas sin documentarlas en este archivo.

## 8. Agregar una página nueva

1. Crear `src/pages/NombrePagina/NombrePagina.page.tsx`
2. Agregar la ruta en `App.tsx`
3. Agregar ítem de nav en `Sidebar.tsx` con el rol correspondiente
4. Si necesita estado propio → hook `useNombrePagina.ts` en la misma carpeta

## 9. Agregar un campo al formulario

1. Agregar el campo en `src/data/formularios.ts` bajo el subtipo correspondiente
2. Si es un tipo nuevo → agregarlo a `TipoGestion` en `src/types/index.ts`
3. `FormularioDinamico.tsx` lo renderiza automáticamente

## 10. Checklist antes de entregar

- [ ] `npm run dev` sin errores de consola
- [ ] `npx tsc --noEmit` sin errores TypeScript
- [ ] Sin colores hex hardcodeados — solo tokens Tailwind
- [ ] Sin texto en inglés visible al usuario
- [ ] Datos mock coherentes con el dominio SIAJ
- [ ] Reglas de negocio de la Sección 4 respetadas
