export default function waitForSeconds(seconds: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve("done");
    }, seconds * 1000);
  });
}
