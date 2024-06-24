/* eslint-disable no-console */
import MoneyHash, { IntentDetails } from "./headlessMoneyHash";

declare global {
  interface Window {
    MoneyHash: typeof MoneyHash;
  }
}

window.MoneyHash = window.MoneyHash || MoneyHash;

const paymentIntentId = "LnqENn9";

const intentDetails: IntentDetails<"payment"> | null = null;

let moneyHash: MoneyHash<"payment">;

document.getElementById("start")?.addEventListener("click", async () => {
  moneyHash?.removeEventListeners();
  moneyHash = new MoneyHash({
    type: "payment",
    onComplete: data => {
      // open modal confirmation for apple pay
      console.log("onComplete", data);
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

  const elements = await moneyHash.elements({
    intentId: paymentIntentId,
    styles: {
      color: "white", // color of the text
      backgroundColor: "grey", // background color of the input
      placeholderColor: "#ccc", // placeholder color
    },
  });

  const cardHolderName = elements.create("cardHolderName", {
    selector: "#card-holder-name",
    // height: "80px",
    placeholder: "Card Holder Name",
    styles: {
      // color: "red",
      // backgroundColor: "black", // background color of the input
      // placeholderColor: "#ccc", // placeholder color
    },
  });

  const cardNumber = elements.create("cardNumber", {
    selector: "#card-number",
    styles: {
      // color: "red",
    },
  });

  const cardCvv = elements.create("cardCvv", {
    selector: "#card-cvv",
    styles: {
      // color: "blue",
    },
  });

  const cardExpiryMonth = elements.create("cardExpiryMonth", {
    selector: "#card-expiry-month",
    styles: {
      // color: "green",
    },
  });

  const cardExpiryYear = elements.create("cardExpiryYear", {
    selector: "#card-expiry-year",
    styles: {},
  });

  cardHolderName.on("focus", () => {
    console.log("focus card holder");
  });

  cardHolderName.mount();
  cardNumber.mount();
  cardCvv.mount();
  cardExpiryMonth.mount();
  cardExpiryYear.mount();

  const message = document.querySelector("#message")!;
  const submit = document.createElement("button");
  submit.innerText = "Submit";

  submit.addEventListener("click", async () => {
    message.innerHTML = "";
    try {
      submit.innerText = "Submitting...";
      await moneyHash.proceedWith({
        intentId: paymentIntentId,
        type: "method",
        id: "CARD",
      });

      const { accessToken, __providerId__: providerId } =
        await moneyHash.getIntentDetails(paymentIntentId);
      const billingData = {
        first_name: "Alaa",
        last_name: "Othman",
        email: "a.a@a.com",
        phone_number: "+201001234567",
      };

      const shippingData = {};

      const res = await elements.submit({
        accessToken,
        providerId,
        billingData,
        shippingData,
      });
      console.log("Success! Intent Processed", { res });
      submit.innerText = "Submit";
      message.innerHTML = "Success! Intent Processed";
      message.setAttribute("style", "color: green");
    } catch (error) {
      console.log("playground", error);
      submit.innerText = "Submit";
      message.innerHTML = `${error}`;
      message.setAttribute("style", "color: red");
    }
  });

  const container = document.querySelector(".container");
  container!.appendChild(submit);

  // cardName.on("ready", event => {
  //   // Handle ready event
  //   cardName.focus();
  // });

  // cardName.on("focus", () => {
  //   // Handle focus event
  // });

  // cardName.on("blur", () => {
  //   // Handle blur event
  // });

  // moneyHash.renderField({ selector: "#app", inputType: "text", options: {} });

  // await moneyHash.renderForm({ selector: "#app", intentId: paymentIntentId });
  // intentDetails = await moneyHash.getIntentDetails(paymentIntentId);

  // console.log(intentDetails);

  // moneyHash.renderForm({ selector: "#app", intentId: paymentIntentId });

  // const intentMethods = await moneyHash.getIntentMethods(paymentIntentId);

  // const response = await moneyHash.proceedWith({
  //   intentId: paymentIntentId,
  //   type: "method", // method | savedCard | customerBalance
  //   id: "MOBILE_WALLET",
  // });

  // console.log(response);
});

document.getElementById("apple-btn")?.addEventListener("click", () => {
  if (!intentDetails) return;

  moneyHash
    .payWithApplePay({
      intentId: paymentIntentId,
      countryCode: "AE",
      amount: intentDetails.intent.amount.formatted,
      currency: intentDetails.intent.amount.currency,
      billingData: {
        email: "test@test.com",
      },
      onCancel: () => console.log("CANCEL"),
      onComplete: async () => {
        // Will fire after a successful payment
        console.log("COMPLETE");
      },
      onError: async () => {
        // Will fire after a failure payment
        console.log("ERROR");
      },
    })
    .catch(error => {
      console.log(error);
      /**
       *
       * error.message
          - Must create a new ApplePaySession from a user gesture handler. // Native apple pay button need to be triggered from click event directly
          - Billing data is missing while calling payWithApplePay // intent requires billing data to proceed with the native integration
       */

      /**
       * error
       *  { email: "Enter a valid email address." }
       */
    });
});
