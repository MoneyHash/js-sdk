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
  | "NATIVE_PAY"
  // v1.x.x new states
  | "FORM_FIELDS"
  | "URL_TO_RENDER"
  | "SAVED_CARD_CVV"
  | "INSTALLMENT_PLANS";

export type UrlRenderStrategy = "IFRAME" | "POPUP_IFRAME" | "REDIRECT";

export type CardInfo = {
  brand: string;
  brandIconUrl: string;
  last4Digits: string;
};

export type IntentStateDetails<TType extends IntentState> =
  TType extends "FORM_FIELDS"
    ? { formFields: FormFields }
    : TType extends "URL_TO_RENDER"
    ? { url: string; renderStrategy: UrlRenderStrategy }
    : TType extends "SAVED_CARD_CVV"
    ? {
        card: CardInfo;
        cvvField: Field;
      }
    : TType extends "INSTALLMENT_PLANS"
    ? {
        plans: InstallmentPlan[];
      }
    : null;

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

export type SupportedLanguages = "ar" | "en" | "fr";

export interface Discount {
  title: {
    en: string;
    ar?: string;
    fr?: string;
  };
  type: "amount" | "percentage";
  value: string | number;
}

export interface Fee {
  title: {
    en: string;
    ar?: string;
    fr?: string;
  };
  value: string | number;
  discount?: Discount;
}

export interface AbstractIntent {
  id: string;
  status: IntentStatus;
  amount: {
    value: string;
    currency: string;
    formatted: number;
    maxPayout?: number | null;
  };
  subtotalAmount: string | null;
  fees: Array<Fee> | null;
  totalDiscounts: string | null;
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
  responseCode: string;
  responseMessage: string;
  localizedResponseMessage: string;
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
  methodErrorMessage: string | null;
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

// formFields received in intentDetails
export type FieldType =
  | "text"
  | "number"
  | "email"
  | "date"
  | "phoneNumber"
  | "select";

export type Field = {
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
  dependsOn?: string;
  optionsList?: Array<{ label: string; value: string }>;
  optionsMap?: Record<string, Array<{ label: string; value: string }>>;
};

type FormFields = {
  billing: Array<Field> | null;
  shipping: Array<Field> | null;
  card: {
    accessToken: string;
  } | null;
};

export type InstallmentPlan = {
  id: string;
  installmentPeriod: number;
  interestRate: number | null;
  amount: {
    value: string;
    formatted: number;
    currency: number;
  };
  upfrontFees: number | null;
  issuerCode?: string;
};

export type InstallmentPlanPayload = {
  planId: string;
  issuerCode?: string;
};
