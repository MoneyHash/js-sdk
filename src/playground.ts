/* eslint-disable no-console */
import MoneyHash from "./headlessMoneyHash";

const paymentIntentId = "ZdY7Ky9";

let moneyHash: MoneyHash<"payment">;

document.getElementById("start")?.addEventListener("click", async () => {
  moneyHash?.removeEventListeners();
  moneyHash = new MoneyHash({
    type: "payment",
    onComplete: ({ intent, transaction }) => {
      console.log("onComplete", { intent, transaction });
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

  const intentDetails = await moneyHash.getIntentDetails(paymentIntentId);
  console.log(intentDetails);

  // const intentMethods = await moneyHash.getIntentMethods(paymentIntentId);
  // console.log(intentMethods);

  // const response = await moneyHash.proceedWith({
  //   intentId: paymentIntentId,
  //   type: "method", // method | savedCard | customerBalance
  //   id: "MOBILE_WALLET",
  // });

  // console.log(response);
});

document.getElementById("en")?.addEventListener("click", () => {
  moneyHash?.setLocale("en");
});
document.getElementById("fr")?.addEventListener("click", () => {
  moneyHash?.setLocale("fr");
});
document.getElementById("ar")?.addEventListener("click", () => {
  moneyHash?.setLocale("ar");
});
