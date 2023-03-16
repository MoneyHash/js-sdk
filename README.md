# MoneyHash JavaScript SDK

## Install

```sh
$ npm install @moneyhash/js-sdk

# or

$ yarn add @moneyhash/js-sdk
```

## How to use?

1. Create moneyHash instance using `MoneyHash` constructor

```js
import MoneyHash from "@moneyhash/js-sdk";

const moneyHash = new MoneyHash();
```

2. Start your payment / payout to render in Iframe

`payment`

```js
moneyHash.start({
  selector: "<container_css_selector>",
  intentId: "<intent_id>",
  type: "payment",
});
```

`payout`

```js
moneyHash.start({
  selector: "<container_css_selector>",
  intentId: "<intent_id>",
  type: "payout",
});
```

That's it

## Event listeners

### Success

```js
const moneyHash = new MoneyHash({
  onSuccess: ({ type, intent, transaction }) => {
    console.log("onSuccess", { type, intent, transaction });
  },
});
```

### Failure

```js
const moneyHash = new MoneyHash({
  onFailure: ({ type, intent, transaction }) => {
    console.log("onFailure", { type, intent, transaction });
  },
});
```

## Use predefined locale

```js
const moneyHash = new MoneyHash({
  locale: "ar-EG",
});
```

## Change intent language programmatically

`we currently support 3 languages ['English', 'French', 'Arabic']`

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

> Check Style API for allowed values

## API

### MoneyHash Options

| Required | Prop      | Type                                               | Description                                     |
| -------- | --------- | -------------------------------------------------- | ----------------------------------------------- |
|          | locale    | string                                             | Start the intent Iframe with predefined locale  |
|          | onSuccess | (event: OnSuccessEventOptions) => void             | Callback fires after successfull payment/payout |
|          | onFailure | (event: OnFailureEventOptions) => void             | Callback fires after failure payment/payout     |
|          | styles    | { submitButton?: ButtonStyle; input?: InputStyle } | Customize input & submit button styles          |

### MoneyHash instance

| Method               | Type                                                                          | Description                              |
| -------------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| start                | ({ selector: string; intentId: string; type: "payment" \| "payout";}) => void | Start the payment/payout intent Iframe   |
| setLocale            | (locale: string) => void                                                      | Change intent locale programmatically    |
| removeEventListeners | ( ) => void                                                                   | Abort intent event listeners for cleanup |

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
