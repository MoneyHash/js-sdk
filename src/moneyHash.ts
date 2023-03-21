import MessagingService, { type MessagePayload } from "./messagingService";

import type {
  OnFailureEventOptions,
  OnSuccessEventOptions,
  ButtonStyle,
  InputStyle,
  IntentType,
} from "./types";

export interface MoneyHashOptions<TType extends IntentType> {
  type: TType;
  locale?: string;
  onSuccess?(event: OnSuccessEventOptions<TType>): void;
  onFailure?(event: OnFailureEventOptions<TType>): void;
  styles?: {
    submitButton?: ButtonStyle;
    input?: InputStyle;
  };
}

export default class MoneyHash<TType extends IntentType> {
  options: MoneyHashOptions<TType>;

  private messagingService: MessagingService<MessagePayload[]> | null = null;

  constructor(options: MoneyHashOptions<TType>) {
    this.options = options;
  }

  start({ selector, intentId }: { selector: string; intentId: string }) {
    // cleanup previous listeners
    this.messagingService?.abortService();

    const iframe = document.createElement("iframe") as HTMLIFrameElement;
    const url = new URL(
      `${import.meta.env.VITE_IFRAME_URL}/embed/${
        this.options.type
      }/${intentId}?`,
    );

    const lang = this.options.locale?.split("-")[0];
    if (lang) url.searchParams.set("lang", lang);

    iframe.src = url.toString();
    iframe.id = "moneyhash-checkout";
    iframe.style.height = "100%";
    iframe.style.width = "100%";
    iframe.style.border = "0";
    document.querySelector(selector)?.replaceChildren(iframe);

    this.messagingService = new MessagingService({
      target: iframe.contentWindow as Window,
      targetOrigin: import.meta.env.VITE_IFRAME_URL,
    });

    this.messagingService.onReceive(event => {
      if (event.data.type === "onSuccess") {
        this.options.onSuccess?.({
          type: this.options.type,
          ...event.data.data,
        } as unknown as OnSuccessEventOptions<TType>);
      } else if (event.data.type === "onFailure") {
        this.options.onFailure?.({
          type: this.options.type,
          ...event.data.data,
        } as unknown as OnSuccessEventOptions<TType>);
      }
    });

    iframe.onload = () => {
      // send customized styles at initial load
      if (!this.options.styles) return;
      this.messagingService?.send({
        type: "styles",
        data: { styles: this.options.styles },
      });
    };
  }

  setLocale(locale: string) {
    this.messagingService?.send({
      type: "changeLanguage",
      data: { locale },
    });
  }

  removeEventListeners() {
    this.messagingService?.abortService();
  }
}
