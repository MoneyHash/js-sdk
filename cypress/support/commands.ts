/// <reference types="cypress" />
import type { IntentType } from "../../src/types";
import MoneyHash from "../../src/headlessMoneyHash";

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

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
    }
  }
}

Cypress.Commands.add("createIntent", (intentType, overRidePayload) => {
  cy.fixture(intentType === "payment" ? "paymentPayload" : "payout").then(
    payload => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("BACKEND_URL")}/${
          intentType === "payment" ? "payments" : "payout"
        }/intent/`,
        headers: {
          "x-api-key": Cypress.env("SANDBOX_API_KEY"),
        },
        body: { ...payload, ...overRidePayload },
      }).then(resp => resp.body.data.id);
    },
  );
});

Cypress.Commands.add("getMoneyHashInstance", ({ type }) => {
  cy.window().then(window => {
    const moneyHash = new window.MoneyHash({ type });
    return moneyHash;
  });
});

Cypress.Commands.add("addAmountWallet", amount => {
  cy.fixture("paymentPayload").then(paymentPayload => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("BACKEND_URL")}/customers/${
        paymentPayload.customer
      }/wallets/top-up/`,
      headers: {
        "x-api-key": Cypress.env("SANDBOX_API_KEY"),
      },
      body: { currency: paymentPayload.amount_currency, amount },
    }).then(resp => resp.body.data.id);
  });
});
