import { IntentType, PaymentIntent, PayoutIntent, Transaction } from "./intent";

export interface Card {
  id: string;
  brand: string;
  logo: string;
  last4Digits: string;
  expiryMonth: string;
  expiryYear: string;
  country: string | null;
}

export interface Method {
  method: string;
  name: string;
  icons: string[];
}

type PaymentApiSuccessResponse = {
  intent: PaymentIntent;
  transaction: Transaction;
  savedCards?: Card[];
  paymentMethods: Method[];
  wallet: number;
};

type PayoutApiSuccessResponse = {
  intent: PayoutIntent;
  transaction: Transaction;
  payoutMethods: Method[];
};

export type SuccessResponse<TType extends IntentType> = TType extends "payment"
  ? PaymentApiSuccessResponse
  : PayoutApiSuccessResponse;

export type ErrorResponse = {
  code: number;
  message: string;
};
