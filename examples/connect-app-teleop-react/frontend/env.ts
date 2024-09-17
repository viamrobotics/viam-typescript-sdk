export interface BuildEnvironment {
  baseUri: string;
  orgId: string;
  isDev: boolean;
  auth:
    | { case: 'api_key'; apiKeyId: string; apiKeySecret: string }
    | { case: 'third_party'; clientId: string };
}

let _env: BuildEnvironment;

export function getEnv(): BuildEnvironment {
  if (_env) {
    return _env;
  }
  let env = {
    baseUri: import.meta.env.VITE_BASE_URI ?? 'http://localhost:9000',
    orgId: import.meta.env.VITE_APP_ORG_ID,
    isDev: import.meta.env.DEV,
  } as BuildEnvironment;

  const throwNotSet = (envVarKey: string): never => {
    throw new Error(`${envVarKey} not set`);
  };

  if (!env.baseUri) {
    throwNotSet('VITE_BASE_URI');
  }

  if (!env.orgId) {
    throwNotSet('VITE_APP_ORG_ID');
  }

  if (
    import.meta.env.VITE_APP_API_KEY_ID &&
    import.meta.env.VITE_APP_API_KEY_SECRET
  ) {
    env.auth = {
      case: 'api_key',
      apiKeyId: import.meta.env.VITE_APP_API_KEY_ID,
      apiKeySecret: import.meta.env.VITE_APP_API_KEY_SECRET,
    };
  } else if (import.meta.env.VITE_AUTH_CLIENT_ID) {
    env.auth = {
      case: 'third_party',
      clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
    };
  } else {
    throwNotSet(
      'VITE_APP_API_KEY_ID/VITE_APP_API_KEY_SECRET or VITE_AUTH_CLIENT_ID'
    );
  }

  _env = env;
  return _env;
}
