# src/pages/ — Páginas de la aplicación

## Estructura de cada página

```
src/pages/NombrePagina/
  NombrePagina.page.tsx    ← componente principal (siempre)
  useNombrePagina.ts       ← hook con lógica compleja (si aplica)
  tabs/                    ← subcarpeta si la página tiene tabs
    DatosTab.tsx
    TimelineTab.tsx
    ...
```

---

## Páginas implementadas

| Carpeta | Ruta | Roles | Estado |
|---------|------|-------|--------|
| `Dashboard/` | /dashboard | REFERENTE, COORDINADOR | ✓ |
| `MesaSaco/` | /mesa | ADMINISTRATIVO | ✓ |
| `AltaExpediente/` | /mesa/alta | ADMINISTRATIVO | ✓ |
| `BandejaAbogado/` | /bandeja/abogado | ABOGADO, COORDINADOR, REFERENTE | ✓ |
| `BandejaArea/` | /bandeja/area | COORDINADOR, REFERENTE | ✓ |
| `DetalleExpediente/` | /expediente/:id | ABOGADO, COORDINADOR, REFERENTE | ✓ |
| `CausaDetalle/` | /causa/* | ABOGADO, COORDINADOR, REFERENTE | ✓ |
| `Actividades/` | /expediente/:id/actividades | ABOGADO, COORDINADOR, REFERENTE | ✓ |
| `Agenda/` | /agenda | ABOGADO, COORDINADOR, REFERENTE | pendiente |

---

## Reglas

1. El componente de página lee del store — no recibe props de datos
2. La navegación usa `useNavigate()` + constantes de `RUTAS` en `utils/routing.ts`
3. Si la página tiene más de ~150 líneas de lógica → extraer a un hook
4. Los tabs de DetalleExpediente reciben `exp: Expediente` como prop
5. Toda página muestra un estado de carga si los datos son null

## Patrón mínimo de una página

```tsx
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { useNavigate } from 'react-router-dom'
import { RUTAS } from '../../utils/routing'

export default function MiPaginaPage() {
  const navigate = useNavigate()
  const { usuarioActivo } = useUIStore()
  const { expedientes } = useExpedientesStore()

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* contenido */}
    </div>
  )
}
```
