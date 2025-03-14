import SDKApiHandler from "./sdkApiHandler";
import SDKEmbed, { SDKEmbedOptions, supportedLanguages } from "./sdkEmbed";
import DeferredPromise from "./standaloneFields/utils/DeferredPromise";
import getVaultApiUrl from "./standaloneFields/utils/getVaultApiUrl";
import getVaultInputIframeUrl from "./standaloneFields/utils/getVaultInputIframeUrl";
import type {
  CardData,
  Discount,
  Fee,
  InstallmentPlan,
  InstallmentPlanPayload,
  IntentType,
  OnCompleteEventOptions,
  OnFailEventOptions,
  PaymentMethodSlugs,
  SupportedLanguages,
  UrlRenderStrategy,
} from "./types";
import type {
  GoogleAllowedAuthMethods,
  GoogleAllowedCardNetworks,
  GoogleButtonOptions,
  GoogleEnvironment,
  IsReadyToPayRequest,
  GooglePaymentsClient,
  PaymentDataRequest,
} from "./types/googlePay";
import type {
  ApplePayMerchantSession,
  BinLookUpData,
  CardIntentDetails,
  GetMethodsOptions,
  IntentDetails,
  IntentMethods,
  NativeReceiptData,
  RenderOptions,
} from "./types/headless";
import {
  ElementEvents,
  ElementProps,
  Elements,
  ElementsProps,
  ElementStyles,
  ElementType,
  FormEvents,
} from "./types/standaloneFields";
import getIframeUrl from "./utils/getIframeUrl";
import getMissingCardElement from "./utils/getMissingCardElement";
import isBrowser from "./utils/isBrowser";
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

