export type CardBrand = "mastercard" | "maestro" | "visa" | "amex" | "discover";

type DpaAddress = {
  /**
   * Identifier used to point to the address.
   */
  addressId: string;
  /**
   * Max Length of 100. Name of the ordering customer.
   */
  name: string;
  /**
   * Max Length of 50. Address city.
   */
  city: string;
  /**
   * Max Length of 75. First line of the address.
   */
  line1: string;
  /**
   * Max Length of 75. Second line of the address.
   */
  line2?: string;
  /**
   * Max Length of 75. Third line of the address.
   */
  line3?: string;
  /**
   * Max Length of 30. Address state.
   */
  state?: string;
  /**
   * Max Length of 16. Address zip or postal code.
   */
  zip?: string;
  /**
   * ISO 3166-1 alpha 2 country code. Address country code.
   */
  countryCode?: string;
};

export type DpaPhoneNumber = {
  /**
   * Length of 1 to 4 digits. The international country code for the phone number (do not include a plus sign).
   */
  countryCode: string;
  /**
   * Length of 4 to 14 digits. Phone number without country code.
   */
  phoneNumber: string;
};

export type DpaData = {
  /**
   * Legal name of registered DPA.
   */
  dpaName: string;
  /**
   * Display name of the DPA website.
   */
  dpaPresentationName?: string;
  /**
   * DPA’s business address
   */
  dpaAddress?: DpaAddress;
  /**
   * DPA’s email address . Max Length= 255
   */
  dpaEmailAddress?: string;
  /**
   * DPA’s contact phone number.
   */
  dpaPhoneNumber?: DpaPhoneNumber;
  /**
   * URL to DPA’s logo.
   */
  dpaLogoUri?: string;
  /**
   * DPA’s support contact email address.
   */
  dpaSupportedEmailAddress?: string;
  /**
   * DPA’s support contact phone number.
   */
  dpaSupportedPhoneNumber?: DpaPhoneNumber;
  /**
   * URL of the DPA website.
   */
  dpaUri?: string;
  /**
   * DPA’s support URI.
   */
  dpaSupportUri?: string;
  /**
   * 	Supported values are WEB_BROWSER or MOBILE_APP.
   */
  applicationType?: "WEB_BROWSER" | "MOBILE_APP";
};

export type DpaTransactionAmount = {
  /**
   * The final transaction amount must be provided.
   */
  transactionAmount: number;
  /**
   * String specifying the ISO 4217 currency code (e.g., USD). Minimum length is 3.
   */
  transactionCurrencyCode: string;
};

export type DpaAuthenticationPreferences = {
  /**
   * Indicates if an Integrator has requested for the authentication of the payload or not. Valid values are:
   * - AUTHENTICATED: Denotes that an Integrator has requested authentication.
   * - NON_AUTHENTICATED: Denotes that an Integrator has requested to not opt for authentication.
   */
  payloadRequested?: "AUTHENTICATED" | "NON_AUTHENTICATED";
};

export type DpaPaymentOption = {
  /**
   * Type of cryptogram or token used for the card data. Supported values are:
CARD_APPLICATION_CRYPTOGRAM_SHORT_FORM: Digital Secure Remote Payment (DSRP) equivalent. DSRP cryptogram is a type of dynamic data which the Integrator will have to pass within Dynamic Payment Data field (DE104 SE001) of the payment authorization request. Pass this value if the merchant requires token & DSRP cryptogram for transaction or payment authorization.
NOTE: Integrators that support dual payload will receive a second payment credential in the card object, along with the token object. This payment credential should be used for additional cases outside of payment authorization. Work with your [Mastercard representative](https://developer.mastercard.com/unified-checkout-solutions/documentation/support/#get-help) for more details.

NONE: Pass this value if merchant requires FPAN for transaction or payment authorization.
NOTE: For countries that suppo`rt only tokens (not FPANs), payment authorization is done using the token passed in card object. Optionally, merchants can pass DTVC present in dynamicData object as part of payment authorization in place of CVC2.
Refer to [View the Decrypted Payload](https://developer.mastercard.com/unified-checkout-solutions/tutorial/integrate_apis/step9/) for a description of the formats returned during checkout.
Conditionality for Click to Pay: Required when payloadRequested= AUTHENTICATED.
   */
  dynamicDataType?: "CARD_APPLICATION_CRYPTOGRAM_SHORT_FORM" | "NONE";
};

