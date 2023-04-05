import type {
  IntentType,
  PaymentIntent,
  PayoutIntent,
  PaymentTransaction,
  PayoutTransaction,
  Redirect,
  PaymentMethodSlugs,
} from "./intent";

export type PaymentIntentEventOptions = {
  intent: PaymentIntent;
  transaction: PaymentTransaction;
  redirect: Redirect | null;
  selectedMethod: PaymentMethodSlugs | null;
};

export type PayoutIntentEventOptions = {
  intent: PayoutIntent;
  transaction: PayoutTransaction;
  selectedMethod: PaymentMethodSlugs | null;
};

export type OnCompleteEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;

export type OnFailEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;
