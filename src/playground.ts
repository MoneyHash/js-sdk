import MoneyHash from ".";

const paymentIntentId = "Z0v7xoL";
// const payoutIntentId = "ZGAK2eL";

let moneyHash: MoneyHash<"payment">;

document.getElementById("start")?.addEventListener("click", () => {
  moneyHash?.removeEventListeners();
  moneyHash = new MoneyHash({
    type: "payment",
    onSuccess: ({ intent, transaction }) => {
      // eslint-disable-next-line no-console
      console.log("onSuccess", { intent, transaction });
    },
    onFailure: ({ intent, transaction }) => {
      // eslint-disable-next-line no-console
      console.log("onFailure", { intent, transaction });
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

  moneyHash.start({
    selector: "#app",
    intentId: paymentIntentId,
  });
});

// document.getElementById("start-payout")?.addEventListener("click", () => {
//   moneyHash?.removeEventListeners();
//   moneyHash = new MoneyHash({ type: "payout", locale: "ar" });
//   moneyHash.start({
//     selector: "#app",
//     intentId: payoutIntentId,
//   });
// });

document.getElementById("en")?.addEventListener("click", () => {
  moneyHash?.setLocale("en");
});
document.getElementById("fr")?.addEventListener("click", () => {
  moneyHash?.setLocale("fr");
});
document.getElementById("ar")?.addEventListener("click", () => {
  moneyHash?.setLocale("ar");
});