export type DpaAcquirerData = {
  /**
   * List of card schemes the merchant accepts.
   */
  cardBrand: string;
  /**
   * Acquiring institution identification code as assigned by the 3DS Directory Server receiving the AReq message, for 3DS usage only.
   */
  acquirerBIN: string;
  /**
   * Acquiring institution identification code.
   */
  acquirerMerchantId: string;
};

export type DpaTransactionOptions = {
  /**
   * Billing Restrictions.
   * Array of country codes in ISO 3166-1 alpha-2 format - Payments from all the listed billing countries are accepted. E.g., [“US”,“CA”,“AU”]. An empty list or the absence of this data element means that all countries are accepted.
   * Note: Mastercard does not currently support declining payments based on the cardholder’s billing address. You should specify an empty array.
   */
  dpaAcceptedBillingCountries?: string[];
  /**
   * Container for amount and currency code.
   * Conditionality : Required if - threeDsPreference is set to NONE.
   */
  transactionAmount?: DpaTransactionAmount;
  /**
   * What level of detail you want to see for the billing address.
   * @default NONE
   */
  dpaBillingPreference?: "FULL" | "NONE" | "POSTAL_COUNTRY";
  /**
   * Merchant site preferred locale. Format: ISO language_country pair (e.g., en_US ). This is needed to ensure correct language and user experience. The value of the dpaLocale will be used by Mastercard SRC to create user profile and deliver Click to Pay experience by default. Users can choose to change the default country/language passed in dpaLocale from a country/language selection option in the DCF screen before profile creation. If users opt to choose that, then the profile will be created in the user selected country and language and the same will also be used to deliver the experience in all future checkouts by the same user.

   */
  dpaLocale?: `${string}_${string}`;
  /**
   * Object to contain the parameters for Authentication.
   */
  authenticationPreferences?: DpaAuthenticationPreferences;
  /**
   * Whether DPA wants consumer email ID in the Payload. Default is FALSE.
   */
  consumerEmailAddressRequested?: boolean;
  /**
   * Whether DPA wants consumer phone number in the Payload. Default is FALSE.
   */
  consumerPhoneNumberRequested?: boolean;
  /**
   * Whether DPA wants consumer name in the Payload.
   */
  consumerNameRequested?: boolean;
  /**
   * Payment options requested by the DPA for this transaction.
   */
  paymentOptions?: DpaPaymentOption[];
  /**
   * Describes the merchant’s type of business, product or service. The same value is expected in the authorization request.
   * Conditionality for Click to Pay: Required when payloadRequested=AUTHENTICATED.
   */
  merchantCategoryCode?: string;
  /**
   * ISO 3166 alpha 2 country code of the merchant.
   * Conditionality for Click to Pay: Required when payloadRequested=AUTHENTICATED.
   */
  merchantCountryCode?: string;
  /**
   * Digital Payment Application generated order/invoice number corresponding to a Consumer purchase.
   * Typically, used for reconciliation purposes by the merchant.
   */
  merchantOrderId?: string;
  /**
   * Type of the order. Valid values for enum:
   * - SPLIT_SHIPMENT
   * - PREFERRED_CARD
   */
  orderType?: "SPLIT_SHIPMENT" | "PREFERRED_CARD";
  /**
   * This is for a future enhancement. It will be the merchant’s 3DS preferences. Currently this should be set to NONE if provided.
   */
  threeDsPreference?: "NONE";
  /**
   * Key parameter to distinguish if a network-specific DCF or a loading screen is displayed after card selection. Default is FALSE. When set to False, consumer is prompted to ‘Continue’ the payment on a loading screen; when set to True, consumer is prompted with a Confirm payment message on DCF. Set this parameter along with [checkoutExperience](https://developer.mastercard.com/unified-checkout-solutions/documentation/sdk-reference/init/#request-parameters) to enable Embedded checkout experience.
   */
  confirmPayment?: boolean;
  /**
   * Consists of acquirerBIN and acquirerMerchantId for the supported cardBrand.
   * These values are used for initiating managed transaction authentication across different card brands/networks.
   * Conditionality for Click to Pay: Required to be passed in init() when payloadRequested= AUTHENTICATED.
   */
  acquirerData?: DpaAcquirerData[];
};

