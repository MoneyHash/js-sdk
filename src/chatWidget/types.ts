export type ChatWidgetPromptPill = {
  label: string;
  prompt: string;
};

export type ChatWidgetTheme = "light" | "dark";

/**
 * Widget colors for one theme. Accepts any CSS color (`#4f46e5`,
 * `rgb(79 70 229)`, `oklch(0.51 0.23 277)`, ...). Anything left out keeps the
 * MoneyHash default, or is derived from the colors you set.
 */
export type ChatWidgetColors = {
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

export type ChatWidgetAppearance = {
  /**
   * Base corner radius. A number is in px, or pass any CSS length. Larger
   * elements like the panel and message bubbles scale up from it.
   */
  borderRadius?: number | string;
  /** Colors per theme, applied when the widget is in that theme. */
  colors?: {
    light?: ChatWidgetColors;
    dark?: ChatWidgetColors;
  };
};

/**
 * Customization for the commerce chat widget. Every field is optional and
 * falls back to the MoneyHash default.
 */
export type ChatWidgetConfig = {
  /** Color theme of the widget. Defaults to `light`. */
  theme?: ChatWidgetTheme;
  /** Corner radius and colors for each theme. */
  appearance?: ChatWidgetAppearance;
  /** Shown in the chat header and the welcome message. */
  assistantName?: string;
  /** Replaces the MoneyHash logo in the header, welcome message and launcher. */
  logoUrl?: string;
  /** Suggested prompts under "Try asking" on an empty conversation. */
  quickPrompts?: string[];
  /** Prompt pills under "Popular picks" in the empty cart. */
  cartPopularPicks?: ChatWidgetPromptPill[];
};
