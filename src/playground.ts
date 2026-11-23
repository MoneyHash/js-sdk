/* eslint-disable no-console */
import MoneyHash, { IntentDetails } from "./headlessMoneyHash";
import Agentic from "./agentic";
import MoneyHashAgenticCommerce from "./chatWidget";

declare global {
  interface Window {
    MoneyHash: typeof MoneyHash;
  }
}

window.MoneyHash = window.MoneyHash || MoneyHash;

// const paymentIntentId = "LnEDaJ9";

const intentDetails: IntentDetails<"payment"> | null = null;
console.log(intentDetails);
const moneyHash = new MoneyHash({
  type: "payment",
});

moneyHash.setIntentSecret("asdasdas");

/*
 * The sample merchant server (agentic's /sample-merchant) creates and charges
 * the consent for its own checkouts; its SAMPLE_MERCHANT_CORE_API_KEY and
 * SAMPLE_MERCHANT_DEMO_CUSTOMER_ID must match the account and customer below.
 */
// A chat session for CUSTOMER_ID, issued outside the playground.
const CHAT_SESSION = "osWAxOKHiq7N59NhtK4lRNT_hmtRWss4HZeyQ8LLUEw";
const PUBLIC_API_KEY =
  "public.z6dmQg11.HeWjgvYnUe1G61ieTsnoKSzBDk7nDZBLoiHMRPnn";
const CUSTOMER_ID = "744b6629-d742-4e81-ace8-d0cf5496116c";
const AGENTIC_URL = "http://localhost:8003";
const MERCHANT_URL = `${AGENTIC_URL}/sample-merchant`;

