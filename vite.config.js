import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Served from a GitHub Pages subpath in production (https://<user>.github.io/jnt/),
// from root in dev. An explicit absolute base keeps the PWA scope/start_url correct.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/jnt/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'Jacked & Tan 2.0',
        short_name: 'J&T 2.0',
        description: 'GZCL Jacked & Tan 2.0 workout tracker',
        theme_color: '#c2410c',
        background_color: '#f5f6f8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
}))
