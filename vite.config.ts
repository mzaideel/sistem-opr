
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Menggunakan path relatif supaya berfungsi di GitHub Pages sub-directory
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
