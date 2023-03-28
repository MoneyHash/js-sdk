export type IntentType = "payment" | "payout";

export type IntentStatus =
  | "PROCESSED"
  | "UNPROCESSED"
  | "CLOSED"
  | "TIME_EXPIRED"
  | "PENDING"
  | "EXPIRED";

export type TransactionStatus =
  | "PENDING"
  | "PENDING_APPROVAL"
  | "SUCCESSFUL"
  | "FAILED"
  | "FULLY_REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "VOIDED"
  | "PENDING_AUTHENTICATION"
  | "PENDING_EXTERNAL_ACTION"
  | "PENDING_ONLINE_EXTERNAL_ACTION"
  | "SENDING"
  | "SENT"
  | "BOUNCED"
  | "NOT_DELIVERED";

export type PaymentMethodSlugs =
  | "custom-form"
  | "update-method"
  | "CASH_OUTLET"
  | "CARD"
  | "card_token"
  | "MOBILE_WALLET"
  | "SELFSERVE_WALLET";

export interface AbstractIntent {
  id: string;
  status: IntentStatus;
  amount: {
    value: number;
    currency: string;
  };
  method: PaymentMethodSlugs;
}

export interface PaymentIntent extends AbstractIntent {
  expirationDate: string | null;
}

export interface PayoutIntent extends AbstractIntent {
  max_payout_amount: number | null;
}

export type Transaction = {
  id: string;
  status: TransactionStatus;
  created: string;
};
