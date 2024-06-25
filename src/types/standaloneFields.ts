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
};

export type ElementEvents = "focus" | "blur";

export type ElementsProps = {
  styles?: ElementStyles;
};

export type ElementProps = {
  elementType: ElementType;
  elementOptions: {
    selector: string;
    height?: string;
    placeholder?: string;
    styles?: ElementStyles;
  };
};
