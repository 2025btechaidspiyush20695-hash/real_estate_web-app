import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // './' makes asset URLs relative — admin works both at dev root
  // (localhost:5174) AND under the /admin path in production.
  base: './',
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
