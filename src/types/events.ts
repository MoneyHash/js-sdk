import type {
  IntentType,
  PaymentIntent,
  PayoutIntent,
  Transaction,
} from "./intent";

export type PaymentIntentEventOptions = {
  intent: PaymentIntent;
  transaction: Transaction;
};

export type PayoutIntentEventOptions = {
  intent: PayoutIntent;
  transaction: Transaction;
};

export type OnCompleteEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;

export type OnFailEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;
