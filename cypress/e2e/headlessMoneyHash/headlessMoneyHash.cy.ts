/// <reference types="cypress" />

describe("headlessMoneyHash", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  context("Payment Intent", () => {
    it("moneyHash.getIntentDetails should response with appropriate intent & transaction details", () => {
      cy.createIntent("payment").then(intentId => {
        cy.getMoneyHashInstance({ type: "payment" }).then(moneyHash => {
          cy.wrap(moneyHash.getIntentDetails(intentId)).as("getIntentDetails");
          cy.get("@getIntentDetails").then(response => {
            const { intent, transaction } = response as unknown as Awaited<
              ReturnType<typeof moneyHash.getIntentDetails>
            >;

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

    it("moneyHash.getIntentMethods should response with appropriate methods, saved cards and wallet details", () => {
      cy.createIntent("payment").then(intentId => {
        cy.getMoneyHashInstance({ type: "payment" }).then(async moneyHash => {
          cy.wrap(moneyHash.getIntentMethods(intentId)).as("getIntentMethods");

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

    context(
      "moneyHash.proceedWith should update intent selected method",
      () => {
        it("Payment method", () => {
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
                )
                  .its("intent.method")
                  .should("eq", randomMethod.id);
              });
            });
          });
        });

        it("Saved cards", () => {
          // tokenize card before paying with
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
                const randomCard =
                  savedCards[Cypress._.random(0, savedCards.length - 1)];

                cy.wrap(
                  moneyHash.proceedWith({
                    intentId,
                    type: "savedCard",
                    id: randomCard.id,
                  }),
                )
                  .its("intent.method")
                  .should("eq", "CARD");
              });
            });
          });
        });

        it("Self serve wallet", () => {
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
                )
                  .its("intent.method")
                  .should("eq", selfServeWallet.id);
              });
            });
          });
        });
      },
    );

    it("moneyHash.resetSelectedMethod should reset the pre selected method", () => {
      cy.createIntent("payment").then(intentId => {
        cy.getMoneyHashInstance({ type: "payment" }).then(async moneyHash => {
          const { intent } = await moneyHash.getIntentDetails(intentId);
          expect(intent.method).to.eq(null);

          const method = "MOBILE_WALLET";
          const proceedWithResponse = await moneyHash.proceedWith({
            intentId,
            type: "method",
            id: method,
          });

          expect(proceedWithResponse.intent.method).to.eq(method);

          const response = await moneyHash.resetSelectedMethod(intentId);

          expect(response.intent.method).to.eq(null);
        });
      });
    });

    it("moneyHash.deleteCard should delete user tokenized card", () => {
      cy.createCardToken();

      cy.visit("/");

      cy.createIntent("payment").then(intentId => {
        cy.getMoneyHashInstance({ type: "payment" }).then(async moneyHash => {
          const [{ intent }, { savedCards }] = await Promise.all([
            moneyHash.getIntentDetails(intentId),
            moneyHash.getIntentMethods(intentId),
          ]);

          const cardToDelete = savedCards[0];

          const response = await moneyHash.deleteCard({
            cardId: cardToDelete.id,
            intentSecret: intent.secret,
          });

          // console.log({ response });
          expect(response.message).to.eq("success");
        });
      });
    });

    context(
      "moneyHash.renderForm should render the embed experience inside a container",
      () => {
        it("renders correctly if container element found", () => {
          cy.createIntent("payment").then(intentId => {
            cy.getMoneyHashInstance({ type: "payment" }).then(
              async moneyHash => {
                moneyHash.renderForm({ selector: "#app", intentId });
              },
            );

            cy.get("#app > iframe").should("be.visible");
          });
        });

        it("not found container should throw an error", () => {
          cy.createIntent("payment").then(intentId => {
            cy.getMoneyHashInstance({ type: "payment" }).then(
              async moneyHash => {
                expect(() =>
                  moneyHash.renderForm({
                    selector: "#not-a-container",
                    intentId,
                  }),
                ).to.throw(
                  "Couldn't find an element with selector #not-a-container!",
                );
              },
            );
          });
        });
      },
    );
  });

  context("Payout Intent", () => {
    it("moneyHash.getIntentDetails should response with appropriate intent & transaction details", () => {
      cy.createIntent("payout").then(intentId => {
        cy.getMoneyHashInstance({ type: "payout" }).then(async moneyHash => {
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

    it("moneyHash.getIntentMethods should response with appropriate payout methods", () => {
      cy.createIntent("payout").then(intentId => {
        cy.getMoneyHashInstance({ type: "payout" }).then(async moneyHash => {
          const { payoutMethods } = await moneyHash.getIntentMethods(intentId);

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

    it("moneyHash.deleteCard should throw an error", () => {
      cy.getMoneyHashInstance({ type: "payout" }).then(async moneyHash => {
        expect(() =>
          moneyHash.deleteCard({ cardId: "blabla", intentSecret: "blabla" }),
        ).to.throw("deleteCard is allowed only for payment intent!");
      });
    });

    it("moneyHash.deleteCard should throw an error", () => {
      cy.getMoneyHashInstance({ type: "payout" }).then(async moneyHash => {
        expect(() =>
          moneyHash.deleteCard({ cardId: "blabla", intentSecret: "blabla" }),
        ).to.throw("deleteCard is allowed only for payment intent!");
      });
    });
  });
});
