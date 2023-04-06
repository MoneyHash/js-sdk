export default function warnIf(shouldWarn: boolean, message: string): void {
  if (shouldWarn) {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}
