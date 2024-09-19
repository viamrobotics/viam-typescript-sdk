export interface BuildEnvironment {
  baseUri: string;
  isDev: boolean;
  auth:
    | { case: 'api_key'; apiKeyId: string; apiKeySecret: string }
    | { case: 'third_party'; clientId: string };
}

let env: BuildEnvironment | undefined;

// import.meta.env is validated at build time in vite.config.ts
export const getEnv = (): BuildEnvironment => {
  if (env) {
    return env;
  }
  const buildEnv = {
    baseUri: !import.meta.env.VITE_BASE_URI
      ? 'http://localhost:9000'
      : import.meta.env.VITE_BASE_URI,
    isDev: import.meta.env.DEV,
  } as BuildEnvironment;

  if (
    import.meta.env.VITE_APP_API_KEY_ID &&
    import.meta.env.VITE_APP_API_KEY_SECRET
  ) {
    buildEnv.auth = {
      case: 'api_key',
      apiKeyId: import.meta.env.VITE_APP_API_KEY_ID,
      apiKeySecret: import.meta.env.VITE_APP_API_KEY_SECRET,
    };
  } else if (import.meta.env.VITE_AUTH_CLIENT_ID) {
    buildEnv.auth = {
      case: 'third_party',
      clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
    };
  }

  env = buildEnv;
  return env;
};
