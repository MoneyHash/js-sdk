export default function isEmpty(
  value: Array<unknown> | Record<PropertyKey, unknown>,
): boolean {
  const itemsLength = Array.isArray(value)
    ? value.length
    : Object.keys(value).length;

  return itemsLength === 0;
}
