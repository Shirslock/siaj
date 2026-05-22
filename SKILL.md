# SKILL.md — SIAJ Frontend
# Sistema Integral de Asuntos Jurídicos — SOFSA / Trenes Argentinos
# Stack: React 18 + TypeScript 5 + Vite 5 + Tailwind v4 + Zustand + Headless UI + Heroicons

> Responde: ¿cómo hago X en este proyecto?
> Para reglas de negocio y arquitectura → leer CLAUDE.md

---

## Setup rápido

```bash
npm install
npm run dev          # http://localhost:5173
npx tsc --noEmit     # verificar tipos
npm run build        # build producción
./deploy.sh          # deploy a GH Pages (buildea con /siaj/ y commitea en raíz)
```

---

## Recetas frecuentes

### Agregar un ícono nuevo

1. Buscar el equivalente en https://heroicons.com (usar outline)
2. Agregar import en `src/components/ui/Icon.tsx`:
   ```ts
   import { NuevoIcon } from '@heroicons/react/24/outline'
   ```
3. Agregar en ICON_MAP:
   ```ts
   nombre_material_symbol: NuevoIcon,
   ```
4. Usar en cualquier componente:
   ```tsx
   <Icon name="nombre_material_symbol" size={20} />
   ```

---

### Agregar una página nueva

1. Crear `src/pages/NombrePagina/NombrePagina.page.tsx`
2. Agregar ruta en `src/App.tsx`:
   ```tsx
   <Route path="/ruta" element={<NombrePaginaPage />} />
   ```
3. Agregar título en `AppLayout.tsx` (mapa pathname → título)
4. Si aparece en sidebar → agregar en `Sidebar.tsx` con rol correcto
5. Documentar en `src/pages/CLAUDE.md`

---

### Agregar un campo al formulario de Alta

1. Abrir `src/data/formularios.ts`
2. Encontrar el subtipo (ej: DEMANDA_CIVIL)
3. Agregar al array `mesa` o `abogado`:
   ```ts
   { id: 'mesa_nuevo', label: 'Label', type: 'text', full: true }
   ```
4. FormularioDinamico.tsx lo renderiza automáticamente

---

### Agregar un catálogo

1. Abrir `src/data/catalogos.ts`
2. Agregar el array:
   ```ts
   export const NUEVO_CATALOGO: CatalogoItem[] = [
     { id: 'CAT_001', label: 'Opción 1' },
   ]
   ```
3. Referenciar en el campo con `options: NUEVO_CATALOGO.map(...)`

---

### Agregar una acción al store

```ts
// 1. Agregar firma en la interfaz
nuevaAccion: (param: string) => void

// 2. Implementar — siempre inmutable con spread
nuevaAccion: (param) => set(s => ({
  expedientes: s.expedientes.map(e =>
    e.id === param ? { ...e, campo: valor } : e
  )
}))
```

---

### Abrir un modal

```tsx
const [open, setOpen] = useState(false)

<Button onClick={() => setOpen(true)}>Abrir</Button>

<Modal open={open} onClose={() => setOpen(false)}
  titulo="Título" size="md"
  footer={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleGuardar}>
        Guardar
      </Button>
    </>
  }>
  {/* contenido */}
</Modal>
```

---

### Mostrar un toast

```ts
import { toast } from 'react-toastify'

toast.success('Guardado correctamente.')
toast.error('Error al procesar.')
toast.warn('Cambios pendientes.')
toast.info('Procesando...')
```

---

### Filtros embebidos en tabla

```tsx
<thead>
  <tr className="border-b border-[rgba(0,0,0,0.08)] bg-[#f9f9f9]">
    <th className="px-3 py-2.5 text-[10px] font-black uppercase
      tracking-widest text-[#4a6a84] text-left">
      Columna
    </th>
  </tr>
  <tr className="border-b-2 border-[rgba(0,0,0,0.10)] bg-[#f5f5f5]">
    <th className="px-2 py-1.5">
      <input className="w-full px-2 py-1.5 text-xs border
        border-[rgba(0,0,0,0.15)] rounded-md bg-white
        text-[#1b3a57] placeholder-[#a0b0bc]
        focus:outline-none focus:border-[#1b3a57]"
        placeholder="..." />
    </th>
  </tr>
</thead>
```

---

### Navegar entre páginas

```tsx
import { useNavigate } from 'react-router-dom'
import { RUTAS } from '../utils/routing'

const navigate = useNavigate()
navigate(RUTAS.MESA)
navigate(RUTAS.EXPEDIENTE('C-0023/2026'))
navigate(-1)
```

---

### Obtener usuario activo

```tsx
const { usuarioActivo } = useUIStore()
if (!usuarioActivo) return null

usuarioActivo.rolSistema      // 'COORDINADOR' | 'ABOGADO' | etc.
usuarioActivo.rolBD           // 'abogado_coordinador' | 'gerente' | etc.

import { puedeReasignar, getNombreCompleto } from '../data/usuarios'
puedeReasignar(usuarioActivo) // → true solo si abogado_coordinador
getNombreCompleto(usuarioActivo) // → 'CASANO, Felix'
```

---

## Checklist antes de entregar

- [ ] npx tsc --noEmit sin errores
- [ ] npm run build sin errores
- [ ] Sin corchetes [nombre] — todos los íconos en Icon.tsx
- [ ] Sin tokens v3 (bg-surface, text-on-surface, etc.)
- [ ] Sin texto en inglés visible al usuario
- [ ] Toasts con toast.* no showToast
- [ ] Reglas de negocio de CLAUDE.md respetadas
