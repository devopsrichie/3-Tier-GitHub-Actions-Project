import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // In local dev, forward API calls to the Node backend
    proxy: { '/api': 'http://localhost:5000' },
  },
});
