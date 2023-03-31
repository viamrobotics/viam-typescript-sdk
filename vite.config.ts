import { defineConfig } from 'vite';
import path from 'node:path';
import dts from 'vite-plugin-dts';
import { include } from './etc/rollup_files.js'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [dts()],
  optimizeDeps: {
    include,
  },
  build: {
    commonjsOptions: {
      include: include.map((path: string) => new RegExp(path)),
    },
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
});
