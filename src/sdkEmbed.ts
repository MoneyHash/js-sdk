import {
  IFrameSandboxOptions,
  IFrameSandboxOptionsType,
} from "./types/headless";
import MessagingService, { MessagePayload } from "./messagingService";
import {
  ButtonStyle,
  CheckoutStyle,
  InputStyle,
  IntentType,
  LoaderStyle,
  OnCompleteEventOptions,
  OnFailEventOptions,
  SupportedLanguages,
} from "./types";
import getIframeUrl from "./utils/getIframeUrl";
import throwIf from "./utils/throwIf";

const supportedTypes = new Set<IntentType>(["payment", "payout"]);
export const supportedLanguages = new Set(["en", "fr", "ar"]);
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
    checkout?: CheckoutStyle;
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

    return language || "en";
  }

  async render({
    selector,
    intentId,
    sandbox,
    onHeightChange,
  }: {
    selector: string;
    intentId: string;
    sandbox?: IFrameSandboxOptionsType[];
    onHeightChange?: (iframeHeight: number) => void;
  }) {
    // cleanup previous listeners
    this.messagingService?.abortService();

    const IFRAME_URL = getIframeUrl();

    const url = new URL(`${IFRAME_URL}/embed/${this.options.type}/${intentId}`);
    url.searchParams.set("sdk", "true");
    url.searchParams.set("parent", window.location.origin);
    url.searchParams.set("version", SDK_VERSION);
    if (onHeightChange) url.searchParams.set("onDimensionsChange", "true");

    const lang = this.options.locale?.split("-")[0];
    if (lang) url.searchParams.set("lang", lang);

    this.iframe = document.createElement("iframe");
    this.iframe.src = url.toString();
    this.iframe.style.height = "100%";
    this.iframe.style.width = "100%";
    this.iframe.style.border = "0";

    if (sandbox) {
      sandbox.forEach(option => {
        if (IFrameSandboxOptions.includes(option)) {
          this.iframe?.sandbox.add(option);
        }
      });
    }

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
          throwIf(
            !!(this.options?.onComplete && this.options.headless),
            "onComplete is not supported in headless mode, please wait for the promise to be resolved or rejected!",
          );

          this.options.onComplete?.({
            type: this.options.type,
            ...data,
          } as unknown as OnCompleteEventOptions<TType>);

          break;
        }

        case "onFail": {
          throwIf(
            !!(this.options?.onFail && this.options.headless),
            "onFail is not supported in headless mode, please wait for the promise to be resolved or rejected!",
          );

          this.options.onFail?.({
            type: this.options.type,
            ...data,
          } as unknown as OnFailEventOptions<TType>);

          break;
        }

        case "dimensionsChange": {
          onHeightChange?.((data as { iframeHeight: number }).iframeHeight);
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
