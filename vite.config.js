import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-48x48.png', 'icons/apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'LinenLuxe Laundry',
        short_name: 'LinenLuxe',
        description: 'Premium pickup & delivery laundry and dry-cleaning in Al Furjan, Dubai.',
        theme_color: '#0a1a3a',
        background_color: '#0a1a3a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        icons: [
          { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the build (offline shell) + runtime-cache the service images.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        // Don't let the SPA fallback hijack direct file links (e.g. the price-list
        // PDF) — any path ending in a file extension is excluded.
        navigateFallbackDenylist: [/\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/images/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'linenluxe-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        // Keep the service worker OFF during `npm run dev` so testing always loads
        // the latest code (no stale cached bundle). The PWA still works fully in a
        // production build (`npm run build` + `npm run preview`) or when deployed.
        enabled: false,
        type: 'module',
      },
    }),
  ],
  server: {
    port: Number(process.env.PORT) || 5173,
    open: false,
  },
})
