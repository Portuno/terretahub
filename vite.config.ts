import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': { target: 'http://localhost:3001', changeOrigin: true },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // More granular code splitting for better caching and parallel loading
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                  return 'react-vendor';
                }
                if (id.includes('@supabase')) {
                  return 'supabase-vendor';
                }
                if (id.includes('lucide-react')) {
                  return 'lucide-vendor';
                }
                // Other vendor chunks
                return 'vendor';
              }
              // Split route-based chunks for better code splitting
              if (id.includes('PublicLinkBio') || id.includes('PublicProfile')) {
                return 'public-routes';
              }
              if (id.includes('Dashboard') || id.includes('CommunityPage') || id.includes('ProjectsPage')) {
                return 'main-routes';
              }
            }
          }
        },
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
