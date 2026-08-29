import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Bind explícito a 127.0.0.1 (en vez de localhost, que puede resolver a ::1):
  // en Windows, el bind a loopback IPv6 puede fallar con EACCES por
  // firewall/antivirus. No afecta el comportamiento en otros sistemas.
  server: { host: '127.0.0.1' },
})
