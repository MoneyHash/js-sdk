/* eslint-disable no-console */
import MoneyHash from "./headlessMoneyHash";

declare global {
  interface Window {
    MoneyHash: typeof MoneyHash;
  }
}

window.MoneyHash = window.MoneyHash || MoneyHash;

const paymentIntentId = "ZARw7w9";

let moneyHash: MoneyHash<"payment">;

document.getElementById("start")?.addEventListener("click", async () => {
  moneyHash?.removeEventListeners();
  moneyHash = new MoneyHash({
    type: "payment",
    onComplete: ({ intent, transaction, selectedMethod, redirect }) => {
      console.log("onComplete", {
        intent,
        transaction,
        selectedMethod,
        redirect,
      });
    },
    onFail: ({ intent, transaction }) => {
      console.log("onFail", { intent, transaction });
    },
    styles: {
      submitButton: {
        base: {
          background: "#09c",
          color: "white",
          borderRadius: "999px",
        },
        hover: {
          background: "green",
          color: "black",
        },
        focus: {
          background: "yellow",
          color: "black",
        },
      },
      input: {
        base: {
          borderRadius: "0px",
          borderColor: "#09c",
        },
        focus: {
          boxShadow: "none",
        },
        error: {
          borderColor: "red",
          borderWidth: 1,
          boxShadow: "none",
        },
      },
    },
  });

  // await moneyHash.renderForm({ selector: "#app", intentId: paymentIntentId });
  const intentDetails = await moneyHash.getIntentDetails(paymentIntentId);
  console.log(intentDetails);

  // const intentMethods = await moneyHash.getIntentMethods(paymentIntentId);
  // console.log(intentMethods);

  // const response = await moneyHash.proceedWith({
  //   intentId: paymentIntentId,
  //   type: "method", // method | savedCard | customerBalance
  //   id: "MOBILE_WALLET",
  // });
});
