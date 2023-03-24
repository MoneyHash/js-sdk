import MessagingService, { MessagePayload } from "./messagingService";

export default class SDKApiHandler {
  private static messagingService: MessagingService<MessagePayload[]> | null =
    null;

  private static isCommunicationReady: Promise<void>;

  constructor() {
    this.initSDKCommunicationIframe();
  }

  private initSDKCommunicationIframe() {
    if (document.getElementById("moneyhash-headless-sdk")) return;

    const iframe = document.createElement("iframe");
    iframe.id = "moneyhash-headless-sdk";
    iframe.src = `${import.meta.env.VITE_IFRAME_URL}/embed/headless-sdk`;
    iframe.hidden = true;
    document.body.appendChild(iframe);

    SDKApiHandler.messagingService = new MessagingService({
      target: iframe.contentWindow as Window,
      targetOrigin: import.meta.env.VITE_IFRAME_URL,
    });

    SDKApiHandler.isCommunicationReady = new Promise(res => {
      iframe.onload = () => res();
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
}
