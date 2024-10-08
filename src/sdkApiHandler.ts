import MessagingService, { MessagePayload } from "./messagingService";
import getIframeUrl from "./utils/getIframeUrl";
import isBrowser from "./utils/isBrowser";

export default class SDKApiHandler {
  private static messagingService: MessagingService<MessagePayload[]> | null =
    null;

  private static isCommunicationReady: Promise<void>;

  constructor() {
    if (isBrowser()) {
      this.initSDKCommunicationIframe();
    }
  }

  private initSDKCommunicationIframe() {
    if (document.getElementById("moneyhash-headless-sdk")) return;

    const IFRAME_URL = getIframeUrl();
    const url = new URL(`${IFRAME_URL}/embed/headless-sdk`);
    url.searchParams.set("sdk", "true");
    url.searchParams.set("parent", window.location.origin);
    url.searchParams.set("version", SDK_VERSION);

    const iframe = document.createElement("iframe");
    iframe.id = "moneyhash-headless-sdk";
    iframe.src = url.toString();
    iframe.hidden = true;
    document.body.appendChild(iframe);

    SDKApiHandler.messagingService = new MessagingService({
      target: iframe.contentWindow as Window,
      targetOrigin: IFRAME_URL,
    });

    SDKApiHandler.isCommunicationReady = new Promise(res => {
      const handleReceive = (event: MessageEvent<MessagePayload>) => {
        if (event.data.type !== "headlessSDK:init") return;
        res();
        SDKApiHandler.messagingService?.removeListener(handleReceive);
      };

      SDKApiHandler.messagingService?.onReceive(handleReceive);
    });
  }

  async request<TResponse>({
    api,
    payload,
  }: {
    api: `sdk:${string}`;
    payload: Record<string, unknown>;
  }): Promise<TResponse> {
    await SDKApiHandler.isCommunicationReady;
    return new Promise((resolve, reject) => {
      SDKApiHandler.messagingService?.send({
        type: api,
        data: payload,
      });

      const handleReceive = (event: MessageEvent<MessagePayload>) => {
        const { type, data } = event.data as any;
        if (type !== api) return;

        if (data.status === "resolved") resolve(data.payload);
        else reject(data.payload);

        SDKApiHandler.messagingService?.removeListener(handleReceive);
      };

      SDKApiHandler.messagingService?.onReceive(handleReceive);
    });
  }

  postMessage(message: string) {
    SDKApiHandler.messagingService?.send({ type: message });
  }
}
