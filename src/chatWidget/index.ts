import type { GeneratePassKeyOptionsResponse } from "../agentic/types";
import MessagingService, { MessagePayload } from "../messagingService";
import throwIf from "../utils/throwIf";
import getChatWidgetUrl from "./getChatWidgetUrl";
import { CHAT_WIDGET_STYLES, CLOSE_ICON, MONEYHASH_LOGO_ICON } from "./styles";
import type {
  MoneyHashAgenticCommerceColors,
  MoneyHashAgenticCommerceConfig,
  MoneyHashAgenticCommercePaymentHandlers,
  MoneyHashAgenticCommerceTheme,
} from "./types";

const CHAT_READY_MESSAGE = "moneyhash:chat:ready";
const CHAT_CONFIGURE_MESSAGE = "moneyhash:chat:configure";
const CHAT_LAYOUT_MESSAGE = "moneyhash:chat:layout";
const CHAT_CLOSE_MESSAGE = "moneyhash:chat:close";
const CHAT_TOGGLE_EXPAND_MESSAGE = "moneyhash:chat:toggle-expand";
const CHAT_CREATE_CONSENT_MESSAGE = "moneyhash:chat:create-consent";
const CHAT_EXECUTE_PAYMENT_MESSAGE = "moneyhash:chat:execute-payment";
const CHAT_PASSKEY_PREPARE_MESSAGE = "moneyhash:chat:passkey-prepare";
const CHAT_PASSKEY_APPROVE_MESSAGE = "moneyhash:chat:passkey-approve";
const CHAT_PAYMENT_RESPONSE_MESSAGE = "moneyhash:chat:payment-response";

/** Checked on `render`, for callers without TypeScript. */
const REQUIRED_CONFIG = [
  "chatSession",
  "publicApiKey",
  "customerId",
  "moneyHash",
  "onCreateConsent",
  "onExecutePayment",
] as const satisfies ReadonlyArray<keyof MoneyHashAgenticCommerceConfig>;

/** The widget's ask to run one of the merchant's payment handlers. */
type PaymentRequest = {
  requestId: string;
  checkoutId?: string;
  amount?: string;
  currency?: string;
  savedCardId?: string | null;
  consentId?: string;
};

/** The widget's ask to prepare or run the consent's passkey ceremony. */
type PassKeyRequest = {
  requestId: string;
  consentId: string;
};

/** A passkey failure as the widget reads it: its message, DOMException name or HTTP status. */
function passKeyError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return { error: error.message || fallback, errorName: error.name };
  }
  // The embed rejects with `{ code, message }`, `code` being the HTTP status,
  // which tells the widget whether a retry can help.
  const { code, message } = (error ?? {}) as {
    code?: unknown;
    message?: unknown;
  };
  return {
    error: typeof message === "string" && message ? message : fallback,
    ...(typeof code === "number" ? { errorCode: code } : {}),
  };
}

/** Matches the panel's full-screen breakpoint in `CHAT_WIDGET_STYLES`. */
const MOBILE_QUERY = "(max-width: 639px)";

/** The launcher's colors when the merchant didn't set them. */
const DEFAULT_LAUNCHER_COLORS: Record<
  MoneyHashAgenticCommerceTheme,
  Required<
    Pick<MoneyHashAgenticCommerceColors, "background" | "foreground" | "border">
  > &
    Pick<MoneyHashAgenticCommerceColors, "primary">
> = {
  light: {
    background: "#ffffff",
    foreground: "#0a0a0a",
    border: "#e5e5e5",
    primary: "#171717",
  },
  dark: {
    background: "#0a0a0a",
    foreground: "#fafafa",
    border: "rgb(255 255 255 / 0.1)",
    primary: "#e5e5e5",
  },
};

/** The widget's default `borderRadius`. */
const DEFAULT_RADIUS = "0.625rem";

