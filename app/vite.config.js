import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' = los archivos se buscan con rutas relativas, así anda en GitHub Pages (en una subcarpeta).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
  build: { outDir: 'dist', chunkSizeWarningLimit: 900 },
});
