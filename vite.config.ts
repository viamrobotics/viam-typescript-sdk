/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig } from 'vite';

import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
    __VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    minify: true,
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'sdk',
      fileName: (format) => `main.${format}.js`,
    },
  },
  test: {
    mockReset: true,
  },
});
