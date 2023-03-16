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
  amount_currency: string;
  secret: string;
  is_live: boolean;
  hide_amount_sidebar: boolean;
  hide_header: boolean;
  hide_navigation_to_payment_methods: boolean;
  form_only: boolean;
  status: IntentStatus;
  show_steps: boolean;
  hide_retry_button: boolean;
  expiration_date: string | null;
  hide_try_different_method_button?: boolean;
  back_url?: string;
  formatted_amount?: number;
  payment_methods?: PaymentMethod[];
}

export interface AbstractTransaction {
  status: TransactionStatus;
  localized_status: string;
  id: string;
  amount_currency: string;
  billing_data: {
    apartment: string | null;
    building: string | null;
    city: string | null;
    country: string | null;
    email: string | null;
    first_name: string | null;
    floor: string | null;
    last_name: string | null;
    name: string | null;
    phone_number: string | null;
    postal_code: string | null;
    state: string | null;
    street: string | null;
  };
  external_action_message: string[];
  created: Date;
  custom_message: string;
  custom_fields?: Record<string, string | number | boolean>;
}

export interface PaymentIntent extends AbstractIntent {
  amount: string;
  subtotal_amount: string;
  formatted_amount: number;
  payment_methods: PaymentMethod[];
  hide_retry_button: boolean;
  hide_try_different_method_button: boolean;
  back_url?: string;
  hide_loader_message?: boolean;
  hide_form_header_message?: boolean;
  template?: IntentTemplate;
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

export interface PayoutIntent extends AbstractIntent {
  max_payout_amount: number;
  amount: number;
  payout_methods: PayoutMethod[];
  hide_loader_message?: boolean;
  hide_form_header_message?: boolean;
}
