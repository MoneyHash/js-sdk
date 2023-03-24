/* eslint-disable no-console */
import MoneyHash from "./headlessMoneyHash";

const paymentIntentId = "gEQ35vg";

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

  // await moneyHash.proceedWith({ intentId: paymentIntentId, method: "CARD" });
  // await moneyHash.deselectMethod({ intentId: paymentIntentId });

  // await moneyHash.toggleTemplateAmount({
  //   intentId: paymentIntentId,
  //   templateId: "91b601e8-160a-4e78-9679-8d042f88a158",
  //   amount: "100.00",
  //   note: "nice!",
  // });

  // try {
  //   const paymentSessionInfo = await moneyHash.getSessionDetails({
  //     intentId: paymentIntentId,
  //   });
  //   console.log("after successful getSessionDetails", paymentSessionInfo);

  //   if (
  //     paymentSessionInfo.intent.method &&
  //     !paymentSessionInfo.transaction.status
  //   ) {
  //     moneyHash.renderForm({
  //       selector: "#app",
  //       intentId: paymentIntentId,
  //     });
  //   }
  // } catch (error) {
  //   console.log("after error getSessionDetails", error);
  // }

  moneyHash.renderForm({ selector: "#app", intentId: paymentIntentId });
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
