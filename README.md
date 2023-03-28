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
moneyHash.getIntentDetails("<intent_id>").then(({ intent, transaction }) => {
  console.log({ intent, transaction });
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
  .then(({ intent, transaction }) => {
    console.log({ intent, transaction });
  });
```

- Deselect intent method

```js
moneyHash.deselectMethod("<intent_id>").then(({ intent, transaction }) => {
  console.log({
    intent,
    transaction,
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
  onComplete: ({ intent, transaction }) => {
    console.log("onComplete", { intent, transaction });
  },
});
```

### Fail

```js
const moneyHash = new MoneyHash({
  onFail: ({ intent, transaction }) => {
    console.log("onFail", { intent, transaction });
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

###

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

TODO: Ask backend for valid values 😪
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
  secret: string;
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
