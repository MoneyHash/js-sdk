/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHECKOUT_URL: string;
  readonly VITE_ONE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const SDK_VERSION: string;
