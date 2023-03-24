type ConstructorOptions = {
  target: Window;
  targetOrigin: string;
};

export type MessagePayload = {
  type: string;
  data?: Record<string, unknown>;
};

export default class MessagingService<T extends Array<MessagePayload>> {
  private target: Window;

  private targetOrigin: string;

  private listeners: Array<
    (event: MessageEvent<T[number]>, reply: MessagingService<T>["send"]) => void
  >;

  private onIncomingMessageBind = this.onIncomingMessage.bind(this);

  constructor(options: ConstructorOptions) {
    this.target = options.target;
    this.targetOrigin = options.targetOrigin;
    this.listeners = [];

    window.addEventListener("message", this.onIncomingMessageBind);
  }

  send(message: MessagePayload) {
    this.target.postMessage(message, this.targetOrigin);
  }

  onReceive(callbackFn: typeof this.listeners[number]) {
    this.listeners.push(callbackFn);
  }

  removeListener(callbackFn: typeof this.listeners[number]) {
    this.listeners = this.listeners.filter(cb => cb !== callbackFn);
  }

  onIncomingMessage(event: MessageEvent) {
    // Don't receive messages from unknown origins
    if (event.origin !== this.targetOrigin) {
      return;
    }

    // Iterate and call all listener callbacks
    this.listeners.forEach(listener => {
      listener(event, this.send.bind(this));
    });
  }

  abortService() {
    window.removeEventListener("message", this.onIncomingMessageBind);
  }
}
