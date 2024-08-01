import {
  IntentType,
  PaymentIntent,
  PaymentMethodSlugs,
  PaymentTransaction,
  PayoutIntent,
  PayoutTransaction,
  Redirect,
  IntentState,
  Shipping,
  ProductItem,
  AppleNativePayData,
} from "./intent";

export type ErrorResponse = {
  code: number;
  message: string;
};

export type IntentDetails<TType extends IntentType> = TType extends "payment"
  ? {
      intent: PaymentIntent;
      transaction: PaymentTransaction;
      redirect: Redirect | null;
      selectedMethod: PaymentMethodSlugs | null;
      /**
       * Intent state to guide you through different actions required. check [README](https://docs.moneyhash.io/docs/javascript-sdk#integrating)
       */
      state: IntentState;
      shippingData: Shipping | null;
      productItems: ProductItem[] | null;
      nativePayData: AppleNativePayData | null;
      __providerId__: string | null;
      recommendedMethods: Method[] | null;
    }
  : {
      intent: PayoutIntent;
      transaction: PayoutTransaction;
      selectedMethod: PaymentMethodSlugs | null;
      /**
       * Intent state to guide you through different actions required. check [README](https://docs.moneyhash.io/docs/javascript-sdk#integrating)
       */
      state: IntentState;
      __providerId__: never;
    };

export interface Method {
  id: PaymentMethodSlugs;
  title: string;
  icons: string[];
  isSelected: boolean;
  confirmationRequired: boolean;
  requiredBillingFields: FormField[] | null;
}
export interface Card {
  id: string;
  brand: string;
  logo: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  country: string | null;
  requiresCvv: boolean;
}

export type CustomerBalances = [
  {
    id: "SELFSERVE_WALLET";
    balance: number;
    icon: string;
    isSelected: boolean;
  },
];

export type IntentMethods<TType extends IntentType> = TType extends "payment"
  ? {
      paymentMethods: Method[];
      expressMethods: Method[];
      savedCards: Card[];
      customerBalances: CustomerBalances;
    }
  : {
      payoutMethods: Method[];
    };

export type FormField = {
  choices?: Record<string, string> | null;
  error_messages: {
    blank: string;
    null?: string;
    required: string;
    invalid: string;
    min_length: string;
    max_length: string;
  };
  field_name: string;
  help_text?: string | null;
  label?: string;
  max_length?: number | null;
  min_length?: number | null;
  read_only: boolean;
  required: boolean;
  type:
    | "PhoneNumberField"
    | "ChoiceField"
    | "CharField"
    | "IntegerField"
    | "EmailField"
    | "DateField";
  value: string;
};
