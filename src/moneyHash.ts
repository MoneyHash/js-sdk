import SDKEmbed, { SDKEmbedOptions } from "./sdkEmbed";
import type { IntentType, SupportedLanguages } from "./types";
import throwIf from "./utils/throwIf";

export interface MoneyHashOptions<TType extends IntentType>
  extends SDKEmbedOptions<TType> {}

export default class MoneyHash<TType extends IntentType> {
  options: MoneyHashOptions<TType>;

  private sdkEmbed: SDKEmbed<TType>;

  constructor(options: MoneyHashOptions<TType>) {
    this.options = options;
    this.sdkEmbed = new SDKEmbed(options);
  }

  /**
   * Render SDK embed and let MoneyHash handle everything for you
   *
   * @description you can listen for completion or failure of an intent by providing `onComplete` `onFail` callbacks on MoneyHash instance.
   *
   * @example
   * ```
   * await moneyHash.start({
   *   selector: '<container_css_selector>',
   *   intentId: '<intentId>',
   * });
   * ```
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | CSS Selector MDN}
   * @returns Promise<void>
   */
  start({ selector, intentId }: { selector: string; intentId: string }) {
    throwIf(!selector, "selector is required for start");
    throwIf(!intentId, "intentId is required for start");

    return this.sdkEmbed.render({ selector, intentId });
  }

  /**
   * Change the embed localization
   *
   * @description we currently support 3 languages `English`, `Arabic`, `Français`.
   *
   * @example
   * ```
   * await moneyHash.setLocale("<locale_code>");
   * ```
   *
   * @returns Promise<void>
   */
  setLocale(locale: SupportedLanguages) {
    return this.sdkEmbed.setLocale(locale);
  }

  /**
   * Cleanup all listeners set by the SDK
   * @returns Promise<void>
   */
  removeEventListeners() {
    return this.sdkEmbed.abortService();
  }
}
