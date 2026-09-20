/**
 * WebAuthn option types, serialized for transport as JSON (binary fields as
 * Base64URL strings). Defined locally rather than relying on the DOM lib's
 * `*JSON` variants, which only exist in very recent TypeScript releases — so
 * the SDK's public types resolve on any consumer's TypeScript version and
 * survive `.d.ts` bundling at build time.
 */
type Base64URLString = string;

interface PublicKeyCredentialRpEntityJSON {
  id?: string;
  name: string;
}

interface PublicKeyCredentialUserEntityJSON {
  id: Base64URLString;
  name: string;
  displayName: string;
}

interface PublicKeyCredentialParametersJSON {
  type: "public-key";
  alg: number;
}

interface PublicKeyCredentialDescriptorJSON {
  id: Base64URLString;
  type: "public-key";
  transports?: string[];
}

interface AuthenticatorSelectionCriteriaJSON {
  authenticatorAttachment?: "platform" | "cross-platform";
  residentKey?: "discouraged" | "preferred" | "required";
  requireResidentKey?: boolean;
  userVerification?: "required" | "preferred" | "discouraged";
}

type AuthenticationExtensionsClientInputsJSON = Record<string, unknown>;

export interface PublicKeyCredentialCreationOptionsJSON {
  rp: PublicKeyCredentialRpEntityJSON;
  user: PublicKeyCredentialUserEntityJSON;
  challenge: Base64URLString;
  pubKeyCredParams: PublicKeyCredentialParametersJSON[];
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
  authenticatorSelection?: AuthenticatorSelectionCriteriaJSON;
  hints?: string[];
  attestation?: string;
  attestationFormats?: string[];
  extensions?: AuthenticationExtensionsClientInputsJSON;
}

export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: Base64URLString;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptorJSON[];
  userVerification?: "required" | "preferred" | "discouraged";
  hints?: string[];
  extensions?: AuthenticationExtensionsClientInputsJSON;
}

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
};