export type NativeCollectibleBillingData = "email";
export interface MoneyHashHeadlessOptions<TType extends IntentType>
  extends SDKEmbedOptions<TType> {
  publicApiKey?: string;
  googlePay?: {
    /**
     * Google Pay environment to target
     * @default "PRODUCTION"
     */
    environment?: GoogleEnvironment;
    /**
     * @default ["PAN_ONLY","CRYPTOGRAM_3DS"]
     */
    allowedAuthMethods?: GoogleAllowedAuthMethods;
    /**
     * @default ["AMEX","DISCOVER","JCB","MASTERCARD","VISA",]
     */
    allowedCardNetworks?: GoogleAllowedCardNetworks;
    /**
     * @default ['email']
     */
    collectibleBillingData?: NativeCollectibleBillingData[];
  };
  applePay?: {
    /**
     * @default ['email']
     */
    collectibleBillingData?: NativeCollectibleBillingData[];
  };
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

  private googlePaymentsClient: GooglePaymentsClient | null = null;

  constructor(options: MoneyHashHeadlessOptions<TType>) {
    this.options = options;
    this.sdkEmbed = new SDKEmbed({ ...options, headless: true });
    if (isBrowser()) {
      this.#setupVaultSubmitListener(this.vaultSubmitListener);
    }
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
        operation: options.operation,
        currency: options.currency,
        amount: options.amount,
        customer: options.customer,
        flowId: options.flowId,
        custom_fields: options.customFields,
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
    useWalletBalance,
    metaData,
    installmentPlanData,
  }: {
    type: "method" | "customerBalance" | "savedCard";
    intentId: string;
    id: string;
    useWalletBalance?: boolean;
    metaData?: {
      cvv: string;
    };
    installmentPlanData?: InstallmentPlanPayload;
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
        useWalletBalance,
        metaData,
        installmentPlanData,
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
   *   billingData: true | false | { email: test@test.com }, // enable/disable auto billing data collection
   *   onCancel: () => console.log("CANCEL"),
   *   onError: async () => {
   *     // Will fire after a failure payment
   *     console.log("ERROR");
   *   },
   * })
   * .then(() =>  console.log("COMPLETE"))
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
    /**
     * Apple pay sheet errors handler
     */
    onError?: () => void;
    onComplete?: (intentDetails: IntentDetails<TType>) => void;
    billingData?: Record<string, unknown>;
  }): Promise<IntentDetails<TType>> {
    await loadScript(
      "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js",
      "moneyHash-apple-pay-sdk",
    );

    if (!ApplePaySession) throw new Error("Apple Pay is not supported!");

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
      requiredShippingContactFields: this.#appleCollectibleBillingData,
    });

    const { state, intent } = await this.proceedWith({
      intentId,
      type: "method",
      id: "APPLE_PAY",
    });

    try {
      if (state === "FORM_FIELDS") {
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

    const deferredPromise = new DeferredPromise<IntentDetails<TType>>();

    session.onvalidatemerchant = e =>
      this.sdkApiHandler
        .request({
          api: "sdk:applePaySession",
          payload: {
            secret: intent.secret,
            validationUrl: e.validationURL,
            parentOrigin: window.location.origin,
          },
        })
        .then(merchantSession =>
          session.completeMerchantValidation(merchantSession),
        )
        .catch(onError);

    session.onpaymentauthorized = e =>
      this.sdkApiHandler
        .request<IntentDetails<TType>>({
          api: "sdk:submitReceipt",
          payload: {
            intentId,
            lang: this.sdkEmbed.lang,
            receipt: JSON.stringify({ token: e.payment.token }),
            receiptBillingData: {
              email: e.payment.shippingContact?.emailAddress,
            },
          },
        })
        .then(response => {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          onComplete?.(response);
          deferredPromise.resolve(response);
        })
        .catch(() => {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          onError?.();
          deferredPromise.reject(undefined);
        });

    session.oncancel = onCancel;
    session.begin();

    return deferredPromise.promise;
  }

  #getGooglePaymentRequestData(): IsReadyToPayRequest;
  #getGooglePaymentRequestData(
    nativePayData?: Record<string, any>,
  ): PaymentDataRequest;
  #getGooglePaymentRequestData(
    nativePayData?: Record<string, any>,
  ): IsReadyToPayRequest | PaymentDataRequest {
    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: "CARD",
          parameters: {
            allowedAuthMethods: this.options.googlePay?.allowedAuthMethods || [
              "PAN_ONLY",
              "CRYPTOGRAM_3DS",
            ],
            allowedCardNetworks: this.options.googlePay
              ?.allowedCardNetworks || [
              "AMEX",
              "DISCOVER",
              "JCB",
              "MASTERCARD",
              "VISA",
            ],
          },
          ...(nativePayData
            ? {
                tokenizationSpecification: {
                  type: "PAYMENT_GATEWAY",
                  parameters: {
                    gateway: nativePayData.gateway,
                    gatewayMerchantId: nativePayData.gateway_merchant_id,
                  },
                },
              }
            : {}),
        },
      ],
    } satisfies IsReadyToPayRequest | PaymentDataRequest;
    return paymentDataRequest;
  }

  /**
   * Render Google Pay button on container element with element with id `moneyHash-google-pay-button`
   * @example
   * ```
   * moneyHash
  .renderGooglePayButton({
    buttonType: "pay",
    onClick: () =>
      moneyHash
        .payWithGooglePay({
          intentId: "<intent_id>",
          onCancel() {
            console.log("cancelled");
          },
        })
        .then(intentDetails => {
          console.log(intentDetails);
        })
        .catch(console.dir),
  })
  .catch(console.dir);
   * ```
   */
  async renderGooglePayButton({
    onClick,
    ...googlePayButtonOptions
  }: {
    onClick: () => void;
  } & GoogleButtonOptions) {
    const container = document.getElementById("moneyHash-google-pay-button");

    throwIf(
      !container,
      "Couldn't find an element with id moneyHash-google-pay-button to render the google pay button!",
    );

    await loadScript(
      "https://pay.google.com/gp/p/js/pay.js",
      "moneyHash-google-pay-sdk",
    );

    this.googlePaymentsClient = new window.google.payments.api.PaymentsClient({
      environment: this.options.googlePay?.environment || "PRODUCTION",
    });

    const paymentDataRequest = this.#getGooglePaymentRequestData();

    this.googlePaymentsClient
      .isReadyToPay(paymentDataRequest)
      .then(response => {
        if (response.result) {
          const button = this.googlePaymentsClient!.createButton({
            buttonSizeMode: "fill",
            buttonType: "pay",
            ...googlePayButtonOptions,
            allowedPaymentMethods: paymentDataRequest.allowedPaymentMethods,
            onClick,
          });

          container?.replaceChildren(button);
        } else {
          throw new Error("Google Pay is not ready to pay!");
        }
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.dir(err);
      });
  }

  get #googleCollectibleBillingData() {
    return this.options.googlePay?.collectibleBillingData || ["email"];
  }

  get #appleCollectibleBillingData() {
    return this.options.applePay?.collectibleBillingData || ["email"];
  }

  /**
   * @param nativePayData - Native pay data from google express method
   * @param onCancel - Callback to be called when user cancels the payment sheet
   * @param enableEmailAbstraction - Flag to enable/disable auto billing data collection
   * @default billingData true
   *
   * Generate Google Payment Receipt
   * @returns nativeReceiptData
   */
  async generateGooglePayReceipt({
    nativePayData,
    onCancel,
  }: {
    nativePayData: Record<string, any> | null;
    onCancel?: () => void;
  }): Promise<{
    receipt: string;
    receiptBillingData: Partial<Record<string, string>>;
  }> {
    throwIf(
      !this.googlePaymentsClient,
      'Google Payments Client is not initialized! Make sure to call "renderGooglePay" before calling "generateGooglePayReceipt"',
    );

    throwIf(
      !nativePayData,
      "nativePayData is required to generate Google Pay receipt!",
    );

    throwIf(
      !nativePayData!.amount,
      "nativePayData.amount is required to generate Google Pay receipt!",
    );

    return this.googlePaymentsClient!.loadPaymentData({
      ...this.#getGooglePaymentRequestData(nativePayData!),
      transactionInfo: {
        totalPriceStatus: "FINAL",
        totalPriceLabel: "Total",
        totalPrice: `${nativePayData!.amount}`,
        currencyCode: nativePayData!.currency_code,
        countryCode: nativePayData!.country_code,
      },
      merchantInfo: {
        merchantName: nativePayData!.merchant_name,
        merchantId: nativePayData!.merchant_id,
      },
      emailRequired: this.#googleCollectibleBillingData.includes("email"),
    })
      .then(paymentData => {
        const paymentToken =
          paymentData.paymentMethodData.tokenizationData.token;
        return {
          receipt: paymentToken,
          receiptBillingData: {
            email: paymentData.email,
          },
        };
      })
      .catch(err => {
        if (err.statusCode === "CANCELED") {
          onCancel?.();
        } else {
          // Show error for debugging
          // eslint-disable-next-line no-console
          console.dir(err);
        }
        return Promise.reject(err);
      });
  }

  /**
   * @param nativePayData - Native pay data from apple express method
   * @param onCancel - Callback to be called when user cancels the payment sheet
   * @param billingData - Flag to enable/disable auto billing data collection
   * @default billingData true
   *
   * Generate Apple Payment Receipt
   * @returns nativeReceiptData
   */
  async generateApplePayReceipt({
    nativePayData,
    onCancel = () => {},
  }: {
    nativePayData: Record<string, any> | null;
    onCancel?: () => void;
  }): Promise<{
    receipt: string;
    receiptBillingData: Partial<Record<string, string>>;
  }> {
    await loadScript(
      "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js",
      "moneyHash-apple-pay-sdk",
    );

    throwIf(
      !nativePayData,
      "nativePayData is required to generate Apple Pay receipt!",
    );

    if (!nativePayData) return { receipt: "", receiptBillingData: {} };

    throwIf(
      !nativePayData.amount,
      "nativePayData.amount is required to generate Apple Pay receipt!",
    );

    if (!ApplePaySession) throw new Error("Apple Pay is not supported!");

    const session = new ApplePaySession(3, {
      countryCode: nativePayData.country_code,
      currencyCode: nativePayData.currency_code,
      supportedNetworks: nativePayData.supported_networks,
      merchantCapabilities: ["supports3DS"],
      total: {
        label: "Apple Pay",
        type: "final",
        amount: `${nativePayData.amount}`,
      },
      requiredShippingContactFields: this.#appleCollectibleBillingData,
    });
    const deferredPromise = new DeferredPromise<{
      receipt: string;
      receiptBillingData: Partial<Record<string, string>>;
    }>();

    session.onvalidatemerchant = e =>
      this.sdkApiHandler
        .request({
          api: "sdk:applePaySession",
          payload: {
            methodId: nativePayData.method_id,
            validationUrl: e.validationURL,
            parentOrigin: window.location.origin,
          },
        })
        .then(merchantSession =>
          session.completeMerchantValidation(merchantSession),
        )
        .catch(error => {
          session.abort();
          deferredPromise.reject(error);
        });

    session.onpaymentauthorized = e => {
      const nativeReceiptData = {
        receipt: JSON.stringify({ token: e.payment.token }),
        receiptBillingData: {
          email: e.payment.shippingContact?.emailAddress,
        },
      };
      session.completePayment(ApplePaySession.STATUS_SUCCESS);
      deferredPromise.resolve(nativeReceiptData);
    };
    session.oncancel = onCancel;
    session.begin();

    return deferredPromise.promise;
  }

  /**
   * @param nativeReceiptData - Native receipt data from apple pay or google pay
   * @param methodId - Apple pay or Google pay method id from nativePayData
   * @param flowId - (Optional) flow id to get the bin lookup service
   *
   * Get bin lookup data using apple pay or google pay receipt
   *
   * @returns BinLookUpData
   */
  async binLookupByReceipt({
    nativeReceiptData,
    methodId,
    flowId,
  }: {
    nativeReceiptData: NativeReceiptData;
    methodId: string;
    flowId?: string;
  }): Promise<BinLookUpData> {
    return this.sdkApiHandler.request<BinLookUpData>({
      api: "sdk:binLookupByReceipt",
      payload: {
        nativeReceiptData,
        methodId,
        flowId,
        publicApiKey: this.options.publicApiKey,
      },
    });
  }

  /**
   *
   * @param methodId - Apple pay method id from nativePayData
   * @param validationURL - Apple pay validation url you get from `ApplePaySession.onvalidatemerchant`
   * @returns
   */
  async validateApplePayMerchantSession({
    methodId,
    validationUrl,
  }: {
    methodId: string;
    validationUrl: string;
  }) {
    return this.sdkApiHandler.request<ApplePayMerchantSession>({
      api: "sdk:applePaySession",
      payload: {
        methodId,
        validationUrl,
        parentOrigin: window.location.origin,
      },
    });
  }

  submitPaymentReceipt({
    intentId,
    nativeReceiptData,
  }: {
    intentId: string;
    nativeReceiptData: NativeReceiptData;
  }) {
    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:submitReceipt",
      payload: {
        intentId,
        lang: this.sdkEmbed.lang,
        receipt: nativeReceiptData.receipt,
        receiptBillingData: nativeReceiptData.receiptBillingData,
      },
    });
  }

  /**
   * Pay with native google pay
   *
   * @example
   * ```
   * moneyHash
   * .payWithGooglePay({
   *   intentId: paymentIntentId,
   *   billingData: true | false | { email: test@test.com }, // enable/disable auto billing data collection
   *   onCancel: () => console.log("CANCEL"),
   * })
   * .then(intentDetails => console.log(intentDetails))
   * .catch(error => {
   *   console.log(error);
   *   error.message | string
           // intent requires billing data to proceed with the native integration
          - Billing data is missing while calling payWithApplePay

       error | Record<string, string>
          {email: "Enter a valid email address."}
   * });
   * ```
   */
  async payWithGooglePay({
    intentId,
    billingData = {},
    onCancel,
  }: {
    intentId: string;
    billingData?: Record<string, unknown>;
    onCancel?: () => void;
  }): Promise<IntentDetails<TType>> {
    throwIf(
      !this.googlePaymentsClient,
      'Google Payments Client is not initialized! Make sure to call "renderGooglePay" before calling "payWithGooglePay"',
    );

    let response = await this.proceedWith({
      intentId,
      type: "method",
      id: "GOOGLE_PAY",
    });

    try {
      if (response.state === "FORM_FIELDS") {
        if (isEmpty(billingData)) {
          throw new Error(
            "Billing data is missing while calling payWithGooglePay",
          );
        }

        response = await this.sdkApiHandler.request<IntentDetails<TType>>({
          api: "sdk:submitNativeForm",
          payload: {
            intentId,
            paymentMethod: "GOOGLE_PAY",
            lang: this.sdkEmbed.lang,
            billingData,
          },
        });
      }
    } catch (error) {
      await this.resetSelectedMethod(intentId);
      throw error;
    }

    const { nativePayData } = response as IntentDetails<"payment">;
    // not live intent moves directly to confirmation
    if (!nativePayData) return response;

    return this.generateGooglePayReceipt({
      nativePayData: nativePayData as any,
      onCancel,
    }).then(nativeReceiptData =>
      this.submitPaymentReceipt({
        intentId,
        nativeReceiptData,
      }),
    );
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
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox | iframe sandbox MDN}
   * @returns Promise<void>
   */
  renderForm(options: Parameters<SDKEmbed<TType>["render"]>[0]) {
    throwIf(!options.selector, "selector is required for renderForm");
    throwIf(!options.intentId, "intentId is required for renderForm");

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
      create: options => {
        if ("value" in options) {
          throwIf(
            options.elementType !== "cardHolderName",
            `Value is not allowed! for ${options.elementType}`,
          );
          this.defaultCardHolderName = options.value;
          return {
            mount: () => {},
            on: () => {},
            off: () => true,
            focus: () => {},
            blur: () => {},
            clear: () => {
              this.defaultCardHolderName = "";
            },
          };
        }

        const { elementType, elementOptions } = options;

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
      off(eventName) {
        formEventsCallback.delete(eventName);
      },
    };
  }

  cardForm = {
    collect: async () => {
      throwIf(
        !this.options.publicApiKey,
        "publicApiKey on MoneyHash instance is required to collect card!",
      );

      const missingCardElement = getMissingCardElement(
        this.mountedCardElements,
      );

      throwIf(
        !!missingCardElement,
        `You must mount ${missingCardElement} element!`,
      );

      const accessToken = await this.sdkApiHandler.request<string>({
        api: "sdk:generateAccessToken",
        payload: {
          publicApiKey: this.options.publicApiKey,
        },
      });

      return this.#submitVaultCardForm({ accessToken });
    },
    pay: async ({
      intentId,
      cardData,
      saveCard,
      billingData,
      shippingData,
      installmentPlanData,
    }: {
      intentId: string;
      cardData: CardData;
      saveCard?: boolean;
      billingData?: Record<string, unknown>;
      shippingData?: Record<string, unknown>;
      installmentPlanData?: InstallmentPlanPayload;
    }) =>
      this.sdkApiHandler.request<IntentDetails<TType>>({
        api: "sdk:submitNativeForm",
        payload: {
          intentId,
          lang: this.sdkEmbed.lang,
          paymentMethod: "CARD",
          billingData,
          shippingData,
          cardEmbed: cardData,
          saveCard,
          installmentPlanData,
        },
      }),
    createCardToken: async ({
      cardIntentId,
      cardData,
    }: {
      cardIntentId: string;
      cardData: CardData;
    }) =>
      this.sdkApiHandler.request<CardIntentDetails>({
        api: "sdk:createCardToken",
        payload: {
          cardIntentId,
          lang: this.sdkEmbed.lang,
          paymentMethod: "CARD",
          cardEmbed: cardData,
        },
      }),
    binLookup: async ({
      cardData,
      flowId,
    }: {
      cardData: CardData;
      flowId?: string;
    }) =>
      this.sdkApiHandler.request<BinLookUpData>({
        api: "sdk:binLookup",
        payload: {
          cardData,
          flowId,
          publicApiKey: this.options.publicApiKey,
        },
      }),
  };

  /**
   * For card holder name not mounted, but have initial value from merchant
   */
  private defaultCardHolderName: string = "";

  async #submitVaultCardForm({ accessToken }: { accessToken: string }) {
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
      defaultCardHolderName: this.defaultCardHolderName,
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
    saveCard,
    paymentMethod = "CARD",
    installmentPlanData,
  }: {
    intentId: string;
    accessToken?: string | null;
    billingData?: Record<string, unknown>;
    shippingData?: Record<string, unknown>;
    saveCard?: boolean;
    paymentMethod?: PaymentMethodSlugs;
    installmentPlanData?: InstallmentPlanPayload;
  }): Promise<IntentDetails<TType>> {
    let cardEmbedData;

    if (accessToken) {
      const missingCardElement = getMissingCardElement(
        this.mountedCardElements,
      );

      throwIf(
        !!missingCardElement,
        `You must mount ${missingCardElement} element!`,
      );

      cardEmbedData = await this.#submitVaultCardForm({
        accessToken,
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
        saveCard,
        installmentPlanData,
      },
    });

    return submissionResult;
  }

  /**
   * Selects the instalment plan for the intent
   * @example
   * ```
   * await moneyHash.selectInstallmentPlan({ intentId: '<intent-id>', planId: '<plan-id>' });
   * ```
   * @returns { Promise<IntentDetails<TType>> }
   */
  async selectInstallmentPlan({
    intentId,
    planId,
    issuerCode,
  }: {
    intentId: string;
    planId: string;
    issuerCode?: string;
  }): Promise<IntentDetails<TType>> {
    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:selectInstallmentPlan",
      payload: {
        planId,
        intentId,
        issuerCode,
        lang: this.sdkEmbed.lang,
      },
    });
  }

  /**
   * Get list of the instalment plan for the intent
   * @example
   * ```
   * await moneyHash.getInstallmentPlans({ first6Digits: '<card-bin>', amount: <amount>, currency: '<currency>' });
   * ```
   * @returns { Promise<Array<InstallmentPlan>> }
   */
  async getInstallmentPlans({
    first6Digits,
    amount,
    currency,
  }: {
    first6Digits?: string;
    amount: string;
    currency: string;
  }): Promise<Array<InstallmentPlan>> {
    throwIf(
      !this.options.publicApiKey,
      "publicApiKey on MoneyHash instance is required to get installment plans!",
    );

    return this.sdkApiHandler.request<Array<InstallmentPlan>>({
      api: "sdk:getInstallmentPlans",
      payload: {
        first6Digits,
        amount,
        currency,
        publicApiKey: this.options.publicApiKey,
        lang: this.sdkEmbed.lang,
      },
    });
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
    installmentPlanData,
  }: {
    intentId: string;
    cvv: string;
    installmentPlanData?: InstallmentPlanPayload;
  }): Promise<IntentDetails<TType>> {
    return this.sdkApiHandler.request<IntentDetails<TType>>({
      api: "sdk:submitCardCvv",
      payload: {
        intentId,
        cvv,
        installmentPlanData,
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
    this.sdkApiHandler.postMessage("SDKRenderUrl");
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
    url.searchParams.set("inputMode", elementOptions.inputMode ?? "");
    url.searchParams.set("lang", this.sdkEmbed.lang);
    url.searchParams.set("direction", styles?.direction || "");
    url.searchParams.set("textAlign", styles?.textAlign || "");

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
    defaultCardHolderName,
  }: {
    accessToken: string;
    defaultCardHolderName: string;
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
    if (defaultCardHolderName) {
      url.searchParams.set("default_card_holder_name", defaultCardHolderName);
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
