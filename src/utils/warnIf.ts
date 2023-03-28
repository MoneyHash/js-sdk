export default function warnIf(shouldThrow: boolean, message: string): void {
  if (shouldThrow) {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}