export type DpaConsent = {
  /**
   * Max Length of 10. Represents the version accepted by the Consumer.
   */
  acceptedVersion?: string;
  /**
   * Max Length of 10. Represents the latest version.
   */
  latestVersion?: string;
  /**
   * Max Length of 1024. Represents the URI of the latest version.
   */
  latestVersionUri?: string;
};

export type DpaComplianceSettings = {
  /**
   * Privacy consent status.
   */
  privacy?: DpaConsent;
  /**
   * "T&Cs" consent status.
   */
  tnc?: DpaConsent;
};

export type DigitalCardData = {
  /**
   * Status of the Card in the Click to Pay System. Values: ACTIVE
   */
  status: "ACTIVE";
  /**
   * Name that can be used for display. Presentation text created by the Consumer to enable recognition of the PAN entered into the DCF. This value is unique to the DCF and defined by the Consumer (e.g., Nickname).
   */
  presentationName?: string;
  /**
   * Presentation text defined by the SRC Program that describes the PAN presented as a Digital Card. This descriptor is the same across all DCFs.
   */
  descriptorName: string;
  /**
   * HTTPS (full) URL for the cardArt. Can be card or issuer specific value, e.g, https://sbx.assets.mastercard.com/card-art/combined-image-asset/HIGH-MASK-3x.png.
   */
  artUri: string;
  /**
   * Set of events that are pending completion such as address verification or SCA.
   * - `PENDING_AVS`
   * - `PENDING_SCA`
   * - `PENDING_CONSUMER_IDV`
   */
  pendingEvents?: string[];
  /**
   * Max Length of 128. Textual Name of the co-brand partner. Only available on tokenized Mastercard cards.
   */
  coBrandedName?: string;
  /**
   * Indicates whether the card is co-branded. Only available on tokenized Mastercard cards.
   */
  isCoBranded?: boolean;
};

export type MaskedCard = {
  /**
   * Max Length of 36. Unique Identifier of the card. A reference representing the PAN or Payment Token that enables a non-Issuer entity to identify the underlying PAN. A single PAN can have one or more SRC Digital Card Reference Identifiers. Digital Card information can be accompanied with SRC Digital Card Reference Identifier. It is associated with the SRC Profile to which the Digital Card belongs and is unique within a Click to Pay System.
   * Conditionality: Supplied when returned to SRCi or DCF; not required when returned to a participating Issuer.
   */
  srcDigitalCardId: string;
  /**
   * Max Length = (PAN Length - 10). First significant digits of the PAN, included in an unmasked form.
   */
  panBin?: string;
  /**
   * Length of 4. Attribute of the Payment Card that represents the Last 4 digits of the PAN included in an unmasked form.
   */
  panLastFour: string;
  /**
   * Length of 2. Expiration month of the Payment Card, expressed as a Calendar Month used for presentation purposes.
   * Conditionality: Supplied when specified for the card (PAN).
   */
  panExpirationMonth: string;
  /**
   * Length of 4. Expiration year of the Payment Card expressed as four-digit year, used for presentation purposes.
   * Conditionality: Supplied when specified for the card (PAN).
   */
  panExpirationYear: string;
  /**
   * ISO 8601 Timestamp in the UTC timezone, e.g., “2018-09-23T04:56:07Z” when card was enrolled into the Click to Pay System.
   */
  dateOfCardCreated: string;
  /**
   * Masked billing address associated with the card.
   */
  maskedBillingAddress: MaskedAddress;
  /**
   * Masked shipping address associated with the card.
   */
  maskedShippingAddress: MaskedAddress;
  /**
   * Digital Card Data contains digital card information that is used in the acceptance environment and in the user interface. Its purpose is to provide reference to the actual PAN or Payment Token without actually disclosing either. Digital Card Data is grouped based on the following:
   * - Digital Card Information: data used in Request and Response Messages
   * - UI/UX Presentation Data: data used user interfaces to provide the user with a recognizable descriptor
   * - Digital Card Art: image that accompanies Digital Card information for user interface purposes.
   */
  digitalCardData: DigitalCardData;
  /**
   * Max Length of 32. This is the card brand, and will be a free-form string, to be defined within a program. For example, mastercard, discover, visa, american-express.
   */
  paymentCardDescriptor?: string;
  /**
   * Max Length of 32. Conveys the card type. Enum values: CREDIT, DEBIT, PREPAID, COMBO, FLEX
   *
   * **Note**: COMBO and FLEX are for applicable regions only.
   */
  paymentCardType?: "CREDIT" | "DEBIT" | "PREPAID" | "COMBO" | "FLEX";
};

