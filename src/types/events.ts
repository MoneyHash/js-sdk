import type {
  IntentType,
  PaymentIntent,
  PayoutIntent,
  PaymentTransaction,
  PayoutTransaction,
  PaymentMethodSlugs,
  IntentState,
  Shipping,
  ProductItem,
  IntentStateDetails,
} from "./intent";

export type PaymentIntentEventOptions = {
  intent: PaymentIntent;
  transaction: PaymentTransaction;
  selectedMethod: PaymentMethodSlugs | null;
  state: IntentState;
  stateDetails: IntentStateDetails<IntentState>;
  shippingData: Shipping | null;
  productItems: ProductItem[] | null;
};

export type PayoutIntentEventOptions = {
  intent: PayoutIntent;
  transaction: PayoutTransaction;
  selectedMethod: PaymentMethodSlugs | null;
  state: IntentState;
  stateDetails: IntentStateDetails<IntentState>;
};

export type OnCompleteEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;

export type OnFailEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;