async function post<T>(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `${url} failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }
  return { status: response.status, data: data as T };
}

const chatWidget = new MoneyHashAgenticCommerce({
  chatSession: CHAT_SESSION,
  publicApiKey: PUBLIC_API_KEY,
  // The same customer the consents are created for, so their saved cards show.
  customerId: CUSTOMER_ID,
  // The merchant's own instance: the passkey runs on this page through it.
  moneyHash: new MoneyHash({
    type: "payment",
    publicApiKey: PUBLIC_API_KEY,
    plugins: [new Agentic()],
  }),
  onCreateConsent: async ({ checkoutId, savedCardId }) => {
    const { data: consent } = await post<{
      consent_id: string;
      intent_id: string | null;
      intent_secret: string | null;
    }>(`${MERCHANT_URL}/consents`, {
      checkout_id: checkoutId,
      saved_card_id: savedCardId,
    });
    return {
      consentId: consent.consent_id,
      intentId: consent.intent_id,
      intentSecret: consent.intent_secret,
    };
  },
  onExecutePayment: async ({ consentId }) => {
    const response = await fetch(
      `${MERCHANT_URL}/consents/${consentId}/execute`,
      { method: "POST" },
    );
    // 202: still processing; the agent confirms the outcome itself.
    if (response.status === 202) return { orderId: null };
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        `execute failed (${response.status}): ${JSON.stringify(data)}`,
      );
    }
    return { orderId: (data as { order_id: string }).order_id };
  },
  assistantName: "Acme Concierge",
  // logoUrl:
  //   "https://thumb.wikimedia.org/wikipedia/en/thumb/6/6a/Tamatem_Games_2022_Logo.svg/330px-Tamatem_Games_2022_Logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=thumbnail",
  logoUrl:
    "https://avatars.usepylon.com/c800ddd6-5de2-4fc3-94d8-dd12233e0024/chat-widget-avatars/8ed5986b-4e99-430d-abce-9a026fd07f49-1743156265408",
  quickPrompts: ["Show me new arrivals", "Track my order"],
  cartPopularPicks: [{ label: "Sneakers", prompt: "Show me sneakers" }],
  theme: "dark",
  appearance: {
    // borderRadius: 14,
    colors: {
      // Warm ivory with a terracotta coral; every text pairing meets WCAG AA.
      light: {
        background: "#fffbf8",
        foreground: "#1f1712",
        primary: "#d6401f",
        primaryForeground: "#ffffff",
        muted: "#f7eee7",
        mutedForeground: "#6b5d54",
        border: "#ecdfd5",
        success: "#15803d",
      },
      // Espresso rather than pure black, so the warm surfaces don't look muddy.
      dark: {
        background: "#14100e",
        foreground: "#f5ede7",
        primary: "#ff7a5c",
        primaryForeground: "#1a0d08",
        muted: "#241c18",
        mutedForeground: "#ab9e95",
        border: "#382d26",
        success: "#4ade80",
      },
    },
  },
});
chatWidget.render();

document
  .getElementById("chat-show")
  ?.addEventListener("click", () => chatWidget.show());
document
  .getElementById("chat-hide")
  ?.addEventListener("click", () => chatWidget.hide());
document
  .getElementById("chat-open")
  ?.addEventListener("click", () => chatWidget.open());
document
  .getElementById("chat-close")
  ?.addEventListener("click", () => chatWidget.close());

// const moneyHash: MoneyHash<"payment"> = new MoneyHash({
//   type: "payment",
//   onComplete: data => {
//     // open modal confirmation for apple pay
//     console.log("onComplete", data);
//   },
//   onFail: ({ intent, transaction }) => {
//     console.log("onFail", { intent, transaction });
//   },
//   styles: {
//     submitButton: {
//       base: {
//         background: "#09c",
//         color: "white",
//         borderRadius: "999px",
//       },
//       hover: {
//         background: "green",
//         color: "black",
//       },
//       focus: {
//         background: "yellow",
//         color: "black",
//       },
//     },
//     input: {
//       base: {
//         borderRadius: "0px",
//         borderColor: "#09c",
//       },
//       focus: {
//         boxShadow: "none",
//       },
//       error: {
//         borderColor: "red",
//         borderWidth: 1,
//         boxShadow: "none",
//       },
//     },
//   },
// });

// document.getElementById("start")?.addEventListener("click", async () => {
//   moneyHash?.removeEventListeners();

//   const x = await moneyHash.getIntentDetails(paymentIntentId);
//   console.log(x);

//   const elements = await moneyHash.elements({
//     styles: {
//       color: "white", // color of the text
//       backgroundColor: "grey", // background color of the input
//       placeholderColor: "#ccc", // placeholder color
//     },
//   });

//   const cardHolderName = elements.create({
//     elementType: "cardHolderName",
//     elementOptions: {
//       selector: "#card-holder-name",
//       // height: "80px",
//       placeholder: "Card Holder Name",
//       styles: {
//         // color: "red",
//         // backgroundColor: "black", // background color of the input
//         // placeholderColor: "#ccc", // placeholder color
//       },
//     },
//   });

//   const cardNumber = elements.create({
//     elementType: "cardNumber",
//     elementOptions: {
//       selector: "#card-number",
//       styles: {
//         // color: "red",
//       },
//     },
//   });

//   const cardCvv = elements.create({
//     elementType: "cardCvv",
//     elementOptions: {
//       selector: "#card-cvv",
//       styles: {ƒ
//         // color: "blue",
//       },
//     },
//   });

//   const cardExpiryMonth = elements.create({
//     elementType: "cardExpiryMonth",
//     elementOptions: {
//       selector: "#card-expiry-month",
//       styles: {
//         // color: "green",
//       },
//     },
//   });

//   const cardExpiryYear = elements.create({
//     elementType: "cardExpiryYear",
//     elementOptions: {
//       selector: "#card-expiry-year",
//       styles: {},
//     },
//   });

//   cardHolderName.on("focus", () => {
//     console.log("focus card holder");
//   });

//   cardHolderName.mount();
//   cardNumber.mount();
//   cardCvv.mount();
//   cardExpiryMonth.mount();
//   cardExpiryYear.mount();

//   const message = document.querySelector("#message")!;
//   const submit = document.createElement("button");
//   submit.innerText = "Submit";

//   submit.addEventListener("click", async () => {
//     message.innerHTML = "";
//     try {
//       submit.innerText = "Submitting...";
//       const { formFields, __providerId__: providerId } =
//         await moneyHash.proceedWith({
//           intentId: paymentIntentId,
//           type: "method",
//           id: "CARD",
//         });

//       const billingData = {
//         first_name: "Alaa",
//         last_name: "Othman",
//         email: "a.a@a.com",
//         phone_number: "+201001234567",
//       };

//       const shippingData = {};

//       const res = await moneyHash.submitForm({
//         intentId: paymentIntentId,
//         accessToken: formFields?.card?.accessToken,
//         providerId,
//         billingData,
//         shippingData,
//       });
//       console.log("Success! Intent Processed", { res });
//       submit.innerText = "Submit";
//       message.innerHTML = "Success! Intent Processed";
//       message.setAttribute("style", "color: green");
//     } catch (error) {
//       console.log("playground", error);
//       submit.innerText = "Submit";
//       message.innerHTML = `${error}`;
//       message.setAttribute("style", "color: red");
//     }
//   });

//   const container = document.querySelector(".container");
//   container!.appendChild(submit);

//   // cardName.on("ready", event => {
//   //   // Handle ready event
//   //   cardName.focus();
//   // });

//   // cardName.on("focus", () => {
//   //   // Handle focus event
//   // });

//   // cardName.on("blur", () => {
//   //   // Handle blur event
//   // });

//   // moneyHash.renderField({ selector: "#app", inputType: "text", options: {} });

//   // await moneyHash.renderForm({ selector: "#app", intentId: paymentIntentId });
//   // intentDetails = await moneyHash.getIntentDetails(paymentIntentId);

//   // console.log(intentDetails);

//   // moneyHash.renderForm({ selector: "#app", intentId: paymentIntentId });

//   // const intentMethods = await moneyHash.getIntentMethods(paymentIntentId);

//   // const response = await moneyHash.proceedWith({
//   //   intentId: paymentIntentId,
//   //   type: "method", // method | savedCard | customerBalance
//   //   id: "MOBILE_WALLET",
//   // });

//   // console.log(response);
// });

// document.getElementById("start")?.click();
// document.getElementById("apple-btn")?.addEventListener("click", () => {
//   if (!intentDetails) return;

//   moneyHash
//     .payWithApplePay({
//       intentId: paymentIntentId,
//       countryCode: "AE",
//       amount: intentDetails.intent.amount.formatted,
//       currency: intentDetails.intent.amount.currency,
//       billingData: {
//         email: "test@test.com",
//       },
//       onCancel: () => console.log("CANCEL"),
//       onComplete: async () => {
//         // Will fire after a successful payment
//         console.log("COMPLETE");
//       },
//       onError: async () => {
//         // Will fire after a failure payment
//         console.log("ERROR");
//       },
//     })
//     .catch(error => {
//       console.log(error);
//       /**
//        *
//        * error.message
//           - Must create a new ApplePaySession from a user gesture handler. // Native apple pay button need to be triggered from click event directly
//           - Billing data is missing while calling payWithApplePay // intent requires billing data to proceed with the native integration
//        */

//       /**
//        * error
//        *  { email: "Enter a valid email address." }
//        */
//     });
// });
