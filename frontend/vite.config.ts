import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'logo-mark.png'],
      manifest: {
        name: 'NjangiFlow AI',
        short_name: 'Njangi',
        description: 'Smart njangi and community-finance management',
        theme_color: '#0b1736',
        background_color: '#f6f9fc',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/logo-mark.png', sizes: '135x150', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { cleanupOutdatedCaches: true, navigateFallback: '/' },
    }),
  ],
})
