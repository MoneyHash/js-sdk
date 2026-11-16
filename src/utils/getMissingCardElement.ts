import { ElementType } from "../types/standaloneFields";

export default function getMissingCardElement(
  mountedElements: Array<ElementType>,
  { skipCvv = false }: { skipCvv?: boolean } = {},
) {
  const requiredElements: Array<ElementType> = [
    "cardNumber",
    ...(skipCvv ? [] : (["cardCvv"] as const)),
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
