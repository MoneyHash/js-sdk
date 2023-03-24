import MessagingService, { MessagePayload } from "./messagingService";
import {
  ButtonStyle,
  InputStyle,
  IntentType,
  OnCompleteEventOptions,
  OnFailEventOptions,
} from "./types";

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
    this.options = options;
  }

  get lang() {
    return this.options.locale?.split("-")[0] || "en";
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
    this.iframe.id = "moneyhash-checkout";
    this.iframe.style.height = "100%";
    this.iframe.style.width = "100%";
    this.iframe.style.border = "0";
    document.querySelector(selector)?.replaceChildren(this.iframe);

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
          break;
        }

        case "onFail": {
          this.options.onFail?.({
            type: this.options.type,
            ...data,
          } as unknown as OnFailEventOptions<TType>);
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
      if (!this.options.styles) {
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
