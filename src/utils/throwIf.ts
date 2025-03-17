export default function throwIf(shouldThrow: boolean, message: string): void {
  if (shouldThrow) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw { message, type: "runtime" };
  }
}
