import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e/tests',
  outputDir: 'e2e/artifacts',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
  },

  projects: [
    // only using chrome because firefox won't allow localhost CORS
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'make run-e2e-server & npm run e2e:test-harness',
    reuseExistingServer: false,
    url: `http://localhost:5173`,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
