import MessagingService, { MessagePayload } from "./messagingService";
import throwIf from "./utils/throwIf";
import warnIf from "./utils/warnIf";
import {
  ButtonStyle,
  InputStyle,
  IntentType,
  OnCompleteEventOptions,
  OnFailEventOptions,
} from "./types";

const supportedTypes = new Set<IntentType>(["payment", "payout"]);
const supportedLanguages = new Set(["en", "fr", "ar"]);
export interface SDKEmbedOptions<TType extends IntentType> {
  type: TType;
  locale?: string;
  onComplete?(event: OnCompleteEventOptions<TType>): void;
  onFail?(event: OnFailEventOptions<TType>): void;
  styles?: {
    submitButton?: ButtonStyle;
    input?: InputStyle;
  };
}

export default class SDKEmbed<TType extends IntentType> {
  private options: SDKEmbedOptions<TType> & { headless?: boolean };

  messagingService: MessagingService<MessagePayload[]> | null = null;

  iframe: HTMLIFrameElement | null = null;

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

    this.iframe = document.createElement("iframe");
    const url = new URL(
      `${import.meta.env.VITE_IFRAME_URL}/embed/${
        this.options.type
      }/${intentId}?`,
    );

    const lang = this.options.locale?.split("-")[0];
    if (lang) url.searchParams.set("lang", lang);

    this.iframe.src = url.toString();
    this.iframe.style.height = "100%";
    this.iframe.style.width = "100%";
    this.iframe.style.border = "0";

    const container = document.querySelector(selector);
    throwIf(!container, `Couldn't find an element with selector ${selector}!`);

    container!.replaceChildren(this.iframe);

    this.messagingService = new MessagingService({
      target: this.iframe.contentWindow as Window,
      targetOrigin: import.meta.env.VITE_IFRAME_URL,
    });

    this.messagingService.onReceive(event => {
      const { type, data } = event.data;
      switch (type) {
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

    this.iframe.onload = () => {
      if (this.options.headless) {
        this.messagingService?.send({
          type: "headlessMode",
        });
      }

      // send customized styles at initial load
      if (this.options.styles) {
        this.messagingService?.send({
          type: "styles",
          data: { styles: this.options.styles },
        });
      }
    };
  }

  setLocale(locale: string) {
    this.options.locale = locale;
    this.messagingService?.send({
      type: "changeLanguage",
      data: { locale },
    });
  }

  abortService() {
    this.messagingService?.abortService();
  }
}
