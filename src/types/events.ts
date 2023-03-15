import type {
  PaymentIntent,
  PaymentTransaction,
  PayoutIntent,
  PayoutTransaction,
} from "./intent";

export type OnSuccessEventOptions =
  | {
      type: "payment";
      intent: PaymentIntent;
      actionData: PaymentTransaction;
    }
  | {
      type: "payout";
      intent: PayoutIntent;
      actionData: PayoutTransaction;
    };

export type OnFailureEventOptions =
  | {
      type: "payment";
      intent: PaymentIntent;
      actionData: PaymentTransaction;
    }
  | {
      type: "payout";
      intent: PayoutIntent;
      actionData: PayoutTransaction;
    };
