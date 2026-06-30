import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/thttt': {
        target: 'https://www.thttt.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/thttt/, '')
      }
    }
  }
}) 