export type DpaMaskedConsumerIdentity = {
  /**
   * The entity or organization that collected and verifies the identity. Values:
   * - SRC.
   */
  identityProvider?: string;
  /**
   * Identifies the type of Consumer Identity transmitted or collected. Values:
   * - EMAIL_ADDRESS
   * - MOBILE_PHONE_NUMBER
   */
  identityType: "EMAIL_ADDRESS" | "MOBILE_PHONE_NUMBER";
  /**
   * Max Length of 255. Masked consumer identifier value, e.g., masked email address or masked mobile phone number as per masking rules.
   */
  maskedIdentityValue: string;
};

export type MaskedConsumer = {
  /**
   * Click to Pay Consumer Reference Identifier as generated by the Click to Pay System.
   */
  srcConsumerId?: string;
  /**
   * Represents the masked value of the primary verifiable consumer identifier within a Click to Pay Profile, e.g., an email address or a mobile phone number.
   */
  maskedConsumerIdentity: DpaMaskedConsumerIdentity;
  /**
   * Max Length of 255. Masked Consumer email address.
   */
  maskedEmailAddress?: string;
  /**
   * Masked Consumer mobile phone number.
   */
  maskedMobileNumber?: DpaPhoneNumber;
  /**
   * Consumer compliance settings.
   */
  complianceSettings?: DpaComplianceSettings;
  /**
   * ISO 3166 alpha 2 country code. Consumer provided country code.
   */
  countryCode?: string;
  /**
   * ISO 639-1 Code. Consumer provided language choice.
   */
  languageCode?: string;
  /**
   * Signifies the state of the consumer at any given time at the Click to Pay System. Values:
   * - ACTIVE
   * - SUSPENDED
   * - LOCKED.
   */
  status?: "ACTIVE" | "SUSPENDED" | "LOCKED";
  /**
   * Max Length of 50. Masked first name of the consumer.
   */
  maskedFirstName?: string;
  /**
   * Max Length of 50. Masked last name of the consumer.
   */
  maskedLastName?: string;
  /**
   * Max Length of 100. Masked full name of the consumer.
   */
  maskedFullname?: string;
  /**
   * ISO 8601 Timestamp in the UTC timezone, e.g., “2018-09-23T04:56:07Z” UTC timestamp when consumer was added to the Click to Pay System.
   */
  dateConsumerAdded: string;
  /**
   * ISO 8601 Timestamp in the UTC timezone, e.g., “2018-09-23T04:56:07Z” when consumer last transacted in the Click to Pay System.
   */
  dateConsumerLastUsed: string;
};

export type MaskedAddress = {
  addressId: string;
  /**
   * ISO 8601 Timestamp in the UTC timezone, e.g., “2018-09-23T04:56:07Z” the shipping address was created.
   * Conditionality: Only for shipping addresses.
   */
  /**
   * Max Length of 60. Name of the individual receiving the delivered goods or service.
   */
  name: string;
  /**
   * Max Length of 75. First line of the address.
   */
  countryCode: string;
  /**
   * Max Length of 16. Address zip or postal code.
   */
  city: string;
  /**
   * Max Length of 30. Address state.
   */
  line1: string;
  /**
   * Max Length of 75. Second line of the address.
   */
  line2?: string;
  /**
   * Max Length of 75. Third line of the address.
   */
  line3?: string;
  /**
   * Max Length of 50. Address city.
   */
  state?: string;
  /**
   * ISO 3166-1 alpha 2 country code. Address country code.
   */
  zip?: string;
  /**
   * Identifier used to point to the address.
   */
  createTime?: string;
  /**
   * ISO 8601 Timestamp in the UTC timezone, e.g., “2018-09-23T04:56:07Z” the shipping address was last used.
   * Conditionality: Only for shipping addresses.
   */
  lastUsedTime?: string;
};

