import {
  IntentType,
  PaymentIntent,
  PaymentMethodSlugs,
  PaymentTransaction,
  PayoutIntent,
  PayoutTransaction,
  Redirect,
  IntentState,
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
      state: IntentState;
    }
  : {
      intent: PayoutIntent;
      transaction: PayoutTransaction;
      selectedMethod: PaymentMethodSlugs | null;
      state: IntentState;
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
