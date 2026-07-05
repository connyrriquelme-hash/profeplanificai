import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-vendor': ['jspdf', 'html2canvas'],
          'tiptap-vendor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-highlight', '@tiptap/extension-text-align', '@tiptap/extension-underline'],
          'pptx-vendor': ['pptxgenjs'],
          'xlsx-vendor': ['xlsx'],
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