export type DpaConsumer = {
  /**
   * Max Length of 255. Consumer-provided email address.
   */
  emailAddress?: string;
  /**
   * Consumer-provided mobile number.
   */
  mobileNumber?: DpaPhoneNumber;
  /**
   * Max Length of 255. Consumer’s first name.
   */
  firstName?: string;
  /**
   * Max Length of 255. Consumer’s last name.
   */
  lastName?: string;
};

export type Click2PayInitOptions = {
  env: "sandbox" | "production";
  /**
   *  This is a unique identifier for your Digital Payment Application (DPA), which can be obtained from your method nativePayData.
   */
  srcDpaId: string;
  /**
   * The site preferred locale. This should have a format of ISO {LanguageCode}_{CountryCode2} pair (e.g., en_US ) for a seamless user experience and correct language. Click to Pay uses the value of the dpaLocale to deliver the default experience.
   */
  dpaLocale: `${string}_${string}`;
  /**
   * 	List of card schemes the merchant accepts. We currently support mastercard, visa, amex, discover and maestro.
   */
  cardBrands: CardBrand[];
  /**
   * This structure represents the DPA-specific preferences and transaction configuration parameters that are common across all transactions. DpaTransactionOptions data replaces the DPA configuration data that passed to the init method.
   */
  dpaData: DpaData;
  /**
   * DPA-specific preferences and transaction configuration parameters.
   */
  dpaTransactionOptions?: DpaTransactionOptions;
  /**
   * Array containing the legal names of your co-branded partners.  To promote your brand, if the cardholder has one of your co-branded cards then this card will appear at the top of a card list.
   */
  coBrandNames?: string[];
  /**
   * Configure when card enrollment is offered to the cardholder. This only applies to Mastercard. Supported values:
   *
   * `WITHIN_CHECKOUT` – Enrollment during embedded checkout, allows Checkout using Click to Pay without a Profile. (Guest Checkout Option)
   *
   * `PAYMENT_SETTINGS` – Enrollment outside checkout, allows Checkout with Click to Pay. (No Guest Checkout Option)
   */
  checkoutExperience?: "WITHIN_CHECKOUT" | "PAYMENT_SETTINGS";
  /**
   * JWT containing the recognition token that the Integrator stored on device or browser.
   */
  recognitionToken?: string;
};

export type CardListEventMap = {
  selectSrcDigitalCardId: CustomEvent<string>;
  clickAddCardLink: CustomEvent<null>;
  clickSignOutLink: CustomEvent<PointerEvent>;
  close: CustomEvent<PointerEvent>;
};

export type CardListEvent = keyof CardListEventMap;

export type CheckoutWithCardOptions = {
  /**
   * Identifies the card to be charged. The srcDigitalCardId returned in the payload response of the masked cards.
   */
  srcDigitalCardId: string;
  /**
   * Indicates the consumer’s consent to be remembered.
   */
  rememberMe?: boolean;
  /**
   * This structure represents the DPA-specific preferences and transaction configuration parameters that are common across all transactions. DpaTransactionOptions data replaces the DPA configuration data that passed to the init() method.
   */
  dpaTransactionOptions?: DpaTransactionOptions;
  /**
   * Consumer compliance settings.
   */
  complianceSettings?: DpaComplianceSettings;
};

export type CheckoutWithNewCardOptions = {
  /**
   * Merchant can supply consumer data in this method to auto populate the consumer information without the need for the consumer to re-enter the same details.
   */
  consumer?: DpaConsumer;
  /**
   * Consumer compliance settings.
   */
  complianceSettings?: DpaComplianceSettings;
  /**
   * 	This structure represents the DPA-specific preferences and transaction configuration parameters that are common across all transactions. DpaTransactionOptions data replaces the DPA configuration data that passed to the init method.
   */
  dpaTransactionOptions?: DpaTransactionOptions;
  /**
   * Indicates the consumer’s consent to be remembered by third-party cookies.
   */
  rememberMe?: boolean;
  /**
   * Indicates the consumer’s consent to be remembered by recognition token and third-party cookie. This is applicable if Integrator supports first-party cookie and the browser supports third-party cookie.
   */
  recognitionTokenRequested?: boolean;
};

