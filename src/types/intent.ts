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
  | "SelfServe - Wallet";

export interface AbstractIntent {
  id: string;
  status: IntentStatus;
  amount: {
    value: number;
    currency: string;
  };
  method: PaymentMethodSlugs;
}

export interface IntentTemplate {
  template_id: "adjustable_custom_amounts";
  template_data: Array<{
    id: string;
    title: { en: string; ar?: string; fr?: string };
    type: "donation" | "tipping";
    values: string[];
    selected_value: string | null;
  }>;
}

export interface PaymentIntent extends AbstractIntent {
  expirationDate: string | null;
  totals: {
    subTotal: number;
    donation?: Record<string, number>;
    tipping?: Record<string, number>;
  };
  template: IntentTemplate | null;
}

export interface PayoutIntent extends AbstractIntent {}

export type Transaction = {
  id: string | null;
  status: TransactionStatus | null;
};
