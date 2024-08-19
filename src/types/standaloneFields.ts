export type Elements = {
  create: (elementProps: ElementProps) => Element;
};

type CardNumberChangeData = {
  first6Digits: number;
  brand: string;
  brandIconUrl: string;
};

export type Element = {
  mount: () => void;
  on<T extends ElementEvents>(
    event: T,
    callback: (
      data: T extends "cardNumberChange" ? CardNumberChangeData : never,
    ) => void,
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
  classNames?: Partial<Record<ElementClassNames, string>>;
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
