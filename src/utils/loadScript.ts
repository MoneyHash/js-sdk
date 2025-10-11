class ScriptLoadError extends Error {
  reason: string;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.reason = "SCRIPT_LOAD_ERROR";
  }
}

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
      reject(new ScriptLoadError("Script failed to load"));
    });
    document.body.appendChild(script);
  });
}
