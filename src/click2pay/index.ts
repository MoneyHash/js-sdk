import SDKApiHandler from "../sdkApiHandler";
import loadScript from "../utils/loadScript";
import type {
  Click2PayInitOptions,
  MaskedCard,
  CardListEvent,
  CardListEventMap,
  CheckoutWithCardOptions,
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

  constructor(options: { sdkApiHandler: SDKApiHandler }) {
    this.sdkApiHandler = options.sdkApiHandler;
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

  async checkoutWithCard(options: CheckoutWithCardOptions): Promise<any> {
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
