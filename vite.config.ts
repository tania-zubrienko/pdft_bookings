import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/pdft_bookings/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
