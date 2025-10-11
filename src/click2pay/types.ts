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
};
