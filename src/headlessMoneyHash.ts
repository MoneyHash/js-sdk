import SDKApiHandler from "./sdkApiHandler";
import SDKEmbed, { SDKEmbedOptions } from "./sdkEmbed";
import DeferredPromise from "./standaloneFields/utils/DeferredPromise";
import getVaultApiUrl from "./standaloneFields/utils/getVaultApiUrl";
import getVaultInputIframeUrl from "./standaloneFields/utils/getVaultInputIframeUrl";
import type { IntentType } from "./types";
import type { IntentDetails, IntentMethods } from "./types/headless";
import {
  ElementEvents,
  ElementProps,
  ElementsProps,
  ElementStyles,
  ElementType,
} from "./types/standaloneFields";
import isEmpty from "./utils/isEmpty";
import loadScript from "./utils/loadScript";
import throwIf from "./utils/throwIf";
import getApiUrl from "./utils/getApiUrl";

export * from "./types";
export * from "./types/headless";

const supportedProceedWithTypes = new Set([
  "method",
  "customerBalance",
  "savedCard",
]);
export interface MoneyHashHeadlessOptions<TType extends IntentType>
  extends SDKEmbedOptions<TType> {}

export default class MoneyHashHeadless<TType extends IntentType> {
  private options: MoneyHashHeadlessOptions<TType>;

  private sdkApiHandler = new SDKApiHandler();

  private sdkEmbed: SDKEmbed<TType>;

  private vaultSubmitListener: {
    current: ((event: MessageEvent) => void) | null;
  } = {
    current: null,
  };

  constructor(options: MoneyHashHeadlessOptions<TType>) {
    this.options = options;
    this.sdkEmbed = new SDKEmbed({ ...options, headless: true });
    this.#setupVaultSubmitListener(this.vaultSubmitListener);
  }

  /**
   * Get intent details
   * @example
   * ```
   * await moneyHash.getIntentDetails('<intent_id>');
   * ```
   *
   * @returns Promise<{@link IntentDetails}>
   */
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

  /**
   * Get intent available payment/payout methods, saved cards and customer balances
   * @example
   * ```
   * await moneyHash.getIntentMethods('<intent_id>');
   * ```
   * @returns Promise<{@link IntentMethods}>
   */
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

