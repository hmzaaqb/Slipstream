import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// Alpaca's brokerage API does not send permissive CORS headers, so the browser
// cannot call it directly. During `vite dev` / `vite preview` we proxy through
// the dev server: requests to `/alpaca/*` are forwarded to the paper-trading
// host with the Origin stripped. See src/alpaca.js for the client side.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/alpaca': {
        target: 'https://paper-api.alpaca.markets',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/alpaca/, ''),
      },
    },
  },
  preview: {
    proxy: {
      '/alpaca': {
        target: 'https://paper-api.alpaca.markets',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/alpaca/, ''),
      },
    },
  },
})
