# SKILL.md — SIAJ Frontend
# Sistema Integral de Asuntos Jurídicos — SOFSA / Trenes Argentinos
# Para uso de Claude Code. Leer antes de cualquier tarea.

> Este archivo responde: ¿cómo hago X en este proyecto?
> Para reglas de negocio y arquitectura → leer CLAUDE.md

---

## Setup rápido

```bash
npm install
npm run dev     # http://localhost:5173
npx tsc --noEmit  # verificar tipos antes de commitear
```

---

## Recetas frecuentes

### Agregar una página nueva

1. Crear `src/pages/NombrePagina/NombrePagina.page.tsx`
2. Agregar la ruta en `src/App.tsx`:
   ```tsx
   <Route path="/ruta" element={<NombrePaginaPage />} />
   ```
3. Agregar el título en `AppLayout.tsx` (mapa pathname → título)
4. Si necesita estado propio → crear `useNombrePagina.ts` en la misma carpeta
5. Si debe aparecer en el sidebar → agregar en `Sidebar.tsx` con el rol correcto
6. Documentar en `src/pages/CLAUDE.md`

---

### Agregar un campo al formulario de Alta

1. Abrir `src/data/formularios.ts`
2. Encontrar el subtipo (ej: `DEMANDA_CIVIL`)
3. Agregar el campo al array `mesa` o `abogado` según corresponda:
   ```ts
   {
     id: 'mesa_nuevo_campo',   // prefijo mesa_ o abg_
     label: 'Label visible',
     type: 'text',             // ver TipoCampo en types/index.ts
     placeholder: '...',
     full: true,               // opcional: ocupa todo el ancho
   }
   ```
4. Si es un tipo nuevo → agregar a `TipoGestion` en `src/types/index.ts`
5. `FormularioDinamico.tsx` lo renderiza automáticamente

---

### Agregar un catálogo (dropdown con opciones fijas)

1. Abrir `src/data/catalogos.ts`
2. Agregar el array:
   ```ts
   export const NOMBRE_CATALOGO: CatalogoItem[] = [
     { id: 'CAT_001', label: 'Opción 1' },
     { id: 'CAT_002', label: 'Opción 2' },
   ]
   ```
3. Si el catálogo tiene datos adicionales → usar `CatalogoItemExtended`
4. Referenciar en el campo del formulario:
   ```ts
   options: NOMBRE_CATALOGO.map(c => ({ value: c.id, label: c.label }))
   ```
5. Documentar en `src/data/CLAUDE.md`

---

### Agregar un store nuevo

1. Crear `src/store/nombre-dominio.store.ts`
2. Seguir el patrón:
   ```ts
   import { create } from 'zustand'
   import type { MiTipo } from '../types'

   interface MiDominioState {
     items: MiTipo[]
     // acciones
     agregarItem: (item: MiTipo) => void
   }

   export const useMiDominioStore = create<MiDominioState>((set) => ({
     items: [],
     agregarItem: (item) => set(s => ({ items: [...s.items, item] })),
   }))
   ```
3. Si necesita datos iniciales → importar desde `src/data/`
4. Documentar en `src/store/CLAUDE.md`

---

### Agregar una acción a un store existente

1. Agregar la firma en la interfaz del store:
   ```ts
   nuevaAccion: (param: string) => void
   ```
2. Implementar en el `create()`:
   ```ts
   nuevaAccion: (param) => set(s => ({ ... })),
   ```
3. Nunca mutatar el estado directamente — siempre `set()`

---

### Abrir un modal

Los modales usan el componente `Modal` de `src/components/ui/Modal.tsx`.
Patrón estándar en cualquier página:

```tsx
const [modalAbierto, setModalAbierto] = useState(false)

// En el JSX:
<Button onClick={() => setModalAbierto(true)}>Abrir</Button>

<Modal
  open={modalAbierto}
  onClose={() => setModalAbierto(false)}
  titulo="Título del modal"
  size="md"
  footer={
    <>
      <Button variant="ghost" onClick={() => setModalAbierto(false)}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleGuardar}>
        Guardar
      </Button>
    </>
  }
>
  {/* contenido */}
</Modal>
```