/**
 * The MoneyHash commerce chat widget: a launcher in the bottom corner of the
 * page that opens the shopping assistant chat.
 *
 * The launcher is rendered on the page itself (in a shadow root, so it shows
 * instantly and the page's CSS can't affect it). The chat panel is an iframe
 * sized and positioned next to it, and goes full screen on small screens.
 *
 * @example
 * ```ts
 * import MoneyHashAgenticCommerce from "@moneyhash/js-sdk/agentic-commerce";
 * import MoneyHash from "@moneyhash/js-sdk/headless";
 * import Agentic from "@moneyhash/js-sdk/agentic";
 *
 * // Your page's MoneyHash instance, registered with the Agentic plugin.
 * const moneyHash = new MoneyHash({
 *   type: "payment",
 *   publicApiKey: "<your public API key>",
 *   plugins: [new Agentic()],
 * });
 *
 * const chat = new MoneyHashAgenticCommerce({
 *   // From your backend: a chat token for the customer, exchanged for a session.
 *   chatSession: "<the customer's chat session>",
 *   publicApiKey: "<your public API key>",
 *   // The MoneyHash customer your backend creates the consents for.
 *   customerId: "<the customer's MoneyHash ID>",
 *   // The customer approves payments with their passkey on your page.
 *   moneyHash,
 *   // Paying in the chat: the customer adds a card in the widget and approves
 *   // with a passkey; your backend creates and charges the consent.
 *   onCreateConsent: async ({ checkoutId, savedCardId }) => {
 *     const consent = await myBackend.createConsent(checkoutId, savedCardId);
 *     return {
 *       consentId: consent.consent_id,
 *       intentId: consent.intent_id,
 *       intentSecret: consent.intent_secret,
 *     };
 *   },
 *   onExecutePayment: async ({ consentId }) => {
 *     const order = await myBackend.executePayment(consentId);
 *     return { orderId: order.order_id };
 *   },
 *   theme: "dark",
 *   appearance: {
 *     borderRadius: 12,
 *     colors: {
 *       light: { primary: "#4f46e5" },
 *       dark: { primary: "#818cf8", background: "#0b0b12" },
 *     },
 *   },
 *   assistantName: "Acme Concierge",
 *   logoUrl: "https://acme.com/logo.png",
 *   quickPrompts: ["Show me new arrivals", "Track my order"],
 *   cartPopularPicks: [{ label: "Sneakers", prompt: "Show me sneakers" }],
 * });
 *
 * chat.render();
 * chat.setTheme("light");
 * chat.open();
 * chat.hide(); // e.g. while your own drawer is open
 * chat.show();
 * chat.destroy();
 * ```
 */
export default class MoneyHashAgenticCommerce {
  iframe: HTMLIFrameElement | null = null;

  private config: MoneyHashAgenticCommerceConfig;

  private host: HTMLElement | null = null;

  private launcher: HTMLButtonElement | null = null;

  private panel: HTMLElement | null = null;

  private messagingService: MessagingService<MessagePayload[]> | null = null;

  private mobileQuery: MediaQueryList | null = null;

  private isOpen = false;

  private isExpanded = false;

  private visible = true;

  /** Each consent's passkey options, loaded right before its ceremony. */
  private passKeyOptions = new Map<string, GeneratePassKeyOptionsResponse>();

  private passKeyAbort: AbortController | null = null;

  private onMobileChange = () => this.sendLayout();

  constructor(config: MoneyHashAgenticCommerceConfig) {
    this.config = config;
  }

