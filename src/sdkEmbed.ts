import MessagingService, { MessagePayload } from "./messagingService";
import {
  ButtonStyle,
  InputStyle,
  IntentType,
  LoaderStyle,
  OnCompleteEventOptions,
  OnFailEventOptions,
  SupportedLanguages,
} from "./types";
import getIframeUrl from "./utils/getIframeUrl";
import throwIf from "./utils/throwIf";
import warnIf from "./utils/warnIf";

const supportedTypes = new Set<IntentType>(["payment", "payout"]);
const supportedLanguages = new Set(["en", "fr", "ar"]);
export interface SDKEmbedOptions<TType extends IntentType> {
  /**
   * Intent type `payment`, `payout`
   */
  type: TType;

  /**
   * Locale of rendered embed. Can be changed programmatically with `moneyHash.setLocale`
   */
  locale?: string;

  /**
   * Listen for intent completion. e.g. successful transaction, intent closed, intent expired ...etc
   * @param {OnCompleteEventOptions} event
   *
   * @see {@link PaymentIntentEventOptions} - Payment intent event
   * @see {@link PayoutIntentEventOptions} - Payout intent event
   */
  onComplete?(event: OnCompleteEventOptions<TType>): void;

  /**
   * Listen for intent transaction failure status
   * @param {OnFailEventOptions} event
   *
   * @see {@link PaymentIntentEventOptions} - Payment intent event
   * @see {@link PayoutIntentEventOptions} - Payout intent event
   */
  onFail?(event: OnFailEventOptions<TType>): void;

  /**
   * Customize input styles and submit button of MoneyHash embed
   */
  styles?: {
    submitButton?: ButtonStyle;
    input?: InputStyle;
    loader?: LoaderStyle;
  };
}

export default class SDKEmbed<TType extends IntentType> {
  private options: SDKEmbedOptions<TType> & { headless?: boolean };

  messagingService: MessagingService<MessagePayload[]> | null = null;

  iframe: HTMLIFrameElement | null = null;

  isCommunicationReady: Promise<void> | null = null;

  constructor(options: SDKEmbedOptions<TType> & { headless?: boolean }) {
    throwIf(
      !supportedTypes.has(options.type),
      `MoneyHash constructor must be called with valid type (${[
        ...supportedTypes,
      ].join(" | ")})!`,
    );

    this.options = options;
  }

  get lang() {
    const language = this.options.locale?.split("-")[0];
    warnIf(
      !!language && !supportedLanguages.has(language),
      `Supported languages (${[...supportedLanguages].join(" | ")})`,
    );

    return language || "en";
  }

  render({ selector, intentId }: { selector: string; intentId: string }) {
    // cleanup previous listeners
    this.messagingService?.abortService();

    const IFRAME_URL = getIframeUrl();

    const url = new URL(`${IFRAME_URL}/embed/${this.options.type}/${intentId}`);
    url.searchParams.set("sdk", "true");
    url.searchParams.set("parent", window.location.origin);
    url.searchParams.set("version", SDK_VERSION);

    const lang = this.options.locale?.split("-")[0];
    if (lang) url.searchParams.set("lang", lang);

    this.iframe = document.createElement("iframe");
    this.iframe.src = url.toString();
    this.iframe.style.height = "100%";
    this.iframe.style.width = "100%";
    this.iframe.style.border = "0";

    const container = document.querySelector(selector);
    throwIf(!container, `Couldn't find an element with selector ${selector}!`);

    container!.replaceChildren(this.iframe);

    this.messagingService = new MessagingService({
      target: this.iframe.contentWindow as Window,
      targetOrigin: IFRAME_URL,
    });

    this.isCommunicationReady = new Promise(res => {
      const handleReceive = (event: MessageEvent<MessagePayload>) => {
        if (event.data.type !== "sdk:init") return;
        res();
        this.messagingService?.removeListener(handleReceive);
      };

      this.messagingService?.onReceive(handleReceive);
    });

    this.messagingService.onReceive((event, reply) => {
      const { type, data } = event.data;
      switch (type) {
        case "sdk:init": {
          reply({
            type: "sdk:init",
            data: {
              headless: Boolean(this.options.headless),
              styles: this.options.styles,
            },
          });
          break;
        }

        case "onComplete": {
          this.options.onComplete?.({
            type: this.options.type,
            ...data,
          } as unknown as OnCompleteEventOptions<TType>);

          if (this.options.headless && this.iframe) {
            this.iframe.hidden = true;
          }
          break;
        }

        case "onFail": {
          this.options.onFail?.({
            type: this.options.type,
            ...data,
          } as unknown as OnFailEventOptions<TType>);

          if (this.options.headless && this.iframe) {
            this.iframe.hidden = true;
          }
          break;
        }

        default:
          break;
      }
    });

    return this.isCommunicationReady;
  }

  async setLocale(locale: SupportedLanguages) {
    await this?.isCommunicationReady;
    this.options.locale = locale;
    this.messagingService?.send({
      type: "changeLanguage",
      data: { locale },
    });
  }

  async abortService() {
    await this?.isCommunicationReady;
    this.messagingService?.abortService();
  }
}
