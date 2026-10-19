import RegionConfig from "../../utils/region";

/**
 * Support for overriding the input iframe URL via a global variable.
 * to support using the local vault inputs inside SDK
 */
export default function getVaultInputIframeUrl() {
  const VAULT_INPUT_IFRAME_URL =
    window.MONEYHASH_VAULT_INPUT_IFRAME_URL ?? RegionConfig.getUrl("vaultForm");

  return VAULT_INPUT_IFRAME_URL;
}
