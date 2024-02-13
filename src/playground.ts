/* eslint-disable no-console */
import MoneyHash from "./headlessMoneyHash";

declare global {
  interface Window {
    MoneyHash: typeof MoneyHash;
  }
}

window.MoneyHash = window.MoneyHash || MoneyHash;

const paymentIntentId = "jgxYqZr";

let moneyHash: MoneyHash<"payment">;

document.getElementById("start")?.addEventListener("click", async () => {
  moneyHash?.removeEventListeners();
  moneyHash = new MoneyHash({
    type: "payment",
    onComplete: ({ intent, transaction, selectedMethod, redirect, state }) => {
      console.log("onComplete", {
        state,
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

  // await moneyHash.start({ selector: "#app", intentId: paymentIntentId });
  const intentDetails = await moneyHash.getIntentDetails(paymentIntentId);
  console.log(intentDetails);
  // moneyHash.renderForm({ selector: "#app", intentId: paymentIntentId });

  if (!intentDetails.nativePayData) {
    console.log("no native pay");
    return;
  }
  const { amount, countryCode, currencyCode, supportedNetworks } =
    intentDetails.nativePayData;

  // const countryCode = "AE";
  // const currencyCode = "SAR";
  // const amount = "50";
  // const secret =
  //   "Z0FBQUFBQmx5TnhGamF5WjFMdVBzUFB6SXNzSnItWVp3bko4VkRSVWRDQldfNnFHVThXcXdpNDBzVU1yM09IWDZpMF95UHo2dW9JOGxGOVdUM0pzV2JZelJTUVpkaG9XYjY5RzlQdEU0eXJINmtKN3Y0WVdadTJ0a1I4Sm1XV3JMa2htR3drZUp6ZXJOcGpXbUFBQjFvUkhJUEZ6MnJXQ1lBPT0=";
  // const supportedNetworks = ["visa", "masterCard", "amex", "discover", "mada"];

  moneyHash.payWithApplePay({
    countryCode,
    amount,
    supportedNetworks,
    currencyCode,
    secret: intentDetails.intent.secret,
    onCancel: () => console.log("CANCEL"),
    onComplete: async () => {
      console.log("COMPLETE");
      console.log(await moneyHash.getIntentDetails(paymentIntentId));
    },
    onError: async () => {
      console.log("ERROR");
    },
  });

  // const intentMethods = await moneyHash.getIntentMethods(paymentIntentId);
  // console.log(intentMethods);

  // const response = await moneyHash.proceedWith({
  //   intentId: paymentIntentId,
  //   type: "method", // method | savedCard | customerBalance
  //   id: "MOBILE_WALLET",
  // });

  // console.log(response);
});
