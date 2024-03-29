/// <reference types="cypress" />

describe("headlessMoneyHash", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  describe("Payment Intent", () => {
    describe("when calling moneyHash.getIntentDetails", () => {
      it("response with intent, transaction, redirect, selectedMethod details as expected", () => {
        cy.createIntent("payment").then(intentId => {
          cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
            cy.wrap(moneyHash.getIntentDetails(intentId)).as(
              "getIntentDetails",
            );
            cy.get("@getIntentDetails").then(response => {
              const { intent, transaction, redirect, selectedMethod, state } =
                response as unknown as Awaited<
                  ReturnType<typeof moneyHash.getIntentDetails>
                >;

              expect(transaction).eq(null, "transaction");
              expect(redirect).eq(null, "redirect");
              expect(selectedMethod).eq(null, "selectedMethod");
              expect(state).to.be.a("string", "state");
              expect(intent)
                .to.be.an("object")
                .to.have.all.keys(
                  "id",
                  "status",
                  "amount",
                  "expirationDate",
                  "secret",
                  "isLive",
                );
              expect(intent)
                .to.have.nested.property("amount.value")
                .to.be.a("string");
              expect(intent)
                .to.have.nested.property("amount.currency")
                .to.be.a("string");
              expect(intent)
                .to.have.nested.property("amount.formatted")
                .to.be.a("number");
            });
          });
        });
      });

      describe("with intent that has completed", () => {
        it("response with transaction and redirect as expected", () => {
          // Add amount to wallet to before paying with
          cy.addAmountWallet(50);

          cy.createIntent("payment").then(intentId => {
            cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
              cy.wrap(
                moneyHash.proceedWith({
                  intentId,
                  type: "customerBalance",
                  id: "SELFSERVE_WALLET",
                }),
              ).as("proceedWith");

              cy.get("@proceedWith").then(response => {
                const { transaction, redirect } =
                  response as unknown as Awaited<
                    ReturnType<typeof moneyHash.getIntentDetails>
                  >;

                expect(redirect).to.be.an("object").to.have.key("redirectUrl");

                expect(transaction)
                  .to.be.an("object")
                  .to.have.all.keys(
                    "id",
                    "status",
                    "operations",
                    "amount",
                    "billingData",
                    "createdDate",
                    "customFields",
                    "customFormAnswers",
                    "externalActionMessage",
                    "paymentMethod",
                    "paymentMethodName",
                    "providerTransactionFields",
                  );
                expect(transaction)
                  .to.have.nested.property("amount.value")
                  .to.be.a("number");
                expect(transaction)
                  .to.have.nested.property("amount.currency")
                  .to.be.a("string");

                expect(transaction)
                  .to.have.nested.property("operations")
                  .to.be.a("array");
              });
            });
          });
        });
      });
    });

    describe("when calling moneyHash.getIntentMethods", () => {
      it("response with methods, saved cards and wallet details as expected", () => {
        cy.createIntent("payment").then(intentId => {
          cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
            cy.wrap(moneyHash.getIntentMethods(intentId)).as(
              "getIntentMethods",
            );

            cy.get("@getIntentMethods").then(response => {
              const {
                paymentMethods,
                expressMethods,
                savedCards,
                customerBalances,
              } = response as unknown as Awaited<
                ReturnType<typeof moneyHash.getIntentMethods>
              >;

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
                expect(card.requiresCvv).to.be.a("boolean");
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
      });
    });

    describe("when calling moneyHash.proceedWith", () => {
      describe("with payment method", () => {
        it("updates intent details selectedMethod", () => {
          cy.createIntent("payment").then(intentId => {
            cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
              cy.wrap(moneyHash.getIntentMethods(intentId)).as(
                "getIntentMethods",
              );

              cy.get("@getIntentMethods").then(response => {
                const { paymentMethods } = response as unknown as Awaited<
                  ReturnType<typeof moneyHash.getIntentMethods>
                >;

                const randomMethod =
                  paymentMethods[
                    Cypress._.random(0, paymentMethods.length - 1)
                  ];

                cy.wrap(
                  moneyHash.proceedWith({
                    intentId,
                    type: "method",
                    id: randomMethod.id,
                  }),
                ).as("proceedWith");

                cy.get("@proceedWith")
                  .its("selectedMethod")
                  .should("eq", randomMethod.id);

                cy.get("@proceedWith")
                  .its("methods.paymentMethods")
                  .should("deep.include", {
                    ...randomMethod,
                    isSelected: true,
                  });

                cy.get("@proceedWith")
                  .its("state")
                  .should("be.oneOf", ["INTENT_FORM", "INTENT_PROCESSED"]);
              });
            });
          });
        });
      });

      describe("with Saved card", () => {
        describe("when cvv is not required", () => {
          it("updates intent details selectedMethod with CARD", () => {
            cy.createCardToken();

            cy.visit("/");

            cy.createIntent("payment").then(intentId => {
              cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
                cy.wrap(moneyHash.getIntentMethods(intentId)).as(
                  "getIntentMethods",
                );

                cy.get("@getIntentMethods").then(response => {
                  const { savedCards } = response as unknown as Awaited<
                    ReturnType<typeof moneyHash.getIntentMethods>
                  >;
                  const randomCard = savedCards.find(card => !card.requiresCvv);

                  cy.wrap(
                    moneyHash.proceedWith({
                      intentId,
                      type: "savedCard",
                      id: randomCard.id,
                    }),
                  ).as("proceedWith");

                  cy.get("@proceedWith")
                    .its("selectedMethod")
                    .should("eq", "CARD");

                  cy.get("@proceedWith")
                    .its("state")
                    .should("be.oneOf", ["INTENT_PROCESSED", "INTENT_FORM"]);
                });
              });
            });
          });
        });

        describe("when cvv is required", () => {
          it("updates intent details selectedMethod with CARD", () => {
            cy.createCardToken();

            cy.visit("/");

            cy.createIntent("payment").then(intentId => {
              cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
                cy.wrap(moneyHash.getIntentMethods(intentId)).as(
                  "getIntentMethods",
                );

                cy.get("@getIntentMethods").then(response => {
                  const { savedCards } = response as unknown as Awaited<
                    ReturnType<typeof moneyHash.getIntentMethods>
                  >;
                  const randomCard = savedCards.find(card => card.requiresCvv);

                  cy.wrap(
                    moneyHash.proceedWith({
                      intentId,
                      type: "savedCard",
                      id: randomCard.id,
                      metaData: {
                        cvv: "1234",
                      },
                    }),
                  ).as("proceedWith");

                  cy.get("@proceedWith")
                    .its("selectedMethod")
                    .should("eq", "CARD");

                  cy.get("@proceedWith")
                    .its("state")
                    .should("eq", "INTENT_PROCESSED");
                });
              });
            });
          });

          it("throws an error with cvv required message", () => {
            cy.createCardToken();

            cy.visit("/");

            cy.createIntent("payment").then(intentId => {
              cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
                cy.wrap(moneyHash.getIntentMethods(intentId)).as(
                  "getIntentMethods",
                );

                cy.get("@getIntentMethods").then(response => {
                  const { savedCards } = response as unknown as Awaited<
                    ReturnType<typeof moneyHash.getIntentMethods>
                  >;
                  const randomCard = savedCards.find(card => card.requiresCvv);

                  return moneyHash
                    .proceedWith({
                      intentId,
                      type: "savedCard",
                      id: randomCard.id,
                    })
                    .catch(error => {
                      expect(error.message).to.equal(
                        "cvv is required for this card token",
                      );
                    });
                });
              });
            });
          });
        });
      });

      describe("with Self serve wallet", () => {
        it("updates intent details selectedMethod with SELFSERVE_WALLET", () => {
          // Add amount to wallet to before paying with
          cy.addAmountWallet(50);

          cy.createIntent("payment").then(intentId => {
            cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
              cy.wrap(moneyHash.getIntentMethods(intentId)).as(
                "getIntentMethods",
              );

              cy.get("@getIntentMethods").then(response => {
                const { customerBalances } = response as unknown as Awaited<
                  ReturnType<typeof moneyHash.getIntentMethods>
                >;
                const selfServeWallet = customerBalances[0];

                cy.wrap(
                  moneyHash.proceedWith({
                    intentId,
                    type: "customerBalance",
                    id: selfServeWallet.id,
                  }),
                ).as("proceedWith");

                cy.get("@proceedWith")
                  .its("selectedMethod")
                  .should("eq", selfServeWallet.id);

                cy.get("@proceedWith")
                  .its("methods.customerBalances")
                  .then(customerBalancesResponse =>
                    Cypress._.find(
                      customerBalancesResponse,
                      c => c.id === selfServeWallet.id,
                    ),
                  )
                  .its("isSelected")
                  .should("eq", true);

                cy.get("@proceedWith")
                  .its("state")
                  .should("eq", "INTENT_PROCESSED");
              });
            });
          });
        });
      });
    });

    describe("when calling moneyHash.resetSelectedMethod", () => {
      it("resets the pre selected method", () => {
        cy.createIntent("payment").then(intentId => {
          cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
            cy.wrap(moneyHash.getIntentDetails(intentId)).as(
              "getIntentDetails",
            );

            cy.get("@getIntentDetails")
              .its("selectedMethod")
              .should("eq", null)
              .then(() => {
                const method = "MOBILE_WALLET";

                cy.wrap(
                  moneyHash.proceedWith({
                    intentId,
                    type: "method",
                    id: method,
                  }),
                )
                  .its("selectedMethod")
                  .should("eq", method)
                  .as("proceedWith");

                cy.get("@proceedWith").then(() => {
                  cy.wrap(moneyHash.resetSelectedMethod(intentId)).as(
                    "resetSelectedMethod",
                  );

                  cy.get("@resetSelectedMethod")
                    .its("selectedMethod")
                    .should("eq", null);

                  cy.get("@resetSelectedMethod")
                    .its("state")
                    .should("eq", "METHOD_SELECTION");
                });
              });
          });
        });
      });
    });

    describe("when calling moneyHash.deleteCard", () => {
      it("deletes user tokenized card", () => {
        cy.createCardToken();

        cy.visit("/");

        cy.createIntent("payment").then(intentId => {
          cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
            cy.wrap(
              Promise.all([
                moneyHash.getIntentDetails(intentId),
                moneyHash.getIntentMethods(intentId),
              ]),
            ).as("intent&methodsDetails");

            cy.get("@intent&methodsDetails").then(response => {
              const [{ intent }, { savedCards }] = response as unknown as [
                Awaited<ReturnType<typeof moneyHash.getIntentDetails>>,
                Awaited<ReturnType<typeof moneyHash.getIntentMethods>>,
              ];
              const cardToDelete = savedCards[0];

              cy.wrap(
                moneyHash.deleteCard({
                  cardId: cardToDelete.id,
                  intentSecret: intent.secret,
                }),
              )
                .its("message")
                .should("eq", "success");
            });
          });
        });
      });
    });

    describe("when calling moneyHash.renderForm", () => {
      describe("with existing container selector in DOM", () => {
        it("renders correctly", () => {
          cy.createIntent("payment").then(intentId => {
            cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
              moneyHash.renderForm({ selector: "#app", intentId });
            });

            cy.get("#app > iframe").should("be.visible");
          });
        });
      });

      describe("without container selector found in DOM", () => {
        it("throws an error", () => {
          cy.createIntent("payment").then(intentId => {
            cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
              expect(() =>
                moneyHash.renderForm({
                  selector: "#not-a-container",
                  intentId,
                }),
              ).to.throw(
                "Couldn't find an element with selector #not-a-container!",
              );
            });
          });
        });
      });
    });
  });

  describe("Payout Intent", () => {
    describe("when calling moneyHash.getIntentDetails", () => {
      it("response with intent, transaction & selectedMethod as expected", () => {
        cy.createIntent("payout").then(intentId => {
          cy.getMoneyHashInstance({ type: "payout" }).then(moneyHash => {
            cy.wrap(moneyHash.getIntentDetails(intentId)).as(
              "getIntentDetails",
            );
            cy.get("@getIntentDetails").then(response => {
              const { intent, transaction, selectedMethod } =
                response as unknown as Awaited<
                  ReturnType<typeof moneyHash.getIntentDetails>
                >;

              expect(transaction).eq(null, "transaction");
              expect(selectedMethod).eq(null, "selectedMethod");
              expect(intent)
                .to.be.an("object")
                .to.have.all.keys("id", "status", "amount", "secret", "isLive");
              expect(intent)
                .to.have.nested.property("amount.value")
                .to.be.a("string");
              expect(intent)
                .to.have.nested.property("amount.currency")
                .to.be.a("string");
              expect(intent)
                .to.have.nested.property("amount.formatted")
                .to.be.a("number");
              expect(intent)
                .to.have.nested.property("amount.maxPayout")
                .to.satisfies(
                  value => value === null || typeof value === "number",
                  "expected amount.maxPayout to be number or null",
                );
            });
          });
        });
      });
    });

    describe("when calling moneyHash.getIntentMethods", () => {
      it("response with payout methods as expected", () => {
        cy.createIntent("payout").then(intentId => {
          cy.getMoneyHashInstance({ type: "payout" }).then(moneyHash => {
            cy.wrap(moneyHash.getIntentMethods(intentId)).as(
              "getIntentMethods",
            );

            cy.get("@getIntentMethods").then(response => {
              const { payoutMethods } = response as unknown as Awaited<
                ReturnType<typeof moneyHash.getIntentMethods>
              >;

              expect(payoutMethods).to.be.an("array");

              payoutMethods.forEach(method => {
                expect(method.id).to.be.a("string");
                expect(method.title).to.be.a("string");
                expect(method.confirmationRequired).to.be.a("boolean");
                expect(method.isSelected).to.be.a("boolean");
                expect(method.icons).to.be.an("array");
              });
            });
          });
        });
      });
    });

    describe("when calling moneyHash.deleteCard", () => {
      it("throws an error", () => {
        cy.getMoneyHashInstance({ type: "payout" }).then(moneyHash => {
          expect(() =>
            moneyHash.deleteCard({ cardId: "blabla", intentSecret: "blabla" }),
          ).to.throw("deleteCard is allowed only for payment intent!");
        });
      });
    });
  });
});
