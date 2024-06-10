/**
 * Support for overriding the input iframe URL via a global variable.
 * to support using the local vault inputs inside SDK
 */
export default function getVaultInputIframeUrl() {
  const VAULT_INPUT_IFRAME_URL =
    window.MONEYHASH_VAULT_INPUT_IFRAME_URL ??
    import.meta.env.VITE_VAULT_INPUT_IFRAME_URL;

  return VAULT_INPUT_IFRAME_URL;
}

declare global {
  interface Window {
    MONEYHASH_VAULT_INPUT_IFRAME_URL?: string;
  }
}
