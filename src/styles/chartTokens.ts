/**
 * ESPEJO EN JS DE LOS TOKENS DE index.css
 *
 * recharts recibe colores como props (fill/stroke), no como
 * clases, así que no puede leer las variables CSS. Estos valores
 * están DUPLICADOS a propósito.
 *
 * ⚠ Si cambiás un color acá, cambialo también en index.css
 *   (y en docs/siaj-theme.css). No hay chequeo automático.
 */
export const CHART_COLORS = {
  civil:   '#211c84',
  penal:   '#4d55cc',
  laboral: '#7a73d1',
  teal:    '#256386',
  navy:    '#242c4f',
  danger:  '#c3292f',
  success: '#267f33',
  warning: '#fdc84a',
  neutral: '#9aa6b2',
  ink:     '#404040',
  line:    '#bcc0c9',
} as const
