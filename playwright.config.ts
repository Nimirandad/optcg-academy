import { defineConfig, devices } from '@playwright/test';

// `E2E_PORT` permite probar mientras `npm run dev` ocupa el puerto habitual.
const port = Number(process.env.E2E_PORT) || 4321;
const baseURL = `http://localhost:${port}/optcg-academy/`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  // `channel: 'chromium'` usa el navegador completo; no requiere el headless shell.
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], channel: 'chromium' } },
    {
      name: 'movil-320',
      use: { ...devices['Desktop Chrome'], channel: 'chromium', viewport: { width: 320, height: 640 }, hasTouch: true },
    },
  ],
  webServer: {
    // `--ignore-lock` mantiene el servidor en primer plano; Astro lo envía a segundo plano si detecta un agente.
    command: `npm run build && npm run preview -- --port ${port} --ignore-lock`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
