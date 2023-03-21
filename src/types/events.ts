import type {
  IntentType,
  PaymentIntent,
  PayoutIntent,
  TransactionStatus,
} from "./intent";

type Transaction = {
  id: string | null;
  status: TransactionStatus | null;
};

type PaymentIntentEventOptions = {
  intent: PaymentIntent;
  transaction: Transaction;
};

type PayoutIntentEventOptions = {
  intent: PayoutIntent;
  transaction: Transaction;
};

export type OnSuccessEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;

export type OnFailureEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;
