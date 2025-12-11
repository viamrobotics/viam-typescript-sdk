/// <reference types="vitest" />
import { defineConfig } from 'vite';

import pkg from '../package.json';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
    __VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    reporters: [
      ['verbose', { outputFile: './vitest-e2e-report/index.html' }],
      'default',
    ],
    include: ['e2e/tests/**/*.node.spec.ts'],
    globalSetup: ['./e2e/helpers/global-setup.ts'],
    setupFiles: ['./e2e/helpers/node-setup.ts'],
    environment: 'node',
    teardownTimeout: 10_000,
    // Retry failed tests in CI to handle timing issues
    retry: process.env.CI === undefined ? 0 : 2,
  },
});
