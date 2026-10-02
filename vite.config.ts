import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { prerenderAnswerPages } from './vite-plugin-prerender-pages';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), prerenderAnswerPages()],
      define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Deja que Vite/Rollup gestionen los chunks automáticamente
        chunkSizeWarningLimit: 600,
        // Optimize chunk loading
        cssCodeSplit: true,
        // Enable source maps only in development
        sourcemap: false,
        // Use esbuild for minification (faster and included with Vite)
        minify: 'esbuild',
        // Optimize CSS
        cssMinify: true
      }
    };
});
