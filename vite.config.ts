import { defineConfig } from 'vite';
import path from 'node:path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [dts()],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [
        /google-protobuf/,
        /@improbable-eng\/grpc-web/,
        /gen\//,
      ]
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
