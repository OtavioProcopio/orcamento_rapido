import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Caminho base do deploy (ex.: "/orcamento_rapido/" para um GitHub Pages de
// projeto). Fica "/" por padrão para dev local e para um domínio próprio.
const basePath = process.env.VITE_APP_BASE || '/'

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  define: {
    __APP_BASENAME__: JSON.stringify(basePath),
  },
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('/lucide-react/') || id.includes('/lucide/')) {
            return 'icons-vendor'
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react-vendor'
          }

          if (id.includes('/react-router/') || id.includes('/react-router-dom/')) {
            return 'router-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
