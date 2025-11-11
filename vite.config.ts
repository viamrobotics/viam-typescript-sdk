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
    rollupOptions: {
      onwarn: (warning, warn) => {
        if (warning.code === 'EVAL') {
          return;
        }
        warn(warning);
      },
    },
  },
  test: {
    reporters: [['html', { outputFile: './vitest-report/index.html' }]],
    include: ['src/**/*.spec.ts'],
    environment: 'happy-dom',
    mockReset: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/e2e/**',
    ],
  },
});
