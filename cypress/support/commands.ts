/// <reference types="cypress" />

import type { IntentType } from "../../src/types";
import MoneyHash from "../../src/headlessMoneyHash";

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

Cypress.Commands.add("createCardToken", () => {
  cy.origin(Cypress.env("EMBED_URL"), () => {
    cy.fixture("paymentPayload").then(paymentPayload => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("BACKEND_URL")}/tokens/cards/`,
        headers: {
          "x-api-key": Cypress.env("SANDBOX_API_KEY"),
        },
        body: {
          webhook_url: paymentPayload.webhook_url,
          customer: paymentPayload.customer,
        },
      }).then(res => {
        cy.visit(res.body.data.embed_url);

        // wait for embed vault to load
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3000);
        cy.get("button")
          .contains(/add card/i)
          .click();

        cy.get("h3").contains(/Your card was added successfully./i);
      });
    });
  });
});
