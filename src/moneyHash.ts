import SDKEmbed, { SDKEmbedOptions } from "./sdkEmbed";
import throwIf from "./utils/throwIf";
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
    throwIf(!selector, "selector is required for start");
    throwIf(!intentId, "intentId is required for start");

    return this.sdkEmbed.render({ selector, intentId });
  }

  setLocale(locale: string) {
    return this.sdkEmbed.setLocale(locale);
  }

  removeEventListeners() {
    return this.sdkEmbed.abortService();
  }
}
