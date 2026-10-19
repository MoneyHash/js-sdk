import type { Region } from "../types";

type ServiceUrls = {
  checkout: string;
  api: string;
  vaultForm: string;
  vaultApi: string;
};

export default class RegionConfig {
  private static readonly defaultUrls: ServiceUrls = {
    checkout: import.meta.env.VITE_CHECKOUT_URL,
    api: import.meta.env.VITE_ONE_API_URL,
    vaultForm: import.meta.env.VITE_VAULT_FORM_URL,
    vaultApi: import.meta.env.VITE_VAULT_API_URL,
  };

  private static readonly regionUrls: Record<Region, Partial<ServiceUrls>> = {
    sa: {
      checkout: import.meta.env.VITE_SA_CHECKOUT_URL,
      api: import.meta.env.VITE_SA_ONE_API_URL,
      vaultForm: import.meta.env.VITE_SA_VAULT_FORM_URL,
      vaultApi: import.meta.env.VITE_SA_VAULT_API_URL,
    },
  };

  private static urls: ServiceUrls = RegionConfig.defaultUrls;

  static setRegion(region: Region | undefined) {
    if (!region) return;

    const urls = RegionConfig.regionUrls[region];
    const missing = (
      Object.keys(RegionConfig.defaultUrls) as (keyof ServiceUrls)[]
    ).filter(key => !urls[key]);
    // never fall back to the default region, requests must stay in the selected one
    if (missing.length) {
      throw new Error(
        `MoneyHash: region "${region}" is not supported in this environment (missing ${missing.join(
          ", ",
        )} url)`,
      );
    }

    RegionConfig.urls = urls as ServiceUrls;
  }

  static getUrl(service: keyof ServiceUrls): string {
    return RegionConfig.urls[service];
  }
}
