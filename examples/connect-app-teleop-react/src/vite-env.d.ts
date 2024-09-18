/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URI: string;
  readonly VITE_APP_ORG_ID: string;
  readonly VITE_APP_API_KEY_ID?: string;
  readonly VITE_APP_API_KEY_SECRET?: string;
  readonly VITE_AUTH_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
