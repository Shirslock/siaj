# src/pages/ — Páginas de la aplicación

## Estructura de cada página

```
src/pages/NombrePagina/
  NombrePagina.page.tsx    ← componente principal
  useNombrePagina.ts       ← hook con lógica compleja (si aplica)
  tabs/                    ← si la página tiene tabs
    DatosTab.tsx
    TimelineTab.tsx
    ...
```

---

## Páginas implementadas

| Carpeta | Ruta | Roles | Estado |
|---------|------|-------|--------|
| `Dashboard/` | /dashboard | REFERENTE, COORDINADOR | ✓ |
| `MesaSaco/` | /mesa | ADMINISTRATIVO | ✓ filtros embebidos |
| `AltaExpediente/` | /mesa/alta | ADMINISTRATIVO | ✓ modal confirmación |
| `Actuaciones/` | /actuaciones | ABOGADO, COORDINADOR, REFERENTE | ✓ router por rol |
| `BandejaAbogado/` | /bandeja/abogado (alias→/actuaciones) | ABOGADO, COORDINADOR, REFERENTE | ✓ filtros Urgentes + Por vencer |
| `BandejaArea/` | /bandeja/area (alias→/actuaciones) | COORDINADOR, REFERENTE | ✓ filtros embebidos |
| `DetalleExpediente/` | /expediente/:id | ABOGADO, COORDINADOR, REFERENTE | ✓ 6 tabs |
| `CausaDetalle/` | /causa/* | ABOGADO, COORDINADOR, REFERENTE | ✓ 4 tabs |
| `Actividades/` | /expediente/:id/actividades | ABOGADO, COORDINADOR, REFERENTE | carpeta vacía |
| `Agenda/` | /agenda | ABOGADO, COORDINADOR, REFERENTE | pendiente |

---

## Tabs de DetalleExpediente

| Tab | Archivo | Estado |
|-----|---------|--------|
| Datos | DatosTab.tsx | ✓ edición completa |
| Timeline | TimelineTab.tsx | ✓ tareas + actividades genéricas |
| Intervinientes | IntervinientesTab.tsx | ✓ CRUD |
| Documentos | DocumentosTab.tsx | ✓ botón carga |
| Previsión | PrevisionTab.tsx | ✓ mock SIGEJ |
| Vinculados | VinculosTab.tsx | ✓ modal vincular |

---

## Filtros embebidos — patrón estándar

Todas las tablas con filtros usan thead de 2 filas:

```tsx
<thead>
  {/* Fila 1: labels */}
  <tr className="border-b border-[rgba(0,0,0,0.08)] bg-[#f9f9f9]">
    <th className="px-3 py-2.5 text-left text-[10px] font-black
      uppercase tracking-widest text-[#4a6a84]">
      Columna
    </th>
  </tr>
  {/* Fila 2: inputs */}
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

## Reglas

1. El componente de página lee del store — no recibe props de datos
2. Navegación: `useNavigate()` + constantes `RUTAS` de `utils/routing.ts`
3. Lógica compleja → extraer a hook local en la misma carpeta
4. Tabs de DetalleExpediente reciben `exp: Expediente` como prop
5. Toda página muestra spinner/mensaje si los datos son null

## Patrón mínimo

```tsx
import { useExpedientesStore } from '../../store/expedientes.store'
import { useUIStore } from '../../store/ui.store'
import { useNavigate } from 'react-router-dom'
import { RUTAS } from '../../utils/routing'
import { toast } from 'react-toastify'

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
