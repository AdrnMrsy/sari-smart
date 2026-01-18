import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sari-Smart Price Book',
        short_name: 'SariSmart',
        description: 'Offline Price Search for Sari-Sari Stores',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png', // You'll add this later
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true // Allows us to test offline mode while coding
      }
    })
  ]
})