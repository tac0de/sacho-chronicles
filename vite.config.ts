import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // GitHub Pages 정적 배포 호환 상대 경로
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
