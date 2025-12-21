import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import VitePluginPrerender from 'vite-plugin-prerender'
import { prerenderRoutes } from './src/seo/routeMeta'

export default defineConfig({
  plugins: [
    react(),
    VitePluginPrerender({
      staticDir: 'dist',
      routes: prerenderRoutes,
      renderAfterDocumentEvent: 'app-rendered',
      minify: true,
      maxConcurrentRoutes: 4,
      timeout: 30000,
      postProcess: (context) => {
        // Ensure charset and viewport exist
        if (!context.html.includes('charset')) {
          context.html = context.html.replace('<head>', '<head><meta charset="utf-8">')
        }
        if (!context.html.includes('viewport')) {
          context.html = context.html.replace(
            '<head>',
            '<head><meta name="viewport" content="width=device-width, initial-scale=1">'
          )
        }
        return context
      }
    })
  ],
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
