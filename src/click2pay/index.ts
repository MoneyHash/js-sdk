import SDKApiHandler from "../sdkApiHandler";
import DeferredPromise from "../standaloneFields/utils/DeferredPromise";
import getVaultInputIframeUrl from "../standaloneFields/utils/getVaultInputIframeUrl";
import type { ElementType, IntentDetails } from "../types";
import getMissingCardElement from "../utils/getMissingCardElement";
import loadScript from "../utils/loadScript";
import throwIf from "../utils/throwIf";
import type {
  Click2PayInitOptions,
  MaskedCard,
  CardListEvent,
  CardListEventMap,
  CheckoutWithCardOptions,
  Click2PayAuthenticateOptions,
  CheckoutResponse,
  Click2PayAuthenticateResult,
  CheckoutWithNewCardOptions,
  Click2PayInitResult,
  SignOutResponse,
} from "./types";

declare global {
  interface Window {
    MastercardCheckoutServices: any;
  }
}

export default class Click2Pay {
  private sdkApiHandler: SDKApiHandler;

  complianceSettings = {
    privacy: {
      acceptedVersion: "LATEST",
      latestVersion: "LATEST",
      latestVersionUri:
        "https://www.mastercard.com/global/click-to-pay/country-listing/privacy.html",
    },
    tnc: {
      acceptedVersion: "LATEST",
      latestVersion: "LATEST",
      latestVersionUri:
        "https://www.mastercard.com/global/click-to-pay/country-listing/terms.html",
    },
  };

  /**
   * Underlying MasterCard Click2Pay SDK instance
   */
  masterCard: any;

  private env: string | null = null;

  private srcDpaId: string | null = null;

  private dpaLocale: string | null = null;

  private mountedCardElements: Array<ElementType>;

  lang: string;

  constructor(options: {
    sdkApiHandler: SDKApiHandler;
    mountedCardElements: Array<ElementType>;
    lang: string;
  }) {
    this.sdkApiHandler = options.sdkApiHandler;
    this.mountedCardElements = options.mountedCardElements;
    this.lang = options.lang;
  }

  /**
   * Loads MasterCard Click2Pay SDK script and initializes it with the provided options
   * and it should be called before any other method.
   */
  async init({
    env,
    srcDpaId,
    dpaLocale,
    dpaTransactionOptions,
    ...options
  }: Click2PayInitOptions): Promise<Click2PayInitResult> {
    const scriptUrl = `https://${
      env === "sandbox" ? "sandbox." : ""
    }src.mastercard.com/srci/integration/2/lib.js?srcDpaId=${srcDpaId}&locale=${dpaLocale}`;

    this.env = env;
    this.srcDpaId = srcDpaId;
    this.dpaLocale = dpaLocale;

    await loadScript(scriptUrl, "click2pay-sdk");

    this.masterCard = new window.MastercardCheckoutServices();
    return this.masterCard.init({
      ...options,
      srcDpaId,
      dpaLocale,
      checkoutExperience: "PAYMENT_SETTINGS",
      dpaTransactionOptions: {
        ...dpaTransactionOptions,
        confirmPayment: false,
        authenticationPreferences: {
          payloadRequested: "AUTHENTICATED",
        },
        paymentOptions: [
          {
            dynamicDataType: "CARD_APPLICATION_CRYPTOGRAM_SHORT_FORM",
          },
        ],
      },
    });
  }

  /**
   * This should be called after the {@link Click2Pay.init init} method.
   * If the user is recognized, it returns an array of masked card information otherwise it returns an empty array.
   */
  getCards(): Promise<MaskedCard[]> {
    return this.masterCard.getCards();
  }

