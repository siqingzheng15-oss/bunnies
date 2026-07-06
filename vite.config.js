import { defineConfig } from 'vite'

export default defineConfig({
  base: '/bunnies/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: true
  },
  build: {
    outDir: 'dist'
  }
})
