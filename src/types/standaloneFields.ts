export type FormEvents = "validityChange";

interface ElementsCreate {
  (elementProps: { elementType: "cardHolderName"; value: string }): {
    clear: () => void;
  };
  (elementProps: ElementProps): Element;
}
export type Elements = {
  create: ElementsCreate;
  on: (event: FormEvents, callback: (isValid: boolean) => void) => void;
  off: (event: FormEvents) => void;
};

export type CardNumberChangeData = {
  first6Digits: number | null;
  first8Digits: number | null;
  brand: string;
  brandIconUrl: string;
};

export type Element = {
  mount: () => void;
  on<T extends Extract<ElementEvents, "cardNumberChange">>(
    event: T,
    callback: (data: CardNumberChangeData) => void,
  ): void;
  on<T extends Extract<ElementEvents, "error">>(
    event: T,
    callback: (data: { isValid: boolean; error: string | null }) => void,
  ): void;
  on<T extends Extract<ElementEvents, "changeInput">>(
    event: T,
    callback: (data: { isValid: boolean; length: number }) => void,
  ): void;
  on<T extends ElementEvents>(event: T, callback: () => void): void;
  off: (event: ElementEvents) => boolean;
  focus: () => void;
  blur: () => void;
  clear: () => void;
};

export type ElementType =
  | "cardHolderName"
  | "cardNumber"
  | "cardCvv"
  | "cardExpiryMonth"
  | "cardExpiryYear";

type VariantStyle =
  | string
  | {
      base: string;
      error?: string;
    };

export type ElementStyles = {
  color?: VariantStyle;
  backgroundColor?: string;
  placeholderColor?: string;
  fontSize?: string;
  fontFamily?: string;
  /**
   * @default "normal"
   */
  fontStyle?: "normal" | "italic" | "oblique";
  fontWeight?: number | string;
  padding?: string;
  height?: string;
  direction?: "ltr" | "rtl";
  textAlign?: "left" | "right" | "center";
};

export type ElementEvents =
  | "mount"
  | "focus"
  | "blur"
  | "error"
  | "changeInput"
  | "cardNumberChange"
  | "key:Backspace"
  | "key:Enter";

export type ElementClassNames = "focus" | "error";

export type ElementsProps = {
  styles?: ElementStyles;
  classes?: Partial<Record<ElementClassNames, string>>;
  /**
   * absolute URL pointing to a CSS file with @font-face definitions,
   * @example "https://fonts.googleapis.com/css?family=Open+Sans&display=swap"
   */
  fontSourceCss?: string;
};

export type ElementProps =
  | {
      elementType: ElementType;
      elementOptions: CommonElementOptions & {
        validation?: never;
      };
    }
  | {
      elementType: "cardHolderName";
      elementOptions: CommonElementOptions & {
        validation?: {
          required?: boolean;
        };
      } & {
        customValidation?: Record<string, string>;
      };
    }
  | {
      elementType: "cardNumber";
      elementOptions: CommonElementOptions & {
        validation?: {
          /**
           * Enable luhn validation for card number.Add commentMore actions
           *
           * This helps verify that the card number follows the [Luhn algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm).
           * @default true
           */
          cardNumber?: boolean;
        };
      };
    };

type CommonElementOptions = {
  selector: string;
  placeholder?: string;
  inputMode?: string;
  styles?: ElementStyles;
  classes?: Partial<Record<ElementClassNames, string>>;
};

export type CardData = {
  first_six_digits: string;
  last_four_digits: string;
  card_scheme: string;
  card_holder_name: string;
  expiry_year: string;
  expiry_month: string;
  is_live: boolean;
  access_token: string;
  card_token: string;
  cvv: string;
  save_card: boolean;
  fingerprint: string;
};
