import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Saat development lokal (npm run dev), teruskan panggilan /api ke
      // `vercel dev` (jalankan di terminal terpisah di port 3000) supaya
      // serverless functions di folder /api ikut berfungsi.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
