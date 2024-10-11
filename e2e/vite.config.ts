/// <reference types="vitest" />
import { defineConfig } from 'vite';

import pkg from '../package.json';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
    __VERSION__: JSON.stringify(pkg.version),
  },
});
