import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // mode 'ghpages' → build con base /siaj/ (deploy.sh)
  // cualquier otro mode (production, development) → base / (Vercel, dev local)
  base: mode === 'ghpages' ? '/siaj/' : (process.env.VITE_BASE_PATH ?? '/'),
}))
