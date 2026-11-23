import type Agentic from "../agentic";

export type MoneyHashAgenticCommercePromptPill = {
  label: string;
  prompt: string;
};

export type MoneyHashAgenticCommerceTheme = "light" | "dark";

/**
 * Widget colors for one theme. Accepts any CSS color (`#4f46e5`,
 * `rgb(79 70 229)`, `oklch(0.51 0.23 277)`, ...). Anything left out keeps the
 * MoneyHash default, or is derived from the colors you set.
 */
export type MoneyHashAgenticCommerceColors = {
  /** Panel and input background. */
  background?: string;
  /** Main text color. */
  foreground?: string;
  /** Brand color: buttons, your messages, the send button and focus rings. */
  primary?: string;
  /**
   * Text and icons on `primary`. Defaults to black or white, whichever reads
   * better on `primary`.
   */
  primaryForeground?: string;
  /**
   * Assistant messages, hover states and subtle surfaces. Defaults to a tint
   * of `background` when that is set.
   */
  muted?: string;
  /** Secondary text, e.g. hints and descriptions. */
  mutedForeground?: string;
  /**
   * Borders and dividers. Defaults to a tint of `background` when that is
   * set.
   */
  border?: string;
  /** Success indicators, e.g. the online status dot. */
  success?: string;
};

export type MoneyHashAgenticCommerceAppearance = {
  /**
   * Base corner radius. A number is in px, or pass any CSS length. Larger
   * elements like the panel and message bubbles scale up from it.
   */
  borderRadius?: number | string;
  /** Colors per theme, applied when the widget is in that theme. */
  colors?: {
    light?: MoneyHashAgenticCommerceColors;
    dark?: MoneyHashAgenticCommerceColors;
  };
};

/** Passed to `onCreateConsent` when the customer starts paying in the chat. */
export type MoneyHashAgenticCommerceCreateConsentEvent = {
  /** The checkout the agent asked the customer to pay. */
  checkoutId: string;
  /** The checkout's total in major units, e.g. `"329.00"`. */
  amount: string;
  /** The checkout's ISO currency code, e.g. `"AED"`. */
  currency: string;
  /**
   * The saved card the customer chose, or `null` for a new card. Pass it to
   * the consent as `saved_card_id`: the customer then only approves with their
   * passkey, without paying a zero-auth intent first.
   */
  savedCardId: string | null;
};

/** What `onCreateConsent` resolves with, from your backend's consent. */
export type MoneyHashAgenticCommerceConsent = {
  consentId: string;
  /**
   * The zero-auth intent the customer pays to add their card. Leave it out
   * when the consent reuses a saved card: the customer then only approves
   * with their passkey.
   */
  intentId?: string | null;
  /** The intent's secret, which authorizes the widget's requests on it. */
  intentSecret?: string | null;
};

/** Passed to `onExecutePayment` once the customer approved the consent. */
export type MoneyHashAgenticCommerceExecutePaymentEvent = {
  consentId: string;
};

/** What `onExecutePayment` resolves with, from your backend's order. */
export type MoneyHashAgenticCommercePaymentResult = {
  /** Your order reference, shown to the customer by the assistant. */
  orderId?: string | null;
};

/**
 * Your backend calls for paying in the chat. Both run on your page, so they
 * can call your backend with your own session, and must reject when your
 * backend refuses.
 */
export type MoneyHashAgenticCommercePaymentHandlers = {
  /**
   * The customer said they want to pay: create a MoneyHash consent for the
   * checkout on your backend and resolve with it.
   */
  onCreateConsent: (
    event: MoneyHashAgenticCommerceCreateConsentEvent,
  ) => Promise<MoneyHashAgenticCommerceConsent>;
  /**
   * The customer approved the consent with their passkey: charge it on your
   * backend, place the order and resolve with it.
   */
  onExecutePayment: (
    event: MoneyHashAgenticCommerceExecutePaymentEvent,
  ) => Promise<MoneyHashAgenticCommercePaymentResult>;
};

/**
 * What the widget uses of your MoneyHash headless instance: the `Agentic`
 * plugin's passkey methods.
 */
export type MoneyHashAgenticCommerceMoneyHash = {
  agentic: Pick<
    Agentic,
    | "generatePassKeyOptions"
    | "authenticatePassKey"
    | "verifyPassKeyAuthentication"
  >;
};

/**
 * Configuration for the commerce chat widget. `chatSession`, `publicApiKey`,
 * `customerId`, `moneyHash` and the payment handlers are required; everything
 * else falls back to the MoneyHash default.
 */
export type MoneyHashAgenticCommerceConfig =
  MoneyHashAgenticCommercePaymentHandlers & {
    /**
     * Your page's MoneyHash headless instance, created with your public API key
     * and the `Agentic` plugin.
     * @example
     * ```ts
     * const moneyHash = new MoneyHash({
     *   type: "payment",
     *   publicApiKey,
     *   plugins: [new Agentic()],
     * });
     *
     * new MoneyHashAgenticCommerce({ moneyHash, ... });
     * ```
     */
    moneyHash: MoneyHashAgenticCommerceMoneyHash;
    /**
     * The customer's chat session. Your backend issues a chat token for the
     * customer with your secret API key.
     */
    chatSession: string;
    /**
     * Your account public API key. The widget uses it to collect the customer's
     * card and approve the payment with their passkey.
     */
    publicApiKey: string;
    /**
     * The customer's MoneyHash customer ID, the same customer your backend
     * creates the consents for. The customer can pay with one of their saved
     * cards instead of adding a new one.
     */
    customerId: string;
    /** Color theme of the widget. Defaults to `light`. */
    theme?: MoneyHashAgenticCommerceTheme;
    /** Corner radius and colors for each theme. */
    appearance?: MoneyHashAgenticCommerceAppearance;
    /** Shown in the chat header and the welcome message. */
    assistantName?: string;
    /** Replaces the MoneyHash logo in the header, welcome message and launcher. */
    logoUrl?: string;
    /** Suggested prompts under "Try asking" on an empty conversation. */
    quickPrompts?: string[];
    /** Prompt pills under "Popular picks" in the empty cart. */
    cartPopularPicks?: MoneyHashAgenticCommercePromptPill[];
  };
