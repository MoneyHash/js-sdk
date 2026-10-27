import { defineConfig } from "vite";

const umdBuilds = {
  INDEX: { entry: { index: "./src/index.ts" }, name: "MoneyHash" },
  HEADLESS: {
    entry: { headlessMoneyHash: "./src/headlessMoneyHash.ts" },
    name: "MoneyHash",
  },
  CHAT_WIDGET: {
    entry: { "chat-widget": "./src/chatWidget/index.ts" },
    name: "MoneyHashChatWidget",
  },
};

const umdBuild =
  umdBuilds[process.env.UMD as keyof typeof umdBuilds] ?? umdBuilds.INDEX;

export default defineConfig({
  build: {
    lib: {
      entry: umdBuild.entry,
      name: umdBuild.name,
      fileName: (ext, entry) => `${entry}.${ext}.js`,
      formats: ["iife"],
    },
    emptyOutDir: false,
    rollupOptions: {},
    target: "es2015",
  },
  define: {
    SDK_VERSION: JSON.stringify(`js@${process.env.npm_package_version}`),
  },
});
