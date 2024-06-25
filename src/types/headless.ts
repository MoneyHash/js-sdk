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
  FormFields,
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
      formFields: FormFields;
      /**
       * Intent state to guide you through different actions required. check [README](https://docs.moneyhash.io/docs/javascript-sdk#integrating)
       */
      state: IntentState;
      shippingData: Shipping | null;
      productItems: ProductItem[] | null;
      nativePayData: AppleNativePayData | null;
      __providerId__: string | null;
    }
  : {
      intent: PayoutIntent;
      transaction: PayoutTransaction;
      selectedMethod: PaymentMethodSlugs | null;
      formFields: FormFields;
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
