/// <reference types="vitest" />
import { defineWorkspace } from 'vitest/config';
import pkg from './package.json';

export default defineWorkspace([
  {
    define: {
      __VERSION__: JSON.stringify(pkg.version),
    },
    test: {
      name: 'e2e-node',
      include: ['e2e/tests/**/*.node.spec.ts'],
      globalSetup: ['./e2e/helpers/global-setup.ts'],
      setupFiles: ['./e2e/helpers/node-setup.ts'],
      environment: 'node',
    },
  },
  {
    define: {
      __VERSION__: JSON.stringify(pkg.version),
    },
    test: {
      name: 'unit',
      include: ['src/**/*.spec.ts'],
      environment: 'node',
      mockReset: true,
    },
  },
]);
