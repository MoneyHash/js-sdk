/// <reference types="cypress" />

describe("headlessMoneyHash", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("moneyHash.getIntentDetails should response with appropriate intent & transaction details", () => {
    cy.createIntent("payment").then(intentId => {
      cy.getMoneyHashInstance({ type: "payment" }).then(async moneyHash => {
        const { intent, transaction } = await moneyHash.getIntentDetails(
          intentId,
        );

        expect(transaction).eq(null, "transaction");
        expect(intent)
          .to.be.an("object")
          .to.have.all.keys(
            "id",
            "status",
            "amount",
            "method",
            "expirationDate",
            "secret",
            "maxPayoutAmount",
          );
        expect(intent)
          .to.have.nested.property("amount.value")
          .to.be.a("number");
        expect(intent)
          .to.have.nested.property("amount.currency")
          .to.be.a("string");
      });
    });
  });

  it("moneyHash.getIntentMethods should response with appropriate methods, saved cards and wallet details", () => {
    cy.createIntent("payment").then(intentId => {
      cy.getMoneyHashInstance({ type: "payment" }).then(async moneyHash => {
        const { paymentMethods, expressMethods, savedCards, customerBalances } =
          await moneyHash.getIntentMethods(intentId);

        expect(paymentMethods).to.be.an("array");
        expect(expressMethods).to.be.an("array");

        [...paymentMethods, ...expressMethods].forEach(method => {
          expect(method.id).to.be.a("string");
          expect(method.title).to.be.a("string");
          expect(method.confirmationRequired).to.be.a("boolean");
          expect(method.isSelected).to.be.a("boolean");
          expect(method.icons).to.be.an("array");
        });

        expect(savedCards).to.be.an("array");

        savedCards.forEach(card => {
          expect(card.id).to.be.a("string");
          expect(card.brand).to.be.a("string");
          expect(card.expiryMonth).to.be.a("string");
          expect(card.expiryYear).to.be.a("string");
          expect(card.last4).to.be.a("string");
          expect(card.logo).to.be.a("string");
          expect(card.country).satisfies(
            country => country === null || typeof country === "string",
          );
        });

        expect(customerBalances).to.be.an("array").that.has.length(1);
        customerBalances.forEach(balance => {
          expect(balance.id).to.be.a("string");
          expect(balance.icon).to.be.a("string");
          expect(balance.balance).to.be.a("number");
          expect(balance.isSelected).to.be.a("boolean");
        });
      });
    });
  });

  context("moneyHash.proceedWith should update intent selected method", () => {
    it("Payment method", () => {
      cy.createIntent("payment").then(intentId => {
        cy.getMoneyHashInstance({ type: "payment" }).then(async moneyHash => {
          const { paymentMethods } = await moneyHash.getIntentMethods(intentId);
          const randomMethod =
            paymentMethods[Cypress._.random(0, paymentMethods.length)];

          const response = await moneyHash.proceedWith({
            intentId,
            type: "method",
            id: randomMethod.id,
          });

          expect(response.intent.method).eq(randomMethod.id);
        });
      });
    });

    it.only("Saved cards", () => {
      // tokenize card before paying with
      cy.createCardToken();

      cy.visit("/");
      cy.createIntent("payment").then(intentId => {
        cy.getMoneyHashInstance({ type: "payment" }).then(async moneyHash => {
          const { savedCards } = await moneyHash.getIntentMethods(intentId);
          const randomCard = savedCards[Cypress._.random(0, savedCards.length)];

          const response = await moneyHash.proceedWith({
            intentId,
            type: "savedCard",
            id: randomCard.id,
          });

          expect(response.intent.method).eq("CARD");
        });
      });
    });

    it("Self serve wallet", () => {
      // Add amount to wallet to before paying with
      cy.addAmountWallet(50);

      cy.createIntent("payment").then(intentId => {
        cy.getMoneyHashInstance({ type: "payment" }).then(async moneyHash => {
          const { customerBalances } = await moneyHash.getIntentMethods(
            intentId,
          );
          const selfServeWallet = customerBalances[0];

          const response = await moneyHash.proceedWith({
            intentId,
            type: "customerBalance",
            id: selfServeWallet.id,
          });
          expect(response.intent.method).eq(selfServeWallet.id);
        });
      });
    });
  });
});
