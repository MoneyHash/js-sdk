import SDKApiHandler from "./sdkApiHandler";
import SDKEmbed, { SDKEmbedOptions } from "./sdkEmbed";
import type { IntentType, PaymentMethodSlugs } from "./types";
import type { IntentDetails, IntentMethods } from "./types/headless";

export * from "./types";
export * from "./types/headless";

export interface MoneyHashHeadlessOptions<TType extends IntentType>
  extends SDKEmbedOptions<TType> {}

export default class MoneyHashHeadless<TType extends IntentType> {
  private options: MoneyHashHeadlessOptions<TType>;

  private sdkApiHandler = new SDKApiHandler();

  private sdkEmbed: SDKEmbed<TType>;

  constructor(options: MoneyHashHeadlessOptions<TType>) {
    this.options = options;
    this.sdkEmbed = new SDKEmbed({ ...options, headless: true });
  }

  getIntentDetails(intentId: string) {
    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:getIntentDetails",
      payload: {
        intentType: this.options.type,
        intentId,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  getIntentMethods(intentId: string) {
    return this.sdkApiHandler.request<IntentMethods<TType>>({
      api: "sdk:getIntentMethods",
      payload: {
        intentType: this.options.type,
        intentId,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  proceedWith({
    intentId,
    type,
    id,
  }: {
    type: "method" | "customerBalance" | "savedCard";
    intentId: string;
    id: PaymentMethodSlugs | (string & {});
  }) {
    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:proceedWith",
      payload: {
        proceedWith: type,
        intentType: this.options.type,
        intentId,
        id,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  deselectMethod({ intentId }: { intentId: string }) {
    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:deselectMethod",
      payload: {
        intentType: this.options.type,
        intentId,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  toggleTemplateAmount({
    intentId,
    templateId,
    amount,
    note,
  }: {
    intentId: string;
    templateId: string;
    amount: string;
    note: string;
  }) {
    if (this.options.type === "payout") {
      throw new Error(`Templates are not supported for payout`);
    }

    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:toggleTemplateAmount",
      payload: {
        intentId,
        templateId,
        amount,
        note,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  renderForm({ selector, intentId }: { selector: string; intentId: string }) {
    this.sdkEmbed.render({ selector, intentId });
  }

  setLocale(locale: string) {
    this.sdkEmbed.setLocale(locale);
  }

  removeEventListeners() {
    this.sdkEmbed.abortService();
  }
}
