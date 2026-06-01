# src/components/expedientes/ — Componentes de expedientes

Componentes reutilizables específicos del dominio de expedientes.
Sin lógica de negocio propia — reciben datos por props.

## Componentes

### TablaExpedientes.tsx

Tabla genérica para mostrar listas de expedientes.

```tsx
<TablaExpedientes expedientes={lista} compact={false} />
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `expedientes` | `Expediente[]` | — | Lista a mostrar |
| `compact` | `boolean` | `false` | Oculta columnas Tipo y Letrado/a |

- Click en fila → navega a `RUTAS.EXPEDIENTE(id)`
- Estado vacío: muestra mensaje "No hay expedientes para mostrar."
- Modo compact: usado en CausaDetalle donde tipo y letrado son redundantes

### FormularioDinamico.tsx

Renderiza campos de formulario a partir de definiciones `CampoFormulario[]`.
Usado en AltaExpediente y DetalleExpediente para campos mesa/abogado.

```tsx
<FormularioDinamico
  campos={camposDelTipo}
  valores={formState}
  onChange={(id, valor) => setForm(p => ({ ...p, [id]: valor }))}
/>
```

Tipos de campo soportados: `text`, `textarea`, `select`, `date`, `checkbox`.
Catálogos especiales: JUZGADOS y LINEAS_FERROVIARIAS se inyectan automáticamente
cuando `campo.catalogKey` coincide.

Los campos con `dependsOn` se ocultan si el campo del que dependen está vacío.

## Reglas

- No leer del store directamente — recibir datos por props
- No navegar internamente salvo TablaExpedientes (click en fila)
- Definiciones de campos viven en `src/data/formularios.ts`
