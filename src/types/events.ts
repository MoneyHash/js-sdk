import type {
  IntentType,
  PaymentIntent,
  PayoutIntent,
  PaymentTransaction,
  PayoutTransaction,
  Redirect,
  PaymentMethodSlugs,
  IntentState,
} from "./intent";

export type PaymentIntentEventOptions = {
  intent: PaymentIntent;
  transaction: PaymentTransaction;
  redirect: Redirect | null;
  selectedMethod: PaymentMethodSlugs | null;
  state: IntentState;
};

export type PayoutIntentEventOptions = {
  intent: PayoutIntent;
  transaction: PayoutTransaction;
  selectedMethod: PaymentMethodSlugs | null;
  state: IntentState;
};

export type OnCompleteEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;

export type OnFailEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;
