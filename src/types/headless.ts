import {
  IntentType,
  PaymentIntent,
  PaymentMethodSlugs,
  PayoutIntent,
  Transaction,
} from "./intent";

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
  method: PaymentMethodSlugs;
  name: string;
  icons: string[];
}

export type PaymentApiSuccessResponse = {
  intent: PaymentIntent;
  transaction: Transaction;
  savedCards?: Card[];
  paymentMethods: Method[];
  wallet: number;
};

export type PayoutApiSuccessResponse = {
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
