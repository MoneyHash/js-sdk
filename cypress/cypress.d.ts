import type { IntentType } from "../src/types";
import MoneyHash from "../src/headlessMoneyHash";

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to create payment intent via API and yield intent id.
       * @example cy.createIntent('payment')
       */
      createIntent(
        intentType: IntentType,
        overRidePayload?: Record<string, unknown>,
      ): Chainable<string>;
      getMoneyHashInstance<TType extends IntentType>(options: {
        type: TType;
      }): Chainable<MoneyHash<TType>>;
      addAmountWallet(amount: number): Chainable<void>;
      createCardToken(): Chainable<void>;
    }
  }
  interface Window {
    MoneyHash: typeof MoneyHash;
  }
}
