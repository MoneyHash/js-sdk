import MessagingService, { MessagePayload } from "../messagingService";
import throwIf from "../utils/throwIf";
import getChatWidgetUrl from "./getChatWidgetUrl";
import { CHAT_WIDGET_STYLES, CLOSE_ICON, MONEYHASH_LOGO_ICON } from "./styles";
import type {
  ChatWidgetColors,
  ChatWidgetConfig,
  ChatWidgetTheme,
} from "./types";

const CHAT_READY_MESSAGE = "moneyhash:chat:ready";
const CHAT_CONFIGURE_MESSAGE = "moneyhash:chat:configure";
const CHAT_LAYOUT_MESSAGE = "moneyhash:chat:layout";
const CHAT_CLOSE_MESSAGE = "moneyhash:chat:close";
const CHAT_TOGGLE_EXPAND_MESSAGE = "moneyhash:chat:toggle-expand";

/** Matches the panel's full-screen breakpoint in `CHAT_WIDGET_STYLES`. */
const MOBILE_QUERY = "(max-width: 639px)";

/** The launcher's colors when the merchant didn't set them. */
const DEFAULT_LAUNCHER_COLORS: Record<
  ChatWidgetTheme,
  Required<Pick<ChatWidgetColors, "background" | "foreground" | "border">> &
    Pick<ChatWidgetColors, "primary">
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
 * import ChatWidget from "@moneyhash/js-sdk/chat-widget";
 *
 * const chat = new ChatWidget({
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
export default class ChatWidget {
  iframe: HTMLIFrameElement | null = null;

  private config: ChatWidgetConfig;

  private host: HTMLElement | null = null;

  private launcher: HTMLButtonElement | null = null;

  private panel: HTMLElement | null = null;

  private messagingService: MessagingService<MessagePayload[]> | null = null;

  private mobileQuery: MediaQueryList | null = null;

  private isOpen = false;

  private isExpanded = false;

  private visible = true;

  private onMobileChange = () => this.sendLayout();

  constructor(config: ChatWidgetConfig = {}) {
    this.config = config;
  }

  /** Add the launcher to the page. The chat panel loads in the background. */
  render() {
    throwIf(!!this.host, "Chat widget is already rendered!");

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
  setTheme(theme: ChatWidgetTheme) {
    this.config = { ...this.config, theme };
    this.applyTheme();
    this.sendConfig();
  }

  /** Remove the widget from the page. It can be rendered again later. */
  destroy() {
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
    this.messagingService?.send({
      type: CHAT_CONFIGURE_MESSAGE,
      data: this.config,
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
  ChatWidgetAppearance,
  ChatWidgetColors,
  ChatWidgetConfig,
  ChatWidgetPromptPill,
  ChatWidgetTheme,
} from "./types";
