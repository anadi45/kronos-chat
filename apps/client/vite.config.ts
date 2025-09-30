import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@quark/core': resolve(__dirname, '../../libs/quark-core/src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  // Disable Vite's dependency pre-bundling cache for fresh builds
  optimizeDeps: {
    force: true
  },
  // Clear cache on each build
  clearScreen: false
})
