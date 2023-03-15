import MoneyHash from ".";

const paymentIntentId = "9zBoK79";
const payoutIntentId = "ZvrboGZ";

let moneyHash: MoneyHash;

document.getElementById("start")?.addEventListener("click", () => {
  moneyHash = new MoneyHash({
    onSuccess: ({ type, intent, actionData }) => {
      // eslint-disable-next-line no-console
      console.log("onSuccess", { type, intent, actionData });
    },
    onFailure: ({ type, intent, actionData }) => {
      // eslint-disable-next-line no-console
      console.log("onFailure", { type, intent, actionData });
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
    type: "payment",
  });
});

document.getElementById("start-payout")?.addEventListener("click", () => {
  moneyHash = new MoneyHash({ locale: "ar" });
  moneyHash.start({
    selector: "#app",
    intentId: payoutIntentId,
    type: "payout",
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
