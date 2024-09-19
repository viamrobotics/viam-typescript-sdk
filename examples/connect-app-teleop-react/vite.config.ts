import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const throwNotSet = (envVarKey: string): never => {
  throw new Error(`${envVarKey} not set`);
};

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  if (
    !(process.env.VITE_APP_API_KEY_ID && process.env.VITE_APP_API_KEY_SECRET) &&
    !process.env.VITE_AUTH_CLIENT_ID
  ) {
    throwNotSet(
      'VITE_APP_API_KEY_ID/VITE_APP_API_KEY_SECRET or VITE_AUTH_CLIENT_ID'
    );
  }

  return defineConfig({
    plugins: [react()],
  });
};
