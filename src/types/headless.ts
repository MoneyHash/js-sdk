import {
  Field,
  IntentState,
  IntentStateDetails,
  IntentType,
  PaymentIntent,
  PaymentMethodSlugs,
  PaymentTransaction,
  PayoutIntent,
  PayoutTransaction,
  ProductItem,
  Shipping,
} from "./intent";

export type ErrorResponse = {
  code: number;
  message: string;
};

export type IntentDetails<TType extends IntentType> = TType extends "payment"
  ? {
      intent: PaymentIntent;
      transaction: PaymentTransaction;
      selectedMethod: PaymentMethodSlugs | null;
      /**
       * Intent state to guide you through different actions required. check [README](https://docs.moneyhash.io/docs/javascript-sdk#integrating)
       */
      state: IntentState;
      stateDetails: IntentStateDetails<IntentState>;
      shippingData: Shipping | null;
      productItems: ProductItem[] | null;
      recommendedMethods: Method[] | null;
      lastUsedMethod: LastUsedMethod | null;
      nativePayData?: Record<string, any>;
    }
  : {
      intent: PayoutIntent;
      transaction: PayoutTransaction;
      selectedMethod: PaymentMethodSlugs | null;
      /**
       * Intent state to guide you through different actions required. check [README](https://docs.moneyhash.io/docs/javascript-sdk#integrating)
       */
      state: IntentState;
      stateDetails: IntentStateDetails<IntentState>;
      nativePayData?: never;
    };

export interface Method {
  id: PaymentMethodSlugs;
  title: string;
  icons: string[];
  isSelected: boolean;
  confirmationRequired: boolean;
  requiredBillingFields: Field[] | null;
  requiredShippingFields: Field[] | null;
  nativePayData: Record<string, any> | null;
}
export interface Card {
  id: string;
  brand: string;
  logo: string;
  first6Digits: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  country: string | null;
  requiresCvv: boolean;
}

export type CustomerBalances = [
  {
    id: "SELFSERVE_WALLET";
    balance: number;
    icon: string;
    isSelected: boolean;
  },
];

export type IntentMethods<TType extends IntentType> = TType extends "payment"
  ? {
      paymentMethods: Method[];
      expressMethods: Method[];
      savedCards: Card[];
      customerBalances: CustomerBalances;
    }
  : {
      payoutMethods: Method[];
    };

export type LastUsedMethod = {
  type: "customer_balance" | "saved_card" | "payment_method";
  id: PaymentMethodSlugs | (string & {});
};

export type FormField = {
  choices?: Record<string, string> | null;
  error_messages: {
    blank: string;
    null?: string;
    required: string;
    invalid: string;
    min_length: string;
    max_length: string;
  };
  field_name: string;
  help_text?: string | null;
  label?: string;
  max_length?: number | null;
  min_length?: number | null;
  read_only: boolean;
  required: boolean;
  type:
    | "PhoneNumberField"
    | "ChoiceField"
    | "CharField"
    | "IntegerField"
    | "EmailField"
    | "DateField";
  value: string;
};

export type RenderOptions = {
  /**
   * Redirect to new window for `renderStrategy: "REDIRECT"`
   */
  redirectToNewWindow?: boolean;
  /**
   * Popup window size and positions for `renderStrategy: "POPUP_IFRAME"`
   * @default "width=600,height=400,left=200,top=200"
   */
  window?: {
    width?: number;
    height?: number;
    left?: number;
    top?: number;
  };
};

export type GetMethodsOptions = {
  currency: string;
  amount?: string | number;
  customer?: string;
  flowId?: string;
  operation?: "purchase" | "authorize";
  /**
   * Filter the flow based on custom fields
   */
  customFields?: Record<string, string | number | boolean>;
};

export type CardTokenState =
  | "CARD_INTENT_SUCCESSFUL"
  | "CARD_INTENT_FAILED"
  | "URL_TO_RENDER";

export type CardIntentDetails =
  | {
      state: Exclude<CardTokenState, "URL_TO_RENDER">;
      stateDetails: null;
    }
  | {
      state: Extract<CardTokenState, "URL_TO_RENDER">;
      stateDetails: {
        url: string;
        renderStrategy: "REDIRECT";
      };
    };

export type CardBinLookUp = {
  firstSixDigits: string;
  brand: string;
  cardType: string | null;
  issuer: string | null;
  issuerCountry: string | null;
  issuerCountryCode: string | null;
};

export const IFrameSandboxOptions = [
  "allow-downloads",
  "allow-forms",
  "allow-modals",
  "allow-orientation-lock",
  "allow-pointer-lock",
  "allow-popups",
  "allow-popups-to-escape-sandbox",
  "allow-presentation",
  "allow-same-origin",
  "allow-scripts",
  "allow-storage-access-by-user-activation",
  "allow-top-navigation",
  "allow-top-navigation-by-user-activation",
] as const;

export type IFrameSandboxOptionsType = typeof IFrameSandboxOptions[number];
