# MoneyHash JavaScript SDK

The MoneyHash JavaScript SDK allows developers to integrate MoneyHash payment processing into their web applications. The SDK provides a simple and convenient way to accept customer payments, manage subscriptions, and send payouts.

## Install

```sh
$ npm install @moneyhash/js-sdk

# or

$ yarn add @moneyhash/js-sdk
```

## Integration

Follow [MoneyHash JS SDK Docs](https://docs.moneyhash.io/docs/javascript-sdk)

### Region

By default the SDK connects to MoneyHash's global region. Pass `region` to connect to a different region:

```ts
import MoneyHash from "@moneyhash/js-sdk/headless";

const moneyHash = new MoneyHash({
  type: "payment",
  publicApiKey: "<YOUR_PUBLIC_API_KEY>",
  region: "sa", // optional — omit for the default region
});
```