  /** Add the launcher to the page. The chat panel loads in the background. */
  render() {
    throwIf(!!this.host, "Chat widget is already rendered!");
    REQUIRED_CONFIG.forEach(name =>
      throwIf(!this.config?.[name], `Chat widget \`${name}\` is required.`),
    );

    const widgetUrl = getChatWidgetUrl();
    throwIf(
      !widgetUrl,
      "Chat widget URL is not configured. Set `window.MONEYHASH_CHAT_WIDGET_URL` before rendering the chat widget.",
    );

    const url = new URL(widgetUrl!);
    url.searchParams.set("sdk", "true");
    url.searchParams.set("parent", window.location.origin);
    url.searchParams.set("version", SDK_VERSION);

    const host = document.createElement("div");
    host.setAttribute("data-moneyhash-chat-widget", "");
    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = CHAT_WIDGET_STYLES;

    const panel = document.createElement("div");
    panel.className = "panel";

    const iframe = document.createElement("iframe");
    iframe.src = url.toString();
    // The customer approves payments in the chat with a passkey.
    iframe.allow = [
      `publickey-credentials-get ${url.origin}`,
      `publickey-credentials-create ${url.origin}`,
      `payment ${url.origin}`,
    ].join("; ");
    iframe.title = this.config.assistantName ?? "Shopping Assistant";
    panel.appendChild(iframe);

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "launcher";
    launcher.addEventListener("click", () =>
      this.isOpen ? this.close() : this.open(),
    );

    shadow.append(style, panel, launcher);
    document.body.appendChild(host);

    this.host = host;
    this.panel = panel;
    this.iframe = iframe;
    this.launcher = launcher;
    this.renderLauncher();
    this.applyTheme();
    this.applyVisibility();

    this.mobileQuery = window.matchMedia(MOBILE_QUERY);
    this.mobileQuery.addEventListener("change", this.onMobileChange);

    this.messagingService = new MessagingService({
      target: iframe.contentWindow as Window,
      targetOrigin: url.origin,
    });

    this.messagingService.onReceive(event => {
      switch (event.data.type) {
        case CHAT_READY_MESSAGE:
          this.sendConfig();
          this.sendLayout();
          break;

        case CHAT_CLOSE_MESSAGE:
          this.close();
          break;

        case CHAT_TOGGLE_EXPAND_MESSAGE:
          this.isExpanded = !this.isExpanded;
          this.panel?.toggleAttribute("data-expanded", this.isExpanded);
          this.sendLayout();
          break;

        case CHAT_CREATE_CONSENT_MESSAGE: {
          const { requestId, checkoutId, amount, currency, savedCardId } = event
            .data.data as PaymentRequest;
          this.runPaymentHandler(requestId, "onCreateConsent", async () => {
            const consent = await this.config.onCreateConsent({
              checkoutId: checkoutId!,
              amount: amount!,
              currency: currency!,
              savedCardId: savedCardId ?? null,
            });
            return {
              consentId: consent.consentId,
              intentId: consent.intentId ?? null,
              intentSecret: consent.intentSecret ?? null,
            };
          });
          break;
        }

        case CHAT_EXECUTE_PAYMENT_MESSAGE: {
          const { requestId, consentId } = event.data.data as PaymentRequest;
          this.runPaymentHandler(requestId, "onExecutePayment", async () => {
            const payment = await this.config.onExecutePayment({
              consentId: consentId!,
            });
            return { orderId: payment?.orderId ?? null };
          });
          break;
        }

        case CHAT_PASSKEY_PREPARE_MESSAGE: {
          const { requestId, consentId } = event.data.data as PassKeyRequest;
          this.preparePassKey(requestId, consentId);
          break;
        }

        case CHAT_PASSKEY_APPROVE_MESSAGE: {
          const { requestId, consentId } = event.data.data as PassKeyRequest;
          this.approvePassKey(requestId, consentId);
          break;
        }

        default:
          break;
      }
    });
  }

  /** Open the chat panel. */
  open() {
    this.setOpen(true);
    this.iframe?.focus();
  }

  /** Close the chat panel. */
  close() {
    this.setOpen(false);
    this.launcher?.focus();
  }

  /**
   * Hide the whole widget, launcher and panel, e.g. while your own drawer or
   * modal is open. The chat stays loaded, so `show` brings it back as it was.
   */
  hide() {
    this.visible = false;
    this.applyVisibility();
  }

  /** Show the widget again after `hide`. */
  show() {
    this.visible = true;
    this.applyVisibility();
  }

  /** Whether the widget is shown, i.e. `hide` hasn't been called since `show`. */
  get isVisible() {
    return this.visible;
  }

  /** Switch the widget between the light and dark theme. */
  setTheme(theme: MoneyHashAgenticCommerceTheme) {
    this.config = { ...this.config, theme };
    this.applyTheme();
    this.sendConfig();
  }

