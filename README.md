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
moneyHash.start({
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

- Get intent details

```js
moneyHash
  .getIntentDetails("<intent_id>")
  .then(({ intent, transaction, selectedMethod, redirect }) => {
    console.log({ intent, transaction, selectedMethod, redirect });
  });
```

- Get intent methods

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

- Proceed with a Method, Card or Wallet

```js
moneyHash
  .proceedWith({
    intentId: "<intent_id>",
    type: "method" | "savedCard" | "customerBalance",
    id: "<method_id>" | "<card_id>" | "<customer_balance_id>",
  })
  .then(({ intent, transaction, selectedMethod, redirect, methods }) => {
    console.log({ intent, transaction, selectedMethod, redirect, methods });
  });
```

- Reset intent selected method

```js
moneyHash
  .resetSelectedMethod("<intent_id>")
  .then(({ intent, transaction, selectedMethod, methods }) => {
    console.log({
      intent,
      transaction,
      selectedMethod,
      methods,
    });
  });
```

- Delete card

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

```js
moneyHash.renderForm({
  selector: "<container_css_selector>",
  intentId: "<intent_id>",
});
```

## Event listeners

### Complete

```js
const moneyHash = new MoneyHash({
  onComplete: ({ intent, transaction, selectedMethod, redirect }) => {
    console.log("onComplete", {
      intent,
      transaction,
      selectedMethod,
      redirect,
    });
  },
});
```

### Fail

```js
const moneyHash = new MoneyHash({
  onFail: ({ intent, transaction, selectedMethod, redirect }) => {
    console.log("onFail", { intent, transaction, selectedMethod, redirect });
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
moneyHash.setLocale("<locale_code>");
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
    value: string;
    currency: string;
    formatted: number;
  };
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
