import SDKEmbed, { SDKEmbedOptions, supportedLanguages } from "./sdkEmbed";
import type { IntentType, SupportedLanguages } from "./types";
import throwIf from "./utils/throwIf";
import warnIf from "./utils/warnIf";

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
  start(options: Parameters<SDKEmbed<TType>["render"]>[0]) {
    throwIf(!options.selector, "selector is required for start");
    throwIf(!options.intentId, "intentId is required for start");
    return this.sdkEmbed.render(options);
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
    warnIf(
      !!locale && !supportedLanguages.has(locale),
      `Invalid locale. Supported languages (${[...supportedLanguages].join(
        " | ",
      )})`,
    );

    const validLocale = supportedLanguages.has(locale) ? locale : "en";
    return this.sdkEmbed.setLocale(validLocale);
  }

  /**
   * Cleanup all listeners set by the SDK
   * @returns Promise<void>
   */
  removeEventListeners() {
    return this.sdkEmbed.abortService();
  }
}