  /** Remove the widget from the page. It can be rendered again later. */
  destroy() {
    this.passKeyAbort?.abort();
    this.passKeyOptions.clear();
    this.messagingService?.abortService();
    this.mobileQuery?.removeEventListener("change", this.onMobileChange);
    this.host?.remove();

    this.messagingService = null;
    this.mobileQuery = null;
    this.host = null;
    this.panel = null;
    this.iframe = null;
    this.launcher = null;
    this.isOpen = false;
    this.isExpanded = false;
  }

  private applyVisibility() {
    if (this.host) this.host.style.display = this.visible ? "" : "none";
  }

  private setOpen(isOpen: boolean) {
    this.isOpen = isOpen;
    this.panel?.toggleAttribute("data-open", isOpen);
    this.renderLauncher();
  }

  private renderLauncher() {
    if (!this.launcher) return;

    const name = this.config.assistantName ?? "Shopping Assistant";
    this.launcher.setAttribute("aria-expanded", String(this.isOpen));
    this.launcher.setAttribute(
      "aria-label",
      `${this.isOpen ? "Close" : "Open"} ${name} chat`,
    );
    if (this.launcher.childElementCount > 0) return;

    const logo = document.createElement("span");
    logo.className = "launcher-icon launcher-logo";
    if (this.config.logoUrl) {
      const image = document.createElement("img");
      image.src = this.config.logoUrl;
      image.alt = "";
      logo.appendChild(image);
    } else {
      logo.innerHTML = MONEYHASH_LOGO_ICON;
    }

    const closeIcon = document.createElement("span");
    closeIcon.className = "launcher-icon launcher-close";
    closeIcon.innerHTML = CLOSE_ICON;

    this.launcher.append(logo, closeIcon);
  }

  /** Colors and radius for the launcher and the panel frame. */
  private applyTheme() {
    if (!this.host) return;

    const theme = this.config.theme ?? "light";
    const { borderRadius = DEFAULT_RADIUS, colors } =
      this.config.appearance ?? {};
    const palette = { ...DEFAULT_LAUNCHER_COLORS[theme], ...colors?.[theme] };
    const radius =
      typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius;

    this.host.style.setProperty("--mh-background", palette.background);
    this.host.style.setProperty("--mh-foreground", palette.foreground);
    this.host.style.setProperty("--mh-border", palette.border);
    this.host.style.setProperty(
      "--mh-primary",
      palette.primary ?? palette.foreground,
    );
    // Matches the widget's panel corners (`rounded-2xl`, 1.8 × the radius).
    this.host.style.setProperty("--mh-panel-radius", `calc(${radius} * 1.8)`);
  }

  private sendConfig() {
    // Functions and the MoneyHash instance can't cross `postMessage`; they
    // stay on this page.
    const { onCreateConsent, onExecutePayment, moneyHash, ...config } =
      this.config;
    this.messagingService?.send({
      type: CHAT_CONFIGURE_MESSAGE,
      data: config,
    });
  }

