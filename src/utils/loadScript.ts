export default function loadScript(src: string, id: string) {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id);
    if (existingScript) {
      resolve(undefined);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.id = id;
    script.addEventListener("load", () => {
      resolve(undefined);
    });
    script.addEventListener("error", () => {
      reject(new Error("Script failed to load"));
    });
    document.body.appendChild(script);
  });
}
