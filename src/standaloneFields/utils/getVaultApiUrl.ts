import RegionConfig from "../../utils/region";

/**
 * Support for overriding the vault api URL via a global variable.
 * to support using the local vault api inside SDK
 */
export default function getVaultApiUrl() {
  const VAULT_API_URL =
    window.MONEYHASH_VAULT_API_URL ?? RegionConfig.getUrl("vaultApi");

  return VAULT_API_URL;
}
