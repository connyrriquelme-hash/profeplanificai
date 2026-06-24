/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_SERVER_AI?: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_DB_MODE?: string;
  readonly VITE_D1_URL?: string;
  readonly VITE_D1_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
