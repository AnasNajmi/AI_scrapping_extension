import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'public/index.html'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.tsx'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'content.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'sidepanel') {
            return 'sidepanel.js';
          }
          return '[name].js';
        },
      },
    },
    outDir: 'dist',
  },
});