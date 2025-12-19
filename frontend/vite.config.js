import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('react-helmet')) {
              return 'react-vendor'
            }
            if (id.includes('@supabase')) {
              return 'supabase'
            }
            if (id.includes('react-quill') || id.includes('quill')) {
              return 'editor-vendor'
            }
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 500,
    target: 'esnext',
    sourcemap: false,
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
    // Mobile optimization
    commonjsOptions: {
      sourceMap: false
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    headers: {
      'Cache-Control': 'public, max-age=3600, must-revalidate'
    }
  },
  // Optimize for production
  optimizeDeps: {
    exclude: ['react-quill']
  }
})
