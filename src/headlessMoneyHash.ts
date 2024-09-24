import SDKApiHandler from "./sdkApiHandler";
import SDKEmbed, { SDKEmbedOptions, supportedLanguages } from "./sdkEmbed";
import DeferredPromise from "./standaloneFields/utils/DeferredPromise";
import getVaultApiUrl from "./standaloneFields/utils/getVaultApiUrl";
import getVaultInputIframeUrl from "./standaloneFields/utils/getVaultInputIframeUrl";
import type {
  CardData,
  Discount,
  Fee,
  IntentType,
  OnCompleteEventOptions,
  OnFailEventOptions,
  PaymentMethodSlugs,
  SupportedLanguages,
  UrlRenderStrategy,
} from "./types";
import type {
  GetMethodsOptions,
  IntentDetails,
  IntentMethods,
  RenderOptions,
} from "./types/headless";
import {
  Element,
  ElementEvents,
  ElementProps,
  Elements,
  ElementsProps,
  ElementStyles,
  ElementType,
  FormEvents,
} from "./types/standaloneFields";
import getApiUrl from "./utils/getApiUrl";
import getIframeUrl from "./utils/getIframeUrl";
import getMissingCardElement from "./utils/getMissingCardElement";
import isEmpty from "./utils/isEmpty";
import loadScript from "./utils/loadScript";
import throwIf from "./utils/throwIf";
import waitForSeconds from "./utils/waitForSeconds";
import warnIf from "./utils/warnIf";

export * from "./types";
export * from "./types/headless";

const supportedProceedWithTypes = new Set([
  "method",
  "customerBalance",
  "savedCard",
]);
export interface MoneyHashHeadlessOptions<TType extends IntentType>
  extends SDKEmbedOptions<TType> {
  publicApiKey?: string;
}

export default class MoneyHashHeadless<TType extends IntentType> {
  private options: MoneyHashHeadlessOptions<TType>;

  private sdkApiHandler = new SDKApiHandler();

  private sdkEmbed: SDKEmbed<TType>;

  private vaultSubmitListener: {
    current: ((event: MessageEvent) => void) | null;
  } = {
    current: null,
  };

