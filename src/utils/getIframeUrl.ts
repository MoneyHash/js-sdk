/**
 * Support for overriding the iframe URL via a global variable.
 * to support using the SDK against staging env
 */
export default function getIframeUrl() {
  const IFRAME_URL =
    window.MONEYHASH_IFRAME_URL ?? import.meta.env.VITE_CHECKOUT_URL;

  return IFRAME_URL;
}

declare global {
  interface Window {
    MONEYHASH_IFRAME_URL?: string;
  }
}
