import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Default values
  const frontendPort = parseInt(env.VITE_PORT || '5173')
  const apiTarget = env.VITE_API_URL || 'http://localhost:3000'
  
  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  }
})