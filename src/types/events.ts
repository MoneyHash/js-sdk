import type { PaymentIntent, PayoutIntent, TransactionStatus } from "./intent";

type Transaction = {
  id: string | null;
  status: TransactionStatus | null;
};

export type OnSuccessEventOptions =
  | {
      type: "payment";
      intent: PaymentIntent;
      transaction: Transaction;
    }
  | {
      type: "payout";
      intent: PayoutIntent;
      transaction: Transaction;
    };

export type OnFailureEventOptions =
  | {
      type: "payment";
      intent: PaymentIntent;
      transaction: Transaction;
    }
  | {
      type: "payout";
      intent: PayoutIntent;
      transaction: Transaction;
    };
