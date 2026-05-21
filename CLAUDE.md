# CLAUDE.md — SIAJ Frontend
# Sistema Integral de Asuntos Jurídicos — SOFSA / Trenes Argentinos

> Fuente de verdad para Claude Code. Leer completo antes de escribir código.

## 1. Stack

| Herramienta | Versión | Rol |
|-------------|---------|-----|
| React | 18 | UI |
| TypeScript | 5 | Lenguaje |
| Vite | 5 | Build / dev server (`npm run dev`) |
| Tailwind CSS | **4** | Estilos via `@tailwindcss/vite` — sin `tailwind.config.ts` |
| Zustand | 5 | Estado global |
| React Router | **v7** | Routing |
| **@heroicons/react** | 2 | Íconos — usar siempre `<Icon name="...">` de `src/components/ui/Icon.tsx` |
| @headlessui/react | 2 | Componentes accesibles (Dialog, Combobox) |
| react-toastify | 11 | Notificaciones — usar `toast.success/error/info()` directamente |

## 2. Levantar el proyecto

```bash
npm install
npm run dev                        # http://localhost:5173 (local / Vercel)
npm run build                      # build para Vercel (base: /)
npm run build -- --mode ghpages    # build para GH Pages (base: /siaj/)
bash deploy.sh                     # build + commit + push GH Pages automático
```

## 3. Mapa de archivos

| Carpeta / Archivo | Responsabilidad |
|-------------------|----------------|
| `src/types/index.ts` | Todos los tipos del dominio. Fuente de verdad de contratos. |
| `src/data/catalogos.ts` | TIPOS_GESTION, JUZGADOS, LINEAS, y todos los catálogos de dropdowns. |
| `src/data/formularios.ts` | Campos por subtipo (etapa mesa + etapa abogado). |
| `src/data/usuarios.ts` | Usuarios reales con IDs UR_001–UR_032, roles y asignaciones. |
| `src/data/expedientes.mock.ts` | Datos de ejemplo: queue de mesa, expedientes, detalle. |
| `src/data/estadosProcesales.ts` | Estados procesales por tipo + tareas estructuradas + cálculo de urgencia. |
| `src/store/expedientes.store.ts` | Estado de expedientes + acciones (incluye tareasMap). |
| `src/store/ui.store.ts` | Usuario activo, sidebar collapsed. |
| `src/components/ui/Icon.tsx` | Wrapper de heroicons. **Único lugar donde se usan íconos.** Ver ICON_MAP. |
| `src/components/ui/Badge.tsx` | AreaBadge, EstadoBadge. |
| `src/components/ui/Button.tsx` | Botón con variantes primary/ghost/danger. |
| `src/components/ui/Modal.tsx` | Modal genérico con header/footer/size. |
| `src/components/ui/FormField.tsx` | Campo de formulario con label/hint/error. |
| `src/components/layout/` | AppLayout, Sidebar, Topbar, UserSwitcher. |
| `src/components/expedientes/` | TablaExpedientes, FormularioDinamico. |
| `src/pages/*/` | Una carpeta por página. `NombrePagina.page.tsx` + hooks locales. |
| `src/utils/format.ts` | formatFecha, formatMonto, numerador. |
| `src/utils/routing.ts` | Constantes de rutas + helper de accesos por rol. |
| `vite.config.ts` | Base path según mode: `ghpages` → `/siaj/`, resto → `/`. |
| `vercel.json` | Rewrite SPA para Vercel. |
| `deploy.sh` | Script de deploy a GH Pages. |

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

## 6. Design system

Este branch usa **Tailwind CSS v4** sin archivo de configuración.
Los estilos se definen con clases Tailwind y colores hex del sistema Sovereign Ledger:

| Uso | Hex |
|-----|-----|
| Azul oscuro principal (textos, botones, fondos) | `#1b3a57` |
| Azul medio (textos secundarios, labels) | `#4a6a84` |
| Azul claro accent (badges, highlights, activos) | `#C4DFE8` |
| Azul topbar | `#63B2DA` |
| Gris claro (fondos neutros, filas) | `#e8e8e8` |
| Gris hover | `#f0f0f0` |

Usar estos hex directamente: `bg-[#1b3a57]`, `text-[#4a6a84]`, etc.

Fuentes: `font-headline` (Public Sans) para títulos. `font-body` (Inter) para datos.
Sombras: `.shadow-card` y `.shadow-card-lg` (definidas en `index.css`).
Clases de campo: `field-input`, `field-label`, `field-hint` (definidas en `index.css`).

### Íconos

Usar **siempre** el componente `<Icon name="..." size={N} className="..." />`.
Nunca usar `<span class="material-symbols-outlined">` ni SVG inline.
El ICON_MAP completo está en `src/components/ui/Icon.tsx`.

Para agregar un ícono nuevo: ver Sección 10.

### Notificaciones

```ts
import { toast } from 'react-toastify'
toast.success('Mensaje')
toast.error('Error')
toast.info('Info')
```

Nunca usar el componente `Toast.tsx` legacy ni `showToast` del store.

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

## 10. Agregar un ícono nuevo

1. Buscar el heroicon equivalente en `@heroicons/react/24/outline`
2. Importarlo en `src/components/ui/Icon.tsx`
3. Agregar la entrada en `ICON_MAP` con el nombre de Material Symbols como key
4. Usar `<Icon name="nombre_material" />` en los componentes

## 11. Checklist antes de entregar

- [ ] `npm run dev` sin errores de consola
- [ ] `npx tsc --noEmit` sin errores TypeScript
- [ ] Sin `material-symbols-outlined` en ningún `.tsx` — verificar con `grep -rn "material-symbols" src/`
- [ ] Sin tokens rotos — verificar con `grep -rn "bg-surface\|text-on-surface" src/`
- [ ] Todos los `<Icon name="...">` tienen entrada en ICON_MAP
- [ ] Sin texto en inglés visible al usuario
- [ ] Datos mock coherentes con el dominio SIAJ
- [ ] Reglas de negocio de la Sección 4 respetadas