export type DpaCheckoutResponse = {
  /**
   * This is the unique identifier generated by Click to Pay System to track messages.
   */
  srcCorrelationId: string;
  /**
   * A unique id used to track the user journey. This is used for analytics to be able to correlate a single user “session” from button impression to the end of the transaction. This field may be created on the merchant page by the integrator and need to be passed-through to Mastercard network (Click to Pay System). It is passed all the way to the DCFs as well.
   */
  srciTransactionId: string;
  /**
   * Masked card display and status data.
   */
  maskedCard: MaskedCard;
  /**
   * Masked consumer display and status data may be supplied if known to the Click to Pay System.
   * Conditionality: only supplied in case the consumer data was available for the associated card/profile.
   */
  maskedConsumer?: MaskedConsumer;
  /**
   * Unmasked shipping address postal code / ZIP.
   * Conditionality: only supplied in case a shipping address was requested by the merchant.
   */
  shippingAddressZip?: string;
  /**
   * Unmasked shipping address country code.
   * Conditionality: only supplied in case a shipping address was requested by the merchant.
   */
  shippingAddressCountryCode?: string;
};

export type CheckoutResponse = {
  /**
   * The checkoutActionCode will be one of the following:
   * COMPLETE - checkout processing completed normally
   * CANCEL - consumer wishes to cancel the flow.
   * ERROR - an error was detected and the checkout processing cannot continue.
   * CHANGE_CARD - consumer wishes to select an alternative card. You should return them to the Card Selection List.
   * ADD_CARD - Consumer wishes to add a new card. You should show the Cart Input form.
   * SWITCH_CONSUMER - Consumer wishes to change account profile / identity. You should show the Login screen.
   */
  checkoutActionCode:
    | "COMPLETE"
    | "CANCEL"
    | "ERROR"
    | "CHANGE_CARD"
    | "ADD_CARD"
    | "SWITCH_CONSUMER";
  /**
   * Checkout Payload Response is a complex JSON Web Token wrapper object containing following set of attributes.
   * The object may be optionally signed cryptographically by the Click to Pay System.
   * Conditionality: Only supplied when the checkoutActionCode is COMPLETE.
   */
  checkoutResponse?: string;
  /**
   * Existing checkoutResponse JWS will be decoded and the decoded data will be returned alongside the JWS as checkoutResponseData. The structure of the decoded JWS may differ based on the network since it is not guided by EMVCo.
   */
  checkoutResponseData?: DpaCheckoutResponse;
  /**
   * ID Token obtained by DCF during checkout session.
   * Conditionality: Only supplied if obtained by the DCF during its processing of the checkout session (e.g. DCF requesting identity validation on the SRC System).
   */
  idToken?: string;
  /**
   * The payment network used for the transaction.
   * Conditionality: Only supplied when the checkoutActionCode is COMPLETE.
   */
  network?: string;
  /**
   * Dictionary containing header fields which you will use as headers in your POST /checkout request calls.
   * Conditionality: Only supplied when the checkoutActionCode is COMPLETE.
   */
  headers?: Record<string, string>;
  /**
   * A JWT containing the recognition token. Conditionality: Present if a cardholder opts-in through Remember Me checkbox.
   */
  recognitionToken?: string;
};

export type Click2PayLookupOptions =
  | { email: string }
  | {
      mobileNumber: DpaPhoneNumber;
    };

export type Click2PayAuthenticateOptions = {
  /**
   * Populating supported validation channel with Not you subheader and resend code links.
   * @default false
   */
  loadSupportedValidationChannels?: boolean;
  /**
   * Emitted when the user click on Not you? link
   * Recommended: Close the OTP element and show email or phone input component to let the user change the identity
   * to do another lookup.
   */
  notYouRequestedCallback?: (options: { close: () => void }) => void;
};

export type Click2PayAuthenticateResult =
  | {
      /**
       * The user closed the OTP element without completing authentication.
       */
      action: "CLOSED";
    }
  | {
      /**
       * The user successfully completed authentication and selected one of their cards.
       */
      action: "AUTHENTICATED";
      /**
       * The list of masked cards available to the user after successful authentication.
       */
      maskedCards: MaskedCard[];
    };

export type Click2PaySignOutResponse =
  | {
      /**
       * Returns false if unbind is successful, else returns true.
       */
      recognized: false;
    }
  | {
      /**
       * Returns true if unbind is unsuccessful, else returns false.
       */
      recognized: true;
      /**
       * If unbind is unsuccessful, returns MaskedCards present in recognized user profile.
       */
      cards: MaskedCard[];
    };
