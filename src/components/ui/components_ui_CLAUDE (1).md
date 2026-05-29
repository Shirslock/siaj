# src/components/ui/ — Componentes atómicos

Sin lógica de negocio. 100% reutilizables.

---

## Icon ← CRÍTICO

Wrapper central de íconos. SIEMPRE usar este componente.
Nunca usar `<span className="material-symbols-outlined">` — esos no existen más.

```tsx
import Icon from './Icon'

<Icon name="folder" size={20} className="text-[#1b3a57]" />
<Icon name="close" size={16} className="text-[#4a6a84]" />
<Icon name="refresh" size={20} className="animate-spin" />
```

Si aparece `[nombre]` en corchetes → falta en ICON_MAP de Icon.tsx.
Agregar:
1. Import del Heroicon correspondiente desde `@heroicons/react/24/outline`
2. Entrada en ICON_MAP: `nombre_material_symbol: HeroIconComponent`

Íconos mapeados actualmente (44+):
add, add_circle, add_link, arrow_back, arrow_forward, article,
assign_file, attach_file, check, check_circle, chevron_right,
close, construction, create_new_folder, delete, description,
download, edit, filter_alt_off, folder, folder_off, folder_open,
folder_shared, forward, gavel, history, inbox, info, link,
link_off, menu, menu_open, more_vert, notifications_none,
open_in_new, person_add, picture_as_pdf, refresh, save,
schedule, search, search_off, subdirectory_arrow_right,
swap_horiz, timeline, unfold_less, unfold_more, upload_file,
visibility, warning

---

## Button

```tsx
<Button variant="primary" icon="save" onClick={fn}>Guardar</Button>
<Button variant="secondary" onClick={fn}>Cancelar</Button>
<Button variant="ghost" icon="delete">Eliminar</Button>
<Button variant="danger" loading={true}>Confirmando...</Button>
```

Colores:
- primary: bg-[#1b3a57] text-white
- secondary: bg-white border text-[#1b3a57]
- ghost: text-[#1b3a57] hover:bg-[#E5E5E5]
- danger: bg-[#b91c1c] text-white

---

## Modal (Headless UI)

```tsx
<Modal
  open={bool}
  onClose={fn}
  titulo="Título"
  size="md"           // sm | md | lg | xl
  footer={<>          // botones de acción
    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
    <Button variant="primary" onClick={fn}>Confirmar</Button>
  </>}
>
  {/* contenido */}
</Modal>
```

Cierra con ESC y click en overlay automáticamente.

---

## Badge

```tsx
<EstadoBadge code="EN_TRAMITE" label="En trámite" />
<AreaBadge area="CIVIL" />
<RolBadge rol="COORDINADOR" />
```

---

## FormField

```tsx
<FormField label="N° de Causa" required hint="SS = Sin Siniestro"
  error={errors.causa} full={true}>
  <input className="field-input" ... />
</FormField>
```

Clases disponibles en index.css:
- `field-input` — input/select/textarea estándar
- `field-label` — label (FormField lo aplica automáticamente)
- `field-hint` — texto de ayuda

---

## Toasts

NO hay componente Toast propio. Usar react-toastify directamente:
```ts
import { toast } from 'react-toastify'
toast.success('Guardado.') | toast.error('Error.') | toast.warn('...') | toast.info('...')
```
ToastContainer está en main.tsx — no renderizar en otros lugares.
