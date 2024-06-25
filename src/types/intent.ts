export type IntentType = "payment" | "payout";

export type IntentStatus =
  | "PROCESSED"
  | "UNPROCESSED"
  | "CLOSED"
  | "TIME_EXPIRED"
  | "PENDING"
  | "EXPIRED";

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

export type IntentState =
  | "METHOD_SELECTION"
  | "INTENT_FORM"
  | "INTENT_PROCESSED"
  | "TRANSACTION_WAITING_USER_ACTION"
  | "TRANSACTION_FAILED"
  | "EXPIRED"
  | "CLOSED"
  | "NATIVE_PAY";

export type PurchaseOperationStatus =
  | "pending"
  | "pending_authentication"
  | "pending_external_action"
  | "pending_online_external_action"
  | "pending_authorization"
  | "failed"
  | "successful";

export type AuthorizeOperationStatus =
  | "pending"
  | "pending_authentication"
  | "failed"
  | "successful";

export type CaptureOperationStatus =
  | "pending"
  | "pending_authentication"
  | "failed"
  | "successful";

export type VoidOperationStatus = "pending" | "failed" | "successful";
export type RefundOperationStatus = "pending" | "failed" | "successful";

type TransactionOperationStatusMap = {
  purchase: PurchaseOperationStatus;
  authorize: AuthorizeOperationStatus;
  capture: CaptureOperationStatus;
  refund: RefundOperationStatus;
  void: VoidOperationStatus;
  increase_authorization: AuthorizeOperationStatus;
};

type TransactionStatus = {
  [k in keyof TransactionOperationStatusMap]: `${k}.${TransactionOperationStatusMap[k]}`;
}[keyof TransactionOperationStatusMap];

type TransactionOperation = {
  [k in keyof TransactionOperationStatusMap]: {
    id: string;
    type: k;
    status: `${TransactionOperationStatusMap[k]}`;
    amount: {
      value: number;
      currency: string;
    };
    statuses: {
      id: string;
      value: `${TransactionOperationStatusMap[k]}`;
      code: string;
      message: string;
      created: string;
    }[];
    refund_type?: "full" | "partial" | null;
  };
}[keyof TransactionOperationStatusMap];

export interface AbstractIntent {
  id: string;
  status: IntentStatus;
  amount: {
    value: string;
    currency: string;
    formatted: number;
    maxPayout?: number | null;
  };
  secret: string;
  isLive: boolean;
}

export interface PaymentIntent extends AbstractIntent {
  expirationDate: string | null;
}

export interface PayoutIntent extends AbstractIntent {}

export interface Transaction {
  id: string;
  status: TransactionStatus;
  operations: TransactionOperation[];
  createdDate: string;
  billingData: {
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
  customFields: Record<string, unknown> | null;
  providerTransactionFields: Record<string, unknown>;
  externalActionMessage: string[];
}

export interface PaymentTransaction extends Transaction {
  amount: {
    value: number;
    currency: string;
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

export interface ProductItem {
  name: string;
  type: string;
  amount: string;
  category: string;
  quantity: number;
  description: string;
  subcategory: string;
  reference_id: string;
}

export interface Shipping {
  phone_number: string | null;
  created: string | null;
  modified: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  street: string | null;
  floor: string | null;
  building: string | null;
  state: string | null;
  postal_code: string | null;
  apartment: string | null;
  description: string | null;
  shipping_method: string | null;
}

export interface AppleNativePayData {
  method: "APPLE_PAY";
  merchantId: string;
  countryCode: string;
  currencyCode: string;
  amount: string;
  supportedNetworks: string[];
}

// formFields received in intentDetails
export type FieldType =
  | "text"
  | "number"
  | "email"
  | "date"
  | "phoneNumber"
  | "select"
  | "depSelect";

export type Field<TType extends FieldType = FieldType> = {
  type: FieldType;
  name: string;
  label: string;
  hint: string;
  value: string;
  readOnly: boolean;
  validation: {
    required: boolean;
    minLength: number | null;
    maxLength: number | null;
  };
  options: TType extends "select" ? { label: string; value: string }[] : never;
  dependsOn?: string;
};

export type FormFields = {
  billing: Array<Field> | null;
  shipping: Array<Field> | null;
  card: {
    accessToken: string;
  } | null;
};
