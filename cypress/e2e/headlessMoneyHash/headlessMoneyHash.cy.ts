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
});
