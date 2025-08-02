// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/public/apps/To-Do-List/', // Must match the exact subdirectory path
  root: 'src',
  build: {
    outDir: '../dist'
  }
});
