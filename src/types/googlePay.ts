export type GooglePaymentsClient =
  typeof window.google.payments.api.PaymentsClient["prototype"];
export type GoogleEnvironment = ConstructorParameters<
  typeof window.google.payments.api.PaymentsClient
>["0"]["environment"];

export type IsReadyToPayRequest = Parameters<
  GooglePaymentsClient["isReadyToPay"]
>[0];
export type PaymentDataRequest = Parameters<
  GooglePaymentsClient["loadPaymentData"]
>[0];

export type GoogleButtonOptions = Pick<
  Parameters<GooglePaymentsClient["createButton"]>[0],
  | "buttonColor"
  | "buttonLocale"
  | "buttonRadius"
  | "buttonSizeMode"
  | "buttonType"
>;

export type GoogleAllowedAuthMethods =
  IsReadyToPayRequest["allowedPaymentMethods"][number]["parameters"]["allowedAuthMethods"];
export type GoogleAllowedCardNetworks =
  IsReadyToPayRequest["allowedPaymentMethods"][number]["parameters"]["allowedCardNetworks"];
