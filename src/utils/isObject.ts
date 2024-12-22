/**
 * Checks if the given variable is a plain object ({}).
 * @param value - The variable to check.
 * @returns True if the variable is a plain object; otherwise, false.
 */
export default function isPlainObject(
  value: unknown,
): value is Record<PropertyKey, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