  /**
   * Run one of the merchant's payment handlers for the widget and send back
   * what it resolved with, or why it failed.
   */
  private async runPaymentHandler(
    requestId: string,
    name: keyof MoneyHashAgenticCommercePaymentHandlers,
    run: () => Promise<unknown>,
  ) {
    try {
      this.reply(requestId, { result: await run() });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`MoneyHash chat widget: \`${name}\` failed`, error);
      this.reply(requestId, {
        error: error instanceof Error ? error.message : `\`${name}\` failed.`,
      });
    }
  }

  /**
   * Load the consent's passkey options when the customer taps to approve,
   * right before the widget asks for the ceremony.
   */
  private async preparePassKey(requestId: string, consentId: string) {
    try {
      const options =
        await this.config.moneyHash.agentic.generatePassKeyOptions({
          consentId,
        });
      this.passKeyOptions.set(consentId, options);
      this.reply(requestId, { result: { mode: options.mode } });
    } catch (error) {
      this.reply(
        requestId,
        passKeyError(error, "The passkey couldn't be prepared."),
      );
    }
  }

  /**
   * Approve the consent with the customer's passkey on this page, where
   * passkeys work in every browser and with password-manager extensions.
   */
  private async approvePassKey(requestId: string, consentId: string) {
    const options = this.passKeyOptions.get(consentId);
    // A challenge is good for one ceremony; the widget prepares a new one.
    this.passKeyOptions.delete(consentId);
    this.passKeyAbort?.abort();
    const controller = new AbortController();
    this.passKeyAbort = controller;

    try {
      if (!options) throw new Error("The passkey isn't prepared.");
      // Browsers that carry the tap in the chat over to this page open the
      // prompt right away; elsewhere the customer confirms here first.
      const { userActivation } = navigator as Navigator & {
        userActivation?: { isActive: boolean };
      };
      if (!userActivation?.isActive) {
        await this.confirmPassKey(controller.signal);
      }

      const { agentic } = this.config.moneyHash;
      const credential = await agentic.authenticatePassKey(
        options,
        controller.signal,
      );
      if (!credential) {
        throw new DOMException("No passkey was returned.", "NotAllowedError");
      }
      const { status } = await agentic.verifyPassKeyAuthentication({
        consentId,
        credential,
      });
      this.reply(requestId, { result: { status } });
    } catch (error) {
      this.reply(
        requestId,
        passKeyError(error, "The passkey couldn't be verified."),
      );
    } finally {
      if (this.passKeyAbort === controller) this.passKeyAbort = null;
    }
  }

  /**
   * Ask the customer to confirm on this page, so the passkey prompt opens
   * from a tap the browser credits to this page.
   */
  private confirmPassKey(signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      if (!this.panel) {
        reject(new DOMException("The chat was closed.", "AbortError"));
        return;
      }

      const overlay = document.createElement("div");
      overlay.className = "passkey-confirm";

      const dialog = document.createElement("div");
      dialog.className = "passkey-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "mh-passkey-title");

      const title = document.createElement("p");
      title.id = "mh-passkey-title";
      title.className = "passkey-title";
      title.textContent = "Approve with your passkey";

      const approve = document.createElement("button");
      approve.type = "button";
      approve.className = "passkey-approve";
      approve.textContent = "Continue";

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "passkey-cancel";
      cancel.textContent = "Cancel";

      const listeners = new AbortController();
      const finish = (settle: () => void) => {
        listeners.abort();
        overlay.remove();
        settle();
      };

      signal.addEventListener(
        "abort",
        () =>
          finish(() =>
            reject(
              new DOMException("Passkey approval was replaced.", "AbortError"),
            ),
          ),
        { signal: listeners.signal },
      );
      approve.addEventListener("click", () => finish(resolve));
      cancel.addEventListener("click", () =>
        finish(() =>
          reject(
            new DOMException(
              "Passkey approval was cancelled.",
              "NotAllowedError",
            ),
          ),
        ),
      );

      dialog.append(title, approve, cancel);
      overlay.appendChild(dialog);
      this.panel.appendChild(overlay);
      approve.focus();
    });
  }

  private reply(requestId: string, data: Record<string, unknown>) {
    this.messagingService?.send({
      type: CHAT_PAYMENT_RESPONSE_MESSAGE,
      data: { requestId, ...data },
    });
  }

  private sendLayout() {
    this.messagingService?.send({
      type: CHAT_LAYOUT_MESSAGE,
      data: {
        mobile: Boolean(this.mobileQuery?.matches),
        expanded: this.isExpanded,
      },
    });
  }
}

export type {
  MoneyHashAgenticCommerceAppearance,
  MoneyHashAgenticCommerceColors,
  MoneyHashAgenticCommerceConfig,
  MoneyHashAgenticCommerceConsent,
  MoneyHashAgenticCommerceCreateConsentEvent,
  MoneyHashAgenticCommerceExecutePaymentEvent,
  MoneyHashAgenticCommercePaymentHandlers,
  MoneyHashAgenticCommercePaymentResult,
  MoneyHashAgenticCommercePromptPill,
  MoneyHashAgenticCommerceTheme,
} from "./types";
