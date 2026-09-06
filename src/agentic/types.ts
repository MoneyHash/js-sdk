export type GeneratePassKeyOptionsResponse =
  | { mode: "registration"; options: PublicKeyCredentialCreationOptionsJSON }
  | { mode: "authentication"; options: PublicKeyCredentialRequestOptionsJSON };

/**
 * Successful verification result. Only returned on success — failed
 * verification rejects with a `4xx` API error instead of resolving.
 */
export type VerifyPassKeyAuthenticationResponse = {
  status: "AUTHORIZED";
  consentId: string;
  mode: "registration" | "authentication";
};
