import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    // 127.0.0.1, no localhost: coincide con CORS_ORIGIN por defecto del
    // backend (ver server/README-BACKEND.md) — con localhost el fetch desde
    // el navegador queda bloqueado por CORS (origen distinto), y la UI lo
    // muestra como "No hay usuarios activos disponibles" en vez de un error
    // de red explícito, porque useHotelState atrapa el fetch fallido y solo
    // deja `users` en [] (ver LogPanel, que sí registra el error de conexión).
    baseURL: 'http://127.0.0.1:5173',
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'node index.js',
      cwd: './server',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
