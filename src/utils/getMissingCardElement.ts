import { ElementType } from "../types/standaloneFields";

export default function getMissingCardElement(
  mountedElements: Array<ElementType>,
) {
  const allElements: Array<ElementType> = [
    "cardHolderName",
    "cardNumber",
    "cardCvv",
    "cardExpiryMonth",
    "cardExpiryYear",
  ];

  // eslint-disable-next-line no-restricted-syntax
  for (const element of allElements) {
    if (!mountedElements.includes(element)) {
      return element;
    }
  }

  return null;
}