  /**
   * Proceed with a payment/payout method, card or wallet
   *
   * @example
   * <caption>Proceed with a payment/payout method</caption>
   * ```
   * await moneyHash.proceedWith({
   *   intentId: '<intent_id>',
   *   type: 'method',
   *   id: '<method_id>',
   * })
   * ```
   * @see {@link Method} - for \<method_id>
   *
   * @example
   * <caption>Proceed with a customer balance. e.g. wallet</caption>
   * ```
   * await moneyHash.proceedWith({
   *   intentId: '<intent_id>',
   *   type: 'customerBalance',
   *   id: '<customer_balance_id>',
   * })
   * ```
   * @see {@link CustomerBalances} - for \<customer_balance_id>
   *
   * @example
   * <caption>Proceed with a customer saved card</caption>
   * ```
   * // Card doesn't require CVV
   * await moneyHash.proceedWith({
   *   intentId: '<intent_id>',
   *   type: 'savedCard',
   *   id: '<card_id>',
   * })
   *
   * // Card requires CVV
   * await moneyHash.proceedWith({
   *   intentId: '<intent_id>',
   *   type: 'savedCard',
   *   id: '<card_id>',
   *   metaData: {
   *     cvv: '<cvv>',
   *   }
   * })
   * ```
   * @see {@link Card} - for \<card_id> & if card requires cvv or not
   *
   * @returns Promise<{@link IntentDetails}>
   */
  proceedWith({
    intentId,
    type,
    id,
    metaData,
  }: {
    type: "method" | "customerBalance" | "savedCard";
    intentId: string;
    id: string;
    metaData?: {
      cvv: string;
    };
  }) {
    throwIf(
      !supportedProceedWithTypes.has(type),
      `type must be a valid one (${[...supportedProceedWithTypes].join(
        " | ",
      )})`,
    );

    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:proceedWith",
      payload: {
        proceedWith: type,
        intentType: this.options.type,
        intentId,
        id,
        lang: this.sdkEmbed.lang,
        metaData,
      },
    });
  }

  /**
   * Reset the selected method on and intent to null
   *
   * @description Can be used for `back` button after method selection
   * or `retry` button on failed transaction UI to try a different
   * method by the user.
   *
   * @example
   * ```
   * await moneyHash.resetSelectedMethod('<intent_id>');
   * ```
   *
   * @returns Promise<{@link IntentDetails}>
   */
  resetSelectedMethod(intentId: string) {
    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:resetSelectedMethod",
      payload: {
        intentType: this.options.type,
        intentId,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  /**
   * Delete a customer saved card
   *
   * @example
   * ```
   * await moneyHash.deleteCard({
   *   cardId: '<card_id>',
   *   intentSecret: '<intent_secret>',
   * });
   * ```
   * @see {@link Card} - for \<card_id>
   * @see {@link AbstractIntent} - for \<intent_secret>
   * @returns Promise<{ message: 'success'} >
   */
  deleteCard({
    cardId,
    intentSecret,
  }: {
    cardId: string;
    intentSecret: string;
  }) {
    throwIf(
      this.options.type === "payout",
      "deleteCard is allowed only for payment intent!",
    );

    return this.sdkApiHandler.request<{ message: "success" }>({
      api: "sdk:deleteCard",
      payload: {
        cardId,
        intentSecret,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  /**
   * Pay with native apple pay
   *
   * @example
   * ```
   * moneyHash
   * .payWithApplePay({
   *   intentId: paymentIntentId,
   *   countryCode: "AE",
   *   amount: intentDetails.intent.amount.formatted,
   *   currency: intentDetails.intent.amount.currency,
   *   billingData: {
   *     email: "test@test.com",
   *   },
   *   onCancel: () => console.log("CANCEL"),
   *   onComplete: async () => {
   *     // Will fire after a successful payment
   *     console.log("COMPLETE");
   *   },
   *   onError: async () => {
   *     // Will fire after a failure payment
   *     console.log("ERROR");
   *   },
   * })
   * .catch(error => {
   *   console.log(error);
   *   error.message | string
   *       // Native apple pay button need to be triggered from click event directly
          - Must create a new ApplePaySession from a user gesture handler.

           // intent requires billing data to proceed with the native integration
          - Billing data is missing while calling payWithApplePay

       error | Record<string, string>
          {email: "Enter a valid email address."}
   * });
   * ```
   */
  async payWithApplePay({
    intentId,
    currency,
    amount,
    countryCode,
    onCancel = () => {},
    onError,
    onComplete,
    billingData = {},
  }: {
    intentId: string;
    countryCode: string;
    currency: string;
    amount: number;
    onCancel?: () => void;
    onError: () => void;
    onComplete: () => void;
    billingData?: Record<string, unknown>;
  }) {
    await loadScript(
      "https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js",
      "moneyHash-apple-pay-sdk",
    );

    if (!ApplePaySession) return;

    const session = new ApplePaySession(3, {
      countryCode,
      currencyCode: currency,
      supportedNetworks: ["visa", "masterCard", "amex", "discover", "mada"],
      merchantCapabilities: ["supports3DS"],
      total: {
        label: "Apple Pay",
        type: "final",
        amount: `${amount}`,
      },
    });

    const {
      __providerId__: providerId,
      state,
      intent,
    } = await this.proceedWith({
      intentId,
      type: "method",
      id: "APPLE_PAY",
    });

    try {
      if (state === "INTENT_FORM") {
        if (isEmpty(billingData)) {
          throw new Error(
            "Billing data is missing while calling payWithApplePay",
          );
        }

        await this.sdkApiHandler.request<IntentDetails<TType>>({
          api: "sdk:submitNativeForm",
          payload: {
            intentId,
            paymentMethod: "APPLE_PAY",
            providerId,
            lang: this.sdkEmbed.lang,
            billingData,
          },
        });
      }
    } catch (error) {
      await this.resetSelectedMethod(intentId);
      throw error;
    }

    session.onvalidatemerchant = e => {
      fetch(`${getApiUrl()}/api/v1/providers/applepay/session/`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: intent.secret,
          validation_url: e.validationURL,
        }),
      })
        .then(response => (response.ok ? response.json() : Promise.reject()))
        .then(merchantSession =>
          session.completeMerchantValidation(merchantSession),
        )
        .catch(onError);
    };

    session.onpaymentauthorized = e => {
      fetch(`${getApiUrl()}/api/v1/providers/applepay/token/`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_data: e.payment.token,
          secret: intent.secret,
        }),
      })
        .then(response => (response.ok ? response.json() : Promise.reject()))
        .then(() => {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          onComplete();
        })
        .catch(() => {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          onError();
        });
    };

    session.oncancel = onCancel;
    session.begin();
  }

  /**
   * Render SDK embed forms and payment integrations
   *
   * @description must be called if `state` of an intent is `INTENT_FORM` to let MoneyHash handle the payment.
   * you can listen for completion or failure of an intent by providing `onComplete` `onFail` callbacks on MoneyHash instance.
   *
   * @example
   * ```
   * await moneyHash.renderForm({
   *   selector: '<container_css_selector>',
   *   intentId: '<intentId>',
   * });
   * ```
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | CSS Selector MDN}
   * @returns Promise<void>
   */
  renderForm({ selector, intentId }: { selector: string; intentId: string }) {
    throwIf(!selector, "selector is required for renderForm");
    throwIf(!intentId, "intentId is required for renderForm");

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
  setLocale(locale: string) {
    return this.sdkEmbed.setLocale(locale);
  }

  /**
   * Cleanup all listeners set by the SDK
   * @returns Promise<void>
   */
  removeEventListeners() {
    return this.sdkEmbed.abortService();
  }

  elements({ styles }: ElementsProps) {
    const fieldsListeners: Array<(event: MessageEvent) => void> = [];
    this.#setupVaultFieldsListeners(fieldsListeners);

    return {
      create: ({ elementType, elementOptions }: ElementProps) => {
        const eventCallbacks = new Map<string, () => void>();

        const container = document.querySelector(
          elementOptions.selector,
        ) as HTMLDivElement;

        throwIf(
          !container,
          `Couldn't find an element with selector ${elementOptions.selector}!`,
        );

        container.classList.add("moneyhash-element");

        fieldsListeners.push((event: MessageEvent) => {
          const { type } = event.data;

          // if (type === `${elementType}:init`) {
          //   //console.log(elementType, "init");

          // }
          if (type === `${elementType}@focus`) {
            container.classList.add("moneyhash-element_focus");
            eventCallbacks.get(`${elementType}@focus`)?.();
          }
          if (type === `${elementType}@blur`) {
            container.classList.remove("moneyhash-element_focus");
            eventCallbacks.get(`${elementType}@blur`)?.();
          }
        });

        return {
          mount: () =>
            this.#renderFieldIframe({
              container,
              elementType,
              elementOptions,
              styles: { ...styles, ...elementOptions.styles },
            }),
          on: (eventName: ElementEvents, callback: () => void) => {
            eventCallbacks.set(`${elementType}@${eventName}`, callback);
          },
        };
      },
    };
  }

  async submitForm({
    intentId,
    accessToken,
    billingData,
    shippingData,
  }: {
    intentId: string;
    accessToken?: string | null;
    billingData?: Record<string, unknown>;
    shippingData?: Record<string, unknown>;
  }) {
    const vaultFieldsDefPromise = new DeferredPromise();

    let cardEmbedData: any;
    let submitIframe: HTMLIFrameElement | undefined;

    if (accessToken) {
      this.vaultSubmitListener.current = (event: MessageEvent) => {
        const { type, data } = event.data;

        if (type === "vaultSubmit:success") {
          vaultFieldsDefPromise.resolve(data);
        }
        if (type === "vaultSubmit:error") {
          vaultFieldsDefPromise.reject(data);
        }
      };

      submitIframe = this.#renderVaultSubmitIframe(accessToken);
      cardEmbedData = await vaultFieldsDefPromise.promise;
    }

    await this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:submitNativeForm",
      payload: {
        intentId,
        paymentMethod: "CARD",
        lang: this.sdkEmbed.lang,
        billingData,
        shippingData,
        cardEmbed: cardEmbedData,
      },
    });

    if (submitIframe) submitIframe.remove();
  }

  renderUrl(
    url: string,
    renderStrategy: "IFRAME" | "POPUP_IFRAME" | "REDIRECT",
  ) {
    switch (renderStrategy) {
      case "IFRAME":
        return this.#renderUrlInIframe(url);
      case "POPUP_IFRAME":
        return this.#renderUrlInPopUpIframe(url);
      case "REDIRECT":
        return null;
      default:
        return null;
    }
  }

  #renderUrlInIframe(url: string) {
    const container = document.querySelector("#rendered-url-iframe-container");

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.setProperty("border", "0", "important");
    iframe.style.setProperty("width", "100vw", "important");
    iframe.style.setProperty("height", "100vh", "important");

    container?.replaceChildren(iframe);

    return iframe;
  }

  #renderUrlInPopUpIframe(url: string) {
    return window.open(`${url}`, "", "width=600,height=400,left=200,top=200");
  }

  #setupVaultFieldsListeners(
    fieldsListeners: Array<(event: MessageEvent) => void>,
  ) {
    const onReceiveInputMessage = (event: MessageEvent) => {
      fieldsListeners.forEach(listener => {
        listener(event);
      });
    };
    window.addEventListener("message", onReceiveInputMessage);
  }

  #setupVaultSubmitListener(submitListener: { current: any }) {
    const onReceiveSubmitMessage = (event: MessageEvent) => {
      if (submitListener.current) {
        submitListener.current(event);
      }
    };
    window.addEventListener("message", onReceiveSubmitMessage);
  }

  #renderFieldIframe({
    container,
    elementType,
    elementOptions,
    styles,
  }: {
    container: HTMLDivElement;
    elementType: ElementType;
    styles?: ElementStyles;
    elementOptions: {
      height?: string;
      placeholder?: string;
    };
  }) {
    const VAULT_INPUT_IFRAME_URL = getVaultInputIframeUrl();

    const url = new URL(`${VAULT_INPUT_IFRAME_URL}/vaultField/vaultField.html`);

    url.searchParams.set("parent", window.location.origin); // the application that is using the SDK
    url.searchParams.set("type", elementType);
    url.searchParams.set("placeholder", elementOptions.placeholder ?? "");

    url.searchParams.set("color", styles?.color || "#000");
    url.searchParams.set(
      "placeholderColor",
      styles?.placeholderColor || "#ccc",
    );
    url.searchParams.set(
      "backgroundColor",
      styles?.backgroundColor || "transparent",
    );

    const fieldIframe = document.createElement("iframe");

    fieldIframe.src = url.toString();
    fieldIframe.style.height = elementOptions.height ?? "40px";
    fieldIframe.style.setProperty("overflow", "hidden", "important");
    fieldIframe.style.setProperty("display", "block", "important");
    fieldIframe.style.setProperty("width", "100%", "important");
    fieldIframe.style.setProperty("maxWidth", "100%", "important");
    fieldIframe.style.setProperty("border", "0", "important");
    fieldIframe.style.setProperty("margin", "0", "important");
    fieldIframe.style.setProperty("padding", "0", "important");
    fieldIframe.style.setProperty("userSelect", "none", "important");
    fieldIframe.style.setProperty("colorScheme", "light only", "important");

    container.replaceChildren(fieldIframe);
  }

  #renderVaultSubmitIframe(accessToken: string) {
    const VAULT_INPUT_IFRAME_URL = getVaultInputIframeUrl();
    const VAULT_API_URL = getVaultApiUrl();

    const url = new URL(
      `${VAULT_INPUT_IFRAME_URL}/vaultSubmit/vaultSubmit.html`,
    );

    url.searchParams.set("parent", window.location.origin); // the application that is using the SDK
    url.searchParams.set("vault_api_url", `${VAULT_API_URL}/api/v1/tokens/`); // the vault BE API URL
    url.searchParams.set("access_token", accessToken);

    const submitIframe = document.createElement("iframe");

    submitIframe.id = "moneyhash-submit-iframe";
    submitIframe.src = url.toString();
    submitIframe.hidden = true;

    document.body.appendChild(submitIframe);

    return submitIframe;
  }
}