  /**
   * Card List related methods and event listeners
   * This object contains methods for interacting with the card list UI component.
   * Make sure to include the `<src-card-list>` element in your HTML with the id `mh-src-card-list`.
   * ```html
   * <src-card-list id="mh-src-card-list"></src-card-list>
   * ```
   * Example:
   * ```ts
   * // Load the cards into the card list
   * const maskedCards = await click2pay.getCards();
   * await click2pay.cardList.loadCards({ maskedCards });
   */
  cardList = {
    /**
     * Returns the underlying MasterCard `<src-card-list>` element
     */
    async getCardListEl() {
      await customElements.whenDefined("src-card-list");
      return document.getElementById("mh-src-card-list") as any;
    },
    /**
     * Displays the provided array of masked cards the Card List.
     * Make sure to include the `<src-card-list>` element in your HTML with the id `mh-src-card-list`.
     * ```html
     * <src-card-list id="mh-src-card-list"></src-card-list>
     * ```
     */
    async loadCards({ maskedCards }: { maskedCards: MaskedCard[] }) {
      const cardListEl = await this.getCardListEl();
      await cardListEl.loadCards(maskedCards);
    },

    /**
     * Adds an event listener to the underlying MasterCard `<src-card-list>` element.
     * - `selectSrcDigitalCardId`: Fired when the user selects a card from the list. The event detail contains the selected `srcDigitalCardId`.
     * - `clickAddCardLink`: Fired when the user clicks the "Add Card" link.
     * - `clickSignOutLink`: Fired when the user clicks the "Sign Out" link.
     * - `close`: Fired when the user clicks the "Cancel" button.
     *
     * Returns a cleanup function to remove the event listener.
     */
    addEventListener<T extends CardListEvent>(
      event: T,
      callback: (event: CardListEventMap[T]) => void,
    ) {
      document
        .getElementById("mh-src-card-list")
        ?.addEventListener(event, callback as EventListener);

      return () =>
        document
          .getElementById("mh-src-card-list")
          ?.removeEventListener(event, callback as EventListener);
    },
  };

  /**
   * Check out with an identified card.
   */
  async checkoutWithCard({
    dpaTransactionOptions,
    ...options
  }: CheckoutWithCardOptions): Promise<CheckoutResponse> {
    const width = 480;
    const height = 700;

    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const windowRef = window.open(
      undefined,
      undefined,
      `width=${width},height=${height},left=${left},top=${top}`,
    );
    try {
      const result = await this.masterCard.checkoutWithCard({
        ...options,
        dpaTransactionOptions: {
          ...dpaTransactionOptions,
          confirmPayment: false,
          authenticationPreferences: {
            payloadRequested: "AUTHENTICATED",
          },
          paymentOptions: [
            {
              dynamicDataType: "CARD_APPLICATION_CRYPTOGRAM_SHORT_FORM",
            },
          ],
        },
        complianceSettings: this.complianceSettings,
        windowRef,
      });

      windowRef?.close();
      return result;
    } catch (error) {
      windowRef?.close();
      return Promise.reject(error);
    }
  }

  /**
   * Initiates the authentication process.
   *  Make sure to include a `<div />` element in your HTML with the id `mh-src-otp-container`.
   * @example
   * ```html
   * <div id="mh-src-otp-container" style="height: 480px; width: 100%; display: none"></div>
   * ```
   */
  async authenticate({
    identityType,
    identityValue,
  }: Click2PayAuthenticateOptions) {
    const deferredPromise = new DeferredPromise<Click2PayAuthenticateResult>();
    const otpContainer = document.getElementById("mh-src-otp-container")!;

    throwIf(
      !otpContainer,
      "Couldn't find an element with id mh-src-otp-container to render the iframe!",
    );

    otpContainer.style.setProperty("display", "block");

    const iframe = document.createElement("iframe");
    iframe.style.setProperty("display", "block");
    iframe.style.setProperty("border", "0");
    iframe.style.setProperty("width", "100%");
    iframe.style.setProperty("height", "480px");
    otpContainer.replaceChildren(iframe);

    try {
      const result = await this.masterCard.authenticate({
        windowRef: iframe.contentWindow,
        requestRecognitionToken: true,
        accountReference: {
          consumerIdentity: {
            identityType,
            identityValue,
          },
        },
      });

      iframe.remove();
      otpContainer.style.setProperty("display", "none");

      if (result.cards.length === 0) {
        deferredPromise.resolve({ action: "CONSUMER_NOT_PRESENT" });
      } else {
        deferredPromise.resolve({
          action: "AUTHENTICATED",
          cards: result.cards,
          recognitionToken: result.recognitionToken,
        });
      }
    } catch (error: any) {
      otpContainer.style.setProperty("display", "none");
      iframe.remove();

      const reason = error?.reason;
      deferredPromise.resolve({
        action: reason,
      });
    }

    return deferredPromise.promise;
  }

