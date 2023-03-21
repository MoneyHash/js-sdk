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

export type OnCompleteEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;

export type OnFailEventOptions<TType extends IntentType> =
  TType extends "payment"
    ? PaymentIntentEventOptions
    : PayoutIntentEventOptions;
