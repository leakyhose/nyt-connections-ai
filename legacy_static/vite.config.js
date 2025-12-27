import { defineConfig } from 'vite'

export default defineConfig({
  base: '/nyt-connections-ai/',
  
  publicDir: 'public',
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    assetsInlineLimit: 4096,
    copyPublicDir: true,
  },
  
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  
  preview: {
    port: 4173,
    open: true,
  }
})
