# src/components/layout/ — Componentes de estructura

Arman el shell visual de la aplicación.
Todos leen de `useUIStore()` — no reciben estado de datos por props.

## Componentes

### AppLayout.tsx

Wrapper de página. Renderiza Sidebar + Topbar + contenido.
Deriva título y página activa del pathname actual.

```tsx
<AppLayout>
  <MiPaginaPage />
</AppLayout>
```

`PAGE_TITLES` y `PAGE_ACTIVE` mapean rutas → título/ítem activo del sidebar.
Las rutas de expediente y causa se detectan por `startsWith`.

### Sidebar.tsx

Navegación lateral colapsable. Lee `usuarioActivo` y filtra `NAV_ITEMS`
según `ROL_ACCESOS[rolSistema].navItems`.

- Colapsado: muestra solo íconos (w-16)
- Expandido: muestra ícono + label (w-64)
- Toggle: botón hamburguesa → `toggleSidebar()` en ui.store
- Abre `UserSwitcher` al hacer click en el avatar del usuario

### Topbar.tsx

Barra superior fija. Muestra título de página, nombre/rol del usuario activo
y campana de notificaciones (HU-05).

- Badge rojo con contador de no leídas
- Panel desplegable con lista de notificaciones del usuario activo
- Click en notificación → marca leída + navega al expediente
- Botón "Marcar todas como leídas"
- Botón × por notificación para descartar
- Cierra al hacer click fuera (mousedown listener)

Lee de `useNotificacionesStore()` y `useUIStore()`.

### UserSwitcher.tsx

Panel flotante para cambiar de usuario activo (solo desarrollo/demo).
Se abre desde el avatar en el Sidebar.

- Lista todos los usuarios agrupados por `rolSistema`
- Click en usuario → `setUsuarioActivo(id)` + toast de confirmación
- Cierra al hacer click fuera o al seleccionar usuario

## Reglas

- No importar datos de expedientes — solo ui.store y notificaciones.store
- El título de página lo resuelve AppLayout, no cada página
- Topbar recibe `titulo` y `subtitulo?` como props desde AppLayout
