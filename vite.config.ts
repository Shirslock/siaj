import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // mode 'ghpages' → build con base /siaj/ (deploy.sh)
  // cualquier otro mode (production, development) → base / (Vercel, dev local)
  base: mode === 'ghpages' ? '/siaj/' : (process.env.VITE_BASE_PATH ?? '/'),
  // Dev local: `npm run dev` sirve el frontend directo (sin depender de
  // `vercel dev`, que venía fallando para esto) y proxea /api/* hacia una
  // instancia separada de `vercel dev --listen 3001` que sirve solo las
  // funciones serverless. Ver docs/ASISTENTE_IA.md.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}))
