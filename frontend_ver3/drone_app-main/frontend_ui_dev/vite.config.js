import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 빌드 설정 - 백엔드에서 서빙할 수 있도록 dist 폴더로 출력
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  },

  // 개발 서버 설정 - API 요청을 백엔드로 프록시
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