---

### Filtrar expedientes con useMemo

Patrón estándar de filtrado reactivo:

```tsx
const [filtros, setFiltros] = useState({
  buscar: '', area: '', tipo: '', estado: '',
  fechaDesde: '', fechaHasta: '', letrado_id: '',
})

const expedientesFiltrados = useMemo(() => {
  return expedientes.filter(e => {
    if (filtros.area && e.area !== filtros.area) return false
    if (filtros.tipo && e.tipo !== filtros.tipo) return false
    if (filtros.estado && e.estado !== filtros.estado) return false
    if (filtros.letrado_id && e.abogado_id !== filtros.letrado_id) return false
    if (filtros.fechaDesde && e.fecha_recepcion < filtros.fechaDesde) return false
    if (filtros.fechaHasta && e.fecha_recepcion > filtros.fechaHasta) return false
    if (filtros.buscar) {
      const q = filtros.buscar.toLowerCase()
      if (!e.caratula.toLowerCase().includes(q) &&
          !e.id.toLowerCase().includes(q) &&
          !(e.numero_causa ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })
}, [expedientes, filtros])
```

---

### Mostrar un toast

```tsx
const { showToast } = useUIStore()

showToast('Expediente guardado correctamente.', 'success')
showToast('Error al procesar la solicitud.', 'error')
showToast('Cambios pendientes de guardar.', 'warn')
showToast('Procesando...', 'info')
```

---

### Navegar entre páginas

```tsx
import { useNavigate } from 'react-router-dom'
import { RUTAS } from '../utils/routing'

const navigate = useNavigate()

navigate(RUTAS.MESA)
navigate(RUTAS.EXPEDIENTE('C-0023/2026'))
navigate(RUTAS.ACTIVIDADES('C-0023/2026'))
navigate(-1)  // volver atrás
```

---

### Obtener el usuario activo

```tsx
const { usuarioActivo } = useUIStore()

// usuarioActivo puede ser null — siempre verificar
if (!usuarioActivo) return null

// Verificar rol
if (usuarioActivo.rolSistema === 'COORDINADOR') { ... }
if (usuarioActivo.rolSistema === 'REFERENTE') { ... }

// Nombre completo
import { getNombreCompleto } from '../data/usuarios'
getNombreCompleto(usuarioActivo)  // → "CASANO, Felix"
```

---

### Usar los componentes UI

```tsx
// Button
<Button variant="primary" icon="save" onClick={guardar}>Guardar</Button>
<Button variant="secondary" onClick={cancelar}>Cancelar</Button>
<Button variant="ghost" icon="delete">Eliminar</Button>
<Button variant="danger" loading={cargando}>Confirmar</Button>

// Badge
<EstadoBadge code="EN_TRAMITE" label="En trámite" />
<AreaBadge area="CIVIL" />
<RolBadge rol="COORDINADOR" />

// FormField
<FormField label="Carátula" required hint="Título del expediente">
  <input className="field-input" value={val} onChange={...} />
</FormField>

// Íconos (Material Symbols)
<span className="material-symbols-outlined">folder</span>
<span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>
  star
</span>
```

---

### Agregar un usuario multi-rol

Si un usuario nuevo tiene más de un rol:

1. Definir `rolBD` como el rol primario
   (el que determina la ruta de inicio)
2. Listar todos los roles en `roles[]`:
   ```ts
   {
     id: 'UR_XXX',
     rolBD: 'adm_mesa',                        // primario
     roles: ['adm_mesa', 'asistente_jurídico'], // todos
     rolSistema: mapRol('adm_mesa'),            // del primario
     ...
   }
   ```
3. El Sidebar calcula automáticamente la unión de nav items
4. Documentar el caso en `src/data/CLAUDE.md`

---

### Checklist antes de entregar

- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run dev` sin errores de consola
- [ ] Sin colores hex hardcodeados — solo tokens Tailwind
- [ ] Sin texto en inglés visible al usuario
- [ ] Datos mock coherentes con el dominio SIAJ
- [ ] Reglas de negocio de CLAUDE.md respetadas
- [ ] Commit con mensaje descriptivo en español o inglés técnico
