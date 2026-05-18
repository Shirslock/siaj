# src/components/ui/ — Componentes atómicos

Estos componentes son los bloques básicos de la UI.
No contienen lógica de negocio. Son 100% reutilizables.

---

## Button

```tsx
<Button
  variant="primary"    // primary | secondary | ghost | danger
  size="md"            // sm | md | lg
  icon="save"          // ícono Material Symbols (izquierda)
  iconRight="chevron_right"  // ícono derecha (opcional)
  loading={false}      // muestra spinner, deshabilita click
  disabled={false}
  onClick={fn}
  type="button"        // button | submit
>
  Texto del botón
</Button>
```

---

## Badge

```tsx
// Estado del expediente
<EstadoBadge code="EN_TRAMITE" label="En trámite" />

// Área
<AreaBadge area="CIVIL" />     // bg azul
<AreaBadge area="LABORAL" />   // bg celeste
<AreaBadge area="PENAL" />     // bg gris

// Rol de usuario
<RolBadge rol="COORDINADOR" />
```

Estados mapeados en EstadoBadge:
EN_TRAMITE, EN_PLAZO_CONTESTAR, SUSPENSION_TERMINOS, EN_PRUEBA,
PENDIENTE_GDE, CUMPLIDO, ARCHIVADO, PENDIENTE, URGENTE,
EN_TRAMITE_PENAL, SOLICITUD_INFORMACION, EN_ANALISIS, y más.

---

## Modal

```tsx
<Modal
  open={bool}
  onClose={fn}
  titulo="Título"
  size="md"           // sm | md | lg | xl
  footer={<>...</>}   // opcional — botones de acción
>
  {/* contenido del modal */}
</Modal>
```

Cierra automáticamente con ESC y click en overlay.

---

## FormField

Wrapper para inputs con label, hint y error:

```tsx
<FormField
  label="N° de Causa"
  required={true}
  hint="SS = Sin Siniestro"
  error={errors.causa}
  full={true}    // col-span-2 en grid de 2 columnas
>
  <input className="field-input" ... />
</FormField>
```

Clases de input disponibles (definidas en index.css):
- `field-input`  → input/select/textarea estándar
- `field-label`  → label estándar (ya lo aplica FormField)
- `field-hint`   → texto de ayuda

---

## Toast

Se muestra automáticamente desde ui.store.
No renderizar manualmente — ya está en App.tsx.
Usar `showToast(mensaje, tipo)` desde el store.

---

## Íconos (Material Symbols)

```tsx
// Outlined (default)
<span className="material-symbols-outlined">folder</span>

// Filled
<span className="material-symbols-outlined"
  style={{ fontVariationSettings: "'FILL' 1" }}>
  star
</span>

// Tamaño: controlar con text-sm, text-base, text-lg, text-2xl, etc.
```

Íconos más usados en SIAJ:
folder, folder_open, description, gavel, work, inbox,
dashboard, add, edit, save, delete, close, check,
search, filter_alt_off, more_vert, chevron_right,
expand_more, unfold_more, unfold_less, link, link_off,
attach_file, upload_file, download, visibility,
notifications, warning, error, info, check_circle,
person, group, hub, history, checklist, schedule,
directions_railway, swap_horiz, menu, menu_open
