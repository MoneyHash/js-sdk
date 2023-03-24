import SDKApiHandler from "./sdkApiHandler";
import SDKEmbed, { SDKEmbedOptions } from "./sdkEmbed";
import type { IntentType, PaymentMethodSlugs } from "./types";
import { SuccessResponse } from "./types/headless";

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

  getSessionDetails({ intentId }: { intentId: string }) {
    return this.sdkApiHandler.request<SuccessResponse<TType>>({
      api: "sdk:getSessionDetails",
      payload: {
        type: this.options.type,
        intentId,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  proceedWith({
    intentId,
    method,
  }: {
    intentId: string;
    method: PaymentMethodSlugs;
  }) {
    return this.sdkApiHandler.request<SuccessResponse<TType>>({
      api: "sdk:proceedWith",
      payload: {
        type: this.options.type,
        intentId,
        method,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  deselectMethod({ intentId }: { intentId: string }) {
    return this.sdkApiHandler.request<SuccessResponse<TType>>({
      api: "sdk:deselectMethod",
      payload: {
        type: this.options.type,
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

    return this.sdkApiHandler.request<SuccessResponse<TType>>({
      api: "sdk:toggleTemplateAmount",
      payload: {
        type: this.options.type,
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
