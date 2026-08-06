import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '../../../node_modules/.vite/lesson-22-agui-frontend',
  plugins: [react()],
})
