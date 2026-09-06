/**
 * Convert from a Base64URL-encoded string to an Array Buffer. Best used when converting a
 * credential ID from a JSON string to an ArrayBuffer, like in allowCredentials or
 * excludeCredentials
 *
 * Helper method to compliment `bufferToBase64URLString`
 */
export function base64URLStringToBuffer(base64URLString: string): ArrayBuffer {
  // Convert from Base64URL to Base64
  const base64 = base64URLString.replace(/-/g, "+").replace(/_/g, "/");
  /**
   * Pad with '=' until it's a multiple of four
   * (4 - (85 % 4 = 1) = 3) % 4 = 3 padding
   * (4 - (86 % 4 = 2) = 2) % 4 = 2 padding
   * (4 - (87 % 4 = 3) = 1) % 4 = 1 padding
   * (4 - (88 % 4 = 0) = 4) % 4 = 0 padding
   */
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64.padEnd(base64.length + padLength, "=");

  // Convert to a binary string
  const binary = atob(padded);

  // Convert binary string to buffer
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return buffer;
}

/**
 * Convert the given array buffer into a Base64URL-encoded string. Ideal for converting various
 * credential response ArrayBuffers to string for sending back to the server as JSON.
 *
 * Helper method to compliment `base64URLStringToBuffer`
 */
export function bufferToBase64URLString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";

  for (let i = 0; i < bytes.length; i += 1) {
    str += String.fromCharCode(bytes[i]);
  }

  const base64String = btoa(str);

  return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Serialize the credential's binary response fields to Base64URL strings so
 * they survive JSON. An attestation response (registration ceremony) and an
 * assertion response (authentication ceremony) carry different fields.
 */
export function serializeCredentialResponse(response: AuthenticatorResponse) {
  const clientDataJSON = bufferToBase64URLString(response.clientDataJSON);

  if ("attestationObject" in response) {
    const attestation = response as AuthenticatorAttestationResponse;
    return {
      clientDataJSON,
      attestationObject: bufferToBase64URLString(attestation.attestationObject),
      transports: attestation.getTransports?.(),
    };
  }

  const assertion = response as AuthenticatorAssertionResponse;
  return {
    clientDataJSON,
    authenticatorData: bufferToBase64URLString(assertion.authenticatorData),
    signature: bufferToBase64URLString(assertion.signature),
    userHandle: assertion.userHandle
      ? bufferToBase64URLString(assertion.userHandle)
      : null,
  };
}
