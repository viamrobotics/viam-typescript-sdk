import { defineConfig, devices } from '@playwright/test';
import url from 'node:url';
import path from 'node:path';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './e2e/tests',
  testMatch: ['**/*.browser.spec.ts'],
  outputDir: 'e2e/artifacts',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI === undefined ? 0 : 1,
  timeout: 30_000,
  globalSetup: path.resolve(dirname, './e2e/helpers/global-setup.ts'),
  reporter: [['html', { open: 'never' }]],

  // Run tests serially to avoid port conflicts
  workers: 1,

  webServer: {
    command: 'npm run e2e:test-harness',
    url: 'http://localhost:5173',
    reuseExistingServer: process.env.CI === undefined,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace:
      process.env.CI === undefined ? 'retain-on-failure' : 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