  private mountedCardElements: Array<ElementType> = [];

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
   * @deprecated use {@link MoneyHashHeadless.getMethods} instead, will be removed in future versions
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
   * Get available methods, saved cards and customer balances for account associated with the
   * publicApiKey
   * @example
   * ```
   * await moneyHash.getMethods({
   *  currency: 'EGP',
   *  amount: 20,
   *  customer: '<customer_id>',
   *  flowId: '<flow_id>',
   * })
   * ```
   */
  getMethods(options: GetMethodsOptions): Promise<IntentMethods<TType>>;
  /**
   * Get available methods, saved cards and customer balances for the intent
   * @example
   * ```
   * await moneyHash.getMethods({
   *  intentId: '<intent_id>',
   * })
   * ```
   */
  getMethods(options: { intentId: string }): Promise<IntentMethods<TType>>;
  getMethods(options: GetMethodsOptions | { intentId: string }) {
    if ("intentId" in options) {
      return this.getIntentMethods(options.intentId);
    }

    throwIf(
      !this.options.publicApiKey,
      "publicApiKey on MoneyHash instance is required to get methods!",
    );

    throwIf(
      this.options.type === "payout",
      "getMethods is not allowed for payout!",
    );

    return this.sdkApiHandler.request<IntentMethods<TType>>({
      api: "sdk:getMethods",
      payload: {
        intentType: this.options.type,
        lang: this.sdkEmbed.lang,
        publicApiKey: this.options.publicApiKey,
        ...options,
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

    const { state, intent } = await this.proceedWith({
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
          token_data: {
            token: e.payment.token,
          },
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

  /**
   * Update the intent discount
   *
   * @description Can be used for updating discount on the intent level
   *
   * @example
   * ```
   * await moneyHash.updateIntentDiscount({
   *   intentId: '<intent_id>',
   *   discount: Discount,
   * });
   * ```
   *
   * @returns Promise<{@link IntentDetails}>
   */
  updateIntentDiscount({
    intentId,
    discount,
  }: {
    intentId: string;
    discount: Discount;
  }) {
    throwIf(!discount.title.en, "English discount title is required!");

    return this.sdkApiHandler.request<{ amount: string; discount: Discount }>({
      api: "sdk:updateIntentDiscount",
      payload: {
        intentId,
        discount,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  /**
   * Update the intent fees
   *
   * @description Can be used for updating intent fees
   *
   * @example
   * ```
   * await moneyHash.updateIntentFees({
   *   intentId: '<intent_id>',
   *   fees: Array<Fee>,
   * });
   * ```
   *
   * @returns Promise<{@link IntentDetails}>
   */
  updateIntentFees({ intentId, fees }: { intentId: string; fees: Array<Fee> }) {
    fees.forEach(fee => {
      throwIf(!fee.title.en, "English fee title is required!");
    });

    return this.sdkApiHandler.request<{ amount: string; fees: Fee[] }>({
      api: "sdk:updateIntentFees",
      payload: {
        intentId,
        fees,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  /**
   * Creates Elements context used to render each card field
   * @description Elements context is used to create and manage card fields
   * such as card number, card holder name, card expiry month, card expiry year and card cvv.
   *
   * @example
   * ```
   * const elements = moneyHash.elements({ styles: ElementsStyles });
   * ```
   *
   * @returns { Elements }
   */
  elements({ styles, classes, fontSourceCss }: ElementsProps): Elements {
    const fieldsListeners: Array<(event: MessageEvent) => void> = [];
    const elementsValidity: Partial<Record<ElementType, boolean>> = {};
    const formEventsCallback = new Map<FormEvents, Function>();

    let isAllValid = false;
    this.#setupVaultFieldsListeners(fieldsListeners);

    return {
      /**
       * Creates card field element
       * @description
       *
       * @example
       * ```
       * const cardField = elements.create({
       *                            elementType: "<element-type>",
       *                            elementOptions: {
       *                              selector: "<css-selector>",
       *                              height: "<height>",
       *                              placeholder: "<placeholder>",
       *                              styles: { color: "<color>",
       *                              backgroundColor: "<background-color>",
       *                              placeholderColor: "<placeholder-color>"
       *                            }
       *                        });
       * ```
       *
       * @returns { Elements }
       */
      create: ({ elementType, elementOptions }: ElementProps): Element => {
        const inputEventCallbacks = new Map<
          `${ElementType}@${ElementEvents}`,
          Function
        >();
        let fieldIframe: HTMLIFrameElement | null = null;

        const customClasses = {
          ...classes,
          ...elementOptions.classes,
        };

        const focusClassName = customClasses?.focus?.split(" ") || [
          "MoneyHashElement--focus",
        ];
        const errorClassName = customClasses?.error?.split(" ") || [
          "MoneyHashElement--error",
        ];

        return {
          mount: () => {
            const container = document.querySelector(
              elementOptions.selector,
            ) as HTMLDivElement;

            throwIf(
              !container,
              `Couldn't find an element with selector ${elementOptions.selector}!`,
            );
            container.classList.add("MoneyHashElement");

            fieldsListeners.push((event: MessageEvent) => {
              const { type, data } = event.data;

              if (type === `${elementType}@mount`) {
                elementsValidity[elementType] = data.isValid;
                inputEventCallbacks.get(`${elementType}@mount`)?.();
              }

              if (type === `${elementType}@focus`) {
                container.classList.add(...focusClassName);
                inputEventCallbacks.get(`${elementType}@focus`)?.();
                return;
              }

              if (type === `${elementType}@blur`) {
                container.classList.remove(...focusClassName);
                inputEventCallbacks.get(`${elementType}@blur`)?.();
                return;
              }

              if (type === `${elementType}@error`) {
                if (data.isValid) {
                  container.classList.remove(...errorClassName);
                } else {
                  container.classList.add(...errorClassName);
                }
                inputEventCallbacks.get(`${elementType}@error`)?.(data);
                return;
              }

              if (type === `${elementType}@changeInput`) {
                inputEventCallbacks.get(`${elementType}@changeInput`)?.({
                  isValid: data.isValid,
                  length: data.length,
                });
                elementsValidity[elementType] = data.isValid;

                const validityChangeCallback =
                  formEventsCallback.get("validityChange");

                if (validityChangeCallback) {
                  const isAllFieldsValid =
                    Object.values(elementsValidity).every(Boolean);

                  if (isAllFieldsValid !== isAllValid) {
                    formEventsCallback.get("validityChange")?.(
                      isAllFieldsValid,
                    );
                    isAllValid = isAllFieldsValid;
                  }
                }
                return;
              }

              if (type === `${elementType}@cardNumberChange`) {
                inputEventCallbacks.get(`${elementType}@cardNumberChange`)?.(
                  data,
                );
                return;
              }

              if (type === `${elementType}@key:Backspace`) {
                inputEventCallbacks.get(`${elementType}@key:Backspace`)?.();
                return;
              }

              if (type === `${elementType}@key:Enter`) {
                inputEventCallbacks.get(`${elementType}@key:Enter`)?.();
              }
            });

            fieldIframe = this.#renderFieldIframe({
              container,
              elementType,
              elementOptions,
              styles: { ...styles, ...elementOptions.styles },
              fontSourceCss,
            });

            this.mountedCardElements.push(elementType);
          },
          on: (eventName: ElementEvents, callback: Function) => {
            inputEventCallbacks.set(`${elementType}@${eventName}`, callback);
          },
          off: eventName =>
            inputEventCallbacks.delete(`${elementType}@${eventName}`),
          focus: () => {
            fieldIframe?.contentWindow?.postMessage(
              { type: "focus" },
              getVaultInputIframeUrl(),
            );
          },
          blur: () => {
            fieldIframe?.contentWindow?.postMessage(
              { type: "blur" },
              getVaultInputIframeUrl(),
            );
          },
          clear: () => {
            fieldIframe?.contentWindow?.postMessage(
              { type: "clear" },
              getVaultInputIframeUrl(),
            );
          },
        };
      },
      on: (eventName, callback) => {
        formEventsCallback.set(eventName, callback);
      },
    };
  }

  async #submitVaultCardForm({
    accessToken,
    saveCard,
  }: {
    accessToken: string;
    saveCard?: boolean;
  }) {
    const vaultFieldsDefPromise = new DeferredPromise<CardData>();

    this.vaultSubmitListener.current = (event: MessageEvent) => {
      const { type, data } = event.data;

      if (type === "vaultSubmit:success") {
        vaultFieldsDefPromise.resolve(data);
      }
      if (type === "vaultSubmit:error") {
        vaultFieldsDefPromise.reject(data);
      }
    };

    const submitIframe = this.#renderVaultSubmitIframe({
      accessToken,
      saveCard,
    });
    const cardEmbedData = await vaultFieldsDefPromise.promise;
    submitIframe.remove();
    return cardEmbedData;
  }

  /**
   * Submits the form with the form fields data (card, billing, shipping)
   * @example
   * ```
   * await moneyHash.submitForm({
   *                        intentId: '<intent-id>',
   *                        accessToken : '<access-token>',
   *                        billingData: {},
   *                        shippingData: {},
   *                      });
   * ```
   *
   * @returns { Promise<IntentDetails<TType>> }
   */
  async submitForm({
    intentId,
    accessToken,
    billingData,
    shippingData,
    cardData,
    saveCard,
    paymentMethod = "CARD",
  }: {
    intentId: string;
    accessToken?: string | null;
    billingData?: Record<string, unknown>;
    shippingData?: Record<string, unknown>;
    cardData?: CardData;
    saveCard?: boolean;
    paymentMethod?: PaymentMethodSlugs;
  }): Promise<IntentDetails<TType>> {
    const missingCardElement = getMissingCardElement(this.mountedCardElements);

    throwIf(
      !!missingCardElement,
      `You must mount ${missingCardElement} element!`,
    );

    let cardEmbedData = cardData;

    if (accessToken) {
      cardEmbedData = await this.#submitVaultCardForm({
        accessToken,
        saveCard,
      });
    }

    const submissionResult = await this.sdkApiHandler.request<
      IntentDetails<TType>
    >({
      api: "sdk:submitNativeForm",
      payload: {
        intentId,
        paymentMethod,
        lang: this.sdkEmbed.lang,
        billingData,
        shippingData,
        cardEmbed: cardEmbedData,
      },
    });

    return submissionResult;
  }

  /**
   * Submits the CVV for the tokenized card
   *
   * @example
   * ```
   * await moneyHash.submitCvv({ intentId: '<intent-id>', cvv: '<cvv>' });
   * ```
   *
   * @returns { Promise<IntentDetails<TType>> }
   */
  async submitCvv({
    intentId,
    cvv,
  }: {
    intentId: string;
    cvv: string;
  }): Promise<IntentDetails<TType>> {
    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:submitCardCvv",
      payload: {
        intentId,
        cvv,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  /**
   * Render the received url in an iframe, popup iframe or redirect
   *
   * @example
   * ```
   * moneyHash.renderUrl('<url>', 'IFRAME');
   * ```
   *
   */
  async renderUrl({
    intentId,
    url,
    renderStrategy,
    options,
  }: {
    intentId: string;
    url: string;
    renderStrategy: UrlRenderStrategy;
    options?: RenderOptions;
  }) {
    switch (renderStrategy) {
      case "IFRAME":
        return this.#renderUrlInIframe({ url, intentId });
      case "POPUP_IFRAME":
        return this.#renderUrlInPopUpIframe({ url, intentId, options });
      case "REDIRECT":
        return this.#renderUrlInRedirect({ url, options });
      default:
        return null;
    }
  }

  async #renderUrlInIframe({
    intentId,
    url,
  }: {
    intentId: string;
    url: string;
  }) {
    const container = document.querySelector("#rendered-url-iframe-container");

    throwIf(
      !container,
      "Couldn't find an element with id rendered-url-iframe-container to render the iframe!",
    );

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.setProperty("border", "0", "important");
    iframe.style.setProperty("width", "100%", "important");
    iframe.style.setProperty("height", "100%", "important");

    container?.replaceChildren(iframe);

    await this.#setupExternalWindowListener({ intentId });

    iframe.remove();
  }

  async #renderUrlInPopUpIframe({
    intentId,
    url,
    options = {},
  }: {
    intentId: string;
    url: string;
    options?: RenderOptions;
  }) {
    const {
      width = 600,
      height = 400,
      left = 200,
      top = 200,
    } = options.window || {};

    const windowRef = window.open(
      url,
      "",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    throwIf(!windowRef, "Popup blocked by browser!");

    await this.#setupExternalWindowListener({ intentId, isUsingPopUp: true });

    windowRef?.close();
  }

  async #renderUrlInRedirect({
    url,
    options,
  }: {
    url: string;
    options?: RenderOptions;
  }) {
    if (!options || !options.redirectToNewWindow) {
      window.location.href = url;
      return;
    }

    window.open(url, "_blank");
  }

  async #setupExternalWindowListener({
    intentId,
    isUsingPopUp = false,
  }: {
    intentId: string;
    isUsingPopUp?: boolean;
  }) {
    const resultDefPromise = new DeferredPromise();

    const onReceiveMessage = async (event: MessageEvent) => {
      if (event.origin !== getIframeUrl()) return;
      const { type } = event.data;

      if (type === "intentResult") {
        if (isUsingPopUp) this.sdkApiHandler.postMessage("EmbedResultClose");

        const [intentDetails] = await Promise.all([
          this.getIntentDetails(intentId),
          waitForSeconds(2),
        ]);

        const transactionStatus =
          intentDetails.transaction.status.split(".")[1];

        if (
          transactionStatus === "successful" ||
          transactionStatus.startsWith("pending")
        ) {
          this.options.onComplete?.({
            type: this.options.type,
            ...intentDetails,
          } as OnCompleteEventOptions<TType>);
        } else {
          this.options.onFail?.({
            type: this.options.type,
            ...intentDetails,
          } as unknown as OnFailEventOptions<TType>);
        }

        resultDefPromise.resolve(() => null);
        window.removeEventListener("message", onReceiveMessage);
      }
    };

    window.addEventListener("message", onReceiveMessage);

    return resultDefPromise.promise;
  }

  #setupVaultFieldsListeners(
    fieldsListeners: Array<(event: MessageEvent) => void>,
  ) {
    const onReceiveInputMessage = (event: MessageEvent) => {
      if (event.origin !== getVaultInputIframeUrl()) return;
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
    fontSourceCss,
  }: {
    container: HTMLDivElement;
    elementType: ElementType;
    styles?: ElementStyles;
    elementOptions: ElementProps["elementOptions"];
    fontSourceCss?: string;
  }) {
    const VAULT_INPUT_IFRAME_URL = getVaultInputIframeUrl();

    const url = new URL(`${VAULT_INPUT_IFRAME_URL}/vaultField/vaultField.html`);

    if (fontSourceCss) url.searchParams.set("fontSourceCss", fontSourceCss);
    url.searchParams.set("host", btoa(window.location.origin)); // the application that is using the SDK
    url.searchParams.set("type", elementType);
    if (elementOptions.validation?.required !== undefined) {
      url.searchParams.set(
        "required",
        `${elementOptions.validation?.required}`,
      );
    }
    url.searchParams.set("placeholder", elementOptions.placeholder ?? "");
    url.searchParams.set("lang", this.sdkEmbed.lang);
    url.searchParams.set("direction", styles?.direction || "");

    url.searchParams.set(
      "color",
      JSON.stringify(styles?.color ? styles.color : "#000"),
    );
    url.searchParams.set(
      "placeholderColor",
      styles?.placeholderColor || "#ccc",
    );
    url.searchParams.set(
      "backgroundColor",
      styles?.backgroundColor || "transparent",
    );
    url.searchParams.set("fontSize", styles?.fontSize || "");
    url.searchParams.set("fontFamily", styles?.fontFamily || "");
    url.searchParams.set("fontWeight", `${styles?.fontWeight}`);
    url.searchParams.set("fontStyle", styles?.fontStyle || "");
    url.searchParams.set("padding", styles?.padding || "");

    const fieldIframe = document.createElement("iframe");

    fieldIframe.src = url.toString();
    fieldIframe.style.height = styles?.height ?? "40px";
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
    return fieldIframe;
  }

