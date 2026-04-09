import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Increase chunk size warning limit to 1000 kB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and smaller initial bundles
        manualChunks: {
          // React and core dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // CodeMirror and editor dependencies
          'editor-vendor': [
            '@codemirror/lang-javascript',
            '@codemirror/lang-json', 
            '@codemirror/lang-markdown',
            '@codemirror/lang-xml',
            '@uiw/react-codemirror',
            'react-codemirror-merge'
          ],
          
          // Mermaid (large diagram library)
          'mermaid-vendor': ['mermaid'],
          
          // Markdown processing
          'markdown-vendor': [
            'react-markdown',
            'rehype-raw',
            'remark-gfm'
          ],
          
          // TanStack Query
          'query-vendor': [
            '@tanstack/react-query',
            '@tanstack/react-query-persist-client',
            '@tanstack/query-sync-storage-persister'
          ],
          
          // UI and utility libraries
          'ui-vendor': [
            'lucide-react',
            'date-fns',
            'lz-string',
            'react-json-view-lite'
          ]
        }
      }
    }
  },
  server: {
    proxy: {
      '/api/quote': {
        target: 'https://zenquotes.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quote/, '/api/today'),
      },
      '/api/github': {
        target: 'https://api.github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/github/, ''),
      },
    },
  },
})
