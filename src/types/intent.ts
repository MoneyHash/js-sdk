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

export interface AbstractPaymentMethod {
  checkout_icons?: string[];
  confirmation_required: boolean;
}

export interface PaymentMethod extends AbstractPaymentMethod {
  payment_method_name: string;
  payment_method: string;
  use_for_express_checkout: boolean;
  has_customized_label: boolean;
}

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
  totals: {
    subTotal: number;
    donation?: Record<string, number>;
    tipping?: Record<string, number>;
  };
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

export type PaymentMethodSlugs =
  | "custom-form"
  | "update-method"
  | "CASH_OUTLET"
  | "CARD"
  | "card_token"
  | "MOBILE_WALLET"
  | "SelfServe - Wallet"
  | ""; // TODO: @types-fixes this should be removed

export interface PayoutMethod extends AbstractPaymentMethod {
  payout_method_name: string;
  payout_method: PaymentMethodSlugs;
}

export interface PayoutIntent extends AbstractIntent {}
