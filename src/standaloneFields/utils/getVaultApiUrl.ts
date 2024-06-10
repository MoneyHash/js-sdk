/**
 * Support for overriding the vault api URL via a global variable.
 * to support using the local vault api inside SDK
 */
export default function getVaultApiUrl() {
  const VAULT_API_URL = "https://vault-staging.moneyhash.io";
  // window.MONEYHASH_VAULT_API_URL ?? import.meta.env.VITE_VAULT_API_URL;

  return VAULT_API_URL;
}

declare global {
  interface Window {
    MONEYHASH_VAULT_API_URL?: string;
  }
}
