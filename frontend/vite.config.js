import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    }
  };
});
