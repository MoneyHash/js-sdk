export type FormEvents = "validityChange";

export type Elements = {
  create: (elementProps: ElementProps) => Element;
  on: (
    event: FormEvents,
    callback: (data: { isValid: boolean }) => void,
  ) => void;
};

type CardNumberChangeData = {
  first6Digits: number;
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
  on<T extends Exclude<ElementEvents, "cardNumberChange" | "error">>(
    event: T,
    callback: () => void,
  ): void;
  off: (event: ElementEvents) => boolean;
};

export type ElementType =
  | "cardHolderName"
  | "cardNumber"
  | "cardCvv"
  | "cardExpiryMonth"
  | "cardExpiryYear";

export type ElementStyles = {
  color?: string;
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
};

export type ElementEvents =
  | "focus"
  | "blur"
  | "error"
  | "changeInput"
  | "cardNumberChange";

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
      elementType: Exclude<ElementType, "cardHolderName">;
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
      };
    };

type CommonElementOptions = {
  selector: string;
  placeholder?: string;
  styles?: ElementStyles;
  classes?: Partial<Record<ElementClassNames, string>>;
};
