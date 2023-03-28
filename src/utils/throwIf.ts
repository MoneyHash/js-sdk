export default function throwIf(shouldThrow: boolean, message: string): void {
  if (shouldThrow) {
    throw new Error(message);
  }
}