  #renderVaultSubmitIframe({
    accessToken,
    saveCard,
  }: {
    accessToken: string;
    saveCard?: boolean;
  }) {
    const VAULT_INPUT_IFRAME_URL = getVaultInputIframeUrl();
    const VAULT_API_URL = getVaultApiUrl();

    const url = new URL(
      `${VAULT_INPUT_IFRAME_URL}/vaultSubmit/vaultSubmit.html`,
    );

    url.searchParams.set("host", btoa(window.location.origin)); // the application that is using the SDK
    url.searchParams.set("vault_api_url", `${VAULT_API_URL}/api/v1/tokens/`); // the vault BE API URL
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("lang", this.sdkEmbed.lang);
    if (saveCard !== undefined) {
      url.searchParams.set("save_card", `${saveCard}`);
    }

    const submitIframe = document.createElement("iframe");

    submitIframe.id = "moneyhash-submit-iframe";
    submitIframe.src = url.toString();
    submitIframe.hidden = true;

    document.body.appendChild(submitIframe);

    return submitIframe;
  }

  /**
   * Listen to expiration date of the intent passed or not and execute the callback
   * @example
   * ```
   * moneyHash.onExpiration('<expiration_date>', () => {
   *  console.log('intent expired!');
   * });
   * ```
   * @see {@link IntentDetails} - for \<expiration_date>
   * @returns Cleanup function
   */
  onExpiration(expirationDate: string, callback: () => void) {
    if (!expirationDate) {
      warnIf(
        true,
        `No expiration date provided!, make sure to check for it before usage

if (intentDetails.intent.expirationDate) {
  moneyHash.onExpiration(intentDetails.intent.expirationDate, () => {
    console.log("Entity expired!");
  })
}`,
      );
      return () => undefined;
    }

    const exp = new Date(expirationDate!);

    const timerId = setInterval(async () => {
      const now = new Date();
      if (exp < now) {
        clearInterval(timerId);
        callback();
      }
    }, 1000);

    return () => clearInterval(timerId);
  }
}
