export type Elements = {
  create: (elementProps: ElementProps) => Element;
};

type CardNumberChangeData = {
  first6Digits: number;
  brandIconUrl: string | null;
  brand: string | null;
};

export type Element = {
  mount: () => void;
  on<T extends ElementEvents>(
    event: T,
    callback: (
      data: T extends "cardNumberChange" ? CardNumberChangeData : never,
    ) => void,
  ): void;
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
};

export type ElementEvents =
  | "focus"
  | "blur"
  | "changeInput"
  | "cardNumberChange";

export type ElementsProps = {
  styles?: ElementStyles;
};

export type ElementProps = {
  elementType: ElementType;
  elementOptions: {
    selector: string;
    placeholder?: string;
    styles?: ElementStyles;
  };
};
