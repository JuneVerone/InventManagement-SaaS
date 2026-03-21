import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite is the dev server + build tool.
//
// The PROXY is the most important setting here for development.
// Problem:  React runs on port 5173, backend on port 3000.
//           Browsers block cross-origin requests (CORS) by default.
// Solution: Any request to /api/* from the React app is transparently
//           forwarded by Vite to http://localhost:3000.
//           The browser thinks everything is on the same origin — no CORS error.
//
// Example:
//   axios.post('/api/auth/login')
//   → Vite receives it on :5173
//   → forwards silently to http://localhost:3000/api/auth/login
//   → sends the response back to the browser
//   ✅ No CORS error, no hardcoded backend URL in your code

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})