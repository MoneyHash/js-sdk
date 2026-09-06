import throwIf from "../utils/throwIf";
import type { MoneyHashPlugin, PluginContext } from "../types/plugin";
import {
  GeneratePassKeyOptionsResponse,
  VerifyPassKeyAuthenticationResponse,
} from "./types";
import {
  base64URLStringToBuffer,
  bufferToBase64URLString,
  serializeCredentialResponse,
} from "./utils";

export default class Agentic implements MoneyHashPlugin<"agentic"> {
  readonly name = "agentic" as const;

  private hostContext: PluginContext | null = null;

  register(context: PluginContext) {
    this.hostContext = context;
  }

  /** Host context, guarded — throws if the plugin wasn't registered. */
  private get context(): PluginContext {
    throwIf(
      !this.hostContext,
      "Agentic must be registered as a MoneyHash plugin before use. Pass it via `plugins: [new Agentic()]`.",
    );
    return this.hostContext!;
  }

  generatePassKeyOptions({
    consentId,
  }: {
    consentId: string;
  }): Promise<GeneratePassKeyOptionsResponse> {
    return this.context.sdkApiHandler.request({
      api: "sdk:agentic:generatePassKeyOptions",
      payload: {
        consentId,
        publicApiKey: this.context.publicApiKey,
      },
    });
  }

  /**
   * Prompt the user for a passkey ceremony (registration or authentication),
   * based on the `mode` returned by {@link Agentic.generatePassKeyOptions}.
   *
   * If no credential object can be created, the promise resolves with `null` —
   * always check the result before treating the ceremony as successful.
   *
   * The returned promise rejects with a `DOMException` — switch on
   * `error.name`
   *
   * - `NotAllowedError` — the user dismissed/cancelled the passkey prompt,
   *   the options `timeout` expired, or the call wasn't triggered by a user
   *   gesture.
   * - `AbortError` — the passed `signal` was aborted. Expected when you
   *   cancel a pending prompt yourself (e.g. superseding it with a new one),
   *   not a failure.
   *
   * @example
   * ```ts
   * const options = await moneyHash.agentic.generatePassKeyOptions({ consentId });
   * try {
   *   const credential = await moneyHash.agentic.authenticatePassKey(options);
   * } catch (error) {
   *   if (error instanceof Error && error.name === "NotAllowedError") {
   *     // user cancelled or timed out — offer to retry
   *   }
   * }
   * ```
   */
  authenticatePassKey(
    { mode, options }: GeneratePassKeyOptionsResponse,
    signal?: AbortSignal,
  ): Promise<PublicKeyCredential | null> {
    if (mode === "registration") {
      const publicKey = {
        ...options,
        challenge: base64URLStringToBuffer(options.challenge),
        user: {
          ...options.user,
          id: base64URLStringToBuffer(options.user.id),
        },
        excludeCredentials: options.excludeCredentials?.map(credential => ({
          ...credential,
          id: base64URLStringToBuffer(credential.id),
        })),
      } as PublicKeyCredentialCreationOptions;

      return navigator.credentials.create({
        publicKey,
        signal,
      }) as Promise<PublicKeyCredential | null>;
    }

    const publicKey = {
      ...options,
      challenge: base64URLStringToBuffer(options.challenge),
      allowCredentials: options.allowCredentials?.map(credential => ({
        ...credential,
        id: base64URLStringToBuffer(credential.id),
      })),
    } as PublicKeyCredentialRequestOptions;

    return navigator.credentials.get({
      publicKey,
      signal,
    }) as Promise<PublicKeyCredential | null>;
  }

  /**
   * Verify the credential returned by {@link Agentic.authenticatePassKey}
   * with the MoneyHash backend, completing the passkey ceremony.
   *
   * Resolves only on successful verification — the response `status` is
   * always `"AUTHORIZED"`, with the `mode` of the ceremony that was completed.
   *
   * If verification fails (invalid signature, challenge mismatch, unknown or
   * expired `consentId`), the backend responds with a `4xx` and the returned
   * promise rejects with the API error payload.
   * so always wrap the call in a `try/catch`.
   *
   * @example
   * ```ts
   * try {
   *   const { status, mode } = await moneyHash.agentic.verifyPassKeyAuthentication({
   *     consentId,
   *     credential,
   *   });
   *   // status === "AUTHORIZED"
   * } catch (error) {
   *   // 4xx — verification failed, offer to retry the ceremony
   * }
   * ```
   */
  verifyPassKeyAuthentication({
    consentId,
    credential,
  }: {
    consentId: string;
    credential: PublicKeyCredential;
  }): Promise<VerifyPassKeyAuthenticationResponse> {
    const verification = {
      id: credential.id,
      rawId: bufferToBase64URLString(credential.rawId),
      type: credential.type,
      response: serializeCredentialResponse(credential.response),
      clientExtensionResults: credential.getClientExtensionResults(),
    };

    return this.context.sdkApiHandler.request({
      api: "sdk:agentic:verifyPassKeyAuthentication",
      payload: {
        consentId,
        publicApiKey: this.context.publicApiKey,
        verification,
      },
    });
  }
}
