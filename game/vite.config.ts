import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Relative paths for deployment
  build: {
    assetsInlineLimit: 0, // Don't inline assets
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
          pixiSound: ['@pixi/sound']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})