import RegionConfig from "./region";

/**
 * Support for overriding the iframe URL via a global variable.
 * to support using the SDK against staging env
 */
export default function getIframeUrl() {
  const IFRAME_URL =
    window.MONEYHASH_IFRAME_URL ?? RegionConfig.getUrl("checkout");

  return IFRAME_URL;
}