  /**
   * Tokenizes the card information for checkout with a new card.
   */
  async #tokenizeCard() {
    const tokenizationPromise = new DeferredPromise<{
      encryptedCard: string;
      cardBrand: string;
    }>();

    const VAULT_INPUT_IFRAME_URL = getVaultInputIframeUrl();

    const url = new URL(
      `${VAULT_INPUT_IFRAME_URL}/vaultClickToPay/vaultClickToPay.html`,
    );

    const iframe = document.createElement("iframe");

    url.searchParams.set("host", btoa(window.location.origin)); // the application that is using the SDK
    if (this.env) url.searchParams.set("env", this.env);
    if (this.srcDpaId) url.searchParams.set("srcDpaId", this.srcDpaId);
    if (this.dpaLocale) url.searchParams.set("dpaLocale", this.dpaLocale);

    iframe.id = "moneyhash-c2p-token-iframe";
    iframe.src = url.toString();
    iframe.hidden = true;

    const onReceiveMessage = async (event: MessageEvent) => {
      if (event.origin !== VAULT_INPUT_IFRAME_URL) return;
      const { type, data } = event.data;
      if (type === "vaultClickToPay:success") {
        tokenizationPromise.resolve(data);
        window.removeEventListener("message", onReceiveMessage);
        iframe.remove();
      } else if (type === "vaultClickToPay:error") {
        tokenizationPromise.reject(data);
        window.removeEventListener("message", onReceiveMessage);
        iframe.remove();
      }
    };

    window.addEventListener("message", onReceiveMessage);
    document.body.appendChild(iframe);

    return tokenizationPromise.promise;
  }

  /**
   * Enrolls a new card during checkout.
   * This card will be enrolled to the profile identified by the session, unless this is a guest checkout.
   */
  async checkoutWithNewCard({
    dpaTransactionOptions,
    ...options
  }: CheckoutWithNewCardOptions): Promise<CheckoutResponse> {
    const missingCardElement = getMissingCardElement(this.mountedCardElements);
    throwIf(
      !!missingCardElement,
      `You must mount ${missingCardElement} element!`,
    );

    const { encryptedCard, cardBrand } = await this.#tokenizeCard();

    const width = 480;
    const height = 700;

    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const windowRef = window.open(
      undefined,
      undefined,
      `width=${width},height=${height},left=${left},top=${top}`,
    );
    try {
      const result = await this.masterCard.checkoutWithNewCard({
        ...options,
        dpaTransactionOptions: {
          ...dpaTransactionOptions,
          confirmPayment: false,
          authenticationPreferences: {
            payloadRequested: "AUTHENTICATED",
          },
          paymentOptions: [
            {
              dynamicDataType: "CARD_APPLICATION_CRYPTOGRAM_SHORT_FORM",
            },
          ],
        },
        complianceSettings: this.complianceSettings,
        encryptedCard,
        cardBrand,
        windowRef,
      });

      windowRef?.close();
      return result;
    } catch (error) {
      windowRef?.close();
      return Promise.reject(error);
    }
  }

  /**
   * Submits the checkout response obtained from the checkout process to complete the payment.
   */
  pay({
    intentId,
    checkoutResponse,
  }: {
    intentId: string;
    checkoutResponse: CheckoutResponse;
  }) {
    return this.sdkApiHandler.request<IntentDetails<"payment">>({
      api: "sdk:submitReceipt",
      payload: {
        intentId,
        lang: this.lang,
        receipt: JSON.stringify(checkoutResponse),
      },
    });
  }

  /**
   * This method disassociates a recognized Consumer Application/Device from the Consumer’s Profile.
   * When the consumer clicks Not your cards?
   */
  signOut(options?: { recognitionToken?: string }): Promise<SignOutResponse> {
    return this.masterCard.signOut(options);
  }
}
