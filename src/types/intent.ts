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
  | "CASH_OUTLET"
  | "MOBILE_WALLET"
  | "CARD"
  | "USSD"
  | "KNET"
  | "CASH_COLLECTION"
  | "AMAN_MASARY"
  | "PAYPAL"
  | "PAY_AT_FAWRY"
  | "VALU"
  | "SHAHRY"
  | "CASH_ON_DELIVERY"
  | "BANK_INSTALLMENTS"
  | "BANK_TRANSFERS"
  | "REFERENCE_NUMBER"
  | "SELFSERVE_WALLET"
  | "APPLE_PAY"
  | "GOOGLE_PAY"
  | "M_PESA"
  | "MOBILE_MONEY"
  | "CRYPTO_WALLET"
  | "NAPS"
  | "FORSA"
  | "SYMPL"
  | "TABBY"
  | "SOUHOOLA"
  | "GETGO"
  | "SAMSUNG_PAY"
  | "QPAY"
  | "TAMARA"
  | "BENEFIT"
  | "STC"
  | "BANK_ACCOUNT"
  | "CASH";

export interface AbstractIntent {
  id: string;
  status: IntentStatus;
  amount: {
    value: number;
    currency: string;
  };
  method: PaymentMethodSlugs;
  secret: string;
  isLive: boolean;
}

export interface PaymentIntent extends AbstractIntent {
  expirationDate: string | null;
}

export interface PayoutIntent extends AbstractIntent {
  maxPayoutAmount: number | null;
}

export interface Transaction {
  id: string;
  status: TransactionStatus;
  created: string;
  customFields: Record<string, string | number | boolean> | null;
  providerTransactionFields: Record<string, unknown>;
  externalActionMessage: string[];
}

export interface PaymentTransaction extends Transaction {
  amount: {
    value: number;
    currency: string;
  };
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
  paymentMethodName: string;
  paymentMethod: PaymentMethodSlugs;
  customFormAnswers: {
    formFields: Record<string, string | number | boolean>;
  } | null;
}

export interface PayoutTransaction extends Transaction {
  amount: {
    value: string;
    currency: string;
  };
  payoutMethodName: string;
  payoutMethod: PaymentMethodSlugs;
}

export interface Redirect {
  redirectUrl: string;
}
