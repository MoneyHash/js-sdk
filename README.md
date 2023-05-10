# MoneyHash JavaScript SDK

## Install

```sh
$ npm install @moneyhash/js-sdk

# or

$ yarn add @moneyhash/js-sdk
```

## How to use?

### Embed Experience

1. Create moneyHash instance using `MoneyHash` constructor

```js
import MoneyHash from "@moneyhash/js-sdk";

const moneyHash = new MoneyHash({ type: "payment" | "payout" });
```

2. Render the iframe

```js
await moneyHash.start({
  selector: "<container_css_selector>",
  intentId: "<intent_id>",
});
```

### Headless Experience

- Create moneyHash instance using `MoneyHash` constructor

```js
import MoneyHash from "@moneyhash/js-sdk/headless";

const moneyHash = new MoneyHash({ type: "payment" | "payout" });
```

> MoneyHash headless SDK guides to for the actions required to be done, to have seamless integration through intent details `state`

| state                             | Action                                                                                                                                                                                            |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `METHOD_SELECTION`                | Use `moneyHash.getIntentMethod` to get different intent methods and render them natively with your own styles & use `moneyHash.proceedWith` to proceed with one of them on user selection         |
| `INTENT_FORM`                     | Use `moneyHash.renderForm` to render the SDK embed to let MoneyHash handle the payments for you & listen for completion for failure through `onComplete` `onFail` callbacks on MoneyHash instance |
| `INTENT_PROCESSED`                | Render your successful confirmation UI with the intent details                                                                                                                                    |
| `TRANSACTION_FAILED`              | Render your failure UI with the intent details                                                                                                                                                    |
| `TRANSACTION_WAITING_USER_ACTION` | Render your pending actions confirmation UI with the intent details & `externalActionMessage` if exists on `Transaction`                                                                          |
| `EXPIRED`                         | Render your intent expired UI                                                                                                                                                                     |
| `CLOSED`                          | Render your intent closed UI                                                                                                                                                                      |

- Get intent details

```js
moneyHash
  .getIntentDetails("<intent_id>")
  .then(({ intent, transaction, selectedMethod, redirect, state }) => {
    console.log({ intent, transaction, selectedMethod, redirect, state });
  });
```

- Get intent available payment/payout methods, saved cards and customer balances

```js
moneyHash
  .getIntentMethods("<intent_id>")
  .then(({ paymentMethods, expressMethods, savedCards, customerBalances }) => {
    console.log({
      paymentMethods,
      expressMethods,
      savedCards,
      customerBalances,
    });
  });
```

- Proceed with a payment/payout method, card or wallet

```js
moneyHash
  .proceedWith({
    intentId: "<intent_id>",
    type: "method" | "savedCard" | "customerBalance",
    id: "<method_id>" | "<card_id>" | "<customer_balance_id>",
    metaData: {
      cvv: "<cvv>", // required for customer saved cards that requires cvv
    },
  })
  .then(({ intent, transaction, selectedMethod, redirect, methods, state }) => {
    console.log({
      intent,
      transaction,
      selectedMethod,
      redirect,
      methods,
      state,
    });
  });
```

- Reset the selected method on and intent to null

> Can be used for `back` button after method selection
> or `retry` button on failed transaction UI to try a different
> method by the user.

```js
moneyHash
  .resetSelectedMethod("<intent_id>")
  .then(({ intent, transaction, selectedMethod, methods, state }) => {
    console.log({
      intent,
      transaction,
      selectedMethod,
      methods,
      state,
    });
  });
```

- Delete a customer saved card

```js
moneyHash
  .deleteCard({
    cardId: "<card_id>",
    intentSecret: "<intent_secret>",
  })
  .then(({ message }) => {
    console.log({ message });
  });
```

- Render SDK embed forms and payment integrations

> Must be called if `state` of an intent is `INTENT_FORM` to let MoneyHash handle the payment. you can listen for completion or failure of an intent by providing `onComplete` `onFail` callbacks on MoneyHash instance.

```js
await moneyHash.renderForm({
  selector: "<container_css_selector>",
  intentId: "<intent_id>",
});
```

## Event listeners

### Complete

```js
const moneyHash = new MoneyHash({
  onComplete: ({ intent, transaction, selectedMethod, redirect, state }) => {
    console.log("onComplete", {
      intent,
      transaction,
      selectedMethod,
      redirect,
      state,
    });
  },
});
```

### Fail

```js
const moneyHash = new MoneyHash({
  onFail: ({ intent, transaction, selectedMethod, redirect, state }) => {
    console.log("onFail", {
      intent,
      transaction,
      selectedMethod,
      redirect,
      state,
    });
  },
});
```

## Use predefined locale

```js
const moneyHash = new MoneyHash({
  type: "payment" | "payout",
  locale: "ar-EG",
});
```

## Change intent language programmatically

`we currently support 3 languages ['English', 'Arabic', 'Français']`

```js
await moneyHash.setLocale("<locale_code>");
```

## Customize Input & Submit button styles

```js
const moneyHash = new MoneyHash({
  styles: {
    submitButton: {
      base: {},
      hover: {},
      focus: {},
    },
    input: {
      base: {},
      focus: {},
      error: {},
    },
  },
});
```

> Check Style Types for allowed values

## Types

### Methods Error Response

```ts
export type ErrorResponse = {
  code: number;
  message: string;
};
```

```ts
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
  | "CLOSED";

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

export interface Method {
  id: PaymentMethodSlugs;
  title: string;
  icons: string[];
  isSelected: boolean;
  confirmationRequired: boolean;
}
export interface Card {
  id: string;
  brand: string;
  logo: string;
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
```

### Styles

#### Input

```ts
interface AllowedInputStyle {
  height?: number;
  padding?: number;

  background?: string;
  borderRadius?: number | string;
  boxShadow?: string;

  borderStyle?: string;
  borderColor?: string;
  borderWidth?: number | string;

  color?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  fontSmoothing?: string;
  lineHeight?: string;
}
```

#### Submit Button

```ts
interface TextStyle {
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  fontSmoothing?: string;
  lineHeight?: string;
  textTransform?: string;
  letterSpacing?: string;
}

interface BlockStyle {
  background?: string;
  borderRadius?: number | string;
  boxShadow?: string;
  borderStyle?: string;
  borderColor?: number | string;
  borderWidth?: number | string;
}

export interface ButtonStyle {
  base?: TextStyle & BlockStyle;
  hover?: TextStyle & BlockStyle;
  focus?: TextStyle & BlockStyle;
}
```
