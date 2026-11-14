/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHECKOUT_URL: string;
  readonly VITE_ONE_API_URL: string;
  readonly VITE_VAULT_API_URL: string;
  readonly VITE_VAULT_FORM_URL: string;
  readonly VITE_SA_CHECKOUT_URL?: string;
  readonly VITE_SA_ONE_API_URL?: string;
  readonly VITE_SA_VAULT_API_URL?: string;
  readonly VITE_SA_VAULT_FORM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const SDK_VERSION: string;

// URL overrides, to point the SDK at local or staging apps
interface Window {
  API_URL?: string;
  MONEYHASH_IFRAME_URL?: string;
  MONEYHASH_VAULT_API_URL?: string;
  MONEYHASH_VAULT_INPUT_IFRAME_URL?: string;
}
