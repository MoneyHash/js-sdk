import MoneyHash from ".";

const paymentIntentId = "ZDd3PaZ";

let moneyHash: MoneyHash<"payment">;

document.getElementById("start")?.addEventListener("click", () => {
  moneyHash?.removeEventListeners();
  moneyHash = new MoneyHash({
    type: "payment",
    onComplete: ({ intent, transaction }) => {
      // eslint-disable-next-line no-console
      console.log("onComplete", { intent, transaction });
    },
    onFail: ({ intent, transaction }) => {
      // eslint-disable-next-line no-console
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

  moneyHash.start({
    selector: "#app",
    intentId: paymentIntentId,
  });
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
