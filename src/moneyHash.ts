import SDKEmbed, { SDKEmbedOptions } from "./sdkEmbed";

import type { IntentType } from "./types";

export interface MoneyHashOptions<TType extends IntentType>
  extends SDKEmbedOptions<TType> {}

export default class MoneyHash<TType extends IntentType> {
  options: MoneyHashOptions<TType>;

  private sdkEmbed: SDKEmbed<TType>;

  constructor(options: MoneyHashOptions<TType>) {
    this.options = options;
    this.sdkEmbed = new SDKEmbed(options);
  }

  start({ selector, intentId }: { selector: string; intentId: string }) {
    this.sdkEmbed.render({ selector, intentId });
  }

  setLocale(locale: string) {
    this.sdkEmbed.setLocale(locale);
  }

  removeEventListeners() {
    this.sdkEmbed.abortService();
  }
}
