import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@kronos/core': resolve(__dirname, '../../dist/libs/kronos-core/src/index.js')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
