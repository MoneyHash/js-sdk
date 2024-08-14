import { ElementType } from "../types/standaloneFields";

export default function getMissingCardElement(
  mountedElements: Array<ElementType>,
) {
  const requiredElements: Array<ElementType> = [
    "cardNumber",
    "cardCvv",
    "cardExpiryMonth",
    "cardExpiryYear",
  ];

  // eslint-disable-next-line no-restricted-syntax
  for (const element of requiredElements) {
    if (!mountedElements.includes(element)) {
      return element;
    }
  }

  return null;
}
