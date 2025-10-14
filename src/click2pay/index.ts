import SDKApiHandler from "../sdkApiHandler";
import DeferredPromise from "../standaloneFields/utils/DeferredPromise";
import getVaultInputIframeUrl from "../standaloneFields/utils/getVaultInputIframeUrl";
import type { ElementType } from "../types";
import getMissingCardElement from "../utils/getMissingCardElement";
import loadScript from "../utils/loadScript";
import throwIf from "../utils/throwIf";
import type {
  Click2PayInitOptions,
  MaskedCard,
  CardListEvent,
  CardListEventMap,
  CheckoutWithCardOptions,
  Click2PayLookupOptions,
  DpaPhoneNumber,
  Click2PayAuthenticateOptions,
  CheckoutResponse,
  Click2PayAuthenticateResult,
  CheckoutWithNewCardOptions,
} from "./types";

declare global {
  interface Window {
    MastercardCheckoutServices: any;
  }
}

export default class Click2Pay {
  private sdkApiHandler: SDKApiHandler;

  /**
   * Underlying MasterCard Click2Pay SDK instance
   */
  masterCard: any;

  private masterCardScriptUrl: string | null = null;

  private mountedCardElements: Array<ElementType>;

  constructor(options: {
    sdkApiHandler: SDKApiHandler;
    mountedCardElements: Array<ElementType>;
  }) {
    this.sdkApiHandler = options.sdkApiHandler;
    this.mountedCardElements = options.mountedCardElements;
  }

  /**
   * Loads MasterCard Click2Pay SDK script and initializes it with the provided options
   * and it should be called before any other method.
   */
  async init({ env, dpaLocale, srcDpaId, ...options }: Click2PayInitOptions) {
    const scriptUrl = `https://${
      env === "sandbox" ? "sandbox." : ""
    }src.mastercard.com/srci/integration/2/lib.js?srcDpaId=${srcDpaId}&locale=${dpaLocale}`;

    await loadScript(scriptUrl, "click2pay-sdk");
    this.masterCardScriptUrl = scriptUrl;

    this.masterCard = new window.MastercardCheckoutServices();
    await this.masterCard.init({
      srcDpaId,
      dpaLocale,
      ...options,
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
  async checkoutWithCard(
    options: CheckoutWithCardOptions,
  ): Promise<CheckoutResponse> {
    const width = 480;
    const height = 600;

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
   * Checks whether a specified email address or mobile phone number is known to the Unified Checkout Solution.
   */
  lookUp(options: { email: string }): Promise<{ consumerPresent: boolean }>;
  lookUp(options: {
    mobileNumber: DpaPhoneNumber;
  }): Promise<{ consumerPresent: boolean }>;
  lookUp(options: Click2PayLookupOptions) {
    return this.masterCard.idLookup(options);
  }

  /**
   * Initiates the authentication process by displaying the OTP input UI component.
   * Make sure to include the `<src-otp-input>` element in your HTML with the id `mh-src-otp-input`.
   * ```html
   * <src-otp-input id="mh-src-otp-input"></src-otp-input>
   * ```
   */
  async authenticate(options?: Click2PayAuthenticateOptions) {
    const deferredPromise = new DeferredPromise<Click2PayAuthenticateResult>();

    const { loadSupportedValidationChannels = false, notYouRequestedCallback } =
      options || {};
    const { supportedValidationChannels, maskedValidationChannel, network } =
      await this.masterCard.initiateValidation();
    await customElements.whenDefined("src-otp-input");
    const srcOtpInput = document.getElementById("mh-src-otp-input") as any;
    if (loadSupportedValidationChannels) {
      srcOtpInput.loadSupportedValidationChannels(supportedValidationChannels);
    }
    srcOtpInput.setAttribute("masked-identity-value", maskedValidationChannel);
    srcOtpInput.setAttribute("network-id", network);

    // Fix resetting type attribute issue
    const type = srcOtpInput.getAttribute("type");
    if (type)
      srcOtpInput.setAttribute("type", srcOtpInput.getAttribute("type"));
    srcOtpInput.style.display = "block";

    let otp: string | null = null;
    // let rememberMe = true;

    const abortController = new AbortController();

    const handleClose = () => {
      srcOtpInput.style.display = "none";
      abortController.abort();
      deferredPromise.resolve({ action: "CLOSED" });
    };
    srcOtpInput.addEventListener("close", handleClose, {
      signal: abortController.signal,
    });

    srcOtpInput.addEventListener(
      "otpChanged",
      (e: CustomEvent<string>) => {
        otp = e.detail;
      },
      { signal: abortController.signal },
    );

    srcOtpInput.addEventListener(
      "continue",
      async () => {
        try {
          srcOtpInput.removeAttribute("error-reason");
          srcOtpInput.setAttribute("disable-elements", true);
          const maskedCards = await this.masterCard.validate({
            value: otp,
            // rememberMe,
          });
          deferredPromise.resolve({
            action: "AUTHENTICATED",
            maskedCards,
          });
          handleClose();
        } catch (error: any) {
          srcOtpInput.setAttribute("error-reason", error.reason);
        }
        srcOtpInput.setAttribute("disable-elements", false);
      },
      { signal: abortController.signal },
    );

    // srcOtpInput.addEventListener(
    //   "rememberMe",
    //   (e: CustomEvent<{ rememberMe: boolean }>) => {
    //     rememberMe = e.detail.rememberMe;
    //   },
    //   { signal: abortController.signal },
    // );

    srcOtpInput.addEventListener("notYouRequested", () => {
      notYouRequestedCallback?.({
        close: handleClose,
      });
    });

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
    if (this.masterCardScriptUrl)
      url.searchParams.set("c2p_script_url", this.masterCardScriptUrl);

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
  async checkoutWithNewCard(
    options?: CheckoutWithNewCardOptions,
  ): Promise<CheckoutResponse> {
    const missingCardElement = getMissingCardElement(this.mountedCardElements);
    throwIf(
      !!missingCardElement,
      `You must mount ${missingCardElement} element!`,
    );

    const { encryptedCard, cardBrand } = await this.#tokenizeCard();

    const width = 480;
    const height = 600;

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
}
